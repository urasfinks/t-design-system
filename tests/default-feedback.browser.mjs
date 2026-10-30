import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import { spawn } from 'node:child_process';
const server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: '4195' }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
try {
  const page = await browser.newPage({ reducedMotion: 'no-preference' });
  await page.goto('http://127.0.0.1:4195/docs/');
  await page.evaluate(() => document.documentElement.style.setProperty('--ripple-duration', '10s'));
  const toggle = page.getByRole('switch', { name: 'Уведомления', exact: true });
  await toggle.locator('.tg-switch__knob').click();
  assert.equal(await toggle.getAttribute('aria-checked'), 'true', 'switch still toggles with the pointer');
  assert.equal(await toggle.locator('.tg-feedback-layer').count(), 0, 'switch has no button ripple');
  await toggle.focus();
  await page.keyboard.press('Space');
  assert.equal(await toggle.getAttribute('aria-checked'), 'false', 'switch still toggles with the keyboard');
  assert.equal(await toggle.locator('.tg-feedback-layer').count(), 0, 'keyboard switch activation has no button ripple');
  assert.notEqual(await toggle.evaluate(el => getComputedStyle(el).outlineStyle), 'none', 'switch keeps visible keyboard focus');
  await page.locator('#primary-demo').click();
  assert.equal(await page.locator('#primary-demo .tg-feedback-layer .tg-ripple__wave').count(), 1, 'ordinary button has the standard effect without opt-in class');
  assert.equal(await page.locator('#primary-demo .tg-ripple__wave').evaluate(el => getComputedStyle(el).animationName), 'tg-ripple-wave');
  assert.equal(await page.locator('#ripple-demo').count(), 0, 'separate effect demo removed');
  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', '<div id="feedback-fixture" style="position:fixed;top:0;left:0;z-index:9999;background:white"><button id="dynamic-feedback" class="tg-icon-btn tg-icon-btn--ghost">×</button><button id="disabled-feedback" class="tg-btn" disabled>Disabled</button><span class="tg-avatar" id="static-avatar">AB</span><button class="tg-avatar" id="interactive-avatar"><span class="tg-badge">3</span>AB</button></div>');
  });
  await page.locator('#dynamic-feedback').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#dynamic-feedback .tg-ripple__wave').count(), 0, 'borderless icon button has no keyboard ripple');
  for (const classes of ['tg-btn tg-btn--ghost', 'tg-icon-btn tg-search__clear', 'tg-icon-btn tg-icon-btn--ghost tg-ripple']) {
    await page.locator('#dynamic-feedback').evaluate((el, classes) => { el.className = classes; }, classes);
    await page.locator('#dynamic-feedback').click();
    assert.equal(await page.locator('#dynamic-feedback .tg-ripple__wave, #dynamic-feedback .tg-feedback-layer').count(), 0, `${classes}: no pointer ripple`);
  }
  assert.ok(await page.locator('#dynamic-feedback').evaluate(el => { const s = getComputedStyle(el); return parseFloat(s.borderTopWidth) >= 1 && s.borderTopColor !== 'rgba(0, 0, 0, 0)'; }), 'a ghost icon button keeps its action outline');
  await page.locator('#interactive-avatar').click();
  assert.equal(await page.locator('#interactive-avatar .tg-feedback-layer').count(), 1);
  assert.notEqual(await page.locator('#interactive-avatar').evaluate(el => getComputedStyle(el).overflow), 'hidden', 'badge and focus are not clipped');
  await page.locator('#static-avatar').click();
  assert.equal(await page.locator('#static-avatar .tg-feedback-layer').count(), 0);
  await page.locator('#disabled-feedback').dispatchEvent('click');
  assert.equal(await page.locator('#disabled-feedback .tg-feedback-layer').count(), 0);
  await page.evaluate(async () => {
    const { initUI } = await import('/dist/ui.js');
    const a = initUI(); const b = initUI(); if (a !== b) throw new Error('initUI is not idempotent'); a();
  });
  assert.equal(await page.locator('.tg-feedback-layer').count(), 0, 'cleanup removes active effects');
  await page.evaluate(async () => (await import('/dist/ui.js')).initUI());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#dynamic-feedback').click();
  assert.equal(await page.locator('.tg-feedback-layer').count(), 0, 'reduced motion skips waves');
  console.log('Default feedback: regular/dynamic/icon/avatar buttons, keyboard, disabled, reduced motion, clipping, idempotence and cleanup passed.');
} finally { await browser.close(); server.kill(); }
