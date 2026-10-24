import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { compileString } from 'sass';
import { chromium, webkit } from 'playwright';

const css = compileString("@use 'components/effects';", { loadPaths: [resolve('src')] }).css;
const runtime = await readFile('src/effects.mjs', 'utf8');
const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
const page = await browser.newPage();
try {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setContent(`<style>${css}</style><style>#host{width:200px;height:80px;--ripple-duration:10s;--ring-duration:10s;--wash-duration:10s}</style>
    <button id="host" class="tg-ripple tg-ripple--dark"><span>Action</span></button>
    <button id="disabled" class="tg-ripple" disabled>Disabled</button>
    <div aria-disabled="true"><button id="aria-disabled" class="tg-ripple">Disabled ancestor</button></div>
    <input id="input" class="tg-ripple" value="Input"><button id="light" class="tg-ripple tg-ripple--light">Light</button>
    <div id="scope"><button id="scoped" class="tg-ripple">Scoped</button></div>
    <div id="glass" class="tg-glass">Glass</div><div id="transition" class="tg-transition">Transition</div>`);
  await page.addScriptTag({ type: 'module', content: `${runtime}\nwindow.initRipple = initRipple; window.disposeRipple = initRipple(); window.rippleReady = true;` });
  await page.waitForFunction(() => window.rippleReady);
  const hostBox = await page.locator('#host').boundingBox();
  await page.mouse.click(hostBox.x + 30, hostBox.y + 20);
  assert.equal(await page.locator('#host > [aria-hidden="true"]').count(), 3);
  assert.deepEqual(await page.locator('.tg-ripple__wave').evaluate(el => [el.style.left, el.style.top, el.style.getPropertyValue('--ripple-size')]), ['30px', '20px', '400px']);
  assert.match(await page.locator('.tg-ripple__wave').evaluate(el => getComputedStyle(el).backgroundColor), /255, 255, 255/);
  await page.locator('#host > [aria-hidden="true"]').evaluateAll(nodes => nodes.forEach(node => node.dispatchEvent(new Event('animationend'))));
  assert.equal(await page.locator('.tg-ripple__wave').count(), 0);
  await page.locator('#host').focus();
  await page.keyboard.press('Enter');
  assert.deepEqual(await page.locator('.tg-ripple__wave').evaluate(el => [el.style.left, el.style.top]), ['100px', '40px']);
  await page.evaluate(() => window.disposeRipple());
  assert.equal(await page.locator('#host > [aria-hidden="true"]').count(), 0);
  await page.locator('#host').click();
  assert.equal(await page.locator('.tg-ripple__wave').count(), 0);
  await page.evaluate(() => { window.disposeRipple = initRipple(); });
  await page.locator('#light').click();
  assert.match(await page.locator('#light .tg-ripple__wave').evaluate(el => getComputedStyle(el).backgroundColor), /0, 0, 0/);
  assert.deepEqual(await page.locator('#light > [aria-hidden="true"]').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).animationDuration)), ['0.5s', '0.6s', '0.7s']);
  await page.evaluate(() => { window.disposeRipple(); window.disposeRipple = initRipple(document.getElementById('scope')); });
  await page.locator('#host').click();
  assert.equal(await page.locator('.tg-ripple__wave').count(), 0);
  await page.locator('#scope').evaluate(el => el.style.setProperty('--ripple-duration', '2s'));
  await page.locator('#scoped').click();
  assert.equal(await page.locator('#scoped .tg-ripple__wave').evaluate(el => getComputedStyle(el).animationDuration), '2s', 'legacy hosts inherit duration from their container');
  assert.equal(await page.locator('#scoped .tg-ripple__wave').count(), 1);
  await page.evaluate(() => { window.disposeRipple(); window.disposeRipple = initRipple(); });
  await page.evaluate(() => {
    for (const id of ['disabled', 'aria-disabled', 'input']) document.getElementById(id).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  assert.equal(await page.locator('.tg-ripple__wave').count(), 0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#host').click();
  assert.equal(await page.locator('.tg-ripple__wave').count(), 0);
  await page.locator('#transition').evaluate(el => el.classList.add('is-hidden'));
  assert.equal(await page.locator('#transition').evaluate(el => getComputedStyle(el).visibility), 'hidden');
  assert.equal(await page.locator('#transition').evaluate(el => getComputedStyle(el).transitionDuration), '0s');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addStyleTag({ content: '.tg-ripple > [aria-hidden="true"] { animation-name: none; animation-duration: 20ms; }' });
  await page.locator('#host').click();
  assert.equal(await page.locator('.tg-ripple__wave').count(), 1);
  await page.waitForFunction(() => !document.querySelector('.tg-ripple__wave'));
  assert.equal(await page.locator('.tg-ripple__ring, .tg-ripple__wash').count(), 0);
  assert.notEqual(await page.locator('#glass').evaluate(el => getComputedStyle(el).backdropFilter), 'none');
  await page.evaluate(() => { window.disposeRipple(); window.disposeRipple(); });
  console.log('Effects: geometry, keyboard, disabled, motion, animation cleanup, timer fallback, disposal and glass passed.');
} finally { await browser.close(); }
