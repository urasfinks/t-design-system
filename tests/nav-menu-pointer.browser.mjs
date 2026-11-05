import assert from 'node:assert/strict';
import { openCatalog } from './helpers/catalog-page.mjs';
const { page, close } = await openCatalog({ port: 4211, reducedMotion: 'no-preference' });
try {
  const trigger = page.locator('[data-nav-menu] .tg-nav-menu__trigger').first();
  const next = page.locator('[data-nav-menu] .tg-nav-menu__trigger').nth(1);
  const isOpen = async el => await el.getAttribute('aria-expanded') === 'true';
  await trigger.hover(); await page.waitForTimeout(240);
  assert.ok(await isOpen(trigger), 'hover opens the panel');
  await trigger.click();
  assert.ok(await isOpen(trigger), 'first click confirms a hover-opened panel instead of closing it');
  await trigger.click(); assert.equal(await isOpen(trigger), false, 'next explicit click closes immediately, including during transition');
  await page.waitForTimeout(300); assert.equal(await isOpen(trigger), false, 'old hover timer cannot reopen a clicked-closed panel');
  await next.hover(); await page.waitForTimeout(240); await next.click();
  assert.ok(await isOpen(next)); assert.equal(await isOpen(trigger), false);
  await next.press('Escape'); assert.equal(await isOpen(next), false);
  await trigger.hover(); await page.waitForTimeout(240);
  await page.mouse.click(5, 5); await page.waitForTimeout(300);
  assert.equal(await isOpen(trigger), false, 'outside pointer closes and cancels pending hover work');
  await trigger.focus(); await trigger.press('Enter'); assert.ok(await isOpen(trigger), 'keyboard opens');
  await trigger.press('Space'); assert.equal(await isOpen(trigger), false, 'keyboard toggles closed');
  await page.setViewportSize({ width: 390, height: 844 });
  await trigger.click(); assert.ok(await isOpen(trigger), 'mobile first click opens');
  await trigger.click(); assert.equal(await isOpen(trigger), false, 'mobile second click closes');
  console.log('Navigation disclosure: hover→click confirmation, second click, Escape, outside, timer cancellation, keyboard and mobile passed.');
} finally { await close(); }
