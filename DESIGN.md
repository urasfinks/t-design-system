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
  control-border role. Unchecked checkbox and radio controls are the exception:
  they use `--choice-border-color` with at least 3:1 contrast against the
  adjacent surface, so an empty choice is visible before interaction. Search
  placeholders use `--text-secondary` like every other field.
- Disabled controls share one `--disabled-opacity` token. Disabled text is exempt
  from WCAG contrast, but the reason for unavailability stays readable nearby.
- Numbers that are compared (amounts, quantities, totals) use `.tg-num` or
  `.tg-table__num`: tabular numerals aligned to the inline end.
- Flat cards use a border, not a shadow. Shadows distinguish selected segmented
  controls and floating overlays. Glass is an opt-in material demonstrated in
  the effects catalog, not the default surface.
- Touch controls keep a minimum 44 px target; long labels wrap. Hover requires
  hover capability. Keyboard focus stays visible; reduced motion removes movement.
- Motion uses the shared easing, 120 ms press feedback and 180 ms state changes.
  Avoid entrance choreography and scaling hidden content to zero. Animate
  `transform` and `opacity` only: the progress bar uses `scaleX()`, the switch
  knob an inline-aware `translateX()`, the press wave `scale()`, fades use
  `--duration`/`--ease`. Press feedback finishes within 300 ms. Layers that
  appear (toast, snackbar, dialog) enter on `--duration-fade-in` and leave faster
  on `--duration-fade-out`. Hover needs `(hover: hover) and (pointer: fine)`.
  Reduced motion removes travel and scale but keeps a 120 ms fade on appearing
  layers. Keyboard commands (search on `/` or Cmd/Ctrl+K) open without animation.
- Error notices use a quiet tinted surface, a small semantic icon and primary
  text, without a red outline. Descriptions retain a clear recovery step.
  The material demo has a flat neutral backdrop; no decorative blue gradient.

## Outline semantics for small elements

On small elements an outline means “you can act on this”. Panels — cards,
lists, tables, notices, fieldsets, disclosures — keep their own outline: it
separates content from the page and is outside this rule.

| Element | Information (no outline) | Action (outline, or fill when selected) |
| --- | --- | --- |
| Badge | `span.tg-badge` — a status or counter | `a.tg-badge[href]`, `button.tg-badge` — outline, 44 px target, focus |
| Filter | — | `button.tg-chip[aria-pressed]` — outline; pressed filters are filled |
| Avatar | `span.tg-avatar` — a picture of a person | `button.tg-avatar` / `a.tg-avatar` — outline; selected gets the accent ring |
| List row | `div.tg-list-item` — data, no hover | `a.tg-list-item[href]`, `button.tg-list-item` — full-width target, hover, focus, trailing chevron |
| Button | — | secondary and icon buttons are tonal: a quiet fill with a barely visible outline (4% light, 2% dark; a full action outline with `prefers-contrast: more`); primary and destructive are filled; ghost relies on text colour and context |

The action outline is its own token, `--action-border-color` (24% black or
white, about 1.7:1 against the stage), so it reads as stronger than the 8% panel
outline (about 1.2:1). Under `prefers-contrast: more` it becomes the control
border. A test keeps actions at 1.5:1 or more and panels at 1.35:1 or less.

A status is never made clickable by styling alone, and a filter is never styled
as a status. A full-width link row contains no nested links or buttons. The
selection state lives in ARIA (`aria-pressed`, `aria-checked`, `aria-current`),
not in colour alone.

## Catalog

The catalog page uses `--background-panel`. Every component preview stage uses
`--background-main` to show components against the future site's background.
Embedded screen examples keep `--background-main` as their page background.
Example blocks follow one order: `.example-panel > .example-body`, then
`p.example-rule`, then the `.example-code` disclosure labeled “Посмотреть HTML”.
The rule is one or two sentences of static text: when to use the component,
what to use instead, and why it looks the way it does (for example, why a status
has no outline). Every live `[data-example]` has a rule. Do not add metadata bars.
Running text (section intros and example rules) is 16 px (`--catalog-text`);
14 px is for navigation and metadata. Navigation group labels are not headings:
each group is `role="group"` named by its label, so the page's `h1` is the
first heading. Example forms carry `name`, `autocomplete` and, for e-mail,
`spellcheck="false"`; code is marked `translate="no"`.
Section headings use `.section-heading > div` containing `h2` and `p`, followed
by `code.class-tag`. Place controls outside this heading structure.

Use the library's tokens and component sizes. No miniature mock interface or
8–11 px labels. Remove decorative section numbers and eyebrows. Keep the sidebar
on desktop, with an explicit section menu on small screens. Use consistent SVG
icons. Preserve live demos, HTML disclosure, theme/accent selectors and downloads.

The catalog has one section per task, in six groups (an `optgroup` per group in
the mobile select, in page order): “Основа” (overview, colors, layout),
“Действия” (buttons, action menus, icons, filters and statuses), “Ввод” (fields, choice,
option lists and pickers, date and time, file upload), “Содержимое” (cards, lists and
disclosure, text and keys, empty state, avatars, data, charts, process progress, media and
galleries), “Навигация и отклик” (navigation, application navigation, feedback, dialogs and
messages) and “Примеры и интеграция” (compositions, effects, setup). New components join the
group of their task; there is no separate section per source archive. Section titles describe the task, not a slogan. Global search is a native `dialog` opened by the “Поиск” button,
`/` or Cmd/Ctrl+K (never while typing in a field). It matches section titles,
`.tg-*` classes and `--*` tokens from explicit `data-search-*` metadata; arrows
move, Enter navigates, Escape closes and focus returns to the opener. Search is
a progressive enhancement: without JavaScript every section and example stays
reachable. Catalog behavior lives in native ES modules: `catalog.js` only
composes `catalog-navigation.js`, `catalog-search.js`, `catalog-demos.js` and
`demo-code.js`. Examples remain static HTML. Deep links stay aligned while the
icon gallery loads, and stop correcting as soon as the reader scrolls.

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
The base badge is borderless too; only a badge that is a link or button
(`a.tg-badge[href]`, `button.tg-badge`) gets an outline (see Outline semantics). Direct avatar
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
and danger. Surface, state and readable foreground roles are derived from these
inputs. Only ten derived palette declarations may contain `color-mix()`, all in
tokens. Components and catalog styles use aliases only. Readable accent and danger
foregrounds are theme-aware; saturated action fills remain unchanged.
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


## Core cascade contract

The core is editable. Source files are not frozen to a historical commit. Refactoring
must preserve the current visual language, public tg-* classes and behavior unless
the user explicitly requests a visual change. Visual regression tests compare rendered
styles and catalog pixels with the captured reference; they do not require source equality.

Tokens and themes own system values. Base owns typography inheritance, focus, visibility
and the shared control-state engine (components/control-states). Components own geometry
and expose state parameters; variants change parameters rather than duplicate hover paint
and transitions. Utilities remain the final presentation layer before native visibility.

Former extensions are part of their owners: buttons, forms, avatar and compositions.
components/extensions and components/control-hover remain compatibility entry points;
they do not append corrective styles after the component system.

The catalog markup, original preview, avatar stack, global accent and optional JS effects
are preserved. One root accent applies to all examples. Independent SCSS imports retain
their foundations. Existing palette roles, typography, radii and control sizes are unchanged.

## Decorative effects

Effects (`.tg-effect-*`, `data-tg-effect`, `.tg-effect-layer`) are the only place for
expression beyond the Operate mode, and they are always optional: one key button, card or
section per screen, never in working forms or Telegram Mini Apps by default. They use the
accent roles and the overlay text role as a neutral highlight, sit behind content so text
contrast does not change, animate only transform, opacity or a registered angle, stay still
on touch screens and with reduced motion, and switch off for disabled or busy hosts. Without
`effects.js` every host looks like the plain component.
