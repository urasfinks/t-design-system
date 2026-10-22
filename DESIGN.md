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
- Source color variables remain exact. Derived semantic roles provide readable
  secondary text, links, destructive text and action fills. Components consume
  these roles rather than inventing their own contrast adjustments.
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
