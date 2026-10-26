import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
import { spawn } from 'node:child_process';
const server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: '4181' }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); server.once('exit', code => reject(new Error(`Server exited: ${code}`))); });
const css = await readFile('dist/t-design-system.css', 'utf8');
const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
const page = await browser.newPage();
try {
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.setContent(`<style>${css}</style><main style="min-height:1800px;padding-bottom:100px"><button id="outside">Page action</button></main>
      <details class="tg-bottom-panel"><summary class="tg-bottom-panel__header">Мои заказы · 2 400 ₽ <span class="tg-bottom-panel__chevron" aria-hidden="true">⌃</span></summary>
      <div class="tg-bottom-panel__content"><label>Комментарий <input class="tg-input"></label>${'<p>Произвольное содержимое заказа</p>'.repeat(60)}</div></details>`);
    const panel = page.locator('.tg-bottom-panel');
    const header = page.locator('summary');
    assert.equal(await panel.evaluate(el => getComputedStyle(el).position), 'fixed');
    const closed = await panel.boundingBox();
    assert.equal(Math.round(closed.y + closed.height), 800);
    await header.focus();
    await page.keyboard.press('Enter');
    assert.equal(await panel.getAttribute('open'), '');
    const opened = await panel.boundingBox();
    assert.ok(opened.y < closed.y && opened.height <= 720);
    await panel.evaluate(el => el.scrollTop = el.scrollHeight);
    assert.ok(await header.evaluate(el => el.getBoundingClientRect().top >= 0));
    assert.ok(await header.evaluate(el => {
      const box = el.getBoundingClientRect();
      return document.elementFromPoint(box.x + 10, box.y + 10) === el;
    }), 'header remains visible above scrolling contents');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await header.click();
    assert.equal(await panel.getAttribute('open'), null);
    await page.locator('#outside').click();
    await header.focus();
    await page.keyboard.press('Space');
    await page.locator('input').fill('Можно менять содержимое');
    await mkdir('artifacts/bottom-panel', { recursive: true });
    for (const theme of ['light', 'dark', 'ios-dark']) {
      await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
      await panel.evaluate(el => el.scrollTop = 0);
      await page.screenshot({ path: `artifacts/bottom-panel/${theme}-${width}.png` });
    }
  }
  await page.locator('.tg-bottom-panel').evaluate(el => {
    el.parentElement.style.setProperty('--bottom-panel-width', '300px');
    el.parentElement.style.setProperty('--bottom-panel-max-height', '300px');
    el.parentElement.style.setProperty('--bottom-panel-offset', '20px');
  });
  const custom = await page.locator('.tg-bottom-panel').boundingBox();
  assert.equal(Math.round(custom.width), 300);
  assert.ok(custom.height <= 300);
  assert.equal(Math.round(custom.y + custom.height), 780);
  await page.setContent(`<style>${css}</style><section class="tg-bottom-panel"><button class="tg-bottom-panel__header" aria-expanded="false" aria-controls="body">Корзина</button><div id="body" class="tg-bottom-panel__content" hidden><input aria-label="Количество"></div></section>`);
  assert.equal(await page.locator('#body').isVisible(), false);
  await page.locator('button').evaluate(el => { el.setAttribute('aria-expanded', 'true'); document.querySelector('#body').hidden = false; });
  assert.equal(await page.locator('input').isVisible(), true);
  await page.goto('http://127.0.0.1:4181/docs/bottom-panel.html');
  await page.locator('summary').click();
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.locator('#panel-theme').selectOption(theme);
    const surfaces = await page.locator('.tg-bottom-panel').evaluate(el => ({
      panel: getComputedStyle(el).backgroundColor,
      header: getComputedStyle(el.querySelector('summary')).backgroundColor,
      list: getComputedStyle(el.querySelector('.tg-list')).backgroundColor,
    }));
    assert.equal(surfaces.panel, surfaces.list, `${theme}: panel and list share one surface`);
    assert.equal(surfaces.header, surfaces.panel);
  }
  await page.locator('#panel-example').selectOption('form');
  await page.getByRole('textbox', { name: 'Адрес' }).fill('Тверская, 1');
  assert.equal(await page.locator('#panel-label').textContent(), 'Доставка');
  await page.setViewportSize({ width: 320, height: 800 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.locator('#panel-example').selectOption('long');
  assert.equal(await page.locator('#panel-content .tg-list-item').count(), 30);
  await page.setViewportSize({ width: 390, height: 800 });
  await page.locator('#panel-theme').selectOption('dark');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.screenshot({ path: 'artifacts/bottom-panel/demo-dark.png' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('.tg-bottom-panel__chevron').evaluate(el => getComputedStyle(el).transitionDuration), '0s');
  console.log('Bottom panel: keyboard, fixed positioning, scrolling, custom contents, controlled state, 320–1280px and three themes passed.');
} finally { await browser.close(); server.kill(); }
