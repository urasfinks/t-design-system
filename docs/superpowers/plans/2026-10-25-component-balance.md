# Component balance and cascade plan

Goal: rebalance current components around an explicit, testable CSS cascade while retaining the four-color / twelve-role palette, public APIs, three themes and native semantics.

- [x] Reproduce frozen derived tokens and nested-theme failures with computed browser styles.
- [x] Introduce explicit `.tg-scope` derivation boundaries and support nested named themes. Preserve ordinary inherited role overrides outside boundaries and Telegram precedence.
- [x] Restore distinguishable semantic text/progress roles within the same twelve palette values; adapt dark soft variants and consuming surfaces together, then verify contrast.
- [x] Balance long controls, target sizes, disabled opacity, pressed scale/easing and state boundaries with shared inherited tokens.
- [x] Remove catalog-only public component reskins, ID selector specificity and inline icon sizing; use public variants and shared roles.
- [x] Add a visible cascade example, update README/DESIGN/contracts, verify controls and scope boundaries in Chromium/WebKit, three themes, narrow layouts and 200% text, review screenshots and diff.

Direction: refinement of the existing quiet system. Impeccable polish classifies root alias freezing as a system defect; Emil favors responsive controls and consistent motion; taste-skill preserves the incumbent brand and real component specimens; UI UX Pro Max font scale guidance supports a shared type hierarchy. No style redraw, extra palette or framework migration.
