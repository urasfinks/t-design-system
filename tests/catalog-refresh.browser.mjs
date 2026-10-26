import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
const server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: '4185' }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
let browser;
try {
  browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4185/docs/');
  assert.equal(await page.locator('#data .tg-table').count(), 1, 'catalog demonstrates actual data table');
  const rowEdges = await page.locator('#data tbody tr').last().locator('th, td').evaluateAll(cells => cells.map(el => getComputedStyle(el).borderBottomWidth));
  assert.equal(new Set(rowEdges).size, 1, 'last body row retains a complete separator before totals');
  assert.notEqual(rowEdges[0], '0px');
  await page.locator('#surfaces .tg-disclosure__trigger').click();
  assert.equal(await page.locator('#surfaces .tg-disclosure').getAttribute('open'), '');
  await page.locator('#transition-toggle').click();
  await page.locator('#transition-demo').waitFor({ state: 'hidden' });
  assert.equal(await page.locator('#transition-demo').isVisible(), false);
  await page.locator('#transition-toggle').click();
  assert.equal(await page.locator('#transition-demo').isVisible(), true);
  assert.equal(await page.locator('#effects .tg-ripple').count(), 2, 'original opt-in ripple examples remain available');
  await page.locator('#demo-error-summary a').click();
  assert.equal(await page.locator('#demo-contact-email').evaluate(el => el === document.activeElement), true);
  await mkdir('artifacts/catalog-refresh', { recursive: true });
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.getByLabel('Тема оформления', { exact: true }).selectOption(theme);
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `no horizontal page overflow at ${width}`);
      await page.locator('#data').evaluate(el => el.scrollIntoView({block: 'start', behavior: 'instant'}));
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.screenshot({ path: `artifacts/catalog-refresh/data-${theme}-${width}.png` });
    }
  }
  await page.locator('.nav-link[href="#icons"]').click();
  await page.locator('.nav-link[href="#icons"][aria-current="location"]').waitFor();
  await page.screenshot({ path: 'artifacts/catalog-refresh/icons.png' });
  // Alternative accents replace the shared root accent, including embedded examples.
  const frames = ['#composition-preview', 'iframe[src="bottom-panel.html"]'];
  for (const accent of ['green', 'violet', 'blue']) {
    await page.getByLabel('Акцентный цвет').selectOption(accent);
    const expected = await page.locator('html').evaluate(el => getComputedStyle(el).getPropertyValue('--accent-main').trim());
    assert.equal(await page.locator('[style*="--button-color:"]:not(html)').count(), 0);
    for (const selector of frames) {
      const frame = page.frameLocator(selector);
      await page.locator(selector).evaluate(el => el.scrollIntoView());
      await frame.locator('html').waitFor({ state: 'attached' });
      await page.waitForFunction(({ selector, expected }) => {
        const root = document.querySelector(selector).contentDocument?.documentElement;
        return root && getComputedStyle(root).getPropertyValue('--accent-main').trim() === expected;
      }, { selector, expected });
    }
  }
  assert.deepEqual(errors, []);
  console.log('Refreshed catalog: native interaction, errors, transitions, responsive tables and themes passed.');
} finally { await browser?.close(); server.kill(); }
