import assert from 'node:assert/strict';
import { openCatalog } from './helpers/catalog-page.mjs';
const { page, theme, close } = await openCatalog({ port: 4242 });
try {
  await page.evaluate(() => {
    const root = document.createElement('section'); root.id = 'color-system-test'; root.className = 'tg-card';
    root.innerHTML = '<div class="tg-card__body tg-col tg-gap-4"><input class="tg-input" aria-label="Поле"><div class="tg-search"><input class="tg-search__input" aria-label="Поиск"></div><div class="tg-input-group"><span class="tg-input-group__addon">https://</span><input class="tg-input-group__control" aria-label="Сайт"></div><button class="tg-btn tg-btn--secondary">Вторичная</button><div class="tg-tabs"><button class="tg-tab" aria-selected="true">Сегмент</button></div><div class="tg-menu"><button class="tg-menu__item" role="menuitemcheckbox" aria-checked="true">Выбранная строка</button></div><button class="tg-switch" role="switch" aria-checked="false" aria-label="Переключатель"><span class="tg-switch__knob"></span></button></div>';
    document.body.append(root);
  });
  let checks = 0;
  for (const name of ['light', 'dark', 'ios-dark']) {
    await theme(name);
    await page.mouse.move(0, 0);
    const sample = await page.evaluate(() => {
      const ctx = document.createElement('canvas').getContext('2d');
      const rgb = color => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data]; };
      const resolve = expression => { const el = document.createElement('span'); el.style.color = expression; document.body.append(el); const color = getComputedStyle(el).color; el.remove(); return color; };
      const L = color => Number(resolve(`oklch(from ${color} l c h)`).match(/oklch\(\s*([\d.]+)/)[1]);
      const token = name => resolve(`var(--${name})`);
      const panel = token('background-panel'), muted = token('background-muted'), base = token('background-main');
      const inversion = Number(getComputedStyle(document.documentElement).getPropertyValue('--color-inversion'));
      const consumers = ['.tg-input', '.tg-search', '.tg-input-group', '.tg-btn--secondary', '.tg-tabs', '.tg-menu__item'].map(selector => ({ selector, rgba: rgb(getComputedStyle(document.querySelector('#color-system-test ' + selector)).backgroundColor) }));
      consumers.push({ selector: '.tg-switch::before', rgba: rgb(getComputedStyle(document.querySelector('#color-system-test .tg-switch'), '::before').backgroundColor) });
      return { inversion, panelL: L(panel), baseL: L(base), mutedStep: L(muted) - L(panel), expectedMuted: rgb(muted), consumers };
    });
    assert.equal(sample.inversion, name === 'light' ? -1 : 1);
    assert.ok(Math.abs(sample.panelL - Math.min(1, Math.max(.215, sample.baseL + .06))) < .00001, `${name}: shared panel formula`);
    assert.ok(Math.abs(sample.mutedStep - sample.inversion * .065975) < .00001, `${name}: signed D surface step`);
    for (const consumer of sample.consumers) assert.deepEqual(consumer.rgba, sample.expectedMuted, `${name}: ${consumer.selector} inherits the same surface`);
    checks += 3 + sample.consumers.length;
    const button = page.locator('#color-system-test .tg-btn--secondary');
    await page.mouse.move(0, 0);
    const idle = await button.evaluate(el => getComputedStyle(el).backgroundColor);
    await button.hover();
    const hover = await button.evaluate(el => getComputedStyle(el).backgroundColor);
    const step = await page.evaluate(([idle, hover]) => {
      const L = value => { const el = document.createElement('span'); el.style.color = `oklch(from ${value} l c h)`; document.body.append(el); const number = Number(getComputedStyle(el).color.match(/oklch\(\s*([\d.]+)/)[1]); el.remove(); return number; };
      return L(hover) - L(idle);
    }, [idle, hover]);
    assert.ok(Math.abs(step - sample.inversion * .023861) < .00001, `${name}: common hover step`);
    checks++;
  }
  console.log(`${checks} color-formula checks: panel, D surface, all control aliases, theme inversion and hover.`);
} finally { await close(); }
