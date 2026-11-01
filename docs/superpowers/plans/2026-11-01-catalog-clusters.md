# Catalog families implementation plan

> **For agentic workers:** Use superpowers:executing-plans; execute in this session.

**Goal:** Group the entire catalog by semantic family, simple variants first, mixed scenes last.
**Architecture:** Preserve static examples while moving whole panels. Section metadata owns the navigation tree; build generates desktop/mobile navigation from it. Search and active navigation support families and subsections.
**Tech Stack:** Static HTML, CSS, native ES modules, Node test runner, Playwright.
**Spec:** docs/superpowers/specs/2026-11-01-catalog-clusters-design.md, amended by the user's family-first correction.

## Global constraints

- Families remain together: avatars and avatar groups; buttons and button groups; panels and panel variants.
- Preserve examples, states, data-spec, control IDs, ARIA references and legacy section anchors.
- Preserve example → rule → HTML, existing TDS visual language and generated dist policy.
- Work in the current feature checkout to retain the user's existing avatar changes; no commits requested.

## Review focus

- Missing/duplicated panels: compare original example markup and IDs before/after.
- Cross-panel dependencies: interaction checks for moved demos and existing browser suites.
- Navigation drift: derive both navigation surfaces from section metadata and assert order.
- Old links and nested targets: check all fragment targets and focus/active navigation.
- Small screens and themes: screenshots and overflow checks in Chromium/WebKit, three themes.

## Tasks

- [x] 1. Record current example inventory; add failing structure/navigation tests.
- [x] 2. Reorganize HTML families and subclusters; move mixed scenes last; preserve all original examples.
- [x] 3. Generate desktop/mobile navigation from metadata; update search and active targets for subsection anchors.
- [x] 4. Update DESIGN.md and component-standard.md; run npm test, browser suites, visual review and diff review.

## Execution ledger

User approved execution with “Делай”; implement inline, without another approval round.
User correction overrides the original complexity-first spec: family → subtype → variant/state; scenes last.


Review corrections: featured pricing cards remain in the card family; image selection
is split from the waveform into a discoverable subsection. All 332 prior IDs remain.
One old live example was split into two; the other 116 retain their exact markup.
Navigation activation follows actual scroll-padding and scroll-margin instead of 100px.


## Verification record

- npm test: 37 passed; build regenerated navigation; dist unchanged.
- catalog-clusters: Chromium/WebKit, all 120 original panel origins, unique IDs,
  family ownership, nested search/navigation, HTML, three themes, 320/1440px.
- catalog-search, catalog-refresh, catalog-compositions, demo-page-scroll,
  option-spacing and option-selection passed in Chromium/WebKit.
- Component waves exercised in both engines. Existing WebKit focus failures
  in wave 1 (B9), wave 2 (F14), wave 3 (N5) reproduce on the pre-refactor HTML.
- Wave 0 contains a prior assertion requiring boxShadow on pressed segments;
  pre-refactor and current HTML both produce none, as required by DESIGN.md.
- Chromium SVG style sampling after resize initially returned an empty value
  on both old and current HTML. Wave 4–5 now waits for the rendered SVG style.
- A split F33 example required checking each responsive stage; the decorative
  background offscreen test now scrolls to overview, as start is adjacent to it.
- Visual review corrected double heading padding; independent review corrected
  featured-card ownership and separated image selection from audio waveform.
- git diff --check: clean. Original 332 IDs retained; 116/117 live example
  blocks byte-preserved, one decomposed into two without losing either control.
