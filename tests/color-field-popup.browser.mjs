import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { openCatalog } from './helpers/catalog-page.mjs';
const { page, close } = await openCatalog({ port: 4214, reducedMotion: 'no-preference' });
try {
  const field = page.locator('[data-color-field]'), swatch = field.locator('input[type=color]');
  const trigger = field.locator('[data-color-open]');
  const popup = field.locator('.tg-color-picker[popover]');
  await mkdir('/tmp/tds-color-popup', { recursive: true });
  for (const width of [320, 1440]) for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.setViewportSize({ width, height: 900 }); await page.selectOption('#theme', theme);
    const before = await swatch.inputValue();
    await trigger.click();
    assert.ok(await popup.evaluate(el => el.matches(':popover-open')));
    assert.equal(await swatch.inputValue(), before, 'opening never changes the selected color');
    const box = await popup.boundingBox(); assert.ok(box.x >= 0 && box.x + box.width <= width + 1);
    const style = await popup.evaluate(el => { const s = getComputedStyle(el); return { padding: parseFloat(s.paddingTop), radius: parseFloat(s.borderRadius), shadow: s.boxShadow }; });
    assert.ok(style.padding > 0 && style.radius >= 12 && style.shadow !== 'none');
    await popup.screenshot({ path: `/tmp/tds-color-popup/${process.argv.includes('--webkit') ? 'webkit' : 'chromium'}-${width}-${theme}.png` });
    await popup.getByRole('radio', { name: 'Зелёный', exact: true }).check();
    assert.equal(await swatch.inputValue(), '#18745b');
    assert.equal(await field.locator('.tg-color-field__input').inputValue(), '#18745B');
    const old = await swatch.inputValue();
    await popup.getByRole('slider', { name: 'Оттенок', exact: true }).focus();
    await page.keyboard.press('ArrowRight'); assert.notEqual(await swatch.inputValue(), old, 'slider updates the field');
    await popup.getByRole('radio', { name: 'Зелёный', exact: true }).check();
    assert.equal(await swatch.inputValue(), '#18745b', 'a preset can be restored after changing HSV');
    await page.keyboard.press('Escape');
    assert.equal(await popup.evaluate(el => el.matches(':popover-open')), false);
    await page.waitForFunction(() => document.querySelector('[data-color-open]') === document.activeElement, null, { timeout: 3000 });
  }
  await page.evaluate(() => { window.cardTransitions = 0; document.startViewTransition = callback => { window.cardTransitions++; return { finished: Promise.resolve().then(callback) }; }; });
  const button = page.locator('[data-morph-open="demo-morph-dialog"]');
  await button.click(); assert.ok(await page.locator('#demo-morph-dialog').evaluate(el => el.open));
  assert.equal(await page.evaluate(() => window.cardTransitions), 0, 'source card does not enter a view transition');
  await page.locator('#demo-morph-dialog [data-dialog-close]').click();
  assert.ok(await button.evaluate(el => el === document.activeElement));
  console.log('Color field: shared rounded popup, padding, bounds, exact presets, HSV/HEX sync, Escape/focus and three themes; source card stays still.');
} finally { await close(); }
