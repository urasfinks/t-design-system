import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium, webkit} from 'playwright';
const browser=await (process.argv.includes('--webkit') ? webkit : chromium).launch();
try {
  const css=await readFile('dist/t-design-system.css','utf8');
  for(const scale of [1,2]) {
    const page=await browser.newPage({viewport:{width:800,height:300},deviceScaleFactor:scale});
    for(const name of ['sea','mountains','forest','desert','city']) {
      const svg=await readFile(`docs/media/${name}.svg`,'utf8');
      const fill=name==='city' ? svg.match(/<rect x="20"[^>]*fill="#([0-9a-f]{6})"/)[1] : [...svg.matchAll(/fill="#([0-9a-f]{6})"/g)].at(-1)[1];
      const rgb=[0,2,4].map(i=>parseInt(fill.slice(i,i+2),16));
      await page.setContent(`<style>${css}body{margin:0;padding:40px;background:#151e27}.tg-carousel{width:260px}.tg-carousel__viewport{padding:0;overflow:visible}.target{width:260px;height:160px;animation:none;transform:perspective(960px) translateZ(-58.5361px) rotateY(24deg)}</style><div class="tg-carousel tg-carousel--coverflow"><div class="tg-carousel__viewport"><figure class="tg-carousel__slide"><img class="target" src="data:image/svg+xml,${encodeURIComponent(svg)}"></figure></div></div>`);
      await page.locator('img').evaluate(img=>img.decode());
      const rect=await page.locator('img').evaluate(e=>e.getBoundingClientRect().toJSON());
      const shot=await page.screenshot();
      const count=await page.evaluate(async ({base64,rect,scale,rgb,name})=>{
        const im=new Image();im.src='data:image/png;base64,'+base64;await im.decode();
        const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);const {data}=ctx.getImageData(0,0,c.width,c.height);
        // For city sample the solid first building, avoiding the intentional sky gap.
        let bad=0;const bg=[21,30,39];
        for(let y=Math.floor((rect.bottom-(name==='city'?3:16))*scale);y<Math.ceil(rect.bottom*scale);y++)for(let x=Math.floor((rect.left+(name==='city'?12:0))*scale);x<Math.ceil((rect.left+(name==='city'?18:20))*scale);x++) {
          const n=(y*c.width+x)*4;
          if(rgb.some((v,k)=>data[n+k]>Math.max(v,bg[k])+4))bad++;
        }return bad;
      },{base64:shot.toString('base64'),rect,scale,rgb,name});
      assert.equal(count,0,`${name}, DPR ${scale}: pale SVG underlay bleeds into the dark lower corner`);
    }
    await page.close();
  }
  console.log('Real landscape SVGs: no pale underlay at transformed corners, DPR 1 and 2.');
} finally {await browser.close();}
