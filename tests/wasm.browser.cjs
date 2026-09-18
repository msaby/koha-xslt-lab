const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright-core');
const root = path.resolve(__dirname, '..');
const variant = process.env.WASM_VARIANT || 'vendor';
assert.ok(['vendor', 'original', 'patched'].includes(variant));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.xsl': 'application/xml', '.xml': 'application/xml' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/koha-xslt-lab\//, '/');
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  let failures = 0;
  try {
    browser = await chromium.launch({ headless: true, args: ['--disable-blink-features=XSLT'],
      ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
    for (const prefix of ['', '/koha-xslt-lab']) {
      const page = await browser.newPage();
      const errors = [], external = [];
      const origin = `http://127.0.0.1:${server.address().port}`;
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route => {
        if (new URL(route.request().url()).origin !== origin) { external.push(route.request().url()); return route.abort(); }
        if (variant === 'original' && route.request().url().endsWith('/vendor/xslt-polyfill.min.js')) {
          return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(root, `spike/wasm/experimental/${variant}.js`)) });
        }
        return route.continue();
      });
      await page.goto(`${origin}${prefix}/spike/wasm/${variant === 'patched' ? 'patched' : 'index'}.html`);
      const deadline = Date.now() + 90000;
      while (!(await page.evaluate(() => Boolean(window.wasmReport)))) {
        if (Date.now() > deadline) throw new Error(`Timeout: ${errors.join('; ')}`);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      const report = await page.evaluate(() => window.wasmReport);
      report.browser = browser.version(); report.pageErrors = errors; report.externalRequests = external;
      report.variant = variant;
      fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
      fs.writeFileSync(path.join(root, `test-results/wasm${variant === 'vendor' ? '' : '-' + variant}${prefix ? '-subpath' : ''}.json`), JSON.stringify(report, null, 2));
      console.log(JSON.stringify({ prefix, passed: report.passed, failed: report.failed, probe: report.probe, errors, failures: report.cases.filter(c => !c.passed), fatal: report.errors }, null, 2));
      assert.equal(report.probe.nativeAvailable, false, 'Native XSLT must be disabled');
      assert.ok(report.probe.wasmCompilations > 0, 'Real WebAssembly compilation required');
      failures += report.failed;
      assert.equal(report.cases.length, 42);
      assert.deepEqual(errors, []);
      assert.deepEqual(external, []);
      await page.close();
    }
    assert.equal(failures, variant === 'original' ? 14 : 0, 'Comparison failures: see both reports in test-results');
  } finally { if (browser) await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
