import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const browser=await (process.argv.includes('--webkit')?webkit:chromium).launch();
try {
 const page=await browser.newPage();
 const css=await readFile('dist/t-design-system.css','utf8');
 await page.setContent(`<style>${css}</style><main style="max-width:40rem;margin:auto">
 <details class="tg-disclosure" id="plain"><summary class="tg-disclosure__trigger">Что входит в раскрывающийся блок?</summary><div class="tg-disclosure__content">Содержимое</div></details>
 <div class="tg-accordion"><details class="tg-disclosure" id="accordion"><summary class="tg-disclosure__trigger">Длинный заголовок с несколькими словами для проверки переноса <span class="tg-disclosure__meta">1 мин</span></summary><div class="tg-disclosure__content">Ответ</div></details></div>
 <details class="tg-card tg-card--disclosure" id="card"><summary class="tg-disclosure__trigger">Карточка</summary><div class="tg-card__body">Описание</div></details>
 <details class="tg-chart__data" id="chart"><summary>Таблица данных</summary><div>Данные</div></details>
 <details class="tg-agent-step__detail" id="agent"><summary>Результаты поиска</summary><ul><li>Результат</li></ul></details>
 </main>`);
 for(const width of [390,1280])for(const theme of ['light','dark','ios-dark'])for(const dir of ['ltr','rtl']){
  await page.setViewportSize({width,height:900});
  await page.evaluate(({theme,dir})=>{document.documentElement.dataset.theme=theme;document.documentElement.dir=dir;document.querySelectorAll('details').forEach(el=>el.open=false);},{theme,dir});
  for(const id of ['plain','accordion','card','chart','agent']){
   const summary=page.locator(`#${id}>summary`);
   const before=await summary.evaluate(el=>{
    const s=getComputedStyle(el),icon=getComputedStyle(el,'::after');
    return {display:s.display,gap:parseFloat(s.columnGap),list:s.listStyleType,mask:icon.maskImage,content:icon.content,width:parseFloat(icon.width),transform:icon.transform,overflow:el.scrollWidth>el.clientWidth};
   });
   assert.ok(['flex','inline-flex'].includes(before.display),`${id}: layout separates indicator from text`);
   assert.ok(before.gap>=12,`${id}: at least 12px gap`);
   assert.equal(before.list,'none',`${id}: native triangle suppressed`);
   assert.ok(before.mask.includes('svg'),`${id}: existing SVG icon`);
   assert.ok(before.width>=16);
   assert.equal(before.transform,'none');
   assert.equal(before.overflow,false,`${id}: no overflow at ${width}/${dir}`);
   await summary.focus();await page.keyboard.press('Enter');
   assert.equal(await page.locator('#'+id).evaluate(el=>el.open),true,'Enter opens native details');
   const turn=await summary.evaluate(el=>{getComputedStyle(el,'::after').transform;for(const a of el.getAnimations({subtree:true}))try{a.finish();}catch{}return getComputedStyle(el,'::after').transform;});
   assert.equal(turn,'matrix(-1, 0, 0, -1, 0, 0)',`${id}: chevron rotates 180 degrees`);
   await page.keyboard.press('Space');assert.equal(await page.locator('#'+id).evaluate(el=>el.open),false,'Space closes native details');
   await summary.evaluate(el=>{for(const a of el.getAnimations({subtree:true}))try{a.finish();}catch{}});
  }
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const id of ['plain','accordion','card','chart','agent'])assert.equal(await page.locator(`#${id}>summary`).evaluate(el=>getComputedStyle(el,'::after').transitionDuration),'0s');
 console.log('Disclosure indicators: native keyboard, shared SVG, spacing, wrapping, RTL, 3 themes, 2 widths and reduced motion verified.');
}finally{await browser.close();}
