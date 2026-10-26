import { spawnSync } from 'node:child_process';
for (const file of ['error-surface.browser', 'cascade-balance.browser', 'control-balance.browser', 'catalog-refresh.browser', 'standard-ripple.browser', 'patterns.browser', 'icon-browser.browser', 'bottom-panel.browser', 'catalog-compositions.browser', 'compositions.browser', 'browser', 'audit.browser', 'effects.browser', 'design-system.browser', 'palette.browser', 'field-focus.browser', 'badges.browser']) {
  const result = spawnSync(process.execPath, [`tests/${file}.mjs`, ...process.argv.slice(2)], {stdio: 'inherit'});
  if (result.error) { console.error(result.error); process.exit(1); }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
