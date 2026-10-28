# Полная реализация компонентов — план

> **Для исполнителя:** superpowers:executing-plans. Шаги отмечаются `- [x]` сразу после
> выполнения. Коммитов нет: владелец коммитит один раз в конце.

**Цель:** реализовать в TDS все 110 компонентных спецификаций из
`references/21st-dev-1000/images/*/components.md` и показать их в `docs/index.html`.

**Архитектура:** строгий каскад `tds.reset → tokens → themes → base → components →
utilities → visibility`. Общие движки (миксины на уровне компонентов, как
`components/field-surface`) дают геометрию и поведение семействам компонентов; компонент
только задаёт параметры. Поведение примеров — в `docs/*.js`.

**Стек:** Sass 1.93, ванильный JS-модуль, Playwright 1.62 (Chromium; WebKit — у владельца).

**Спецификация:** `docs/superpowers/specs/2026-10-27-full-component-implementation-design.md`

## Как продолжить после сбоя

1. Открыть этот план и найти первую задачу с неотмеченными шагами.
2. `node scripts/verify-implementation.mjs` печатает сводку по волнам и первую
   незавершённую спецификацию; реестр — `references/21st-dev-1000/implementation.json`.
3. Продолжить с первой неотмеченной галочки. Шаг «реестр → done» последний в задаче,
   поэтому `todo` в реестре значит «задачу нужно проверить и довести».

## Общие ограничения

- Только 10 токенов с `color-mix` (в tokens); в компонентах и `catalog.css` — ни одного.
- Без `!important`. В `_buttons.scss` нет `:hover` и `transition:`.
- Hover только через `components/control-states` (`--control-idle-bg`,
  `--control-hover-bg`, `--control-hover-filter`, `--control-paint-duration`).
- Каждый модуль компонента компилируется отдельным `@use`.
- Новые системные значения — только в `src/tokens/_index.scss`; цвета — только роли
  палитры (`--accent-*`, `--danger-*`, `--text-*`, `--background-*`, `--border-*`).
- Контролы ≥ 44 px (`--control-h`), радиус контрола `--radius-control`, вложенный
  `--radius-inset`; логические свойства; RTL и `prefers-reduced-motion` у каждого компонента.
- Движение: `transform`/`opacity`, 150–250 ms, ease-out, выход быстрее входа, с клавиатуры
  мгновенно; без анимации ширины/высоты.
- Пример каталога: `.example-panel > .example-body[data-spec="ID"]` → `p.example-rule` →
  блок HTML; поля с `name`, код с `translate="no"`.
- Прежний каталог (фикстура `tests/fixtures/cascade-baseline/index.html`) рендерится
  пиксель в пиксель одинаково с эталонным и текущим CSS.
- Без коммитов и без удаления файлов в репозитории владельца.

## Где сломается у человека (Review Focus)

1. Узкий экран 320 px: длинные подписи, плавающие слои у края → без горизонтальной
   прокрутки, слой не выходит за экран. Проверяется общим тестом волны на 320/390/1440.
2. Клавиатура: всплывающие слои (подсказка, listbox, combobox, палитра, мега-меню,
   menubar) — Escape закрывает и возвращает фокус, Tab не теряется. Тест каждого слоя.
3. Тёмные темы и ios-dark: мягкие акцентные фоны (диапазон дат, выбранные карточки,
   расписание) сохраняют контраст текста ≥ 4.5:1. Общий тест волны проверяет контраст.
4. Пользовательский акцент `--button-color`: выбранные состояния и графики следуют
   акценту, а не захардкоженному цвету. Тест волны ставит акцент #7151c7.
5. RTL: шевроны, полосы диапазонов, линии хронологии и оглавления зеркалятся.

## Файлы

- `src/components/_floating.scss` — миксины всплывающего слоя (поверхность, вход/выход,
  нижний лист). Потребители: `_menu.scss`, подсказка, hover-card, listbox, палитра,
  мега-меню, toast-регион.
- `src/components/_option.scss` — миксин строки-варианта 44 px. Потребители: пункты меню,
  listbox, палитра команд, sidebar, оглавление, мега-меню.
- `src/components/_selected.scss` — миксины «выбрано» (мягкий акцент + рамка) и «нажато».
- `src/components/_steps.scss` — миксины маркера и соединительной линии.
- `src/components/_track.scss` — миксин дорожки прокрутки со snap и маской краёв.
- Новые модули компонентов: `_overlays.scss` (tooltip, hover-card, toast-region, banner,
  command), `_pickers.scss` (listbox, combobox, tag-input, number, otp, calendar, wheel,
  color, emoji), `_progress.scss` (ring, timeline, stepper, schedule, agent-step),
  `_carousel.scss` (carousel, marquee, image-accordion, card-stack, compare, player),
  `_charts.scss`, `_editor.scss`; расширения — в существующих владельцах.
- Демо: `docs/catalog-components.js` (поведение новых примеров, по функции на виджет).
- Тесты: `tests/components-wave-N.browser.mjs` (по волне), общий помощник
  `tests/helpers/spec-checks.mjs` (присутствие, контраст, переполнение, имена).
- `scripts/verify-implementation.mjs`, `references/21st-dev-1000/implementation.json`.

---

## Волна 0. Основа

### Задача 0.1: эталон проверяет только прежнее содержимое

**Файлы:** `tests/fixtures/cascade-baseline/index.html` (новый), `manifest.json`,
`tests/baseline-compatibility.browser.mjs`, `tests/baseline-compatibility.test.mjs`,
`docs/baseline-restoration.md`.

- [x] Скопировать текущий `docs/index.html` в фикстуру; добавить его sha256 в
  `manifest.files`; удалить `catalogHTMLSHA256`.
- [x] Браузерный тест читает разметку из фикстуры, а не из `docs/index.html`.
- [x] Юнит-тест: вместо суммы `docs/index.html` проверяет, что каждый `id` раздела и
  каждый текст `p.example-rule` фикстуры есть в текущем каталоге.
- [x] Прогнать оба теста — зелёные.

### Задача 0.2: реестр и скрипт сверки

- [x] `implementation.json`: 192 записи `{id, folder, name, type, priority, scope:
  "in"|"out", wave, state: "todo"|"done", classes: [], test}`; 110 `in`.
- [x] `scripts/verify-implementation.mjs`: для `in` + `done` — классы в
  `dist/t-design-system.css`, `data-spec` с ID в каталоге, ID упомянут в `tests/*`;
  сводка по волнам; первая незавершённая; выход 0 только при 110/110.
- [x] Юнит-тест `tests/implementation-registry.test.mjs`: реестр согласован со
  спецификациями (192 ID, 110 в работе), у `done` выполнены проверки скрипта.
- [x] Проставить `data-spec` уже готовым примерам (A1 A4 B2 B5 B7 B14 C1 C6 D1 D2 D4 F2
  F3 F11 F12 FT1 M1 M2 M5 M6 M13 N4 N9 N12), отметить их `done`.

### Задача 0.3: движок всплывающего слоя + B15 подсказка

**Интерфейс:** `@include floating.surface;` `@include floating.motion($open-selector);`
`@include floating.sheet;` параметры хоста `--tg-anchor-block`, `--tg-anchor-inline`,
`--tg-float-origin` (меню сохраняет `--tg-menu-origin` как алиас).

- [x] Вынести из `_menu.scss` поверхность и движение в `_floating.scss`; меню — потребитель;
  эталон без изменений.
- [x] `.tg-tooltip[popover]`, `data-side="top|bottom|inline-start|inline-end"`, поверхность
  `--overlay-bg`/`--overlay-text`, `--fs-sm`, `--radius-sm`; задержка показа в демо 500 ms.
- [x] Пример (раздел «Кнопки»), демо: hover/focus показывает, Escape скрывает.
- [x] Тест: позиция по сторонам, Escape, `aria-describedby`, контраст в 3 темах.
- [x] Реестр B15 → done.

### Задача 0.4: движок строки-варианта

**Интерфейс:** `@include option.row;` (44 px, gap, радиус inset, ведущая иконка),
`@include option.mark($side: start|end)` (галочка маской), `@include option.active`
(подсветка `--control-hover-bg` + кольцо).

- [x] Перевести `.tg-menu__item` на движок без изменения вычисленных стилей.
- [x] Тест архитектуры: меню использует `option`.

### Задача 0.5: движок выбранного состояния + B8 сегменты

**Интерфейс:** `@include selected.soft;` (фон `--accent-soft`, текст `--accent-readable`),
`@include selected.ring;` (рамка 2 px `--accent-main` без сдвига размера).

- [x] `.tg-segmented`, `__item` (радио или `button[aria-pressed]`), `--vertical`; выбранная
  плашка `--background-raised` + `--shadow-control` на подложке `--background-muted`.
- [x] Пример (раздел «Фильтры и статусы»), тест: клавиши стрелок у радио, контраст, RTL.
- [x] Реестр B8 → done.

### Задача 0.6: движок шагов

**Интерфейс:** `@include steps.marker($size)`, `@include steps.line($axis)`, состояния
`data-state="done|current|upcoming|error"`.

- [x] Модуль и тест архитектуры; потребители появляются в волне 1 (C11, F28).

### Задача 0.7: ворота волны 0

- [x] Сборка, `npm test`, все браузерные тесты, сверка, скриншоты новых примеров.

## Волна 1. Примитивы

Каждая задача: CSS во владельце → пример с `data-spec` → тест в
`tests/components-wave-1.browser.mjs` → реестр `done`.

- [x] **1.1 M15** `.tg-kbd` (`--font-family-mono`, `--fs-sm`, `--background-muted`,
  `--border-subtle-color`, `--radius-xs`, min 1.5em); `.tg-menu__shortcut` использует его вид.
- [x] **1.2 M8** `.tg-progress-ring` (`__track`, `__value`, `__label`; `--value` 0…100,
  размеры 24/40/64 через `--ring-size`; неопределённый — вращение).
- [x] **1.3 C11 + M10** `.tg-timeline`, `__item`, `__marker`, `__time`, `__content`,
  `--horizontal` (прокрутка в оболочке).
- [x] **1.4 F28 + M9** `.tg-stepper`, `__step`, `__marker`, `__label`, `__description`,
  `--vertical`; `aria-current="step"`.
- [x] **1.5 B9** `.tg-btn-group`, `--attached`, `.tg-split-btn` (`__main`, `__menu`).
- [x] **1.6 B13** `.tg-toolbar--floating`, `.tg-toolbar__separator`.
- [x] **1.7 B4** `.tg-copy`, `__value`, `__action`, `data-state="copied|error"`.
- [x] **1.8 M3 + B17** `.tg-toast-region` (стек до 3, раскрытие по hover/focus),
  `.tg-toast__title`, `__action`, `__close`.
- [x] **1.9 S2** `.tg-divider--label`.
- [x] **1.10 CT1** `.tg-banner`, `--accent`, `--sticky`, `__content`, `__action`, `__dismiss`.
- [x] **1.11 C2** `.tg-card--overlay`, `.tg-card__media--video`.
- [x] **1.12 C17** раскрывающаяся карточка `details.tg-card.tg-disclosure` + переход в
  `dialog` через View Transitions как улучшение.
- [x] **1.13 Доводка:** N1 `.tg-tabs--segmented`; F1 `.tg-label__required`; M7
  `.tg-progress--destructive`; примеры B17, M7, M19 с `data-spec`.
- [x] **1.14 Ворота волны 1.**

## Волна 2. Выбор и ввод

- [x] **2.1 F8** `.tg-listbox-trigger`, `.tg-listbox`, `__option`, `__option-meta`
  (движки floating + option; галочка в конце).
- [x] **2.2 F9** `.tg-combobox`, `__input`, `__list`; мультивыбор с тегами F10.
- [x] **2.3 F10** `.tg-tag-input`, `__tag`, `__remove`, `__field` (поверхность field-surface).
- [x] **2.4 F14** `.tg-choice-card`, `__media`, `__title`, `__description`, `__indicator`
  (`selected.ring` через `:has(:checked)`).
- [x] **2.5 F4** `.tg-number`, `__step`, `__input`, `--pill`.
- [x] **2.6 F5** `.tg-otp`, `__input`, `__slot[data-active]`, `__separator`.
- [x] **2.7 F18** `.tg-range-field`, `__output`, `.tg-range-dual` (`--range-start`,
  `--range-end`).
- [x] **2.8 F19** `.tg-upload__list`, `__item[data-state]`.
- [x] **2.9 C5** `.tg-hover-card`, `__trigger` (floating, 500/300 ms).
- [x] **2.10 D3** `.tg-table-toolbar`.
- [x] **2.11 Примеры:** F1, F6, F7, F13, F16, F17 с `data-spec`.
- [x] **2.12 Ворота волны 2.**

## Волна 3. Навигация и структура

- [x] **3.1 Движок дорожки** `_track.scss` + **M22** `.tg-scroll-fade`.
- [x] **3.2 N16** `.tg-carousel`, `__viewport`, `__slide`, `__controls`.
- [x] **3.3 G1** `.tg-carousel--peek`, `__thumbs`, `--vertical`.
- [x] **3.4 N10** `.tg-command`, `__input`, `__list`, `__group`, `__item`, `__shortcut`,
  `__footer` (в `dialog`).
- [x] **3.5 N11** `.tg-sidebar`, `__header`, `__section`, `__link`, `__footer`, `--collapsed`.
- [x] **3.6 N5** `.tg-nav-menu`, `__trigger`, `__panel`, `__group`, `__link`.
- [x] **3.7 N3** `.tg-tabs--vertical`.
- [x] **3.8 N2** `.tg-tabs--collapsed-labels`, `.tg-tab__label`.
- [x] **3.9 N13** `.tg-toc`, `__link`, `__link--nested`.
- [x] **3.10 N8** `.tg-menubar`, `__item`.
- [x] **3.11 Примеры:** N6, N14.
- [x] **3.12 Ворота волны 3.**

## Волна 4. Дата и время

- [x] **4.1 F20** `.tg-date-field`, `__segment` (+ нативные `input[type=date|time]`).
- [x] **4.2 F21** `.tg-calendar`, `__header`, `__grid`, `__day`, `__day--today`,
  `__day--outside`, `__event-dot` (полный клавиатурный контракт grid в демо).
- [x] **4.3 F22** `.tg-calendar--range`, `__day--range-start`, `__day--in-range`,
  `__day--range-end`, `__presets`.
- [x] **4.4 Ворота волны 4.**

## Волна 5. Данные

- [x] **5.1 D7** `.tg-chart`, `__header`, `__plot`, `__legend`, `__legend-item`,
  `__tooltip`, `__data` (`--series` только роли).
- [x] **5.2 D8** `.tg-chart--bar`.
- [x] **5.3 D9** `.tg-chart--donut`, `__center`.
- [x] **5.4 D6** `.tg-sortable`, `__item`, `__handle`.
- [x] **5.5 M11** `.tg-schedule`, `__axis`, `__row`, `__event`.
- [x] **5.6 C16** `.tg-grid--bento` (`--span`, `--row-span`).
- [x] **5.7 Примеры:** D5, C12.
- [x] **5.8 Ворота волны 5.**

## Волна 6. Ассистент, текст, карточки контента

- [x] **6.1 A5** `.tg-agent-step`, `__icon`, `__label`, `__time`, `__detail` (steps).
- [x] **6.2 A6** `.tg-approval`, `__title`, `__description`, `__options`, `__actions`.
- [x] **6.3 T1** `.tg-editor`, `__toolbar`, `__content`, `__status`, `__block[aria-selected]`.
- [x] **6.4 T2** `.tg-selection-toolbar` (floating, `--anchor-x/--anchor-y`).
- [x] **6.5 TS1** `.tg-testimonial`, `__quote`, `__author`, `__rating`, `__media`.
- [x] **6.6 PR2** `.tg-card--featured`, `.tg-price`, `.tg-feature-list`, `__item--off`.
- [x] **6.7 Примеры:** B1, B3, B16.
- [x] **6.8 Ворота волны 6.**

## Волна 7. Продвинутые P2

- [x] **7.1 B6** `.tg-hold-btn` (`--hold-progress`), `.tg-slide-confirm`.
- [x] **7.2 B12** `.tg-fab`, `--extended`, `.tg-fab-menu`, `__list`, `__item`.
- [x] **7.3 F24** `.tg-wheel`, `__column`, `__option` (track).
- [x] **7.4 F25** `.tg-color-field`, `.tg-color-picker`.
- [x] **7.5 F26** `.tg-emoji-picker`, `__search`, `__grid`, `__option`.
- [x] **7.6 F33** `.tg-selection-box`, `.tg-waveform`.
- [x] **7.7 C15** `.tg-card-stack`, `__item`, `__controls`.
- [x] **7.8 C21** `.tg-player`, `.tg-compare`.
- [x] **7.9 G4** `.tg-image-accordion`, `__item`, `__trigger`, `__panel`.
- [x] **7.10 TS4** `.tg-marquee`, `__track`, `--vertical`, `__pause`.
- [x] **7.11 Ворота волны 7.**

## Волна 8. Эффекты

- [x] **8.1 SH1** `.tg-effect-layer`, `data-tg-effect`, `--effect-intensity`.
- [x] **8.2 B19 + SH2** `.tg-effect-glow`, `-sheen`, `-border-beam`, `-magnetic`;
  `data-tg-effect` на `.tg-btn`.
- [x] **8.3 C18** `.tg-effect-tilt`, `-glare`, `-spotlight`.
- [x] **8.4 F32** свечение фокуса поля.
- [x] **8.5 G2** `.tg-carousel--coverflow`, `--fan`, `--ring`.
- [x] **8.6 SH3** `data-tg-effect="orb"` у аватара; **SH4** `data-tg-effect="ripple"` у карусели.
- [x] **8.7 Ворота волны 8 и финал:** README, DESIGN.md, `docs/component-standard.md`,
  сверка 110/110, полный прогон, итог для владельца.
