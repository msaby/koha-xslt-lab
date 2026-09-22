const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright-core');

const root = path.resolve(__dirname, '..');
const contentTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.xsl': 'application/xml',
};

const server = http.createServer((req, res) => {
  let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/koha-xslt-lab\//, '/');
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (error, data) => {
    if (error) return res.writeHead(404).end();
    res.setHeader('Content-Type', contentTypes[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});

async function waitStatus(page, expected) {
  await page.waitForFunction((value) => document.querySelector('#run-status').textContent === value, expected);
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=XSLT'],
      ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
    });
    const origin = `http://127.0.0.1:${server.address().port}`;
    for (const prefix of ['', '/koha-xslt-lab']) {
      const page = await browser.newPage();
      const errors = [];
      const external = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => {
        if (new URL(request.url()).origin !== origin) external.push(request.url());
      });
      await page.goto(origin + prefix + '/');
      assert.equal(await page.evaluate(() => typeof XSLTProcessor), 'undefined');
      await page.locator('#choose-free-mode').click();
      await waitStatus(page, 'Transformé');
      const xmlEditor = page.getByRole('textbox', { name: 'Éditeur MARCXML', exact: true });
      const xsltEditor = page.getByRole('textbox', { name: 'Éditeur XSLT', exact: true });
      const runAndRead = async () => {
        await page.locator('#transform-button').click();
        await page.waitForFunction(() => ['Transformé', 'Échec'].includes(document.querySelector('#run-status').textContent));
        return {
          status: await page.locator('#run-status').textContent(),
          html: await page.locator('#html-output').textContent(),
          error: await page.locator('#errors-output').textContent(),
        };
      };

      await xmlEditor.fill('<root><item>A</item><item>B</item></root>');
      await xsltEditor.fill(`<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="@*|node()"><xsl:copy><xsl:apply-templates select="@*|node()"/></xsl:copy></xsl:template>
</xsl:stylesheet>`);
      let result = await runAndRead();
      assert.equal(result.status, 'Transformé', result.error);
      assert.match(result.html, /<root>/);

      await xsltEditor.fill(`<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html"/>
  <xsl:template match="/"><article><h2><xsl:value-of select="count(/root/item)"/></h2></article></xsl:template>
</xsl:stylesheet>`);
      result = await runAndRead();
      assert.equal(result.status, 'Transformé', result.error);
      assert.match(result.html, /<article>/);
      assert.match(result.html, />2</);

      await xsltEditor.fill(`<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="text"/>
  <xsl:template match="/">Texte OK</xsl:template>
</xsl:stylesheet>`);
      result = await runAndRead();
      assert.equal(result.status, 'Transformé', result.error);
      assert.match(result.html, /Texte OK/);

      await xmlEditor.fill('<broken>');
      result = await runAndRead();
      assert.equal(result.status, 'Échec');
      assert.match(result.error, /XML invalide/);

      await xmlEditor.fill(fs.readFileSync(path.join(root, 'spike/wasm/fixtures/author-parameter/notice.xml'), 'utf8'));
      await xsltEditor.fill('<xsl:stylesheet');
      result = await runAndRead();
      assert.equal(result.status, 'Échec');
      assert.match(result.error, /XML invalide/);

      const importedTemplateUrl = `${origin}${prefix}/spike/wasm/fixtures/author-parameter/templates.xsl`;
      await xsltEditor.fill(
        fs.readFileSync(path.join(root, 'spike/wasm/fixtures/author-parameter/main.xsl'), 'utf8')
          .replace('href="templates.xsl"', `href="${importedTemplateUrl}"`)
      );
      result = await runAndRead();
      assert.equal(result.status, 'Transformé', result.error);
      assert.match(result.html, /case id="imported-fragment"/);
      assert.match(result.html, /parameter="700"/);

      const importedBaseUrl = `${origin}${prefix}/spike/wasm/fixtures/import/base.xsl`;
      await xsltEditor.fill(
        fs.readFileSync(path.join(root, 'spike/wasm/fixtures/import/main.xsl'), 'utf8')
          .replace('href="base.xsl"', `href="${importedBaseUrl}"`)
      );
      result = await runAndRead();
      assert.equal(result.status, 'Transformé', result.error);
      assert.match(result.html, /<override>/);
      assert.match(result.html, /dépendance imbriquée/);

      await xsltEditor.fill(`<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:import href="${importedBaseUrl}"/>
  <xsl:template match="/"><xsl:apply-templates select="*"/></xsl:template>
  <xsl:template match="*"><local/></xsl:template>
</xsl:stylesheet>`);
      result = await runAndRead();
      assert.equal(result.status, 'Transformé', result.error);
      assert.match(result.html, /<local\/>/);

      await xsltEditor.fill(`<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:include href="${origin}${prefix}/spike/wasm/fixtures/import/missing.xsl"/>
  <xsl:template match="/"><ok/></xsl:template>
</xsl:stylesheet>`);
      result = await runAndRead();
      assert.equal(result.status, 'Échec');
      assert.match(result.error, /Ressource inaccessible|inaccessible|load/i);
      await xsltEditor.fill(`<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/"><recovery/></xsl:template>
</xsl:stylesheet>`);
      result = await runAndRead();
      assert.equal(result.status, 'Transformé', result.error);
      assert.match(result.html, /<recovery\/>/);

      const slowPath = `${origin}${prefix}/tests/slow-import.xsl`;
      await page.route('**/tests/slow-import.xsl', async route => {
        await new Promise(resolve => setTimeout(resolve, 20000));
        await route.fulfill({
          status: 200,
          contentType: 'application/xml',
          body: '<?xml version="1.0"?><xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"><xsl:template name="slow">ok</xsl:template></xsl:stylesheet>'
        });
      });
      await xsltEditor.fill(`<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:include href="${slowPath}"/>
  <xsl:template match="/"><xsl:call-template name="slow"/></xsl:template>
</xsl:stylesheet>`);
      result = await runAndRead();
      assert.equal(result.status, 'Échec');
      assert.match(result.error, /15 secondes/);

      await xsltEditor.fill(`<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:include href="${slowPath}"/>
  <xsl:template match="/"><xsl:call-template name="slow"/></xsl:template>
</xsl:stylesheet>`);
      await page.locator('#transform-button').click();
      await page.waitForFunction(() => document.querySelector('#run-status').textContent === 'Transformation...');
      const cancelStart = Date.now();
      await xsltEditor.fill(`<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/"><cancelled/></xsl:template>
</xsl:stylesheet>`);
      await xsltEditor.press('Control+Enter');
      await waitStatus(page, 'Transformé');
      assert.ok(Date.now() - cancelStart < 12000, 'Annulation sur nouvelle transformation attendue');
      assert.match(await page.locator('#html-output').textContent(), /<cancelled\/>/);

      await xsltEditor.fill(`<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:include href="${slowPath}"/>
  <xsl:template match="/"><xsl:call-template name="slow"/></xsl:template>
</xsl:stylesheet>`);
      await page.locator('#transform-button').click();
      await page.waitForFunction(() => document.querySelector('#run-status').textContent === 'Transformation...');
      const switchStart = Date.now();
      await page.locator('#guided-mode-button').click();
      await waitStatus(page, 'Transformé');
      assert.ok(Date.now() - switchStart < 14000, 'Annulation au changement de mode attendue');
      await page.unroute('**/tests/slow-import.xsl');

      await page.locator('#koha-mode-button').click();
      await waitStatus(page, 'Transformé');
      assert.equal(await page.locator('#xslt-editor-card').isVisible(), false);
      await page.locator('#free-mode-button').click();
      await waitStatus(page, 'Transformé');
      assert.equal(await page.locator('#koha-style-picker').isVisible(), false);
      assert.deepEqual(errors, []);
      assert.deepEqual(external, []);
      console.log(`OK ${prefix || '/'}: moteur Wasm commun validé (libre/guidé/Koha, erreurs, imports, annulation, délai, sous-chemin).`);
      await page.close();
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
