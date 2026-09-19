const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sass = require('sass');
const root = path.resolve(__dirname, '..');
const target = path.join(root, 'content/koha/26.05.03');
const preview = path.join(target, 'preview');
const entries = [
  ['opac', 'koha-tmpl/opac-tmpl/bootstrap/css', 'opac'],
  ['staff', 'koha-tmpl/intranet-tmpl/prog/css', 'staff-global'],
];
const urls = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/g;
const assets = new Set();
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
fs.mkdirSync(preview, { recursive: true });
const pack = process.argv.includes('--pack');
const outputs = {};
for (const [context, directory, name] of entries) {
  const base = path.join(target, directory);
  let css;
  if (!pack) {
    const result = sass.renderSync({
      file: path.join(base, 'src', `${name}.scss`), outputStyle: 'compressed',
      importer: url => url.startsWith('~') ? { file: path.join(root, 'node_modules', url.slice(1)) } : null,
      includePaths: [path.join(root, 'node_modules')],
      logger: { warn(message, options) { if (!options.deprecation) console.warn(message); } },
    });
    css = result.css.toString();
    fs.writeFileSync(path.join(base, `${name}.css`), css);
  } else css = fs.readFileSync(path.join(base, `${name}.css`), 'utf8');
  const previewCss = css.replace(/@font-face\{[^}]*fonts\/poppins-[^}]*\}/g, '');
  const embedded = previewCss.replace(urls, (full, quoted, single, bare) => {
    const url = (quoted ?? single ?? bare).trim();
    if (/^(data:|#)/.test(url)) return full;
    if (/^(?:[a-z]+:|\/\/)/i.test(url)) throw new Error(`External CSS resource: ${url}`);
    const filename = path.resolve(base, url.split(/[?#]/)[0]);
    if (!filename.startsWith(target + path.sep)) throw new Error(`Asset outside Koha: ${url}`);
    const relative = path.relative(target, filename).split(path.sep).join('/');
    assets.add(relative);
    if (!pack) return full;
    const mime = { '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.png': 'image/png', '.gif': 'image/gif', '.jpg': 'image/jpeg' }[path.extname(filename)];
    if (!mime) throw new Error(`Unsupported CSS asset: ${relative}`);
    return `url("data:${mime};base64,${fs.readFileSync(filename).toString('base64')}")`;
  });
  if (pack) {
    fs.writeFileSync(path.join(preview, `${context}.css`), embedded);
    outputs[context] = { bytes: Buffer.byteLength(embedded), sha256: hash(embedded), compiledSha256: hash(css) };
  }
}
fs.writeFileSync(path.join(preview, 'asset-paths.json'), JSON.stringify([...assets].sort(), null, 2) + '\n');
if (pack) {
  for (const [name, directory] of [['bootstrap', 'bootstrap'], ['fontawesome', '@fortawesome/fontawesome-free']]) {
    const packageRoot = path.join(root, 'node_modules', directory);
    const filename = ['LICENSE', 'LICENSE.txt'].find(name => fs.existsSync(path.join(packageRoot, name)));
    if (!filename) throw new Error(`Missing license: ${name}`);
    fs.copyFileSync(path.join(packageRoot, filename), path.join(preview, `LICENSE-${name}.txt`));
  }
  fs.writeFileSync(path.join(preview, 'manifest.json'), JSON.stringify({
    koha: '26.05.03', sass: require('sass').info, bootstrap: require('bootstrap/package.json').version,
    fontawesome: require('@fortawesome/fontawesome-free/package.json').version,
    processing: 'Dart Sass compressed, local asset URLs embedded as data; no autoprefixer or RTL pass. Poppins font-face rules omitted: font files absent from the release archive; standard fallback fonts apply.', outputs,
  }, null, 2) + '\n');
}
console.log(pack ? 'Standalone preview styles generated.' : `${assets.size} asset paths collected; extract them before --pack.`);
