import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const browser=await (process.argv.includes('--webkit')?webkit:chromium).launch();
try {
 const page=await browser.newPage({viewport:{width:320,height:900},reducedMotion:'reduce'});
 const css=await readFile('dist/t-design-system.css','utf8');
 await page.setContent(`<style>${css}</style><label class="tg-field">Документ<input class="tg-input" id="file" type="file" accept=".pdf,.txt"></label><button class="tg-btn">Вторичная</button><input class="tg-input" id="disabled" type="file" disabled>`);
 for(const theme of ['light','dark','ios-dark']) for(const size of [16,32]) {
  await page.mouse.move(319,899);
  await page.evaluate(({theme,size})=>{document.documentElement.dataset.theme=theme;document.documentElement.style.fontSize=`${size}px`;},{theme,size});
  const values=await page.locator('#file').evaluate(el=>{
   const p=getComputedStyle(el,'::file-selector-button'),b=getComputedStyle(document.querySelector('button'));
   return {height:parseFloat(p.height),fieldHeight:el.getBoundingClientRect().height,control:parseFloat(b.height),padding:parseFloat(p.paddingInlineStart),radius:p.borderRadius,buttonRadius:b.borderRadius,bg:p.backgroundColor,buttonBg:b.backgroundColor,font:p.fontSize,buttonFont:b.fontSize};
  });
  assert.equal(values.radius,values.buttonRadius,`${theme}/${size}: native file button uses TDS radius`);
  assert.equal(values.height,values.control,`${theme}/${size}: same target height`);
  assert.ok(Math.abs(values.fieldHeight-values.control)<.5,`${theme}/${size}: native input adds no extra height`);
  assert.equal(values.bg,values.buttonBg,`${theme}/${size}: same secondary surface`);
  assert.equal(values.font,values.buttonFont,`${theme}/${size}: same typography`);
  assert.ok(values.padding>0);
  await page.locator('button').hover();
  const hover = await page.locator('button').evaluate(el=>getComputedStyle(el).backgroundColor);
  await page.locator('#file').hover();
  assert.equal(await page.locator('#file').evaluate(el=>getComputedStyle(el,'::file-selector-button').backgroundColor),hover,`${theme}/${size}: shared hover surface`);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${theme}/${size}: narrow page fits`);
 }
 await page.locator('#file').setInputFiles({name:'document.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4')});
 assert.equal(await page.locator('#file').evaluate(el=>el.files[0].name),'document.pdf');
 await page.locator('#file').focus();
 assert.notEqual(await page.locator('#file').evaluate(el=>getComputedStyle(el).boxShadow),'none','keyboard focus stays visible');
 assert.equal(await page.locator('#disabled').isDisabled(),true);
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.equal(await page.locator('#disabled').evaluate(el=>getComputedStyle(el,'::file-selector-button').cursor),'not-allowed');
 assert.equal(await page.locator('#file').evaluate(el=>getComputedStyle(el,'::file-selector-button').transitionDuration),'0s','reduced motion applies to the native button');
 console.log('Native file button: shared geometry, typography, colors, three themes, 200% text, narrow layout, selection and focus passed.');
} finally{await browser.close();}
