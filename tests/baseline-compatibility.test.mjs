import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const fixture = 'tests/fixtures/cascade-baseline/';
const manifest = JSON.parse(readFileSync(fixture+'manifest.json', 'utf8'));
const digest = path => createHash('sha256').update(readFileSync(path)).digest('hex');

test('the visual reference is immutable while core source files may be refactored', () => {
  for (const [file, expected] of Object.entries(manifest.files)) {
    assert.equal(digest(fixture+file), expected, `visual reference ${file} must not be silently regenerated`);
  }
});
test('every section and example rule of the saved catalog is still in the catalog', () => {
  const saved = readFileSync(fixture+'index.html', 'utf8');
  const current = readFileSync('docs/index.html', 'utf8');
  const ids = [...saved.matchAll(/<section id="([^"]+)"/g)].map(match => match[1]);
  assert.ok(ids.length > 15, 'saved catalog lists its sections');
  for (const id of ids) assert.ok(current.includes(`<section id="${id}"`), `section #${id} is kept`);
  const rules = [...saved.matchAll(/<p class="example-rule">([\s\S]*?)<\/p>/g)].map(match => match[1]);
  assert.ok(rules.length > 30, 'saved catalog lists its example rules');
  for (const rule of rules) assert.ok(current.includes(rule), `example rule is kept: ${rule.slice(0, 60)}`);
});
test('catalog has no simultaneous locally hardcoded accent colors', () => {
  assert.doesNotMatch(readFileSync('docs/index.html','utf8'), /style="[^"]*--(?:button-color|accent-main):/);
});
