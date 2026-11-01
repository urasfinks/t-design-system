import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium, webkit } from 'playwright';
const engine = process.argv.includes('--webkit') ? 'webkit' : 'chromium';
const server = spawn(process.execPath, ['scripts/serve.mjs', '--port', '4193'], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
const browser = await ({ chromium, webkit }[engine]).launch();
const inspect = el => {
  const rgba = value => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = value; ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data];
  };
  let surface = el.parentElement;
  while (surface && getComputedStyle(surface).backgroundColor === 'rgba(0, 0, 0, 0)') surface = surface.parentElement;
  return { background: rgba(getComputedStyle(surface).backgroundColor), rings: [...el.querySelectorAll('.tg-avatar__initials, .tg-avatar__clip, .tg-avatar-group__more')].map(node => rgba(getComputedStyle(node).boxShadow.replace(/ 0px 0px 0px 2px$/, ''))) };
};
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await page.goto('http://127.0.0.1:4193/docs/#avatar-group');
  await page.waitForSelector('#avatars .example-code');
  await mkdir('artifacts/avatar-ring', { recursive: true });
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.getByLabel('Тема оформления', { exact: true }).selectOption(theme);
    for (const group of await page.locator('#avatars .tg-avatar-group').all()) {
      const { background, rings } = await group.evaluate(inspect);
      for (const ring of rings) assert.deepEqual(ring, background, `${theme}: catalog ring matches the actual table surface`);
    }
    await page.locator('#avatar-group').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `artifacts/avatar-ring/${engine}-${theme}.png` });
  }
  await page.goto('http://127.0.0.1:4193/docs/workspace.html');
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    const { background, rings } = await page.locator('.tg-avatar-group').evaluate(inspect);
    for (const ring of rings) assert.deepEqual(ring, background, `${theme}: unmodified group inherits its workspace card surface`);
  }
  const css = await readFile('dist/t-design-system.css', 'utf8');
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.setContent(`<html data-theme="${theme}"><style>${css}</style>${['main', 'panel', 'muted'].map(role => `<div style="padding:24px;background:var(--background-${role})"><div class="tg-avatar-group tg-avatar-group--on-${role}"><span class="tg-avatar"><span class="tg-avatar__initials">АК</span></span><span class="tg-avatar"><span class="tg-avatar__clip"><img alt="" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='gray'/%3E%3C/svg%3E"></span></span><span class="tg-avatar tg-avatar-group__more">+105988</span></div></div>`).join('')}</html>`);
    for (const group of await page.locator('.tg-avatar-group').all()) {
      const { background, rings } = await group.evaluate(inspect);
      for (const ring of rings) assert.deepEqual(ring, background, `${theme}: initials, image and counter share the surface ring`);
    }
    // Changing a role updates both the surface and every consumer without local fixes.
    await page.evaluate(() => document.documentElement.style.setProperty('--background-panel', 'var(--background-muted)'));
    const panel = await page.locator('.tg-avatar-group--on-panel').evaluate(inspect);
    for (const ring of panel.rings) assert.deepEqual(ring, panel.background, 'ring follows a changed background role');
    // The public custom-surface parameter remains available without a modifier.
    await page.locator('.tg-avatar-group--on-main').evaluate(el => { el.classList.remove('tg-avatar-group--on-main'); el.parentElement.style.setProperty('--avatar-group-ring', 'var(--background-main)'); });
    const inherited = await page.locator('.tg-avatar-group').first().evaluate(inspect);
    for (const ring of inherited.rings) assert.deepEqual(ring, inherited.background, 'custom ring still inherits from a containing surface');
  }
  console.log(`${engine}: catalog surfaces, 3 ring modifiers, initials/image/counter, role propagation and custom inheritance passed in 3 themes`);
} finally { await browser.close(); server.kill(); }
