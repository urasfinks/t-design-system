import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
const failures = [];
let checks = 0;
const check = (label, condition, evidence = '') => {
  checks++;
  console.log(`${condition ? '✓' : '✗'} ${label}${condition ? '' : `: ${JSON.stringify(evidence)}`}`);
  if (!condition) failures.push(label);
};
try {
  const page = await browser.newPage({ viewport: {width:360,height:800}, reducedMotion:'reduce' });
  const css = await readFile('dist/t-design-system.css','utf8');
  await page.setContent(`<style>${css}</style>
  <div id="card" class="tg-card">Карточка</div>
  <input id="input" class="tg-input" aria-label="Ввод">
  <div id="header" class="tg-header-secondary">Заголовок</div>
  <hr class="tg-divider">
  <div id="joined" class="tg-card tg-no-radius-bottom">Стык</div>
  <div dir="rtl"><div dir="ltr"><button id="nested" class="tg-switch" aria-checked="true"><span class="tg-switch__knob"></span></button></div></div>
  <button id="self-rtl" class="tg-switch" dir="rtl" aria-checked="true"><span class="tg-switch__knob"></span></button>
  <span id="avatar" class="tg-avatar" data-pressed="true"><span class="tg-avatar__initials">АБ</span></span>
  <label class="tg-upload">Выбрать файл<input type="file" class="tg-sr-only"></label>
  <div class="tg-progress tg-progress--striped"><span class="tg-progress__bar" style="--progress:50%"></span></div>
  <span class="tg-spinner tg-spinner--lg"></span>
  <div class="tg-ios-spacer"></div>
  <div class="tg-toast tg-toast--show" dir="rtl">Сохранено</div>
  <div id="reference"></div>`);
  const compare = (selector, property, reference) => page.evaluate(({selector,property,reference}) => {
    const expected=document.querySelector('#reference');expected.style.cssText=reference;
    return [getComputedStyle(document.querySelector(selector)).getPropertyValue(property),getComputedStyle(expected).getPropertyValue(property)];
  },{selector,property,reference});
  const probes=[
    ['body','background-color','background:color-mix(in srgb,var(--bg-color) 97%,white)','body background formula'],
    ['#card','background-color','background:var(--section-bg-color)','opaque card surface'],
    ['#card','border-top-color','border:1px solid color-mix(in srgb,var(--section-separator-color) 50%,transparent)','subtle source border'],
    ['#card','box-shadow','box-shadow:none','flat cards reserve elevation for overlays'],
    ['#input','background-color','background:color-mix(in srgb,var(--secondary-bg-color) 99%,var(--text-color) 1%)','source input surface'],
    ['#header','background-color','background:color-mix(in srgb,var(--header-bg-color) 18%,transparent)','secondary header transparency'],
  ];
  for (const theme of ['light','dark','ios-dark']) {
    await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
    for (const [selector,prop,reference,label] of probes) {const values=await compare(selector,prop,reference);check(`${theme}: ${label}`,values[0]===values[1],values);}
    check(`${theme}: white switch knob`,await page.locator('#nested .tg-switch__knob').evaluate(el=>getComputedStyle(el).backgroundColor)==='rgb(255, 255, 255)');
  }
  const join=await page.locator('#joined').evaluate(el=>getComputedStyle(el).borderBottomColor);
  check('joined cards suppress joining border',join==='rgba(0, 0, 0, 0)',join);
  check('divider preserves dashed source style',await page.locator('.tg-divider').evaluate(el=>getComputedStyle(el).borderTopStyle)==='dashed');
  for (const id of ['nested','self-rtl']) {
    const result=await page.locator(`#${id}`).evaluate(el=>{const outer=el.getBoundingClientRect(),knob=el.firstElementChild.getBoundingClientRect();return {inside:knob.left>=outer.left&&knob.right<=outer.right,direction:getComputedStyle(el).direction,offset:knob.left-outer.left};});
    check(`${id}: checked knob stays within control`,result.inside,result);
    if(id==='self-rtl')check('RTL checked knob is at inline end',result.offset<5,result);
  }
  await page.evaluate(()=>document.documentElement.dir='rtl');
  const toast=await page.locator('.tg-toast').boundingBox();
  check('RTL toast centered inside viewport',toast.x>=0&&toast.x+toast.width<=360,toast);
  await page.locator('.tg-toast').evaluate(el=>el.textContent='x'.repeat(300));
  const overflow=await page.locator('.tg-toast').evaluate(el=>({scroll:el.scrollWidth,client:el.clientWidth}));
  check('unbroken toast content wraps',overflow.scroll<=overflow.client+1,overflow);
  check('avatar retains press feedback',await page.locator('#avatar').evaluate(el=>getComputedStyle(el).transform)==='matrix(0.96, 0, 0, 0.96, 0, 0)');
  check('file upload is a styled control',await page.locator('.tg-upload').evaluate(el=>getComputedStyle(el).display)==='flex');
  await page.evaluate(()=>document.documentElement.style.setProperty('--ios-h','2rem'));
  check('iOS spacer consumes the integration height',await page.locator('.tg-ios-spacer').evaluate(el=>getComputedStyle(el).height)==='32px');
  const stripe=await page.locator('.tg-progress__bar').evaluate(el=>({blur:getComputedStyle(el,'::after').filter,animation:getComputedStyle(el,'::after').animationName,height:getComputedStyle(el.parentElement).height}));
  check('source blurred progress stripe retained',stripe.blur==='blur(6px)'&&stripe.height==='14px',stripe);
  check('stripes stop under reduced motion',stripe.animation==='none',stripe);
  check('large spinner retains the source blue accent', await page.locator('.tg-spinner--lg').evaluate(el => getComputedStyle(el).borderTopColor) === 'rgb(76, 175, 239)');
  assert.deepEqual(failures,[],`${failures.length} of ${checks} audit checks failed`);
  console.log(`${checks} audit checks passed.`);
} finally {await browser.close();}
