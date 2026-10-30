import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium, webkit} from 'playwright';
const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
try {
  const css = await readFile('dist/t-design-system.css', 'utf8');
  const extra = [
    ['overlay card', '<article class="tg-card tg-card--overlay subject"><div class="tg-card__media">IMAGE</div></article>'],
    ['carousel in viewport', '<div class="tg-carousel"><div class="tg-carousel__viewport"><figure class="tg-carousel__slide subject">IMAGE<div class="test-shade"></div></figure></div></div>'],
    ['thumbnail', '<div class="tg-carousel__thumbs"><button class="subject">IMAGE<div class="test-shade"></div></button></div>'],
    ['carousel slide', '<figure class="tg-carousel__slide subject">IMAGE<div class="test-shade"></div></figure>'],
    ['player cover', '<figure class="tg-player__cover subject">IMAGE<div class="test-shade"></div></figure>'],
    ['compare', '<div class="tg-compare subject">IMAGE<div class="test-shade"></div></div>'],
    ['choice media', '<div class="tg-choice-card__media subject">IMAGE<div class="test-shade"></div></div>'],
    ['card media', '<div class="tg-card__media subject">IMAGE<div class="test-shade"></div></div>'],
    ['avatar clip', '<span class="tg-avatar__clip subject">IMAGE<div class="test-shade"></div></span>'],
    ['testimonial', '<blockquote class="tg-testimonial subject"><figure class="tg-testimonial__media">IMAGE</figure><div class="test-shade"></div></blockquote>'],
  ];
  for (const width of [390, 800]) for (const scale of [1, 2]) {
    const page = await browser.newPage({viewport:{width,height:240}, deviceScaleFactor:scale, reducedMotion:'reduce'});
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" fill="#ffffff"/></svg>';
    await page.setContent(`<style>${css}:root{--overlay-bg:rgb(0 0 0 / .9)}body{background:#151e27;padding:20px}.tg-image-accordion{height:160px;width:160px}</style><ul class="tg-image-accordion"><li class="tg-image-accordion__item"><img src="data:image/svg+xml,${encodeURIComponent(svg)}"><button class="tg-image-accordion__trigger" aria-label="Open"></button></li></ul>`);
    await page.locator('img').evaluate(img => img.decode());
    const rect = await page.locator('li').evaluate(el => el.getBoundingClientRect().toJSON());
    const png = await page.screenshot();
    const excess = await page.evaluate(async ({base64, scale, rect}) => {
      const img = new Image(); img.src = 'data:image/png;base64,'+base64; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width=img.width; canvas.height=img.height;
      const context=canvas.getContext('2d');context.drawImage(img,0,0);
      const {data}=context.getImageData(0,0,img.width,img.height);
      const pixel=(x,y)=>Array.from(data.slice((y*img.width+x)*4,(y*img.width+x)*4+3));
      let excess=0;
      // A clipped edge can blend only the shaded image and outside background.
      // It must never be brighter than both: that would expose an unshaded layer.
      for(let y=(rect.bottom-16)*scale;y<rect.bottom*scale;y++) for(let x=rect.left*scale;x<(rect.left+16)*scale;x++) {
        const edge=pixel(x,y), inside=pixel(Math.floor((rect.left+rect.width/2)*scale),y), outside=pixel(0,y);
        if(edge.some((v,c)=>v>Math.max(inside[c],outside[c])+1)) excess++;
      }
      return excess;
    },{base64:png.toString('base64'),scale,rect});
    assert.equal(excess,0,`Width ${width}, DPR ${scale}: bright pixels escape the shared rounded edge`);
    for (const [name, markup] of extra) {
      await page.setContent(`<style>${css}:root{--overlay-bg:rgb(0 0 0 / .9)}body{background:#151e27;padding:20px}.tg-carousel,.tg-carousel__thumbs{width:160px;padding:0}.subject{flex:none;position:relative;display:block;width:160px;height:160px;min-height:0;margin:0;padding:0;border:0;border-radius:16px}.subject img{width:160px;height:160px;object-fit:cover;min-height:0}.subject>.tg-testimonial__media{margin:0;height:160px}.test-shade{position:absolute;inset:0;background:linear-gradient(to top,var(--overlay-bg),transparent 55%)}</style>${markup.replace('IMAGE', `<img src="data:image/svg+xml,${encodeURIComponent(svg)}">`)}`);
      await page.locator('img').evaluate(img => img.decode());
      const bounds = await page.locator('.subject').evaluate(el=>el.getBoundingClientRect().toJSON());
      const shot = await page.screenshot();
      const result = await page.evaluate(async ({base64,scale,bounds}) => {
        const img=new Image();img.src='data:image/png;base64,'+base64;await img.decode();
        const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);
        const {data}=ctx.getImageData(0,0,c.width,c.height);const pixel=(x,y)=>Array.from(data.slice((y*c.width+x)*4,(y*c.width+x)*4+3));
        let count=0;for(let y=Math.floor((bounds.bottom-16)*scale);y<Math.floor(bounds.bottom*scale);y++)for(let x=Math.floor(bounds.left*scale);x<Math.floor((bounds.left+16)*scale);x++) {
          const edge=pixel(x,y),inside=pixel(Math.floor((bounds.left+bounds.width/2)*scale),y),outside=pixel(0,y);
          if(edge.some((v,k)=>v>Math.max(inside[k],outside[k])+1))count++;
        }return count;
      },{base64:shot.toString('base64'),scale,bounds});
      assert.equal(result,0,`${name}, width ${width}, DPR ${scale}: bright corner fringe`);
    }
    await page.close();
  }
  const focusPage = await browser.newPage({viewport:{width:800,height:300}, reducedMotion:'reduce'});
  const focusCss = `${css}:root{--text-link:rgb(0 255 0);--panel-shadow:0 0 0 6px rgb(255 0 255)}body{padding:20px;background:#151e27}`;
  const image = '<img width="160" height="160" src="data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" fill="white"/></svg>')+'">';
  for (const [name, markup, target] of [
    ['thumbnail', `<div class="tg-carousel__thumbs"><button aria-label="Choose">${image}</button></div>`, 'button'],
    ['overlay card', `<article class="tg-card tg-card--overlay tg-card--link" style="width:240px"><div class="tg-card__media">${image}</div><div class="tg-card__body"><a class="tg-card__link" href="#test">Open</a></div></article>`, 'a'],
  ]) {
    await focusPage.setContent(`<style>${focusCss}</style>${markup}`);
    await focusPage.locator('img').evaluate(img=>img.decode());
    await focusPage.keyboard.press('Tab');
    await focusPage.locator(target).focus();
    assert.equal(await focusPage.locator(target).evaluate(el=>el.matches(':focus-visible')),true,`${name}: keyboard focus`);
    const png=await focusPage.screenshot();
    const colors=await focusPage.evaluate(async base64=>{
      const i=new Image();i.src='data:image/png;base64,'+base64;await i.decode();
      const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const ctx=c.getContext('2d');ctx.drawImage(i,0,0);const {data}=ctx.getImageData(0,0,c.width,c.height);
      let green=0,magenta=0;for(let n=0;n<data.length;n+=4){if(data[n+1]>120&&data[n+1]>data[n]+80&&data[n+1]>data[n+2]+80)green++;if(data[n]>200&&data[n+1]<80&&data[n+2]>200)magenta++;}return {green,magenta};
    },png.toString('base64'));
    assert.ok(colors.green>12,`${name}: focus ring is actually painted`);
    if(name==='overlay card')assert.ok(colors.magenta>100,'card outer shadow is preserved');
  }
  await focusPage.close();
  const stagePage = await browser.newPage({viewport:{width:800,height:600}, reducedMotion:'no-preference'});
  for (const variant of ['coverflow','fan','ring']) {
    await stagePage.setContent(`<style>${css}</style><div class="tg-carousel tg-carousel--${variant}"><div class="tg-carousel__viewport"><figure class="tg-carousel__slide"><div class="tg-card"><div class="tg-card__media">${image}</div></div></figure></div></div>`);
    const clipping = await stagePage.evaluate(() => ({
      supported: CSS.supports('animation-timeline: view()'),
      slide: getComputedStyle(document.querySelector('.tg-carousel__slide')).clipPath,
      nested: getComputedStyle(document.querySelector('.tg-card__media')).clipPath,
      mask: getComputedStyle(document.querySelector('.tg-card__media')).maskImage,
    }));
    if(clipping.supported)assert.equal(clipping.slide,'none',`${variant}: 3D stage remains unclipped`);
    assert.equal(clipping.nested,'border-box',`${variant}: nested media keeps its own clipping`);
    assert.notEqual(clipping.mask,'none',`${variant}: stage exception does not leak into nested media`);
  }
  await stagePage.close();
  console.log('Rounded media: no unshaded corner fringe at DPR 1 and 2, mobile and desktop.');
} finally {await browser.close();}
