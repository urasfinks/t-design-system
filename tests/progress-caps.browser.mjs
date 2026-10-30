import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const browser=await (process.argv.includes('--webkit')?webkit:chromium).launch();
try {
  const css=await readFile('dist/t-design-system.css','utf8');
  for(const scale of [1,2]) for(const dir of ['ltr','rtl']) for(const value of [42,100]) {
    const page=await browser.newPage({viewport:{width:500,height:300},deviceScaleFactor:scale,reducedMotion:'reduce'});
    await page.setContent(`<style>${css}:root{--progress-color:black;--progress-track-color:white;--progress-stripe-color:transparent}body{padding:20px;background:white}.tg-progress{width:400px;margin-bottom:16px}#reference{width:${400*value/100}px;height:14px;border-radius:9999px;background:black}</style><progress class="tg-progress" max="100" value="${value}"></progress><div class="tg-progress" id="plain"><span class="tg-progress__bar" style="--progress:${value}%"></span></div><div class="tg-progress tg-progress--striped" id="striped"><span class="tg-progress__bar" style="--progress:${value}%"></span></div><div id="reference"></div>`);
    await page.evaluate(dir=>document.documentElement.dir=dir,dir);
    const edge=async (selector,end,reference=false)=>{
      const box=await page.locator(selector).boundingBox();
      const width=reference?box.width:box.width*value/100;
      const left=dir==='ltr'?box.x:box.x+box.width-width;
      const x=(end==='start')===(dir==='ltr')?left:left+width-14;
      return page.screenshot({clip:{x,y:box.y,width:14,height:14}});
    };
    for(const end of ['start','end']) {
    const expected=await edge('#reference',end,true);
    for(const selector of ['progress','#plain','#striped']) {
      const actual=await edge(selector,end);
      const difference=await page.evaluate(async ({a,b})=>{
        const pixels=async base64=>{const i=new Image();i.src='data:image/png;base64,'+base64;await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const ctx=c.getContext('2d');ctx.drawImage(i,0,0);return [...ctx.getImageData(0,0,c.width,c.height).data];};
        const x=await pixels(a),y=await pixels(b);return x.reduce((sum,v,i)=>sum+(i%4===3?0:Math.abs(v-y[i])),0)/(x.length/4*3);
      },{a:expected.toString('base64'),b:actual.toString('base64')});
      assert.ok(difference<5,`${selector}, ${value}%, ${end}, ${dir}, DPR ${scale}: end cap must match an unscaled round bar (${difference})`);
    }
    }
    await page.close();
  }
  console.log('Progress caps: native, plain and striped match a round reference in LTR/RTL at DPR 1/2.');
}finally{await browser.close();}
