import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import feather from 'feather-icons';

test('individual SVG assets resolve every catalog reference and ship their license', async () => {
  const html = await readFile('docs/index.html', 'utf8');
  const symbols = Object.keys(feather.icons);
  assert.equal(new Set(symbols).size, symbols.length, 'unique symbol ids');
  for (const name of ['trash-2', 'rotate-cw', 'file-text', 'plus', 'x', 'alert-circle']) assert.ok(symbols.includes(name), name);
  for (const [, id] of html.matchAll(/<use href="\.\.\/dist\/icons\/([\w-]+)\.svg#[\w-]+"/g)) {
    assert.ok(symbols.includes(id), id);
    assert.match(await readFile('dist/icons/' + id + '.svg', 'utf8'), new RegExp('id="' + id + '"'));
  }
  // Icons come from one source; data graphics (progress rings, charts) draw their own shapes.
  const svgTags = [...html.matchAll(/<svg\b[^>]*>[\s\S]*?<\/svg>/g)].map(m => m[0]).filter(svg => /<svg\b[^>]*class="[^"]*tg-icon/.test(svg));
  assert.ok(svgTags.length > 10);
  assert.ok(svgTags.every(svg => svg.includes('<use href="../dist/icons/')), 'one icon source throughout the catalog');
  const closeButton = html.match(/<button[^>]*id="close-dialog"[\s\S]*?<\/button>/)?.[0];
  assert.match(closeButton, /icons\/x\.svg#x"/, 'close dialog uses a close symbol');

  assert.match(await readFile('dist/icons-LICENSE.txt', 'utf8'), /Permission is hereby granted/);
});

test('manifest includes every shipped Feather icon and its upstream search tags', async () => {
  const manifest = JSON.parse(await readFile('dist/icons.json', 'utf8'));
  assert.equal(manifest.length, 287);
  assert.deepEqual(manifest.map(icon => icon.name), Object.keys(feather.icons).sort());
  for (const icon of manifest) assert.deepEqual(icon.tags, feather.icons[icon.name].tags);
});


test('distributed UI entry imports its shipped effects module', async () => {
  const source = await readFile('dist/ui.js', 'utf8');
  assert.match(source, /['"]\.\/effects\.js['"]/);
  assert.doesNotMatch(source, /effects\.mjs/);
});
