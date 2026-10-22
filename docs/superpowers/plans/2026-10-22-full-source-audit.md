# Full source audit and corrections

User requested comprehensive review and fixes without additional questions.

- [x] Independently inspect source styles/components/templates, framework behavior and packaging.
- [x] Reproduce source visual drift and RTL bugs with failing browser audit.
- [x] Restore derived source tokens, headers, divider, avatars, switches and progress.
- [x] Transfer reusable effects, upload visuals, snackbar, pagination and spacer.
- [x] Fix RTL toast, switch and tab navigation.
- [x] Prove and fix dev server traversal; add malformed path/symlink tests.
- [x] Fix test startup synchronization and Angular integration documentation.
- [x] Record all migration decisions and scope exclusions in docs/source-audit.md.
- [x] Verify full test suites in Chromium/WebKit, actual package consumption and server restart.
- [x] Review final diff, preserve unrelated IDE files and commit verified work.


Verification: 12 unit checks; 47 catalog checks and 34 source/RTL checks per
browser, plus effect lifecycle assertions in Chromium and WebKit. Occupied-port
regression exits promptly. All 71 original tg-* names and all 51 palette values
are covered. Final review found no material issues. Actual npm installation,
CSS resolution, Sass modules and optional JS exports were verified separately.
Only framework files are committed; unrelated .idea files are retained.
