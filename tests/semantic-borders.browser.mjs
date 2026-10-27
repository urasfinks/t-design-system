import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium, webkit } from 'playwright';

// Contract for small elements: an outline means "you can act on this".
// Panels (cards, lists, tables, notices) keep their own outline and are out of scope.
const server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: '4192' }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
let browser;
try {
  browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4192/docs/');
  let checks = 0;
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
    const report = await page.evaluate(() => {
      const visible = color => { const alpha = color.match(/[\d.]+(?=\)$)/); return !/rgba\(.*,\s*0\)$/.test(color) && !(color.startsWith('rgba') && alpha && Number(alpha[0]) === 0); };
      const outlined = el => {
        const style = getComputedStyle(el);
        return parseFloat(style.borderTopWidth) > 0 && style.borderTopStyle !== 'none' && visible(style.borderTopColor);
      };
      const interactive = el => el.matches('a[href], button, [role="button"], [role="checkbox"], [tabindex]:not([tabindex="-1"])');
      const all = selector => [...document.querySelectorAll(selector)];
      return {
        staticBadges: all('.tg-badge').filter(el => !interactive(el) && !el.closest('.tg-avatar')).map(el => [el.textContent.trim(), outlined(el)]),
        actionBadges: all('a.tg-badge[href], button.tg-badge').map(el => [el.textContent.trim(), outlined(el)]),
        // A pressed filter is filled instead; the fill marks it as an action too.
        chips: all('.tg-chip:not([aria-pressed="true"], [aria-checked="true"])').map(el => [el.textContent.trim(), outlined(el)]),
        staticAvatars: all('span.tg-avatar').filter(el => !el.closest('.avatar-stack, .preview-stage')).map(el => [el.textContent.trim(), outlined(el)]),
        actionAvatars: all('button.tg-avatar').map(el => [el.getAttribute('aria-label'), outlined(el)]),
        linkRows: all('a.tg-list-item[href]').map(el => [el.textContent.trim().slice(0, 30), el.getBoundingClientRect().height >= 44, getComputedStyle(el).cursor, getComputedStyle(el).textDecorationLine]),
        dataRows: all('div.tg-list-item').map(el => getComputedStyle(el).cursor),
      };
    });
    for (const [name, has] of report.staticBadges) { assert.equal(has, false, `${theme}: status "${name}" has no outline`); checks++; }
    for (const [name, has] of report.actionBadges) { assert.equal(has, true, `${theme}: linked badge "${name}" is outlined`); checks++; }
    for (const [name, has] of report.chips) { assert.equal(has, true, `${theme}: filter "${name}" is outlined`); checks++; }
    for (const [name, has] of report.staticAvatars) { assert.equal(has, false, `${theme}: static avatar "${name}" has no outline`); checks++; }
    for (const [name, has] of report.actionAvatars) { assert.equal(has, true, `${theme}: selectable avatar "${name}" is outlined`); checks++; }
    for (const [name, tall, cursor, decoration] of report.linkRows) {
      assert.ok(tall, `${theme}: link row "${name}" keeps a 44px target`);
      assert.equal(cursor, 'pointer');
      assert.equal(decoration, 'none', `${theme}: link row "${name}" is not underlined`);
      checks += 3;
    }
    assert.ok(report.dataRows.every(cursor => cursor !== 'pointer'), `${theme}: data rows do not pretend to be clickable`);
    assert.ok(report.staticBadges.length >= 5 && report.actionBadges.length >= 1 && report.chips.length >= 3 && report.actionAvatars.length >= 2 && report.linkRows.length >= 3);
  }

  // Link rows respond to hover and show keyboard focus; data rows stay still.
  await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
  const row = page.locator('#lists a.tg-list-item').first();
  await row.scrollIntoViewIfNeeded();
  const rest = await row.evaluate(el => getComputedStyle(el).backgroundColor);
  await row.hover();
  await page.waitForTimeout(250);
  assert.notEqual(await row.evaluate(el => getComputedStyle(el).backgroundColor), rest, 'link row reacts to hover');
  await page.mouse.move(0, 0);
  await row.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  assert.notEqual(await row.evaluate(el => getComputedStyle(el).outlineStyle), 'none', 'link row shows keyboard focus');
  const dataRow = page.locator('#orders-example .tg-list-item').first();
  const dataRest = await dataRow.evaluate(el => getComputedStyle(el).backgroundColor);
  await dataRow.hover();
  await page.waitForTimeout(250);
  assert.equal(await dataRow.evaluate(el => getComputedStyle(el).backgroundColor), dataRest, 'data rows do not react to hover');

  // A filter is a toggle button: aria-pressed changes, and the selected one is filled.
  const chip = page.locator('#selection .tg-chip').nth(1);
  assert.equal(await chip.getAttribute('aria-pressed'), 'false');
  const idle = await chip.evaluate(el => getComputedStyle(el).backgroundColor);
  await chip.click();
  assert.equal(await chip.getAttribute('aria-pressed'), 'true');
  await page.mouse.move(0, 0);
  await page.waitForTimeout(250);
  assert.notEqual(await chip.evaluate(el => getComputedStyle(el).backgroundColor), idle, 'pressed filter is filled');
  assert.deepEqual(errors, []);
  console.log(`Semantic borders: ${checks} checks — statuses and static avatars borderless; filters, linked badges, selectable avatars outlined; link rows interactive in three themes.`);
} finally { await browser?.close(); server.kill(); }
