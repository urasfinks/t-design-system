import { chromium, webkit } from '/Users/sfinks/Documents/ChatGPT/t-design-system/node_modules/playwright/index.mjs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const out='/Users/sfinks/Documents/ChatGPT/t-design-system/docs/audits/2026-11-05-ui';
const url='http://127.0.0.1:4173/docs/';
const phase=process.argv[2];
const save=async(name,data)=>writeFile(`${out}/${name}`,JSON.stringify(data,null,2));
const browser=await (process.argv.includes('--webkit')?webkit:chromium).launch();
const errors=[];
const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
page.on('pageerror',e=>errors.push(e.message));
page.setDefaultTimeout(5000);
try {
await page.goto(url); await page.waitForTimeout(1000);
if(phase==='1') {
 const results=[];
 for(const width of [1440,390,320]) for(const theme of ['light','dark','ios-dark']) {
  await page.setViewportSize({width,height:900}); await page.selectOption('#theme',theme);
  const info=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,sections:document.querySelectorAll('main [data-catalog-title]').length,images:[...document.images].filter(e=>e.getBoundingClientRect().width && !e.complete || e.getBoundingClientRect().width && !e.naturalWidth).map(e=>({src:e.getAttribute('src'),outer:e.outerHTML.slice(0,350)})),smallButtons:[...document.querySelectorAll('button,a.tg-btn,a.tg-icon-btn')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&!e.closest('[inert]')&&(r.width<43.9||r.height<43.9)}).map(e=>({text:e.textContent.trim().slice(0,50),label:e.getAttribute('aria-label'),class:e.className,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height,section:e.closest('section[id]')?.id})),unlabelled:[...document.querySelectorAll('input,select,textarea')].filter(e=>e.getBoundingClientRect().width&&!e.labels?.length&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')).map(e=>e.outerHTML.slice(0,300))}));
  results.push({theme,...info});
  await page.evaluate(()=>scrollTo(0,0)); await page.screenshot({path:`${out}/screenshots/01-${width}-${theme}.png`});
 }
 await save(`01-browser${process.argv.includes('--webkit')?'-webkit':''}.json`,{results,errors});
}
if(phase==='2') {
 const source=await readFile('/tmp/tds-ui-audit/audit.js','utf8'); const results=[];
 for(const width of [1440,390]) for(const theme of ['light','dark','ios-dark']) {
  await page.setViewportSize({width,height:width===1440?900:844}); await page.selectOption('#theme',theme);
  await page.evaluate(()=>scrollTo(0,document.body.scrollHeight)); await page.waitForTimeout(300); await page.evaluate(()=>scrollTo(0,0));
  results.push({theme,result:JSON.parse(await page.evaluate(source))});
 }
 await save('02-measurements.json',{results,errors});
 const sections=await page.locator('main section.catalog-section[id],main section.hero[id]').evaluateAll(es=>es.map(e=>e.id));
 await page.setViewportSize({width:390,height:844}); await page.selectOption('#theme','light');
 const captures=[];
 for(const id of sections) {await page.locator(`#${id}`).scrollIntoViewIfNeeded(); await page.screenshot({path:`${out}/screenshots/02-mobile-${id}.png`}); captures.push(id);}
 await save('02-section-captures.json',captures);
}
if(phase==='3') {
 await page.selectOption('#theme','light'); await page.screenshot({path:`${out}/screenshots/03-start.png`});
 await page.locator('[data-catalog-search-open]:visible').first().click(); await page.locator('#catalog-search-input').fill('.tg-btn');
 await page.screenshot({path:`${out}/screenshots/03-search.png`});
 await page.locator('#catalog-search-input').press('ArrowDown'); await page.keyboard.press('Enter');
 await page.screenshot({path:`${out}/screenshots/03-buttons.png`});
 const disclosure=page.locator('#buttons .example-code summary').first(); await disclosure.click();
 await disclosure.scrollIntoViewIfNeeded(); await page.screenshot({path:`${out}/screenshots/03-html.png`});
 await page.setViewportSize({width:375,height:812}); await page.goto(url);
 await page.selectOption('#section-select','forms'); await page.screenshot({path:`${out}/screenshots/03-mobile-forms.png`});
 await save('03-journey.json',{goal:'Найти компонент, сравнить варианты, открыть и скопировать HTML; новый разработчик, desktop/mobile web',errors});
}
if(phase==='4') {
 const axe=await readFile('/tmp/tds-ui-audit/tools/node_modules/axe-core/axe.min.js','utf8');const results=[];
 for(const width of [1440,768,375]) for(const theme of ['light','dark','ios-dark']) {
  await page.setViewportSize({width,height:900}); await page.selectOption('#theme',theme);await page.addScriptTag({content:axe});
  const result=await page.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']}}));
  results.push({width,theme,violations:result.violations,incomplete:result.incomplete,passes:result.passes.map(x=>x.id)});
 }
 await page.locator('[data-catalog-search-open]:visible').first().click();
 results.push({state:'search-open',result:await page.evaluate(async()=>await axe.run(document))});
 await save('04-axe.json',{results,errors});
}
if(phase==='5') {
 const sections=await page.locator('main [data-catalog-title]').evaluateAll(es=>es.map(e=>({id:e.id,title:e.dataset.catalogTitle})));
 const coverage=[];for(const section of sections){await page.evaluate(id=>document.getElementById(id).scrollIntoView(),section.id);coverage.push({...section,visible:await page.locator(`#${section.id}`).isVisible()});}
 const links=await page.locator('a[href]').evaluateAll(es=>es.map(e=>({text:e.textContent.trim().slice(0,60),href:e.getAttribute('href')})));
 const inventory=await page.locator('main button,main input,main select,main textarea,main summary,main a[href]').evaluateAll(es=>es.map(e=>({tag:e.tagName,text:(e.getAttribute('aria-label')||e.textContent||'').trim().slice(0,70),section:e.closest('section[id]')?.id,disabled:e.matches(':disabled,[aria-disabled=true]'),visible:!!e.getBoundingClientRect().width,html:e.outerHTML.slice(0,300)})));
 const journey=[];
 for(const width of [1440,375]) {
  await page.setViewportSize({width,height:900});await page.goto(url);await page.locator('[data-catalog-search-open]:visible').first().click();
  await page.locator('#catalog-search-input').fill('небывалыйкомпонент');journey.push({width,state:'empty-search',text:await page.locator('#catalog-search-status').textContent()});
  await page.keyboard.press('Escape');journey.push({width,state:'escape',closed:await page.locator('#catalog-search').evaluate(e=>!e.open),focus:await page.evaluate(()=>document.activeElement.outerHTML.slice(0,200))});
  if(width===375) await page.selectOption('#section-select','buttons');else await page.locator('a.nav-link[href="#buttons"]').first().click();
  const disclosure=page.locator('#buttons .example-code summary').first();await disclosure.click();await disclosure.scrollIntoViewIfNeeded();
  const copy=page.locator('#buttons .example-code button').first();if(await copy.count()){await copy.click();journey.push({width,state:'copy',text:await copy.textContent()});}
  await page.screenshot({path:`${out}/screenshots/05-copy-${width}.png`});
 }
 await save('05-walkthrough.json',{coverage,links,inventory,journey,errors,limitations:'All catalog headings visited. Primary find→compare→HTML→copy path exercised. Every demo control inventoried; not every control exhaustively exercised. See existing component browser tests for additional behavior coverage.'});
}
} finally {await browser.close();}
