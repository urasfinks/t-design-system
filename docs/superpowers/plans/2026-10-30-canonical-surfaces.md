# Canonical surfaces implementation plan

**Goal:** One source for floating surface paint, without local replacements or important.
**Architecture:** Floating engine owns paint; root tokens own defaults. Owners retain layout and interaction. Catalog search uses the public modal base.
**Tech Stack:** Sass, CSS custom properties, Node, Playwright.
**Spec:** User-approved canonical inheritance requirements in this chat.

- [x] Add a browser regression that changes floating background, border and shadow at root across themes, including nested surfaces and standalone component imports.
- [x] Introduce floating roles and connect every floating surface, including modal, tooltip, toast and bottom panel. Remove dropdown background replacement and catalog search duplicate paint.
- [x] Update architecture checks and component documentation. Run unit suite and relevant browser suites; record any existing assumptions requiring correction.

Constraints: Preserve public classes, states, keyboard behavior and geometric variants. No important or late patch module. Work in the user's current checkout so npm run dev shows changes.

## User-directed expansion

- [x] Calculate compiled styles and approximation clusters before/after across all five docs pages, all themes and two widths; retain raw data and report incomplete coverage.
- [x] Consolidate semantically matching metadata footers and group labels; document hierarchy in docs/style-architecture.md.
- [x] Review fixes: list panel passes floating paint to visible child; distinguish static states and contextual variation in clustering.

No commits or publication requested. Final browser verification is recorded in the chat.

Ruling: fix catalog scroll navigation discovered by full browser verification.
At scrollY=0 overview was visible at y=72 but stale IntersectionObserver batches
left pickers active after viewport changes; derive current section from geometry
on scroll/resize. The existing browser test reproduced this before the fix.

Final verification: npm test — 33/33. All browser script groups exercised;
interrupted groups resumed separately. Navigation browser — 67 checks;
wave 7 — 81 checks; wave 8 — 55 checks; spec examples — 2016 checks.
The early-Enter failure was traced to lastEnter=0: a first keypress at 100ms
was considered a second press. A controlled-clock Node regression failed before
and passed after using -Infinity for the initial previous-press timestamp.
Approximation report: 15432 current samples, 667 state/class profiles,
506/614 declared classes represented; uncovered classes explicitly listed.
