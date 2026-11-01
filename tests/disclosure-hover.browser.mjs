import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium, webkit } from 'playwright';
const server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: '4198' }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
let browser;
try {
  browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:4198/docs/');
  await page.evaluate(() => {
    const fixture = document.createElement('div');
    fixture.id = 'hover-test';
    fixture.innerHTML = '<details class="tg-disclosure"><summary class="tg-disclosure__trigger tg-disclosure__trigger--no-hover">Без hover</summary><div class="tg-disclosure__content">Содержимое</div></details><details class="tg-disclosure"><summary class="tg-disclosure__trigger">Обычный</summary></details>';
    document.body.append(fixture);
  });
  const quiet = page.locator('#hover-test summary').first();
  const normal = page.locator('#hover-test summary').last();
  const paint = locator => locator.evaluate(el => {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = getComputedStyle(el).backgroundColor;
    ctx.fillRect(0, 0, 1, 1);
    return { background: [...ctx.getImageData(0, 0, 1, 1).data], filter: getComputedStyle(el).filter };
  });
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
    await page.mouse.move(0, 0);
    const idle = await paint(quiet);
    await quiet.hover();
    assert.deepEqual(await paint(quiet), idle, `${theme}: modifier preserves resting paint on hover`);
    await page.mouse.move(0, 0);
    const normalIdle = await paint(normal);
    await normal.hover();
    assert.notDeepEqual(await paint(normal), normalIdle, `${theme}: default disclosure retains hover`);
    await quiet.click();
    assert.equal(await quiet.evaluate(el => el.parentElement.open), true);
    await page.keyboard.press('Tab');
    await quiet.focus();
    assert.equal(await quiet.evaluate(el => el.matches(':focus-visible') && getComputedStyle(el).outlineStyle !== 'none'), true, `${theme}: keyboard focus remains visible`);
    await page.keyboard.press('Space');
    assert.equal(await quiet.evaluate(el => el.parentElement.open), false);
  }
  console.log('No-hover disclosure stays flat; default hover, click, Space and visible keyboard focus work in three themes.');
} finally { await browser?.close(); server.kill(); }
