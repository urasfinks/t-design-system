import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium, webkit} from 'playwright';
const css=await readFile('dist/t-design-system.css','utf8');
assert.doesNotMatch(css,/\.tg-btn-s0\b/);
const browser=await(process.argv.includes('--webkit')?webkit:chromium).launch();
try {
 const page=await browser.newPage({reducedMotion:'reduce'});
 for(const width of [320,390,1280]) {
  await page.setViewportSize({width,height:800});
  for(const theme of ['light','dark','ios-dark']) {
   await page.setContent(`<html data-theme="${theme}"><style>${css}</style><div class="tg-row">${['tg-btn','tg-btn tg-btn--ghost','tg-btn tg-btn--sm','tg-btn tg-btn-s1','tg-btn tg-btn-s2','tg-btn tg-btn-s3','tg-btn tg-btn-box','tg-icon-btn','tg-icon-btn tg-icon-btn--ghost'].map(cls=>`<button class="${cls}">+</button>`).join('')}</div>`);
   const sizes=await page.locator('button').evaluateAll(nodes=>nodes.map(el=>({classes:el.className,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,start:parseFloat(getComputedStyle(el).paddingInlineStart),end:parseFloat(getComputedStyle(el).paddingInlineEnd)})));
   for(const size of sizes){assert.ok(size.width>=44&&size.height>=44,JSON.stringify(size));assert.ok(size.start>0&&size.end>0,JSON.stringify(size));}
  }
 }
 console.log('Button padding: 9 variants have positive inline padding and ≥44×44px targets at 3 widths in 3 themes.');
}finally{await browser.close();}
