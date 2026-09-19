const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { formatOutput } = vm.runInNewContext(fs.readFileSync('src/preview/format-output.js', 'utf8').replace('export function', 'function') + '\n({ formatOutput })');

test('indentation XML, namespaces, attributs et déclaration préservés', () => {
  const xml = '<?xml version="1.0"?><record xmlns="urn:marc"><datafield tag="200"><subfield code="a">Été &amp; hiver</subfield></datafield></record>';
  assert.equal(formatOutput(xml), '<?xml version="1.0"?>\n<record xmlns="urn:marc">\n  <datafield tag="200">\n    <subfield code="a">Été &amp; hiver</subfield>\n  </datafield>\n</record>');
  assert.equal(formatOutput(formatOutput(xml)), formatOutput(xml));
});
test('fragments HTML Koha et balises vides', () => {
  assert.equal(formatOutput('<h2>Titre</h2><div><span>Auteur</span><br><img src="x"></div>'), '<h2>Titre</h2>\n<div>\n  <span>Auteur</span>\n  <br>\n  <img src="x">\n</div>');
});
test('contenu mixte, espaces significatifs, CDATA et texte inchangés', () => {
  for (const source of ['3', ' Texte seul\n', '<p>Bonjour <b>toi</b> !</p>', '<pre>  a\n b</pre>', '<x xml:space="preserve"><a/> <b/></x>', '<x><![CDATA[a<b]]><y/></x>', '<broken><x></broken>']) {
    assert.equal(formatOutput(source), source);
  }
});
test('commentaires et caractères > dans les attributs', () => {
  assert.equal(formatOutput('<x><!-- note --><a test="1 > 0"/></x>'), '<x>\n  <!-- note -->\n  <a test="1 > 0"/>\n</x>');
});
