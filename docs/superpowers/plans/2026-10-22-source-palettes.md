# Restore source palettes

User authorized implementation without further questions.

- [x] Read source main.ts; preserve all 17 values from each of light, desktopDark, iosDark.
- [x] Capture source colors in a regression fixture independent of the external checkout.
- [x] Run browser regression before the change; confirm palette mismatch fails.
- [x] Replace SCSS palettes; expose ios-dark and data-platform=ios selection.
- [x] Keep source colors in Telegram by default; make SDK colors explicit native mode.
- [x] Add optional themeChanged bridge with ready, iOS detection and cleanup; run failing tests before implementation.
- [x] Update catalog and README to reflect original palettes and SDK precedence.
- [x] Run full tests in Chromium and WebKit, rebuild package, inspect theme screenshots.
- [x] Commit only framework files, leaving unrelated .idea files untouched.


Verification: 6 unit checks, 40 browser checks each in Chromium and WebKit.
All 51 semantic color values match the captured source palettes. The tarball was
installed into a separate consumer and the optional JS export imported correctly.
Screenshots for light, desktop dark and iOS dark were inspected. Independent
review found no material issues. The source project and unrelated .idea files
were not modified.
