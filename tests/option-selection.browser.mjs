import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium, webkit } from 'playwright';
const server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: '4196' }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
let browser;
try {
  browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:4196/docs/');
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const rows = await page.locator('.tg-menu__item[aria-checked="true"], .tg-listbox__option[aria-selected="true"], .tg-sidebar__link[aria-current="page"]').evaluateAll(nodes => nodes.map(el => ({ label: el.textContent.trim(), shadow: getComputedStyle(el).boxShadow })));
    assert.ok(rows.length > 0);
    for (const row of rows) assert.equal(row.shadow, 'none', `${theme}: selected option "${row.label}" is flat`);
    const flatParts = await page.locator('.tg-tabs:not(.tg-tabs--underline) .tg-tab[aria-selected="true"], .tg-segmented__item[aria-pressed="true"], .tg-segmented__item:has(> input:checked), .tg-switch__knob, .tg-avatar > .tg-badge, .tg-compare__grip').evaluateAll(nodes => nodes.map(el => ({ selector: el.className, shadow: getComputedStyle(el).boxShadow })));
    assert.ok(flatParts.length > 0);
    for (const part of flatParts) assert.equal(part.shadow, 'none', `${theme}: internal ${part.selector} is flat`);
    const colorHandleShadows = await page.locator('.tg-color-picker__handle').evaluateAll(nodes => nodes.map(el => getComputedStyle(el).boxShadow));
    for (const shadow of colorHandleShadows) {
      const lengths = shadow.match(/-?[\d.]+px/g) || [];
      assert.equal(lengths[2], '0px', `${theme}: color handle keeps only a sharp contrast ring`);
      assert.equal(lengths.length, 4, 'color handle has one contrast ring and no cast shadow');
    }
    const popup = page.locator('.tg-menu').first();
    assert.notEqual(await popup.evaluate(el => getComputedStyle(el).boxShadow), 'none', `${theme}: popup retains its elevation`);
  }
  console.log('Option rows, tabs, segments, switch knobs, avatar badges and color handles are flat; popup shadows remain in all three themes.');
} finally { await browser?.close(); server.kill(); }
