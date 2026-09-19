const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright-core');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/koha-xslt-lab\//, '/');
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (error, data) => {
    if (error) return res.writeHead(404).end();
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.xml': 'application/xml', '.xsl': 'application/xml' })[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ['--disable-blink-features=XSLT'], executablePath: process.env.BROWSER_EXECUTABLE });
    for (const prefix of ['', '/koha-xslt-lab']) {
      const page = await browser.newPage();
      const errors = [], external = [];
      const origin = `http://127.0.0.1:${server.address().port}`;
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (new URL(request.url()).origin !== origin) external.push(request.url()); });
      await page.goto(origin + prefix + '/');
      assert.equal(await page.evaluate(() => typeof XSLTProcessor), 'undefined');
      await page.locator('#choose-koha-mode').click();
      const waitResult = async () => {
        await page.waitForFunction(() => ['Transformé', 'Échec'].includes(document.querySelector('#run-status').textContent));
        assert.equal(await page.locator('#run-status').textContent(), 'Transformé', await page.locator('#errors-output').textContent());
      };
      await waitResult();
      assert.equal(await page.locator('#xslt-editor-card').isVisible(), false);
      assert.equal(await page.locator('#exercise-strip').isVisible(), false);
      assert.deepEqual(await page.locator('#koha-style-select option').allTextContents(), ['Détail OPAC', 'Liste OPAC', 'Détail interface pro', 'Liste interface pro']);
      const samples = JSON.parse(fs.readFileSync(path.join(root, 'content/samples/index.json')));
      const authors = ['Brume', 'Rivage', 'Comète'];
      for (const [index, sample] of samples.entries()) {
        await page.locator('#sample-select').selectOption(sample);
        await page.waitForFunction(() => document.querySelector('#run-status').textContent === 'À transformer');
        for (const style of ['opac-detail', 'opac-list', 'staff-detail', 'staff-list']) {
          if (await page.locator('#koha-style-select').inputValue() === style) await page.locator('#transform-button').click();
          else await page.locator('#koha-style-select').selectOption(style);
          await waitResult();
          const frame = page.frameLocator('#preview');
          const context = style.startsWith('opac') ? 'opac' : 'staff';
          await frame.locator(`style[data-context="${context}"]`).waitFor({ state: 'attached' });
          const summary = frame.locator('.results_summary').first();
          await summary.waitFor();
          assert.equal(await summary.evaluate(el => getComputedStyle(el).display), 'block');
          assert.equal(await summary.evaluate(el => getComputedStyle(el).color), 'rgb(32, 32, 32)');
          assert.equal(await page.locator('#preview').getAttribute('sandbox'), '');
          assert.doesNotMatch(await page.locator('#html-output').textContent(), /koha-standard-styles/);
          assert.match(await page.locator('#html-output').textContent(), /\n  +</, `Indented output for ${style}`);
          if (index === 0 && !prefix) {
            fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
            await page.locator('#preview').screenshot({ path: path.join(root, `test-results/koha-${style}.png`) });
          }
          assert.match(await page.locator('#html-output').textContent(), new RegExp(authors[index]));
          assert.equal(await page.locator('#sample-select').inputValue(), sample);
          assert.equal(await page.locator('#koha-style-select').inputValue(), style);
        }
      }
      await page.locator('[data-tab="html-panel"]').click();
      await page.locator('#html-output .syntax-tag').first().waitFor();
      const xml = page.getByRole('textbox', { name: 'Éditeur MARCXML', exact: true });
      await xml.fill('<broken>');
      await page.locator('#transform-button').click();
      await page.waitForFunction(() => document.querySelector('#run-status').textContent === 'Échec');
      assert.equal(await page.locator('[data-tab="errors-panel"]').evaluate(el => el === document.activeElement), true);
      await xml.fill(fs.readFileSync(path.join(root, 'content/samples', samples[0]), 'utf8'));
      await page.locator('#transform-button').click();
      await waitResult();
      await xml.fill('<!DOCTYPE record><record/>');
      await page.locator('#transform-button').click();
      await page.waitForFunction(() => document.querySelector('#run-status').textContent === 'Échec');
      assert.match(await page.locator('#errors-output').textContent(), /DOCTYPE/);
      await xml.fill(fs.readFileSync(path.join(root, 'content/samples', samples[0]), 'utf8'));
      await page.context().route('**/UNIMARCslimUtils.xsl', route => route.fulfill({ status: 404, body: 'Missing dependency' }));
      await page.locator('#transform-button').click();
      await page.waitForFunction(() => document.querySelector('#run-status').textContent === 'Échec');
      assert.ok((await page.locator('#errors-output').textContent()).length > 0);
      await page.context().unroute('**/UNIMARCslimUtils.xsl');
      await page.locator('#transform-button').click();
      await waitResult();
      await page.setViewportSize({ width: 390, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      assert.deepEqual(errors, []);
      assert.deepEqual(external, []);
      console.log(`OK ${prefix || '/'}: 12 Koha transformations, hidden XSLT, selections, highlighted output, error recovery, mobile, no native XSLT.`);
      await page.close();
    }
  } finally { if (browser) await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
