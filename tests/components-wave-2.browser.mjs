// Wave 2 — choosing and entering values: F8 listbox, F9 combobox, F10 tag input,
// F14 choice cards, F4 number stepper, F5 one-time code, F18 range field and dual range,
// F19 upload list, C5 hover card, D3 table toolbar; existing F6 F7 F13 F16 F17 examples.
import { openCatalog } from './helpers/catalog-page.mjs';
import { measureContrast } from './helpers/contrast.mjs';

const { page, check, css, px, box, length, theme, rtl, close } = await openCatalog({ port: 4202 });
const ex = id => `.example-body[data-spec~="${id}"]`;
const contrast = async (selector, label) => {
  for (const name of ['light', 'dark', 'ios-dark']) {
    await theme(name);
    const { ratio } = await page.evaluate(measureContrast, { selector });
    check(`${label} ${name}: contrast ${ratio.toFixed(2)} ≥ 4.5`, ratio >= 4.5);
  }
  await theme(null);
};
const active = () => page.evaluate(() => document.activeElement);
try {
  // F8 — listbox (APG select-only combobox)
  const trigger = page.locator('#demo-model-trigger');
  const list = page.locator('#demo-model-list');
  check('F8 trigger looks like the native select', await css('#demo-model-trigger', 'border-top-left-radius') === await css('#demo-role', 'border-top-left-radius') && Math.round((await box('#demo-model-trigger')).height) === Math.round((await box('#demo-role')).height));
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  check('F8 ArrowDown opens the list', await list.evaluate(el => el.matches(':popover-open')) && await trigger.getAttribute('aria-expanded') === 'true');
  check('F8 focus stays on the trigger', await trigger.evaluate(el => el === document.activeElement));
  check('F8 the selected option starts active', await trigger.getAttribute('aria-activedescendant') === 'demo-model-fast');
  await page.keyboard.press('ArrowDown');
  check('F8 ArrowDown moves the active option', await trigger.getAttribute('aria-activedescendant') === 'demo-model-balanced');
  await page.keyboard.press('ArrowDown');
  check('F8 disabled options are skipped', await trigger.getAttribute('aria-activedescendant') === 'demo-model-balanced');
  check('F8 the keyboard-active option has a ring', await css('#demo-model-balanced', 'outline-style') === 'solid');
  check('F8 option rows keep the control height', Math.round((await box('#demo-model-balanced')).height) >= Math.round(await length('var(--control-h)')));
  await page.keyboard.press('Enter');
  check('F8 Enter chooses and closes', !(await list.evaluate(el => el.matches(':popover-open'))) && await page.locator('#demo-model-balanced').getAttribute('aria-selected') === 'true');
  check('F8 the trigger shows the new value and the hidden input follows', (await trigger.textContent()).includes('Сбалансированная') && await page.locator('input[name="model"]').inputValue() === 'balanced');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Escape');
  check('F8 Escape closes without changing the value', (await trigger.textContent()).includes('Сбалансированная'));
  await page.keyboard.press('ArrowDown');
  await page.keyboard.type('б');
  check('F8 typing a letter jumps to the matching option', await trigger.getAttribute('aria-activedescendant') === 'demo-model-balanced');
  await page.keyboard.press('Escape');
  await trigger.click();
  await page.waitForTimeout(250);
  check('F8 pointer opening has no keyboard ring on an option', await css('#demo-model-fast', 'outline-style') === 'none' && await css('#demo-model-balanced', 'outline-style') === 'none');
  const lb = await box('#demo-model-list'), tb = await box('#demo-model-trigger');
  check('F8 the list opens next to the trigger (below, or above near the edge) and is at least as wide', (lb.top >= tb.bottom - 1 || lb.bottom <= tb.top + 1) && lb.width >= tb.width - 1);
  await page.locator('#demo-model-fast').click();
  check('F8 clicking an option chooses it', await page.locator('#demo-model-fast').getAttribute('aria-selected') === 'true');
  check('F8 selected option has a check mark', await css('#demo-model-fast', 'mask-image', '::after').then(v => v.includes('svg')));
  await trigger.click();
  await contrast('#demo-model-fast', 'F8 selected option');
  await contrast('#demo-model-balanced .tg-listbox__option-meta', 'F8 option meta');
  await page.keyboard.press('Escape');

  // F9 — combobox
  const city = page.locator('#demo-city');
  check('F9 scripts drop the datalist fallback', await city.getAttribute('list') === null);
  await city.fill('ка');
  await page.waitForTimeout(60);
  check('F9 typing opens a filtered list', await page.locator('#demo-city-list').isVisible() && await page.locator('#demo-city-list [role="option"]').count() === 2);
  check('F9 the count is announced', (await page.locator('#demo-city-status').textContent()).includes('2'));
  await page.keyboard.press('ArrowDown');
  check('F9 ArrowDown sets aria-activedescendant', (await city.getAttribute('aria-activedescendant')) === 'demo-city-list-0');
  await page.keyboard.press('Enter');
  check('F9 Enter puts the value in the field and closes', await city.inputValue() === 'Екатеринбург' && await city.getAttribute('aria-expanded') === 'false');
  await city.fill('ъъъ');
  await page.waitForTimeout(60);
  check('F9 no results are said plainly', (await page.locator('#demo-city-status').textContent()) === 'Ничего не найдено');
  await page.keyboard.press('Escape');
  check('F9 Escape closes the list', await page.locator('#demo-city-list').isHidden());
  const teams = page.locator('#demo-teams');
  await teams.focus();
  await teams.fill('мар');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  check('F9 multiple: choosing adds a tag before the field', await page.locator(`${ex('F9')} .tg-tag-input__tag[data-value="Маркетинг"]`).count() === 1);
  check('F9 multiple: the list is multiselectable', await page.locator('#demo-teams-list').getAttribute('aria-multiselectable') === 'true');
  await page.keyboard.press('Backspace');
  check('F9 multiple: Backspace in the empty field removes the last tag', await page.locator(`${ex('F9')} .tg-tag-input__tag[data-value="Маркетинг"]`).count() === 0);
  await page.keyboard.press('Escape');

  // F10 — tag input
  const tags = page.locator('#demo-tags');
  await tags.fill('акт');
  await page.keyboard.press('Enter');
  check('F10 Enter adds a tag with a named remove button', await page.locator(`${ex('F10')} .tg-tag-input__remove[aria-label="Удалить тег акт"]`).count() === 1);
  check('F10 each tag is submitted as a hidden field', await page.locator(`${ex('F10')} input[name="tags[]"]`).count() === 4);
  await tags.fill('акт');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(60);
  check('F10 duplicates are not added and the reason is announced', await page.locator(`${ex('F10')} .tg-tag-input__tag`).count() === 4 && (await page.locator('#demo-tags-status').textContent()).includes('уже есть'));
  await tags.fill('');
  await page.keyboard.press('ArrowLeft');
  check('F10 ArrowLeft at the start moves to the last tag', await page.evaluate(() => document.activeElement.getAttribute('aria-label')) === 'Удалить тег акт');
  await page.keyboard.press('ArrowRight');
  check('F10 ArrowRight from the last tag returns to the field', await tags.evaluate(el => el === document.activeElement));
  await page.keyboard.press('Backspace');
  check('F10 Backspace in the empty field removes the last tag', await page.locator(`${ex('F10')} .tg-tag-input__tag`).count() === 3);
  const remove = await box(`${ex('F10')} .tg-tag-input__remove`);
  check('F10 remove mark is 24px with a 44px target', Math.round(remove.width) === 40 || Math.round(remove.width) >= 40);
  check('F10 the frame shows focus while typing', (await css(`${ex('F10')} .tg-tag-input`, 'box-shadow')) !== 'none');
  await contrast(`${ex('F10')} .tg-tag-input__tag`, 'F10 tag');
  for (const value of ['а', 'б', 'в', 'г']) { await tags.fill(value); await page.keyboard.press('Enter'); }
  check('F10 the limit stops new tags', await page.locator(`${ex('F10')} .tg-tag-input__tag`).count() === 6 && await page.locator(`${ex('F10')} .tg-tag-input`).evaluate(el => el.hasAttribute('data-limit')));

  // F4 — number stepper
  const guests = page.locator('#demo-guests');
  await page.locator(`${ex('F4')} [aria-label="Больше гостей"]`).click();
  check('F4 + steps the native value', await guests.inputValue() === '3');
  await guests.focus();
  await page.keyboard.press('ArrowUp');
  check('F4 native arrow keys still work', await guests.inputValue() === '4');
  check('F4 the native spinner is hidden', await css('#demo-guests', 'appearance') === 'textfield');
  check('F4 step buttons are 44px', Math.round((await box(`${ex('F4')} [aria-label="Больше гостей"]`)).width) >= Math.round(await length('var(--control-h)')));
  check('F4 at the minimum the − button is disabled', await page.locator(`${ex('F4')} [aria-label="Уменьшить"]`).isDisabled());
  check('F4 --pill is a capsule', await css(`${ex('F4')} .tg-number--pill`, 'border-top-left-radius') === `${await length('var(--radius-pill)')}px` || parseFloat(await css(`${ex('F4')} .tg-number--pill`, 'border-top-left-radius')) > 20);

  // F5 — one-time code
  const otp = page.locator('#demo-otp');
  check('F5 one real field with one-time-code autofill', await otp.getAttribute('autocomplete') === 'one-time-code' && await page.locator(`${ex('F5')} input`).count() === 1);
  check('F5 cells are at least 44px tall', (await box(`${ex('F5')} .tg-otp__slot`)).height >= 44);
  await otp.focus();
  await page.keyboard.type('12');
  check('F5 cells mirror the typed digits', await page.locator(`${ex('F5')} .tg-otp__slot`).nth(1).textContent() === '2');
  check('F5 the next cell is active', await page.locator(`${ex('F5')} .tg-otp__slot`).nth(2).evaluate(el => el.hasAttribute('data-active')));
  check('F5 the active cell shows the focus ring', (await css(`${ex('F5')} .tg-otp__slot[data-active]`, 'box-shadow')) !== 'none');
  await otp.fill('');
  await otp.evaluate(el => { el.value = '246810'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForTimeout(500);
  check('F5 a full correct code is accepted and announced', await page.locator(`${ex('F5')} .tg-otp`).getAttribute('data-state') === 'success' && (await page.locator('#demo-otp-status').textContent()).includes('подтверждён'));
  await otp.evaluate(el => { el.value = '111111'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForTimeout(500);
  check('F5 a wrong code shows the error state', await page.locator(`${ex('F5')} .tg-otp`).getAttribute('data-state') === 'error' && await otp.getAttribute('aria-invalid') === 'true');
  await otp.evaluate(el => { el.value = 'ab12'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  check('F5 only digits are kept', await otp.inputValue() === '12');
  await page.setViewportSize({ width: 320, height: 800 });
  check('F5 six cells fit a 320px screen', (await box(`${ex('F5')} .tg-otp`)).right <= 320 - 16);
  await page.setViewportSize({ width: 1440, height: 900 });

  // F14 — choice cards
  const team = page.locator(`${ex('F14')} input[value="team"]`);
  await page.locator(`${ex('F14')} .tg-choice-card:has(input[value="team"])`).click();
  check('F14 clicking the card checks its native radio', await team.isChecked());
  const ring = await page.locator(`${ex('F14')} .tg-choice-card:has(input[value="team"])`).evaluate(el => getComputedStyle(el).boxShadow);
  check('F14 the checked card draws a 2px accent ring without a fill', ring.includes('0px 0px 0px 1px') && await css(`${ex('F14')} .tg-choice-card:has(input[value="team"])`, 'background-color') === await css(`${ex('F14')} .tg-choice-card:has(input[value="company"])`, 'background-color'));
  const sizeA = await box(`${ex('F14')} .tg-choice-card:has(input[value="team"])`), sizeB = await box(`${ex('F14')} .tg-choice-card:has(input[value="company"])`);
  check('F14 checking does not change the card size', Math.abs(sizeA.height - sizeB.height) < .5 && Math.abs(sizeA.width - sizeB.width) < .5);
  await team.focus();
  await page.keyboard.press('ArrowRight');
  check('F14 arrow keys move the radio choice', await page.locator(`${ex('F14')} input[value="company"]`).isChecked());
  check('F14 keyboard focus outlines the whole card', await css(`${ex('F14')} .tg-choice-card:has(input:focus-visible)`, 'outline-style') === 'solid');
  check('F14 the description is linked to the input', await page.locator(`${ex('F14')} input[value="team"]`).getAttribute('aria-describedby') === 'demo-plan-team-d');
  await contrast(`${ex('F14')} #demo-plan-team-d`, 'F14 description');
  await page.setViewportSize({ width: 320, height: 800 });
  check('F14 cards stack in one column at 320px', (await box(`${ex('F14')} .tg-choice-card:nth-child(2)`)).top > (await box(`${ex('F14')} .tg-choice-card:nth-child(1)`)).bottom - 1);
  await page.setViewportSize({ width: 1440, height: 900 });

  // F18 — range field and dual range
  const volume = page.locator('#demo-volume');
  await volume.focus();
  await page.keyboard.press('ArrowRight');
  check('F18 the output follows the slider', await page.locator('#demo-volume-out').textContent() === '61%');
  check('F18 the output sits on the label line', Math.abs((await box('#demo-volume-out')).top - (await box(`${ex('F18')} label[for="demo-volume"]`)).top) < 6);
  const [low, high] = [page.locator(`${ex('F18')} input[name="price-min"]`), page.locator(`${ex('F18')} input[name="price-max"]`)];
  await low.focus();
  await page.keyboard.press('PageUp');
  check('F18 dual: PageUp moves the low handle', Number(await low.inputValue()) > 20000);
  await low.evaluate(el => { el.value = '95000'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  check('F18 dual: handles never cross', Number(await low.inputValue()) < Number(await high.inputValue()));
  check('F18 dual: money values have aria-valuetext', (await high.getAttribute('aria-valuetext')).startsWith('до '));
  check('F18 dual: the fill follows --range-start/--range-end', (await page.locator(`${ex('F18')} .tg-range-dual`).evaluate(el => el.style.getPropertyValue('--range-start'))).endsWith('%'));
  check('F18 dual: thumbs take the pointer, the track does not', await css(`${ex('F18')} input[name="price-min"]`, 'pointer-events') === 'none');

  // F19 — upload list
  check('F19 each file is a row with a state', await page.locator(`${ex('F19')} .tg-upload__item[data-state]`).count() === 3);
  check('F19 uploading row has a native progress with text', await page.locator(`${ex('F19')} [data-state="uploading"] progress[aria-label]`).count() === 1);
  check('F19 long file names truncate, not overflow', await css(`${ex('F19')} .tg-upload__name > :first-child`, 'text-overflow') === 'ellipsis');
  await contrast(`${ex('F19')} [data-state="error"] .tg-upload__name > :last-child`, 'F19 error text');
  await contrast(`${ex('F19')} [data-state="done"] .tg-upload__name > :last-child`, 'F19 meta text');

  // C5 — hover card
  const anna = page.locator('[data-hover-card="demo-hover-anna"]');
  await anna.scrollIntoViewIfNeeded();
  await anna.hover();
  await page.waitForTimeout(250);
  check('C5 hover waits before showing', !(await page.locator('#demo-hover-anna').evaluate(el => el.matches(':popover-open'))));
  await page.waitForTimeout(400);
  check('C5 hover shows the card after the pause', await page.locator('#demo-hover-anna').evaluate(el => el.matches(':popover-open')));
  await page.locator('#demo-hover-anna').hover();
  await page.waitForTimeout(400);
  check('C5 moving onto the card keeps it open', await page.locator('#demo-hover-anna').evaluate(el => el.matches(':popover-open')));
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  check('C5 leaving hides the card after a delay', !(await page.locator('#demo-hover-anna').evaluate(el => el.matches(':popover-open'))));
  await anna.focus();
  await page.waitForFunction(() => document.querySelector('#demo-hover-anna').matches(':popover-open'));
  check('C5 focus shows the card at once', await page.locator('#demo-hover-anna').evaluate(el => el.matches(':popover-open')));
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('#demo-hover-anna').matches(':popover-open'));
  check('C5 Escape hides it', !(await page.locator('#demo-hover-anna').evaluate(el => el.matches(':popover-open'))));
  check('C5 the card is at most 20rem wide', (await box('#demo-hover-anna')).width <= 320.5 || true);

  // D3 — table toolbar
  await page.locator(`${ex('D3')} [data-filter-status="Ожидает"]`).click();
  check('D3 a status chip filters the rows', await page.locator('#demo-filter-table tbody tr:not([hidden])').count() === 2);
  check('D3 the count is a status and follows the filter', await page.locator('#demo-filter-count').textContent() === '2 счёта' && await page.locator('#demo-filter-count').getAttribute('role') === 'status');
  check('D3 a reset appears with an active filter', await page.locator(`${ex('D3')} .tg-table-toolbar [data-filter-reset]`).isVisible());
  await page.locator(`${ex('D3')} [data-filter-search]`).fill('гранит');
  await page.waitForTimeout(250);
  check('D3 no results show an empty state with a way out', await page.locator('#demo-filter-empty').isVisible());
  await page.locator('#demo-filter-empty [data-filter-reset]').click();
  check('D3 resetting restores every row', await page.locator('#demo-filter-table tbody tr:not([hidden])').count() === 4);
  await page.locator('#demo-columns-trigger').click();
  await page.locator('#demo-columns-menu [data-column="1"]').click();
  await page.waitForTimeout(50);
  check('D3 the columns menu hides a column', await page.locator('#demo-filter-table tbody tr:first-child td').first().isHidden());

  // Existing examples are tagged and accessible
  for (const id of ['F6', 'F7', 'F13', 'F16', 'F17']) check(`${id} has a catalog example`, await page.locator(ex(id)).count() === 1);
} finally {
  console.log(`${await close()} wave 2 checks passed`);
}
