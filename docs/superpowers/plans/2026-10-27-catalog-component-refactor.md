# Catalog and Component Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Исправить все дефекты аудита и превратить статический каталог TDS в модульный, доступный и searchable reference без SPA.

**Architecture:** SCSS-токены и владельцы компонентов остаются источником визуальных контрактов. Статический `docs/index.html` сохраняет примеры и anchors; native ES modules разделяют навигацию, поиск, demo behavior и code previews. Нативный `<dialog>` использует существующие TDS surface/control roles.

**Tech Stack:** SCSS, native CSS/HTML/JavaScript, Node.js, Sass, Playwright, существующие browser test helpers.

**Spec:** `docs/superpowers/specs/2026-10-27-catalog-component-refactor-design.md`

## Global Constraints

- Не добавлять SPA, routing, framework, bundler или runtime-зависимости.
- Не генерировать примеры через `innerHTML`; сохранить существующие section ids и публичные `.tg-*` классы.
- Использовать `@layer tds.components`, существующие palette roles и control-state engine; без `!important` и ID-селекторов в SCSS компонентов.
- Touch targets ≥44px; сохранить keyboard, focus, forced-colors, reduced-motion и 200% text.
- Проверять Light/Desktop Dark/iOS Dark и 320–1440px.
- Не перезаписывать несвязанные изменения пользователя; не выполнять commit без отдельного явного запроса.

## Review Focus

- Ввод в input/textarea/contenteditable: `/` и Cmd/Ctrl+K не должны перехватывать обычный ввод или системные shortcuts; проверяется Task 4 Step 1.
- Открытый search/demo dialog: глобальная клавиша не должна создавать второй modal; проверяется Task 4 Step 1.
- Пустые, длинные, смешанные Cyrillic/Latin запросы и отсутствие результатов: стабильный empty state без ошибок; проверяется Task 4 Step 1.
- Escape и выбор результата: закрытие, focus return, правильный hash/scroll и повторный переход к тому же разделу; проверяется Task 4 Step 1.
- RTL, 200% text и 320px: transform switch/progress и полные имена palette tokens не должны обрезаться; проверяется Task 2 Step 1 и Task 5 Step 1.

---

### Task 1: Choice, Placeholder and Disabled Contracts

**Files:**
- Modify: `src/tokens/_index.scss`
- Modify: `src/components/_forms.scss`
- Modify: `src/components/_patterns.scss`
- Modify: `src/base/_index.scss`
- Modify: `src/components/_upload.scss`
- Test: `tests/field-focus.browser.mjs`
- Test: `tests/design-system.browser.mjs`

**Interfaces:**
- Produces: public custom properties `--choice-border-color` and `--disabled-opacity`; `.tg-search__input::placeholder` semantic color.
- Consumes: existing `--control-border-color`, `--text-secondary`, shared disabled selectors.

- [ ] **Step 1: Write failing browser assertions**
  - Replace transparent-border assertions for unchecked radio/checkbox with resolved `--choice-border-color` equality and composited contrast ≥3:1 against the adjacent surface in all three themes.
  - Add `.tg-search__input` with placeholder to the fixture; measure pseudo-element color against the actual wrapper background and assert ≥4.5:1.
  - Assert buttons, inputs, choices, search and upload compute disabled opacity from the same resolved token value.

- [ ] **Step 2: Verify the new assertions fail**
  - Run: `npm run build && node tests/field-focus.browser.mjs && node tests/design-system.browser.mjs`
  - Expected: FAIL on transparent choice border, missing search placeholder contrast, or non-unified disabled opacity.

- [ ] **Step 3: Implement semantic state tokens**
  - Define `--choice-border-color` from existing neutral/control roles and `--disabled-opacity` once in tokens.
  - Replace hardcoded `.45`/`.5` in the listed shared disabled owners with the token.
  - Use `border-color: var(--choice-border-color)` for unchecked choices and add the search placeholder rule with `opacity: 1`.

- [ ] **Step 4: Verify component contracts**
  - Run the Step 2 command.
  - Expected: PASS; existing geometry, checked/indeterminate, forced-colors and focus assertions remain green.

### Task 2: Numeric Typography and Motion

**Files:**
- Modify: `src/components/_patterns.scss`
- Modify: `src/components/_feedback.scss`
- Modify: `src/components/_forms.scss`
- Modify: `src/components/_effects.scss`
- Modify: `src/base/_index.scss` only if reduced-motion ownership requires it
- Test: `tests/patterns.browser.mjs`
- Test: `tests/browser.mjs`
- Test: `tests/effects.browser.mjs`

**Interfaces:**
- Produces: `.tg-num`, `.tg-table__num`; transform-based custom progress and switch knob; token-based fade duration/easing.
- Consumes: `--duration`, `--ease`, `--progress-duration`, existing RTL selectors.

- [ ] **Step 1: Write failing numeric and motion tests**
  - Assert `.tg-num` and numeric `th.tg-table__num`/`td.tg-table__num` use `tabular-nums` and `text-align: end`; ordinary cells stay `start`.
  - Assert custom `.tg-progress__bar` transitions `transform`, not `inline-size`, and resolves to the requested progress without changing track geometry in LTR/RTL.
  - Assert the switch knob keeps `translateY(-50%)`, moves by inline transform in both directions and has no `inset-inline-start` transition.
  - Assert `.tg-fade-in`/`.tg-fade-out` use computed `var(--duration)`/`var(--ease)` values; reduced-motion still computes 0s.

- [ ] **Step 2: Verify the tests fail**
  - Run: `npm run build && node tests/patterns.browser.mjs && node tests/browser.mjs && node tests/effects.browser.mjs`
  - Expected: FAIL on the new numeric or transition assertions.

- [ ] **Step 3: Implement minimal component changes**
  - Add numeric classes in the table/pattern owner without changing default text-cell alignment.
  - Use `scaleX()` for the custom bar with inline-aware origin; retain native progress behavior unless a native-specific test proves an equivalent transform is safe.
  - Move the knob through a logical custom property/transform, preserving existing dimensions and RTL checked positions.
  - Replace 350ms/ease literals in fades with shared tokens.

- [ ] **Step 4: Verify motion and numeric behavior**
  - Run the Step 2 command plus `node tests/audit.browser.mjs`.
  - Expected: PASS, including RTL, reduced-motion and progress stripes.

### Task 3: Split Existing Catalog Behavior Without Changing UX

**Files:**
- Modify: `docs/catalog.js`
- Create: `docs/catalog-navigation.js`
- Create: `docs/catalog-demos.js`
- Create: `docs/demo-code.js`
- Test: `tests/catalog-refresh.browser.mjs`
- Test: `tests/catalog-compositions.browser.mjs`

**Interfaces:**
- Produces: `initCatalogNavigation({ root = document } = {}) → { navigate(id, { focus = false } = {}), sync() }`.
- Produces: `initCatalogDemos({ root = document } = {}) → void` and `initDemoCode({ root = document } = {}) → void`.
- Consumes: existing static DOM and `icon-browser.js`; `catalog.js` imports and initializes each module once.

- [ ] **Step 1: Add a composition-root regression test**
  - Assert all current theme, accent, tabs, toast, dialog, upload, snackbar, pagination, range, transition, hash navigation and code disclosure behaviors still work after module loading.
  - Assert no duplicate event behavior after initialization and no JavaScript errors.

- [ ] **Step 2: Run the existing catalog suites before editing**
  - Run: `node tests/catalog-refresh.browser.mjs && node tests/catalog-compositions.browser.mjs`
  - Expected: PASS, establishing the behavior reference.

- [ ] **Step 3: Move handlers into focused modules**
  - Move navigation, demo handlers and code-preview creation unchanged into their owners.
  - Keep `catalog.js` limited to imports and initialization; remove only the redundant accent overrides already covered by token aliases.
  - Do not change static example markup in this task.

- [ ] **Step 4: Verify behavior parity**
  - Run the Step 2 command and `node tests/browser.mjs`.
  - Expected: PASS with no page errors and no duplicate disclosures/handlers.

### Task 4: Grouped Navigation and Global Search

**Files:**
- Modify: `docs/index.html`
- Modify: `docs/catalog.css`
- Modify: `docs/catalog.js`
- Modify: `docs/catalog-navigation.js`
- Create: `docs/catalog-search.js`
- Create: `tests/catalog-search.browser.mjs`
- Modify: `scripts/test-browser.mjs`

**Interfaces:**
- Consumes: `navigate(id, { focus })` from Task 3.
- Produces: `initCatalogSearch({ root = document, navigate }) → { open(), close() }`.
- Produces: static `#catalog-search`, `#catalog-search-input`, `#catalog-search-results`, `#catalog-search-status` and `[data-catalog-search-open]` controls.

- [ ] **Step 1: Write the failing search/navigation browser suite**
  - Cover sidebar groups and mobile `optgroup`; all 14 existing section anchors remain.
  - Open by button, `/`, Cmd/Ctrl+K; prove editable focus and an already open dialog do not trigger another modal.
  - Filter by Russian title, `.tg-*` class and `--*` token; include mixed-case, extra whitespace, long query and empty results.
  - Verify ArrowUp/ArrowDown, Enter, native Escape, result count/live status, focus return, hash/scroll and repeated navigation to the current hash.
  - Verify 320px/200% text, 44px targets, no page overflow and no JavaScript errors.
  - Load the catalog with JavaScript disabled and assert all static examples and section links remain visible; search is a progressive enhancement.

- [ ] **Step 2: Verify the suite fails**
  - Run: `node tests/catalog-search.browser.mjs`
  - Expected: FAIL because the dialog and search module do not exist.

- [ ] **Step 3: Add static dialog and grouped navigation markup**
  - Add search controls to desktop/mobile navigation, one labeled native dialog, search input, result list, empty/live status and explicit `data-search-*` metadata on sections/token rows.
  - Group existing links/select options without renaming ids; replace poetic H2 text with task-focused titles and reduce em-dash copy.

- [ ] **Step 4: Implement search and dialog behavior**
  - Build a normalized index only from explicit metadata and headings; render results with DOM methods/`textContent`, never query interpolation into HTML.
  - Implement keyboard/focus/selection behavior through the Task 3 `navigate` interface.
  - Add restrained opacity/transform enter-exit styles using shared tokens; reduced-motion computes no optional animation.

- [ ] **Step 5: Verify search and existing navigation**
  - Run: `node tests/catalog-search.browser.mjs && node tests/catalog-refresh.browser.mjs && node tests/browser.mjs`
  - Expected: PASS; add `catalog-search.browser` to the browser runner.

### Task 5: Responsive Palette and Numeric Demo Content

**Files:**
- Modify: `docs/index.html`
- Modify: `docs/catalog.css`
- Test: `tests/palette.browser.mjs`
- Test: `tests/catalog-refresh.browser.mjs`
- Test: `tests/catalog-search.browser.mjs`

**Interfaces:**
- Consumes: `.tg-num`/`.tg-table__num` from Task 2 and search metadata from Task 4.
- Produces: one source of palette markup that adapts from table to readable mobile rows without manually duplicated token data.

- [ ] **Step 1: Write failing responsive/content assertions**
  - At 320/390px assert all 12 token names are fully readable, their text does not break into arbitrary fragments, no horizontal overflow occurs and table/row semantics remain accessible.
  - Assert numeric table headers/cells and monetary list values use the new classes; ordinary labels remain start-aligned.
  - Assert section headings retain the shared structure and search aliases still find all palette tokens.

- [ ] **Step 2: Verify the assertions fail**
  - Run: `node tests/palette.browser.mjs && node tests/catalog-refresh.browser.mjs && node tests/catalog-search.browser.mjs`
  - Expected: FAIL on mobile token layout or missing numeric classes.

- [ ] **Step 3: Implement adaptive palette and demo classes**
  - Use the existing table with accessible CSS row/card presentation below 36rem and stable full-token wrapping; do not introduce a second manually maintained palette.
  - Apply numeric classes only to appropriate values and headings.

- [ ] **Step 4: Verify responsive content**
  - Run the Step 2 command.
  - Expected: PASS in all three themes and target widths.

### Task 6: Documentation, Baseline and Full Verification

**Files:**
- Modify: `DESIGN.md`
- Modify: `docs/component-standard.md`
- Modify: `README.md`
- Modify: `tests/fixtures/cascade-baseline/t-design-system.css`
- Modify: `tests/fixtures/cascade-baseline/catalog.css`
- Verify: all changed source/test files

**Interfaces:**
- Consumes: final public tokens/classes and reviewed rendered output from Tasks 1–5.
- Produces: documented public API and an intentional current visual reference.

- [ ] **Step 1: Document the final contracts**
  - Document choice border, disabled/motion tokens, numeric classes, search placeholder and catalog keyboard/search behavior; do not document rejected intermediate approaches.

- [ ] **Step 2: Review screenshots before accepting baseline**
  - Build and inspect current desktop/tablet/mobile captures in all three themes, focusing on forms, search dialog, palette, tables and navigation.
  - Only after visual review, copy the reviewed `dist/t-design-system.css` and `docs/catalog.css` into the cascade baseline fixture.

- [ ] **Step 3: Run the complete automated matrix**
  - Run: `npm test && npm run test:browser`
  - Run: `npm run test:browser -- --webkit`
  - Expected: all commands exit 0; no baseline differences, contrast failures or browser errors.

- [ ] **Step 4: Run design and responsive verification**
  - Run the existing taste lint and inspector against `docs/index.html`, `docs/catalog.css` and `docs/catalog.js` plus the new modules.
  - Inspect 320, 390, 768 and 1440px; keyboard-only, 200% text, reduced-motion and forced-colors.
  - Resolve valid findings or record concrete false positives; leave no audit server or temporary script running.

- [ ] **Step 5: Review the final diff**
  - Confirm every audit item maps to a changed contract/test, no unrelated user files changed and no temporary artifacts were added to product source.
  - Report exact test results and any remaining limitation; do not commit unless the owner explicitly asks.
