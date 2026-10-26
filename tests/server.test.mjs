import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, writeFile, symlink, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
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

test('CLI host and port override the development server defaults', async () => {
  const child = spawn(process.execPath, ['scripts/serve.mjs', '--host', '0.0.0.0', '--port', '0'], {
    env: { ...process.env, PORT: '43987' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Server did not start: ${output}`)), 5000);
      child.stdout.on('data', () => {
        if (output.includes('Catalog:')) { clearTimeout(timer); resolve(); }
      });
      child.once('error', reject);
      child.once('exit', code => { clearTimeout(timer); reject(new Error(`Server exited ${code}: ${output}`)); });
    });
    assert.match(output, /0\.0\.0\.0:\d+/);
    assert.doesNotMatch(output, /43987/);
    const { port } = output.match(/:(?<port>\d+)\/docs\//).groups;
    const response = await fetch(`http://127.0.0.1:${port}/`, { redirect: 'manual' });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), '/docs/');
  } finally {
    if (child.exitCode === null) {
      const exited = new Promise(resolve => child.once('exit', resolve));
      child.kill('SIGTERM');
      await exited;
    }
  }
});
