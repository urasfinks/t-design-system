import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import * as sass from 'sass';

const css = async () => readFile(new URL('../dist/t-design-system.css', import.meta.url), 'utf8');
test('every original tg-* class name remains available', async () => {
  const original = JSON.parse(await readFile(new URL('fixtures/source-tg-classes.json', import.meta.url), 'utf8'));
  const current = new Set([...(await css()).matchAll(/\.(tg-[\w-]+)/g)].map(match => match[1]));
  assert.deepEqual(original.filter(name => !current.has(name)), []);
});
test('main stylesheet declares a predictable cascade without specificity escapes', async () => {
  const text = await css();
  assert.match(text, /@layer tds\.reset, tds\.tokens, tds\.themes, tds\.base, tds\.components, tds\.utilities/);
  assert.doesNotMatch(text, /!important|:host|\.cdk-|#btn-/);
});
test('all referenced core custom properties have defaults', async () => {
  const text = await css();
  const defined = new Set([...text.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
  const used = [...text.matchAll(/var\((--[\w-]+)\s*\)/g)].map(m => m[1]);
  assert.deepEqual([...new Set(used.filter(name => !defined.has(name)))], []);
});
test('distribution includes all stylesheets and module exports compile independently', async () => {
  for (const name of ['t-design-system', 'telegram']) {
    const expanded = await readFile(`dist/${name}.css`, 'utf8');
    const minified = await readFile(`dist/${name}.min.css`, 'utf8');
    assert.ok(minified.length < expanded.length);
    assert.ok(!expanded.includes('/Users/'));
  }
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  for (const path of Object.values(pkg.exports).filter(p => !p.includes('*'))) await access(path);
  for (const path of ['tokens', 'themes', 'base', 'utilities', 'components/icons', 'components/buttons', 'components/forms', 'components/surfaces', 'components/navigation', 'components/bottom-panel', 'components/patterns', 'components/feedback', 'components/avatar', 'components/upload', 'components/effects', 'components/extensions', 'components/control-hover']) {
    const result = sass.compileString(`@use "${path}";`, { loadPaths: ['src'] });
    assert.ok(result.css.length > 0, path);
  }
});

test('color mixing is confined to the eight derived palette variants', async () => {
  const source = await readFile('src/tokens/_index.scss', 'utf8');
  const allowed = new Set(['background-raised', 'background-muted-derived', 'accent-strong', 'accent-soft', 'text-secondary', 'text-muted', 'danger-strong', 'danger-soft']);
  const mixed = [...source.matchAll(/--([\w-]+):[^;]*color-mix\(/g)].map(match => match[1]);
  assert.deepEqual(new Set(mixed), allowed);
  const components = await import('node:fs/promises').then(fs => fs.readdir('src/components'));
  for (const file of components) assert.doesNotMatch(await readFile(`src/components/${file}`, 'utf8'), /color-mix\(/, file);
  assert.doesNotMatch(await readFile('docs/catalog.css', 'utf8'), /color-mix\(/);
});
