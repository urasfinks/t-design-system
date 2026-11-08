import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';

const css = await readFile(new URL('../dist/t-design-system.css', import.meta.url), 'utf8');
const engine = process.argv.includes('--webkit') ? webkit : chromium;
const browser = await engine.launch();
try {
  const focusPage = await browser.newPage();
  try {
    await focusPage.setContent(`<style>${css}</style>
      <button id="jump" type="button">Перейти к содержимому</button>
      <h2 tabindex="-1">Профиль</h2>
      <article tabindex="-1">Комментарий</article>
      <section tabindex="-1">Обсуждение</section>
      <p tabindex="-1">Абзац новости</p>
      <button class="tg-btn" tabindex="-1" type="button">Пункт с управляемым фокусом</button>`);
    const jump = focusPage.locator('#jump');
    const targets = focusPage.locator('[tabindex="-1"]');
    const focusState = target => target.evaluate(el => ({
      focused: el === document.activeElement,
      visible: el.matches(':focus-visible'),
      outline: getComputedStyle(el).outlineStyle,
    }));
    for (const theme of ['light', 'dark', 'ios-dark']) {
      await focusPage.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
      for (const target of await targets.all()) {
        await target.evaluate(el => {
          document.querySelector('#jump').onclick = () => el.focus();
        });
        if (await target.evaluate(el => el.tagName !== 'BUTTON')) {
          await jump.click();
          assert.deepEqual(await focusState(target), { focused: true, visible: false, outline: 'none' }, theme);
        }
        await jump.focus();
        await focusPage.keyboard.press('Enter');
        assert.deepEqual(await focusState(target), { focused: true, visible: true, outline: 'solid' }, theme);
      }
    }
  } finally {
    await focusPage.close();
  }
  console.log('Static pointer and keyboard focus passed in all three themes.');
} finally {
  await browser.close();
}
