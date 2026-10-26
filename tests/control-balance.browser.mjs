import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { compileString } from 'sass';
import { chromium, webkit } from 'playwright';
const css = compileString("@use 'index';", {loadPaths:[resolve('src')]}).css;
const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
const page = await browser.newPage({viewport:{width:320,height:900}});
try {
  await page.setContent(`<style>${css}</style><style>.theme{--control-h:52px;--control-press-scale:.97;--duration:240ms;--ease:linear} .long{width:140px;font-size:32px}.sample{margin:8px} .blocked{margin:8px}</style>
  <div class="theme">
    <button class="tg-btn sample" id="short">Action</button>
    <button class="tg-btn long sample" id="long"><span>A much longer localized action label across many lines</span></button>
    <button class="tg-chip long sample" id="chip"><span>A longer localized chip label</span></button>
    <button class="tg-btn tg-btn-box sample" id="box" aria-label="Add">+</button>
    <button class="tg-icon-btn sample" id="icon" aria-label="Add">+</button>
    <button class="tg-chip sample" id="chip-short">Label</button>
    <button class="tg-avatar sample" id="avatar"><span class="tg-avatar__initials">AB</span></button>
    <button class="tg-tab sample" id="tab">Tab</button>
    <button class="tg-btn tg-btn--stacked sample" id="stacked"><span>Icon</span><span>Label</span></button>
    <button class="tg-btn sample" id="toggle" aria-pressed="true">Selected</button>
    <button class="tg-btn tg-btn--primary sample" id="primary" aria-pressed="true">Primary</button>
    <button class="tg-badge sample" id="badge">2</button><a class="tg-badge sample" id="badge-link" href="#">Open</a><span class="tg-badge" id="status">2</span>
    <div aria-disabled="true"><button class="tg-btn blocked" id="blocked">Unavailable</button><button class="tg-avatar blocked" id="blocked-avatar">AB</button><button class="tg-tab blocked" id="blocked-tab">Tab</button></div>
  </div>`);
  assert.equal(await page.locator('#short').evaluate(el=>getComputedStyle(el).fontSize),await page.locator('#short').evaluate(el=>{const probe=document.createElement('span');probe.style.fontSize='var(--fs)';el.append(probe);const size=getComputedStyle(probe).fontSize;probe.remove();return size;}),'default action typography retains shared body size');
  await page.addStyleTag({content:'.theme {--control-font-size:18px}'});
  for (const id of ['short','icon']) assert.equal(await page.locator(`#${id}`).evaluate(el=>getComputedStyle(el).fontSize),'18px',`${id} inherits shared control typography`);
  await page.addStyleTag({content:'.theme {--control-selected-bg:rgb(20, 30, 40);--control-selected-color:rgb(210, 220, 230)}'});
  await page.waitForTimeout(280);
  assert.deepEqual(await page.locator('#stacked').evaluate(el=>[getComputedStyle(el).flexDirection,getComputedStyle(el).minBlockSize]),['column','104px'],'stacked action inherits common height scale');
  assert.equal(await page.locator('#stacked').evaluate(el=>getComputedStyle(el).fontWeight),'400','stacked action uses shared regular weight');
  assert.deepEqual(await page.locator('#toggle').evaluate(el=>[getComputedStyle(el).backgroundColor,getComputedStyle(el).color]),['rgb(20, 30, 40)','rgb(210, 220, 230)'],'neutral toggle inherits selected surface and text roles');
  assert.notEqual(await page.locator('#primary').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(20, 30, 40)','primary toggle retains action palette');
  for (const id of ['long','chip']) {
    const geometry = await page.locator(`#${id}`).evaluate(el => ({host:el.getBoundingClientRect().height,text:el.firstElementChild.getBoundingClientRect().height}));
    assert.ok(geometry.host >= geometry.text + 8, `${id} grows around wrapped 200% text with vertical breathing room`);
  }
  assert.equal(await page.locator('#short').evaluate(el=>el.getBoundingClientRect().height),52,'short button inherits shared control height');
  assert.ok(await page.locator('#badge').evaluate(el=>el.getBoundingClientRect().width >=52 && el.getBoundingClientRect().height >=52),'button badges inherit shared target');
  assert.ok(await page.locator('#status').evaluate(el=>el.getBoundingClientRect().height <44),'informational badges retain compact status geometry');
  for (const id of ['box','icon']) assert.ok(await page.locator(`#${id}`).evaluate(el=>el.getBoundingClientRect().width >=52),'icon actions share minimum target');
  for (const id of ['short','avatar']) {
    await page.locator(`#${id}`).evaluate(el=>el.dataset.pressed='true');
    await page.waitForTimeout(280);
    assert.equal(await page.locator(`#${id}`).evaluate(el=>getComputedStyle(el).transform),'matrix(0.97, 0, 0, 0.97, 0, 0)',`${id} inherits common press scale`);
  }
  for (const id of ['blocked','blocked-avatar','blocked-tab']) {
    const resting = await page.locator(`#${id}`).evaluate(el=>getComputedStyle(el).backgroundColor);
    await page.locator(`#${id}`).hover();
    await page.locator(`#${id}`).evaluate(el=>el.dataset.pressed='true');
    await page.waitForTimeout(280);
    assert.equal(await page.locator(`#${id}`).evaluate(el=>getComputedStyle(el).backgroundColor),resting,`${id} disabled ancestor prevents hover fill`);
    assert.equal(await page.locator(`#${id}`).evaluate(el=>getComputedStyle(el).transform),'none',`${id} disabled ancestor prevents press scale`);
  }
  assert.match(await page.locator('#tab').evaluate(el=>getComputedStyle(el).transitionTimingFunction),/^linear/,'navigation inherits shared easing');
  await page.emulateMedia({reducedMotion:'reduce'});
  for (const id of ['short','avatar']) assert.equal(await page.locator(`#${id}`).evaluate(el=>getComputedStyle(el).transform),'none','reduced motion removes press scaling');
  await page.addStyleTag({content:'.tg-btn {border-radius:3px;padding-inline:19px} .tg-btn--stacked {min-block-size:130px}'});
  assert.equal(await page.locator('#stacked').evaluate(el=>getComputedStyle(el).minBlockSize),'130px','consumer stacked geometry override wins');
  assert.deepEqual(await page.locator('#short').evaluate(el=>[getComputedStyle(el).borderRadius,getComputedStyle(el).paddingInlineStart]),['3px','19px'],'consumer CSS overrides component geometry');
  if (process.env.CONTROL_BALANCE_SCREENSHOT) await page.screenshot({path:process.env.CONTROL_BALANCE_SCREENSHOT,fullPage:true});
  console.log('Control balance: long labels, inherited size/motion, icon targets, disabled ancestors, reduced motion and consumer cascade passed.');
} finally {await browser.close();}
