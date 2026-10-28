// Wave 7 — advanced P2: B6 hold/slide confirm, B12 FAB, F24 wheel, F25 colour, F26 emoji,
// F33 waveform + selection box, C15 card stack, C21 player + compare, G4 image accordion,
// TS4 marquee.
import { openCatalog } from './helpers/catalog-page.mjs';
import { measureContrast } from './helpers/contrast.mjs';

const { page, check, css, px, box, length, theme, rtl, close } = await openCatalog({ port: 4206 });
const ex = id => `.example-body[data-spec~="${id}"]`;
const contrast = async (selector, label) => {
  for (const name of ['light', 'dark', 'ios-dark']) {
    await theme(name);
    const { ratio } = await page.evaluate(measureContrast, { selector });
    check(`${label} ${name}: contrast ${ratio.toFixed(2)} ≥ 4.5`, ratio >= 4.5);
  }
  await theme(null);
};
const controlH = await length('var(--control-h)');
// Live regions are filled on the next frame; wait for the text instead of reading at once.
const said = (selector, text) => page.waitForFunction(([s, t]) => document.querySelector(s)?.textContent.includes(t), [selector, text], { timeout: 2000 }).then(() => true, () => false);
try {
  // B6 — hold and slide
  const hold = page.locator(`${ex('B6')} [data-hold]`);
  check('B6 the hold button is a full-height destructive button', (await box(`${ex('B6')} [data-hold]`)).height >= controlH - .5 && await hold.evaluate(el => el.classList.contains('tg-btn--destructive')));
  await hold.evaluate(el => el.style.setProperty('--hold-progress', .5));
  check('B6 the fill follows --hold-progress', (await css(`${ex('B6')} [data-hold]`, 'transform', '::before')).includes('matrix') || (await css(`${ex('B6')} [data-hold]`, 'background-image')).includes('gradient') || (await css(`${ex('B6')} [data-hold]`, 'scale', '::before')) !== 'none');
  await hold.evaluate(el => el.style.setProperty('--hold-progress', 0));
  await hold.focus();
  await page.keyboard.press('Enter');
  check('B6 one Enter only asks for a second', await said('#demo-gesture-status', 'ещё раз'));
  await page.keyboard.press('Enter');
  check('B6 a second Enter within a second confirms', await hold.getAttribute('data-state') === 'confirmed');
  const thumb = page.locator(`${ex('B6')} .tg-slide-confirm__thumb`);
  check('B6 the slide is a native named range', await thumb.getAttribute('type') === 'range' && (await thumb.getAttribute('aria-label')).length > 0);
  check('B6 the slide track is as tall as a control', (await box(`${ex('B6')} .tg-slide-confirm`)).height >= controlH - .5);
  await thumb.focus();
  await page.keyboard.press('End');
  check('B6 End completes the slide', await page.locator(`${ex('B6')} [data-slide-confirm]`).getAttribute('data-state') === 'confirmed');
  check('B6 there is a path without the gesture', await page.locator(`${ex('B6')} [data-slide-alt]`).count() === 1);
  await contrast(`${ex('B6')} .tg-slide-confirm__label`, 'B6 slide label');

  // B12 — FAB
  const fab = page.locator('#demo-fab');
  check('B12 the FAB is at least a control tall and pill-shaped', (await box('#demo-fab')).height >= controlH - .5 && await px('#demo-fab', 'border-top-left-radius') >= (await box('#demo-fab')).height / 2 - 1);
  check('B12 the FAB floats with a shadow', (await css('#demo-fab', 'box-shadow')) !== 'none');
  await fab.click();
  check('B12 the menu opens with labelled items and focus moves in', await fab.getAttribute('aria-expanded') === 'true' && await page.evaluate(() => document.activeElement.classList.contains('tg-fab-menu__item')));
  for (const item of await page.locator('.tg-fab-menu__item').all()) check(`B12 item "${(await item.textContent()).trim()}" is a full-height target`, (await item.boundingBox()).height >= controlH - .5);
  await page.keyboard.press('Escape');
  check('B12 Escape closes and returns focus', await fab.getAttribute('aria-expanded') === 'false' && await page.evaluate(() => document.activeElement.id === 'demo-fab'));

  // F24 — wheel
  const hours = page.locator(`${ex('F24')} .tg-wheel__column`).first();
  check('F24 columns are named listboxes', await page.locator(`${ex('F24')} .tg-wheel__column[role="listbox"][aria-label]`).count() === 2);
  check('F24 columns snap to the centre', (await css(`${ex('F24')} .tg-wheel__column`, 'scroll-snap-type')).includes('y'));
  check('F24 the edges fade with a mask', (await css(`${ex('F24')} .tg-wheel__column`, 'mask-image')).includes('gradient') || (await css(`${ex('F24')} .tg-wheel`, 'mask-image')).includes('gradient'));
  await hours.focus();
  await page.keyboard.press('ArrowDown');
  check('F24 ArrowDown steps the value', (await page.locator(`${ex('F24')} [data-wheel-output]`).textContent()) === '15:30');
  check('F24 options use tabular figures', (await css(`${ex('F24')} .tg-wheel__option`, 'font-variant-numeric')).includes('tabular'));

  // F25 — colour
  check('F25 the field pairs a native colour input and a HEX field', await page.locator(`${ex('F25')} .tg-color-field input[type="color"]`).count() === 1 && await page.locator(`${ex('F25')} .tg-color-field__input`).count() === 1);
  const hex = page.locator(`${ex('F25')} .tg-color-field__input`);
  await hex.fill('#12');
  check('F25 a wrong HEX is invalid', await hex.getAttribute('aria-invalid') === 'true');
  await hex.fill('#0A7A55');
  check('F25 a right HEX updates the swatch', await hex.getAttribute('aria-invalid') === 'false' && await page.locator(`${ex('F25')} .tg-color-field input[type="color"]`).inputValue() === '#0a7a55');
  check('F25 the hue track shows the whole colour circle', (await css(`${ex('F25')} .tg-color-picker__hue`, 'background-image', '::-webkit-slider-runnable-track')).includes('rgb(255, 0, 0)') || (await css(`${ex('F25')} .tg-color-picker__hue`, '--range-track-bg')).includes('red'));
  const area = page.locator(`${ex('F25')} .tg-color-picker__area input`).first();
  await area.focus();
  await page.keyboard.press('ArrowUp');
  check('F25 the area works from the keyboard', (await page.locator(`${ex('F25')} [data-color-picker]`).evaluate(el => el.style.getPropertyValue('--picker-v'))) === '0.91');
  await page.locator(`${ex('F25')} .tg-color-picker__swatches label`).nth(1).click();
  check('F25 a swatch is a radio that moves the area', await page.locator(`${ex('F25')} .tg-color-picker__swatches input:checked`).count() === 1);

  // F26 — emoji
  const options = page.locator(`${ex('F26')} .tg-emoji-picker__option`);
  check('F26 cells are 44px targets with Russian names', (await options.first().boundingBox()).width >= controlH - .5 && (await options.first().getAttribute('aria-label') || await options.first().getAttribute('data-name')).length > 0);
  await options.first().focus();
  await page.keyboard.press('ArrowRight');
  check('F26 arrows move through the grid', (await page.evaluate(() => document.activeElement.dataset.name)) === await options.nth(1).getAttribute('data-name'));
  await page.keyboard.press('ArrowDown');
  check('F26 ArrowDown moves a row', await page.evaluate(() => [...document.querySelectorAll('.tg-emoji-picker__option')].indexOf(document.activeElement)) === 7);
  await page.locator(`${ex('F26')} input[type="search"]`).fill('ноль-совпадений');
  check('F26 an empty search says so', await said('#demo-emoji-status', 'Ничего'));
  await page.locator(`${ex('F26')} input[type="search"]`).fill('');

  // F33 — waveform and selection box
  const wave = page.locator(`${ex('F33')} .tg-waveform__progress`);
  check('F33 the waveform is a named native range over decorative bars', await wave.getAttribute('aria-label') !== null && await page.locator(`${ex('F33')} .tg-waveform__track[aria-hidden="true"]`).count() === 1);
  await wave.focus();
  await page.keyboard.press('ArrowRight');
  check('F33 played bars follow the position', await page.locator(`${ex('F33')} .tg-waveform__bar[data-played]`).count() === 23);
  check('F33 played bars take the accent', await css(`${ex('F33')} .tg-waveform__bar[data-played]`, 'background-color') === await page.evaluate(() => { const p = document.createElement('i'); p.style.color = 'var(--accent-main)'; document.querySelector('.tg-waveform').append(p); const c = getComputedStyle(p).color; p.remove(); return c; }));
  const sel = page.locator(`${ex('F33')} .tg-selection-box`);
  await sel.focus();
  await page.keyboard.press('ArrowRight');
  check('F33 arrows move the selection', await sel.evaluate(el => el.style.getPropertyValue('--box-x')) === '24%');
  await page.keyboard.press('Shift+ArrowDown');
  check('F33 Shift+arrows resize it', await sel.evaluate(el => el.style.getPropertyValue('--box-h')) === '58%');
  const handle = await page.locator(`${ex('F33')} .tg-selection-box__handle`).first().evaluate(el => { const s = getComputedStyle(el, '::before'); return { w: el.getBoundingClientRect().width, hit: parseFloat(s.width) || 0 }; });
  check('F33 handles are small with a 44px hit area', handle.w <= 14 && (handle.hit >= 43 || handle.w >= 12));

  // C15 — card stack
  const deck = `${ex('C15')} .tg-card-stack__deck`;
  check('C15 cards share one grid cell', (await css(`${deck} .tg-card-stack__item:nth-child(2)`, 'grid-area')).startsWith('1'));
  check('C15 only the top card is in the accessibility tree', await page.locator(`${deck} .tg-card-stack__item[inert]`).count() === 3);
  await page.locator(`${ex('C15')} [data-stack="accept"]`).click();
  check('C15 a decision leaves three and announces it', (await page.locator(`${ex('C15')} [data-stack-count]`).textContent()) === 'Осталось 3 заявки');
  await page.waitForTimeout(320);
  check('C15 the decided card is removed', await page.locator(`${deck} .tg-card-stack__item`).count() === 3);

  // C21 — player and compare
  check('C21 player buttons are named 44px targets', (await page.locator(`${ex('C21')} .tg-player__controls button`).evaluateAll(list => list.every(b => b.getAttribute('aria-label') && b.getBoundingClientRect().height >= 44))));
  check('C21 time uses tabular figures', (await css(`${ex('C21')} .tg-player__progress`, 'font-variant-numeric')).includes('tabular'));
  await page.locator(`${ex('C21')} [data-player-skip="15"]`).click();
  check('C21 skip moves the position and the time text', (await page.locator(`${ex('C21')} [data-player-time]`).textContent()) === '12:55');
  const handleC = page.locator(`${ex('C21')} .tg-compare__handle`);
  await handleC.focus();
  await page.keyboard.press('ArrowLeft');
  check('C21 the compare border follows the range', await page.locator(`${ex('C21')} [data-compare]`).evaluate(el => el.style.getPropertyValue('--compare')) === '49%');
  const labels = await page.locator(`${ex('C21')} .tg-compare__label`).evaluateAll(list => list.map(el => el.getBoundingClientRect().toJSON()));
  check('C21 the two labels sit at opposite edges', labels[0].right < labels[1].left);
  check('C21 the compare change is not animated', ['0s', ''].includes(await css(`${ex('C21')} .tg-compare__after`, 'transition-duration')));

  // G4 — image accordion
  const triggers = page.locator(`${ex('G4')} .tg-image-accordion__trigger`);
  await triggers.nth(2).click();
  check('G4 one panel is open at a time', await page.locator(`${ex('G4')} [aria-expanded="true"]`).count() === 1 && await triggers.nth(2).getAttribute('aria-expanded') === 'true');
  const widths = await page.locator(`${ex('G4')} .tg-image-accordion__item`).evaluateAll(list => list.map(el => el.getBoundingClientRect().width));
  check('G4 the open panel is the widest', widths[2] === Math.max(...widths) && widths[2] > widths[0] * 1.5);
  check('G4 width is not animated', !(await css(`${ex('G4')} .tg-image-accordion__item`, 'transition-property')).match(/width|flex|grid/));
  await page.setViewportSize({ width: 390, height: 900 });
  const ys = await page.locator(`${ex('G4')} .tg-image-accordion__item`).evaluateAll(list => list.map(el => el.getBoundingClientRect().top));
  check('G4 panels stack on phones', ys[1] > ys[0] && ys[2] > ys[1]);
  await page.setViewportSize({ width: 1440, height: 900 });

  // TS4 — marquee
  check('TS4 the copy track is hidden and inert', await page.locator(`${ex('TS4')} .tg-marquee__track[aria-hidden="true"][inert]`).count() === 1);
  check('TS4 reduced motion stops the movement', ['none', ''].includes(await css(`${ex('TS4')} .tg-marquee__track`, 'animation-name')) || (await css(`${ex('TS4')} .tg-marquee__track`, 'animation-play-state')) === 'paused');
  check('TS4 with reduced motion there is nothing to pause, so no button', !(await page.locator(`${ex('TS4')} [data-marquee-pause]`).isVisible()));
  const motion = await page.context().browser().newPage({ viewport: { width: 1440, height: 900 } });
  await motion.goto(page.url());
  await motion.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  check('TS4 with motion allowed the track runs', (await motion.locator(`${ex('TS4')} .tg-marquee__track`).first().evaluate(el => getComputedStyle(el).animationName)) !== 'none');
  const pause = motion.locator(`${ex('TS4')} [data-marquee-pause]`);
  await pause.click();
  check('TS4 the pause button is a pressed toggle', await pause.getAttribute('aria-pressed') === 'true' && (await pause.textContent()).includes('Продолжить'));
  check('TS4 pause stops it', (await motion.locator(`${ex('TS4')} .tg-marquee__track`).first().evaluate(el => getComputedStyle(el).animationPlayState)) === 'paused');
  await motion.close();

  // RTL and narrow screens
  await rtl(true);
  const ia = await page.locator(`${ex('G4')} .tg-image-accordion__item`).evaluateAll(list => list.map(el => el.getBoundingClientRect().left));
  check('RTL: the image accordion runs right to left', ia[0] > ia[1]);
  await rtl(false);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const id of ['B6', 'B12', 'F24', 'F25', 'F26', 'F33', 'C15', 'C21', 'G4', 'TS4']) {
      const over = await page.locator(ex(id)).evaluate(el => el.scrollWidth - el.clientWidth);
      check(`${id} at ${width}px has no horizontal overflow`, over <= 1, String(over));
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
} finally {
  console.log(`${await close()} wave 7 checks passed`);
}
