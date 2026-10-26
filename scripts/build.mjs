import { compileAsync } from 'sass';
import feather from 'feather-icons';
import { mkdir, writeFile, copyFile, readdir, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
await mkdir(new URL('dist/', root), { recursive: true });
for (const [input, name] of [['index', 't-design-system'], ['telegram', 'telegram']]) {
  for (const style of ['expanded', 'compressed']) {
    const result = await compileAsync(fileURLToPath(new URL(`src/${input}.scss`, root)), { style, charset: false });
    const file = `${name}${style === 'compressed' ? '.min' : ''}.css`;
    await writeFile(new URL(`dist/${file}`, root), `/* t-design-system v0.1.0 */\n${result.css}\n`);
    console.log(`Built dist/${file} (${Buffer.byteLength(result.css)} bytes)`);
  }
}

await copyFile(new URL('src/telegram.mjs', root), new URL('dist/telegram.js', root));
console.log('Built dist/telegram.js (optional theme bridge)');

await copyFile(new URL('src/effects.mjs', root), new URL('dist/effects.js', root));
console.log('Built dist/effects.js (optional ripple helper)');

const ui = await readFile(new URL('src/ui.mjs', root), 'utf8');
await writeFile(new URL('dist/ui.js', root), ui.replaceAll("'./effects.mjs'", "'./effects.js'"));
console.log('Built dist/ui.js (optional ripple entry)');

// Ship independent SVG assets from the pinned upstream package, never a sprite.
const featherRoot = new URL('../node_modules/feather-icons/', import.meta.url);
const iconRoot = new URL('dist/icons/', root);
await mkdir(iconRoot, { recursive: true });
await rm(new URL('dist/icons.svg', root), { force: true });
const iconFiles = (await readdir(new URL('dist/icons/', featherRoot))).filter(file => file.endsWith('.svg')).sort();
for (const file of iconFiles) {
  const name = file.slice(0, -4);
  const svg = await readFile(new URL('dist/icons/' + file, featherRoot), 'utf8');
  // A root id allows external <use> to inherit currentColor without inline JS.
  await writeFile(new URL(file, iconRoot), svg.replace('<svg ', '<svg id="' + name + '" '));
}
await copyFile(new URL('LICENSE', featherRoot), new URL('dist/icons-LICENSE.txt', root));
console.log('Built dist/icons/ (' + iconFiles.length + ' independent Feather SVG files, MIT)');

const manifest = iconFiles.map(file => ({ name: file.slice(0, -4), tags: feather.icons[file.slice(0, -4)].tags })).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
await writeFile(new URL('dist/icons.json', root), JSON.stringify(manifest, null, 2) + '\n');
console.log('Built dist/icons.json (searchable Feather metadata)');
