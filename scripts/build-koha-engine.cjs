const fs = require('node:fs');
const crypto = require('node:crypto');
const input = 'spike/wasm/experimental/patched.js';
const output = 'src/transformer/vendor/koha-xslt-wasm.js';
const original = fs.readFileSync(input);
const moduleSource = Buffer.concat([original, Buffer.from('\nexport default createXSLTTransformModule;\n')]);
fs.writeFileSync(output, moduleSource);
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
fs.writeFileSync('src/transformer/vendor/manifest.json', JSON.stringify({
  input, inputSha256: hash(original), output, outputSha256: hash(moduleSource), bytes: moduleSource.length,
  upstreamManifest: 'spike/wasm/vendor/manifest.json', buildManifest: 'spike/wasm/experimental/manifest.json',
}, null, 2) + '\n');
console.log('Koha Wasm module and provenance generated.');
