import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
import { measureContrast } from './helpers/contrast.mjs';

const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const css = await readFile('dist/t-design-system.css', 'utf8');
  await page.setContent(`<style>${css}</style><div class="tg-card"><input class="tg-input" aria-label="Имя"><input class="tg-input" type="email" aria-label="Почта" aria-invalid="true"><textarea class="tg-textarea" aria-label="Описание"></textarea><select class="tg-select" aria-label="Роль"><option>Дизайнер</option></select><button class="tg-switch" role="switch" aria-label="Уведомления" aria-checked="false"><span class="tg-switch__knob"></span></button><label><input class="tg-check" type="checkbox">Запомнить</label><label><input class="tg-radio" type="radio" name="plan" checked>Первый</label><label><input class="tg-radio" type="radio" name="plan">Второй</label></div>`);
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    for (const label of ['Имя', 'Почта', 'Описание', 'Роль']) {
      const field = page.getByLabel(label, { exact: true });
      await field.focus();
      const state = await field.evaluate(el => {
        const resolve = token => {
          const probe = document.createElement('span');
          probe.style.color = `var(${token})`; document.body.append(probe);
          const color = getComputedStyle(probe).color; probe.remove(); return color;
        };
        const style = getComputedStyle(el);
        const invalid = el.getAttribute('aria-invalid') === 'true';
        return {
          background: style.backgroundColor, active: resolve('--field-bg-hover'),
          border: style.borderTopColor, main: resolve(invalid ? '--danger-main' : '--accent-main'),
          ring: style.boxShadow, soft: resolve(invalid ? '--danger-soft' : '--accent-soft'),
          outline: style.outlineStyle,
        };
      });
      assert.equal(state.background, state.active, `${theme}/${label}: active background`);
      assert.equal(state.border, state.main, `${theme}/${label}: matching border`);
      assert.equal(state.ring, `${state.soft} 0px 0px 0px 4px`, `${theme}/${label}: matching outer ring`);
      assert.equal(state.outline, 'none');
      await field.blur();
      assert.equal(await field.evaluate(el => getComputedStyle(el).boxShadow), 'none');
    }
    const switchBackground = await page.getByRole('switch').evaluate(el => ({
      track: getComputedStyle(el, '::before').backgroundColor,
      border: getComputedStyle(el, '::before').borderTopColor,
      input: getComputedStyle(document.querySelector('.tg-input')).backgroundColor,
    }));
    assert.equal(switchBackground.track, switchBackground.input, `${theme}: idle switch matches input background`);
    assert.equal(switchBackground.border, 'rgba(0, 0, 0, 0)');
    const toggle = page.getByRole('switch');
    await toggle.evaluate(el => el.setAttribute('aria-checked', 'true'));
    const active = await toggle.evaluate(el => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--accent-main)'; document.body.append(probe);
      const accent = getComputedStyle(probe).color; probe.remove();
      return { accent, track: getComputedStyle(el, '::before').backgroundColor,
        border: getComputedStyle(el, '::before').borderTopColor,
        radio: getComputedStyle(document.querySelector('.tg-radio:checked')).backgroundColor };
    });
    assert.equal(active.track, active.accent, `${theme}: checked switch uses main accent`);
    assert.equal(active.radio, active.accent, `${theme}: checked radio uses main accent`);
    await toggle.evaluate(el => el.setAttribute('aria-checked', 'false'));
    const radio = page.getByLabel('Второй', { exact: true });
    await page.getByLabel('Первый', { exact: true }).check();
    const idle = await radio.evaluate(el => ({
      appearance: getComputedStyle(el).appearance,
      border: getComputedStyle(el).borderTopColor,
      background: getComputedStyle(el).backgroundColor,
      inputBackground: getComputedStyle(document.querySelector('.tg-input')).backgroundColor,
    }));
    assert.equal(idle.appearance, 'none', `${theme}: radio has a themed idle surface`);
    assert.equal(idle.background, idle.inputBackground, `${theme}: idle radio matches input background`);
    const checkbox = page.getByLabel('Запомнить', { exact: true });
    await checkbox.uncheck();
    for (const [name, control] of [['radio', radio], ['checkbox', checkbox]]) {
      const border = await control.evaluate(el => {
        const probe = document.createElement('span');
        probe.style.color = 'var(--choice-border-color)'; document.body.append(probe);
        const expected = getComputedStyle(probe).color; probe.remove();
        const style = getComputedStyle(el);
        const target = document.createElement('span'); target.id = 'choice-border-probe';
        target.style.color = style.borderTopColor; target.style.backgroundColor = style.backgroundColor;
        el.parentElement.append(target);
        return { actual: style.borderTopColor, expected };
      });
      assert.equal(border.actual, border.expected, `${theme}: unchecked ${name} uses the semantic visible border`);
      const inside = await page.evaluate(measureContrast, { selector: '#choice-border-probe' });
      assert.ok(inside.ratio >= 3, `${theme}: unchecked ${name} border contrast against fill was ${inside.ratio}`);
      await page.locator('#choice-border-probe').evaluate(el => el.style.backgroundColor = 'transparent');
      const outside = await page.evaluate(measureContrast, { selector: '#choice-border-probe' });
      assert.ok(outside.ratio >= 3, `${theme}: unchecked ${name} border contrast against outer surface was ${outside.ratio}`);
      await page.locator('#choice-border-probe').evaluate(el => el.remove());
    }
    await checkbox.check();
    assert.ok(await checkbox.isChecked());
    assert.equal(await checkbox.evaluate(el => getComputedStyle(el, '::before').content), '""');
    await checkbox.evaluate(el => el.indeterminate = true);
    assert.equal(await checkbox.evaluate(el => getComputedStyle(el, '::before').height), '2px');
    await checkbox.evaluate(el => el.indeterminate = false);
    await page.getByLabel('Первый', { exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    assert.ok(await radio.isChecked());
    await radio.check();
    assert.ok(await radio.isChecked());
    assert.equal(await radio.evaluate(el => getComputedStyle(el).appearance), 'none');
  }
  for (const rootSize of [16, 32]) {
    await page.evaluate(size => document.documentElement.style.fontSize = `${size}px`, rootSize);
    const geometry = await page.evaluate(() => ({
      check: document.querySelector('.tg-check').getBoundingClientRect().height,
      radio: document.querySelector('.tg-radio').getBoundingClientRect().height,
      switch: parseFloat(getComputedStyle(document.querySelector('.tg-switch'), '::before').height),
      target: document.querySelector('.tg-switch').getBoundingClientRect().height,
      trackWidth: document.querySelector('.tg-switch').getBoundingClientRect().width,
      knob: document.querySelector('.tg-switch__knob').getBoundingClientRect().height,
    }));
    assert.equal(geometry.check, rootSize * 1.5);
    assert.equal(geometry.radio, geometry.check);
    assert.equal(geometry.switch, rootSize * 1.625);
    assert.ok(geometry.target >= 44);
    assert.ok(geometry.knob < geometry.switch && geometry.trackWidth > geometry.switch);
  }
  await page.emulateMedia({ forcedColors: 'active' });
  for (const selector of ['.tg-check', '.tg-radio']) {
    assert.equal(await page.locator(selector).first().evaluate(el => getComputedStyle(el).appearance), 'auto');
    assert.equal(await page.locator(selector).first().evaluate(el => getComputedStyle(el, '::before').content), 'none');
  }
  console.log('Choice geometry: checkbox/radio are 24px and switch is 26px for optical balance, including 200% text scaling.');
  console.log('Radio: idle backgrounds match input and native checked selection works in all three themes.');
  console.log('Field focus: active backgrounds, accent/error rings and blur cleanup passed in all three themes.');
} finally { await browser.close(); }
