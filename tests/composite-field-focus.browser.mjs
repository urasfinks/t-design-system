import assert from 'node:assert/strict';
import { openCatalog } from './helpers/catalog-page.mjs';

const { page, theme, close } = await openCatalog({ port: 4237 });
try {
  for (const name of ['light', 'dark', 'ios-dark']) {
    await theme(name);
    for (const [wrapper, control] of [
      ['.tg-tag-input', '.tg-tag-input__field'],
      ['.tg-search', '.tg-search__input'],
      ['.tg-input-group', '.tg-input-group__control'],
      ['.tg-number', '.tg-number__input'],
      ['.tg-color-field', '.tg-color-field__input'],
      ['.tg-copy', '.tg-copy__action'],
    ]) {
      const field = page.locator(`${wrapper} ${control}:not(:disabled):not([readonly])`).first();
      const target = await field.count() ? field : page.locator(`${wrapper} ${control}`).first();
      await target.focus();
      const state = await target.evaluate((el, wrapper) => {
        const surface = el.closest(wrapper);
        const probe = document.createElement('span');
        probe.style.color = 'var(--field-bg-hover)'; surface.append(probe);
        const expected = getComputedStyle(probe).color; probe.remove();
        return { actual: getComputedStyle(surface).backgroundColor, expected,
          focused: surface.matches(':focus-within') };
      }, wrapper);
      assert.ok(state.focused, `${name}/${wrapper}: receives focus`);
      if (!await target.getAttribute('readonly')) {
        assert.equal(state.actual, state.expected, `${name}/${wrapper}: active background`);
      }
      await target.blur();
    }
  }
  await page.locator('.tg-tag-input__field').first().focus();
  await page.locator('.tg-tag-input').first().screenshot({ path: '/tmp/tds-tag-focus.png' });
} finally { await close(); }
