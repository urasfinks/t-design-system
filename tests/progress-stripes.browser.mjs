import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const browser=await (process.argv.includes('--webkit')?webkit:chromium).launch();
try {
  const css=await readFile('dist/t-design-system.css','utf8');
  const page=await browser.newPage({viewport:{width:500,height:300},reducedMotion:'no-preference'});
  await page.setContent(`<style>${css}body{padding:20px}.tg-progress{width:400px;margin-bottom:16px}</style><progress class="tg-progress" max="100" value="42"></progress><div class="tg-progress"><span class="tg-progress__bar" style="--progress:42%"></span></div>${[25,75].map(v=>`<div class="tg-progress tg-progress--striped" id="p${v}"><span class="tg-progress__bar" style="--progress:${v}%"></span></div>`).join('')}<span class="tg-spinner tg-spinner--lg"></span><span class="tg-progress-ring"></span>`);
  const phase=async time=>page.evaluate(async time=>{
    const animations=document.getAnimations().filter(a=>a.animationName==='tg-stripes');
    for(const a of animations)a.pause();
    await Promise.all(animations.map(a=>a.ready));
    for(const a of animations)a.currentTime=time;
  },time);
  const sample=async id=>{
    const rect=await page.locator(id).boundingBox();
    const rtl=await page.locator(id).evaluate(el=>getComputedStyle(el).direction==='rtl');
    const png=await page.screenshot({clip:{x:rtl?rect.x+rect.width-82:rect.x+12,y:rect.y+Math.floor(rect.height/2),width:70,height:1}});
    return page.evaluate(async data=>{
      const img=new Image();img.src='data:image/png;base64,'+data;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const {data:p}=ctx.getImageData(0,0,c.width,1);return Array.from({length:c.width},(_,i)=>p[i*4]*.2126+p[i*4+1]*.7152+p[i*4+2]*.0722);
    },png.toString('base64'));
  };
  for(const theme of ['light','dark','ios-dark']) for(const direction of ['ltr','rtl']) {
    await page.evaluate(direction=>document.documentElement.dir=direction,direction);
    await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
    const colors=await page.evaluate(()=>{
      const probe=document.createElement('span');probe.style.color='var(--accent-main)';document.body.append(probe);
      const expected=getComputedStyle(probe).color;probe.remove();
      return {expected,actual:[getComputedStyle(document.querySelector('.tg-progress__bar')).backgroundColor,getComputedStyle(document.querySelector('.tg-spinner')).borderTopColor,getComputedStyle(document.querySelector('.tg-progress-ring')).color]};
    });
    assert.ok(colors.actual.every(color=>color===colors.expected),`${theme}: bar, spinner and ring use accent-main: ${JSON.stringify(colors)}`);
    await page.evaluate(()=>{
      getComputedStyle(document.querySelector('#p25 .tg-progress__bar')).clipPath;
      for(const a of document.getAnimations())if('transitionProperty' in a)a.finish();
    });
    const heights=await page.locator('.tg-progress').evaluateAll(nodes=>nodes.map(e=>e.getBoundingClientRect().height));
    assert.ok(heights.every(h=>h===14),`${theme}: native, plain and animated bars share the same whole-pixel height`);
    await phase(0);const small=await sample('#p25'),large=await sample('#p75');
    assert.ok(Math.max(...small)-Math.min(...small)>=20,`${theme}: moving stripes have visible contrast (${Math.max(...small)-Math.min(...small)})`);
    const mismatch=small.reduce((sum,v,i)=>sum+Math.abs(v-large[i]),0)/small.length;
    assert.ok(mismatch<2,`${theme}: stripe size/angle do not change with progress (${mismatch})`);
    await phase(250);const moved=await sample('#p25');
    const change=small.reduce((sum,v,i)=>sum+Math.abs(v-moved[i]),0)/small.length;
    assert.ok(change>2,`${theme}: stripe texture moves between animation phases (${change})`);
  }
  await phase(0);const settled=await sample('#p75');
  await page.locator('#p25 .tg-progress__bar').evaluate(async bar=>{
    bar.style.setProperty('--progress','75%');getComputedStyle(bar).transform;
    const transition=bar.getAnimations().find(a=>'transitionProperty' in a);
    if(!transition)throw new Error('progress update must animate');
    transition.pause();await transition.ready;transition.currentTime=500;
  });
  const during=await sample('#p25');
  assert.ok(during.reduce((sum,v,i)=>sum+Math.abs(v-settled[i]),0)/during.length<2,'stripe geometry stays stable while the percentage itself is changing');
  await page.evaluate(()=>document.documentElement.style.setProperty('--progress-height','20px'));
  assert.ok((await page.locator('.tg-progress').evaluateAll(nodes=>nodes.map(e=>e.getBoundingClientRect().height))).every(h=>h===20),'one height token updates every progress variant');
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('#p25 .tg-progress__bar').evaluate(e=>getComputedStyle(e,'::after').animationName),'none');
  console.log('Progress: equal heights, shared height token, visible uncompressed moving stripes, three themes and reduced motion.');
}finally{await browser.close();}
