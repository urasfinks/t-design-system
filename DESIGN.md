# T Design System

## Direction

A quiet, coherent interface for web and Telegram Mini Apps. The component catalog
is a reading and comparison surface, not a marketing campaign. Preserve its
content, public `.tg-*` classes, three source palettes and Telegram integration.
The signature is the system itself: live components, clear examples, readable code.

## Foundations

- Use the platform system font; body text starts at 16 px. Secondary UI text is
  14 px, metadata and code at least 12 px. Headings use moderate weight and
  tracking no tighter than −0.03 em.
- Spacing follows the existing 4 px scale. Related controls share a 12 px gap;
  panels use 24 px padding; sections get 64 px separation on desktop.
- Cards use 16 px corners. Buttons and fields share 12 px corners; inset controls
  use 8 px. Pills are reserved for chips, badges and switches.
- Four input colors define each theme. Each family exposes three shared roles;
  components consume these twelve palette values. Desktop Dark uses the adjusted
  page background #151e27 and fixed panel/muted colors #212d3b / #1d2733.
- Field borders are quiet at rest. Switches use their own filled track without
  an idle outline. Focus and invalid states remain distinct. Under
  `prefers-contrast: more`, field and switch boundaries use the stronger
  control-border role. The quiet default does not claim universal WCAG AA
  boundary contrast for empty custom controls.
- Flat cards use a border, not a shadow. Shadows distinguish selected segmented
  controls and floating overlays. Glass is an opt-in material demonstrated in
  the effects catalog, not the default surface.
- Touch controls keep a minimum 44 px target; long labels wrap. Hover requires
  hover capability. Keyboard focus stays visible; reduced motion removes movement.
- Motion uses the shared easing, 120 ms press feedback and 180 ms state changes.
  Avoid entrance choreography and scaling hidden content to zero.
- Error notices use a quiet tinted surface, a small semantic icon and primary
  text, without a red outline. Descriptions retain a clear recovery step.
  The material demo has a flat neutral backdrop; no decorative blue gradient.

## Catalog

Use the library's tokens and component sizes. No miniature mock interface or
8–11 px labels. Remove decorative section numbers and eyebrows. Keep the sidebar
on desktop, with an explicit section menu on small screens. Use consistent SVG
icons. Preserve live demos, HTML disclosure, theme/accent selectors and downloads.

## References and interpretation

Apple HIG: [Layout](https://developer.apple.com/design/human-interface-guidelines/layout),
[Materials](https://developer.apple.com/design/human-interface-guidelines/materials),
[Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons),
[Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).
Apply hierarchy, alignment, concentric geometry, restrained materials and accessible
interaction to the web. This is not a reproduction of Apple's native widgets.

The impeccable extraction/polish workflow, Emil's interaction detail, taste-skill's
restraint and screenshot critique, and ui-ux-pro-max's documentation/minimalism
guidance inform this pass. The existing product palette and platform font win over
generic palette/font suggestions and random art-direction draws.

## Verification

Build, unit tests, Chromium and WebKit interaction suites; computed contrast for
text and controls across all three themes and accent overrides; 320–1440 px
layouts, keyboard focus, reduced motion, long labels and 200% text. Review actual
screenshots before completion. Independent critics review visuals, accessibility
and CSS/API compatibility, followed by a reconciliation pass.


## Reference and icon direction

The user supplied a dark receipt-list reference from ai-splitter-ng. Use its quiet
surface hierarchy, compact rows, soft separators and restrained accent as evidence,
not as a pixel-perfect target or a claim that the original is ideal. Preserve the
improvements to feedback, form states and accessibility already accepted.

Icons come from the pinned feather-icons npm dependency (v4.29.2, MIT).
The build exposes every icon as an individual SVG in dist/icons/. No combined
sprite is shipped; browsers request only the icons used on a page. The catalog
uses external SVG references with inherited currentColor rather than hand-redrawn glyphs;
24×24 geometry, stroke 2, round caps/joins, 16/20/24px roles. Feather is a web icon
choice, not an assertion that these are Apple's SF Symbols. Capsule action buttons
are available as explicit modifiers, alongside the current default geometry.

The second reference shows a detailed list inside a dark rounded section, with
item text and amounts on a shared row, quiet dashed separators, participant
avatars with rings and numeric overlays, compact capsule icon actions, totals
and a separate participant section. Treat these as composition evidence:

- Separate sections through surface and spacing, with restrained borders.
- Distinguish primary actions through the accent; keep supporting actions tonal.
- Keep names, quantities and amounts aligned; use tabular numerals for amounts.
- Let avatar rings express selection and badges carry quantities, without
  turning every status into a bright filled label.
- Keep touch targets generous even when visible icon controls look compact.

Informational badge labels, categories and statuses have no outline: use primary,
secondary or destructive modifiers. In badge compositions, an outline signals
interaction; use a semantic button/link for the actual action. The “Пространство”
label uses the neutral secondary modifier; “Новый проект” uses the accent primary
modifier. Both are borderless.
Standalone base badges retain their outlined API for interactive use. Direct avatar
badge children retain a surface-separation border and shadow for overlapping
geometry. Quantity overlays use the secondary badge.
`tg-avatar--outlined` keeps the filled initials circle and a single neutral outer
2px ring across the existing padding gap, matching the source reference. Direct
initials use font-weight 400 in this variant. Selection
strengthens this outer ring
(`--avatar-selection-ring-color`, defaulting to `--control-border-color`). Keyboard
focus remains separate. The default avatar still supports accent selection.

These references guide generic components, not a copy of the receipt application
or a requirement to reproduce its data, business logic or every visual decision.

## Four-color palette

The current palette has four inputs per theme: background, accent, text,
and danger. Each has exactly three reusable variants, displayed as twelve samples
in the foundations table. Only eight derived palette declarations may contain
`color-mix()`, all in tokens. Components and catalog styles use aliases only.
Borders and shadows may use neutral RGBA transparency.

Preserve the reference app's material relationships through theme-specific mixing
weights: white panels on a light-gray page, blue-gray Desktop Dark, gray iOS panels
on black. Do not reintroduce independent header, hint, section or secondary colors;
their old public names alias the twelve palette values. Telegram can override the
four source colors; it cannot expand the palette through secondary roles.

Main roles alias the current input colors. Desktop Dark fixes its panel and muted
roles independently of the background input; custom themes must override those
roles explicitly. Light and iOS Dark derive both surfaces from the background.
Focused fields use the active field background and
a main-accent border with a 4px soft-accent outer ring. Invalid focused fields
use danger-main for the border and danger-soft for the outer ring. Buttons keep saturated strong fills and white text, and all action
variants share `--control-h`. File progress keeps its accepted 3px stripe blur.

Primary and destructive badges use soft backgrounds with strong text in Light,
and strong backgrounds with main text in dark themes through `light-dark()`.
The stylesheets require browsers with `@layer`, `color-mix()` and `light-dark()` support.
Catalog-only `.avatar-stack` / `.mini-avatar` styles are not public components.


## Additive compatibility contract

The core source files are frozen at 678b61e1. New components live in separate modules:
patterns, bottom-panel, and opt-in extensions. The original catalog preview and avatar
stack remain intact. One root accent applies to all examples; alternative colors replace
it globally. Ripple remains opt-in. Nested palette boundaries and the later component
rebalance are intentionally excluded. Baseline tests enforce source equality and rendered
compatibility; new components must pass their own responsive and interaction checks.
