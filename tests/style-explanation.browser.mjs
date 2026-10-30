import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {explainProperty} from '../scripts/lib/style-explanation.mjs';
const browser=await chromium.launch();
try {
  const page=await browser.newPage();
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');await cdp.send('CSS.enable');
  const headers=new Map();cdp.on('CSS.styleSheetAdded',({header})=>headers.set(header.styleSheetId,header));
  await page.setContent(`<style>
    @layer foundation, components;
    @layer foundation { :root { --edge: rgb(20, 30, 40); --border: 1px solid var(--edge); } #counter {border: 0;} }
    @layer components { .badge {border:0;--edge:rgb(90, 80, 70);} button .badge {border:var(--border);} }
    .conflict {color:blue !important} #priority {color:red}
  </style><button><span class="badge" id="counter">3</span></button><span class="badge" id="status">Status</span><p class="conflict" id="priority">Priority</p><p id="inline" style="color:rgb(50, 60, 70)">Inline</p>`);
  const root=(await cdp.send('DOM.getDocument',{depth:-1})).root;
  const explain=async(selector,property)=>{
    const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector});
    return explainProperty({page,cdp,nodeId,property,headers});
  };
  const border=await explain('#counter','border-top-color');
  assert.equal(border.computed,'rgb(20, 30, 40)');
  assert.equal(border.controlling.length,1);
  assert.equal(border.controlling[0].selector,'button .badge');
  assert.equal(border.controlling[0].declaration.name,'border');
  assert.deepEqual(border.dependencies,['--border']);
  assert.ok(border.overridden.some(c=>c.selector==='#counter'),'later layer defeats higher specificity');
  const token=await explain('#counter','--border');
  assert.equal(token.controlling[0].selector,':root');
  assert.ok(token.controlling[0].ancestor>0,'inherited variable source is recorded');
  assert.deepEqual(token.dependencies,['--edge']);
  const localEdge=await explain('#counter','--edge');
  assert.equal(localEdge.computed,'rgb(90, 80, 70)');
  assert.equal(localEdge.controlling[0].selector,'.badge');
  assert.ok(token.dependencyContexts[0].ancestor>0,'token dependency must be resolved in ancestor definition context');
  const edge=await explain('html','--edge');
  assert.equal(edge.controlling[0].selector,':root');
  assert.equal(edge.computed,'rgb(20, 30, 40)','inherited border uses root edge, not descendant override');
  const inline=await explain('#inline','color');
  assert.equal(inline.controlling[0].origin,'inline');
  assert.equal(await page.locator('#inline').getAttribute('style'),'color:rgb(50, 60, 70)','inline styles restored verbatim');
  const important=await explain('#priority','color');
  assert.equal(important.controlling[0].selector,'.conflict');
  assert.equal(important.controlling[0].important,true);
  assert.equal(await page.locator('#counter').evaluate(el=>getComputedStyle(el).borderTopColor),'rgb(20, 30, 40)','every probe is restored');
  assert.equal(await page.locator('#status').evaluate(el=>getComputedStyle(el).borderTopWidth),'0px');
  console.log('Style explanations: shorthand, inherited token chain, layer priority and important winners confirmed by browser probes; original styles restored.');
} finally {await browser.close();}
