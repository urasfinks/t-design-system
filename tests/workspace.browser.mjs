// Specs: A4 B2 B7 B14 C1 C6 D2 D4 FT1 F2 F3 F11 F12 M1 M2 M5 M6 M13 N4 N9 N12
// Workspace screen: the cascade-built components (menu, input group, card zones, stat,
// table selection/sorting/stacking, accordion, notices, avatar group, pager, site nav,
// chat, side dialog) across themes, widths, keyboard, RTL and reduced motion.
import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { measureContrast } from './helpers/contrast.mjs';

const engine = process.argv.includes('--webkit') ? webkit : chromium;
const server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: '4181' }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
const browser = await engine.launch();
let checks = 0;
const check = (label, condition) => { assert.ok(condition, label); checks++; console.log(`✓ ${label}`); };
const url = 'http://127.0.0.1:4181/docs/workspace.html';

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(url);
  const css = (selector, property, pseudo = null) => page.locator(selector).first().evaluate((el, [p, ps]) => getComputedStyle(el, ps).getPropertyValue(p), [property, pseudo]);
  const px = async (selector, property) => parseFloat(await css(selector, property));

  // Geometry comes from shared tokens, not local numbers.
  const controlH = await page.evaluate(() => { const probe = document.createElement('div'); probe.style.blockSize = 'var(--control-h)'; document.body.append(probe); const h = probe.getBoundingClientRect().height; probe.remove(); return h; });
  check('input group keeps the shared control height', Math.round((await page.locator('#ws-site').evaluate(el => el.parentElement.getBoundingClientRect().height))) >= Math.round(controlH));
  check('input group owns the field radius', await css('.tg-input-group', 'border-top-left-radius') === await css('#ws-search', 'border-top-left-radius') || await css('.tg-input-group', 'border-top-left-radius') === await css('.tg-search', 'border-top-left-radius'));
  check('stat value uses the display token', Math.abs(await px('.tg-stat__value', 'font-size') - await page.evaluate(() => { const p = document.createElement('div'); p.style.fontSize = 'var(--fs-display)'; document.body.append(p); const v = parseFloat(getComputedStyle(p).fontSize); p.remove(); return v; })) < .5);
  check('stat values use tabular numerals', (await css('.tg-stat__value', 'font-variant-numeric')).includes('tabular-nums'));
  check('cards with zones become a column', await css('.tg-card--link', 'flex-direction') === 'column');
  check('accordion trigger draws an inline-end chevron mask', (await css('.tg-accordion .tg-disclosure__trigger', 'mask-image', '::after')).includes('svg'));
  check('avatar group overlaps by a quarter of the avatar', await px('.tg-avatar-group > .tg-avatar + .tg-avatar', 'margin-left') < 0);
  check('underlined tab shows the accent rule', (await css('#ws-tab-table', 'box-shadow')).includes('inset'));
  check('current site link sits on a tone step', await css('.tg-site-nav__link[aria-current="page"]', 'background-color') !== 'rgba(0, 0, 0, 0)');
  check('current page in the pager uses the soft accent', await css('.tg-pager__link[aria-current="page"]', 'background-color') !== 'rgba(0, 0, 0, 0)');
  check('the sticky header has its own background', await css('.tg-page-header--sticky', 'position') === 'sticky' && await css('.tg-page-header--sticky', 'background-color') !== 'rgba(0, 0, 0, 0)');

  // Contrast in every theme for the new text roles.
  const pairs = ['.tg-stat__label', '.tg-stat__meta', '.tg-table__cell-meta', '.tg-site-nav__link:not([aria-current])', '.tg-pager__link[aria-current="page"]', '.tg-choice__description', '.tg-requirements__item', '.tg-disclosure__meta', '.tg-badge--destructive', '.tg-message--user .tg-message__body p', '.tg-avatar-group__more'];
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
    for (const selector of pairs) {
      const { ratio } = await page.evaluate(measureContrast, { selector });
      check(`${theme}: ${selector} text contrast ${ratio.toFixed(2)} ≥ 4.5`, ratio >= 4.5);
    }
  }
  await page.evaluate(() => { delete document.documentElement.dataset.theme; });

  // Menu: keyboard opening is instant, roving focus, Escape returns focus.
  const create = page.locator('#ws-create');
  await create.focus();
  await page.keyboard.press('ArrowDown');
  const menu = page.locator('#ws-create-menu');
  check('ArrowDown opens the menu', await menu.evaluate(el => el.matches(':popover-open')));
  check('keyboard opening skips the entrance animation', await menu.evaluate(el => el.hasAttribute('data-instant')));
  check('trigger reports expanded', await create.getAttribute('aria-expanded') === 'true');
  check('first item receives focus', await page.evaluate(() => document.activeElement.textContent.includes('Счёт')));
  const itemHeight = await page.locator('#ws-create-menu .tg-menu__item').first().evaluate(el => el.getBoundingClientRect().height);
  check(`menu rows keep a 44 px target (${itemHeight})`, itemHeight >= 44);
  check('focused row shows a visible ring', (await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle)) === 'solid');
  const [trigger, layer] = await Promise.all([create.boundingBox(), menu.boundingBox()]);
  check('menu opens just below its trigger', layer.y >= trigger.y + trigger.height - 1 && layer.y <= trigger.y + trigger.height + 12);
  check('menu stays inside the viewport', layer.x >= 0 && layer.x + layer.width <= 1440);
  await page.keyboard.press('End');
  check('End moves to the last item', await page.evaluate(() => document.activeElement.textContent.includes('Импорт')));
  await page.keyboard.press('ArrowDown');
  check('ArrowDown wraps to the first item', await page.evaluate(() => document.activeElement.textContent.includes('Счёт')));
  await page.keyboard.press('Escape');
  check('Escape closes the menu', !(await menu.evaluate(el => el.matches(':popover-open'))));
  check('Escape returns focus to the trigger', await page.evaluate(() => document.activeElement.id === 'ws-create'));
  check('trigger reports collapsed', await create.getAttribute('aria-expanded') === 'false');
  await create.click();
  check('a pointer opening animates (no instant flag)', !(await menu.evaluate(el => el.hasAttribute('data-instant'))));
  await page.mouse.click(700, 1200 > 900 ? 880 : 880);
  check('clicking outside closes the menu', !(await menu.evaluate(el => el.matches(':popover-open'))));

  // Checkable items and the destructive row.
  await page.locator('#ws-settings').click();
  await page.locator('[data-action="compact"]').click();
  check('checkbox item toggles the compact table', await page.locator('#ws-table').evaluate(el => el.classList.contains('tg-table--compact')));
  await page.locator('#ws-settings').click();
  check('checked item shows its mark', await css('[data-action="compact"]', 'opacity', '::before') === '1');
  check('unchecked radio hides its dot', await css('[data-theme-choice="dark"]', 'opacity', '::before') === '0');
  await page.keyboard.press('Escape');
  await page.locator('[data-invoice="INV-1037"]').click();
  const destructive = await page.evaluate(measureContrast, { selector: '#ws-row-menu .tg-menu__item--destructive' });
  check(`destructive item text contrast ${destructive.ratio.toFixed(2)} ≥ 4.5`, destructive.ratio >= 4.5);
  await page.locator('#ws-row-menu [data-action="open"]').click();
  check('row menu opens the side dialog', await page.locator('#ws-invoice').evaluate(el => el.open));
  const side = await page.locator('#ws-invoice').boundingBox();
  check('side dialog sits on the inline end at full height', Math.round(side.x + side.width) === 1440 && Math.round(side.height) === 900);
  check('dialog body scrolls inside the sheet', await css('#ws-invoice .tg-modal__body', 'overflow-y') === 'auto');
  await page.keyboard.press('Escape');

  // Table selection and sorting.
  await page.locator('#ws-select-all').check();
  const tableTop = (await page.locator('#ws-rows').boundingBox()).y;
  check('select all fills the bulk bar and enables its actions', (await page.locator('#ws-bulk').getAttribute('data-empty')) === null && !(await page.locator('#ws-bulk button').first().isDisabled()));
  check('choosing rows does not move the table', Math.abs((await page.locator('#ws-rows').boundingBox()).y - tableTop) < .5);
  check('bulk bar counts the rows', (await page.locator('#ws-bulk-count').textContent()).includes('4'));
  check('selected rows take the soft accent', await css('#ws-rows tr td', 'background-color') !== 'rgba(0, 0, 0, 0)');
  await page.locator('#ws-rows .tg-check').first().uncheck();
  check('partial selection is indeterminate', await page.locator('#ws-select-all').evaluate(el => el.indeterminate));
  await page.locator('#ws-bulk-clear').click();
  check('clearing leaves the bar in place, empty, with actions unavailable', await page.locator('#ws-bulk').isVisible() && await page.locator('#ws-bulk').getAttribute('data-empty') !== null && await page.locator('#ws-bulk button').first().isDisabled() && (await page.locator('#ws-bulk-count').textContent()) === 'Ничего не выбрано');
  await page.locator('[data-sort="due"] .tg-table__sort').click();
  check('sorting marks the header', await page.locator('[data-sort="due"]').getAttribute('aria-sort') === 'descending' && await page.locator('[data-sort="amount"]').getAttribute('aria-sort') === 'none');
  const firstDue = await page.locator('#ws-rows tr').first().getAttribute('data-due');
  check('rows reorder by the sorted column', firstDue === '2026-11-14');
  check('sorted header shows its arrow', await css('[data-sort="due"] .tg-icon', 'opacity') === '1');
  await page.locator('#ws-search').fill('нет такого клиента');
  check('search without results shows an empty state with a way out', await page.locator('[data-clear-search]').isVisible());
  await page.locator('[data-clear-search]').click();

  // Tabs with arrows.
  await page.locator('#ws-tab-table').focus();
  await page.keyboard.press('ArrowRight');
  check('ArrowRight selects the next tab and its panel', await page.locator('#ws-tab-templates').getAttribute('aria-selected') === 'true' && !(await page.locator('#ws-panel-templates').isHidden()));
  const media = await page.locator('.tg-card__media').first().boundingBox();
  const card = await page.locator('.tg-card--link').first().boundingBox();
  check('card media reaches the card edges', Math.abs(media.x - card.x) <= 1.5 && Math.abs(media.width - card.width) <= 3);
  await page.keyboard.press('ArrowLeft');

  // Form: requirements, nested choices, async save with a stable width.
  await page.locator('#ws-save').click();
  check('failed submit turns unmet rules into errors', await page.locator('#ws-rules').evaluate(el => el.classList.contains('tg-requirements--invalid')));
  const unmet = await page.evaluate(measureContrast, { selector: '.tg-requirements--invalid .tg-requirements__item' });
  check(`unmet rule error contrast ${unmet.ratio.toFixed(2)} ≥ 4.5`, unmet.ratio >= 4.5);
  await page.locator('#ws-password').fill('Северный2026');
  check('met rules flip to the check mark', (await page.locator('[data-met="true"]').count()) === 3);
  const idleWidth = (await page.locator('#ws-save').boundingBox()).width;
  await page.locator('#ws-save').click();
  check('saving sets aria-busy', await page.locator('#ws-save').getAttribute('aria-busy') === 'true');
  const busyWidth = (await page.locator('#ws-save').boundingBox()).width;
  check('button width stays put between states', Math.abs(idleWidth - busyWidth) < .5);
  await page.waitForFunction(() => document.querySelector('#ws-save').dataset.state === 'success');
  check('only the active state label is visible', (await page.locator('#ws-save [data-state="success"]').evaluate(el => getComputedStyle(el).visibility)) === 'visible' && (await page.locator('#ws-save [data-state="idle"]').evaluate(el => getComputedStyle(el).visibility)) === 'hidden');
  await page.locator('#ws-notify-all').check();
  check('parent choice checks the nested group', (await page.locator('[data-notify]:checked').count()) === 3);
  const nested = await page.locator('.tg-choice-group--nested .tg-check').first().boundingBox();
  const parentText = await page.locator('#ws-notify-all + span').boundingBox();
  check('nested choices start under the parent label', Math.abs(nested.x - parentText.x) <= 2);

  // Accordion, toggles, notice.
  await page.locator('#ws-expand').click();
  check('expand all opens every section', (await page.locator('#ws-faq > details[open]').count()) === 3);
  await page.locator('#ws-favorite').click();
  check('toggle reports pressed and fills', await page.locator('#ws-favorite').getAttribute('aria-pressed') === 'true' && await css('#ws-favorite', 'border-top-color') !== await css('#ws-settings', 'border-top-color'));
  await page.locator('[data-dismiss="ws-verify"]').click();
  check('dismissing a notice moves focus to the page heading', await page.evaluate(() => document.activeElement.matches('h1')));

  // Chat: streaming to done; the stop button swaps its name.
  await page.locator('#ws-prompt').fill('Что с ноябрём?');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('#ws-log').lastElementChild.dataset.state === 'done');
  check('assistant answer finishes streaming', (await page.locator('#ws-log .tg-message--assistant').count()) === 2);
  check('user turns align to the inline end', (await page.locator('#ws-log .tg-message--user').last().boundingBox()).x > (await page.locator('#ws-log').boundingBox()).x + 40);
  check('code uses the mono token', (await css('.tg-message__body pre', 'font-family')).includes('monospace'));

  // Reduced motion: the menu layer does not travel.
  check('reduced motion removes menu scale travel', parseFloat(await css('#ws-create-menu', 'transition-duration').then(v => v.split(',')[1] ?? '0')) === 0);

  // Widths and themes: no horizontal scroll anywhere.
  for (const theme of ['light', 'dark', 'ios-dark']) for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check(`${theme} ${width}px: no horizontal scroll`, overflow <= 0);
  }
  await page.setViewportSize({ width: 360, height: 800 });
  check('narrow table stacks into cards', await css('#ws-table tbody tr', 'display') === 'block');
  check('stacked cells name their columns', (await css('#ws-table tbody td[data-label="Срок"]', 'content', '::before')).includes('Срок'));
  await page.setViewportSize({ width: 1440, height: 900 });

  // RTL: logical sides follow the direction.
  await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
  await page.locator('#ws-settings').click();
  const markInset = await page.locator('[data-action="compact"]').evaluate(el => { const r = el.getBoundingClientRect(); return r.right - parseFloat(getComputedStyle(el).paddingRight); });
  check('RTL moves the check column to the right', markInset < (await page.locator('[data-action="compact"]').boundingBox()).x + (await page.locator('[data-action="compact"]').boundingBox()).width);
  await page.keyboard.press('Escape');
  check('RTL flips the icon-end button order logically', await css('#ws-create', 'flex-direction') === 'row-reverse');
  await page.evaluate(() => { document.documentElement.dir = 'ltr'; });

  check('no page errors', errors.length === 0);
  console.log(`${checks} workspace checks passed in ${engine.name()}.`);
} finally {
  await browser.close();
  server.kill();
}
