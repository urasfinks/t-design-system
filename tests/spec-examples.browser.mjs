// Every catalog example that implements a spec (data-spec on .example-body) is checked
// the same way, across themes and widths: it exists for every done spec in the registry,
// its visible text keeps 4.5:1 contrast, it never causes horizontal page scroll, and every
// interactive element inside it has an accessible name. A custom accent is applied too,
// so selected states follow --button-color.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
import { spawn } from 'node:child_process';

const engine = process.argv.includes('--webkit') ? webkit : chromium;
const { specs } = JSON.parse(await readFile('references/21st-dev-1000/implementation.json', 'utf8'));
const done = specs.filter(spec => spec.scope === 'in' && spec.state === 'done');
const server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: '4196' }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
const browser = await engine.launch();
let checks = 0;
const check = (label, condition, detail = '') => { assert.ok(condition, `${label}${detail ? `: ${detail}` : ''}`); checks++; };

// Runs in the page: audit every example body carrying data-spec.
function audit() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const rgba = color => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data].map((v, i) => i === 3 ? v / 255 : v); };
  const over = (fg, bg) => fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3])).concat(1);
  const lum = rgb => rgb.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
  const ratioOf = el => {
    const chain = []; for (let node = el; node; node = node.parentElement) chain.unshift(node);
    let bg = rgba(getComputedStyle(document.documentElement).backgroundColor);
    bg = over(bg, [255, 255, 255, 1]);
    let opacity = 1;
    for (const node of chain) {
      const style = getComputedStyle(node);
      if (style.backgroundImage !== 'none' && !style.backgroundImage.startsWith('url(data:image/svg')) return null; // gradients and images: not measurable here
      bg = over(rgba(style.backgroundColor), bg);
      opacity *= parseFloat(style.opacity);
    }
    const fgRaw = rgba(getComputedStyle(el).color);
    const fg = over([...fgRaw.slice(0, 3), fgRaw[3] * opacity], bg);
    const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
    return (a + .05) / (b + .05);
  };
  const named = el => {
    if (el.getAttribute('aria-label')?.trim()) return true;
    const by = el.getAttribute('aria-labelledby');
    if (by && by.split(/\s+/).some(id => document.getElementById(id)?.textContent.trim())) return true;
    if (el.labels?.length && [...el.labels].some(label => label.textContent.trim())) return true;
    if (el.closest('label')?.textContent.trim()) return true;
    if (el.getAttribute('title')?.trim()) return true;
    if (el.matches('input[type=submit],input[type=button]') && el.value) return true;
    const text = [...el.childNodes].map(node => node.nodeType === 3 ? node.textContent : (node.getAttribute?.('aria-hidden') === 'true' ? '' : node.matches?.('img') ? node.alt : node.textContent)).join('').trim();
    return Boolean(text);
  };
  const result = [];
  for (const body of document.querySelectorAll('.example-body[data-spec]')) {
    const ids = body.dataset.spec.split(/\s+/);
    const low = [], unnamed = [];
    for (const el of body.querySelectorAll('*')) {
      if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
      if (el.closest('[aria-hidden="true"], [disabled], [aria-disabled="true"], .tg-sr-only, [inert], [data-contrast-exempt]')) continue;
      const ownText = [...el.childNodes].some(node => node.nodeType === 3 && node.textContent.trim());
      if (ownText && !el.matches('input, textarea, select, option, svg, svg *')) {
        const ratio = ratioOf(el);
        if (ratio !== null && ratio < 4.5) low.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${el.textContent.trim().slice(0, 24)}" ${ratio.toFixed(2)}`);
      }
      if (el.matches('button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=menuitem], [role=menuitemcheckbox], [role=menuitemradio], [role=option], [role=checkbox], [role=radio], [role=switch], [role=slider], [role=spinbutton], [role=combobox], [role=gridcell][tabindex]') && !named(el)) {
        unnamed.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`);
      }
    }
    result.push({ ids, low, unnamed });
  }
  return { result, overflow: document.documentElement.scrollWidth - innerWidth };
}

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.setDefaultTimeout(60000);
  await page.goto('http://127.0.0.1:4196/docs/index.html', { timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  const present = new Set((await page.locator('.example-body[data-spec]').evaluateAll(nodes => nodes.flatMap(node => node.dataset.spec.split(/\s+/)))));
  for (const spec of done) check(`${spec.id} has a catalog example`, present.has(spec.id));
  for (const theme of ['light', 'dark', 'ios-dark']) {
    for (const accent of ['', '#7151c7']) {
      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(({ theme, accent }) => {
          document.documentElement.dataset.theme = theme;
          if (accent) document.documentElement.style.setProperty('--button-color', accent); else document.documentElement.style.removeProperty('--button-color');
        }, { theme, accent });
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const { result, overflow } = await page.evaluate(audit);
        check(`${theme}${accent} ${width}: no horizontal page scroll`, overflow <= 0, `${overflow}px`);
        for (const { ids, low, unnamed } of result) {
          check(`${theme}${accent} ${width}: ${ids.join(' ')} text contrast`, low.length === 0, low.join('; '));
          if (width === 1440 && !accent) check(`${theme}: ${ids.join(' ')} interactive names`, unnamed.length === 0, unnamed.join('; '));
        }
      }
    }
  }
  check('catalog runs without script errors', errors.length === 0, errors.join('\n'));
  console.log(`✓ ${checks} spec example checks passed in ${engine.name()} for ${done.length} done specs`);
} finally {
  await browser.close();
  server.kill();
}
