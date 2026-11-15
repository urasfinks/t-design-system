import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

test('components leave font size and weight to the shared typography utilities', async () => {
  const directory = new URL('../src/components/', import.meta.url);
  for (const file of await readdir(directory)) {
    if (!file.endsWith('.scss')) continue;
    const source = await readFile(new URL(file, directory), 'utf8');
    assert.doesNotMatch(source, /\bfont-(size|weight)\s*:/, file);
    assert.doesNotMatch(source, /\bfont:\s*(?!inherit\s*;)[^\s]/, file);
  }
  const css = await readFile(new URL('../dist/t-design-system.css', import.meta.url), 'utf8');
  for (const size of ['xs', 'sm', 'base', 'lg', 'display']) {
    assert.match(css, new RegExp(`\\.tg-text-${size} \\{\\s*font-size:`));
  }
  assert.match(css, /\.tg-fw-bold \{\s*font-weight: var\(--fw-bold\)/);
});
