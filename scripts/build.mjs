import { compileAsync } from 'sass';
import { mkdir, writeFile, copyFile, readdir, readFile } from 'node:fs/promises';
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

// Vendor only the chosen Feather glyphs; no icon runtime or network at build time.
const iconRoot = new URL('src/icons/', root);
const symbols = [];
for (const file of (await readdir(iconRoot)).filter(file => file.endsWith('.svg')).sort()) {
  const svg = await readFile(new URL(file, iconRoot), 'utf8');
  const body = svg.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/)?.[1];
  if (!body) throw new Error(`Invalid icon: ${file}`);
  symbols.push(`<symbol id="${file.slice(0, -4)}" viewBox="0 0 24 24">${body.trim()}</symbol>`);
}
await writeFile(new URL('dist/icons.svg', root), `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols.join('\n')}\n</svg>\n`);
await copyFile(new URL('LICENSE', iconRoot), new URL('dist/icons-LICENSE.txt', root));
console.log(`Built dist/icons.svg (${symbols.length} Feather icons, MIT)`);
