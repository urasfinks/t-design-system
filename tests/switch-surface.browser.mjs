import assert from 'node:assert/strict';
import { openCatalog } from './helpers/catalog-page.mjs';
const { page, theme, close } = await openCatalog({ port: 4241 });
try {
  await page.evaluate(() => {
    const fixture = document.createElement('div'); fixture.id = 'switch-surface-test'; fixture.className = 'tg-list';
    fixture.innerHTML = '<div class="tg-list-item"><button type="button" class="tg-switch" role="switch" aria-checked="false" aria-label="Настройка"><span class="tg-switch__knob"></span></button></div>';
    document.body.append(fixture);
  });
  const results = {};
  for (const name of ['light', 'dark', 'ios-dark']) {
    await theme(name);
    results[name] = await page.evaluate(() => {
      const ctx = document.createElement('canvas').getContext('2d');
      const rgb = color => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3); };
      const surface = document.querySelector('#switch-surface-test');
      const control = surface.querySelector('.tg-switch');
      const panel = rgb(getComputedStyle(surface).backgroundColor), track = rgb(getComputedStyle(control, '::before').backgroundColor);
      const luminance = rgb => rgb.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
      const lightness = color => {
        const probe = document.createElement('span'); probe.style.color = `oklch(from ${color} l c h)`; document.body.append(probe);
        const value = Number(getComputedStyle(probe).color.match(/oklch\(\s*([\d.]+)/)[1]); probe.remove(); return value;
      };
      const panelL = lightness(getComputedStyle(surface).backgroundColor), trackL = lightness(getComputedStyle(control, '::before').backgroundColor);
      const [a, b] = [luminance(panel), luminance(track)].sort((a, b) => b - a);
      return { panel, track, ratio: (a + .05) / (b + .05), lightnessStep: trackL - panelL };
    });
  }
  for (const name of ['dark', 'ios-dark']) {
    assert.ok(results[name].lightnessStep > 0, `${name}: track is lighter than its panel`);
    assert.ok(Math.abs(results[name].lightnessStep + results.light.lightnessStep) < .001, `${name}: perceptual step mirrors the light reference`);
  }
  assert.deepEqual(results.light.track, [233, 233, 233], 'reference light switch is unchanged');
  console.log('Switch panel/track relations:', JSON.stringify(results));
} finally { await close(); }
