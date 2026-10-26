import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const browser=await (process.argv.includes('--webkit')?webkit:chromium).launch();
try {
 const page=await browser.newPage({reducedMotion:'reduce'});
 const css=await readFile('dist/t-design-system.css','utf8');
 for(const theme of ['light','dark','ios-dark']) {
  await page.setContent(`<html data-theme="${theme}"><style>${css}</style><select class="tg-select"><option>Role</option></select><select class="tg-select" disabled><option>Disabled</option></select><fieldset disabled><select class="tg-select"><option>Disabled fieldset</option></select></fieldset><div aria-disabled="true"><select class="tg-select"><option>Disabled region</option></select></div></html>`);
  for(const select of await page.locator('select').all()) {
   await page.mouse.move(0,0);
   const idle=await select.evaluate(el=>getComputedStyle(el).backgroundImage);
   await select.hover({force:true});
   const hovered=await select.evaluate(el=>getComputedStyle(el).backgroundImage);
   if(await select.evaluate(el=>el.matches(':disabled')||!!el.closest('[aria-disabled="true"]'))) assert.equal(hovered,idle);
   else {assert.notEqual(hovered,idle,`${theme}: arrow changes on hover`);assert.ok(!hovered.includes('stroke-opacity'),`${theme}: full main text color on hover`);}
  }
 }
 console.log('Select arrow hover: 3 themes, enabled and disabled controls passed.');
}finally{await browser.close();}
