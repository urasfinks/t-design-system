import { compileAsync } from 'sass';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
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
