import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { openCatalog } from './helpers/catalog-page.mjs';

const { page, close } = await openCatalog({ port: 4210 });
try {
  for (const width of [320, 390, 1440]) for (const dir of ['ltr', 'rtl']) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(dir => document.documentElement.dir = dir, dir);
    const compare = page.locator('[data-compare]').first();
    const input = compare.locator('.tg-compare__handle');
    await compare.scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    for (const percent of [0, 25, 50, 75, 100]) {
      const box = await compare.boundingBox();
      const logical = dir === 'rtl' ? 100 - percent : percent;
      const x = Math.min(box.x + box.width - 1, Math.max(box.x + 1, box.x + box.width * logical / 100));
      await page.mouse.click(x, box.y + box.height * .75);
      const value = Number(await input.inputValue());
      assert.ok(Math.abs(value - percent) <= 1, `${width}/${dir}/${percent}: pointer boundary must match range, got ${value}`);
      const geometry = await compare.evaluate(el => {
        const r = el.getBoundingClientRect(), g = el.querySelector('.tg-compare__grip').getBoundingClientRect();
        return { center: g.x + g.width / 2 - r.x, width: r.width, value: parseFloat(el.style.getPropertyValue('--compare')) };
      });
      const expected = geometry.width * (dir === 'rtl' ? 100 - geometry.value : geometry.value) / 100;
      assert.ok(Math.abs(geometry.center - expected) < 1, 'grip center follows the image boundary');
    }
    await input.focus(); await input.press('Home');
    assert.equal(await input.inputValue(), '0');
    await input.press('End'); assert.equal(await input.inputValue(), '100');
    assert.equal(await compare.evaluate(el => el.style.getPropertyValue('--compare')), '100%');
    assert.equal(await input.getAttribute('aria-valuetext'), 'до 100%');
  }
  await mkdir('/tmp/tds-compare', { recursive: true });
  await page.evaluate(() => document.documentElement.dir = 'ltr');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.selectOption('#theme', theme);
    const compare = page.locator('[data-compare]').first();
    await compare.scrollIntoViewIfNeeded();
    const box = await compare.boundingBox();
    // Exercise actual native dragging, not only programmatic value assignment.
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * .75);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * .75, box.y + box.height * .75, { steps: 8 });
    await page.mouse.up();
    assert.ok(Math.abs(Number(await compare.locator('input').inputValue()) - 75) <= 1);
    for (const percent of [0, 25, 75, 100]) {
      const x = Math.min(box.x + box.width - 1, Math.max(box.x + 1, box.x + box.width * percent / 100));
      await page.mouse.click(x, box.y + box.height * .75);
      await compare.screenshot({ path: `/tmp/tds-compare/${process.argv.includes('--webkit') ? 'webkit' : 'chromium'}-${theme}-${percent}.png` });
    }
  }
  console.log('Compare: image boundary, native thumb and grip align at 0/25/50/75/100%, 3 widths, LTR/RTL; keyboard endpoints preserved.');
} finally { await close(); }
