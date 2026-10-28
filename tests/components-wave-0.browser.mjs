// Wave 0 components: B15 tooltip (floating engine) and B8 segmented control
// (selected-state engine shared with tabs).
import { openCatalog } from './helpers/catalog-page.mjs';
import { measureContrast } from './helpers/contrast.mjs';

const { page, check, css, px, box, length, theme, rtl, close } = await openCatalog({ port: 4200 });
try {
  // B15 — tooltip
  const trigger = page.locator('[data-tooltip="tip-italic"]');
  const tip = page.locator('#tip-italic');
  await trigger.scrollIntoViewIfNeeded();
  await trigger.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  check('B15 keyboard focus shows the tooltip at once', await tip.evaluate(el => el.matches(':popover-open')));
  check('B15 keyboard opening skips the entrance', await tip.evaluate(el => el.hasAttribute('data-instant')));
  const t = await box('#tip-italic'), b = await box('[data-tooltip="tip-italic"]');
  check('B15 tooltip sits above its trigger by default', t.bottom <= b.top + 1, `${t.bottom} vs ${b.top}`);
  check('B15 tooltip is centred on its trigger', Math.abs((t.left + t.right) / 2 - (b.left + b.right) / 2) < 2);
  check('B15 tooltip uses the overlay surface and small type', await css('#tip-italic', 'font-size') === `${await length('var(--fs-sm)')}px`);
  check('B15 tooltip ignores the pointer', await css('#tip-italic', 'pointer-events') === 'none');
  check('B15 button name comes from the tooltip label', await trigger.evaluate(el => document.getElementById(el.getAttribute('aria-labelledby')).textContent) === 'Курсив');
  check('B15 shortcut is the description', await trigger.evaluate(el => document.getElementById(el.getAttribute('aria-describedby')).textContent) === 'Ctrl I');
  check('B15 tooltip has role tooltip', await tip.getAttribute('role') === 'tooltip');
  for (const name of ['light', 'dark', 'ios-dark']) {
    await theme(name);
    const { ratio } = await page.evaluate(measureContrast, { selector: '#tip-italic > span' });
    check(`B15 ${name}: tooltip text contrast ${ratio.toFixed(2)} ≥ 4.5`, ratio >= 4.5);
  }
  await theme(null);
  await page.keyboard.press('Escape');
  check('B15 Escape hides the tooltip', !(await tip.evaluate(el => el.matches(':popover-open'))));
  check('B15 Escape keeps focus on the trigger', await trigger.evaluate(el => el === document.activeElement));
  // Bottom side
  await page.locator('[data-tooltip="tip-undo"]').focus();
  await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
  const u = await box('#tip-undo'), ub = await box('[data-tooltip="tip-undo"]');
  check('B15 data-side=bottom places the tooltip below', u.top >= ub.bottom - 1);
  await page.keyboard.press('Escape');
  // Hover waits, then moving along the toolbar is instant.
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  const bold = page.locator('[data-tooltip="tip-bold"]');
  await bold.hover();
  await page.waitForTimeout(200);
  check('B15 hover does not show the tooltip immediately', !(await page.locator('#tip-bold').evaluate(el => el.matches(':popover-open'))));
  await page.waitForTimeout(450);
  check('B15 hover shows the tooltip after the delay', await page.locator('#tip-bold').evaluate(el => el.matches(':popover-open')));
  await trigger.hover();
  await page.waitForTimeout(120);
  check('B15 the next tooltip along the toolbar opens without delay', await tip.evaluate(el => el.matches(':popover-open')));
  await page.mouse.move(0, 0);
  await page.waitForTimeout(150);
  check('B15 leaving hides the tooltip', !(await tip.evaluate(el => el.matches(':popover-open'))));
  // Fallback placement without anchor positioning keeps the layer on screen.
  await page.setViewportSize({ width: 320, height: 700 });
  await page.locator('[data-tooltip="tip-bold"]').scrollIntoViewIfNeeded();
  await page.evaluate(async () => {
    const { placeFloating } = await import('./catalog-components.js');
    const trigger = document.querySelector('[data-tooltip="tip-bold"]'), layer = document.getElementById('tip-bold');
    layer.showPopover();
    placeFloating(trigger, layer, 'inline-start');
  });
  const f = await box('#tip-bold');
  check('B15 measured fallback keeps the tooltip inside a 320px screen', f.left >= 7 && f.right <= 313);
  await page.evaluate(() => document.getElementById('tip-bold').hidePopover());
  await page.setViewportSize({ width: 1440, height: 900 });

  // B8 — segmented control
  const seg = '.example-body[data-spec~="B8"] fieldset.tg-segmented:not(.tg-segmented--vertical)';
  const item = `${seg} .tg-segmented__item`;
  check('B8 segments keep the control height', Math.round((await box(item)).height) >= Math.round(await length('var(--control-h)')));
  check('B8 segment radius is the inset radius', await css(item, 'border-top-left-radius') === `${await length('var(--radius-inset)')}px`);
  check('B8 trough matches the tabs trough', await css(seg, 'background-color') === await css('.tg-tabs:not(.tg-tabs--underline)', 'background-color') && await css(seg, 'border-top-left-radius') === await css('.tg-tabs:not(.tg-tabs--underline)', 'border-top-left-radius'));
  check('B8 checked segment rises like a selected tab', await css(`${item}:has(input:checked)`, 'box-shadow') === await css('.tg-tabs:not(.tg-tabs--underline) .tg-tab[aria-selected="true"]', 'box-shadow'));
  const radios = page.locator(`${seg} input`);
  await radios.first().focus();
  await page.keyboard.press('ArrowRight');
  check('B8 arrow keys move the native radio choice', await radios.nth(1).isChecked());
  check('B8 the focused segment shows a ring', (await css(`${item}:has(input:focus-visible)`, 'outline-style')) === 'solid');
  check('B8 the moved choice becomes the risen segment', (await css(`${item}:has(input:checked)`, 'box-shadow')) !== 'none' && await page.locator(`${item}:has(input:checked)`).textContent() === 'Доска');
  const pressed = page.locator('.example-body[data-spec~="B8"] [role="group"] .tg-segmented__item').nth(1);
  await pressed.click();
  check('B8 a toggle segment flips aria-pressed', await pressed.getAttribute('aria-pressed') === 'true');
  check('B8 pressed toggles share the risen look', await pressed.evaluate(el => getComputedStyle(el).boxShadow) !== 'none');
  check('B8 toggle group has a name', await page.locator('.example-body[data-spec~="B8"] [role="group"]').getAttribute('aria-label') === 'Начертание');
  const vertical = '.example-body[data-spec~="B8"] .tg-segmented--vertical';
  check('B8 --vertical stacks segments', await css(vertical, 'flex-direction') === 'column');
  for (const name of ['light', 'dark', 'ios-dark']) {
    await theme(name);
    for (const selector of [`${item}:has(input:checked)`, `${item}:not(:has(input:checked))`]) {
      const { ratio } = await page.evaluate(measureContrast, { selector });
      check(`B8 ${name}: ${selector.endsWith(':has(input:checked)') ? 'checked' : 'resting'} segment contrast ${ratio.toFixed(2)} ≥ 4.5`, ratio >= 4.5);
    }
  }
  await theme(null);
  await rtl(true);
  const first = await box(`${seg} label:nth-of-type(1)`), second = await box(`${seg} label:nth-of-type(3)`);
  check('B8 RTL: segments run from the right', first.left > second.left);
  await rtl(false);
} finally {
  console.log(`${await close()} wave 0 checks passed`);
}
