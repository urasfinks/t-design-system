import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
import { measureContrast } from './helpers/contrast.mjs';

const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
const failures = [];
let checks = 0;
const check = (name, pass, detail) => {
  checks++;
  console.log(`${pass ? '✓' : '✗'} ${name}${pass ? '' : `: ${JSON.stringify(detail)}`}`);
  if (!pass) failures.push(name);
};
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const css = await readFile('dist/t-design-system.css', 'utf8');
  await page.setContent(`<style>${css}</style><div class="tg-card">
    <p class="tg-text-muted">Вторичная информация</p>
    <p class="tg-help tg-help--error">Проверьте адрес</p>
    <a class="tg-link" href="#test">Открыть настройки</a>
    <input class="tg-input" placeholder="Ваше имя" aria-label="Имя">
    <textarea class="tg-textarea" aria-label="О себе"></textarea>
    <select class="tg-select" id="select" aria-label="Роль"><option>Дизайнер с длинным названием роли</option><option>Разработчик</option></select>
    <select class="tg-select" id="multiple-select" multiple aria-label="Несколько ролей"><option>Дизайнер</option></select>
    <select class="tg-select" id="list-select" size="3" aria-label="Список ролей"><option>Дизайнер</option></select>
    <button class="tg-btn tg-btn--primary">Продолжить</button>
    <div id="button-heights" class="tg-row">
      <button class="tg-btn tg-btn--sm">Компактная</button>
      <button class="tg-btn">Обычная</button>
      <button class="tg-btn tg-btn--lg">Крупная</button>
      <button class="tg-icon-btn" aria-label="Добавить">+</button>
      <button class="tg-btn tg-btn--pill">Капсула</button>
      <button class="tg-chip" aria-checked="true">Чип</button>
      <button class="tg-btn" disabled>Недоступна</button>
      <button class="tg-btn" aria-busy="true"><span class="tg-spinner" aria-hidden="true"></span>Загрузка</button>
    </div>
    <button class="tg-btn tg-btn--destructive">Удалить</button>
    <div class="tg-row"><button class="tg-icon-btn" aria-label="Добавить">+</button></div>
    <span class="tg-badge tg-badge--primary">8</span>
    <span class="tg-badge tg-badge--destructive">Ошибка</span>
    <span class="tg-avatar"><span class="tg-avatar__initials">АБ</span></span>
    <div class="tg-progress"><span class="tg-progress__bar" style="--progress:50%"></span></div>
    <button class="tg-switch" role="switch" aria-label="Уведомления" aria-checked="false"><span class="tg-switch__knob"></span></button>
    <div class="tg-transition is-hidden">Скрытая панель</div>
    <div class="tg-notice tg-notice--destructive tg-notice--with-icon"><svg class="tg-notice__icon" aria-hidden="true"></svg><div class="tg-notice__content"><strong class="tg-notice__title">Не удалось загрузить файл</strong><div class="tg-text-sm tg-text-muted">Проверьте соединение и попробуйте ещё раз.</div></div></div>
  </div>`);
  // Resolve modern CSS colors through canvas, then composite alpha through ancestors.
  const texts = ['.tg-text-muted', '.tg-help--error', '.tg-link', '.tg-btn--primary', '.tg-btn--destructive', '.tg-badge--primary', '.tg-badge--destructive', '.tg-avatar__initials'];
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    const select = await page.locator('#select').evaluate(el => {
      const style = getComputedStyle(el);
      return { appearance: style.appearance, image: style.backgroundImage, padding: parseFloat(style.paddingInlineEnd), size: style.backgroundSize, position: style.backgroundPosition };
    });
    check(`${theme}: select reserves space for its inset arrow`, select.appearance === 'none' && select.padding >= 40 && select.size === '20px 20px', select);
    check(`${theme}: select arrow follows the explicit theme`, select.image.includes(theme === 'light' ? '%23000' : '%23fff'), select);
    const notice = await page.locator('.tg-notice--destructive').evaluate(el => {
      const style = getComputedStyle(el);
      return { border: style.borderTopColor, title: getComputedStyle(el.querySelector('strong')).color, foreground: getComputedStyle(document.body).color };
    });
    check(`${theme}: error notice has no colored frame`, notice.border === 'rgba(0, 0, 0, 0)', notice);
    check(`${theme}: error notice uses the primary text color`, notice.title === notice.foreground, notice);
    const noticeIcon = await page.evaluate(measureContrast, { selector: '.tg-notice__icon' });
    check(`${theme}: error icon contrast ≥ 3`, noticeIcon.ratio >= 3, noticeIcon);
    for (const selector of ['.tg-notice__title', '.tg-notice__content .tg-text-muted']) {
      const value = await page.evaluate(measureContrast, { selector });
      check(`${theme}: ${selector} contrast ≥ 4.5`, value.ratio >= 4.5, value);
    }
    for (const selector of texts) {
      const value = await page.evaluate(measureContrast, { selector });
      check(`${theme}: ${selector} contrast ≥ 4.5`, value.ratio >= 4.5, value);
    }
    const placeholder = await page.evaluate(measureContrast, { selector: '.tg-input', pseudo: '::placeholder' });
    check(`${theme}: placeholder contrast ≥ 4.5`, placeholder.ratio >= 4.5, placeholder);
    const normalFieldBorder = await page.locator('.tg-textarea').evaluate(el => getComputedStyle(el).borderTopColor);
    check(`${theme}: idle switch has no contrasting outline`, await page.locator('.tg-switch').evaluate(el => getComputedStyle(el, '::before').borderTopColor === 'rgba(0, 0, 0, 0)'));
    await page.emulateMedia({ contrast: 'more' });
    const contrastFieldBorder = await page.locator('.tg-textarea').evaluate(el => getComputedStyle(el).borderTopColor);
    check(`${theme}: increased contrast strengthens field boundaries`, normalFieldBorder !== contrastFieldBorder, { normalFieldBorder, contrastFieldBorder });
    for (const selector of ['.tg-input', '.tg-textarea']) {
      await page.locator(selector).evaluate(el => {
        const style = getComputedStyle(el);
        const probe = document.createElement('span'); probe.id = 'border-probe';
        probe.style.color = style.borderTopColor; probe.style.backgroundColor = style.backgroundColor;
        el.parentElement.append(probe);
      });
      const edge = await page.evaluate(measureContrast, { selector: '#border-probe' });
      check(`${theme}: increased contrast ${selector} boundary ≥ 3`, edge.ratio >= 3, edge);
      await page.locator('#border-probe').evaluate(el => el.style.backgroundColor = 'transparent');
      const outside = await page.evaluate(measureContrast, { selector: '#border-probe' });
      check(`${theme}: increased contrast ${selector} boundary against outer surface ≥ 3`, outside.ratio >= 3, outside);
      await page.locator('#border-probe').evaluate(el => el.remove());
    }
    const progress = await page.evaluate(measureContrast, { selector: '.tg-progress' });
    check(`${theme}: progress fill contrast ≥ 3`, progress.ratio >= 3, progress);
    await page.locator('.tg-switch').evaluate(el => {
      const reference = document.createElement('span'); reference.id = 'switch-probe';
      reference.style.color = getComputedStyle(el, '::before').borderTopColor;
      el.parentElement.append(reference);
    });
    const switchEdge = await page.evaluate(measureContrast, { selector: '#switch-probe' });
    check(`${theme}: increased contrast switch boundary ≥ 3`, switchEdge.ratio >= 3, switchEdge);
    await page.locator('#switch-probe').evaluate(el => el.remove());
    await page.emulateMedia({ contrast: 'no-preference' });
    await page.locator('.tg-textarea').focus();
    const focused = await page.locator('.tg-textarea').evaluate(el => {
      const style = getComputedStyle(el);
      const probe = document.createElement('span');
      probe.style.color = 'var(--accent-soft)'; document.body.append(probe);
      const soft = getComputedStyle(probe).color; probe.remove();
      return { outline: style.outlineStyle, color: style.borderTopColor, shadow: style.boxShadow, soft };
    });
    check(`${theme}: focus uses the shared light accent ring without a second outline`, focused.outline === 'none' && focused.shadow === `${focused.soft} 0px 0px 0px 4px` && focused.color !== normalFieldBorder, focused);
    await page.locator('.tg-textarea').evaluate(el => { el.blur(); el.setAttribute('aria-invalid', 'true'); });
    const invalidBorder = await page.locator('.tg-textarea').evaluate(el => getComputedStyle(el).borderTopColor);
    check(`${theme}: invalid textarea keeps its error border`, invalidBorder !== normalFieldBorder, invalidBorder);
    await page.locator('.tg-textarea').evaluate(el => el.removeAttribute('aria-invalid'));
    for (const accent of ['#18745b', '#7151c7']) {
      await page.evaluate(color => {
        for (const role of ['--button-color', '--link-color', '--accent-text-color']) document.documentElement.style.setProperty(role, color);
      }, accent);
      for (const selector of ['.tg-link', '.tg-btn--primary', '.tg-badge--primary']) {
        const value = await page.evaluate(measureContrast, { selector });
        check(`${theme}: ${accent} ${selector} contrast ≥ 4.5`, value.ratio >= 4.5, value);
      }
      const value = await page.evaluate(measureContrast, { selector: '.tg-progress' });
      check(`${theme}: ${accent} progress contrast ≥ 3`, value.ratio >= 3, value);
    }
    await page.evaluate(() => {
      for (const role of ['--button-color', '--link-color', '--accent-text-color']) document.documentElement.style.removeProperty(role);
    });
  }
  await page.locator('#select').selectOption({ label: 'Разработчик' });
  check('custom arrow preserves native selection', await page.locator('#select').inputValue() === 'Разработчик');
  await page.locator('#select').evaluate(el => el.dir = 'rtl');
  check('RTL select moves arrow away from its text start', await page.locator('#select').evaluate(el => getComputedStyle(el).backgroundPosition.startsWith('12px')));
  for (const id of ['multiple-select', 'list-select']) {
    check(`${id}: listboxes have no dropdown arrow`, await page.locator(`#${id}`).evaluate(el => getComputedStyle(el).backgroundImage === 'none'));
  }
  await page.emulateMedia({ forcedColors: 'active' });
  check('forced colors restores the native select arrow', await page.locator('#select').evaluate(el => getComputedStyle(el).appearance === 'auto' && getComputedStyle(el).backgroundImage === 'none'));
  await page.emulateMedia({ forcedColors: 'none' });
  for (const rootSize of ['16px', '32px']) {
    await page.evaluate(size => document.documentElement.style.fontSize = size, rootSize);
    const heights = await page.locator('#button-heights > button').evaluateAll(elements => elements.map(el => el.getBoundingClientRect().height));
    check(`${rootSize}: text, icon, chip, loading and size variants have one height`, new Set(heights).size === 1 && heights[0] >= 44, heights);
  }
  await page.evaluate(() => document.documentElement.style.removeProperty('font-size'));
  const radii = await page.locator('.tg-btn--primary, .tg-input, .tg-icon-btn').evaluateAll(elements => elements.map(el => getComputedStyle(el).borderRadius));
  check('buttons, inputs and icon controls share geometry', new Set(radii).size === 1, radii);
  const icon = await page.locator('#button-heights .tg-icon-btn').boundingBox();
  check('row utilities retain a square icon target ≥44px', icon.width >= 44 && icon.width === icon.height, icon);
  const scale = await page.locator('.tg-transition').evaluate(el => getComputedStyle(el).transform);
  check('hidden content retains a physical scale', scale !== 'matrix(0, 0, 0, 0, 0, 0)', scale);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const motion = await page.locator('.tg-btn--primary').evaluate(el => getComputedStyle(el).transitionDuration);
  check('reduced motion disables all control transitions', motion.split(',').every(v => v.trim() === '0s'), motion);
  await mkdir('artifacts', { recursive: true });
  assert.deepEqual(failures, [], `${failures.length} design-system regressions`);
  console.log(`${checks} design-system checks passed.`);
} finally { await browser.close(); }
