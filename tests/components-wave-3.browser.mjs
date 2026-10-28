// Wave 3 — navigation and structure: track engine with M22 scroll fade, N16 carousel,
// G1 gallery (peek, thumbnails, vertical), N3 vertical tabs, N2 collapsed-label tabs,
// N11 sidebar, N5 disclosure navigation, N8 menubar, N13 table of contents,
// N10 command palette; existing N6 and N14 examples.
import { openCatalog } from './helpers/catalog-page.mjs';
import { measureContrast } from './helpers/contrast.mjs';

const { page, check, css, px, box, length, theme, rtl, close } = await openCatalog({ port: 4203 });
const ex = id => `.example-body[data-spec~="${id}"]`;
const contrast = async (selector, label) => {
  for (const name of ['light', 'dark', 'ios-dark']) {
    await theme(name);
    const { ratio } = await page.evaluate(measureContrast, { selector });
    check(`${label} ${name}: contrast ${ratio.toFixed(2)} ≥ 4.5`, ratio >= 4.5);
  }
  await theme(null);
};
const focusedText = () => page.evaluate(() => (document.activeElement.getAttribute('aria-label') || document.activeElement.textContent).trim());
try {
  // N16 — carousel
  const car = `${ex('N16')} .tg-carousel`;
  const vp = `${car} .tg-carousel__viewport`;
  check('N16 viewport snaps along x', (await css(vp, 'scroll-snap-type')).startsWith('x'));
  check('N16 viewport scrolls natively (works without scripts)', await css(vp, 'overflow-x') === 'auto');
  check('N16 slides fill the viewport', Math.abs((await box(`${vp} > :first-child`)).width - (await box(vp)).width) < 1);
  check('N16 prev is disabled on the first slide', await page.locator(`${car} [data-carousel-prev]`).isDisabled());
  await page.locator(`${car} [data-carousel-next]`).click();
  await page.waitForTimeout(400);
  check('N16 next moves one slide and updates the dots', await page.locator(`${car} .tg-dot`).nth(1).getAttribute('aria-current') === 'true');
  check('N16 the change is announced after a manual move', (await page.locator(`${car} [data-carousel-status]`).textContent()) === '2 из 5');
  await page.locator(`${car} .tg-dot`).nth(4).click();
  await page.waitForTimeout(400);
  check('N16 a dot chooses its slide and next becomes disabled at the end', await page.locator(`${car} [data-carousel-next]`).isDisabled());
  await page.locator(vp).focus();
  await page.keyboard.press('Home');
  await page.waitForTimeout(400);
  check('N16 Home on the viewport returns to the first slide', await page.locator(`${car} .tg-dot`).first().getAttribute('aria-current') === 'true');
  check('N16 slides are labelled groups', await page.locator(`${vp} > [role="group"][aria-roledescription="слайд"]`).count() === 5);
  await contrast(`${vp} > :first-child figcaption`, 'N16 caption');

  // G1 — gallery variants
  const peek = `${ex('G1')} .tg-carousel--peek`;
  const slide = await box(`${peek} .tg-carousel__slide`), view = await box(`${peek} .tg-carousel__viewport`);
  check('G1 --peek leaves neighbours visible at the edges', slide.width < view.width - 20);
  await page.locator(`${peek} .tg-carousel__thumbs > button`).nth(2).click();
  await page.waitForTimeout(500);
  check('G1 a thumbnail chooses its slide', await page.locator(`${peek} .tg-carousel__thumbs > button`).nth(2).getAttribute('aria-current') === 'true');
  check('G1 thumbnails are at least 44px', (await box(`${peek} .tg-carousel__thumbs > button`)).width >= 44);
  check('G1 the current thumbnail has the accent border', await css(`${peek} .tg-carousel__thumbs > button[aria-current="true"]`, 'border-top-color') !== await css(`${peek} .tg-carousel__thumbs > button[aria-current="false"]`, 'border-top-color'));
  const vert = `${ex('G1')} .tg-carousel--vertical`;
  check('G1 --vertical snaps along y', (await css(`${vert} .tg-carousel__viewport`, 'scroll-snap-type')).startsWith('y'));
  check('G1 --vertical puts thumbnails at the side on wide screens', (await box(`${vert} .tg-carousel__thumbs`)).left > (await box(`${vert} .tg-carousel__viewport`)).right - 1);

  // M22 — scroll fade
  const fade = `${ex('M22')} .tg-scroll-fade:not(.tg-scroll-fade--block)`;
  check('M22 the fade is a transparency mask, not a colour', (await css(fade, 'mask-image')).includes('linear-gradient') && (await css(fade, 'background-color')) === 'rgba(0, 0, 0, 0)');
  check('M22 the area is focusable and named', await page.locator(fade).getAttribute('tabindex') === '0' && (await page.locator(fade).getAttribute('aria-label')).length > 0);
  check('M22 the block variant scrolls vertically', await css(`${ex('M22')} .tg-scroll-fade--block`, 'overflow-y') === 'auto');

  // N3 — vertical tabs
  const vt = `${ex('N3')} .tg-tabs--vertical`;
  check('N3 vertical tabs are a column', await css(vt, 'flex-direction') === 'column');
  await page.locator('#demo-vtab-profile').focus();
  await page.keyboard.press('ArrowDown');
  check('N3 ArrowDown moves to the next tab and shows its panel', await page.locator('#demo-vtab-security').getAttribute('aria-selected') === 'true' && await page.locator('#demo-vpanel-security').isVisible());
  await page.keyboard.press('End');
  check('N3 End selects the last tab', await page.locator('#demo-vtab-notify').getAttribute('aria-selected') === 'true');
  check('N3 the selected tab rises like other tabs', await css('#demo-vtab-notify', 'box-shadow') === await css('.tg-tabs--segmented .tg-tab[aria-selected="true"]', 'box-shadow'));
  await page.setViewportSize({ width: 390, height: 900 });
  check('N3 phones get a horizontal row from the same markup', await css(vt, 'flex-direction') === 'row');
  await page.setViewportSize({ width: 1440, height: 900 });

  // N2 — collapsed labels
  const ct = `${ex('N2')} .tg-tabs--collapsed-labels`;
  check('N2 unselected labels are visually hidden but in the DOM', await page.locator(`${ct} #demo-ctab-board .tg-tab__label`).evaluate(el => el.getBoundingClientRect().width <= 1 && el.textContent === 'Доска'));
  check('N2 the selected tab shows its label', (await box(`${ct} #demo-ctab-list .tg-tab__label`)).width > 20);
  await page.locator('#demo-ctab-list').focus();
  await page.keyboard.press('ArrowRight');
  check('N2 arrows move the selection and reveal the new label', (await box(`${ct} #demo-ctab-board .tg-tab__label`)).width > 20);
  check('N2 the panel follows the selected tab', await page.locator('#demo-cpanel').getAttribute('aria-labelledby') === 'demo-ctab-board');
  check('N2 icon-only tabs stay 44px wide', (await box(`${ct} #demo-ctab-cal`)).width >= 44);

  // N11 — sidebar
  const sb = '#demo-sidebar';
  check('N11 the current link sits on a tone step', await css(`${sb} [aria-current="page"]`, 'background-color') !== 'rgba(0, 0, 0, 0)');
  check('N11 links are at least 40px tall', (await box(`${sb} .tg-sidebar__link`)).height >= 40);
  check('N11 nesting is a native details', await page.locator(`${sb} details > summary.tg-sidebar__link`).count() === 1);
  await contrast(`${sb} a.tg-sidebar__link:not([aria-current]) .tg-sidebar__text`, 'N11 link');
  await contrast(`${sb} .tg-sidebar__label`, 'N11 group label');
  await page.locator(`${sb} [data-sidebar-toggle]`).click();
  check('N11 collapsing leaves icons only', (await box(sb)).width < 90 && await page.locator(`${sb} .tg-sidebar__text`).first().evaluate(el => el.getBoundingClientRect().width <= 1));
  check('N11 collapsed links keep their names', await page.locator(`${sb} a.tg-sidebar__link[aria-label="Обзор"]`).count() === 1);
  await page.locator(`${sb} [data-sidebar-toggle]`).click();

  // N5 — disclosure navigation
  const products = page.locator('[aria-controls="demo-nm-products"]');
  await products.focus();
  await page.keyboard.press('Enter');
  check('N5 Enter opens the panel and marks the button expanded', await page.locator('#demo-nm-products').isVisible() && await products.getAttribute('aria-expanded') === 'true');
  await page.keyboard.press('Tab');
  check('N5 Tab walks into the panel links', (await focusedText()).startsWith('Счета'));
  await page.keyboard.press('Escape');
  check('N5 Escape closes and returns focus to the button', await page.locator('#demo-nm-products').isHidden() && await products.evaluate(el => el === document.activeElement));
  await products.click();
  await page.locator('[aria-controls="demo-nm-solutions"]').click();
  check('N5 one panel open at a time', await page.locator('#demo-nm-products').isHidden() && await page.locator('#demo-nm-solutions').isVisible());
  await page.mouse.click(5, 450);
  check('N5 a click outside closes the panel', await page.locator('#demo-nm-solutions').isHidden());
  await contrast('#demo-nm-products .tg-nav-menu__description', 'N5 description');
  await page.setViewportSize({ width: 390, height: 900 });
  await products.click();
  check('N5 phones open panels in the flow', await css('#demo-nm-products', 'position') === 'static');
  await products.click();
  await page.setViewportSize({ width: 1440, height: 900 });

  // N8 — menubar
  const file = page.locator('#demo-mb-file');
  await file.focus();
  await page.keyboard.press('ArrowRight');
  check('N8 arrows rove along the bar', await page.locator('#demo-mb-edit').evaluate(el => el === document.activeElement && el.tabIndex === 0));
  await page.keyboard.press('ArrowDown');
  check('N8 ArrowDown opens the menu on its first item', await page.locator('#demo-mb-edit-menu').evaluate(el => el.matches(':popover-open')) && (await focusedText()).startsWith('Отменить'));
  await page.keyboard.press('ArrowRight');
  check('N8 with a menu open ArrowRight moves to the next menu', await page.locator('#demo-mb-view-menu').evaluate(el => el.matches(':popover-open')) && !(await page.locator('#demo-mb-edit-menu').evaluate(el => el.matches(':popover-open'))));
  await page.keyboard.press('Escape');
  check('N8 Escape closes back to the bar item', await page.locator('#demo-mb-view').evaluate(el => el === document.activeElement) && await page.locator('#demo-mb-view').getAttribute('aria-expanded') === 'false');
  check('N8 items look 36px and keep a 44px target', Math.round((await box('#demo-mb-file')).height) === 36 && Math.round(await page.locator('#demo-mb-file').evaluate(el => parseFloat(getComputedStyle(el, '::before').height))) >= 44);

  // N13 — table of contents
  const toc = `${ex('N13')} .tg-toc`;
  check('N13 the current link carries the accent rule', await css(`${toc} [aria-current="location"]`, 'border-left-color') !== await css(`${toc} .tg-toc__link:not([aria-current])`, 'border-left-color'));
  check('N13 nested links are indented', (await px(`${toc} .tg-toc__link--nested`, 'padding-left')) > (await px(`${toc} .tg-toc__link:not(.tg-toc__link--nested)`, 'padding-left')));
  await page.locator(`${toc} a[href="#demo-doc-reports"]`).click();
  await page.waitForTimeout(300);
  check('N13 following a link marks it current and focuses the heading', await page.locator(`${toc} a[href="#demo-doc-reports"]`).getAttribute('aria-current') === 'location' && await page.locator('#demo-doc-reports').evaluate(el => el === document.activeElement));
  await contrast(`${toc} .tg-toc__link:not([aria-current])`, 'N13 link');

  // N10 — command palette
  const opener = page.locator('[data-command-open="demo-command"]');
  await opener.focus();
  await page.keyboard.press('Control+k');
  const dialog = page.locator('#demo-command');
  check('N10 Ctrl+K inside the example opens the palette at once', await dialog.evaluate(el => el.open && el.hasAttribute('data-instant')));
  check('N10 the catalog search did not open as well', !(await page.locator('#catalog-search').evaluate(el => el.open)));
  check('N10 an empty query shows recent commands', await page.locator('#demo-command-list .tg-command__group-label').first().textContent() === 'Недавние');
  await page.keyboard.type('откр');
  await page.waitForTimeout(60);
  check('N10 typing filters commands and announces the count', await page.locator('#demo-command-list [role="option"]').count() === 3 && (await page.locator('#demo-command-status').textContent()).includes('3'));
  await page.keyboard.press('ArrowDown');
  check('N10 arrows move aria-activedescendant', (await page.locator('.tg-command__input').getAttribute('aria-activedescendant')) === 'demo-command-3');
  check('N10 command rows keep the control height', Math.round((await box('#demo-command-3')).height) >= Math.round(await length('var(--control-h)')));
  await page.keyboard.type('ъъъ');
  await page.waitForTimeout(60);
  check('N10 no results show an empty state', await page.locator('#demo-command-list .tg-empty').count() === 1);
  await page.keyboard.press('Escape');
  check('N10 Escape closes and returns focus to the opener', !(await dialog.evaluate(el => el.open)) && await opener.evaluate(el => el === document.activeElement));
  await page.setViewportSize({ width: 390, height: 800 });
  await opener.click();
  check('N10 phones get a full-screen palette', Math.round((await box('#demo-command')).width) === 390);
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1440, height: 900 });

  for (const id of ['N6', 'N14']) check(`${id} has a catalog example`, await page.locator(ex(id)).count() === 1);
  await rtl(true);
  check('N16 RTL: next still moves forward', await page.locator(`${car} [data-carousel-next]`).isEnabled());
  await rtl(false);
} finally {
  console.log(`${await close()} wave 3 checks passed`);
}
