const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=XSLT'],
    ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
  });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();
    const errors = [];
    const externalRequests = [];
    const base = process.env.LAB_URL || 'http://127.0.0.1:8000/';
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== new URL(base).origin) externalRequests.push(request.url());
    });
    await page.goto(base);
    assert.equal(await page.evaluate(() => typeof XSLTProcessor), 'undefined');
    await page.locator('#choose-free-mode').click();
    await page.waitForFunction(() => document.querySelector('#run-status').textContent === 'Transformé');
    const xml = page.getByRole('textbox', { name: 'Éditeur MARCXML', exact: true });
    const xslt = page.getByRole('textbox', { name: 'Éditeur XSLT', exact: true });
    for (const id of ['xml-editor', 'xslt-editor']) {
      await page.locator(`#${id} .syntax-tag`).first().waitFor();
      const colors = await page.locator(`#${id}`).evaluate((host) =>
        ['syntax-tag', 'syntax-attribute', 'syntax-value', 'syntax-comment'].map((name) =>
          getComputedStyle(host.querySelector(`.${name}`)).color));
      assert.equal(new Set(colors).size, 4, `${id}: distinct syntax colors`);
      assert.ok(await page.locator(`#${id} .cm-lineNumbers .cm-gutterElement`).count() > 2);
    }
    console.log('OK: both free-mode editors have highlighting and line numbers.');

    await page.locator('[data-tab="html-panel"]').click();
    await page.locator('#html-output .syntax-tag').first().waitFor();
    const outputColors = await page.locator('#html-output').evaluate(host =>
      ['syntax-tag', 'syntax-attribute', 'syntax-value', 'syntax-comment'].map(name => getComputedStyle(host.querySelector(`.${name}`)).color));
    assert.equal(new Set(outputColors).size, 4);
    await page.locator('#html-output').focus();
    await page.locator('#html-output').evaluate(host => {
      const range = document.createRange();
      range.selectNodeContents(host);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });
    await page.keyboard.press('Control+c');
    // Windows converts clipboard line endings to CRLF.
    assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n'), await page.locator('#html-output').textContent());
    const inert = await page.evaluate(async () => {
      const { renderXmlOutput } = await import('./src/editor/xml-editor.bundle.js');
      const host = document.createElement('pre');
      const source = '<p onclick="alert(1)">Été &amp; café</p><script>window.outputExecuted = true</script>';
      renderXmlOutput(host, source);
      return { exact: host.textContent === source, unsafeElements: host.querySelectorAll('script,p,[onclick]').length };
    });
    assert.deepEqual(inert, { exact: true, unsafeElements: 0 });
    console.log('OK: generated output is highlighted, copied exactly and rendered as inert text.');

    const copiedXml = '<?xml version="1.0"?><record xmlns="http://www.loc.gov/MARC21/slim"><!-- test --><controlfield tag="001">COLLÉ &amp; édité</controlfield></record>';
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.evaluate((text) => navigator.clipboard.writeText(text), copiedXml);
    await xml.click();
    await xml.press('Control+a');
    await xml.press('Control+v');
    await page.waitForFunction(() => document.querySelector('#xml-editor .cm-content').textContent.includes('COLLÉ'));
    await xml.press('Control+Enter');
    await page.waitForFunction(() => document.querySelector('#html-output').textContent.includes('COLLÉ'));
    assert.match(await page.locator('#html-output').textContent(), /COLLÉ &amp; édité/);
    await xml.press('Control+z');
    await xml.press('Control+Enter');
    await page.waitForFunction(() => document.querySelector('#html-output').textContent.includes('Le jardin des nuages'));
    console.log('OK: clipboard paste, undo and Ctrl+Enter use the actual edited XML.');

    await xslt.fill('<xsl:stylesheet');
    await xslt.press('Control+Enter');
    await page.waitForFunction(() => document.querySelector('[data-tab="errors-panel"]').getAttribute('aria-selected') === 'true');
    assert.equal(await page.locator('[data-tab="errors-panel"]').evaluate((el) => el === document.activeElement), true);
    assert.ok((await page.locator('#errors-output').textContent()).length > 20);
    console.log('OK: malformed XSLT still opens and focuses Errors.');

    await page.locator('#guided-mode-button').click();
    await page.waitForFunction(() => document.querySelector('#run-status').textContent === 'Transformé');
    const solution = fs.readFileSync(path.join(__dirname, '../content/solutions/ex01/main.xsl'), 'utf8');
    const initialXml = await xml.innerText();
    await page.locator('.solution-help summary').click();
    await page.locator('#use-solution').click();
    assert.equal((await xslt.innerText()).replace(/\r\n/g, '\n'), solution.replace(/\r\n/g, '\n'));
    assert.equal(await xml.innerText(), initialXml);
    assert.equal(await xslt.evaluate((el) => el === document.activeElement), true);
    assert.equal(await page.locator('#run-status').textContent(), 'À transformer');
    await page.locator('#validate-exercise').click();
    assert.equal(await page.locator('#exercise-status').textContent(), "Transformez d'abord les sources.");
    await xslt.press('Control+Enter');
    await page.waitForFunction(() => document.querySelector('#run-status').textContent === 'Transformé');
    await page.locator('#validate-exercise').click();
    assert.equal(await page.locator('#exercise-status').textContent(), 'Exercice réussi.');
    assert.equal(await page.locator('#exercise-select option').nth(1).getAttribute('value'), 'ex-count-datafields');
    await page.locator('#exercise-select').selectOption('ex-count-datafields');
    await page.waitForFunction(() => document.querySelector('#exercise-title').textContent === 'Compter les éléments datafield');
    await page.locator('#use-solution').click();
    await xslt.press('Control+Enter');
    await page.waitForFunction(() => document.querySelector('#run-status').textContent === 'Transformé');
    await page.locator('#validate-exercise').click();
    assert.equal(await page.locator('#exercise-status').textContent(), 'Exercice réussi.');
    const countSolution = fs.readFileSync(path.join(__dirname, '../content/solutions/count-datafields/main.xsl'), 'utf8');
    await xslt.fill(countSolution.replace('count(marc:record/marc:datafield)', '13'));
    await xslt.press('Control+Enter');
    await page.waitForFunction(() => document.querySelector('#run-status').textContent === 'Transformé');
    await page.locator('#validate-exercise').click();
    assert.match(await page.locator('#exercise-status').textContent(), /Résultat incorrect/);
    console.log('OK: second exercise counts datafields and rejects 13 instead of 3.');
    await page.locator('#exercise-select').selectOption('ex04-all-subtitles');
    await page.waitForFunction(() => document.querySelector('#exercise-title').textContent.includes('sous-titres'));
    await page.locator('#xml-editor .syntax-tag').first().waitFor();
    await page.locator('#xslt-editor .syntax-attribute').first().waitFor();
    await page.locator('#use-solution').click();
    const fourthSolution = fs.readFileSync(path.join(__dirname, '../content/solutions/ex04/main.xsl'), 'utf8');
    assert.equal((await xslt.innerText()).replace(/\r\n/g, '\n'), fourthSolution.replace(/\r\n/g, '\n'));
    await xml.click();
    await xml.press('Tab');
    assert.equal(await xslt.evaluate((el) => el === document.activeElement), true);
    console.log('OK: guided-mode loading, solution editing, validation and keyboard navigation.');

    const savedXml = await xml.innerText();
    const savedXslt = await xslt.innerText();
    await page.locator('#koha-mode-button').click();
    await page.waitForFunction(() => document.querySelector('#run-status').textContent === 'Transformé');
    assert.equal(await page.locator('#xslt-editor-card').isVisible(), false);
    await page.locator('#sample-select').selectOption('cuisine-des-etoiles.xml');
    await page.waitForFunction(() => document.querySelector('#run-status').textContent === 'À transformer');
    await page.locator('#koha-style-select').selectOption('staff-detail');
    await page.waitForFunction(() => document.querySelector('#run-status').textContent === 'Transformé');
    assert.match(await page.locator('#html-output').textContent(), /Comète/);
    await page.locator('#free-mode-button').click();
    await page.waitForFunction(() => document.querySelector('#run-status').textContent === 'Transformé');
    assert.equal(await xml.innerText(), savedXml);
    assert.equal(await xslt.innerText(), savedXslt);
    await page.locator('#koha-mode-button').click();
    assert.equal(await page.locator('#sample-select').inputValue(), 'cuisine-des-etoiles.xml');
    assert.equal(await page.locator('#koha-style-select').inputValue(), 'staff-detail');
    await page.locator('#guided-mode-button').click();
    await page.waitForFunction(() => document.querySelector('#run-status').textContent === 'Transformé');
    assert.equal(await xml.innerText(), savedXml);
    assert.equal(await xslt.innerText(), savedXslt);
    assert.equal(await page.locator('#koha-style-picker').isVisible(), false);
    console.log('OK: Koha mode preserves its selection and restores the other modes sources.');

    await page.setViewportSize({ width: 390, height: 844 });
    await xml.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    fs.mkdirSync(path.join(__dirname, '../test-results'), { recursive: true });
    await page.screenshot({ path: path.join(__dirname, '../test-results/editors-mobile.png'), fullPage: true });
    assert.deepEqual(errors, []);
    assert.deepEqual(externalRequests, []);
    console.log('OK: narrow viewport, no JavaScript errors, no external requests.');
  } finally {
    await browser.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
