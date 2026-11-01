import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium, webkit } from 'playwright';
const server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: '4197' }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
let browser;
try {
  browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:4197/docs/');
  const collections = '.tg-menu, .tg-menu [role="group"], .tg-listbox, .tg-nav-menu__group, .tg-command__list, .tg-command__group, .tg-segmented';
  for (const gap of [2, 8]) {
    if (gap === 8) await page.evaluate(() => document.documentElement.style.setProperty('--option-gap', '8px'));
    const styles = await page.locator(collections).evaluateAll(nodes => nodes.map(el => ({ name: el.className || el.getAttribute('role'), gap: getComputedStyle(el).rowGap, display: getComputedStyle(el).display })));
    assert.ok(styles.length > 5);
    for (const style of styles) assert.equal(style.gap, `${gap}px`, `${style.name} uses the shared spacing token`);
  }
  await page.evaluate(() => document.documentElement.style.removeProperty('--option-gap'));
  await page.locator('#demo-owner-trigger').click();
  const list = page.locator('.tg-listbox:visible').filter({ has: page.getByRole('option', { name: /Анна Кузнецова/ }) });
  const first = await list.getByRole('option').nth(0).boundingBox();
  const second = await list.getByRole('option').nth(1).boundingBox();
  assert.equal(Math.round(second.y - first.y - first.height), 2);
  console.log('Option collections share 2px spacing, follow token changes, and the owner picker has a measured 2px gap.');
} finally { await browser?.close(); server.kill(); }
