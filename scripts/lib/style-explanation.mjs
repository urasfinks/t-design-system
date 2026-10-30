import {fileURLToPath} from 'node:url';
import path from 'node:path';
const projectRoot=fileURLToPath(new URL('../../',import.meta.url));
// Explain the effective source by asking Chromium's cascade, not by guessing
// from selector order. Probes run only in an isolated analysis browser.
export async function explainProperty({page,cdp,nodeId,property,sourceMap,headers}) {
  const read = async () => {
    const {object}=await cdp.send('DOM.resolveNode',{nodeId});
    const {result}=await cdp.send('Runtime.callFunctionOn',{objectId:object.objectId,functionDeclaration:`function(property) { getComputedStyle(this).getPropertyValue(property); for (const a of document.getAnimations()) { try { a.finish(); } catch {} } return getComputedStyle(this).getPropertyValue(property); }`,arguments:[{value:property}],returnByValue:true});
    await cdp.send('Runtime.releaseObject',{objectId:object.objectId});
    return result.value;
  };
  const value=await read();
  const matched=await cdp.send('CSS.getMatchedStylesForNode',{nodeId});
  const proposals=property.startsWith('--')?['__tds_source_probe__']:['rgb(1, 2, 3)','17px','.371','double','inline-grid','serif','none','initial'];
  const markers=await page.evaluate(({property,proposals})=>proposals.filter(v=>CSS.supports(property,v)),{property,proposals});
  const inherits=await page.evaluate(({property,markers})=>{
    const host=document.createElement('div');
    const shadow=host.attachShadow({mode:'closed'});
    const parent=document.createElement('div'),child=document.createElement('span');
    parent.style.all='initial';child.style.all='unset';parent.append(child);shadow.append(parent);document.body.append(host);
    try {
      const initial=getComputedStyle(child).getPropertyValue(property);
      return markers.some(marker=>{parent.style.setProperty(property,marker);return getComputedStyle(child).getPropertyValue(property)!==initial;});
    } finally {host.remove();}
  },{property,markers});
  const candidates=[];
  const styles=[matched.inlineStyle,...(matched.matchedCSSRules||[]).map(m=>m.rule.style),...(matched.inherited||[]).flatMap(p=>[p.inlineStyle,...p.matchedCSSRules.map(m=>m.rule.style)])].filter(Boolean);
  const shorthandNames=[...new Set(styles.flatMap(s=>s.shorthandEntries.map(e=>e.name)))];
  const longhands=new Map(await page.evaluate(({shorthandNames,property})=>shorthandNames.map(name=>{
    const style=document.createElement('i').style;
    style.setProperty(name,'initial');
    return [name,style.getPropertyValue(property)?[property]:[]];
  }),{shorthandNames,property}));
  const add=(style,rule,ancestor,matchingSelectors)=>{
    if(!style || ancestor>0&&!inherits)return;
    const declarations=style.cssProperties.filter(p=>!p.implicit&&!p.disabled&&p.parsedOk!==false&&(p.name===property||longhands.get(p.name)?.includes(property)||p.longhandProperties?.some(l=>l.name===property)));
    const authored=declarations.filter(p=>p.range);
    if(authored.length)declarations.splice(0,declarations.length,...authored);
    if(!declarations.length)return;
    const declaration=declarations.filter(p=>p.important).at(-1)||declarations.at(-1);
    const header=headers.get(style.styleSheetId);
    const pos=declaration.range||style.range;
    let source=header?.sourceURL||'inline/UA';
    if(source.startsWith('http://127.0.0.1:'))source=new URL(source).pathname.replace(/^\//,'');
    let line=pos?pos.startLine+1:null;
    if(sourceMap&&source.endsWith('dist/t-design-system.css')&&pos){
      const original=sourceMap.originalPositionFor({line:pos.startLine+1,column:pos.startColumn});
      if(original.source){source=original.source.startsWith('file:')?path.relative(projectRoot,fileURLToPath(original.source)):original.source;line=original.line;}
    }
    candidates.push({style,rule,ancestor,declaration,source,line,selector:rule?.selectorList?.text||'style attribute',origin:rule?.origin||'inline',important:!!declaration.important,specificity:rule?.selectorList?.selectors.filter((s,i)=>!matchingSelectors||matchingSelectors.includes(i)).map(s=>s.specificity),layers:rule?.layers?.map(l=>l.text),controlsValue:false});
  };
  add(matched.inlineStyle,null,0);
  for(const match of matched.matchedCSSRules||[])add(match.rule.style,match.rule,0,match.matchingSelectors);
  for(const [i,parent]of (matched.inherited||[]).entries()){
    add(parent.inlineStyle,null,i+1);
    for(const match of parent.matchedCSSRules||[])add(match.rule.style,match.rule,i+1,match.matchingSelectors);
  }
  // A browser-confirmed change identifies the controlling declaration block.
  // Restore every edit before trying another rule, including on failures.
  for(const candidate of candidates){
    const {style}=candidate;
    if(candidate.origin==='user-agent')continue;
    const inline=candidate.origin==='inline'&&!style.styleSheetId;
    if(!inline&&(!style.styleSheetId||!style.range||typeof style.cssText!=='string'))continue;
    for(const marker of markers){
      let edited,inlineOriginal,objectId;
      try {
        if(inline){
          objectId=(await cdp.send('DOM.resolveNode',{nodeId})).object.objectId;
          inlineOriginal=(await cdp.send('Runtime.callFunctionOn',{objectId,functionDeclaration:`function(depth,property,value,priority) { let el=this; while(depth--)el=el.parentElement; const before={present:el.hasAttribute('style'),text:el.getAttribute('style')};el.style.setProperty(property,value,priority);return before; }`,arguments:[{value:candidate.ancestor},{value:property},{value:marker},{value:candidate.important?'important':''}],returnByValue:true})).result.value;
        } else {
        const result=await cdp.send('CSS.setStyleTexts',{edits:[{styleSheetId:style.styleSheetId,range:style.range,text:style.cssText+`;${property}:${marker}${candidate.important?' !important':''};`}]});
        edited=result.styles[0];
        }
        const probe=await read();
        if(probe!==value)candidate.controlsValue=true;
      } finally {
        if(inlineOriginal){
          await cdp.send('Runtime.callFunctionOn',{objectId,functionDeclaration:`function(depth,before) { let el=this;while(depth--)el=el.parentElement;if(before.present)el.setAttribute('style',before.text);else el.removeAttribute('style'); }`,arguments:[{value:candidate.ancestor},{value:inlineOriginal}]});
        }
        if(objectId)await cdp.send('Runtime.releaseObject',{objectId});
        if(edited)await cdp.send('CSS.setStyleTexts',{edits:[{styleSheetId:style.styleSheetId,range:edited.range,text:style.cssText}]});
        await read();
      }
      if(candidate.controlsValue)break;
    }
  }
  const summarize=c=>({selector:c.selector,source:c.source,line:c.line,ancestor:c.ancestor,origin:c.origin,important:c.important,specificity:c.specificity,layers:c.layers,declaration:{name:c.declaration.name,value:c.declaration.value},controlsValue:c.controlsValue});
  const controlling=candidates.filter(c=>c.controlsValue);
  const dependencyContexts=controlling.flatMap(c=>[...c.declaration.value.matchAll(/var\(\s*(--[\w-]+)/g)].map(m=>({property:m[1],ancestor:c.ancestor})));
  const dependencies=[...new Set(controlling.flatMap(c=>[...c.declaration.value.matchAll(/var\(\s*(--[\w-]+)/g)].map(m=>m[1])))];
  const specificity=c=>(c.specificity||[]).reduce((max,s)=>{
    const next=[s?.a||0,s?.b||0,s?.c||0];
    for(let i=0;i<3;i++){if(next[i]>max[i])return next;if(next[i]<max[i])break;}return max;
  },[0,0,0]);
  const reason=c=>{
    const winner=controlling.find(w=>w.ancestor<=c.ancestor);
    if(!winner)return 'not-controlling-in-browser-probe; inspect context';
    if(winner.ancestor<c.ancestor)return 'nearer-element-declaration-before-inheritance';
    if(winner.important&&!c.important)return 'important-priority';
    if(winner.origin==='inline'&&c.origin!=='inline')return 'inline-style-priority';
    if(JSON.stringify(winner.layers)!==JSON.stringify(c.layers))return 'cascade-layer-priority; inspect layer metadata';
    const a=specificity(winner),b=specificity(c);
    for(let i=0;i<3;i++){if(a[i]>b[i])return 'selector-specificity';if(a[i]<b[i])break;}
    if(JSON.stringify(a)===JSON.stringify(b)&&winner.style.styleSheetId===c.style.styleSheetId&&winner.style.range?.startLine>c.style.range?.startLine)return 'later-source-order';
    return 'not-controlling-in-browser-probe; inspect context';
  };
  return {property,inherited:inherits,computed:value,dependencySemantics:'Syntactic var() references, including possibly inactive light-dark or fallback branches; not all references affect the final used value in this context.',
    status:controlling.length?'browser-confirmed-source-block':'unresolved-or-browser-default',controlling:controlling.map(summarize),overridden:candidates.filter(c=>!c.controlsValue).map(c=>({...summarize(c),reason:reason(c)})),dependencies,dependencyContexts};
}
