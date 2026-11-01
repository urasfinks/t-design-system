import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
import { measureContrast } from './helpers/contrast.mjs';

const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
try {
  const page = await browser.newPage();
  const css = await readFile('dist/t-design-system.css', 'utf8');
  await page.setContent(`<style>${css}</style><div class="tg-card"><span class="tg-badge tg-badge--primary">Активен</span><span class="tg-badge tg-badge--secondary">Черновик</span><span class="tg-badge tg-badge--destructive">Ошибка</span></div><button class="tg-switch" role="switch" aria-checked="false"><span class="tg-switch__knob"></span></button><span class="tg-badge"><svg class="tg-icon"></svg>Иконка</span><button class="tg-badge"><svg class="tg-icon"></svg>Действие</button><a href="#" class="tg-badge">Ссылка</a>`);
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    for (const size of [24, 30]) {
      await page.evaluate(size => document.documentElement.style.setProperty('--choice-size', size + 'px'), size);
      const geometry = await page.evaluate(() => ({
        track: parseFloat(getComputedStyle(document.querySelector('.tg-switch'), '::before').height),
        badges: [...document.querySelectorAll('.tg-badge')].map(el => el.getBoundingClientRect().height)
      }));
      for (const height of geometry.badges) assert.equal(height, geometry.track, theme + ': badges match switch track and follow its token');
    }
    await page.evaluate(() => document.documentElement.style.removeProperty('--choice-size'));
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
