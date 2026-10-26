import assert from 'node:assert/strict';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {chromium, webkit} from 'playwright';
import {compareCatalogPaint} from './helpers/catalog-paint.mjs';
const fixture = 'tests/fixtures/cascade-baseline/';
const baseline = await readFile(fixture+'t-design-system.css','utf8') + await readFile(fixture+'catalog.css','utf8');
const current = await readFile('dist/t-design-system.css','utf8') + await readFile('docs/catalog.css','utf8');
const html = (await readFile('docs/index.html','utf8'))
  .replace(/<script\b[\s\S]*?<\/script>/g,'')
  .replace(/<link\b[^>]*>/g,'')
  .replace(/<iframe\b[\s\S]*?<\/iframe>/g,'')
  .replace(/<use\b[^>]*><\/use>/g,'');
const engine = process.argv.includes('--webkit') ? 'webkit' : 'chromium';
const browser = await ({chromium,webkit})[engine].launch();
const properties = ['display','position','color','backgroundColor','backgroundImage','backgroundSize',
  'border','borderRadius','padding','margin','width','height','minWidth','minHeight','maxWidth','maxHeight',
  'font','letterSpacing','lineHeight','gap','boxShadow','transform','opacity','visibility','overflow',
  'alignItems','justifyContent','flex','outline','outlineOffset','filter'];
try {
  const page = await browser.newPage({reducedMotion:'reduce'});
  await page.setContent(html);
  await page.addStyleTag({content:baseline});
  const sheet = page.locator('style').last();
  // Chromium's first full-page capture can settle balanced text and change page height.
  // Compare consecutive stable paints, rather than an intermediate layout frame.
  const stablePixels = async () => {
    let previous;
    for (let attempt=0; attempt<4; attempt++) {
      const pixels=await page.screenshot({fullPage:true});
      if (previous && (await compareCatalogPaint(page,previous,pixels)).equal) return pixels;
      previous=pixels;
    }
    throw new Error('Catalog rendering did not stabilize for an exact screenshot comparison');
  };
  const snapshot = () => page.locator('body *:not(script):not(style)').evaluateAll((nodes, properties) => nodes.map(node => {
    const read = pseudo => {
      const style = getComputedStyle(node, pseudo);
      return Object.fromEntries(properties.map(property => [property, style[property]]));
    };
    return {tag:node.tagName,id:node.id,text:node.textContent.slice(0,50),classes:node.className,style:read(null),before:read('::before'),after:read('::after')};
  }),properties);
  await mkdir('artifacts/cascade-refactor',{recursive:true});
  let checks=0;
  let rasterizationPixels=0;
  for (const theme of ['light','dark','ios-dark']) {
    for (const width of [320,390,1440]) {
      await page.setViewportSize({width,height:1000});
      for (const accent of ['', '#18745b', '#7151c7']) {
        await page.evaluate(({theme,accent}) => {
          document.documentElement.dataset.theme=theme;
          if (accent) document.documentElement.style.setProperty('--button-color',accent);
          else document.documentElement.style.removeProperty('--button-color');
        },{theme,accent});
        await page.mouse.move(0,0);
        await sheet.evaluate((el,css)=>el.textContent=css,baseline);
        await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
        const pixels = await stablePixels();
        const expected = await snapshot();
        await sheet.evaluate((el,css)=>el.textContent=css,current);
        await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
        const after = await stablePixels();
        const actual = await snapshot();
        const differences=[];
        for(let i=0;i<expected.length;i++) for(const part of ['style','before','after']) for(const property of properties) {
          if(actual[i][part][property]!==expected[i][part][property]) differences.push({index:i,tag:expected[i].tag,id:expected[i].id,text:expected[i].text,classes:expected[i].classes,part,property,before:expected[i][part][property],after:actual[i][part][property]});
        }
        if(differences.length) {
          await writeFile(`artifacts/cascade-refactor/${engine}-style-differences.json`,JSON.stringify(differences,null,2));
          assert.fail(`${engine}/${theme}/${width}/${accent}: ${differences.length} differences: ${JSON.stringify(differences.slice(0,5))}`);
        }
        const paint=await compareCatalogPaint(page,pixels,after);
        rasterizationPixels+=paint.rasterizationPixels||0;
        if (!paint.equal) {
          await writeFile(`artifacts/cascade-refactor/${engine}-${theme}-${width}-expected.png`,pixels);
          await writeFile(`artifacts/cascade-refactor/${engine}-${theme}-${width}-actual.png`,after);
          assert.fail(`${engine}/${theme}/${width}/${accent}: catalog pixels changed: ${paint.reason}`);
        }
        checks++;
        if (!accent) await writeFile(`artifacts/cascade-refactor/${engine}-${theme}-${width}.png`,after);
      }
    }
  }
  let aliasChecks=0;
  const variants=[
    '<button class="tg-badge tg-badge--secondary">Draft</button>',
    '<a class="tg-badge tg-badge--secondary" href="#test">Draft</a>',
    '<button class="tg-badge tg-badge--secondary" disabled>Draft</button>',
    '<button class="tg-badge tg-badge--secondary" aria-disabled="true">Draft</button>',
    '<div aria-disabled="true"><button class="tg-badge tg-badge--secondary">Draft</button></div>',
  ];
  for(const theme of ['light','dark','ios-dark']) for(const markup of variants) {
    await page.setContent(`<html data-theme="${theme}" style="--surface-muted:rgb(10 20 30);--secondary-bg-color-transparent:rgb(210 220 230)"><style>${baseline}</style><div style="padding:24px">${markup}</div></html>`);
    const stateSheet=page.locator('style');
    const badge=page.locator('.tg-badge');
    for(const hovered of [false,true]) {
      if(hovered) await badge.hover({force:true}); else await page.mouse.move(0,0);
      await stateSheet.evaluate((el,css)=>el.textContent=css,baseline);
      const expected=await snapshot();
      await stateSheet.evaluate((el,css)=>el.textContent=css,current);
      assert.deepEqual(await snapshot(),expected,`${engine}/${theme}: secondary badge custom aliases, hover=${hovered}`);
      aliasChecks++;
    }
  }
  console.log(`${checks} visual comparisons and ${aliasChecks} custom badge state comparisons passed in ${engine}: computed properties, pseudo-elements and full catalog pixels, 3 themes × 3 widths × 3 accents; ${rasterizationPixels} isolated brand text rasterization pixels tolerated.`);
} finally {await browser.close();}
