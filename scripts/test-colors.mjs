import { spawnSync } from 'node:child_process';
const files = ['color-system', 'switch-surface', 'control-hover', 'design-system', 'palette', 'semantic-borders', 'field-focus', 'composite-field-focus', 'option-selection', 'disclosure-hover', 'select-arrow', 'effects', 'spec-examples'];
for (const engine of [[], ['--webkit']]) {
  for (const file of files) {
    const result = spawnSync(process.execPath, [`tests/${file}.browser.mjs`, ...engine], { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}
console.log('Color contract and all color-related browser suites passed in Chromium and WebKit.');
