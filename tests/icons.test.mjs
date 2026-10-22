import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('local icon sprite resolves every catalog reference and ships its license', async () => {
  const sprite = await readFile('dist/icons.svg', 'utf8');
  const html = await readFile('docs/index.html', 'utf8');
  const symbols = [...sprite.matchAll(/<symbol id="([\w-]+)"/g)].map(m => m[1]);
  assert.equal(new Set(symbols).size, symbols.length, 'unique symbol ids');
  for (const name of ['trash-2', 'rotate-cw', 'file-text', 'plus', 'x', 'alert-circle']) assert.ok(symbols.includes(name), name);
  for (const [, id] of html.matchAll(/<use href="\.\.\/dist\/icons\.svg#([\w-]+)"/g)) assert.ok(symbols.includes(id), id);
  const svgTags = [...html.matchAll(/<svg\b[^>]*>[\s\S]*?<\/svg>/g)].map(m => m[0]);
  assert.ok(svgTags.length > 10);
  assert.ok(svgTags.every(svg => svg.includes('<use href="../dist/icons.svg#')), 'one icon source throughout the catalog');
  const closeButton = html.match(/<button[^>]*id="close-dialog"[\s\S]*?<\/button>/)?.[0];
  assert.match(closeButton, /icons\.svg#x"/, 'close dialog uses a close symbol');
  assert.doesNotMatch(sprite, /<script|onload=|(?:href|src)=["']https?:/);
  assert.match(await readFile('dist/icons-LICENSE.txt', 'utf8'), /Permission is hereby granted/);
});
