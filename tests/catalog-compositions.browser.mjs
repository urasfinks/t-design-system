import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
const server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: '4177' }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); server.once('exit', code => reject(new Error(`Server exited: ${code}`))); });
let browser;
try {
  browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4177/docs/#compositions');
  assert.equal(await page.locator('#compositions').count(), 1, 'catalog exposes compositions');
  await page.waitForFunction(() => document.querySelectorAll('.icon-gallery svg use').length === 287);
  assert.equal(await page.locator('.icon-gallery svg use').count(), 287, 'all Feather icons are discoverable');
  assert.ok(await page.locator('[data-example]').evaluateAll(examples => examples.every(example => example.closest('.example-panel').querySelectorAll(':scope > details.example-code').length === 1)), 'code disclosures initialize exactly once');
  const contracts = await page.evaluate(async () => {
    const [navigation, demos, code] = await Promise.all([
      import('./catalog-navigation.js'), import('./catalog-demos.js'), import('./demo-code.js'),
    ]);
    const api = navigation.initCatalogNavigation();
    return [typeof api.navigate, typeof api.sync, typeof demos.initCatalogDemos, typeof code.initDemoCode];
  });
  assert.deepEqual(contracts, ['function', 'function', 'function', 'function'], 'focused catalog modules expose stable initialization contracts');
  assert.equal(await page.locator('.nav-link[href="#compositions"]').count(), 1);
  assert.equal(await page.locator('#section-select option[value="compositions"]').count(), 1);
  const frame = page.frameLocator('#composition-preview');
  await frame.locator('.tg-composer').waitFor();
  await page.getByLabel('Тема оформления', { exact: true }).selectOption('dark');
  await frame.locator('html[data-theme="dark"]').waitFor();
  await frame.getByRole('button', { name: 'Показать ответы' }).click();
  await frame.locator('#demo-replies').waitFor();
  await frame.getByRole('button', { name: 'Ответить Анне' }).click();
  await frame.locator('.tg-reply-preview').waitFor();
  await frame.getByLabel('Текст сообщения', { exact: true }).fill('<b>Обычный текст</b>');
  await frame.getByRole('button', { name: 'Отправить сообщение' }).click();
  await frame.getByText('<b>Обычный текст</b>', { exact: true }).waitFor();
  assert.equal(await frame.locator('#demo-messages b').count(), 0, 'message stays text');
  await frame.getByRole('button', { name: 'Открыть медиа' }).click();
  await frame.locator('dialog[open]').waitFor();
  assert.equal(await frame.locator('body').evaluate(el => getComputedStyle(el).overflow), 'hidden');
  await frame.getByRole('button', { name: 'Закрыть медиа' }).click();
  await mkdir('artifacts/catalog-compositions', { recursive: true });
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `catalog overflow ${width}`);
    assert.equal(await frame.locator('html').evaluate(el => el.scrollWidth > innerWidth), false, `demo overflow ${width}`);
    await page.locator('#compositions').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `artifacts/catalog-compositions/${width}.png` });
  }
  await page.goto('http://127.0.0.1:4177/docs/compositions.html');
  await page.getByLabel('Тема примера').selectOption('ios-dark');
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'ios-dark');
  const source = await readFile('docs/compositions.html', 'utf8');
  assert.doesNotMatch(source, /<style\b|\sstyle=|catalog\.css/);
  assert.deepEqual(errors, []);
  console.log('Catalog compositions pass: navigation, themes, demo interactions, escaping, responsive layouts and standalone page.');
} finally { await browser?.close(); server.kill(); }
