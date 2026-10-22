# Organic Design System Implementation Plan

**Goal:** Make the existing CSS library and its catalog share one coherent visual language.

**Architecture:** Preserve source palettes and public classes. Add semantic roles
above those primitives, migrate components, then remove catalog-specific size drift.
No runtime dependencies or external fonts are needed.

**Tech stack:** SCSS cascade layers, plain HTML/JS, Sass and Playwright.

## Constraints

Three source palettes and Telegram priority remain exact. Existing public classes,
layer order, optional effects and live demonstrations stay available. Visual choices
are recorded in `DESIGN.md`. The user's instruction authorizes autonomous execution
and an independent reviewer quorum after implementation.

## Tasks

- [x] Capture the existing catalog and run the original browser suites.
- [x] Add browser regression coverage for secondary/placeholder/action text contrast,
  shared control geometry, reduced motion, navigation at narrow widths and text zoom.
  Run it before changing styles and confirm the contrast/geometry failures.
- [x] Add derived semantic tokens in `src/tokens/_index.scss`. Migrate colors,
  geometry and motion in base, components and utilities. Preserve raw theme values.
- [x] Rewrite `docs/catalog.css` around existing tokens; remove tiny typography,
  redundant numbering, ornamental texture and miniature component overrides.
  Add an accessible native section menu for mobile; keep every demonstration working.
- [x] Update visual expectations that deliberately describe superseded styling,
  without weakening source palette, API, theme priority or behavior assertions.
- [x] Build and run unit, Chromium and WebKit tests; inspect desktop, tablet and
  phone screenshots in light and both dark themes. Fix observed problems in batches.
- [x] Request independent visual, accessibility and implementation reviews. Resolve
  actionable findings, repeat affected checks, and record the reconciled outcome.
- [x] Update README and source-audit documentation with new token roles and intentional
  visual departures. Deliver a verified local result and preview.
