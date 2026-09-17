const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/app/app.js'), 'utf8')
  .replace(/^import .*;\r?\n/gm, '');

function setup() {
  const elements = new Map();
  function element() {
    return {
      value: '', textContent: '', hidden: false, disabled: false,
      options: [{ value: '', textContent: 'Choisir une notice…' }],
      classList: { toggle() {} }, setAttribute() {}, addEventListener() {},
      replaceChildren(...children) { this.options = children; },
    };
  }
  const document = {
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, element());
      return elements.get(selector);
    },
    querySelectorAll() { return []; },
    createElement: element,
    addEventListener() {},
  };
  const context = vm.createContext({
    document,
    window: { confirm: () => true },
    fetch: async (url) => ({
      ok: true,
      json: async () => JSON.parse(fs.readFileSync(path.join(root, url), 'utf8')),
      text: async () => fs.readFileSync(path.join(root, url), 'utf8'),
    }),
    transformSources: () => '<p>Résultat</p>',
  });
  vm.runInContext(source, context);
  document.querySelector('#exercise-select').value = 'ex01-identifier';
  return { context, get: (id) => document.querySelector(`#${id}`) };
}

test('le catalogue affiche exactement trois noms sans extension', async () => {
  const { context, get } = setup();
  await context.loadSampleCatalog();
  assert.deepEqual(Array.from(get('sample-select').options).slice(1).map((o) => o.textContent), [
    'jardin-des-nuages', 'atlas-des-iles-imaginaires', 'cuisine-des-etoiles',
  ]);
  assert.equal(get('sample-select').disabled, false);
});

test('chaque notice remplace le XML, conserve la XSLT et attend une transformation', async () => {
  const { context, get } = setup();
  const xslt = get('xslt-editor').value;
  for (const name of JSON.parse(fs.readFileSync(path.join(root, 'content/samples/index.json')))) {
    get('sample-select').value = name;
    await context.loadSample();
    assert.equal(get('xml-editor').value, fs.readFileSync(path.join(root, 'content/samples', name), 'utf8'));
    assert.equal(get('xslt-editor').value, xslt);
    assert.equal(get('run-status').textContent, 'À transformer');
    assert.equal(get('preview').srcdoc, '');
  }
});

test('annuler préserve le XML saisi et permet de sélectionner à nouveau la notice', async () => {
  const { context, get } = setup();
  get('xml-editor').value = '<record>Mon travail</record>';
  context.window.confirm = () => false;
  get('sample-select').value = 'jardin-des-nuages.xml';
  await context.loadSample();
  assert.equal(get('xml-editor').value, '<record>Mon travail</record>');
  assert.equal(get('sample-select').value, '');
  assert.equal(get('sample-select').disabled, false);
});

test('une erreur HTTP préserve le XML et affiche un message', async () => {
  const { context, get } = setup();
  const xml = get('xml-editor').value;
  context.fetch = async () => ({ ok: false, status: 404 });
  get('sample-select').value = 'absent.xml';
  await context.loadSample();
  assert.equal(get('xml-editor').value, xml);
  assert.match(get('sample-status').textContent, /404/);
  assert.equal(get('sample-select').disabled, false);
});

test('le menu est visible seulement en mode libre', async () => {
  const { context, get } = setup();
  await context.enterMode('free');
  assert.equal(get('sample-picker').hidden, false);
  await context.enterMode('guided');
  assert.equal(get('sample-picker').hidden, true);
});

test('un chargement tardif ne remplace pas la notice du parcours guidé', async () => {
  const { context, get } = setup();
  const originalFetch = context.fetch;
  let finish;
  context.fetch = () => new Promise((resolve) => { finish = resolve; });
  get('sample-select').value = 'jardin-des-nuages.xml';
  const pending = context.loadSample();
  context.fetch = originalFetch;
  await context.enterMode('guided');
  const exerciseXml = get('xml-editor').value;
  finish({ ok: true, text: async () => '<record>Notice tardive</record>' });
  await pending;
  assert.equal(get('xml-editor').value, exerciseXml);
});

test('les modifications effectuées pendant le chargement déclenchent la confirmation', async () => {
  const { context, get } = setup();
  let finish;
  context.fetch = () => new Promise((resolve) => { finish = resolve; });
  get('sample-select').value = 'jardin-des-nuages.xml';
  const pending = context.loadSample();
  get('xml-editor').value = 'Saisie pendant le chargement';
  context.window.confirm = () => false;
  finish({ ok: true, text: async () => '<record />' });
  await pending;
  assert.equal(get('xml-editor').value, 'Saisie pendant le chargement');
});
