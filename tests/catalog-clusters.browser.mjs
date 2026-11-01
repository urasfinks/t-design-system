import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium, webkit } from 'playwright';
const map = JSON.parse(await readFile('docs/catalog-example-map.json', 'utf8'));
const engine = process.argv.includes('--webkit') ? 'webkit' : 'chromium';
const server = spawn(process.execPath, ['scripts/serve.mjs', '--port', '4199'], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
let browser;
try {
  browser = await ({ chromium, webkit }[engine]).launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4199/docs/');
  await page.waitForFunction(() => document.querySelector('#buttons .example-code'));
  assert.equal(await page.locator('#overview .preview-stage').count(), 1, 'original interface preview is back in the introduction');
  assert.equal(await page.locator('.app-preview').count(), 1, 'the preview is not duplicated among scenes');
  const ownership = await page.locator('[data-catalog-example]').evaluateAll(panels => panels.map(panel => {
    let previous = panel.previousElementSibling;
    while (previous && !previous.matches('[data-catalog-title]')) previous = previous.previousElementSibling;
    return { origin: panel.dataset.catalogExample, destination: panel.querySelector('[data-catalog-title]')?.id || previous?.id || panel.closest('section').id };
  }));
  assert.equal(ownership.length, map.length, 'all original examples are preserved');
  const families = await page.locator('main section[data-catalog-title]').evaluateAll(nodes => nodes.map(node => node.id));
  assert.equal(families[families.indexOf('buttons') + 1], 'forms', 'standard inputs follow buttons immediately');
  assert.equal(await page.locator('#inputs-overview [data-example]').count(), 1, 'standard inputs share one HTML example');
  assert.equal(await page.locator('#inputs-overview tbody > tr').count(), 15, 'native and compound input categories remain discoverable');
  for (const selector of ['input[type="number"]', 'input[type="password"]', 'input[type="date"]', 'input[type="time"]', 'input[type="color"]', 'input[type="file"]', 'textarea', 'select', 'input[type="checkbox"]', 'input[type="radio"]', '[role="switch"]', 'input[type="range"]']) {
    assert.ok(await page.locator(`#inputs-overview ${selector}`).count() > 0, `${selector} is in the standard overview`);
  }
  assert.equal(await page.locator('#buttons > .example-panel').count(), 1, 'buttons share one overview block');
  assert.equal(await page.locator('#buttons [data-example]').count(), 1, 'buttons have one HTML example');
  assert.equal(await page.locator('#buttons .example-code').count(), 1, 'buttons have one HTML disclosure');
  const buttonHTML = await page.locator('#buttons .example-code code').textContent();
  assert.ok(buttonHTML.includes('demo-async-save') && buttonHTML.includes('demo-split-trigger'), 'the shared HTML includes interactive variants');
  assert.equal(await page.locator('#buttons-overview tbody > tr').count(), 10, 'all ten button categories remain');
  assert.equal(await page.locator('.section-heading').first().evaluate(el => getComputedStyle(el).paddingTop), '0px', 'heading does not double the family spacing');
  assert.ok(await page.locator('.catalog-cluster').first().evaluate(el => parseFloat(getComputedStyle(el).paddingTop) > 0), 'clusters own their outer spacing');
  for (const entry of map) {
    assert.deepEqual(ownership.find(item => item.origin === `${entry.source}:${entry.index}`), { origin: `${entry.source}:${entry.index}`, destination: entry.destination });
  }
  const ids = await page.locator('[id]').evaluateAll(nodes => nodes.map(node => node.id));
  assert.equal(ids.length, new Set(ids).size, 'every id remains unique');
  assert.equal(await page.locator('#buttons > .example-panel .tg-avatar, #buttons > .example-panel .tg-chip, #buttons > .example-panel .tg-tabs, #buttons > .example-panel .tg-list-item').count(), 0, 'unrelated families are removed from buttons');
  assert.equal(await page.locator('#avatars > .example-panel').count(), 1, 'avatars share one overview block');
  assert.equal(await page.locator('#avatars [data-example]').count(), 1, 'avatars have one HTML example');
  assert.equal(await page.locator('#avatars .example-code').count(), 1, 'avatars have one HTML disclosure');
  assert.equal(await page.locator('#avatars-overview tbody > tr').count(), 5, 'all five avatar categories remain');
  assert.equal(await page.locator('#avatars .tg-avatar-group').count(), 2, 'both avatar groups remain with avatars');
  assert.ok(await page.locator('#surfaces .tg-card--featured').count() > 0, 'featured cards stay in the card family');
  assert.equal(await page.locator('#media-selection + .example-panel .tg-selection-box').count(), 1, 'image selection has its own subsection');
  assert.equal(await page.locator('#badges #button-badges').count(), 1, 'badge overview has its own family and keeps its old anchor');
  assert.equal(await page.locator('#compositions #demo-payments, #compositions #demo-editor, #compositions #space-switch-example').count(), 3, 'mixed scenes come after families');
  await mkdir('artifacts/catalog-clusters', { recursive: true });
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.getByLabel('Тема оформления', { exact: true }).selectOption(theme);
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const id of ['overview', 'badges', 'buttons', 'forms', 'avatars', 'surfaces', 'compositions']) {
        if (id === 'buttons') {
          assert.ok(await page.locator('#primary-demo').evaluate(button => {
            const range = document.createRange();
            range.selectNodeContents(button.firstChild);
            return range.getBoundingClientRect().height <= parseFloat(getComputedStyle(button).lineHeight) + 1;
          }), 'overview leaves enough room for the primary label on one line');
        }
        await page.evaluate(id => document.getElementById(id).scrollIntoView({ block: 'start', behavior: 'instant' }), id);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${theme}/${width}/${id}: viewport does not overflow`);
        await page.screenshot({ path: `artifacts/catalog-clusters/${engine}-${theme}-${width}-${id}.png` });
      }
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('#demo-name').fill('Анна');
  await page.locator('#demo-bio').fill('Проверка многострочного ввода');
  await page.locator('#demo-role').selectOption({ label: 'Разработчик' });
  await page.locator('#inputs-overview input[name="notify"][value="comments"]').check();
  await page.locator('#inputs-overview input[name="plan"][value="team"]').check();
  const nativeSwitch = page.locator('#inputs-overview button[aria-labelledby="notifications-label"]');
  await nativeSwitch.click();
  assert.equal(await nativeSwitch.getAttribute('aria-checked'), 'true');
  await nativeSwitch.press('Space');
  assert.equal(await nativeSwitch.getAttribute('aria-checked'), 'false');
  const range = page.locator('#demo-range');
  const previousRange = Number(await range.inputValue());
  await range.focus();
  await range.press('ArrowRight');
  assert.ok(Number(await range.inputValue()) > previousRange, 'native range keeps keyboard input');
  await page.locator('#input-number-demo').fill('7');
  assert.ok(await page.locator('#input-number-demo').evaluate(el => el.checkValidity()));
  await page.locator('#demo-birth').fill('2026-11-01');
  await page.locator('#demo-meet').fill('15:30');
  await page.locator('#input-file-demo').setInputFiles({ name: 'report.txt', mimeType: 'text/plain', buffer: Buffer.from('test') });
  assert.equal(await page.locator('#input-file-demo').evaluate(el => el.files.length), 1);
  await page.locator('.nav-link[href="#icons"]').click();
  await page.waitForFunction(() => document.querySelector('.nav-link[href="#icons"]')?.getAttribute('aria-current') === 'location');
  // A subsection is a real navigation/search target, with its parent visible in the sidebar.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.keyboard.press('Control+k');
  await page.locator('#catalog-search-input').fill('Большое число участников');
  await page.locator('#catalog-search-input').press('Enter');
  assert.equal(await page.evaluate(() => location.hash), '#avatar-large-group');
  assert.equal(await page.locator('#avatar-large-group').evaluate(el => el === document.activeElement), true);
  assert.equal(await page.locator('.nav-link[href="#avatar-large-group"]').evaluate(el => el.closest('details').open), true);
  const counter = page.locator('#avatars [title="Ещё участников: 105988"]');
  await counter.locator('xpath=ancestor::div[contains(@class,"example-panel")]').locator('summary').click();
  assert.ok((await counter.locator('xpath=ancestor::div[contains(@class,"example-panel")]').locator('.example-code code').textContent()).includes('+105988'));
  assert.deepEqual(errors, []);
  console.log(`${engine}: ${map.length} preserved panels, family ownership, nested navigation, HTML, 3 themes, 320/1440px passed`);
} finally { await browser?.close(); server.kill(); }
