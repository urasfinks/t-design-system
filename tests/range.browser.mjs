import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
try {
  const page = await browser.newPage();
  const css = await readFile('dist/t-design-system.css', 'utf8');
  const ui = (await readFile('dist/ui.js', 'utf8')).replace("import { initRipple } from './effects.js';", await readFile('dist/effects.js', 'utf8'));
  await page.setContent(`<style>${css}</style><form><input class="tg-range" type="range" min="10" max="40" value="20" step="5"><button type="reset">Reset</button></form>`);
  await page.addScriptTag({type:'module',content:ui});
  const range = page.locator('.tg-range');
  const progress = () => range.evaluate(el => parseFloat(el.style.getPropertyValue('--range-progress')));
  await page.waitForTimeout(50);
  assert.ok(Math.abs(await progress() - 100 / 3) < .01, 'initial accent fill reflects min/max/value');
  await range.focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await progress(),50,'keyboard updates fill');
  await range.evaluate(el => {el.value='40';el.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await progress(),100,'input updates fill to max');
  await page.getByRole('button').click();
  await page.waitForTimeout(50);
  assert.ok(Math.abs(await progress()-100/3)<.01,'reset restores fill');
  await page.evaluate(()=>document.body.insertAdjacentHTML('beforeend','<input id="dynamic" class="tg-range" type="range" value="75">'));
  await page.waitForTimeout(50);
  assert.equal(await page.locator('#dynamic').evaluate(el=>el.style.getPropertyValue('--range-progress')),'75%');
  console.log('Range accent fill: initial value, custom bounds, keyboard, input, reset and dynamic controls passed.');
} finally {await browser.close();}
