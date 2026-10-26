import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const reference = path => execFileSync('git', ['show', `678b61e:${path}`], { encoding: 'utf8' });
test('the original core stays identical to the approved 678b61e baseline', () => {
  const paths = execFileSync('git', ['ls-tree', '-r', '--name-only', '678b61e', 'src'], { encoding: 'utf8' }).trim().split('\n');
  for (const path of paths.filter(path => path !== 'src/index.scss')) {
    assert.equal(readFileSync(path, 'utf8'), reference(path), `${path} must keep the approved design`);
  }
});
test('catalog retains the original interface preview and its avatar stack', () => {
  const preview = html => html.match(/  <div class="preview-stage">[\s\S]*?\n<\/section>/)?.[0];
  assert.ok(preview(reference('docs/index.html')));
  assert.equal(preview(readFileSync('docs/index.html', 'utf8')), preview(reference('docs/index.html')));
});
test('catalog has no simultaneous locally hardcoded accent colors', () => {
  assert.doesNotMatch(readFileSync('docs/index.html', 'utf8'), /style="[^"]*--(?:button-color|accent-main):/);
});
