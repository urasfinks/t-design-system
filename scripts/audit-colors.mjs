import assert from 'node:assert/strict';
import { compileString } from 'sass';
import { readdir, readFile, writeFile } from 'node:fs/promises';
const clean = text => text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
const inventory = [];
const colorWords = new Set();
const files = (await Promise.all(['components', 'base', 'utilities'].map(async folder =>
  (await readdir(`src/${folder}`)).filter(name => name.endsWith('.scss')).map(name => `${folder}/${name}`)
))).flat().sort();
const componentFiles = files.filter(file => file.startsWith('components/')).length;
for (const file of files) {
  const source = clean(await readFile(`src/${file}`, 'utf8'));
  assert.doesNotMatch(source, /#[\da-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|color-mix|light-dark)\s*\(/i, `${file}: color literals or local calculations are prohibited`);
  assert.doesNotMatch(source, /(?<![-\w])(?:black|white)(?![-\w])/i, `${file}: use the neutral/mask roles`);
  assert.doesNotMatch(source, /--(?:color-inversion|surface-lightness-step|panel-lightness-rise|panel-lightness-floor|control-hover-brightness|semantic-readable-dark-weight|background-(?:main|raised|panel|muted(?:-derived)?)|(?:accent|danger)-(?:main|soft|strong|readable)|text-(?:main|secondary|muted)|field-bg)\s*:/, `${file}: global roles and coefficients belong to tokens`);
  for (const parameter of source.matchAll(/--control-hover-lightness-step:\s*([^;]+);/g)) assert.equal(parameter[1].trim(), '0', `${file}: only documented no-hover may opt out with zero`);
  for (const match of source.matchAll(/color\.([\w-]+)\(/g)) {
    const allowed = file === 'components/_control-states.scss' && match[1] === 'tone'
      || file === 'components/_pickers.scss' && ['spectrum', 'hue-spectrum'].includes(match[1]);
    assert.ok(allowed, `${file}: only the shared state engine and intrinsic picker may invoke color operators`);
  }
  for (const match of source.matchAll(/([\w-]+)\s*:\s*([^;{}]+);/g)) {
    if (!/^(?:color|background(?:-color|-image)?|border(?:-[\w-]+)?|outline(?:-[\w-]+)?|box-shadow|text-shadow|fill|stroke|mask(?:-image)?|--[\w-]*(?:bg|color|surface)[\w-]*)$/.test(match[1])) continue;
    for (const word of match[2].matchAll(/(?<![-\w$])([a-z][a-z0-9-]*)(?![-\w])/gi)) colorWords.add(word[1]);
    const roles = [...new Set([...match[2].matchAll(/var\((--[\w-]+)/g)].map(item => item[1]))];
    if (roles.length || match[2].includes('color.')) inventory.push({ file, property: match[1], roles, value: match[2].trim() });
  }
}
// Sass knows the complete CSS named-color vocabulary; reject names as well as hex/functions.
compileString('@use "sass:meta";\n' + [...colorWords].map(word => `@debug "#{meta.type-of(${word})}|${word}";`).join('\n'), {
  logger: { debug(message) { if (message.startsWith('color|')) assert.equal(message.slice(6).toLowerCase(), 'transparent', `named component color ${message.slice(6)} is prohibited`); }, warn() {} },
});
const themes = clean(await readFile('src/themes/_index.scss', 'utf8'));
const definitions = [...themes.matchAll(/(--[\w-]+)\s*:/g)].map(match => match[1]);
const allowedThemeRoles = new Set(['--color-inversion', '--select-arrow', '--select-arrow-hover', '--tds-bg', '--tds-button', '--tds-text', '--tds-destructive-text']);
assert.deepEqual([...new Set(definitions.filter(role => !allowedThemeRoles.has(role)))], [], 'themes supply source colors and direction only');
if (process.argv.includes('--write')) await writeFile('docs/color-consumers.json', JSON.stringify({ componentFiles, foundationFiles: files.length - componentFiles, declarations: inventory.length, consumers: inventory }, null, 2) + '\n');
console.log(`Color contract: ${componentFiles} component files + ${files.length - componentFiles} base/utility files; ${inventory.length} role consumers; no local paint formulas or theme-specific role overrides.`);
export { inventory };
