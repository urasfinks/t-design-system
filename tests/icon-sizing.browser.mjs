import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch();
try {
 const page=await browser.newPage();
 const css=await readFile('dist/t-design-system.css','utf8');
 const catalog=await readFile('docs/catalog.css','utf8');
 await page.setContent(`<style>${css}${catalog}</style><button class="tg-btn tg-btn--sm"><svg viewBox="0 0 24 24"></svg></button><button class="tg-icon-btn tg-search__clear"><svg class="tg-icon"></svg></button><div class="preview-icon"><svg class="tg-icon"></svg></div><div class="demo-tabbar"><svg class="tg-icon"></svg></div><select class="tg-select"><option>Role</option></select>`);
 for(const size of [20,28]) {
  await page.evaluate(size=>document.documentElement.style.setProperty('--icon-size',`${size}px`),size);
  for(const svg of await page.locator('svg').all()) {
   const dimensions=await svg.evaluate(el=>[getComputedStyle(el).width,getComputedStyle(el).height]);
   assert.deepEqual(dimensions,[`${size}px`,`${size}px`],'icons use shared size even in small buttons and catalog examples');
  }
  assert.equal(await page.locator('select').evaluate(el=>getComputedStyle(el).backgroundSize),`${size}px ${size}px`,'select arrow follows shared icon size');
 }
 console.log('Shared icon sizing passed: buttons, search clear, preview, tabbar and select, default and custom size.');
}finally{await browser.close();}
