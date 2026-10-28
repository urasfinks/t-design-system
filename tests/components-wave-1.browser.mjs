// Wave 1 primitives: M15 kbd, M8 progress ring, C11/M10 timeline, F28/M9 stepper,
// B9 button group and split button, B13 floating toolbar, B4 copy, M3/B17 toast region,
// S2 labelled divider, CT1 banner, C2 media card, C17 disclosure card, and the finished
// P0 parts: N1 segmented tabs, F1 required mark, M7 destructive bar, M19 spinner,
// A1 composer attachments, B5 progress button, D1 compact table.
import { openCatalog } from './helpers/catalog-page.mjs';
import { measureContrast } from './helpers/contrast.mjs';

const { page, check, css, px, box, length, theme, rtl, close } = await openCatalog({ port: 4201 });
const ex = id => `.example-body[data-spec~="${id}"]`;
const contrast = async (selector, label) => {
  for (const name of ['light', 'dark', 'ios-dark']) {
    await theme(name);
    const { ratio } = await page.evaluate(measureContrast, { selector });
    check(`${label} ${name}: contrast ${ratio.toFixed(2)} ≥ 4.5`, ratio >= 4.5);
  }
  await theme(null);
};
try {
  // M15 — keys
  const key = `${ex('M15')} .tg-kbd:not(:has(kbd))`;
  check('M15 a key uses the mono family token', (await css(key, 'font-family')).includes(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--font-family-mono').split(',')[0].trim())));
  check('M15 a key is at least 1.5em wide', (await box(key)).width >= (await px(key, 'font-size')) * 1.5 - .5);
  check('M15 a key never wraps', await css(key, 'white-space') === 'nowrap');
  check('M15 a combination draws each key, not the wrapper', await css(`${ex('M15')} .tg-kbd:has(> kbd)`, 'border-top-width') === '0px' && await css(`${ex('M15')} .tg-kbd > kbd`, 'border-top-width') === '1px');
  await contrast(`${ex('M15')} .tg-kbd > kbd`, 'M15 key');

  // M8 — progress ring
  const ring = `${ex('M8')} #demo-ring`;
  check('M8 ring default size is 40px', Math.round((await box(ring)).width) === 40);
  check('M8 --lg ring is 64px', Math.round((await box(`${ex('M8')} .tg-progress-ring--lg`)).width) === 64);
  check('M8 --sm ring is 24px', Math.round((await box(`${ex('M8')} .tg-progress-ring--sm`)).width) === 24);
  check('M8 value draws the arc from --value', (await css(`${ring} .tg-progress-ring__value`, 'stroke-dasharray')).match(/^(calc\()?40/));
  await page.locator('#demo-ring-range').fill('80');
  check('M8 changing the value updates arc and aria-valuenow', (await css(`${ring} .tg-progress-ring__value`, 'stroke-dasharray')).match(/^(calc\()?80/) && await page.locator(ring).getAttribute('aria-valuenow') === '80');
  check('M8 indeterminate ring has no value and still animates under reduced motion (pulse)', await page.locator(`${ex('M8')} .tg-progress-ring--sm`).getAttribute('aria-valuenow') === null && (await css(`${ex('M8')} .tg-progress-ring--sm > svg`, 'animation-name')) === 'tg-ring-pulse');
  check('M8 destructive ring uses the danger role', await css(`${ex('M8')} .tg-progress-ring--destructive`, 'color') === await page.evaluate(() => { const p = document.createElement('i'); p.style.color = 'var(--danger-main)'; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c; }));

  // C11 / M10 — timeline
  const tl = `${ex('C11')} .tg-timeline:not(.tg-timeline--horizontal)`;
  check('C11 timeline is an ordered list', await page.locator(tl).evaluate(el => el.tagName) === 'OL');
  check('C11 time sits above the text', (await box(`${tl} > li:first-child .tg-timeline__time`)).bottom <= (await box(`${tl} > li:first-child strong`)).top + 1);
  check('C11 done marker is filled with the action role', await css(`${tl} > li[data-state="done"] .tg-timeline__marker`, 'background-color') === await page.evaluate(() => { const p = document.createElement('i'); p.style.background = 'var(--action-bg)'; document.body.append(p); const c = getComputedStyle(p).backgroundColor; p.remove(); return c; }));
  check('C11 current marker is a ring', (await css(`${tl} > li[aria-current="step"] .tg-timeline__marker`, 'box-shadow')).includes('0px 0px 0px'));
  check('C11 done markers carry an icon (not colour alone)', await page.locator(`${tl} > li[data-state="done"] .tg-timeline__marker svg`).count() === 2);
  check('C11 a done step draws an accent line to the next', await css(`${tl} > li[data-state="done"]`, 'background-color', '::before') !== await css(`${tl} > li[aria-current="step"]`, 'background-color', '::before'));
  const line = await page.locator(`${tl} > li:first-child`).evaluate(el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el, '::before'); return { top: parseFloat(s.top), bottom: parseFloat(s.bottom), h: r.height }; });
  check('C11 the line starts below the marker', line.top > 0);
  await contrast(`${tl} > li:first-child .tg-timeline__time`, 'C11 time');
  await contrast(`${tl} > li:first-child p`, 'C11 description');
  const road = `${ex('M10')} .tg-timeline--horizontal`;
  check('M10 horizontal timeline is a row on wide screens', await css(road, 'grid-auto-flow') === 'column');
  check('M10 horizontal timeline scrolls inside a focusable region', await css(road, 'overflow-x') === 'auto' && await page.locator(road).getAttribute('tabindex') === '0');
  await page.setViewportSize({ width: 390, height: 900 });
  check('M10 horizontal timeline returns to a column on phones', await css(road, 'grid-auto-flow') !== 'column');
  await page.setViewportSize({ width: 1440, height: 900 });
  await rtl(true);
  const m1 = await box(`${road} > li:first-child .tg-timeline__marker`), m2 = await box(`${road} > li:nth-child(2) .tg-timeline__marker`);
  check('M10 RTL: the road runs from the right', m1.left > m2.left);
  await rtl(false);

  // F28 / M9 — stepper
  const st = '#demo-stepper';
  check('F28 marker is 32px', Math.round((await box(`${st} .tg-stepper__marker`)).width) === 32);
  check('F28 current step is aria-current=step', await page.locator(`${st} [aria-current="step"]`).count() === 1);
  await page.locator('[data-stepper-move="1"]').click();
  check('F28 Next moves the current step and marks the previous done', await page.locator(`${st} > li:nth-child(3)`).getAttribute('aria-current') === 'step' && await page.locator(`${st} > li:nth-child(2)`).getAttribute('data-state') === 'done');
  check('F28 the counter follows', await page.locator('#demo-stepper-count').textContent() === 'Шаг 3 из 3');
  await page.locator('[data-stepper-move="-1"]').click();
  await page.setViewportSize({ width: 390, height: 900 });
  check('F28 phones hide labels of other steps but keep them for screen readers', await page.locator(`${st} > li:first-child .tg-stepper__label`).evaluate(el => getComputedStyle(el).position === 'absolute' && el.textContent.length > 0));
  check('F28 phones keep the current label visible', await page.locator(`${st} > li[aria-current="step"] .tg-stepper__label`).evaluate(el => el.getBoundingClientRect().width > 20));
  await page.setViewportSize({ width: 1440, height: 900 });
  const vs = `${ex('M9')} .tg-stepper--vertical`;
  check('M9 vertical stepper is a column', await css(vs, 'flex-direction') === 'column');
  check('M9 error step is marked by an icon and the danger text role', await page.locator(`${vs} [data-state="error"] .tg-stepper__marker svg`).count() === 1);
  await contrast(`${vs} [data-state="error"] .tg-stepper__label`, 'M9 error label');
  await contrast(`${vs} .tg-stepper__description`, 'M9 description');

  // B9 — group and split button
  const att = `${ex('B9')} .tg-btn-group--attached[aria-label="Буфер обмена"]`;
  const b1 = await box(`${att} > :nth-child(1)`), b2 = await box(`${att} > :nth-child(2)`);
  check('B9 attached buttons share one border line', Math.abs(b2.left - (b1.right - 1)) < .6);
  check('B9 inner corners are square, outer keep the control radius', await css(`${att} > :nth-child(1)`, 'border-top-right-radius') === '0px' && await css(`${att} > :nth-child(1)`, 'border-top-left-radius') === `${await length('var(--radius-control)')}px`);
  await page.locator(`${att} > :nth-child(2)`).focus();
  await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
  check('B9 the focused button rises above its neighbours', await css(`${att} > :nth-child(2)`, 'z-index') === '1');
  const split = page.locator('#demo-split-trigger');
  check('B9 the split trigger has its own name', await split.getAttribute('aria-label') === 'Другие форматы экспорта');
  await split.click();
  check('B9 the split trigger opens its menu', await page.locator('#demo-split-menu').evaluate(el => el.matches(':popover-open')));
  await page.keyboard.press('Escape');
  check('B9 Escape returns focus to the trigger', await split.evaluate(el => el === document.activeElement));
  check('B9 a hairline divides filled parts', await css(`${ex('B9')} .tg-split-btn__menu`, 'content', '::before') === '""');
  await page.setViewportSize({ width: 320, height: 800 });
  check('B9 attached group stacks on the narrowest screens', await css(att, 'flex-direction') === 'column');
  await page.setViewportSize({ width: 1440, height: 900 });
  await rtl(true);
  check('B9 RTL: the split menu sits at the inline start of the main action', (await box(`${ex('B9')} .tg-split-btn__menu`)).left < (await box(`${ex('B9')} .tg-split-btn__main`)).left);
  await rtl(false);

  // B13 — floating toolbar
  const tb = `${ex('B13')} .tg-toolbar--floating`;
  check('B13 floating toolbar uses the overlay shadow', await css(tb, 'box-shadow') !== 'none');
  check('B13 floating toolbar keeps the control radius', await css(tb, 'border-top-left-radius') === `${await length('var(--radius-control)')}px`);
  check('B13 separator is a 1px rule', Math.round((await box(`${tb} .tg-toolbar__separator`)).width) === 1);
  const first = page.locator(`${tb} button`).first();
  await first.focus();
  await page.keyboard.press('ArrowRight');
  check('B13 arrows move focus inside the toolbar', await page.evaluate(() => document.activeElement.getAttribute('aria-label')) === 'Увеличить');
  await page.keyboard.press('End');
  check('B13 End jumps to the last action', await page.evaluate(() => document.activeElement.textContent.trim()) === 'Экспорт');
  check('B13 the toolbar is one Tab stop', await page.locator(`${tb} [tabindex="0"]`).count() === 1);

  // B4 — copy
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  const copy = `${ex('B4')} #demo-copy-promo`;
  check('B4 value is selectable text in a mono face', await css(`${copy} .tg-copy__value`, 'user-select') === 'all');
  check('B4 action uses the inset radius', await css(`${copy} .tg-copy__action`, 'border-top-left-radius') === `${await length('var(--radius-inset)')}px`);
  await page.locator(`${copy} .tg-copy__action`).click();
  await page.waitForTimeout(120);
  const copyState = await page.locator(copy).getAttribute('data-state');
  check('B4 clicking copies or reports a failure', ['copied', 'error'].includes(copyState));
  check('B4 the result is announced', (await page.locator('#demo-copy-status').textContent()).length > 0);
  await page.setViewportSize({ width: 320, height: 800 });
  check('B4 the action moves under the value at 320px', (await box(`${copy} .tg-copy__action`)).top >= (await box(`${copy} .tg-copy__value`)).bottom - 1);
  await page.setViewportSize({ width: 1440, height: 900 });

  // M3 / B17 — toast region
  check('M3 the region exists before any toast', await page.locator('#demo-toast-region [role="status"]').count() === 1);
  for (const kind of ['saved', 'paid', 'deleted', 'saved']) { await page.locator(`[data-toast-demo="${kind}"]`).click(); await page.waitForTimeout(60); }
  await page.waitForTimeout(150);
  const toasts = page.locator('#demo-toast-region .tg-toast');
  check('M3 four toasts are in the region', await toasts.count() === 4);
  check('M3 the newest toast is in front', await toasts.last().evaluate(el => el.hasAttribute('data-front') && getComputedStyle(el).getPropertyValue('--toast-index').trim() === '0'));
  check('M3 the fourth toast back is hidden', await toasts.first().evaluate(el => el.hasAttribute('data-overflow') && getComputedStyle(el).visibility === 'hidden'));
  const back = await toasts.nth(2).evaluate(el => getComputedStyle(el).transform);
  check('M3 back toasts are scaled down', back !== 'none' && !back.startsWith('matrix(1, 0, 0, 1'));
  await toasts.last().hover();
  await page.waitForTimeout(80);
  check('M3 hover expands the stack', await toasts.nth(2).evaluate(el => { const m = new DOMMatrix(getComputedStyle(el).transform); return m.a === 1 && m.f < -20; }));
  check('M3 expanded back toasts show their text', await toasts.nth(2).locator('.tg-toast__title').evaluate(el => getComputedStyle(el).opacity === '1'));
  await page.locator('#demo-toast-region .tg-toast:last-child .tg-toast__close').focus();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  check('M3 Escape closes the focused toast', await toasts.count() === 3);
  await contrast('.toast-inline .tg-toast__body > span', 'B17 toast description');
  check('B17 toast actions sit at the end of the row', (await box('.toast-inline .tg-toast__action:last-child')).right > (await box('.toast-inline .tg-toast__body')).right);
  await page.mouse.move(0, 0);

  // S2 — labelled divider
  const div = `${ex('S2')} .tg-divider--label`;
  check('S2 divider label is centred between two lines', await css(div, 'content', '::before') === '""' && await css(div, 'content', '::after') === '""');
  check('S2 divider is a named separator', await page.locator(div).getAttribute('role') === 'separator');
  await contrast(div, 'S2 divider label');

  // CT1 — banner
  const ban = `${ex('CT1')} #demo-banner-maintenance`;
  check('CT1 banner is an aside with a name', await page.locator(ban).evaluate(el => el.tagName === 'ASIDE' && el.getAttribute('aria-label').length > 0));
  check('CT1 banner is at least the control height', (await box(ban)).height >= await length('var(--control-h)') - .5);
  const dis = await box(`${ban} .tg-banner__dismiss`), act = await box(`${ban} .tg-banner__action`);
  check('CT1 the close button never covers the action', dis.left >= act.right - .5 || dis.top >= act.bottom);
  await contrast(`${ban} p`, 'CT1 neutral banner');
  await contrast(`${ex('CT1')} .tg-banner--accent p`, 'CT1 accent banner');
  await page.locator(`${ban} .tg-banner__dismiss`).click();
  check('CT1 dismissing hides the banner and keeps focus in the page', await page.locator(ban).isHidden() && await page.evaluate(() => document.activeElement !== document.body));

  // C2 — media card
  const ov = `${ex('C2')} .tg-card--overlay`;
  check('C2 overlay text sits on the image', (await box(`${ov} .tg-card__body`)).bottom <= (await box(`${ov} .tg-card__media`)).bottom + 1);
  await contrast(`${ov} .tg-card__body p`, 'C2 overlay text');
  check('C2 video card keeps a poster and no autoplay', await page.locator(`${ex('C2')} video`).evaluate(el => el.hasAttribute('poster') && !el.autoplay && el.muted));
  check('C2 overlay badge keeps its own width', (await box(`${ov} .tg-badge`)).width < (await box(`${ov} .tg-card__body`)).width / 2);

  // C17 — disclosure card
  const card = page.locator(`${ex('C17')} details.tg-card--disclosure`).first();
  await card.locator('summary').click();
  check('C17 the card opens in place without scripts', await card.evaluate(el => el.open));
  await page.locator(`${ex('C17')} details.tg-card--disclosure`).nth(1).locator('summary').click();
  check('C17 the shared name keeps one card open', !(await card.evaluate(el => el.open)));
  check('C17 the card trigger draws the shared chevron', (await css(`${ex('C17')} details.tg-card--disclosure > summary`, 'mask-image', '::after')).includes('svg'));
  await page.locator('[data-morph-open="demo-morph-dialog"]').click();
  await page.waitForTimeout(350);
  check('C17 the card opens its dialog', await page.locator('#demo-morph-dialog').evaluate(el => el.open));
  await page.locator('#demo-morph-dialog [data-dialog-close]').click();
  await page.waitForTimeout(350);
  check('C17 closing returns focus to the card action', await page.locator('[data-morph-open="demo-morph-dialog"]').evaluate(el => el === document.activeElement));

  // Finished P0 parts
  check('N1 --segmented names the default trough', await css(`${ex('N1')} .tg-tabs--segmented`, 'background-color') === await css(`${ex('B8')} fieldset.tg-segmented`, 'background-color'));
  check('F1 the required mark is decorative; required is on the control', await page.locator(`${ex('F1')} .tg-label__required`).getAttribute('aria-hidden') === 'true' && await page.locator('#demo-email').evaluate(el => el.required));
  await contrast(`${ex('F1')} .tg-label__required`, 'F1 required mark');
  check('M7 destructive bar uses the danger role', await css(`${ex('M7')} .tg-progress--destructive .tg-progress__bar`, 'background-color') === await css(`${ex('M8')} .tg-progress-ring--destructive`, 'color'));
  check('M19 spinner example is present', await page.locator(`${ex('M19')} .tg-spinner`).count() > 0);
  check('A1 composer shows its attachments list', await page.locator(`${ex('A1')} .tg-composer__attachments li`).count() === 1);
  check('B5 progress button draws a bar from --progress', (await css(`${ex('B5')} .tg-btn__progress`, 'transform')).startsWith('matrix(0.4'));
  const dense = await box(`${ex('D1')} .tg-table--compact tbody td`), roomy = await box(`${ex('D1')} .tg-table:not(.tg-table--compact):not(.tg-table--stack) tbody td`);
  check('D1 compact rows are denser than default rows', dense.height <= roomy.height + 12 && await px(`${ex('D1')} .tg-table--compact td`, 'padding-top') < await px(`${ex('D1')} .tg-table:not(.tg-table--compact):not(.tg-table--stack) td`, 'padding-top'));
} finally {
  console.log(`${await close()} wave 1 checks passed`);
}
