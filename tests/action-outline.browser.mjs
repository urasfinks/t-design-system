import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium,webkit} from 'playwright';
const {interaction:contract}=JSON.parse(await readFile(new URL('../architecture/style-contracts.json',import.meta.url),'utf8'));
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'4198'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
let browser;
try {
  browser=await (process.argv.includes('--webkit')?webkit:chromium).launch();
  const page=await browser.newPage();
  await page.goto('http://127.0.0.1:4198/docs/');
  for(const theme of ['light','dark','ios-dark']) {
    await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
    await page.waitForTimeout(400);
    const report=await page.evaluate(contract=>{
      const failures=[];
      const selectors=contract.roles.map(r=>r.selector).join(', ');
      let count=0;
      for(const el of document.querySelectorAll(selectors)) {
        if(!el.getClientRects().length || el.matches('span.tg-badge') && el.closest('.tg-avatar'))continue;
        const geometry=contract.geometry.find(g=>el.matches(g.selector));
        const cs=getComputedStyle(el,geometry?.target);
        const info=contract.roles.find(r=>r.outline==='none');
        const status=el.matches(info.selector)&&!el.closest(info.exclude);
        if(status) {if(parseFloat(cs.borderTopWidth)>0)failures.push('informational badge outlined');continue;}
        const alpha=cs.borderTopColor.startsWith('rgba')?Number(cs.borderTopColor.match(/[\d.]+/g).at(-1)):1;
        if(!(parseFloat(cs.borderTopWidth)>=1&&cs.borderTopStyle!=='none'&&alpha>=contract.minimumAlpha)) failures.push(`${el.tagName}.${el.className}: ${cs.borderTopWidth} ${cs.borderTopColor}`);
        count++;
      }
      return {failures:[...new Set(failures)],count};
    },contract);
    assert.ok(report.count>50);
    assert.deepEqual(report.failures,[],`${theme}: every visible action has an outline`);
  }
  console.log('Action outlines: visible controls and nested counters outlined in all three themes; informational badges borderless.');
} finally {await browser?.close();server.kill();}
