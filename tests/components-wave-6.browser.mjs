// Wave 6 — assistant, text and content cards: A5 agent progress, A6 approval, T1 editor
// shell, T2 selection toolbar, TS1 testimonial, PR2 pricing card; existing B1 B3 B16.
import { openCatalog } from './helpers/catalog-page.mjs';
import { measureContrast } from './helpers/contrast.mjs';

const { page, check, css, px, box, length, theme, rtl, close } = await openCatalog({ port: 4205 });
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
  // A5 — agent steps
  const steps = `${ex('A5')} .tg-agent-steps`;
  check('A5 steps are a list with text and an icon for each state', await page.locator(`${steps} > .tg-agent-step[data-state]`).count() === 3 && await page.locator(`${steps} .tg-agent-step__icon > *`).count() === 3);
  check('A5 a running step shows a spinner', await page.locator(`${steps} [data-state="running"] .tg-spinner`).count() === 1);
  check('A5 tool results open in a native disclosure', await page.locator(`${steps} details.tg-agent-step__detail > summary`).count() === 1);
  check('A5 technical names are mono only inside code', (await css(`${steps} code`, 'font-family')).includes('mono') || (await css(`${steps} code`, 'font-family')).includes('Menlo') || (await css(`${steps} code`, 'font-family')).includes('Mono'));
  await contrast(`${steps} [data-state="done"] .tg-agent-step__label`, 'A5 done label');
  await contrast(`${steps} [data-state="error"] .tg-agent-step__label`, 'A5 error label');
  await page.waitForFunction(() => document.getElementById('demo-agent-running').dataset.state === 'done', null, { timeout: 8000 });
  check('A5 the finished step is announced once, the timer is not', (await page.locator('#demo-agent-status').textContent()).includes('Подготовил'));

  // A6 — approval
  const approval = page.locator('#demo-approval');
  check('A6 the approval is a named section with options and two actions', await approval.getAttribute('aria-labelledby') === 'demo-approval-title' && await approval.locator('input[type="radio"]').count() === 2 && await approval.locator('[data-approval]').count() === 2);
  await contrast('#demo-approval .tg-approval__description', 'A6 consequence text');
  await approval.locator('input[value="firm"]').check();
  await approval.locator('[data-approval="allow"]').click();
  check('A6 after the decision no controls remain', await approval.locator('button, input').count() === 0);
  check('A6 the outcome is written as text', (await approval.textContent()).includes('Разрешено') && (await approval.textContent()).includes('строгий'));
  check('A6 focus moves to the composer', await page.evaluate(() => document.activeElement.matches('#demo-chat-form textarea')));

  // T1 — editor shell
  const content = page.locator('#demo-editor-content');
  check('T1 the content is a multiline textbox with a name', await content.getAttribute('role') === 'textbox' && await content.getAttribute('aria-multiline') === 'true');
  check('T1 content keeps the reading measure', (await box('#demo-editor-content')).width <= (await length('var(--layout-reading-width)')) + (await length('var(--space-8)')) * 2 + 1);
  check('T1 headings inside use the system scale', await css('#demo-editor-content h2', 'font-size') === `${await length('var(--fs-display)')}px` || Math.abs(await px('#demo-editor-content h2', 'font-size') - await length('var(--fs-display)')) < .6);
  await page.locator('#demo-editor-content strong').click();
  await page.waitForTimeout(80);
  check('T1 formatting buttons follow the selection', await page.locator('.tg-editor__toolbar [data-command="bold"]').getAttribute('aria-pressed') === 'true');
  await page.keyboard.press('Escape');
  check('T1 Escape selects the whole block', await page.locator('#demo-editor-content .tg-editor__block[aria-selected="true"]').count() === 1);
  check('T1 a selected block has the accent frame on the soft accent', (await css('#demo-editor-content [aria-selected="true"]', 'box-shadow')).includes('inset'));
  await page.keyboard.press('ArrowDown');
  check('T1 ArrowDown moves the block selection', (await page.locator('#demo-editor-content [aria-selected="true"]').textContent()) === 'Просрочка');
  await content.focus();
  await page.locator('.tg-editor__toolbar [data-command="italic"]').focus();
  await page.keyboard.press('ArrowRight');
  check('T1 the formatting toolbar is one Tab stop with arrow keys', await page.evaluate(() => document.activeElement.dataset.command) === 'underline');
  await contrast('#demo-editor .tg-editor__status span', 'T1 status');
  await contrast('#demo-editor-content blockquote', 'T1 quote');

  // T2 — selection toolbar
  await page.locator('#demo-editor-content p').first().evaluate(el => { const range = document.createRange(); range.setStart(el.firstChild, 0); range.setEnd(el.firstChild, 12); const s = getSelection(); s.removeAllRanges(); s.addRange(range); });
  await page.waitForTimeout(120);
  const toolbar = page.locator('#demo-selection-toolbar');
  check('T2 a selection shows the toolbar', await toolbar.isVisible());
  const tb = await box('#demo-selection-toolbar'), sel = await page.evaluate(() => getSelection().getRangeAt(0).getBoundingClientRect().toJSON());
  check('T2 the toolbar does not cover the selected text', tb.bottom <= sel.top + 1 || tb.top >= sel.bottom - 1);
  check('T2 the toolbar uses the floating surface', (await css('#demo-selection-toolbar', 'box-shadow')) !== 'none');
  await content.focus();
  await page.keyboard.press('Alt+F10');
  check('T2 Alt+F10 moves focus into the toolbar', await page.evaluate(() => document.activeElement.closest('#demo-selection-toolbar, .tg-editor__toolbar') !== null));
  await page.keyboard.press('Escape');

  // TS1 — testimonial
  const quote = `${ex('TS1')} .tg-testimonial:not(:has(.tg-testimonial__media))`;
  check('TS1 the quote is a blockquote in a figure with a cite', await page.locator(`${quote} blockquote`).count() === 1 && await page.locator(`${quote} cite`).count() === 1);
  check('TS1 the quote is upright, not italic', await css(`${quote} .tg-testimonial__quote`, 'font-style') === 'normal');
  check('TS1 stars use the accent role and the score is text', (await css(`${quote} .tg-testimonial__stars`, 'background-image')).includes('linear-gradient') && (await page.locator(`${quote} .tg-sr-only`).textContent()) === 'Оценка 5 из 5');
  await contrast(`${quote} .tg-testimonial__author span > span`, 'TS1 author role');
  await page.setViewportSize({ width: 390, height: 900 });
  check('TS1 the photo moves above the text on phones', (await css(`${ex('TS1')} .tg-testimonial:has(.tg-testimonial__media)`, 'grid-template-columns')).split(' ').length === 1);
  await page.setViewportSize({ width: 1440, height: 900 });

  // PR2 — pricing
  const featured = `${ex('PR2')} .tg-card--featured`;
  const plain = `${ex('PR2')} .pricing-card:not(.tg-card--featured)`;
  check('PR2 the featured frame is 2px without changing the size', (await css(featured, 'box-shadow')).includes('inset') && Math.abs((await box(featured)).width - (await box(plain)).width) < 1);
  check('PR2 the price figure is large and the period quiet', await px(`${featured} .tg-price__value`, 'font-size') > await px(`${featured} .tg-price__period`, 'font-size'));
  check('PR2 included items get a check mask, excluded a dash with words', (await css(`${featured} .tg-feature-list__item:not(.tg-feature-list__item--off)`, 'mask-image', '::before')).includes('svg') && (await page.locator(`${featured} .tg-feature-list__item--off .tg-sr-only`).textContent()).includes('не входит'));
  check('PR2 the current plan button is disabled', await page.locator(`${ex('PR2')} .pricing-card button:disabled`).count() === 1);
  await contrast(`${featured} .tg-feature-list__item--off`, 'PR2 excluded item');
  await contrast(`${featured} .tg-price__period`, 'PR2 period');

  for (const id of ['B1', 'B3', 'B16']) check(`${id} has a catalog example`, await page.locator(ex(id)).count() === 1);
} finally {
  console.log(`${await close()} wave 6 checks passed`);
}
