# Bottom panel implementation plan

Goal: provide a reusable nonmodal bottom panel with replaceable header and body.
Architecture: CSS-only public classes, native details/summary or an application-controlled button and hidden body. Fixed positioning, sticky header, bounded scrolling and existing theme tokens. No framework or runtime dependency.

- [x] Add browser regression covering fixed bottom, expansion via keyboard, bounded long content, visible header while scrolling, controlled markup, narrow layouts and all themes.
- [x] Run regression against existing CSS and confirm missing fixed positioning fails.
- [x] Add src/components/_bottom-panel.scss and include in src/index.scss.
- [x] Add live catalog example, standalone viewport demo, HTML and Angular documentation. Use arbitrary content in the demo.
- [x] Build and run unit tests plus regression in Chromium and WebKit. Inspect screenshots and diff.

Public API: tg-bottom-panel, __header, __content, __chevron; --bottom-panel-max-height, --bottom-panel-width, --bottom-panel-offset. Native open or application-managed aria-expanded and hidden control state. Applications reserve collapsed header space in page padding.

Validation: npm test passes 15 tests; bottom-panel.browser passes Chromium and WebKit. Full Chromium suite passes the new panel and composition checks, then stops on the existing desktopDark fixture mismatch (#18222d expected vs #151e27 configured in HEAD).
