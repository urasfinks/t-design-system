import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, writeFile, symlink, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolvePublicPath } from '../scripts/serve.mjs';

test('importing the server exposes its resolver without listening', () => {
  assert.equal(typeof resolvePublicPath, 'function');
});

test('public HTML, CSS and JavaScript assets resolve', async () => {
  for (const path of ['/docs/index.html', '/docs/catalog.js', '/dist/t-design-system.css', '/dist/telegram.js', '/dist/ui.js', '/dist/icons.json', '/docs/icon-browser.js']) {
    assert.equal(await resolvePublicPath(path), await realpath(new URL(`..${path}`, import.meta.url)));
  }
  assert.equal(await resolvePublicPath('/'), await resolvePublicPath('/docs/index.html'));
  assert.equal(await resolvePublicPath('/docs/'), await resolvePublicPath('/docs/index.html'));
});

test('encoded traversal cannot expose repository files', async () => {
  for (const file of ['package.json', 'README.md', '.git/config']) {
    for (const directory of ['docs', 'dist']) {
      for (const traversal of ['../', '%2e%2e%2f', '%2E%2E%2F', '..%2f']) {
        assert.equal(await resolvePublicPath(`/${directory}/${traversal}${file}`), null);
      }
    }
  }
});

test('unknown paths and malformed URI encodings are rejected', async () => {
  for (const path of ['/package.json', '/README.md', '/.git/config', '/src/telegram.mjs', '/docs-missing/index.html', '/docs/missing.html', '/docs/%', '/dist/%E0%A4%A', '/docs/%00index.html']) {
    assert.equal(await resolvePublicPath(path), null, path);
  }
});

test('symlinks must remain inside their public directory', async () => {
  const fixture = await mkdtemp(join(tmpdir(), 'tds-server-test-'));
  try {
    for (const directory of ['scripts', 'docs', 'dist', 'docs-other']) await mkdir(join(fixture, directory));
    await copyFile(new URL('../scripts/serve.mjs', import.meta.url), join(fixture, 'scripts/serve.mjs'));
    await writeFile(join(fixture, 'docs/index.html'), 'public');
    await writeFile(join(fixture, 'dist/sample.css'), 'public');
    await writeFile(join(fixture, 'outside.txt'), 'private fixture');
    await writeFile(join(fixture, 'docs-other/file.txt'), 'private fixture');
    await symlink('index.html', join(fixture, 'docs/inside.html'));
    await symlink('../outside.txt', join(fixture, 'docs/outside.txt'));
    await symlink('../docs-other/file.txt', join(fixture, 'docs/prefix.txt'));
    await symlink('../dist/sample.css', join(fixture, 'docs/cross.css'));
    const { resolvePublicPath: fixtureResolve } = await import(pathToFileURL(join(fixture, 'scripts/serve.mjs')).href);
    assert.equal(await fixtureResolve('/docs/inside.html'), await realpath(join(fixture, 'docs/index.html')));
    for (const path of ['/docs/outside.txt', '/docs/prefix.txt', '/docs/cross.css']) assert.equal(await fixtureResolve(path), null);
  } finally { await rm(fixture, { recursive: true, force: true }); }
});
