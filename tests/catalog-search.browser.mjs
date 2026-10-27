import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium, webkit } from 'playwright';

const server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: '4186' }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); server.once('exit', code => reject(new Error(`Server exited: ${code}`))); });
let browser;
try {
  browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4186/docs/');
  assert.equal(await page.locator('main > section').count(), 14);
  assert.equal(await page.locator('.sidebar .nav-link').count(), 14);
  assert.equal(await page.locator('#section-select option').count(), 14);
  assert.equal(await page.locator('.nav-group-label').count(), 3);
  assert.equal(await page.locator('#section-select optgroup').count(), 3);

  const opener = page.getByRole('button', { name: 'Поиск по каталогу', exact: true }).first();
  const dialog = page.locator('#catalog-search');
  const input = page.locator('#catalog-search-input');
  await opener.click();
  assert.equal(await dialog.evaluate(el => el.open), true);
  assert.equal(await input.evaluate(el => el === document.activeElement), true);
  assert.equal(await page.locator('#catalog-search-results [role="option"]').count(), 14);
  assert.match(await page.locator('#catalog-search-status').textContent(), /14/);
  assert.equal(await page.locator('#catalog-search-results [role="option"]').first().locator('span').first().textContent(), 'Один язык для интерфейсов.', 'line breaks in headings become spaces');
  await page.keyboard.press('Control+K');
  assert.equal(await page.locator('dialog[open]').count(), 1, 'shortcut does not reopen an active modal');
  await input.fill('  КНОПКИ  ');
  assert.equal(await page.locator('#catalog-search-results [role="option"]').count(), 1);
  assert.match(await page.locator('#catalog-search-results').textContent(), /Кнопки/);
  await input.fill('.tg-switch');
  assert.match(await page.locator('#catalog-search-results').textContent(), /#forms/);
  await input.fill('--background-panel');
  assert.match(await page.locator('#catalog-search-results').textContent(), /темы|Токены/i);
  await input.fill('<script>не существует</script>');
  assert.equal(await page.locator('#catalog-search-results [role="option"]').count(), 0);
  assert.equal(await page.locator('#catalog-search script').count(), 0);
  assert.match(await page.locator('#catalog-search-status').textContent(), /ничего не найдено/i);
  await input.fill('я'.repeat(500));
  assert.equal(await page.locator('#catalog-search-results [role="option"]').count(), 0);

  await input.fill('формы');
  await input.press('ArrowDown');
  assert.match(await input.getAttribute('aria-activedescendant'), /catalog-search-result-/);
  await input.press('Enter');
  await page.waitForFunction(() => !document.querySelector('#catalog-search').open);
  assert.equal(await page.evaluate(() => location.hash), '#forms');
  assert.equal(await page.locator('#forms').evaluate(el => el === document.activeElement), true);
  assert.equal(await opener.evaluate(el => el === document.activeElement), false);

  await page.keyboard.press('/');
  assert.equal(await dialog.evaluate(el => el.open), true);
  await input.fill('формы');
  await input.press('ArrowDown');
  await input.press('Enter');
  await page.waitForFunction(() => !document.querySelector('#catalog-search').open);
  assert.equal(await page.evaluate(() => location.hash), '#forms', 'repeated current-hash search still navigates');
  await page.getByLabel('Электронная почта').focus();
  await page.keyboard.press('/');
  assert.equal(await dialog.evaluate(el => el.open), false, 'slash stays editable in form controls');
  assert.ok((await page.getByLabel('Электронная почта').inputValue()).includes('/'));
  await page.keyboard.press('Meta+K');
  assert.equal(await dialog.evaluate(el => el.open), true);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('#catalog-search').open);
  assert.equal(await page.getByLabel('Электронная почта').evaluate(el => el === document.activeElement), true, 'native Escape restores previous focus');

  await page.setViewportSize({ width: 320, height: 800 });
  await page.getByRole('button', { name: 'Поиск по каталогу', exact: true }).last().click();
  assert.ok(await input.evaluate(el => el.getBoundingClientRect().height >= 44));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'search supports 200% text');
  await input.fill('данные');
  assert.ok(await page.locator('#catalog-search-results [role="option"]').first().evaluate(el => el.getBoundingClientRect().height >= 44));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await dialog.evaluate(el => getComputedStyle(el).animationName), 'none');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('#catalog-search').open);

  const source = await readFile('docs/catalog-search.js', 'utf8');
  assert.doesNotMatch(source, /\.innerHTML\s*=|insertAdjacentHTML/);
  assert.deepEqual(errors, []);
  const staticPage = await browser.newPage({ javaScriptEnabled: false });
  await staticPage.goto('http://127.0.0.1:4186/docs/');
  assert.equal(await staticPage.locator('.sidebar .nav-link:visible').count(), 14);
  assert.equal(await staticPage.locator('#buttons [data-example]:visible').count(), 2);

  // Deep links must land on their section even though the icon gallery grows the page after load.
  for (const id of ['forms', 'data', 'effects']) {
    const deep = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await deep.goto(`http://127.0.0.1:4186/docs/#${id}`);
    await deep.waitForFunction(() => document.querySelectorAll('.icon-grid > *').length > 0);
    await deep.waitForTimeout(1200);
    const offset = await deep.evaluate(id => {
      const header = document.querySelector('.site-header, header').getBoundingClientRect().bottom;
      return document.getElementById(id).getBoundingClientRect().top - header;
    }, id);
    assert.ok(offset > -2 && offset < 120, `#${id} deep link lands below the header (offset ${Math.round(offset)}px)`);
    await deep.mouse.wheel(0, 600);
    await deep.waitForTimeout(400);
    const afterWheel = await deep.evaluate(() => scrollY);
    await deep.waitForTimeout(600);
    assert.equal(await deep.evaluate(() => scrollY), afterWheel, `#${id}: user scrolling is never overridden`);
    await deep.close();
  }
  console.log('Catalog search: grouped navigation, filtering, keyboard, focus, mobile, 200% text and no-JS fallback passed.');
} finally { await browser?.close(); server.kill(); }
