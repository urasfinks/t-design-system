import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const browser=await (process.argv.includes('--webkit')?webkit:chromium).launch();
try {
 const page=await browser.newPage({reducedMotion:'reduce'});
 await page.setContent(`<style>${await readFile('dist/t-design-system.css','utf8')}</style><ul class="tg-listbox" role="listbox" data-pointer style="width:320px"><li id="chosen" class="tg-listbox__option" role="option" aria-selected="true" data-active><span class="tg-listbox__text">Быстрая<span class="tg-listbox__option-meta">Ответы за секунды</span></span></li><li id="other" class="tg-listbox__option" role="option" aria-selected="false">Сбалансированная</li><li class="tg-listbox__option" role="option" aria-selected="false" aria-disabled="true">Глубокая</li></ul>`);
 const chosen=page.locator('#chosen');
 const appearance=()=>chosen.evaluate(el=>{
  const s=getComputedStyle(el),check=getComputedStyle(el,'::after');
  const resolve=token=>{const probe=document.createElement('i');probe.style.color=`var(${token})`;el.append(probe);const v=getComputedStyle(probe).color;probe.remove();return v;};
  return {background:s.backgroundColor,color:s.color,surface:resolve('--surface-muted'),foreground:resolve('--text-color'),checkForeground:resolve('--text-link'),shadow:s.boxShadow,border:s.borderTopWidth,outline:s.outlineStyle,checkColor:check.backgroundColor,checkMask:check.maskImage,checkWidth:parseFloat(check.width),padding:parseFloat(s.paddingInlineEnd)};
 });
 for(const theme of ['light','dark','ios-dark'])for(const dir of ['ltr','rtl']){
  await page.evaluate(({theme,dir})=>{document.documentElement.dataset.theme=theme;document.documentElement.dir=dir;},{theme,dir});
  await page.mouse.move(0,0);const resting=await appearance();
  assert.equal(resting.background,resting.surface,`${theme}/${dir}: selected row uses existing button surface`);
  assert.equal(resting.color,resting.foreground);
  assert.equal(resting.checkColor,resting.checkForeground);
  assert.ok(resting.checkMask.includes('svg'));
  assert.equal(resting.border,'0px');assert.equal(resting.outline,'none');
  assert.notEqual(resting.shadow,'none');
  assert.ok(resting.checkWidth>=20,'selection mark is easy to see');
  assert.ok(resting.padding>=resting.checkWidth+24,'text cannot collide with mark');
  await chosen.hover();assert.deepEqual(await appearance(),resting,'pointer on selected row preserves selection');
  await page.locator('#other').hover();assert.deepEqual(await appearance(),resting,'pointer on another row preserves selection');
  assert.notEqual(await page.locator('#other').evaluate(el=>getComputedStyle(el).boxShadow),resting.shadow,'hover and selection retain distinct treatment');
 }
 console.log('Listbox selection: canonical neutral surface, no selection border, 20px check, hover separation and RTL verified in three themes.');
}finally{await browser.close();}
