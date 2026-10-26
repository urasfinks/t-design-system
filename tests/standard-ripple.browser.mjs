import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { compileString } from 'sass';
import { chromium, webkit } from 'playwright';
const css = compileString("@use 'index';", { loadPaths: [resolve('src')] }).css;
const runtime = await readFile('src/effects.mjs', 'utf8');
// Importing the auto entry must also be safe in Node/SSR.
await import('../src/ui.mjs');
const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
const page = await browser.newPage();
try {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setContent(`<style>${css}</style><style>button,summary{width:160px;height:60px;--ripple-duration:10s;transform:none!important;transition:none!important}</style>
    <button id="standard" class="tg-btn"><span>Action</span></button>
    ${['tg-icon-btn','tg-chip','tg-tab','tg-tabbar__item','tg-dot','tg-avatar','tg-switch','tg-badge','tg-bottom-panel__header'].map((name,i) => `<button id="control${i}" class="${name}">Action</button>`).join('')}
    <a class="tg-badge" href="#" id="badge-link">Open</a>
    <details class="tg-disclosure"><summary id="summary">More</summary></details>
    <fieldset disabled><button id="disabled" class="tg-btn">Disabled</button></fieldset>
    <button id="aria" class="tg-btn" aria-disabled="true">Disabled</button>
    <div aria-disabled="true"><button id="ancestor-disabled" class="tg-btn">Disabled ancestor</button></div>`);
  await page.addScriptTag({ type:'module', content: `${runtime}\nwindow.initRipple = initRipple; window.dispose = initRipple(); window.again = initRipple(); window.ready = true;` });
  await page.waitForFunction(() => window.ready);
  const box = await page.locator('#standard').boundingBox();
  await page.mouse.move(box.x+17, box.y+23);
  await page.mouse.down();
  assert.equal(await page.locator('#standard .tg-ripple__wave').count(), 1, 'standard buttons ripple on pointer press');
  const point = await page.locator('#standard .tg-ripple__wave').evaluate(el=>[parseFloat(el.style.left),parseFloat(el.style.top)]);
  assert.ok(Math.abs(point[0]-17)<1 && Math.abs(point[1]-23)<1, 'wave starts at the pointer coordinate');
  await page.mouse.up();
  assert.equal(await page.locator('#standard .tg-ripple__wave').count(), 1, 'click does not duplicate pointer wave');
  await page.evaluate(() => document.querySelectorAll('.tg-ripple__wave,.tg-ripple__ring,.tg-ripple__wash').forEach(el=>el.dispatchEvent(new Event('animationend'))));
  await page.locator('#standard').dispatchEvent('pointerdown', {button:0,isPrimary:true,clientX:box.x+10,clientY:box.y+10});
  await page.locator('#standard').dispatchEvent('pointercancel');
  await page.locator('#standard').dispatchEvent('click', {detail:1,clientX:box.x+10,clientY:box.y+10});
  assert.equal(await page.locator('#standard .tg-ripple__wave').count(),2,'cancelled pointer does not suppress later activation');
  await page.evaluate(() => document.querySelectorAll('.tg-ripple__wave,.tg-ripple__ring,.tg-ripple__wash').forEach(el=>el.dispatchEvent(new Event('animationend'))));
  await page.locator('#standard').focus(); await page.keyboard.press('Enter');
  assert.deepEqual(await page.locator('#standard .tg-ripple__wave').evaluate(el=>[el.style.left,el.style.top]), ['80px','30px']);
  for (let i=0;i<9;i++) { await page.locator(`#control${i}`).click(); assert.equal(await page.locator(`#control${i} .tg-ripple__wave`).count(),1); }
  await page.locator('#badge-link').click();
  assert.equal(await page.locator('#badge-link .tg-ripple__wave').count(), 1, 'badge links receive the same control feedback');
  await page.locator('#summary').click(); assert.equal(await page.locator('#summary .tg-ripple__wave').count(),1);
  await page.evaluate(() => { for (const id of ['disabled','aria']) document.getElementById(id).dispatchEvent(new MouseEvent('click',{bubbles:true})); });
  assert.equal(await page.locator('#disabled .tg-ripple__wave,#aria .tg-ripple__wave').count(),0);
  assert.equal(await page.locator('#control5').evaluate(el=>getComputedStyle(el).overflow), 'visible', 'avatar badges remain visible');
  await page.evaluate(() => { window.dispose(); window.again(); });
  assert.equal(await page.locator('.tg-ripple__wave').count(),0);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(() => { window.dispose = initRipple(); });
  await page.locator('#standard').click(); assert.equal(await page.locator('.tg-ripple__wave').count(),0);
  const dotStyle = () => page.locator('#control4').evaluate(el => {
    const style = getComputedStyle(el, '::after');
    return [style.position, style.width, style.height, style.backgroundColor, style.opacity];
  });
  const restingDot = await dotStyle();
  await page.locator('#control4').evaluate(el => el.dataset.pressed = 'true');
  assert.deepEqual(await dotStyle(), restingDot, 'reduced-motion press preserves pagination dot geometry and color');
  assert.equal(await page.locator('#control4').evaluate(el => getComputedStyle(el).transform), 'none');
  for (const id of ['aria', 'ancestor-disabled', 'disabled']) {
    await page.locator(`#${id}`).evaluate(el => el.dataset.pressed = 'true');
    assert.equal(await page.locator(`#${id}`).evaluate(el => getComputedStyle(el, '::after').content), 'none', `${id} has no pressed fill`);
    const disabledBox = await page.locator(`#${id}`).boundingBox();
    await page.mouse.move(disabledBox.x + 10, disabledBox.y + 10); await page.mouse.down();
    assert.equal(await page.locator(`#${id}`).evaluate(el => getComputedStyle(el).filter), 'none', `${id} has no active filter`);
    await page.mouse.up();
  }
  await page.addStyleTag({content: '.tg-btn { --ripple-press-opacity: .27; }'});
  await page.locator('#standard').evaluate(el => el.dataset.pressed = 'true');
  assert.equal(await page.locator('#standard').evaluate(el => getComputedStyle(el,'::after').opacity), '0.27', 'pressed fill opacity remains cascadeable');
  const ui = (await readFile('src/ui.mjs', 'utf8')).replace("import { initRipple } from './effects.mjs';", runtime);
  await page.evaluate(() => window.dispose());
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.addScriptTag({type:'module', content: `${ui}\nwindow.initUI = initUI; window.uiReady = true;`});
  await page.waitForFunction(() => window.uiReady);
  await page.locator('#standard').click();
  assert.equal(await page.locator('#standard .tg-ripple__wave').count(),1,'UI module automatically initializes document');
  await page.evaluate(() => { window.disposeUI = initUI(); window.disposeUI(); window.disposeUI(); });
  assert.equal(await page.locator('.tg-ripple__wave').count(),0);
  await page.setViewportSize({width:320,height:480});
  await page.setContent(`<style>${css}</style><style>:root{--ripple-duration:12s;--ripple-color:rgb(23, 45, 67)}body{margin:0}.theme{--ring-duration:9s;--ripple-color:rgb(65, 43, 21)}#edge{position:absolute;right:0;top:0;width:160px;height:60px}</style><div class="theme"><button id="edge" class="tg-btn">Edge</button></div>`);
  await page.evaluate(() => { window.disposal = window.initRipple(); });
  await page.locator('#edge').click({position:{x:150,y:20}});
  assert.equal(await page.locator('#edge .tg-ripple__wave').evaluate(el => getComputedStyle(el).animationDuration), '12s', 'root duration cascades into standard controls');
  assert.equal(await page.locator('#edge .tg-ripple__wave').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(65, 43, 21)', 'container color cascades into standard controls');
  assert.equal(await page.locator('#edge .tg-ripple__ring').evaluate(el => getComputedStyle(el).animationDuration), '9s', 'container duration cascades');
  await page.locator('#edge .tg-ripple__wave').evaluate(el => el.getAnimations().forEach(animation => animation.currentTime=6000));
  assert.ok(await page.locator('#edge').evaluate(el => el.scrollWidth <= el.clientWidth),'animated waves do not expand host scrollable overflow');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth),320,'animated waves do not expand the narrow viewport');
  await page.evaluate(() => window.disposal());
  assert.equal(await page.locator('.tg-ripple__layer').count(),0,'disposal removes empty effect layers');
  console.log('Standard ripple: pointer timing, geometry, deduplication, keyboard, controls, disabled, cleanup and reduced motion passed.');
} finally { await browser.close(); }
