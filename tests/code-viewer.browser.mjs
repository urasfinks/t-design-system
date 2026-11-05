import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { openCatalog } from './helpers/catalog-page.mjs';
const { page, close } = await openCatalog({ port: 4215 });
try {
  await mkdir('/tmp/tds-code-viewer', { recursive: true });
  for (const width of [320, 1440]) for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.setViewportSize({ width, height: 900 }); await page.selectOption('#theme', theme);
    const viewers = page.locator('#buttons details.example-code');
    const first = viewers.nth(0), second = viewers.nth(1);
    await first.locator('summary').click();
    const geometry = await first.evaluate(el => {
      const summary = el.querySelector('summary'), body = el.querySelector('.tg-disclosure__content');
      const pre = body.querySelector('pre'), actions = body.lastElementChild;
      return { children: body.children.length, height: summary.getBoundingClientRect().height, topGap: pre.getBoundingClientRect().top - summary.getBoundingClientRect().bottom, outerBorder: getComputedStyle(el).borderLeftWidth, radius: getComputedStyle(el).borderTopLeftRadius, border: getComputedStyle(pre).borderLeftWidth, nestedCard: pre.classList.contains('tg-card'), gap: actions.getBoundingClientRect().top - pre.getBoundingClientRect().bottom };
    });
    assert.equal(geometry.outerBorder, '0px', 'embedded accordion must not duplicate panel side borders'); assert.equal(geometry.radius, '0px'); assert.ok(geometry.topGap >= 12, 'space above code'); assert.equal(geometry.children, 2); assert.equal(geometry.border, '0px'); assert.equal(geometry.nestedCard, false);
    assert.ok(geometry.height >= 44 && geometry.height <= 49, `compact touch-safe trigger ${geometry.height}`);
    assert.ok(geometry.gap >= 8, 'code and copy action are separate padded blocks');
    assert.ok((await first.boundingBox()).width <= width, 'long code does not expand the accordion beyond the viewport');
    await first.locator('xpath=ancestor::*[contains(@class, "example-panel")][1]').screenshot({ path: `/tmp/tds-code-viewer/${process.argv.includes('--webkit') ? 'webkit' : 'chromium'}-${width}-${theme}.png` });
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedExample = text; } } }));
    await first.getByRole('button', { name: 'Скопировать HTML' }).click();
    assert.equal(await page.evaluate(() => window.copiedExample), await first.locator('code').textContent());
    await second.locator('summary').click();
    assert.equal(await first.getAttribute('open'), null);
    assert.equal(await page.locator('details.example-code[open]').count(), 1);
    await second.locator('summary').click();
  }
  console.log('HTML accordion: one open section, compact ≥44px trigger, borderless code + separated copy row, clipboard exact, 2 widths/3 themes.');
} finally { await close(); }
