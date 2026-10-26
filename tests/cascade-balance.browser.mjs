import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
import { measureContrast } from './helpers/contrast.mjs';
const css = await readFile('dist/t-design-system.css', 'utf8');
const adapter = await readFile('dist/telegram.css', 'utf8');
const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
const page = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } });
const resolveColor = async (selector, value) => page.locator(selector).evaluate((el, value) => {
  const probe = document.createElement('span'); probe.style.color = value; el.append(probe);
  const color = getComputedStyle(probe).color; probe.remove(); return color;
}, value);
try {
  await page.setContent(`<style>${css}</style><section class="tg-card tg-scope" id="local" style="--button-color:#18745b;--text-color:#123123;--radius:24px;--border-color:rgb(190,0,0);--icon-btn-prep:80px"><button class="tg-btn tg-btn--primary">Local</button><input class="tg-input" aria-label="Local input"><span class="tg-text-muted">Secondary</span></section><section data-theme="dark" id="nested"><a class="tg-link" href="#">Link</a><input class="tg-input" aria-label="Dark input"></section><div style="--action-bg:rgb(80,0,120)"><button class="tg-btn tg-btn--primary" id="role">Inherited role</button></div>`);
  assert.equal(await resolveColor('#local', 'var(--accent-main)'), await resolveColor('#local', 'var(--button-color)'), 'scope recomputes accent from local source');
  assert.equal(await resolveColor('#local', 'var(--text-main)'), await resolveColor('#local', 'var(--text-color)'), 'scope recomputes local text roles');
  assert.equal(await page.locator('#local input').evaluate(el => getComputedStyle(el).borderRadius), '24px');
  assert.equal(await page.locator('#local input').evaluate(el => getComputedStyle(el).borderTopColor), 'rgb(190, 0, 0)');
  assert.equal(await page.locator('#local').evaluate(el => getComputedStyle(el).getPropertyValue('--icon-btn').trim()), 'calc(80px + .25rem)');
  assert.equal(await page.locator('#nested').evaluate(el => getComputedStyle(el).colorScheme), 'dark');
  assert.notEqual(await page.locator('#nested').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)', 'named theme owns its surface');
  assert.equal(await resolveColor('#nested', 'var(--text-main)'), 'rgb(255, 255, 255)');
  assert.equal(await page.locator('#nested').evaluate(el => getComputedStyle(el).color), 'rgb(255, 255, 255)', 'theme boundary also applies inherited foreground');
  assert.equal(await page.locator('#role').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(80, 0, 120)', 'plain subtrees inherit direct role overrides');
  assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).colorScheme), 'light', 'nested theme does not escape its boundary');
  await page.addStyleTag({ content: '.tg-btn { border-radius: 7px; } .tg-input { padding: 3px; }' });
  assert.equal(await page.locator('#local button').evaluate(el => getComputedStyle(el).borderRadius), '7px', 'application CSS overrides component styles');

  const specimens = theme => `<section class="tg-card tg-col" data-theme="${theme}" id="${theme}"><h2 class="tg-header__title">${theme}</h2><div class="tg-row"><button class="tg-btn tg-btn--primary">Продолжить</button><button class="tg-btn tg-btn--secondary">Подробнее</button><button class="tg-btn tg-btn--ghost">Действие</button></div><label class="tg-field">Имя<input class="tg-input" placeholder="Как к вам обращаться?"></label><p class="tg-text-muted">Вторичный текст</p><a class="tg-link" href="#">Ссылка на сведения</a><p class="tg-help tg-help--error">Исправьте адрес электронной почты</p><div class="tg-notice tg-notice--destructive"><strong>Не удалось сохранить</strong><p>Проверьте соединение и повторите попытку.</p></div><progress class="tg-progress" max="100" value="64" aria-label="Загрузка">64%</progress><span class="tg-badge tg-badge--primary">Подтверждён</span></section>`;
  await page.setContent(`<style>${css}</style><style>.scene {display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,24rem),1fr));gap:var(--space-4);padding:var(--space-4)} .scene section {min-inline-size:0}</style><main class="scene">${['light','dark','ios-dark'].map(specimens).join('')}</main>`);
  for (const theme of ['light', 'dark', 'ios-dark']) {
    const foreground = await resolveColor(`#${theme}`, 'var(--text-main)');
    for (const selector of ['.tg-link', '.tg-help--error']) {
      const color = await page.locator(`#${theme} ${selector}`).evaluate(el => getComputedStyle(el).color);
      assert.notEqual(color, foreground, `${theme}: semantic text retains its own color`);
      for (const accent of [null, '#18745b', '#7151c7']) {
        await page.locator(`#${theme}`).evaluate((el, color) => {
          if (color) el.style.setProperty('--button-color', color);
          else el.style.removeProperty('--button-color');
        }, accent);
        const result = await page.evaluate(measureContrast, { selector: `#${theme} ${selector}` });
        assert.ok(result.ratio >= 4.5, `${theme}/${selector}/${accent}: contrast ${result.ratio}`);
      }
    }
    await page.locator(`#${theme}`).evaluate(el => el.style.removeProperty('--button-color'));
  }
  await mkdir('artifacts/balance', { recursive: true });
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `artifacts/balance/components-${width}.png`, fullPage: true });
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.locator('#light').evaluate(el => { getComputedStyle(el.querySelector('input')).backgroundColor; el.dataset.theme = 'dark'; });
  assert.equal(await page.locator('#light input').evaluate(el => el.getAnimations().some(animation => animation.transitionProperty === 'background-color')), false, 'theme changes must not animate an old light field behind new white text');
  await page.setContent(`<style>${css}</style><dialog class="tg-modal tg-modal--sheet"><div class="tg-modal__sheet">Sheet</div></dialog>`);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.locator('dialog').evaluate(el => el.showModal());
  const sheet = await page.locator('dialog').boundingBox();
  assert.equal(Math.round(sheet.x), 0);
  assert.equal(Math.round(sheet.width), 320, 'mobile sheet spans viewport rather than UA max-width');
  await page.locator('dialog').evaluate(el => el.close());
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.setContent(`<style>${css}</style><figure class="tg-media"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'%3E%3C/svg%3E" width="1200" height="800" alt="Landscape"></figure>`);
    await page.locator('img').evaluate(el => el.decode());
    const media = await page.locator('img').boundingBox();
    assert.ok(Math.abs(media.width / media.height - 1.5) < .01, 'media preserves intrinsic box ratio without blank vertical space');
  }
  await page.addStyleTag({ content: adapter });
  await page.evaluate(() => { document.documentElement.dataset.telegramTheme = 'native'; document.documentElement.style.setProperty('--tg-theme-button-color', '#18745b'); });
  assert.equal(await resolveColor('body', 'var(--accent-main)'), 'rgb(24, 116, 91)', 'Telegram native override still works');
  console.log('Cascade balance: local inputs, derived roles, nested themes, direct overrides, semantic contrast, application CSS and responsive specimens passed.');
} finally { await browser.close(); }
