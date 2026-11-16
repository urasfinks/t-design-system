import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { compileString } from 'sass';

const manifest = JSON.parse(await readFile('dist/modules/modules.json', 'utf8'));
const css = name => readFile(`dist/modules/${name}.css`, 'utf8');
const imports = names => names.flatMap(name => name === 'core' ? ['layers', 'tokens', 'themes', 'base'] : [name === 'utilities' ? name : `components/${name}`]).map(path => `@use '${path}';`).join('\n');

test('modular distribution concatenates to the full canonical CSS without duplicate core', async () => {
  const combined = (await Promise.all(manifest.modules.map(module => css(module.name)))).join('');
  const full = await readFile('dist/t-design-system.css', 'utf8');
  assert.equal(combined.trim(), full.replace(/^\/\*[^\n]+\*\/\n/, '').trim());
});

test('selected CSS modules preserve Sass output and transitive dependencies', async () => {
  for (const roots of [['navigation'], ['button-feedback'], ['bottom-panel'], ['patterns', 'forms', 'utilities'], ['carousel', 'feedback', 'avatar']]) {
    const selected = new Set(['core', ...roots]);
    const add = name => { for (const dep of manifest.modules.find(module => module.name === name).dependencies) { if (!selected.has(dep)) { selected.add(dep); add(dep); } } };
    roots.forEach(add);
    const names = manifest.modules.filter(module => selected.has(module.name)).map(module => module.name);
    const actual = (await Promise.all(names.map(css))).join('');
    const expected = compileString(imports(names), { loadPaths: ['src'], charset: false }).css;
    assert.equal(actual.trim(), expected.trim(), roots.join(', '));
  }
});

test('module exports resolve and unused families are absent from a minimal button bundle', async () => {
  for (const module of manifest.modules) assert.equal(require.resolve(`t-design-system/css/modules/${module.name}`), fileURLToPath(new URL(`../dist/${module.file}`, import.meta.url)));
  const minimal = await css('core') + await css('buttons');
  assert.match(minimal, /\.tg-btn\s*\{/);
  assert.doesNotMatch(minimal, /\.tg-calendar|\.tg-chart|\.tg-editor/);
  assert.ok(Buffer.byteLength(minimal) < 30000);
});
