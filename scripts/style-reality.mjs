import {styleSourceFingerprint} from './lib/style-source-fingerprint.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {chromium} from 'playwright';
const pages=['index.html','bottom-panel.html','compositions.html','workspace.html','icon-browser.html'];
const digest=value=>createHash('sha256').update(value).digest('hex');
const fingerprint=await styleSourceFingerprint();
if(process.argv.includes('--check')) {
  const graph=JSON.parse(await readFile('architecture/style-reality.json','utf8'));
  if(graph.fingerprint!==fingerprint)throw Error('Reality snapshot is stale: npm run graph:reality');
  console.log('Style reality source fingerprint is current.');
  process.exit(0);
}
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'4199'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
let browser;
try {
  browser=await chromium.launch();
  const contexts=[],rules=new Map(),profiles=new Map(),instances=[];
  const page=await browser.newPage({reducedMotion:'reduce'});
  for(const file of pages) {
    await page.goto(`http://127.0.0.1:4199/docs/${file}`);
    await page.waitForTimeout(200);
    // Preserve the complete CSSOM: nested rules, variants, conditions and declarations.
    const sheets=await page.evaluate(()=>{
      const walk=(list,parents=[])=>[...list].flatMap((rule,index)=>{
        const node={path:[...parents,index],type:rule.constructor.name,selector:rule.selectorText||null,condition:rule.conditionText||null,name:rule.name||null,declarations:rule.style?[...rule.style].map(p=>[p,rule.style.getPropertyValue(p),rule.style.getPropertyPriority(p)]):null};
        return [node,...(rule.cssRules?walk(rule.cssRules,node.path):[])];
      });
      return [...document.styleSheets].map((sheet,index)=>({source:sheet.href?new URL(sheet.href).pathname:`inline:${index}`,rules:walk(sheet.cssRules)}));
    });
    for(const sheet of sheets)for(const rule of sheet.rules) {
      const source=sheet.source.startsWith('inline:')?`docs/${file}#${sheet.source}`:sheet.source;
      const id=digest(JSON.stringify([source,rule.path,rule]));
      rules.set(id,{id,source,...rule});
    }
    for(const width of [390,1440])for(const theme of ['light','dark','ios-dark']) {
      await page.setViewportSize({width,height:1000});
      await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
      await page.waitForTimeout(250);
      const context={page:`docs/${file}`,width,theme,state:'catalogue-initial',direction:'ltr',motion:'reduce',browser:'Chromium'};
      contexts.push(context);
      const rows=await page.evaluate(()=>{
        const path=el=>{const parts=[];for(let n=el;n&&n!==document.documentElement;n=n.parentElement){const siblings=[...n.parentElement.children].filter(e=>e.tagName===n.tagName);parts.unshift(`${n.tagName.toLowerCase()}:nth-of-type(${siblings.indexOf(n)+1})`);}return parts.join(' > ');};
        const computed=(el,pseudo)=>{const style=getComputedStyle(el,pseudo);return Object.fromEntries([...style].map(p=>[p,style.getPropertyValue(p)]));};
        return [...document.querySelectorAll('[class]')].filter(el=>[...el.classList].some(c=>c.startsWith('tg-'))).map(el=>({
          path:path(el),tag:el.tagName.toLowerCase(),classes:[...el.classList],parentClasses:el.parentElement?[...el.parentElement.classList]:[],
          attributes:Object.fromEntries([...el.attributes].filter(a=>a.name!=='class').map(a=>[a.name,a.value])),
          visible:!!el.getClientRects().length,inline:el.getAttribute('style'),
          styles:computed(el),pseudo:Object.fromEntries(['::before','::after'].map(p=>[p,computed(el,p)]).filter(([,style])=>!['none','normal'].includes(style.content)))
        }));
      });
      for(const row of rows) {
        const styles=row.styles;delete row.styles;
        const profile=digest(JSON.stringify(styles));
        profiles.set(profile,styles);
        const pseudo={};
        for(const [name,style]of Object.entries(row.pseudo)){const id=digest(JSON.stringify(style));profiles.set(id,style);pseudo[name]=id;}
        instances.push({context:contexts.length-1,...row,pseudo,profile});
      }
    }
  }
  const declared=new Set([...rules.values()].flatMap(r=>[...(r.selector||'').matchAll(/\.(tg-[\w-]+)/g)].map(m=>m[1])));
  const represented=new Set(instances.flatMap(i=>i.classes));
  const coverage={contexts:contexts.length,instances:instances.length,rules:rules.size,profiles:profiles.size,declaredClasses:declared.size,representedClasses:[...declared].filter(c=>represented.has(c)).length,missingClasses:[...declared].filter(c=>!represented.has(c)).sort(),
    verified:['All loaded CSSOM rules and their declarations, nested conditions and order','Full computed property lists for all tg-* instances, including initial hidden states','Generated ::before and ::after computed property lists','Parent context, attributes and inline styles in 30 theme/viewport/page contexts'],
    unverified:['Exhaustive hover, focus, active and drag state combinations','All open dialogs, popovers and dynamically created content','RTL, browser engines other than Chromium, additional widths and contrast preferences','Animation intermediate frames and all application-specific host overrides'],
    completeness:'partial — explicit coverage, not a claim that all possible interfaces and states have been observed'};
  await mkdir('artifacts/style-reality',{recursive:true});
  const data=JSON.stringify({version:1,fingerprint,coverage,contexts,rules:[...rules.values()],profiles:Object.fromEntries(profiles),instances})+'\n';
  await writeFile('artifacts/style-reality/data.json.gz',gzipSync(data));
  await writeFile('architecture/style-reality.json',JSON.stringify({version:1,fingerprint,coverage,contexts,dataset:'artifacts/style-reality/data.json.gz',datasetSha256:digest(gzipSync(data))},null,2)+'\n');
  await writeFile('docs/style-reality.md',`# Фактическое оформление интерфейсов\n\nПокрытие: [style-reality.json](../architecture/style-reality.json). Полные данные генерируются локально в artifacts/style-reality/data.json.gz (исключены из Git из-за объёма). Обновление: npm run graph:reality. Проверка исходников: npm run check:style-reality.\n\n${coverage.contexts} контекстов; ${coverage.instances} экземпляров; ${coverage.rules} CSS-правил; ${coverage.profiles} уникальных computed-профилей. Представлено ${coverage.representedClasses}/${coverage.declaredClasses} объявленных классов.\n\nCSSOM сохраняет порядок, условия, вложенность и все объявления. Экземпляры содержат полный getComputedStyle, контекст родителя и inline-стили. Это фактические данные для проверки нормативного [SSOT](style-graph.md); наличие свойства в правиле ещё не доказывает, что именно оно выиграло каскад.\n\n## Проверено\n\n${coverage.verified.map(v=>'- '+v).join('\n')}\n\n## Пока не проверено\n\n${coverage.unverified.map(v=>'- '+v).join('\n')}\n\n## Классы без экземпляров\n\n${coverage.missingClasses.map(c=>'`.'+c+'`').join(', ')}\n\nПолнота пока частичная. Нельзя объявлять граф полным отражением интерфейса, пока не закрыты перечисленные состояния и пробелы покрытия. Проверка fingerprint обнаруживает изменения источников; она не заменяет повторное измерение браузером.\n`);
  console.log(JSON.stringify(coverage,null,2));
} finally {await browser?.close();server.kill();}
