# CSS Framework Implementation Plan

> **For agentic workers:** Execute inline with executing-plans. The user authorized implementation without additional questions.

**Goal:** Package the source project's visual language as a standalone CSS framework.
**Architecture:** Ordered CSS cascade layers, semantic custom properties, independent themes, optional Telegram mapping, focused SCSS modules and a static component catalog.
**Tech Stack:** Dart Sass, Node.js scripts, Playwright browser checks.

## Global constraints

- Work in this repository; source ai-splitter-ng remains untouched.
- Retain public tg-* component names and core size tokens.
- No runtime dependencies or production JavaScript.
- Deliver expanded/minified main CSS and Telegram adapter, SCSS exports and docs.
- No publication, source-app migration, or assumed license grant.
- User requested autonomous execution and waived further review questions.

### Task 1: Build and theme contract

Files: package.json, scripts/build.mjs, tests/framework.test.mjs, src/index.scss,
src/_layers.scss, src/tokens/_index.scss, src/themes/_index.scss, src/telegram.scss.

- [x] Add tests for consumable exports, ordered layers, no undefined core tokens,
  theme independence, application overrides and Telegram fallback behavior.
- [x] Run the tests before implementation; confirm missing artifacts fail.
- [x] Create build using Sass compileAsync for index.scss and telegram.scss,
  expanded/compressed outputs with no source maps or hard-coded absolute paths.
- [x] Define default palette via private fallback tokens; derive semantic colors
  in the themes layer. Explicit theme takes precedence over system preference.
- [x] Adapter maps official --tg-theme-* then legacy --tg-* then palette defaults.
- [x] Run build and contract tests; check npm pack --dry-run.

### Task 2: Components and layout

Files: src/base/_index.scss, src/components/_{buttons,forms,surfaces,navigation,
feedback,avatar}.scss, src/utilities/_index.scss.

- [x] Transfer common tg-* variants; drop source-specific IDs and Angular styles.
- [x] Give states explicit selectors; disabled cannot hover/press. Use logical
  properties, min-inline-size:0, 44px minimum touch controls and wrapping labels.
- [x] Preserve native dialog semantics, add accessible checkbox/radio variants,
  keep progress width custom property and reduced-motion scoped to components.
- [x] Check focus, theme, utilities overriding components and long content in browser.

### Task 3: Catalog and packaging

Files: docs/index.html, docs/catalog.css, docs/catalog.js, README.md, .gitignore, scripts/serve.mjs, tests/browser.mjs.

- [x] Build Russian catalog: introduction, tokens, buttons, forms, surfaces,
  navigation, feedback, avatars and dialog; render code examples from live HTML.
- [x] Provide automatic/light/dark selection, accent override, working tab,
  switch, toast and native dialog examples with keyboard support.
- [x] Document HTML, npm/file dependency, Angular styles import, SCSS selection,
  layers, public class inventory, Telegram fallback and migration boundaries.
- [x] Browser-check 360px and 1440px layouts, all theme modes, adapter with/without
  official variables, state selectors, focus, reduced motion and modal interactions.
- [x] Review diff, verify source git status unchanged, run npm test, npm run
  test:browser, npm pack --dry-run; package local tarball and save screenshot.


## Verification results

- npm test: 3 contract tests pass; all SCSS modules compile independently.
- Browser: 31 checks pass in Chromium and 31 in WebKit at 360, 768, 1440px.
- Regression checks cover hidden precedence and standalone disabled switches.
- Tarball installed into /private/tmp/tds-consumer; CSS exports resolve and
  Sass NodePackageImporter compiles full and selective package imports.
- Source repository status was clean before extraction and remains clean.
- Independent code review identified two issues; both have regression tests
  and were corrected before delivery.
- Local changes stay on codex/css-framework; no remote publication.
