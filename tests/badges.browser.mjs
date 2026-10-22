import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
import { measureContrast } from './helpers/contrast.mjs';

const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
try {
  const page = await browser.newPage();
  const css = await readFile('dist/t-design-system.css', 'utf8');
  await page.setContent(`<style>${css}</style><div class="tg-card"><span class="tg-badge tg-badge--primary">Активен</span><span class="tg-badge tg-badge--secondary">Черновик</span><span class="tg-badge tg-badge--destructive">Ошибка</span></div>`);
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    for (const accent of [null, '#18745b', '#7151c7']) {
      await page.evaluate(accent => {
        if (accent) document.documentElement.style.setProperty('--button-color', accent);
        else document.documentElement.style.removeProperty('--button-color');
      }, accent);
      for (const variant of ['primary', 'secondary', 'destructive']) {
        const selector = `.tg-badge--${variant}`;
        const value = await page.evaluate(measureContrast, { selector });
        assert.ok(value.ratio >= 4.5, `${theme}/${accent ?? 'default'}/${variant}: contrast ${value.ratio.toFixed(2)}`);
        assert.equal(await page.locator(selector).evaluate(el => getComputedStyle(el).borderTopWidth), '0px');
      }
    }
  }
  console.log('Badges: borderless and text contrast ≥ 4.5 in three themes and three accents.');
} finally { await browser.close(); }
