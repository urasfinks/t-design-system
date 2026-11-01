import assert from 'node:assert/strict';
import { openCatalog } from './helpers/catalog-page.mjs';

const { page, theme, close } = await openCatalog({ port: 4238 });
try {
  assert.equal(await page.locator('#demo-tags-suggest').count(), 1, 'catalog includes tags with suggestions');
  const teams = page.locator('#demo-teams');
  await teams.fill('Дизайн');
  await teams.press('ArrowDown');
  await teams.press('Enter');
  assert.equal(await page.locator('.tg-tag-input__tag[data-value="Дизайн"]').count(), 0);
  assert.match(await page.locator('#demo-teams-status').textContent(), /Удалено/, 'selected team announces removal');
  const field = page.locator('#demo-tags-suggest');
  const host = page.locator('#demo-tags-suggest-box');
  const list = page.locator('#demo-tags-suggest-list');
  const values = () => host.locator('input[type="hidden"]').evaluateAll(nodes => nodes.map(node => [node.name, node.value]));
  for (const name of ['light', 'dark', 'ios-dark']) {
    await page.reload();
    await theme(name);
    await field.fill('сро');
    assert.equal(await list.getByRole('option', { name: 'срочно', exact: true }).count(), 1);
    await field.press('ArrowDown');
    await field.press('Enter');
    assert.deepEqual(await values(), [['tags[]', 'срочно']]);
    await field.fill('  Свой тег  ');
    assert.equal(await list.getByRole('option', { name: 'Добавить „Свой тег“', exact: true }).count(), 1);
    await field.press('Enter');
    assert.deepEqual(await values(), [['tags[]', 'срочно'], ['tags[]', 'Свой тег']]);
    await field.fill('сВОЙ ТЕГ');
    assert.equal(await list.getByRole('option', { name: /Добавить/ }).count(), 0);
    await field.press('Enter');
    assert.equal((await values()).length, 2, 'duplicate Enter preserves existing tags');
    await field.fill('черновик');
    await field.dispatchEvent('keydown', { key: 'Enter', isComposing: true });
    assert.equal((await values()).length, 2, 'IME confirmation does not add a tag');
    await field.fill('ещё один');
    await list.getByRole('option', { name: 'Добавить „ещё один“', exact: true }).click();
    assert.equal((await values()).at(-1)[1], 'ещё один');
    const submitted = await host.evaluate(el => {
      const form = document.createElement('form');
      el.before(form); form.append(el);
      const entries = [...new FormData(form)];
      form.before(el); form.remove();
      return entries;
    });
    assert.deepEqual(submitted, [['tags[]', 'срочно'], ['tags[]', 'Свой тег'], ['tags[]', 'ещё один']]);
    await field.fill('отмена');
    await field.press('Escape');
    assert.equal(await field.getAttribute('aria-expanded'), 'false');
    assert.equal((await values()).length, 3);
    await field.fill('   ');
    assert.equal(await list.getByRole('option', { name: /Добавить/ }).count(), 0);
    await field.fill('<img src=x onerror=alert(1)>');
    await field.press('Enter');
    assert.equal((await values()).at(-1)[1], '<img src=x onerror=alert(1)>');
    assert.equal(await host.locator('img').count(), 0, 'custom text is never parsed as HTML');
    await field.fill('');
    for (let i = 0; i < 4; i++) await field.press('Backspace');
    assert.deepEqual(await values(), []);
    await field.fill('сро');
    await field.press('ArrowDown');
    await field.press('Enter');
    await field.fill('но');
    await list.getByRole('option', { name: 'Добавить „но“', exact: true }).click();
    await field.fill('план');
    const geometry = await host.evaluate(el => {
      const field = el.querySelector('input[role="combobox"]');
      const frame = el.querySelector('.tg-tag-input');
      const list = el.querySelector('[role="listbox"]');
      const a = frame.getBoundingClientRect(), b = list.getBoundingClientRect();
      return { frameWidth: a.width, listWidth: b.width, bottom: a.bottom, top: b.top,
        ring: getComputedStyle(frame).boxShadow, innerRing: getComputedStyle(field).boxShadow,
        gap: getComputedStyle(list).rowGap };
    });
    assert.ok(geometry.frameWidth > 0 && geometry.listWidth >= geometry.frameWidth - 1);
    assert.ok(geometry.top >= geometry.bottom - 1, 'suggestions open below the tag field');
    assert.notEqual(geometry.ring, 'none');
    assert.equal(geometry.innerRing, 'none');
    assert.equal(geometry.gap, '2px');
    await page.locator('.example-panel').filter({ has: host }).screenshot({ path: `/tmp/tds-creatable-tags-${name}${process.argv.includes('--webkit') ? '-webkit' : ''}.png` });
    await field.fill('');
    await field.press('Backspace');
    await field.press('Backspace');
  }
} finally { await close(); }
