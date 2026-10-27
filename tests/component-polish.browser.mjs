import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
const server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: '4191' }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await mkdir('artifacts/polish', { recursive: true });
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('http://127.0.0.1:4191/docs/compositions.html');
    for (const size of [16, 32]) {
      await page.evaluate(size => document.documentElement.style.fontSize = `${size}px`, size);
      await page.locator('#demo-message').fill('');
      const metrics = await page.locator('#demo-message').evaluate(el => {
        const s = getComputedStyle(el);
        const top = parseFloat(s.borderTopWidth) + parseFloat(s.paddingTop);
        const bottom = el.getBoundingClientRect().height - top - parseFloat(s.lineHeight);
        return { difference: Math.abs(top - bottom), height: el.offsetHeight, scroll: el.scrollHeight, client: el.clientHeight };
      });
      assert.ok(metrics.difference <= 1, `single-line message is vertically centered: ${JSON.stringify(metrics)}`);
      // The author avatar shares the field's height, so the row reads as one line.
      const row = await page.evaluate(() => {
        const box = sel => document.querySelector(sel)?.getBoundingClientRect();
        const avatar = box('.tg-composer__form .tg-avatar__initials'), field = box('#demo-message'), send = box('#demo-send');
        return { avatar: avatar && avatar.height ? [avatar.top, avatar.height] : null, field: [field.top, field.height], send: [send.top, send.height] };
      });
      if (row.avatar) assert.ok(Math.abs(row.avatar[0] - row.field[0]) <= 1 && Math.abs(row.avatar[1] - row.field[1]) <= 1, `composer avatar matches the field height: ${JSON.stringify(row)}`);
      assert.ok(Math.abs(row.send[0] - row.field[0]) <= 1 && Math.abs(row.send[1] - row.field[1]) <= 1, `send button matches the field height: ${JSON.stringify(row)}`);
      await page.locator('#demo-message').fill('А\nБ\nВ');
      assert.equal(await page.locator('#demo-message').evaluate(el => el.scrollHeight <= el.clientHeight + 1), true, 'multiline message is not clipped');
    }
    await page.evaluate(() => document.documentElement.style.removeProperty('font-size'));
    await page.locator('#demo-message').fill('');
    // Ghost actions under a comment align their labels with the comment text, not their padding box.
    const comment = await page.evaluate(() => {
      const root = document.querySelector('.tg-comment');
      const text = root.querySelector('.tg-comment__text').getBoundingClientRect().left;
      const range = document.createRange(); range.selectNodeContents(root.querySelector('.tg-comment__actions .tg-btn'));
      return { text, label: range.getBoundingClientRect().left };
    });
    assert.ok(Math.abs(comment.label - comment.text) <= 1, `${width}px: first comment action label aligns with the text: ${JSON.stringify(comment)}`);
    // Reply quote and caption belong to the field: they share its start edge, after the avatar.
    await page.locator('#demo-reply').click();
    const edges = await page.evaluate(() => {
      const left = sel => { const el = document.querySelector(sel); const r = el?.getBoundingClientRect(); return r && r.width ? Math.round(r.left) : null; };
      return { field: left('.tg-composer__input'), reply: left('#demo-reply-preview'), caption: left('.tg-composer__caption') };
    });
    assert.equal(edges.reply, edges.field, `${width}px: reply quote starts at the field: ${JSON.stringify(edges)}`);
    if (edges.caption !== null) assert.equal(edges.caption, edges.field, `${width}px: caption starts at the field: ${JSON.stringify(edges)}`);
    await page.locator('#demo-cancel-reply').click();
    await page.screenshot({ path: `artifacts/polish/composer-${width}.png` });
    await page.goto('http://127.0.0.1:4191/docs/#icons');
    const clear = page.locator('#icon-reset');
    assert.equal(await clear.evaluate(el => getComputedStyle(el).borderTopWidth), '0px');
    assert.equal(await clear.evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
    await clear.hover();
    assert.equal(await clear.evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
    assert.equal(await clear.evaluate(el => getComputedStyle(el).filter), 'none');
    assert.ok(await clear.evaluate(el => {
      const search = el.closest('.tg-search');
      return Math.abs(search.getBoundingClientRect().right - parseFloat(getComputedStyle(search).borderRightWidth) - el.getBoundingClientRect().right) <= .5;
    }), 'clear button reaches the search field inner edge');
    await clear.focus();
    assert.notEqual(await clear.evaluate(el => getComputedStyle(el).outlineStyle), 'none');
    await page.locator('#icon-search').fill('home');
    await clear.click();
    assert.equal(await page.locator('#icon-search').inputValue(), '');
    await page.screenshot({ path: `artifacts/polish/search-${width}.png` });
    await page.goto('http://127.0.0.1:4191/docs/bottom-panel.html');
    await page.locator('summary').click();
    for (const theme of ['light', 'dark', 'ios-dark']) {
      await page.locator('#panel-theme').selectOption(theme);
      assert.equal(await page.locator('#orders-panel.tg-list > summary.tg-list-item').count(), 1);
      assert.equal(await page.locator('#panel-content .tg-list').count(), 0, 'no nested list/card');
      assert.equal(await page.locator('#panel-content > [data-order].tg-list-item').count(), 3);
      assert.equal(await page.locator('.tg-bottom-panel').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
      assert.equal(await page.locator('.tg-bottom-panel').evaluate(el => getComputedStyle(el).boxShadow), 'none');
      assert.equal(await page.locator('#panel-content').evaluate(el => getComputedStyle(el).display), 'contents');
      const geometry = await page.locator('#orders-panel').evaluate(el => {
        const header = getComputedStyle(el.querySelector('summary'));
        const row = getComputedStyle(el.querySelector('[data-order]'));
        return { header: header.padding, row: row.padding, radius: getComputedStyle(el).borderRadius };
      });
      assert.equal(geometry.header, geometry.row, 'total uses actual tg-list-item geometry');
      assert.notEqual(geometry.radius, '0px', 'standard list owns its own radius');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: `artifacts/polish/orders-${theme}-${width}.png` });
    }
    await page.locator('#panel-example').selectOption('form');
    assert.notEqual(await page.locator('#panel-content').evaluate(el => getComputedStyle(el).padding), '0px');
    await page.getByRole('textbox', { name: 'Адрес' }).fill('Тверская, 1');
  }
  console.log('Component polish: centered composer at 100/200%, multiline, borderless search clear, unified order list; 320/390/1280px and three themes passed.');
} finally { await browser.close(); server.kill(); }
