# Фактическое оформление интерфейсов

Покрытие: [style-reality.json](../architecture/style-reality.json). Полные данные генерируются локально в artifacts/style-reality/data.json.gz (исключены из Git из-за объёма). Обновление: npm run graph:reality. Проверка исходников: npm run check:style-reality.

30 контекстов; 26172 экземпляров; 2026 CSS-правил; 12990 уникальных computed-профилей. Представлено 521/612 объявленных классов.

CSSOM сохраняет порядок, условия, вложенность и все объявления. Экземпляры содержат полный getComputedStyle, контекст родителя и inline-стили. Это фактические данные для проверки нормативного [SSOT](style-graph.md); наличие свойства в правиле ещё не доказывает, что именно оно выиграло каскад.

## Проверено

- All loaded CSSOM rules and their declarations, nested conditions and order
- Full computed property lists for all tg-* instances, including initial hidden states
- Generated ::before and ::after computed property lists
- Parent context, attributes and inline styles in 30 theme/viewport/page contexts

## Пока не проверено

- Exhaustive hover, focus, active and drag state combinations
- All open dialogs, popovers and dynamically created content
- RTL, browser engines other than Chromium, additional widths and contrast preferences
- Animation intermediate frames and all application-specific host overrides

## Классы без экземпляров

`.tg-accordion--separate`, `.tg-align-center`, `.tg-avatar-undefined`, `.tg-banner--sticky`, `.tg-block`, `.tg-bottom-panel__content`, `.tg-bottom-panel__header`, `.tg-btn-box`, `.tg-btn-s0`, `.tg-btn-s1`, `.tg-btn-s2`, `.tg-btn-s3`, `.tg-card-border-radius`, `.tg-card-shadow`, `.tg-card-shadow-none`, `.tg-carousel--fan`, `.tg-carousel--ring`, `.tg-carousel__count`, `.tg-chart__label--muted`, `.tg-command__group`, `.tg-command__group-label`, `.tg-command__item`, `.tg-command__meta`, `.tg-command__shortcut`, `.tg-command__text`, `.tg-comment__recipient`, `.tg-component-size`, `.tg-container--reading`, `.tg-divider-transparent`, `.tg-fade-in`, `.tg-fade-out`, `.tg-feedback-host`, `.tg-feedback-layer`, `.tg-gap-0`, `.tg-gap-5`, `.tg-gap-space-1`, `.tg-gap-space-2`, `.tg-gap-space-3`, `.tg-glass--backdrop`, `.tg-h-full`, `.tg-header-secondary`, `.tg-icon--lg`, `.tg-icon--sm`, `.tg-icon-btn--pill`, `.tg-ios-spacer`, `.tg-justify-center`, `.tg-list-item--wrap`, `.tg-list-item-border-dashed`, `.tg-list-item-break`, `.tg-listbox__empty`, `.tg-listbox__group`, `.tg-marquee--vertical`, `.tg-mb-1`, `.tg-mb-4`, `.tg-mb-5`, `.tg-message__meta`, `.tg-mt-6`, `.tg-no-events`, `.tg-no-radius-bottom`, `.tg-no-radius-top`, `.tg-no-select`, `.tg-p-1`, `.tg-p-2`, `.tg-p-3`, `.tg-p-5`, `.tg-p-6`, `.tg-price__old`, `.tg-requirements--invalid`, `.tg-ripple`, `.tg-ripple--dark`, `.tg-ripple--inline`, `.tg-ripple--light`, `.tg-ripple__ring`, `.tg-ripple__wash`, `.tg-ripple__wave`, `.tg-row-valign-top`, `.tg-section`, `.tg-section__title`, `.tg-sidebar--collapsed`, `.tg-snackbar--show`, `.tg-source-link`, `.tg-switch--on`, `.tg-tabs--responsive`, `.tg-tabs-s0`, `.tg-tabs-s1`, `.tg-tabs-s2`, `.tg-text-destructive`, `.tg-text-nowrap`, `.tg-toast__close`, `.tg-upload--disabled`, `.tg-upload__actions`

Полнота пока частичная. Нельзя объявлять граф полным отражением интерфейса, пока не закрыты перечисленные состояния и пробелы покрытия. Проверка fingerprint обнаруживает изменения источников; она не заменяет повторное измерение браузером.
