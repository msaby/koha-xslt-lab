const fs = require('node:fs');
const crypto = require('node:crypto');
const input = 'spike/wasm/vendor/xslt-polyfill.min.js';
const output = 'src/transformer/vendor/koha-xslt-wasm.js';
const original = fs.readFileSync(input);
const source = original.toString('utf8');
const boundary = '();"object"==typeof exports&&"object"==typeof module?';
const end = source.indexOf(boundary);
if (end < 0 || !source.slice(0, end).includes('var createXSLTTransformModule=')) {
  throw new Error('Upstream bundle layout changed; review the Wasm factory extraction.');
}
const moduleSource = Buffer.from(source.slice(0, end + 3) + '\nexport default createXSLTTransformModule;\n');
fs.writeFileSync(output, moduleSource);
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
fs.writeFileSync('src/transformer/vendor/manifest.json', JSON.stringify({
  input, inputSha256: hash(original), output, outputSha256: hash(moduleSource), bytes: moduleSource.length,
  upstreamManifest: 'spike/wasm/vendor/manifest.json',
}, null, 2) + '\n');
console.log('Koha Wasm module and provenance generated.');
