import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read = path => readFile(new URL('../'+path, import.meta.url), 'utf8');

test('the main entry has no late patch module and base owns common control states', async () => {
  const entry = await read('src/index.scss');
  assert.doesNotMatch(entry, /@use 'components\/(?:extensions|control-hover)'/);
  assert.match(await read('src/base/_index.scss'), /@use '\.\.\/components\/control-states'/);
  const extensions = await read('src/components/_extensions.scss');
  assert.doesNotMatch(extensions, /@layer|\.(?:tg-)|--[\w-]+\s*:/);
});
test('buttons declare shared state parameters instead of repeated hover paint and transitions', async () => {
  const buttons = await read('src/components/_buttons.scss');
  assert.doesNotMatch(buttons, /:hover|transition\s*:/);
  assert.match(buttons, /background:\s*var\(--control-idle-bg\)/);
  assert.match(buttons, /--control-idle-bg:\s*var\(--action-bg\)/);
  assert.match(buttons, /--control-idle-bg:\s*var\(--action-danger-bg\)/);
});

test('the legacy control-hover entry retains reset, focus and visibility foundations', async () => {
  const {compileString} = await import('sass');
  const {css} = compileString('@use "components/control-hover";', {loadPaths:['src']});
  assert.match(css, /:where\(body\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /\[hidden\]/);
  assert.match(css, /aria-disabled/);
});
