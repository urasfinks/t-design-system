import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium, webkit} from 'playwright';
const browser=await (process.argv.includes('--webkit') ? webkit : chromium).launch();
try {
  const css=await readFile('dist/t-design-system.css','utf8');
  const image='<img src="data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" fill="white"/></svg>')+'">';
  for(const scale of [1,2]) for(const radius of [16,28]) {
    const page=await browser.newPage({viewport:{width:800,height:300},deviceScaleFactor:scale});
    await page.setContent(`<style>${css}:root{--radius-lg:${radius}px}body{background:#151e27;padding:20px}.tg-carousel{width:160px}.tg-carousel__viewport{height:160px;scroll-snap-type:none;scroll-behavior:auto}</style><section class="tg-carousel" data-tg-effect="ripple"><div class="tg-carousel__viewport"><figure class="tg-carousel__slide">${image}</figure><figure class="tg-carousel__slide">${image}</figure></div><canvas class="tg-effect-layer" width="160" height="160"></canvas></section>`);
    await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
    // Halfway through native scrolling, the outer edge crosses a slide's middle.
    await page.locator('.tg-carousel__viewport').evaluate(el=>el.scrollLeft=80);
    const rect=await page.locator('canvas').evaluate(c=>{const ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);return c.getBoundingClientRect().toJSON();});
    const radii=await page.locator('.tg-carousel__viewport, .tg-carousel__slide, canvas').evaluateAll(nodes=>nodes.map(el=>getComputedStyle(el).borderTopLeftRadius));
    assert.ok(radii.every(value=>value===`${radius}px`),'slides, viewport and effect share the radius token');
    for(const state of ['transitioning','idle']) {
      await page.locator('canvas').evaluate((c,state)=>c.dataset.state=state,state);
      const png=await page.screenshot();
      const corners=await page.evaluate(async ({base64,rect,scale})=>{
        const im=new Image();im.src='data:image/png;base64,'+base64;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);
        return [[rect.left,rect.top],[rect.right-1,rect.top],[rect.left,rect.bottom-1],[rect.right-1,rect.bottom-1]].map(([x,y])=>[...ctx.getImageData(Math.round(x*scale),Math.round(y*scale),1,1).data]);
      },{base64:png.toString('base64'),rect,scale});
      for(const corner of corners)assert.deepEqual(corner,[21,30,39,255],`${state}, DPR ${scale}, radius ${radius}: rounded frame must survive intermediate scrolling`);
    }
    await page.close();
  }
  console.log('Ripple: four rounded corners preserved during and after transition, DPR 1/2, shared and custom radius.');
}finally{await browser.close();}
