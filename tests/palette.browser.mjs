import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';

const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
try {
  const page = await browser.newPage();
  const html = await readFile('docs/index.html', 'utf8');
  const table = html.slice(html.indexOf('<div class="palette-table-wrap">'), html.indexOf('<div class="foundation-grid">'));
  const css = await readFile('dist/t-design-system.css', 'utf8');
  const catalog = await readFile('docs/catalog.css', 'utf8');
  await page.setContent(`<style>${css}\n${catalog}</style>${table}`);
  assert.equal(await page.locator('.palette-table tbody tr').count(), 4);
  assert.equal(await page.locator('.palette-swatch').count(), 12);
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    const colors = await page.evaluate(() => {
      const resolve = token => {
        const probe = document.createElement('span');
        probe.style.color = `var(--${token})`; document.body.append(probe);
        const value = getComputedStyle(probe).color; probe.remove(); return value;
      };
      return [
        resolve('background-main') === resolve('bg-color'),
        resolve('accent-main') === resolve('button-color'),
        resolve('text-main') === resolve('text-color'),
        resolve('danger-main') === resolve('destructive-text-color'),
      ];
    });
    assert.ok(colors.every(Boolean), `${theme}: all main colors must remain original`);
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${theme}: table overflow at ${width}px`);
    }
    await page.locator('body').evaluate(el => el.style.setProperty('--accent-main', '#18745b'));
    assert.ok(await page.locator('[style="background:var(--accent-strong)"]').evaluate(el => getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)'));
    await page.locator('body').evaluate(el => el.style.removeProperty('--accent-main'));
  }
  console.log('Palette: four original colors, 12 table samples, three themes and responsive layouts passed.');
} finally { await browser.close(); }
