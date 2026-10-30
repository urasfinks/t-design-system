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
    await page.waitForTimeout(400); // controls transition their colours on theme change
    const report = await page.evaluate(() => {
      const visible = color => { const alpha = color.match(/[\d.]+(?=\)$)/); return !/rgba\(.*,\s*0\)$/.test(color) && !(color.startsWith('rgba') && alpha && Number(alpha[0]) === 0); };
      const outlined = el => {
        const style = getComputedStyle(el);
        return parseFloat(style.borderTopWidth) > 0 && style.borderTopStyle !== 'none' && visible(style.borderTopColor);
      };
      const interactive = el => el.matches('a[href], button, [role="button"], [role="checkbox"], [tabindex]:not([tabindex="-1"])');
      const all = selector => [...document.querySelectorAll(selector)];
      return {
        staticBadges: all('.tg-badge').filter(el => !interactive(el) && !el.closest('.tg-avatar, a[href], button, summary')).map(el => [el.textContent.trim(), outlined(el)]),
        // A badge inside something clickable is part of that action and carries its outline.
        nestedBadges: all('.tg-badge').filter(el => !interactive(el) && !el.closest('.tg-avatar') && el.parentElement.closest('a[href], button, summary')).map(el => [el.textContent.trim(), outlined(el)]),
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
    for (const [name, has] of report.nestedBadges) { assert.equal(has, true, `${theme}: badge "${name}" inside an action is outlined`); checks++; }
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
    // The action outline must read as stronger than the panel outline, or the rule is invisible.
    const outlines = await page.evaluate(() => {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const rgba = color => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data].map((v, i) => i === 3 ? v / 255 : v); };
      const over = (fg, bg) => fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3])).concat(1);
      const lum = rgb => rgb.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
      const ratio = el => {
        let ground = [255, 255, 255, 1];
        const chain = []; for (let node = el.parentElement; node; node = node.parentElement) chain.unshift(node);
        for (const node of chain) ground = over(rgba(getComputedStyle(node).backgroundColor), ground);
        const line = over(rgba(getComputedStyle(el).borderTopColor), ground);
        const [a, b] = [lum(line), lum(ground)].sort((x, y) => y - x);
        return (a + .05) / (b + .05);
      };
      const pick = selector => ratio(document.querySelector(selector));
      return {
        shared: (() => { const probe = document.createElement('i'); probe.style.color = 'var(--action-border-color)'; document.body.append(probe); const c = getComputedStyle(probe).color; probe.remove(); return c; })(),
        actionColors: ['#selection .tg-chip[aria-pressed="false"]', '#selection a.tg-badge', '#avatars button.tg-avatar[aria-checked="false"]', '#buttons .tg-btn--secondary', '#choices .tg-check:not(:checked)', '#choices .tg-radio:not(:checked)'].map(s => [s, getComputedStyle(document.querySelector(s)).borderTopColor]),
        // Secondary and icon buttons: the fill carries the shape, a visible shared outline marks the edge.
        filled: ['#buttons .tg-btn--secondary', '#buttons .tg-icon-btn:not(.tg-icon-btn--ghost)'].map(s => { const el = document.querySelector(s), cs = getComputedStyle(el); return [s, rgba(cs.borderTopColor)[3], rgba(cs.backgroundColor)[3]]; }),
        panels: ['#surfaces .tg-card', '#lists .tg-list', '#feedback .tg-notice'].map(s => [s, pick(s)]),
      };
    });
    for (const [selector, color] of outlines.actionColors) { assert.equal(color, outlines.shared, `${theme}: action outline ${selector} is the one shared action outline`); checks++; }
    for (const [selector, border, fill] of outlines.filled) { assert.ok(border >= .2 && fill > 0, `${theme}: ${selector} has a fill and a visible shared outline (alpha ${border.toFixed(3)})`); checks++; }
    for (const [selector, value] of outlines.panels) { assert.ok(value <= 1.35, `${theme}: panel outline ${selector} ${value.toFixed(2)}:1 stays quiet`); checks++; }
    assert.ok(report.staticBadges.length >= 5 && report.actionBadges.length >= 1 && report.chips.length >= 3 && report.actionAvatars.length >= 2 && report.linkRows.length >= 3);
  }

  // With a contrast preference the button outline comes back.
  await page.emulateMedia({ contrast: 'more' });
  assert.ok(await page.locator('#buttons .tg-btn--secondary').first().evaluate(el => { const c = getComputedStyle(el).borderTopColor.match(/[\d.]+/g).map(Number); return (c[3] ?? 1) >= .2; }), 'prefers-contrast: more makes the secondary outline a full action outline');
  await page.emulateMedia({ contrast: 'no-preference' });
  checks++;

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
  // Avatars are pictures, not text: no I-beam cursor, initials cannot be selected.
  const avatars = await page.locator('#avatars .tg-avatar, #surfaces .tg-avatar').evaluateAll(nodes => nodes.map(node => ({
    tag: node.tagName, cursor: getComputedStyle(node).cursor,
    select: getComputedStyle(node).userSelect, initials: node.querySelector('.tg-avatar__initials, .tg-avatar__clip') && getComputedStyle(node.querySelector('.tg-avatar__initials, .tg-avatar__clip')).cursor,
  })));
  assert.ok(avatars.length >= 5);
  for (const avatar of avatars) {
    assert.equal(avatar.select, 'none', `${avatar.tag} avatar text is not selectable`);
    assert.equal(avatar.cursor, avatar.tag === 'BUTTON' ? 'pointer' : 'default', `${avatar.tag} avatar cursor`);
    if (avatar.initials) assert.notEqual(avatar.initials, 'text', 'initials do not show a text cursor');
    checks += 2;
  }
  // Dismiss actions (close, cancel) are auxiliary: transparent, with the shared action outline, wherever they appear.
  for (const path of ['docs/', 'docs/compositions.html']) {
    const view = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await view.goto(`http://127.0.0.1:4192/${path}`);
    const dismiss = await view.locator('button.tg-icon-btn').evaluateAll(buttons => buttons
      .filter(button => /^(Закрыть|Отменить)/.test(button.getAttribute('aria-label') || ''))
      .map(button => { const style = getComputedStyle(button); return [button.getAttribute('aria-label'), style.borderTopColor, style.backgroundColor]; }));
    assert.ok(dismiss.length >= (path.endsWith('compositions.html') ? 2 : 1), `${path}: dismiss buttons found`);
    for (const [label, width, background] of dismiss) {
      assert.notEqual(width, 'rgba(0, 0, 0, 0)', `${path}: «${label}» retains its action outline`);
      assert.equal(background, 'rgba(0, 0, 0, 0)', `${path}: «${label}» is transparent`);
      checks += 2;
    }
    await view.close();
  }
  assert.deepEqual(errors, []);
  console.log(`Semantic borders: ${checks} checks — statuses and static avatars borderless; filters, linked badges, selectable avatars outlined; link rows interactive in three themes.`);
} finally { await browser?.close(); server.kill(); }
