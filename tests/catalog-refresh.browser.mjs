import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
const server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: '4185' }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
let browser;
try {
  browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4185/docs/');
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.evaluate(() => scrollTo({ top: 2500, behavior: 'instant' }));
  const beforeThemeFocus = await page.evaluate(() => scrollY);
  const themeBounds = await page.getByLabel('Тема оформления', { exact: true }).boundingBox();
  // Click the visible sticky control without Playwright scrolling it into view first.
  await page.mouse.click(themeBounds.x + themeBounds.width / 2, themeBounds.y + themeBounds.height / 2);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => scrollY), beforeThemeFocus, 'opening the sticky theme select does not scroll the page');
  const spaceSwitch = page.getByRole('switch', { name: 'Уведомления проекта', exact: true });
  assert.equal(await spaceSwitch.getAttribute('aria-checked'), 'false');
  await spaceSwitch.click();
  assert.equal(await spaceSwitch.getAttribute('aria-checked'), 'true');
  await spaceSwitch.press('Space');
  assert.equal(await spaceSwitch.getAttribute('aria-checked'), 'false');
  const headings = await page.locator('.section-heading').evaluateAll(elements => elements.map(el =>
    el.children.length === 2 && el.children[0].tagName === 'DIV' &&
    el.children[0].children.length === 2 && el.children[0].children[0].tagName === 'H2' &&
    el.children[0].children[1].tagName === 'P' && el.children[1].matches('code.class-tag')
  ));
  assert.ok(headings.length > 0 && headings.every(Boolean), 'all section headings share title, description and class tag structure');
  assert.equal(await page.locator('h1, h2, h3, h4, h5, h6').first().evaluate(el => el.tagName), 'H1', 'the page title is the first heading; navigation groups are not headings');
  assert.equal(await page.locator('.sidebar [role="group"][aria-labelledby]').count(), 6, 'navigation groups keep an accessible name');
  const readingSizes = await page.locator('.section-heading p, .example-rule').evaluateAll(elements => [...new Set(elements.map(el => getComputedStyle(el).fontSize))]);
  assert.deepEqual(readingSizes, ['16px'], 'running catalog text is 16px');
  // Example forms are copied as reference markup, so they behave like real forms.
  const fields = await page.locator('main :is(input, select, textarea)').evaluateAll(elements => elements.map(el => ({ id: el.id, name: el.name, type: el.type, autocomplete: el.getAttribute('autocomplete'), spellcheck: el.getAttribute('spellcheck') })));
  assert.deepEqual(fields.filter(field => !field.name).map(field => field.id), [], 'every example field has a name');
  assert.ok(fields.filter(field => field.type === 'email').every(field => ['email', 'username'].includes(field.autocomplete) && field.spellcheck === 'false'), 'email fields autocomplete (sign-in ones as username) and skip spellcheck');
  assert.equal(await page.locator('main code').evaluateAll(codes => codes.filter(code => !code.closest('[translate="no"]')).length), 0, 'code tokens are excluded from machine translation');
  assert.equal(await page.locator('.example-meta').count(), 0, 'examples have no decorative metadata rows');
  const panelStructures = await page.locator('.example-panel').evaluateAll(panels => panels.map(panel =>
    [...panel.children].map(child => child.classList.contains('example-body') ? 'body' : child.classList.contains('example-rule') ? 'rule' : child.classList.contains('example-code') ? 'code' : child.tagName)
  ));
  for (const structure of panelStructures) {
    assert.ok(['body', 'body,code', 'body,rule', 'body,rule,code'].includes(structure.join(',')), `consistent example structure: ${structure}`);
  }
  // Every live component example explains the rule it demonstrates: example → rule → HTML.
  assert.ok(await page.locator('[data-example]').evaluateAll(examples => examples.every(example => {
    const order = [...example.closest('.example-panel').children].map(child => child.className.split(' ')[0]);
    return order.join(',') === 'example-body,example-rule,example-code';
  })), 'each live example is followed by its rule and then its HTML');
  assert.equal(await page.locator('#orders-example > .tg-list-item').count(), 5);
  assert.equal(await page.locator('iframe[src="bottom-panel.html"]').count(), 0);
  assert.equal(await page.locator('#orders-example').evaluate(el => getComputedStyle(el).position), 'static');
  assert.equal(await page.locator('#data #demo-orders-table, #data #demo-payments').count(), 2, 'catalog demonstrates a plain and an interactive data table');
  assert.equal(await page.locator('#demo-orders-table thead .tg-table__num').count(), 2, 'numeric columns include quantity and sum');
  assert.equal(await page.locator('#demo-orders-table tbody td.tg-table__num').count(), 4);
  assert.equal(await page.locator('#demo-orders-table tfoot .tg-table__num').count(), 1);
  assert.equal(await page.locator('#orders-example .tg-num').count(), 4, 'monetary list values use tabular numbers');
  assert.equal(await page.locator('#orders-example .tg-grow').first().evaluate(el => getComputedStyle(el).textAlign), 'start', 'ordinary labels remain start-aligned');
  const rowEdges = await page.locator('#demo-orders-table tbody tr').last().locator('th, td').evaluateAll(cells => cells.map(el => getComputedStyle(el).borderBottomWidth));
  assert.equal(new Set(rowEdges).size, 1, 'last body row retains a complete separator before totals');
  assert.notEqual(rowEdges[0], '0px');
  await page.locator('#lists .tg-disclosure:not(.tg-accordion *) .tg-disclosure__trigger').click();
  assert.equal(await page.locator('#lists .tg-disclosure:not(.tg-accordion *)').getAttribute('open'), '');
  await page.locator('#transition-toggle').click();
  await page.locator('#transition-demo').waitFor({ state: 'hidden' });
  assert.equal(await page.locator('#transition-demo').isVisible(), false);
  await page.locator('#transition-toggle').click();
  assert.equal(await page.locator('#transition-demo').isVisible(), true);
  assert.equal(await page.locator('#ripple-demo').count(), 0, 'standard feedback needs no separate demo');
  await page.locator('#demo-error-summary a').click();
  assert.equal(await page.locator('#demo-contact-email').evaluate(el => el === document.activeElement), true);
  await mkdir('artifacts/catalog-refresh', { recursive: true });
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.getByLabel('Тема оформления', { exact: true }).selectOption(theme);
    const backgrounds = await page.evaluate(() => {
      const probe = document.createElement('div');
      document.body.append(probe);
      const resolve = token => {
        probe.style.background = `var(${token})`;
        return getComputedStyle(probe).backgroundColor;
      };
      const panel = resolve('--background-panel');
      const main = resolve('--background-main');
      probe.remove();
      return {
        panel, main, page: getComputedStyle(document.body).backgroundColor,
        stages: [...document.querySelectorAll('.example-body, .preview-stage')].map(el => getComputedStyle(el).backgroundColor),
        tableHeaders: [...document.querySelectorAll('.tg-table thead th')].map(el => getComputedStyle(el).backgroundColor),
      };
    });
    assert.equal(backgrounds.page, backgrounds.panel, `${theme}: catalog page uses panel background`);
    for (const background of backgrounds.stages) {
      assert.equal(background, backgrounds.main, `${theme}: component previews use site background`);
    }
    for (const background of backgrounds.tableHeaders) {
      assert.equal(background, backgrounds.main, `${theme}: table headers match site background`);
    }
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `no horizontal page overflow at ${width}`);
      await page.locator('#data').evaluate(el => el.scrollIntoView({block: 'start', behavior: 'instant'}));
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.screenshot({ path: `artifacts/catalog-refresh/data-${theme}-${width}.png` });
    }
  }
  await page.locator('.nav-link[href="#icons"]').click();
  await page.locator('.nav-link[href="#icons"][aria-current="location"]').waitFor();
  await page.screenshot({ path: 'artifacts/catalog-refresh/icons.png' });
  // Alternative accents replace the shared root accent, including embedded examples.
  const frames = ['#composition-preview'];
  for (const accent of ['green', 'violet', 'blue']) {
    await page.getByLabel('Акцентный цвет').selectOption(accent);
    const expected = await page.locator('html').evaluate(el => getComputedStyle(el).getPropertyValue('--accent-main').trim());
    assert.equal(await page.locator('[style*="--button-color:"]:not(html)').count(), 0);
    for (const selector of frames) {
      const frame = page.frameLocator(selector);
      await page.locator(selector).evaluate(el => el.scrollIntoView());
      await frame.locator('html').waitFor({ state: 'attached' });
      await page.waitForFunction(({ selector, expected }) => {
        const root = document.querySelector(selector).contentDocument?.documentElement;
        return root && getComputedStyle(root).getPropertyValue('--accent-main').trim() === expected;
      }, { selector, expected });
    }
  }
  assert.deepEqual(errors, []);
  console.log('Refreshed catalog: native interaction, errors, transitions, responsive tables and themes passed.');
} finally { await browser?.close(); server.kill(); }
