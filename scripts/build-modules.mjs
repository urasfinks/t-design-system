import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { compileStringAsync } from 'sass';

// Compile canonical prefixes so Sass emits shared foundations exactly once.
// A prefix mismatch fails the build instead of silently changing the cascade.
export async function buildModules(root) {
  const source = await readFile(new URL('src/index.scss', root), 'utf8');
  const paths = [...source.matchAll(/@use '([^']+)';/g)].map(match => match[1]);
  const foundations = ['layers', 'tokens', 'themes', 'base'];
  assert.deepEqual(paths.slice(0, foundations.length), foundations);
  const entries = [{ name: 'core', paths: foundations }, ...paths.slice(foundations.length).map(path => ({ name: path.replace('components/', ''), paths: [path] }))];
  const owners = new Map(entries.flatMap(entry => entry.paths.map(path => [path, entry.name])));
  const directory = new URL('dist/modules/', root);
  await mkdir(directory, { recursive: true });
  let input = '', previous = '';
  const manifest = { version: 1, modules: [] };
  for (const entry of entries) {
    input += entry.paths.map(path => `@use '${path}';\n`).join('');
    const result = await compileStringAsync(input, { loadPaths: [fileURLToPath(new URL('src/', root))], charset: false });
    assert.ok(result.css.startsWith(previous), `Non-additive CSS module: ${entry.name}`);
    const css = result.css.slice(previous.length);
    previous = result.css;
    const isolated = await compileStringAsync(entry.paths.map(path => `@use '${path}';`).join('\n'), { loadPaths: [fileURLToPath(new URL('src/', root))], charset: false });
    const dependencies = new Set(entry.name === 'core' ? [] : ['core']);
    for (const url of isolated.loadedUrls) {
      const relative = fileURLToPath(url).slice(fileURLToPath(new URL('src/', root)).length).replaceAll('\\', '/').replace(/(^|\/)_(?=[^/]+$)/, '$1').replace(/\.scss$/, '').replace(/\/index$/, '');
      const owner = owners.get(relative);
      if (owner && owner !== entry.name) dependencies.add(owner);
    }
    for (const name of dependencies) assert.ok(manifest.modules.some(module => module.name === name), `${entry.name} depends on later module ${name}`);
    await writeFile(new URL(`${entry.name}.css`, directory), css);
    manifest.modules.push({ name: entry.name, file: `modules/${entry.name}.css`, dependencies: [...dependencies], bytes: Buffer.byteLength(css) });
  }
  const full = await readFile(new URL('dist/t-design-system.css', root), 'utf8');
  assert.equal(full.replace(/^\/\*[^\n]+\*\/\n/, '').trim(), previous.trim());
  await writeFile(new URL('modules.json', directory), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Built dist/modules/ (${entries.length} modules, shared core emitted once)`);
}
