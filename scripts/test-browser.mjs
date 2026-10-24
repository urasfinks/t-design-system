import { spawnSync } from 'node:child_process';
for (const file of ['bottom-panel.browser', 'catalog-compositions.browser', 'compositions.browser', 'browser', 'audit.browser', 'effects.browser', 'design-system.browser', 'palette.browser', 'field-focus.browser', 'badges.browser', 'avatar-stack.browser']) {
  const result = spawnSync(process.execPath, [`tests/${file}.mjs`, ...process.argv.slice(2)], {stdio: 'inherit'});
  if (result.error) { console.error(result.error); process.exit(1); }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
