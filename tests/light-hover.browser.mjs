import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium, webkit } from 'playwright';
const server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: '4199' }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
let browser;
try {
  browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:4199/docs/');
  await page.evaluate(() => {
    const fixture = document.createElement('div'); fixture.id = 'light-hover-test';
    fixture.innerHTML = '<details class="tg-disclosure"><summary class="tg-disclosure__trigger"><span class="tg-badge tg-badge--primary">Новость</span></summary></details><button class="tg-btn">Кнопка</button>';
    document.body.append(fixture);
  });
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
    for (const selector of ['summary', 'button']) {
      const control = page.locator('#light-hover-test ' + selector);
      await page.mouse.move(0, 0);
      const idle = await control.evaluate(el => getComputedStyle(el).backgroundColor);
      await control.hover();
      const hover = await control.evaluate(el => ({ bg: getComputedStyle(el).backgroundColor, filter: getComputedStyle(el).filter }));
      assert.notEqual(hover.bg, idle, `${theme}: ${selector} still gives hover feedback`);
      assert.equal(hover.filter, 'brightness(1)', `${theme}: brightness follows theme`);
    }
  }
  console.log('All themes use background-only hover without changing content brightness.');
} finally { await browser?.close(); server.kill(); }
