import assert from 'node:assert/strict';
import {openCatalog} from './helpers/catalog-page.mjs';
const {page,close}=await openCatalog({port:4219});
try {
  for(const selector of ['.example-body a.tg-effect-sheen','.example-body a.tg-card__link','.example-body a.tg-banner__action']) {
    const link=page.locator(selector).first();
    await link.scrollIntoViewIfNeeded();
    const before=await page.evaluate(()=>({y:scrollY,hash:location.hash}));
    await link.click();
    await page.waitForTimeout(100);
    const after=await page.evaluate(()=>({y:scrollY,hash:location.hash}));
    assert.deepEqual(after,before,`${selector}: demo click must not navigate or scroll the page`);
    await link.press('Enter');
    assert.deepEqual(await page.evaluate(()=>({y:scrollY,hash:location.hash})),before,`${selector}: keyboard activation must stay put`);
  }
  const local = await page.evaluate(async () => {
    const {scrollWithin}=await import('/docs/demo-navigation.js');
    const list=document.createElement('div');list.style.cssText='position:fixed;top:100px;left:250px;width:120px;height:80px;overflow:auto';
    list.innerHTML=Array.from({length:20},(_,i)=>`<div style="height:30px">${i}</div>`).join('');document.body.append(list);
    const before=scrollY;scrollWithin(list,list.lastElementChild);const result={before,after:scrollY,inner:list.scrollTop};list.remove();return result;
  });
  assert.equal(local.after,local.before,'local list scrolling must not move the document');
  assert.ok(local.inner>0,'local widget scrolling remains functional');
  await page.locator('.nav-link[href="#buttons"]').click();
  assert.equal(new URL(page.url()).hash,'#buttons','catalog navigation remains functional');
  console.log('Demo controls keep page position/URL; local widgets and catalog navigation remain functional.');
} finally {await close();}
