// Waves 4 and 5 — dates and data: F20 date fields, F21 calendar, F22 range with presets,
// D7 line/area chart, D8 bars, D9 donut, D6 sortable list, M11 schedule, C16 bento grid;
// existing D5 and C12 examples.
import { openCatalog } from './helpers/catalog-page.mjs';
import { measureContrast } from './helpers/contrast.mjs';

const { page, check, css, px, box, length, theme, rtl, close } = await openCatalog({ port: 4204 });
const ex = id => `.example-body[data-spec~="${id}"]`;
const contrast = async (selector, label) => {
  for (const name of ['light', 'dark', 'ios-dark']) {
    await theme(name);
    const { ratio } = await page.evaluate(measureContrast, { selector });
    check(`${label} ${name}: contrast ${ratio.toFixed(2)} ≥ 4.5`, ratio >= 4.5);
  }
  await theme(null);
};
const focused = () => page.evaluate(() => document.activeElement.dataset.date ?? document.activeElement.getAttribute('aria-label'));
try {
  // F20 — date fields
  check('F20 the native date input keeps the field look', await css('#demo-birth', 'border-top-left-radius') === await css('#demo-name', 'border-top-left-radius') && Math.round((await box('#demo-birth')).height) === Math.round((await box('#demo-name')).height));
  const day = page.locator(`${ex('F20')} [data-part="day"]`);
  await day.focus();
  await page.keyboard.press('ArrowUp');
  check('F20 ↑ raises the day spinbutton', await day.getAttribute('aria-valuenow') === '16' && await page.locator(`${ex('F20')} input[name="due"]`).inputValue() === '2026-11-16');
  await page.keyboard.press('ArrowRight');
  check('F20 → moves to the month segment', await page.evaluate(() => document.activeElement.dataset.part) === 'month');
  await page.keyboard.press('ArrowDown');
  check('F20 the month announces its name', await page.locator(`${ex('F20')} [data-part="month"]`).getAttribute('aria-valuetext') === 'октябрь');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.type('31');
  check('F20 typing digits sets the day and moves on', await day.getAttribute('aria-valuenow') === '31');
  check('F20 the field frame shows focus', (await css(`${ex('F20')} .tg-date-field`, 'box-shadow')) !== 'none');
  check('F20 segments are named spinbuttons', await page.locator(`${ex('F20')} [role="spinbutton"][aria-label]`).count() === 3);

  // F21 — calendar
  const cal = `${ex('F21')} .tg-calendar`;
  const selected = page.locator(`${cal} [aria-pressed="true"]`);
  check('F21 days are 44px', Math.round((await box(`${cal} .tg-calendar__day`)).width) === 44);
  check('F21 today has a ring and aria-current=date', await page.locator(`${cal} [aria-current="date"]`).count() === 1 && (await css(`${cal} .tg-calendar__day--today`, 'box-shadow')).includes('inset'));
  check('F21 one Tab stop in the grid', await page.locator(`${cal} .tg-calendar__day[tabindex="0"]`).count() === 1);
  await selected.focus();
  await page.keyboard.press('ArrowRight');
  check('F21 → moves one day', await focused() === '2026-10-13');
  await page.keyboard.press('ArrowDown');
  check('F21 ↓ moves one week', await focused() === '2026-10-20');
  await page.keyboard.press('End');
  check('F21 End goes to the end of the week', await focused() === '2026-10-25');
  await page.keyboard.press('PageDown');
  check('F21 PageDown goes to next month and updates the title', await focused() === '2026-11-25' && (await page.locator(`${cal} .tg-header__title`).textContent()) === 'ноябрь 2026');
  await page.keyboard.press('Shift+PageUp');
  check('F21 Shift+PageUp goes back a year', await focused() === '2025-11-25');
  await page.keyboard.press('PageDown');
  await page.keyboard.press('Shift+PageDown');
  await page.keyboard.press('Enter');
  check('F21 Enter selects the day and announces it in full', await page.locator(`${cal} [data-date="2026-12-25"]`).getAttribute('aria-pressed') === 'true' && (await page.locator(`${cal} [data-calendar-status]`).textContent()).includes('25 декабря 2026'));
  check('F21 the selected day is filled with the action role', await css(`${cal} [aria-pressed="true"]`, 'background-color') === await css('.tg-btn--primary', 'background-color'));
  await page.locator(`${cal} [data-calendar-prev]`).click();
  await page.locator(`${cal} [data-calendar-prev]`).click();
  check('F21 event days keep their marks and say them in the name', (await page.locator(`${cal} [data-date="2026-10-20"]`).getAttribute('aria-label')).includes('просрочка') && await page.locator(`${cal} [data-date="2026-10-30"] .tg-calendar__event-dot`).count() === 3);
  await contrast(`${cal} .tg-calendar__day--outside`, 'F21 outside day');
  await contrast(`${cal} thead th`, 'F21 weekday');
  await rtl(true);
  await page.locator(`${cal} [data-date="2026-10-14"]`).focus();
  await page.keyboard.press('ArrowLeft');
  check('F21 RTL: ← moves to the next day', await focused() === '2026-10-15');
  await rtl(false);

  // F22 — range
  const range = `${ex('F22')} .tg-calendar--range`;
  check('F22 the band between the ends is the soft accent', await page.locator(`${range} td:has(> .tg-calendar__day--in-range)`).first().evaluate(el => getComputedStyle(el).backgroundColor) !== 'rgba(0, 0, 0, 0)');
  check('F22 the ends are filled', await css(`${range} .tg-calendar__day--range-start`, 'background-color') === await css('.tg-btn--primary', 'background-color'));
  await page.locator(`${range} [data-date="2026-10-05"]`).click();
  check('F22 the first click sets the start and asks for the end', (await page.locator(`${range} [data-calendar-status]`).textContent()).includes('Выберите конец'));
  await page.locator(`${range} [data-date="2026-10-09"]`).hover();
  check('F22 hovering previews the band', await page.locator(`${range} td:has(> .tg-calendar__day--in-range)`).count() === 3);
  await page.locator(`${range} [data-date="2026-10-09"]`).click();
  check('F22 the second click sets the end and the output follows', (await page.locator(`${range} [data-range-output]`).textContent()) === '5 октября – 9 октября 2026');
  check('F22 start and end are named in the day labels', (await page.locator(`${range} .tg-calendar__day--range-start`).getAttribute('aria-label')).startsWith('Начало периода'));
  await page.locator(`${range} [data-preset="month"]`).click();
  check('F22 a preset sets the range and is marked pressed', (await page.locator(`${range} [data-range-output]`).textContent()) === '1 октября – 31 октября 2026' && await page.locator(`${range} [data-preset="month"]`).getAttribute('aria-pressed') === 'true');
  await page.locator(`${range} [data-range-cancel]`).click();
  check('F22 Cancel restores the applied range', (await page.locator(`${range} [data-range-output]`).textContent()) === '20 октября – 4 ноября 2026');
  await contrast(`${range} .tg-calendar__day--in-range:not(.tg-calendar__day--outside)`, 'F22 day in range');
  await page.setViewportSize({ width: 390, height: 900 });
  check('F22 phones put presets in a row above', await css(`${range} .tg-calendar__presets`, 'display') === 'flex' && await css(`${range} .tg-calendar__layout`, 'flex-direction') === 'column');
  await page.setViewportSize({ width: 1440, height: 900 });

  // D7 — line chart
  const line = `${ex('D7')} .tg-chart`;
  check('D7 lines are 2px', await page.locator(`${line} .tg-chart__line`).first().evaluate(el => getComputedStyle(el).strokeWidth) === '2px');
  check('D7 the second series is dashed, not only lighter', (await page.locator(`${line} .tg-chart__line[data-series="2"]`).evaluate(el => getComputedStyle(el).strokeDasharray)) !== 'none');
  check('D7 the area is a light wash of the series', Number(await page.locator(`${line} .tg-chart__area`).evaluate(el => getComputedStyle(el).fillOpacity)) <= .15);
  check('D7 a legend names both series', await page.locator(`${line} .tg-chart__legend-item`).count() === 2);
  check('D7 ticks are clean numbers', (await page.locator(`${line} .tg-chart__tick`).allTextContents()).slice(0, 4).join(',') === '0,2,4,6');
  check('D7 the SVG draws 1:1 so text keeps its size', Math.abs((await box(`${line} svg`)).width - Number(await page.locator(`${line} svg`).getAttribute('width'))) < 1);
  await page.locator(`${line} .tg-chart__plot`).scrollIntoViewIfNeeded();
  const plot = await box(`${line} .tg-chart__plot`);
  await page.mouse.move(plot.left + plot.width * .55, plot.top + 80);
  await page.waitForTimeout(60);
  check('D7 hover shows the crosshair and a tooltip with both values', await page.locator(`${line} .tg-chart__plot`).evaluate(el => el.hasAttribute('data-hover')) && (await page.locator(`${line} .tg-chart__tooltip span`).count()) === 2);
  check('D7 text in the tooltip uses text colours', await css(`${line} .tg-chart__tooltip b`, 'color') === await css('body', 'color'));
  await page.mouse.move(0, 0);
  await page.locator(`${line} .tg-chart__data > summary`).click();
  check('D7 a table view carries the same numbers', await page.locator('#demo-line-table tbody tr').count() === 10);
  await contrast(`${line} .tg-chart__subtitle`, 'D7 subtitle');

  // D8 — bars
  const bars = `${ex('D8')} .tg-chart`;
  const barBox = await box(`${bars} .tg-chart__bar`);
  check('D8 bars are at most 24px thick', barBox.width <= 24.5);
  check('D8 only the highlighted bar is at full strength', await page.locator(`${bars} .tg-chart__bar[data-active]`).count() === 1 && Number(await page.locator(`${bars} .tg-chart__bar:not([data-active])`).first().evaluate(el => getComputedStyle(el).fillOpacity)) < .5);
  await page.locator(`${bars} .tg-chart__plot`).scrollIntoViewIfNeeded();
  const b0 = await box(`${bars} .tg-chart__bar[data-index="0"]`);
  await page.mouse.move(b0.left + b0.width / 2, b0.top + 5);
  await page.waitForTimeout(60);
  check('D8 hovering a bar highlights it and shows its value', await page.locator(`${bars} .tg-chart__bar[data-index="0"]`).evaluate(el => el.hasAttribute('data-active')) && (await page.locator(`${bars} .tg-chart__tooltip`).textContent()).includes('42'));
  await page.mouse.move(0, 0);
  check('D8 a single series has no legend box', await page.locator(`${bars} .tg-chart__legend`).count() === 0);

  // D9 — donut
  const donut = `${ex('D9')} .tg-chart`;
  check('D9 three segments with a gap between them', await page.locator(`${donut} .tg-chart__segment`).count() === 3);
  check('D9 the third segment is textured, not only lighter', await page.locator(`${donut} .tg-chart__segment[data-texture]`).count() === 1);
  check('D9 the legend lists every value as text', (await page.locator(`${donut} .tg-chart__legend`).textContent()).replace(/\s+/g, '').includes('Наличные15%'));
  check('D9 the centre shows the total', (await page.locator(`${donut} .tg-chart__center strong`).textContent()) === '1 284');
  await contrast(`${donut} .tg-chart__legend-item > span:first-child`, 'D9 legend');

  // D6 — sortable
  const handle = page.locator(`${ex('D6')} .tg-sortable__handle`).nth(1);
  await handle.focus();
  await page.keyboard.press('Space');
  check('D6 Space lifts the item and says where it is', await page.locator(`${ex('D6')} .tg-sortable__item[data-grabbed]`).count() === 1 && await handle.getAttribute('aria-pressed') === 'true');
  check('D6 the lifted item floats on the overlay shadow', (await css(`${ex('D6')} .tg-sortable__item[data-grabbed]`, 'box-shadow')) !== 'none');
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(60);
  check('D6 ArrowDown moves it and announces the position', (await page.locator('#demo-sort-status').textContent()).includes('позиция 3 из 5'));
  await page.keyboard.press('Space');
  check('D6 Space drops it in the new place', (await page.locator(`${ex('D6')} .tg-sortable__item`).nth(2).textContent()).includes('Цены и тарифы'));
  await handle.focus();
  const moving = page.locator(`${ex('D6')} .tg-sortable__item`).nth(1);
  const name = (await moving.textContent()).trim();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Escape');
  check('D6 Escape puts it back', (await page.locator(`${ex('D6')} .tg-sortable__item`).nth(1).textContent()).trim() === name);
  check('D6 handles take the control size (≥44px)', Math.round((await box(`${ex('D6')} .tg-sortable__handle`)).width) === Math.round(await length('var(--control-h)')));
  await page.locator(`${ex('D6')} .tg-sortable`).scrollIntoViewIfNeeded();
  const h0 = await box(`${ex('D6')} .tg-sortable__item:nth-child(1) .tg-sortable__handle`);
  const i4 = await box(`${ex('D6')} .tg-sortable__item:nth-child(4)`);
  await page.mouse.move(h0.left + 20, h0.top + 20);
  await page.mouse.down();
  await page.mouse.move(h0.left + 20, i4.top + i4.height * .75, { steps: 8 });
  check('D6 dragging shows the drop line', await page.locator(`${ex('D6')} [data-drop]`).count() === 1);
  await page.mouse.up();
  check('D6 dropping reorders the list', !(await page.locator(`${ex('D6')} .tg-sortable__item`).first().textContent()).includes('Демо продукта'));

  // M11 — schedule
  check('M11 each event has its time as text', (await page.locator(`${ex('M11')} .tg-schedule__event time`).count()) === 6);
  check('M11 events sit on the grid from --start/--end', (await box(`${ex('M11')} .tg-schedule__event:nth-child(2)`)).height > (await box(`${ex('M11')} .tg-schedule__event:nth-child(1)`)).height);
  check('M11 a conflict is named in words', (await page.locator(`${ex('M11')} [data-conflict]`).textContent()).includes('пересекается'));
  await contrast(`${ex('M11')} .tg-schedule__event time`, 'M11 time');
  await contrast(`${ex('M11')} [data-conflict] strong`, 'M11 conflict title');
  await page.setViewportSize({ width: 390, height: 900 });
  check('M11 phones get a plain list', await css(`${ex('M11')} .tg-schedule__axis`, 'display') === 'none');
  await page.setViewportSize({ width: 1440, height: 900 });

  // C16 — bento
  const bento = `${ex('C16')} .tg-grid--bento`;
  check('C16 four columns on wide screens', (await css(bento, 'grid-template-columns')).split(' ').length === 4);
  check('C16 --span widens a tile', (await box(`${bento} > :first-child`)).width > (await box(`${bento} > :nth-child(2)`)).width * 1.8);
  await page.setViewportSize({ width: 700, height: 900 });
  check('C16 two columns from 36rem', (await css(bento, 'grid-template-columns')).split(' ').length === 2);
  await page.setViewportSize({ width: 390, height: 900 });
  check('C16 one column on phones', (await css(bento, 'grid-template-columns')).split(' ').length === 1);
  await page.setViewportSize({ width: 1440, height: 900 });

  for (const id of ['D5', 'C12']) check(`${id} has a catalog example`, await page.locator(ex(id)).count() === 1);
} finally {
  console.log(`${await close()} wave 4–5 checks passed`);
}
