import assert from 'node:assert/strict';
import { openCatalog } from './helpers/catalog-page.mjs';
const { page, close } = await openCatalog({ port: 4213 });
try {
  for (const path of ['/docs/', '/docs/workspace.html']) {
    await page.goto(`http://127.0.0.1:4213${path}`);
    for (const width of [320, 1440]) for (const theme of ['light', 'dark', 'ios-dark']) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
      const edges = await page.locator('.tg-card--link > figure.tg-card__media').evaluateAll(els => els.map(el => {
        const image = el.getBoundingClientRect(), card = el.parentElement.getBoundingClientRect();
        return image.top - card.top - parseFloat(getComputedStyle(el.parentElement).borderTopWidth);
      }));
      assert.ok(edges.length > 0);
      assert.ok(edges.every(offset => Math.abs(offset) <= 1), `${path}/${width}/${theme}: media must meet the inner border, offsets ${edges}`);
    }
  }
  console.log('Card media meets its top border in catalog/workspace, mobile/desktop, three themes.');
} finally { await close(); }
