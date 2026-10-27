import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';

// Motion contract (Emil Kowalski's review rules): short press feedback, composited
// properties only, faster exits, no motion for keyboard commands, and reduced motion
// that removes travel but keeps the fades that explain what appeared.
const server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: '4193' }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
let browser;
const ms = value => value.split(',').map(part => part.trim().endsWith('ms') ? parseFloat(part) : parseFloat(part) * 1000);
try {
  const css = await readFile('dist/t-design-system.css', 'utf8');
  assert.doesNotMatch(css, /transition:\s*all/, 'no transition: all');
  assert.doesNotMatch(css, /ease-in(?!-out)/, 'no ease-in on UI motion');
  const hoverQueries = css.match(/@media[^{]*hover:\s*hover[^{]*\{/g) ?? [];
  assert.ok(hoverQueries.length > 0 && hoverQueries.every(query => query.includes('pointer: fine')), 'hover styles require a precise pointer');
  const wave = css.match(/@keyframes tg-ripple-wave\s*\{[\s\S]*?\n {2}\}/)?.[0] ?? '';
  assert.ok(wave.includes('transform') && !/inline-size|block-size|width|height/.test(wave), 'press wave animates transform, not layout size');

  browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
  await page.goto('http://127.0.0.1:4193/docs/');
  await page.evaluate(() => {
    const host = document.createElement('button');
    host.className = 'tg-btn tg-ripple'; host.id = 'ripple-probe'; host.textContent = 'Probe';
    document.body.append(host);
  });
  const press = await page.locator('#ripple-probe').evaluate(el => ['--ripple-duration', '--ring-duration', '--wash-duration'].map(name => getComputedStyle(el).getPropertyValue(name).trim()));
  assert.ok(press.every(value => ms(value)[0] <= 300), `press feedback ≤ 300ms: ${press}`);

  const toast = page.locator('#demo-toast');
  const hidden = await toast.evaluate(el => getComputedStyle(el).transitionDuration);
  await page.getByRole('button', { name: 'Показать уведомление' }).click();
  const shown = await toast.evaluate(el => [getComputedStyle(el).transitionDuration, getComputedStyle(el).transitionTimingFunction]);
  assert.ok(ms(hidden)[0] < ms(shown[0])[0], `toast leaves faster (${hidden}) than it arrives (${shown[0]})`);
  assert.match(shown[1], /cubic-bezier\(0\.23, 1, 0\.32, 1\)/, 'toast uses the shared easing curve');

  // Search: keyboard opening is instant, pointer opening may animate.
  await page.keyboard.press('Control+k');
  assert.equal(await page.locator('#catalog-search').evaluate(el => getComputedStyle(el).animationName), 'none', 'keyboard-opened search does not animate');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('#catalog-search').open);
  await page.getByRole('button', { name: 'Поиск по каталогу', exact: true }).first().click();
  assert.equal(await page.locator('#catalog-search').evaluate(el => getComputedStyle(el).animationName), 'catalog-search-in', 'pointer-opened search animates');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('#catalog-search').open);

  // Reduced motion: no travel, short fades for appearing layers.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Уведомление сверху' }).click();
  const snack = await page.locator('#demo-snackbar').evaluate(el => {
    const style = getComputedStyle(el);
    return Object.fromEntries(style.transitionProperty.split(',').map((name, i) => [name.trim(), style.transitionDuration.split(',')[i].trim()]));
  });
  assert.equal(snack.transform, '0s', 'reduced motion removes travel');
  assert.ok(ms(snack.opacity)[0] > 0 && ms(snack.opacity)[0] <= 150, `reduced motion keeps a short fade: ${snack.opacity}`);
  await page.getByRole('button', { name: 'Открыть диалог' }).click();
  assert.equal(await page.locator('#demo-dialog').evaluate(el => getComputedStyle(el).animationName), 'tg-fade-in', 'dialog fades in without moving');
  await page.keyboard.press('Escape');
  console.log('Motion: press ≤300ms on transform, faster exits, shared curve, instant keyboard search, precise-pointer hover and gentle reduced motion passed.');
} finally { await browser?.close(); server.kill(); }
