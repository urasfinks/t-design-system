import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { openCatalog } from './helpers/catalog-page.mjs';
import { measureContrast } from './helpers/contrast.mjs';

const { page, close } = await openCatalog({ port: 4206 });
try {
  const failures = [];
  const test = async (name, fn) => {
    try { await fn(); console.log(`✓ ${name}`); }
    catch (error) { failures.push(`${name}: ${error.message}`); console.log(`✗ ${name}: ${error.message}`); }
  };
  await test('search options have presentational list wrappers', async () => {
    await page.getByRole('button', { name: 'Поиск по каталогу', exact: true }).first().click();
    assert.ok(await page.locator('#catalog-search-results > li').evaluateAll(els => els.length > 100 && els.every(el => ['none', 'presentation'].includes(el.getAttribute('role')))));
    await page.keyboard.press('Escape');
  });
  await page.keyboard.press('Escape');
  await test('badge labels include their visible count', async () => {
    assert.ok(await page.locator('#badges button.tg-badge').evaluateAll(els => els.length === 4 && els.every(el => el.getAttribute('aria-label')?.includes(el.textContent.trim()))));
  });
  await test('image labels retain contrast over a white image in all themes', async () => {
    for (const theme of ['light', 'dark', 'ios-dark']) {
      await page.selectOption('#theme', theme);
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        const labels = page.locator('.tg-image-accordion__trigger > span');
        for (let i = 0; i < await labels.count(); i++) {
          const result = await labels.nth(i).evaluate(el => {
            // The worst-case input photograph is opaque white. An authored label
            // surface must protect the text independently of the photo/gradient.
            const parent = el.parentElement;
            const old = parent.style.background;
            parent.style.background = 'white';
            return { old, html: el.outerHTML };
          });
          const selector = `.tg-image-accordion__item:nth-child(${i + 1}) .tg-image-accordion__trigger > span`;
          const contrast = await page.evaluate(measureContrast, { selector });
          await labels.nth(i).evaluate((el, old) => el.parentElement.style.background = old, result.old);
          assert.ok(contrast.ratio >= 4.5, `${theme}/${width}/${i}: ${contrast.ratio}`);
        }
      }
    }
  });
  await test('compact action slots retain the whole target when rows wrap and tokens change', async () => {
    for (const width of [320, 390, 1440]) for (const dir of ['ltr', 'rtl']) for (const size of [44, 64]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(([dir, size]) => { document.documentElement.dir = dir; document.documentElement.style.setProperty('--control-h', `${size}px`); }, [dir, size]);
      const actions = page.locator('#badges button.tg-badge, #badges a.tg-badge');
      for (let i = 0; i < await actions.count(); i++) {
        const action = actions.nth(i); await action.scrollIntoViewIfNeeded();
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const hits = await action.evaluate((el, size) => {
          const r = el.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2;
          return [-1, 1].every(sign => el.contains(document.elementFromPoint(x, y + sign * (size / 2 - 1)))) && r.height < size;
        }, size);
        assert.ok(hits, `${width}/${dir}/${size}/action ${i}: compact visual and unobstructed target`);
      }
    }
    await page.evaluate(() => { document.documentElement.dir = 'ltr'; document.documentElement.style.removeProperty('--control-h'); });
  });
  await page.evaluate(() => { document.documentElement.dir = 'ltr'; document.documentElement.style.removeProperty('--control-h'); });
  await test('overflow regions gain and release keyboard focus with actual overflow', async () => {
    await page.setViewportSize({ width: 320, height: 900 });
    const region = page.locator('#start > pre').first(); await region.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => { const e = document.querySelector('#start > pre'); return e.scrollWidth <= e.clientWidth || e.tabIndex === 0; }, null, { timeout: 3000 });
    assert.equal(await region.getAttribute('tabindex'), '0');
    await region.evaluate(el => { el.scrollLeft = 0; });
    await region.focus(); const before = await region.evaluate(el => el.scrollLeft);
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(200);
    assert.ok(await region.evaluate(el => el.scrollLeft) > before, `arrow scrolls the region: ${JSON.stringify(await region.evaluate(el => ({ before: el.scrollLeft, w: el.clientWidth, scroll: el.scrollWidth, focused: document.activeElement === el, direction: getComputedStyle(el).direction })))}`);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForFunction(() => document.querySelector('#start > pre').tabIndex === -1);
    assert.ok(await region.getAttribute('aria-label'));
  });
  await test('carousel slides preserve native figures inside valid named groups', async () => {
    const slides = page.locator('.tg-carousel__slide');
    assert.ok(await slides.evaluateAll(els => els.length >= 20 && els.every(el => el.tagName === 'DIV' && el.getAttribute('role') === 'group' && el.querySelector('figure > img'))));
    assert.equal(await slides.locator('figure > figcaption').count(), 20, 'all existing captions remain native figure captions');
    assert.ok(await page.locator('.tg-carousel__thumbs img').evaluateAll(els => els.every(el => el.width > 0 && el.hasAttribute('width') && el.hasAttribute('height'))));
  });
  await test('catalog loads the prebuilt compressed CSS', async () => {
    assert.ok(await page.locator('link[rel=stylesheet]').evaluateAll(els => els.some(el => el.getAttribute('href') === '../dist/t-design-system.min.css')));
  });
  await test('scroll region runtime handles content resize and cleanup', async () => {
    await page.evaluate(async () => {
      const { initScrollRegions } = await import('/dist/ui.js');
      const root = document.createElement('div'); root.id = 'scroll-fixture';
      root.innerHTML = '<div class="tg-scroll-region" tabindex="0" role="region" aria-label="Данные" style="width:200px;overflow:auto"><div style="width:600px;height:24px">Данные</div></div>';
      document.body.append(root);
      window.stopScrollFixture = initScrollRegions(root);
      if (window.stopScrollFixture !== initScrollRegions(root)) throw Error('initializer must be idempotent');
    });
    const region = page.locator('#scroll-fixture > div');
    assert.equal(await region.getAttribute('tabindex'), '0');
    await region.locator('div').evaluate(el => el.style.width = '50px');
    await page.waitForFunction(() => document.querySelector('#scroll-fixture > div').tabIndex === -1);
    await region.locator('div').evaluate(el => el.style.width = '600px');
    await page.waitForFunction(() => document.querySelector('#scroll-fixture > div').tabIndex === 0);
    await page.evaluate(() => { window.stopScrollFixture(); document.querySelector('#scroll-fixture').remove(); });
  });
  await mkdir('/tmp/tds-ui-audit-fixes', { recursive: true });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.selectOption('#theme', theme);
    for (const [name, selector] of [['badges', '#badges button.tg-badge'], ['captions', '.tg-image-accordion']]) {
      await page.locator(selector).first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: `/tmp/tds-ui-audit-fixes/${process.argv.includes('--webkit') ? 'webkit' : 'chromium'}-${name}-${theme}.png` });
    }
  }
  assert.deepEqual(failures, [], failures.join('\n'));
} finally { await close(); }
