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
test('catalog markup stays unchanged during the cascade-only refactor', () => {
  assert.equal(digest('docs/index.html'), manifest.catalogHTMLSHA256);
});
test('catalog has no simultaneous locally hardcoded accent colors', () => {
  assert.doesNotMatch(readFileSync('docs/index.html','utf8'), /style="[^"]*--(?:button-color|accent-main):/);
});
