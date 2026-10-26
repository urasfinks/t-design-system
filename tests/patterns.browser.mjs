import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { compile } from 'sass';
import { chromium, webkit } from 'playwright';

const css = `${await readFile('dist/t-design-system.css', 'utf8')}\n${compile('src/components/_patterns.scss').css}`;
const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['light', 'dark', 'ios', 'ios-dark']) {
      await page.setContent(`<html data-theme="${theme}"><style>${css}</style><main style="padding:16px;display:grid;gap:16px">
        <form class="tg-search" role="search"><span class="tg-search__icon" aria-hidden="true">⌕</span><input class="tg-input tg-search__input" aria-label="Search" type="search"><button type="reset" class="tg-icon-btn tg-search__clear" aria-label="Clear search">×</button></form>
        <details class="tg-disclosure"><summary class="tg-disclosure__trigger">More information</summary><div class="tg-disclosure__content">Native details content</div></details>
        <div class="tg-table-wrap" tabindex="0" role="region" aria-label="Records"><table class="tg-table"><caption>Records</caption><thead><tr>${'<th scope="col">Long unbroken heading</th>'.repeat(8)}</tr></thead><tbody><tr>${'<td>Value</td>'.repeat(8)}</tr></tbody></table></div>
        <span class="tg-skeleton tg-skeleton--text" aria-hidden="true"></span>
        <dl class="tg-summary"><div class="tg-summary__row"><dt>Name</dt><dd>${'Unbroken'.repeat(40)}</dd></div></dl>
        <nav class="tg-breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="#">Home</a></li><li aria-current="page">${'Current'.repeat(40)}</li></ol></nav>
        <fieldset class="tg-fieldset"><legend>Volume</legend><input aria-label="Volume" type="range" class="tg-range"></fieldset>
      </main></html>`);
      await page.locator('.tg-search__input').fill('arbitrary <text> & кириллица');
      assert.equal(await page.locator('.tg-search__input').inputValue(), 'arbitrary <text> & кириллица');
      await page.locator('.tg-search__clear').click();
      assert.equal(await page.locator('.tg-search__input').inputValue(), '');
      await page.locator('summary').focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('details').getAttribute('open'), '');
      await page.keyboard.press('Space');
      assert.equal(await page.locator('details').getAttribute('open'), null);
      const metrics = await page.evaluate(() => {
        const wrap = document.querySelector('.tg-table-wrap');
        return { page: document.documentElement.scrollWidth, viewport: innerWidth, overflow: getComputedStyle(wrap).overflowX, table: wrap.scrollWidth > wrap.clientWidth,
          skeleton: getComputedStyle(document.querySelector('.tg-skeleton')).animationName, range: document.querySelector('.tg-range').getBoundingClientRect().height,
          clear: document.querySelector('.tg-search__clear').getBoundingClientRect().height };
      });
      assert.ok(metrics.page <= metrics.viewport, JSON.stringify(metrics));
      assert.equal(metrics.overflow, 'auto');
      if (width === 320) assert.ok(metrics.table);
      assert.equal(metrics.skeleton, 'none');
      assert.ok(metrics.range >= 44 && metrics.clear >= 44);
    }
  }
  for (const inputClass of ['tg-search__input', 'tg-input tg-search__input']) {
    await page.setContent(`<style>${css}</style>
      <div class="tg-search" id="invalid"><input class="${inputClass}" aria-label="Invalid search" aria-invalid="true"></div>
      <div class="tg-search" id="disabled"><input class="${inputClass}" aria-label="Disabled search" disabled value="Fixed"></div>
      <div class="tg-search" id="readonly"><input class="${inputClass}" aria-label="Read-only search" readonly value="Fixed"></div>
      <div class="tg-search tg-p-0" id="utility"><input class="${inputClass}" aria-label="Utility search"></div>
      <div class="tg-search" id="custom" style="--control-h:64px;--radius-control:20px"><input class="${inputClass}" aria-label="Custom search"></div>`);
    await page.getByLabel('Invalid search').focus();
    const invalid = await page.locator('#invalid').evaluate(el => {
      const style = getComputedStyle(el);
      const expected = document.createElement('span');
      expected.style.color = 'var(--danger-main)'; el.append(expected);
      const danger = getComputedStyle(expected).color; expected.remove();
      return { border: style.borderTopColor, danger, shadow: style.boxShadow, childShadow: getComputedStyle(el.querySelector('input')).boxShadow };
    });
    assert.equal(invalid.border, invalid.danger);
    assert.notEqual(invalid.shadow, 'none');
    assert.equal(invalid.childShadow, 'none');
    assert.equal(await page.getByLabel('Disabled search').isDisabled(), true);
    await page.getByLabel('Disabled search').evaluate(el => el.focus());
    assert.equal(await page.getByLabel('Disabled search').evaluate(el => el === document.activeElement), false);
    assert.equal(await page.locator('#disabled').evaluate(el => getComputedStyle(el).opacity), '0.5');
    assert.equal(await page.getByLabel('Read-only search').evaluate(el => el.readOnly), true);
    assert.equal(await page.locator('#readonly').evaluate(el => {
      const probe = document.createElement('span'); probe.style.background = 'var(--section-bg-color)'; el.append(probe);
      const matches = getComputedStyle(el).backgroundColor === getComputedStyle(probe).backgroundColor; probe.remove(); return matches;
    }), true);
    assert.equal(await page.locator('#utility').evaluate(el => getComputedStyle(el).paddingLeft), '0px');
    assert.equal(await page.locator('#custom').evaluate(el => getComputedStyle(el).borderTopLeftRadius), '20px');
    assert.equal(await page.locator('#custom input').evaluate(el => el.getBoundingClientRect().height), 64);
    await page.addStyleTag({ content: '.tg-search { border-radius: 7px; padding: 3px; }' });
    assert.equal(await page.locator('#custom').evaluate(el => getComputedStyle(el).borderTopLeftRadius), '7px');
    assert.equal(await page.locator('#utility').evaluate(el => getComputedStyle(el).paddingLeft), '3px');
  }
  console.log('Patterns: 320/1440px, four themes, native details keyboard, search/reset, contained table, long content and reduced motion passed.');
} finally { await browser.close(); }
