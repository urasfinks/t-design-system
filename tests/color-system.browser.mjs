import assert from 'node:assert/strict';
import { openCatalog } from './helpers/catalog-page.mjs';
const { page, theme, close } = await openCatalog({ port: 4242 });
try {
  await page.evaluate(() => {
    const root = document.createElement('section'); root.id = 'color-system-test'; root.className = 'tg-card';
    root.innerHTML = '<div class="tg-card__body tg-col tg-gap-4"><input class="tg-input" aria-label="Поле"><div class="tg-search"><input class="tg-search__input" aria-label="Поиск"></div><div class="tg-input-group"><span class="tg-input-group__addon">https://</span><input class="tg-input-group__control" aria-label="Сайт"></div><button class="tg-btn tg-btn--secondary">Вторичная</button><div class="tg-tabs"><button class="tg-tab" aria-selected="true">Сегмент</button></div><div class="tg-menu"><button class="tg-menu__item" role="menuitemcheckbox" aria-checked="true">Выбранная строка</button></div><button class="tg-switch" role="switch" aria-checked="false" aria-label="Переключатель"><span class="tg-switch__knob"></span></button><div class="tg-progress-row" id="color-system-row"><progress class="tg-progress-row__fill" max="100" value="50" aria-label="Доля"></progress><span>&nbsp;</span></div><div class="tg-progress" id="color-system-bar" role="progressbar" aria-label="Ход"><span class="tg-progress__bar" style="--progress:50%"></span></div></div>';
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
      const axes = color => resolve(`oklab(from ${color} l a b)`).match(/oklab\(([^)]+)\)/)[1].split(/\s+/).slice(1, 3).map(Number);
      const chromaticAxes = [base, panel, muted].map(axes);
      const inversion = Number(getComputedStyle(document.documentElement).getPropertyValue('--color-inversion'));
      const consumers = ['.tg-input', '.tg-search', '.tg-input-group', '.tg-btn--secondary', '.tg-tabs', '.tg-menu__item'].map(selector => ({ selector, rgba: rgb(getComputedStyle(document.querySelector('#color-system-test ' + selector)).backgroundColor) }));
      consumers.push({ selector: '.tg-switch::before', rgba: rgb(getComputedStyle(document.querySelector('#color-system-test .tg-switch'), '::before').backgroundColor) });
      return { inversion, chromaticAxes, panelL: L(panel), baseL: L(base), mutedStep: L(muted) - L(panel), expectedMuted: rgb(muted), consumers };
    });
    assert.equal(sample.inversion, name === 'light' ? -1 : 1);
    assert.ok(Math.abs(sample.panelL - Math.min(1, Math.max(.215, sample.baseL + .06))) < .00001, `${name}: shared panel formula`);
    assert.ok(Math.abs(sample.mutedStep - sample.inversion * .065975) < .00001, `${name}: signed D surface step`);
    const [baseAxes, panelAxes, mutedAxes] = sample.chromaticAxes;
    for (const axes of [panelAxes, mutedAxes]) {
      assert.ok(axes.every((axis, i) => Math.abs(axis - baseAxes[i]) < .00001), `${name}: panels preserve both chromatic axes`);
    }
    for (const consumer of sample.consumers) assert.deepEqual(consumer.rgba, sample.expectedMuted, `${name}: ${consumer.selector} inherits the same surface`);
    checks += 5 + sample.consumers.length;
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
    // Progress: the value is the accent itself on the muted track; a value under text is the
    // soft weight taken on that track. Painted pixels are compared, not only the tokens.
    const progress = await page.evaluate(() => {
      const ctx = document.createElement('canvas').getContext('2d');
      const rgb = color => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3); };
      const resolve = expression => { const el = document.createElement('span'); el.style.color = expression; document.body.append(el); const color = getComputedStyle(el).color; el.remove(); return color; };
      const L = color => Number(resolve(`oklch(from ${color} l c h)`).match(/oklch\(\s*([\d.]+)/)[1]);
      const soft = resolve('var(--progress-soft-color)'), track = resolve('var(--progress-track-color)');
      return {
        value: rgb(resolve('var(--progress-color)')), accent: rgb(resolve('var(--accent-main)')),
        danger: rgb(resolve('var(--progress-danger-color)')), dangerSource: rgb(resolve('var(--danger-main)')),
        soft: rgb(soft), softFormula: rgb(resolve('color-mix(in srgb, var(--accent-main) 12%, var(--background-muted))')),
        track: rgb(track), muted: rgb(resolve('var(--background-muted)')), softStep: L(soft) - L(track),
        bar: rgb(getComputedStyle(document.querySelector('#color-system-bar .tg-progress__bar')).backgroundColor),
      };
    });
    assert.deepEqual(progress.value, progress.accent, `${name}: progress value is the accent source`);
    assert.deepEqual(progress.bar, progress.accent, `${name}: the bar paints the progress role`);
    assert.deepEqual(progress.danger, progress.dangerSource, `${name}: destructive progress is the danger source`);
    assert.deepEqual(progress.track, progress.muted, `${name}: progress track is the muted surface`);
    assert.deepEqual(progress.soft, progress.softFormula, `${name}: soft progress fill is MIX(A, 12%, M)`);
    assert.ok(progress.softStep * sample.inversion > 0, `${name}: the soft fill steps from its track in the theme direction (${progress.softStep})`);
    const row = page.locator('#color-system-row');
    await row.scrollIntoViewIfNeeded();
    const rowBox = await row.boundingBox();
    const pixel = async share => {
      const png = await page.screenshot({ clip: { x: Math.round(rowBox.x + rowBox.width * share), y: Math.round(rowBox.y + 4), width: 1, height: 1 } });
      return page.evaluate(async data => { const img = new Image(); img.src = 'data:image/png;base64,' + data; await img.decode(); const c = document.createElement('canvas'); c.width = c.height = 1; const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0); return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3); }, png.toString('base64'));
    };
    const near = (a, b) => a.every((v, i) => Math.abs(v - b[i]) <= 1);
    const filled = await pixel(.25), empty = await pixel(.75);
    assert.ok(near(filled, progress.soft), `${name}: the row value paints the soft progress fill (${filled} vs ${progress.soft})`);
    assert.ok(near(empty, progress.track), `${name}: the row track paints the muted surface (${empty} vs ${progress.track})`);
    checks += 8;
  }
  console.log(`${checks} color-formula checks: panel, D surface, all control aliases, theme inversion, hover and progress roles.`);
} finally { await close(); }
