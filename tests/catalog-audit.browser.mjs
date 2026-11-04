import { openCatalog } from './helpers/catalog-page.mjs';
const { page, check, close } = await openCatalog({ port: 4194 });
try {
  check('HTML viewers use public TDS disclosures', await page.locator('details.example-code').evaluateAll(els => els.length > 100 && els.every(el => el.matches('.tg-disclosure') && el.querySelector(':scope > summary.tg-disclosure__trigger') && el.querySelector(':scope > .tg-disclosure__content > pre'))));
  await page.getByRole('button', { name: 'Поиск по каталогу', exact: true }).first().click();
  await page.locator('#catalog-search-input').fill('.tg-btn');
  check('exact class owner leads search', (await page.locator('#catalog-search-results a').first().getAttribute('href')) === '#buttons');
  check('canonical variants precede incidental uses', (await page.locator('#catalog-search-results a').nth(1).getAttribute('href')) === '#button-basics');
  for (const [query, id] of [['.tg-btn--primary', 'button-basics'], ['.tg-avatar-group', 'avatar-group']]) {
    await page.locator('#catalog-search-input').fill(query);
    check(`${query}: canonical variant leads search`, (await page.locator('#catalog-search-results a').first().getAttribute('href')) === `#${id}`);
  }
  await page.locator('#catalog-search-input').press('Escape');
  await page.waitForFunction(() => !document.querySelector('#catalog-search').open);
  await page.getByLabel('Электронная почта').focus();
  for (const key of ['Meta+K', 'Control+K']) {
    await page.keyboard.press(key);
    check(`${key} never interrupts editing`, !(await page.locator('#catalog-search').evaluate(el => el.open)));
  }
  for (const id of ['button-badges', 'buttons-overview', 'avatars-overview', 'inputs-overview']) {
    const rows = page.locator(`#${id} tbody > tr`);
    check(`${id}: every variant has minimal HTML`, await rows.evaluateAll(rows => rows.every(row => row.querySelector('td > details.example-code code'))));
  }
  const code = page.locator('#buttons-overview tbody > tr').first().locator('details.example-code code');
  const text = await code.textContent();
  check('minimal HTML excludes catalog structure', text.includes('tg-btn--primary') && !/data-catalog-|catalog-overview|example-body|<table/.test(text));
  const details = page.locator('#buttons-overview tbody > tr').first().locator('details.example-code');
  await details.locator('summary').click();
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.copiedHTML = value; } } }));
  await details.getByRole('button', { name: 'Скопировать HTML' }).click();
  check('copy writes only the minimal example', await page.evaluate(() => window.copiedHTML) === text);
  check('copy announces success', await details.getByRole('status').textContent() === 'HTML скопирован');
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('Clipboard unavailable'); }; });
  await details.getByRole('button', { name: 'Скопировать HTML' }).click();
  check('clipboard refusal selects HTML for manual copy', await page.evaluate(() => getSelection().toString()) === text);
  await details.locator('summary').click();
  check('full example remains', (await page.locator('#buttons-overview > details.example-code code').textContent()).includes('demo-split-trigger'));
  check('setup links README', await page.locator('#start a').evaluateAll(links => links.some(a => /README|readme/.test(a.href))));
  check('setup explains JS', /ui\.js/.test(await page.locator('#start').textContent()));
  check('class names stay intact when they fit the column', await page.locator('#button-basics + .class-tag > span').evaluateAll(tokens => tokens.length === 4 && tokens.every(token => token.getBoundingClientRect().height <= parseFloat(getComputedStyle(token).lineHeight) + 1)));
  const tagInput = page.locator('#demo-tags');
  await tagInput.scrollIntoViewIfNeeded();
  for (const size of [48, 64]) {
    await tagInput.evaluate((el, size) => el.closest('.tg-tag-input').style.setProperty('--control-h', `${size}px`), size);
    check(`${size}px: delete targets never cover adjacent field or tag`, await tagInput.evaluate(el => {
      const box = el.getBoundingClientRect();
      const fieldHit = document.elementFromPoint(box.left + 1, box.top + box.height / 2);
      const tags = [...el.closest('.tg-tag-input').querySelectorAll('.tg-tag-input__tag')];
      return fieldHit === el && tags.slice(1).every(tag => {
        const box = tag.getBoundingClientRect();
        const hit = document.elementFromPoint(box.left + 1, box.top + box.height / 2);
        return hit?.closest('.tg-tag-input__tag') === tag;
      });
    }));
  }
  await tagInput.evaluate(el => el.closest('.tg-tag-input').style.removeProperty('--control-h'));
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.getByLabel('Тема оформления', { exact: true }).selectOption(theme);
    const targets = await page.locator('#badges button.tg-badge, #pickers .tg-tag-input__remove').evaluateAll(els => els.map(el => {
      const pseudo = getComputedStyle(el, '::before');
      return { h: parseFloat(pseudo.height), w: parseFloat(pseudo.width) };
    }));
    check(`${theme}: compact actions expose 44px targets`, targets.length > 4 && targets.every(t => t.h >= 44 && t.w >= 44));
  }
  await page.evaluate(() => {
    const fixture = document.createElement('div');
    fixture.id = 'hit-test';
    fixture.style.cssText = 'position:fixed;inset:200px auto auto 280px;display:flex;gap:32px;align-items:center;padding:40px;z-index:9999;background:var(--background-main)';
    fixture.innerHTML = '<button class="tg-badge">Бейдж</button><button class="tg-badge" disabled>Недоступен</button><span class="tg-tag-input__tag">Тег<button class="tg-tag-input__remove" aria-label="Удалить тестовый тег">×</button></span>';
    for (const button of fixture.querySelectorAll('button')) button.addEventListener('click', () => button.dataset.clicks = String(Number(button.dataset.clicks || 0) + 1));
    document.body.append(fixture);
  });
  for (const targetSize of [48, 64]) {
    await page.evaluate(size => document.querySelector('#hit-test').style.setProperty('--control-h', `${size}px`), targetSize);
    for (const selector of ['#hit-test .tg-badge:not(:disabled)', '#hit-test .tg-tag-input__remove']) {
      const target = page.locator(selector);
      const point = await target.evaluate((el, size) => {
        const rect = el.getBoundingClientRect();
        const x = rect.x + rect.width / 2, y = rect.y + rect.height / 2 - size / 2 + 2;
        return { x, y, outside: y < rect.top, hits: el.contains(document.elementFromPoint(x, y)) };
      }, targetSize);
      check(`${targetSize}px: extended target receives hits outside visible ${selector}`, point.outside && point.hits);
      const before = Number(await target.getAttribute('data-clicks') || 0);
      await page.mouse.click(point.x, point.y);
      check('click reaches the intended compact action', Number(await target.getAttribute('data-clicks')) === before + 1);
    }
    const disabled = page.locator('#hit-test button:disabled');
    const box = await disabled.boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    check('disabled compact action stays disabled', await disabled.getAttribute('data-clicks') === null);
  }
  await page.locator('#hit-test').evaluate(el => el.remove());
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    check(`${width}px: page stays within viewport`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
} finally { await close(); }
