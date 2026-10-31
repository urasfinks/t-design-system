import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium,webkit} from 'playwright';
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'4195'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
let browser;
try {
 browser=await (process.argv.includes('--webkit')?webkit:chromium).launch();
 for(const [saved,system,expected]of [['dark','light','dark'],['ios-dark','light','ios-dark'],['light','dark','light'],['auto','dark',null],['invalid','light',null]]){
  const context=await browser.newContext({colorScheme:system});
  await context.addInitScript(saved=>{
   localStorage.setItem('tds-theme',saved);
   window.firstUiTheme=null;
   const sample=()=>{if(document.querySelector('.site-header'))window.firstUiTheme??={theme:document.documentElement.dataset.theme||null,scheme:getComputedStyle(document.documentElement).colorScheme,background:getComputedStyle(document.body).backgroundColor};else requestAnimationFrame(sample);};requestAnimationFrame(sample);
  },saved);
  const page=await context.newPage();let release;const held=new Promise(resolve=>release=resolve);
  await page.route('**/catalog.js',async route=>{await held;await route.continue().catch(()=>{});});
  try {
   await page.goto('http://127.0.0.1:4195/docs/',{waitUntil:'commit'});
   await page.locator('.site-header').waitFor({state:'visible'});
   assert.equal(await page.locator('html').getAttribute('data-theme'),expected,`${saved}/${system}: theme must be correct before catalog module executes`);
   const before=await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor);
   release();await page.waitForLoadState('load');
   assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),before,'module startup must not repaint theme');
   await page.waitForFunction(()=>window.firstUiTheme!==null);
   const first=await page.evaluate(()=>window.firstUiTheme);
   assert.equal(first.theme,expected,'first visible interface frame uses the selected theme');
   assert.equal(first.background,before,'the first interface background already matches the final background');
   assert.equal(first.scheme,expected==='light'?'light':expected?'dark':system,'native controls use the correct scheme from the first frame');
   assert.equal(await page.locator('#theme').inputValue(),expected||'auto');
  }finally{release();await context.close();}
 }
 const context=await browser.newContext({colorScheme:'light'});
 await context.addInitScript(()=>{
  localStorage.setItem('tds-theme','dark');
  if(window.parent!==window)return;
 });
 const page=await context.newPage();let release;const held=new Promise(resolve=>release=resolve);
 await page.route('**/compositions-demo.js',async route=>{await held;await route.continue().catch(()=>{});});
 try {
  await page.route('**/early-parent.html',route=>route.fulfill({contentType:'text/html',body:'<html data-theme="light"><body><iframe id="composition-preview" src="/docs/compositions.html"></iframe></body></html>'}));
  await page.goto('http://127.0.0.1:4195/docs/early-parent.html',{waitUntil:'commit'});
  const frame=page.frameLocator('#composition-preview');await frame.locator('body').waitFor({state:'visible'});
  assert.equal(await frame.locator('html').getAttribute('data-theme'),'light','iframe prioritizes parent over stored dark theme and inherits theme before its module loads');
 }finally{release();await context.close();}
 // Storage restrictions must not break boot or hide the document.
 const blocked=await browser.newContext({colorScheme:'dark'});
 await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('Storage blocked');}}));
 const blockedPage=await blocked.newPage();const errors=[];blockedPage.on('pageerror',e=>errors.push(e.message));
 await blockedPage.goto('http://127.0.0.1:4195/docs/');
 assert.equal(await blockedPage.locator('body').evaluate(el=>getComputedStyle(el).visibility),'visible');
 assert.deepEqual(errors,[]);
 await blocked.close();
 console.log('Theme first paint: delayed modules, saved/system themes, iframe startup and blocked storage passed.');
}finally{await browser?.close();server.kill();}
