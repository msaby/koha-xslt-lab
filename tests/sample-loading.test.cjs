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
      children: [], attributes: {}, listeners: {},
      value: '', textContent: '', hidden: false, disabled: false,
      options: [{ value: '', textContent: 'Choisir une notice…' }],
      classList: { toggle() {} },
      setAttribute(name, value) { this.attributes[name] = value; },
      addEventListener(name, callback) { this.listeners[name] = callback; },
      append(...children) { this.children.push(...children); },
      focus() { document.activeElement = this; },
      contains(target) { return this === target || this.children.some((child) => child.contains(target)); },
      replaceChildren(...children) { this.options = children; this.children = children; },
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
  return { context, xsltExample: vm.runInContext('xsltExample', context), get: (id) => document.querySelector(`#${id}`) };
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
    assert.equal(get('sample-select').value, name);
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
  assert.equal(get('xslt-sample-picker').hidden, false);
  await context.enterMode('guided');
  assert.equal(get('sample-picker').hidden, true);
  assert.equal(get('xslt-sample-picker').hidden, true);
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

test('le catalogue XSLT affiche quatre noms sans extension', async () => {
  const { context, get, xsltExample } = setup();
  await context.loadSampleCatalog(xsltExample);
  assert.deepEqual(Array.from(get('xslt-sample-select').options).slice(1).map((o) => o.textContent), [
    'identite', 'titre-auteur', 'titre-sous-titres', 'tous-les-champs',
  ]);
});

test('les descriptions sont visibles avant le choix et persistent après le chargement', async () => {
  const { context, get, xsltExample } = setup();
  const original = get('xslt-editor').value;
  await context.loadSampleCatalog(xsltExample);
  context.closeXsltMenu();
  get('xslt-sample-toggle').listeners.click();
  assert.equal(get('xslt-sample-options').hidden, false);
  const buttons = get('xslt-sample-options').children.map((item) => item.children[0]);
  assert.equal(buttons.length, 4);
  for (const button of buttons) assert.ok(button.children[1].textContent.length > 20);
  assert.equal(get('xslt-editor').value, original);
  await buttons[0].listeners.click();
  assert.equal(get('xslt-sample-options').hidden, true);
  assert.equal(get('xslt-sample-toggle').textContent, 'identite');
  assert.equal(get('xslt-sample-description').textContent, buttons[0].children[1].textContent);
  assert.equal(buttons[0].attributes['aria-current'], 'true');
});

test('annuler un choix conserve le nom et la description précédents', async () => {
  const { context, get, xsltExample } = setup();
  await context.loadSampleCatalog(xsltExample);
  const buttons = get('xslt-sample-options').children.map((item) => item.children[0]);
  await buttons[0].listeners.click();
  const description = get('xslt-sample-description').textContent;
  get('xslt-editor').value += '\n<!-- modification -->';
  context.window.confirm = () => false;
  await buttons[1].listeners.click();
  assert.equal(get('xslt-sample-toggle').textContent, 'identite');
  assert.equal(get('xslt-sample-description').textContent, description);
  assert.equal(buttons[1].attributes['aria-current'], 'false');
});

test('Échap ferme la liste et restitue le focus sans charger de feuille', async () => {
  const { context, get, xsltExample } = setup();
  await context.loadSampleCatalog(xsltExample);
  context.closeXsltMenu();
  const original = get('xslt-editor').value;
  get('xslt-sample-toggle').listeners.click();
  let prevented = false;
  get('xslt-sample-picker').listeners.keydown({ key: 'Escape', preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(get('xslt-sample-options').hidden, true);
  assert.equal(get('xslt-sample-toggle').attributes['aria-expanded'], 'false');
  assert.equal(context.document.activeElement, get('xslt-sample-toggle'));
  assert.equal(get('xslt-editor').value, original);
});

test('chaque XSLT remplace la feuille sans modifier le XML ni transformer', async () => {
  const { context, get, xsltExample } = setup();
  const xml = get('xml-editor').value;
  context.transformSources = () => { throw new Error('Transformation non demandée'); };
  for (const name of JSON.parse(fs.readFileSync(path.join(root, 'content/xslt/samples/index.json')))) {
    get('xslt-sample-select').value = name;
    await context.loadSample(xsltExample);
    assert.equal(get('xslt-sample-select').value, name);
    assert.equal(get('xslt-editor').value, fs.readFileSync(path.join(root, 'content/xslt/samples', name), 'utf8'));
    assert.equal(get('xml-editor').value, xml);
    assert.equal(get('run-status').textContent, 'À transformer');
  }
});

test('annuler puis confirmer protège la XSLT modifiée', async () => {
  const { context, get, xsltExample } = setup();
  get('xslt-editor').value = 'Ma feuille modifiée';
  context.window.confirm = () => false;
  get('xslt-sample-select').value = 'identite.xsl';
  await context.loadSample(xsltExample);
  assert.equal(get('xslt-editor').value, 'Ma feuille modifiée');
  assert.equal(get('xslt-sample-select').value, '');
  context.window.confirm = () => true;
  get('xslt-sample-select').value = 'identite.xsl';
  await context.loadSample(xsltExample);
  assert.match(get('xslt-editor').value, /xsl:copy/);
});

test('une erreur de chargement XSLT conserve les deux sources', async () => {
  const { context, get, xsltExample } = setup();
  const xml = get('xml-editor').value;
  const xslt = get('xslt-editor').value;
  context.fetch = async () => ({ ok: false, status: 404 });
  get('xslt-sample-select').value = 'absent.xsl';
  await context.loadSample(xsltExample);
  assert.equal(get('xml-editor').value, xml);
  assert.equal(get('xslt-editor').value, xslt);
  assert.match(get('xslt-sample-status').textContent, /404/);
  assert.equal(get('xslt-sample-select').disabled, false);
});

test('la XSLT reçue après passage au parcours guidé est ignorée', async () => {
  const { context, get, xsltExample } = setup();
  const originalFetch = context.fetch;
  let finish;
  context.fetch = () => new Promise((resolve) => { finish = resolve; });
  get('xslt-sample-select').value = 'identite.xsl';
  const pending = context.loadSample(xsltExample);
  context.fetch = originalFetch;
  await context.enterMode('guided');
  const exerciseXslt = get('xslt-editor').value;
  finish({ ok: true, text: async () => 'Feuille tardive' });
  await pending;
  assert.equal(get('xslt-editor').value, exerciseXslt);
  assert.equal(get('xslt-sample-select').value, '');
});

for (const kind of ['xml', 'xslt']) {
  test(`${kind} : annulation et erreur rétablissent la dernière sélection chargée`, async () => {
    const { context, get, xsltExample } = setup();
    const example = kind === 'xslt' ? xsltExample : undefined;
    const select = get(kind === 'xslt' ? 'xslt-sample-select' : 'sample-select');
    const editor = get(kind === 'xslt' ? 'xslt-editor' : 'xml-editor');
    const first = kind === 'xslt' ? 'identite.xsl' : 'jardin-des-nuages.xml';
    const second = kind === 'xslt' ? 'titre-auteur.xsl' : 'cuisine-des-etoiles.xml';
    select.value = first;
    await context.loadSample(example);
    editor.value += '\n<!-- modification -->';
    const edited = editor.value;
    context.window.confirm = () => false;
    select.value = second;
    await context.loadSample(example);
    assert.equal(select.value, first);
    assert.equal(editor.value, edited);
    context.fetch = async () => ({ ok: false, status: 404 });
    select.value = second;
    await context.loadSample(example);
    assert.equal(select.value, first);
    assert.equal(editor.value, edited);
  });
}
