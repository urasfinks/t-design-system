# UI audit fixes implementation plan

**Goal:** Implement F01–F08 from `docs/audits/2026-11-05-ui/report.md`, approved for implementation in chat.

**Architecture:** Preserve public components and all catalog examples. Shared media caption and compact-action layout live in TDS; catalog owns semantic demo markup and resource scheduling. No new production dependencies.

**Constraints:** Three themes; Chromium/WebKit; 320–1440 px; existing four-color contract; compact badges stay compact; no local CSS patches; maintain keyboard, no-JS, deep links and HTML copying. Work in the current `codex/css-framework` checkout so the report and changes remain together. No commit or deployment requested.

## Tasks

- [x] 1. F01/F04: reproduce invalid listbox ownership and badge names; mark search wrappers presentational; fix demo names and decorative content. Run search and semantic checks.
- [x] 2. F02/F08: reproduce image caption contrast; centralize media label surface and apply it to all equivalent captions. Give carousel thumbnails intrinsic sizes. Check actual pixels, all themes and engines.
- [x] 3. F03: reproduce overlapping badge hit areas at wraps; add a reusable public compact action layout reserving control-sized slots while retaining badge height. Exercise all hit-target consumers, both directions and token overrides.
- [x] 4. F05/F06: make actual overflow regions keyboard reachable without unconditional Tab stops; correct carousel figure/group semantics in all examples. Verify axe and scroll geometry.
- [x] 5. F07: use minified catalog CSS; defer optional effect module work while keeping first interaction, search, navigation and HTML ready. Test disabled-JS fallback, deep links, first paint and effect interactions. Compare three Lighthouse mobile runs before/after using the same server.
- [x] 6. Build dist, update color inventory and component documentation; run npm test, color checks, relevant Chromium/WebKit browser suite and visual review. Obtain one fresh code review and address actionable findings.

## Progress and rulings

- Baseline audit contains reproductions and passing 37-test baseline; fresh regression tests will run before implementation.
- The report is the approved design. Extra design/approval rounds would repeat the user's decision; routine implementation choices are delegated by the request to implement everything.
- No source changes at plan start; existing untracked audit artifacts are preserved.

- Regression RED: search ownership, badge names, media contrast, wrapped hit targets, overflow focus, slide semantics and compressed CSS all failed before implementation.
- GREEN: new regression suite passed in Chromium and WebKit. Existing color-related browser suites passed in both engines.
- Review: two findings (duplicate table attributes, runtime distribution dependency) fixed and re-reviewed clean.
- Baseline limitation: progress-stripes.browser.mjs fails with the exact same dark-stripe contrast value 17.0286 on HEAD CSS and modified CSS. Remaining browser files are being run independently; do not mistake early runner exit for full coverage.
- Ruling: preserve ui.js/effects.js manual distribution by bundling the separately-owned scroll helper into ui.js at build time.
- Ruling: WebKit did not scroll a focused overflowing pre on ArrowRight; exact-region arrow handling is required, while descendant widgets keep their keyboard.
- Final: all eight proposals implemented; unit and color suites passed; all browser files were attempted in both engines. Failures in nine historical test files reproduced on archived HEAD; details and measured performance tradeoffs are in `docs/audits/2026-11-05-ui/implementation.md`. No commit, merge or deployment performed.
