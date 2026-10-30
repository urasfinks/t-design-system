import {styleSourceFingerprint} from './lib/style-source-fingerprint.mjs';
import {chromium} from 'playwright';
import {compileAsync} from 'sass';
import {SourceMapConsumer} from 'source-map-js';
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolvePublicPath} from './serve.mjs';
import {explainProperty} from './lib/style-explanation.mjs';
const args=process.argv.slice(2);
const option=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const selector=option('--selector');
if(!selector)throw Error('Provide --selector; optional --property, --theme, --page, --state, --out');
const fingerprint=await styleSourceFingerprint();
const contracts=JSON.parse(await readFile(new URL('../architecture/style-contracts.json',import.meta.url),'utf8'));
const property=option('--property','border-top-color');
const theme=option('--theme','dark');
const sourcePage=option('--page','index.html');
if(!/^[\w-]+\.html$/.test(sourcePage))throw Error('Expected a docs HTML filename');
const compiled=await compileAsync(fileURLToPath(new URL('../src/index.scss',import.meta.url)),{style:'expanded',charset:false,sourceMap:true,sourceMapIncludeSources:true});
const map=new SourceMapConsumer(compiled.sourceMap);
const server=createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/dist/t-design-system.css'){res.setHeader('Content-Type','text/css');res.end(compiled.css);return;}
  const file=await resolvePublicPath(pathname);
  if(!file){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/html');
  res.end(await readFile(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try {
  browser=await chromium.launch();
  const page=await browser.newPage({viewport:{width:Number(option('--width','1440')),height:1000},reducedMotion:'reduce'});
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');await cdp.send('CSS.enable');
  const headers=new Map();cdp.on('CSS.styleSheetAdded',({header})=>headers.set(header.styleSheetId,header));
  await page.goto(`http://127.0.0.1:${server.address().port}/docs/${sourcePage}`);
  await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
  const {root}=await cdp.send('DOM.getDocument',{depth:-1});
  const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector});
  if(!nodeId)throw Error(`Element not found: ${selector}`);
  const state=option('--state','rest');
  if(state!=='rest') {
    if(!['hover','focus','focus-visible','active'].includes(state))throw Error('State must be rest/hover/focus/focus-visible/active');
    await cdp.send('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:state==='focus-visible'?['focus','focus-visible']:[state]});
  }
  const nodeContext=async(nodeId,ancestor=0)=>{
    const original=(await cdp.send('DOM.resolveNode',{nodeId})).object;
    const object=(await cdp.send('Runtime.callFunctionOn',{objectId:original.objectId,functionDeclaration:`function(depth){let el=this;while(depth--)el=el.parentElement;return el;}`,arguments:[{value:ancestor}]})).result;
    const contextNode=(await cdp.send('DOM.requestNode',{objectId:object.objectId})).nodeId;
    const context=(await cdp.send('Runtime.callFunctionOn',{objectId:object.objectId,functionDeclaration:`function(){const parts=[];for(let n=this;n;n=n.parentElement){const siblings=n.parentElement?[...n.parentElement.children]:[n];parts.unshift(n.tagName.toLowerCase()+':nth-child('+(siblings.indexOf(n)+1)+')');}return {tag:this.tagName,id:this.id,classes:[...this.classList],path:parts.join(' > ')};}`,returnByValue:true})).result.value;
    await cdp.send('Runtime.releaseObject',{objectId:object.objectId});
    await cdp.send('Runtime.releaseObject',{objectId:original.objectId});
    return {nodeId:contextNode,context};
  };
  const explanations=[],queue=[{property,nodeId}],seen=new Set();
  while(queue.length){
    const item=queue.shift(),p=item.property;
    const evaluation=await nodeContext(item.nodeId);
    const id=`${evaluation.context.path}::${p}`;
    if(seen.has(id))continue;seen.add(id);
    const explanation=await explainProperty({page,cdp,nodeId:item.nodeId,property:p,sourceMap:map,headers});
    explanation.id=id;explanation.context=evaluation.context;
    for(const source of [...explanation.controlling,...explanation.overridden])source.families=contracts.families.filter(f=>`src/${f.owner.replace(/([^/]+)$/, '_$1')}.scss`===source.source).map(f=>f.id);
    const references=[];
    for(const reference of explanation.dependencyContexts){
      const definition=await nodeContext(item.nodeId,reference.ancestor);
      references.push({property:reference.property,context:definition.context,id:`${definition.context.path}::${reference.property}`});
      queue.push({property:reference.property,nodeId:definition.nodeId});
    }
    explanation.dependencyContexts=references;
    explanations.push(explanation);
    if(seen.size>80)throw Error('Dependency trace exceeded 80 contextual properties');
  }
  const element=await page.locator(selector).first().evaluate(el=>({tag:el.tagName,classes:[...el.classList],parent:{tag:el.parentElement.tagName,classes:[...el.parentElement.classList]},html:el.outerHTML}));
  const graphNodes=[],graphEdges=[];
  for(const e of explanations){
    graphNodes.push({id:e.id,property:e.property,context:e.context,kind:'computed-property',value:e.computed});
    e.controlling.forEach((c,i)=>{const id=`${e.id}:source:${i}`;graphNodes.push({id,kind:'declaration',...c});graphEdges.push({from:id,to:e.id,kind:'determines'});for(const reference of e.dependencyContexts)graphEdges.push({from:reference.id,to:id,kind:'references-token-in-definition-context'});});
  }
  const output={fingerprint,graph:{nodes:graphNodes,edges:graphEdges},selector,context:{page:sourcePage,theme,width:Number(option('--width','1440')),state,browser:'Chromium'},element,method:'Reversible isolated-browser probes identify controlling declaration blocks; source maps resolve compiled CSS to Sass. Overridden lists contain matching candidate declarations, not inferred winners.',limitations:['Inherited CSS-wide keywords, revert/revert-layer, and coupled properties may require manual inspection. Unresolved provenance is explicitly marked.','Probing identifies the controlling declaration block. Multiple declarations inside that block retain their source order; no claim of a unique declaration is made when they are ambiguous.'],explanations};
  const text=JSON.stringify(output,null,2)+'\n';
  const out=option('--out');if(out)await writeFile(out,text);
  console.log(out?`Wrote ${out}: ${explanations.map(e=>`${e.property}=${e.computed} [${e.status}]`).join('; ')}`:text);
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
