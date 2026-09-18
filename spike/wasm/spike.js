import { ready, transform } from './engine.js';

const root = new URL('../../', location.href);
const report = { cases: [], errors: [] };
const read = async (path) => {
  const response = await fetch(new URL(path, root));
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.text();
};

// XML preserves text, comments, processing instructions and child order.
// HTML ignores serialization indentation and attribute order, not element order.
function canonical(text, method) {
  if (method === 'text') return text;
  const html = method === 'html';
  const source = html ? text : `<comparison>${text.replace(/^\s*<\?xml[^?]*\?>/, '')}</comparison>`;
  const doc = new DOMParser().parseFromString(source, html ? 'text/html' : 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('Résultat XML invalide');
  if (!html) for (const child of Array.from(doc.documentElement.childNodes)) {
    // Whitespace outside the result's document element is serialization only.
    if (child.nodeType === 3 && !child.nodeValue.trim()) child.remove();
  }
  function node(n) {
    if (n.nodeType === 3) {
      const value = html ? n.nodeValue.replace(/\s+/g, ' ').trim() : n.nodeValue;
      return html && !value ? null : ['text', value];
    }
    if (n.nodeType === 1) return [n.namespaceURI, n.localName,
      Array.from(n.attributes, a => [a.namespaceURI, a.localName, a.value]).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
      Array.from(n.childNodes, node).filter(n => n !== null)];
    return [n.nodeType, n.nodeName, n.nodeValue];
  }
  return JSON.stringify(node(doc.documentElement));
}

async function check(name, action) {
  const start = performance.now();
  const result = { name, passed: true };
  try { await action(); } catch (error) { result.passed = false; result.error = error.message; }
  result.ms = Math.round(performance.now() - start);
  report.cases.push(result);
  const row = document.createElement('tr');
  row.className = result.passed ? 'pass' : 'fail';
  for (const value of [name, result.passed ? 'OK' : 'ÉCHEC', `${result.ms} ms`, result.error || '']) {
    const cell = document.createElement('td'); cell.textContent = value; row.append(cell);
  }
  document.querySelector('#results').append(row);
}

try {
  const start = performance.now();
  await ready();
  report.initializationMs = Math.round(performance.now() - start);
  document.querySelector('#engine-status').textContent = 'libxslt WebAssembly actif — transformations asynchrones locales';
  const reference = JSON.parse(await read('spike/wasm/reference.json'));
  report.reference = reference.reference;
  for (const test of reference.cases) {
    await check(`${test.xml.split('/').pop()} → ${test.xsl}`, async () => {
      const [xml, xsl] = await Promise.all([read(test.xml), read(test.xsl)]);
      const result = await transform(xml, xsl, new URL(test.xsl, root).href);
      if (test.xsl.includes('/author-parameter/')) {
        report.authorParameter = { actual: result.content, expected: test.expected };
      }
      if (canonical(result.content, test.method) !== canonical(test.expected, test.method)) {
        const actual = canonical(result.content, test.method), expected = canonical(test.expected, test.method);
        let at = 0; while (actual[at] === expected[at] && at < actual.length) at++;
        throw new Error(`Différence à ${at}: obtenu ${actual.slice(Math.max(0, at - 100), at + 250)} ; attendu ${expected.slice(Math.max(0, at - 100), at + 250)}`);
      }
    });
  }
  const identityPath = 'content/xslt/samples/identite.xsl';
  const identity = await read(identityPath);
  for (const [label, xml, xsl] of [
    ['XML mal formé', '<broken>', identity],
    ['XSLT mal formée', '<root/>', '<broken>'],
    ['XSLT invalide', '<root/>', '<root/>'],
  ]) await check(label, async () => {
    let failed = false;
    try { await transform(xml, xsl, new URL(identityPath, root).href); } catch { failed = true; }
    if (!failed) throw new Error('Une erreur était attendue');
  });
  await check('Reprise après erreur et appels simultanés', async () => {
    const results = await Promise.all(['a', 'b'].map(name => transform(`<${name}/>`, identity, new URL(identityPath, root).href)));
    for (const [i, name] of ['a', 'b'].entries()) if (canonical(results[i].content, 'xml') !== canonical(`<${name}/>`, 'xml')) throw new Error('Résultat incorrect');
  });
  await check('Le JavaScript du résultat reste inerte', async () => {
    if (window.__xsltScriptExecuted) throw new Error('Script exécuté');
  });
} catch (error) { report.errors.push(error.message); }
report.probe = window.wasmProbe;
report.passed = report.cases.filter(c => c.passed).length;
report.failed = report.cases.length - report.passed + report.errors.length;
document.querySelector('#summary').textContent = `${report.passed}/${report.cases.length} tests réussis ; ${report.failed} échec(s).`;
document.querySelector('#report').textContent = JSON.stringify(report, null, 2);
window.wasmReport = report;
