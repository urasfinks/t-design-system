// Shared setup for component wave tests: a local server, the catalog page and a counter.
import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import { spawn } from 'node:child_process';

export async function openCatalog({ port, path = '/docs/index.html', viewport = { width: 1440, height: 900 }, reducedMotion = 'reduce' }) {
  const engine = process.argv.includes('--webkit') ? webkit : chromium;
  const server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
  process.once('exit', () => server.kill());
  const browser = await engine.launch();
  const page = await browser.newPage({ viewport, reducedMotion });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.setDefaultTimeout(45000);
  await page.goto(`http://127.0.0.1:${port}${path}`, { timeout: 60000 });
  // networkidle occasionally never fires in headless Chromium with no request open; wait for
  // it briefly, then for what the checks actually need: fonts and decoded images.
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].filter(img => img.loading !== 'lazy').map(img => img.decode().catch(() => {}))]));
  let checks = 0;
  const check = (label, condition, detail = '') => { assert.ok(condition, `${label}${detail ? ` — ${detail}` : ''}`); checks++; console.log(`✓ ${label}`); };
  const css = (selector, property, pseudo = null) => page.locator(selector).first().evaluate((el, [p, ps]) => getComputedStyle(el, ps).getPropertyValue(p), [property, pseudo]);
  const px = async (selector, property, pseudo) => parseFloat(await css(selector, property, pseudo));
  const box = selector => page.locator(selector).first().evaluate(el => el.getBoundingClientRect().toJSON());
  const token = (property, value) => page.evaluate(([p, v]) => { const probe = document.createElement('div'); probe.style.setProperty(p, v); document.body.append(probe); const r = getComputedStyle(probe).getPropertyValue(p); const rect = probe.getBoundingClientRect(); probe.remove(); return { value: r, rect }; }, [property, value]);
  const length = async value => (await token('inline-size', value)).rect.width;
  const theme = name => page.evaluate(name => { if (name) document.documentElement.dataset.theme = name; else delete document.documentElement.dataset.theme; }, name);
  const rtl = on => page.evaluate(on => { document.documentElement.dir = on ? 'rtl' : ''; }, on);
  const focused = () => page.evaluate(() => document.activeElement?.id || document.activeElement?.textContent.trim().slice(0, 40));
  // The server is stopped even when a check fails: a stray server with an unread pipe hangs the next run.
  const close = async () => { try { check('no script errors', errors.length === 0, errors.join('\n')); } finally { await browser.close(); server.kill(); } return checks; };
  return { page, browser, check, css, px, box, length, theme, rtl, focused, errors, close, engine };
}
