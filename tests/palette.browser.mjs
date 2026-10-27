import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';

const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
try {
  const page = await browser.newPage();
  const html = await readFile('docs/index.html', 'utf8');
  const table = html.slice(html.indexOf('<div class="palette-table-wrap">'), html.indexOf('<div class="foundation-grid">'));
  const css = await readFile('dist/t-design-system.css', 'utf8');
  const catalog = await readFile('docs/catalog.css', 'utf8');
  await page.setContent(`<style>${css}\n${catalog}</style>${table}`);
  assert.equal(await page.locator('.palette-table tbody tr').count(), 4);
  assert.equal(await page.locator('.palette-swatch').count(), 12);
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    const colors = await page.evaluate(theme => {
      const resolve = token => {
        const probe = document.createElement('span');
        probe.style.color = `var(--${token})`; document.body.append(probe);
        const value = getComputedStyle(probe).color; probe.remove(); return value;
      };
      return [
        resolve('background-main') === resolve('bg-color'),
        resolve('accent-main') === resolve('button-color'),
        resolve('text-main') === resolve('text-color'),
        resolve('danger-main') === resolve('destructive-text-color'),
      ];
    }, theme);
    assert.ok(colors.every(Boolean), `${theme}: all main colors must remain original`);
    if (theme === 'dark') {
      const exact = await page.locator('.palette-table tbody tr').first().locator('.palette-swatch').evaluateAll(elements => elements.map(el => getComputedStyle(el).backgroundColor));
      assert.deepEqual(exact, ['rgb(21, 30, 39)', 'rgb(33, 45, 59)', 'rgb(29, 39, 51)']);
    }
    if (theme !== 'light') {
      const tones = await page.evaluate(() => {
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        return ['background-main', 'background-muted', 'background-panel'].map(token => {
          const sample = document.querySelector(`[style="background:var(--${token})"]`);
          context.fillStyle = getComputedStyle(sample).backgroundColor; context.fillRect(0, 0, 1, 1);
          const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
          return r * .2126 + g * .7152 + b * .0722;
        });
      });
      assert.ok(tones[0] < tones[1] && tones[1] < tones[2], `${theme}: main < muted < panel brightness`);
    }
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${theme}: table overflow at ${width}px`);
      assert.equal(await page.getByRole('table').count(), 1, `${theme}: native table semantics remain`);
      assert.equal(await page.getByRole('row').count(), 5, `${theme}: header and palette rows remain accessible`);
      const tokens = await page.locator('.palette-table code').evaluateAll(elements => elements.map(el => ({
        text: el.textContent,
        wrap: getComputedStyle(el).overflowWrap,
        wordBreak: getComputedStyle(el).wordBreak,
        fits: el.getBoundingClientRect().width <= el.parentElement.getBoundingClientRect().width + 1 && el.scrollWidth <= el.clientWidth + 1,
      })));
      assert.equal(new Set(tokens.map(token => token.text)).size, 12);
      assert.ok(tokens.every(token => token.fits), `${theme}/${width}: token names fit their cells`);
      if (width <= 390) {
        assert.ok(tokens.every(token => token.wrap !== 'anywhere' && token.wordBreak !== 'break-all'), `${theme}/${width}: full tokens do not break into arbitrary fragments`);
        assert.ok(await page.locator('.palette-table tbody tr').evaluateAll(rows => rows.every(row => getComputedStyle(row).display === 'grid')));
        const zoom = await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${theme}/${width}: palette supports 200% text`);
        assert.ok(await page.locator('.palette-table code').evaluateAll(elements => elements.every(el => el.scrollWidth <= el.clientWidth + 1)), `${theme}/${width}: tokens stay readable at 200% text`);
        await zoom.evaluate(el => el.remove());
      }
    }
    await page.locator('body').evaluate(el => el.style.setProperty('--accent-main', '#18745b'));
    assert.ok(await page.locator('[style="background:var(--accent-strong)"]').evaluate(el => getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)'));
    await page.locator('body').evaluate(el => el.style.removeProperty('--accent-main'));
  }
  console.log('Palette: four original colors, 12 table samples, three themes and responsive layouts passed.');
} finally { await browser.close(); }
