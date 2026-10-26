# Catalog refresh implementation plan

Goal: extend the existing CSS library with coherent useful components and replace stale demonstrations.
Architecture: preserve tokens, palettes, public classes and standalone CSS; standard delegated UI runtime for press waves; build-time Feather manifest drives searchable gallery.
Tech stack: SCSS, ESM, native HTML, Node tests, Playwright Chromium/WebKit.

Global constraints: no framework dependency; existing 4-color/12-role palette; 44px targets; reduced motion; theme parity; retain compatibility APIs.

- [x] Task 1: Standard ripple in src/effects.mjs and src/components/_effects.scss; src/ui.mjs auto-init entry. Add interaction regression, verify failure before implementation, pointer/keyboard/disabled/cleanup/reinit/reduced motion; preserve initRipple.
- [x] Task 2: Add src/components/_patterns.scss: search, empty, disclosure, skeleton, table, breadcrumbs, summary list, fieldset/error summary/range. Native semantics; no fake JS widgets. Add browser regression, verify failed missing styles then implement.
- [x] Task 3: scripts/build.mjs produces dist/icons.json including Feather names/tags, copies UI entry. docs/icon-browser.js renders searchable gallery using tg-search/tg-empty, size choices and selected code/copy. Add focused tests.
- [x] Task 4: Integrate new components/catalog sections; deduplicate overview, buttons/icons, layout, ripple. Wire both live screens to runtime and demonstrate source link. Update README and DESIGN.md, document research sources and maturity boundaries.
- [x] Task 5: Update old hard-coded expectations, run npm test and browser suites in both engines, inspect screenshots at 320/390/1440px; review whole diff and fix material findings.

Research: Carbon components https://www.carbondesignsystem.com/building-blocks/core/components/overview/components ; GOV.UK https://design-system.service.gov.uk/components/ . Search, disclosure, breadcrumbs, tables and summary/error patterns selected for framework-independent native implementation; complex combobox/date picker/tree grid remain explicitly outside this release.


Execution notes: user confirmed ripple on all buttons, general rules balanced with README, and cascade as mandatory. Research and public contract in docs/component-standard.md. Shared text/progress contrast aliases and high-contrast off-switch fixed after 15 existing contrast regressions were revealed. New browser regressions cover inherited tokens and external CSS precedence; legacy markup remains supported. Whole-diff review findings fixed (search state, gallery keyboard, ripple overflow and default-token inheritance). Removed private avatar-stack specimen and its obsolete test; public avatars retain existing coverage.
