import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
const server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: '4191' }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await mkdir('artifacts/polish', { recursive: true });
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('http://127.0.0.1:4191/docs/compositions.html');
    for (const size of [16, 32]) {
      await page.evaluate(size => document.documentElement.style.fontSize = `${size}px`, size);
      await page.locator('#demo-message').fill('');
      const metrics = await page.locator('#demo-message').evaluate(el => {
        const s = getComputedStyle(el);
        const top = parseFloat(s.borderTopWidth) + parseFloat(s.paddingTop);
        const bottom = el.getBoundingClientRect().height - top - parseFloat(s.lineHeight);
        return { difference: Math.abs(top - bottom), height: el.offsetHeight, scroll: el.scrollHeight, client: el.clientHeight };
      });
      assert.ok(metrics.difference <= 1, `single-line message is vertically centered: ${JSON.stringify(metrics)}`);
      await page.locator('#demo-message').fill('А\nБ\nВ');
      assert.equal(await page.locator('#demo-message').evaluate(el => el.scrollHeight <= el.clientHeight + 1), true, 'multiline message is not clipped');
    }
    await page.evaluate(() => document.documentElement.style.removeProperty('font-size'));
    await page.locator('#demo-message').fill('');
    await page.screenshot({ path: `artifacts/polish/composer-${width}.png` });
    await page.goto('http://127.0.0.1:4191/docs/#icons');
    const clear = page.locator('#icon-reset');
    assert.equal(await clear.evaluate(el => getComputedStyle(el).borderTopWidth), '0px');
    assert.equal(await clear.evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
    await clear.hover();
    assert.equal(await clear.evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
    await clear.focus();
    assert.notEqual(await clear.evaluate(el => getComputedStyle(el).outlineStyle), 'none');
    await page.locator('#icon-search').fill('home');
    await clear.click();
    assert.equal(await page.locator('#icon-search').inputValue(), '');
    await page.screenshot({ path: `artifacts/polish/search-${width}.png` });
    await page.goto('http://127.0.0.1:4191/docs/bottom-panel.html');
    await page.locator('summary').click();
    for (const theme of ['light', 'dark', 'ios-dark']) {
      await page.locator('#panel-theme').selectOption(theme);
      const surfaces = await page.locator('#orders-panel').evaluate(el => {
        const css = node => getComputedStyle(node);
        const list = el.querySelector('.tg-list');
        return { panel: css(el).backgroundColor, header: css(el.querySelector('summary')).backgroundColor, list: css(list).backgroundColor, radius: css(list).borderRadius, padding: css(el.querySelector('#panel-content')).padding };
      });
      assert.equal(surfaces.header, surfaces.panel);
      assert.equal(surfaces.list, surfaces.panel);
      assert.equal(surfaces.radius, '0px');
      assert.equal(surfaces.padding, '0px');
      assert.equal(await page.locator('#orders-panel').evaluate(el => getComputedStyle(el).borderBottomLeftRadius), '0px');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: `artifacts/polish/orders-${theme}-${width}.png` });
    }
    await page.locator('#panel-example').selectOption('form');
    assert.notEqual(await page.locator('#panel-content').evaluate(el => getComputedStyle(el).padding), '0px');
    await page.getByRole('textbox', { name: 'Адрес' }).fill('Тверская, 1');
  }
  console.log('Component polish: centered composer at 100/200%, multiline, borderless search clear, unified order list; 320/390/1280px and three themes passed.');
} finally { await browser.close(); server.kill(); }
