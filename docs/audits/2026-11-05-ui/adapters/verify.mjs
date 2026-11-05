import {chromium,webkit} from '/Users/sfinks/Documents/ChatGPT/t-design-system/node_modules/playwright/index.mjs';
import {measureContrast} from '/Users/sfinks/Documents/ChatGPT/t-design-system/tests/helpers/contrast.mjs';
import {readFile,writeFile} from 'node:fs/promises';
const out='/Users/sfinks/Documents/ChatGPT/t-design-system/docs/audits/2026-11-05-ui';const results=[];
for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]) {
const b=await type.launch();const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
try {await p.goto('http://127.0.0.1:4173/docs/');await p.waitForTimeout(500);
 const contrasts=[];for(const theme of ['light','dark','ios-dark']){await p.selectOption('#theme',theme);for(const selector of ['.skip-link','#scene-preview .tg-btn--primary','#overview h1','#avatars > p a','#selection .tg-chip[aria-pressed="true"]']){try{contrasts.push({theme,selector,result:await p.evaluate(measureContrast,{selector})});}catch(e){contrasts.push({selector,error:e.message});}}}
 const targets=[];for(const selector of ['button.tg-badge','.tg-tag-input__remove','.tg-menubar__item']) {const el=p.locator(selector).first();await el.scrollIntoViewIfNeeded();targets.push(await el.evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el,'::before');return{class:el.className,rect:r.toJSON(),pseudo:{w:s.width,h:s.height,top:s.top,left:s.left,inset:s.inset},above:document.elementFromPoint(r.x+r.width/2,r.y-3)?.closest('button')===el,below:document.elementFromPoint(r.x+r.width/2,r.bottom+3)?.closest('button')===el};}));}
 await p.goto('http://127.0.0.1:4173/docs/#icons');await p.waitForTimeout(700);await p.locator('.icon-grid').scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/screenshots/verify-icons-${engine}.png`});
 const icons=await p.locator('.icon-grid').evaluate(e=>({items:e.children.length,first:e.firstElementChild?.outerHTML.slice(0,700)}));
 const axe=await readFile('/tmp/tds-ui-audit/tools/node_modules/axe-core/axe.min.js','utf8');await p.addScriptTag({content:axe});await p.locator('[data-catalog-search-open]:visible').first().click();
 const search=await p.evaluate(async()=>({axe:await axe.run(document.querySelector('#catalog-search')),html:document.querySelector('#catalog-search-results').outerHTML.slice(0,700)}));
 results.push({engine,contrasts,targets,icons,search});
}finally{await b.close();}}
await writeFile(`${out}/verification.json`,JSON.stringify(results,null,2));
