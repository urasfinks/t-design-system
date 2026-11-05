import assert from 'node:assert/strict';
import { openCatalog } from './helpers/catalog-page.mjs';
const { page, close } = await openCatalog({ port: 4212 });
try {
  let timer;
  try {
    const count = await Promise.race([
      page.evaluate(() => {
        const button = document.querySelector('[data-toast-demo="saved"]');
        for (let i = 0; i < 20; i++) button.click();
        return document.querySelectorAll('#demo-toast-region .tg-toast').length;
      }),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Toast burst blocked the page event loop')), 3000); }),
    ]);
    assert.ok(count <= 5, `at most five toast nodes after a burst, got ${count}`);
  } finally { clearTimeout(timer); }
  await page.waitForTimeout(250);
  assert.ok(await page.locator('#demo-toast-region .tg-toast').count() <= 5);
  await page.locator('#demo-toast-region .tg-toast__close').last().click();
  await page.waitForTimeout(250);
  assert.equal(await page.locator('#demo-toast-region .tg-toast').count(), 4, 'close still works after the burst');
  assert.equal(await page.evaluate(() => 2 + 2), 4, 'event loop remains responsive');
  console.log('Toast burst: 20 immediate activations keep ≤5 nodes, page responsive, close/disposal intact.');
} finally { await close(); }
