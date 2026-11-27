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
        const interactive = await target.evaluate(el => el.tagName === 'BUTTON');
        if (!interactive) {
          await jump.click();
          assert.deepEqual(await focusState(target), { focused: true, visible: false, outline: 'none' }, theme);
        }
        await jump.focus();
        await focusPage.keyboard.press('Enter');
        assert.deepEqual(await focusState(target), { focused: true, visible: true, outline: interactive ? 'solid' : 'none' }, theme);
      }
    }
  } finally {
    await focusPage.close();
  }
  for (const hasTouch of [false, true]) {
    const page = await browser.newPage({ hasTouch });
    try {
      await page.setContent(`<style>${css}</style>
        <input class="tg-input" id="field">
        <button class="tg-btn" id="open" onclick="dialog.showModal()">Открыть</button>
        <dialog id="dialog" class="tg-modal">
          <button class="tg-icon-btn" id="close" onclick="dialog.close()">Закрыть</button>
          <button class="tg-btn tg-btn--ghost tg-media" id="photo"><img alt="Фотография"></button>
          <a class="tg-link" href="#field" id="link">Ссылка</a>
        </dialog>
        <dialog id="nested-parent" class="tg-modal">
          <button class="tg-btn" id="nested-open" onclick="document.querySelector('#nested-child').showModal()">Открыть раздел</button>
        </dialog>
        <dialog id="nested-child" class="tg-modal">
          <button class="tg-icon-btn" id="nested-close" onclick="document.querySelector('#nested-child').close()">Закрыть раздел</button>
        </dialog>`);
      const ui = await readFile(new URL('../dist/ui.js', import.meta.url), 'utf8');
      const effects = await readFile(new URL('../dist/effects.js', import.meta.url), 'utf8');
      await page.evaluate(async ({ ui, effects }) => {
        const effectUrl = URL.createObjectURL(new Blob([effects], { type: 'text/javascript' }));
        const uiUrl = URL.createObjectURL(new Blob([ui.replace('./effects.js', effectUrl)], { type: 'text/javascript' }));
        try { await import(uiUrl); } finally {
          URL.revokeObjectURL(uiUrl);
          URL.revokeObjectURL(effectUrl);
        }
      }, { ui, effects });
      const outline = selector => page.locator(selector).evaluate(el => getComputedStyle(el).outlineStyle);
      await page.evaluate(() => document.querySelector('dialog').showModal());
      assert.equal(await page.evaluate(() => document.activeElement.id), 'close');
      assert.equal(await outline('#close'), 'none', 'dialog opened on startup');
      await page.evaluate(() => document.querySelector('dialog').close());
      for (const theme of ['light', 'dark', 'ios-dark']) {
        await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
        await page.locator('#field').focus();
        const open = page.locator('#open');
        if (hasTouch) await open.tap(); else await open.click();
        assert.equal(await page.evaluate(() => document.activeElement.id), 'close');
        assert.equal(await outline('#close'), 'none', `${theme}: pointer-opened dialog`);
        for (const id of ['photo', 'link']) {
          await page.locator(`#${id}`).focus();
          assert.equal(await outline(`#${id}`), 'none', `${theme}: pointer focus transfer to ${id}`);
        }
        await page.locator('#close').focus();
        // Option+Tab reaches links and buttons in WebKit on macOS.
        await page.keyboard.press(engine === webkit ? 'Alt+Tab' : 'Tab');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'photo', theme);
        assert.equal(await outline('#photo'), 'solid', `${theme}: keyboard photo focus`);
        await page.keyboard.press(engine === webkit ? 'Alt+Tab' : 'Tab');
        assert.equal(await outline('#link'), 'solid', `${theme}: keyboard link focus`);
        await page.evaluate(() => document.querySelector('dialog').close());
        await open.focus();
        await page.keyboard.press('Enter');
        assert.equal(await outline('#close'), 'solid', `${theme}: keyboard-opened dialog`);
        await page.evaluate(() => document.querySelector('dialog').close());
        await page.evaluate(() => {
          const parent = document.querySelector('#nested-parent');
          parent.showModal();
          parent.focus();
        });
        assert.equal(await page.evaluate(() => document.activeElement.id), 'nested-parent', theme);
        assert.equal(await outline('#nested-parent'), 'none', `${theme}: a dialog surface never draws a focus ring`);
        const nestedOpen = page.locator('#nested-open');
        if (hasTouch) await nestedOpen.tap(); else await nestedOpen.click();
        const nestedClose = page.locator('#nested-close');
        if (hasTouch) await nestedClose.tap(); else await nestedClose.click();
        assert.equal(await outline('#nested-parent'), 'none', `${theme}: no ring on the restored parent`);
        assert.equal(await outline('#nested-open'), 'none', `${theme}: no ring on the pointer-focused opener`);
        await page.evaluate(() => document.querySelector('#nested-parent').close());
      }
    } finally { await page.close(); }
  }
  console.log('Static pointer and keyboard focus passed in all three themes.');
} finally {
  await browser.close();
}
