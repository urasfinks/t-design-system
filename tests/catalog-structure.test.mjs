import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { catalogEntries, renderCatalogNavigation } from '../docs/catalog-structure.js';
const html = readFileSync('docs/index.html', 'utf8');

test('catalog families and subsections have a unique, ordered navigation tree', () => {
  const entries = catalogEntries(html);
  assert.ok(entries.length > 60, 'families expose semantic subsections');
  assert.equal(entries.at(-1).id, 'icons', 'icon search is the last catalog section');
  const families = entries.filter(entry => !entry.parent).map(entry => entry.id);
  assert.equal(families[families.indexOf('buttons') + 1], 'forms', 'standard inputs immediately follow buttons');
  assert.equal(new Set(entries.map(entry => entry.id)).size, entries.length);
  const seen = new Set();
  for (const entry of entries) {
    if (entry.parent) assert.ok(seen.has(entry.parent), `${entry.id}: parent appears first`);
    seen.add(entry.id);
  }
  for (const id of ['buttons', 'badges', 'avatars', 'surfaces', 'forms', 'compositions']) assert.ok(seen.has(id), `${id} family is discoverable`);
  const scenes = entries.findIndex(entry => entry.id === 'compositions');
  assert.ok(entries.slice(scenes).every(entry => ['Сцены и экраны', 'Эффекты и интеграция'].includes(entry.group)), 'component families precede mixed scenes');
});

test('desktop and mobile navigation are generated from the catalog metadata', () => {
  const { sidebar, mobile } = renderCatalogNavigation(catalogEntries(html));
  assert.ok(html.includes(`<!-- catalog-sidebar:start -->\n${sidebar}\n<!-- catalog-sidebar:end -->`));
  assert.ok(html.includes(`<!-- catalog-mobile:start -->\n${mobile}\n<!-- catalog-mobile:end -->`));
});

test('navigation metadata is escaped as text, including quotes and markup', () => {
  const result = renderCatalogNavigation([{ id: 'test', title: 'A & "B" <C>', group: 'X & Y', parent: '' }]);
  assert.ok(result.sidebar.includes('A &amp; &quot;B&quot; &lt;C&gt;'));
  assert.ok(!result.sidebar.includes('<C>'));
});
