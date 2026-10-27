# Кнопки и действия — спецификации компонентов

## Назначение категории

Папка `buttons` (169 превью) собирает всё, что запускает действие: обычные кнопки и их
варианты, переключатели, группы, плавающие действия, меню, подсказки и панели
инструментов. Около трети превью — декоративные трактовки одной и той же кнопки
(свечение, металл, частицы), а часть файлов по факту относится к карточкам, формам,
диалогам и навигации. Документ сводит всё это к небольшому набору контрактов TDS:
базовую `.tg-btn` расширяем, а не дублируем, и вводим новые компоненты только там,
где меняются семантика или клавиатурный контракт.

## Сводная таблица

| Компонент / паттерн | Тип работы | Референсов | Приоритет |
| --- | --- | ---: | --- |
| B1. Базовая кнопка и варианты | `existing` | 31 | `P0` |
| B2. Кнопка с иконкой и подтекстом | `extend` | 11 | `P0` |
| B3. Иконкокнопка | `existing` | 5 | `P0` |
| B4. Кнопка копирования | `extend` | 3 | `P1` |
| B5. Кнопка с ходом выполнения | `extend` | 4 | `P0` |
| B6. Подтверждение удержанием или свайпом | `new` | 4 | `P2` |
| B7. Кнопка-переключатель | `extend` | 9 | `P0` |
| B8. Сегментированный выбор | `new` | 4 | `P1` |
| B9. Группа кнопок и сплит-кнопка | `new` | 3 | `P1` |
| B10. Переключатель темы | `composition` | 8 | `P1` |
| B11. Кнопка со счётчиком | `composition` | 3 | `P1` |
| B12. Плавающая кнопка и меню быстрых действий | `new` | 7 | `P2` |
| B13. Панель инструментов и dock | `extend` | 7 | `P1` |
| B14. Меню действий | `new` | 7 | `P0` |
| B15. Подсказка | `new` | 6 | `P1` |
| B16. Диалог и выдвижная панель | `existing` | 8 | `P0` |
| B17. Toast, snackbar и баннер-уведомление | `existing` | 5 | `P1` |
| B18. Промо-баннер с действием | `composition` | 3 | `P2` |
| B19. Декоративные эффекты кнопок | `extend` | 24 | `P2` |
| B20. Карточки из раздела кнопок | `composition` | 7 | `P1` |
| B21. Формы и загрузка из раздела кнопок | `composition` | 7 | `P1` |
| B22. Навигация из раздела кнопок | `composition` | 3 | `P1` |

## Общие решения категории

- **Геометрия.** Все действия используют `--control-h` (44–48 px), радиус `--radius-control`
  (12 px), внутренний радиус вложенных контролов `--radius-inset` (8 px). Капсула —
  только явным `--pill`. Размеры `--sm`/`--lg` меняют типографику и ширину, но не
  опускают высоту ниже 44 px.
- **Цвет.** Только роли: `--accent-strong` для primary, `--danger-strong` для destructive,
  `--action-border-color` для обводки secondary/icon, `--text-main` для ghost. Градиенты,
  неоновые и металлические заливки из референсов в палитру не переносятся.
- **Рамка = действие.** Secondary и icon-кнопки обведены, primary/destructive залиты,
  ghost опирается на цвет текста и контекст. Статус, похожий на кнопку, остаётся `span`.
- **Нажатие.** Волна из `ui.js` подключается один раз для всех кнопок; CSS работает без
  неё. Нажатие длится ≤ 300 ms, анимируются только `transform` и `opacity`.
- **Hover.** Только под `(hover: hover) and (pointer: fine)` через общий движок
  `components/control-states` (`--control-idle-bg`, `--control-hover-bg`).
- **Иконки.** Feather 24×24, stroke 2, роли 16/20/24 px, `aria-hidden="true"`; имя
  действия всегда текстом или `aria-label`.
- **Нативность.** `<button type="button">` для действий на странице, `<a href>` для
  переходов, `<button type="submit">` в формах. Неактивное — `disabled`;
  `aria-disabled` только когда кнопка должна оставаться в порядке фокуса и есть
  объяснение рядом.
- **Ответственность.** TDS даёт оформление, раскладку и ARIA-контракт; приложение —
  обработчики, асинхронные запросы, смену ARIA-состояний, буфер обмена, роутинг.

## Спецификации компонентов

### B1. Базовая кнопка и варианты

Статус: `existing` · Приоритет: `P0` · Классы: `.tg-btn`, `--primary`, `--secondary`,
`--ghost`, `--destructive`, `--sm`, `--lg`, `--pill`, `--stacked`

**Назначение**: основное действие в интерфейсе. Для одного значка без текста — B3,
для включённого/выключенного состояния — B7, для перехода по ссылке — `a.tg-btn[href]`.

**Состав**: контейнер `button`/`a`; необязательная ведущая иконка; текст; необязательная
замыкающая иконка или `.tg-spinner`.

```html
<div class="tg-toolbar">
  <button class="tg-btn tg-btn--primary" type="submit">Сохранить</button>
  <button class="tg-btn tg-btn--secondary" type="button">Отмена</button>
  <button class="tg-btn tg-btn--ghost" type="button">Подробнее</button>
  <button class="tg-btn tg-btn--destructive" type="button">Удалить</button>
</div>
```

**API**: существующий; новых классов не требуется. `--pill` применяется к ряду
кнопок целиком, а не к одной кнопке в ряду.

**Варианты из референсов**: ряды «Default / Secondary / Outline / Ghost / Link /
Destructive» (24, 27, 83, 159, 166) прямо совпадают с текущими модификаторами;
«Outline» = `--secondary`, «Link» = `a.tg-link`. Тёмные, белые и капсульные кнопки
на тёмном фоне (19, 25, 92, 161) — та же кнопка в тёмной теме. «Subscribe»,
«Continue» внутри фразы (62, 106) — обычная primary в строке текста. Пара «Reject / Approve» (111) — destructive и primary с иконками статуса.

**Состояния**: default, hover, focus-visible, active (`data-pressed`), disabled,
loading (`aria-busy="true"` — подробнее в B5).

**Поведение и ответственность приложения**: обработчик клика; отмена двойной
отправки на время запроса; при переходе — `a href`, не `button` с `location`.

**Адаптивность**: длинная подпись переносится и увеличивает высоту; в `.tg-toolbar--responsive`
кнопки растягиваются на всю ширину до 36rem; порядок primary — в конце строки в
LTR, на мобильном — сверху стека, если используется `--stacked`.

**Доступность**: видимый фокус `--focus`; контраст текста ≥ 4.5:1 во всех трёх темах;
disabled использует `--disabled-opacity`, причина недоступности написана рядом.

**Токены и связь с TDS**: `--control-h`, `--radius-control`, `--accent-strong`,
`--danger-strong`, `--action-border-color`, `--duration-fast`, `--ease`.

**Критерии готовности**: варианты из референсов воспроизводятся без новых классов;
визуальная регрессия каталога не меняется.

**Референсы** (31):

- `codehagen--action-button--93073f03.webp` — Action Button
- `bundui--button--f96c7fbe.webp` — Animated Shadcn Button
- `abishek1512--button-1--6d00ab9e.webp` — Button
- `beratberkayg--button-1--9ec7e976.webp` — Button
- `lipa88-mk--button--e65aea99.webp` — Button
- `micka-design--button--f61f1d89.webp` — Button
- `preetsuthar17--button--cb3b445b.webp` — Button
- `senommu--button--cee25349.webp` — Button
- `shadcn--button--d9052647.webp` — Button
- `sudharshanpanidev--button--6b0e9bc8.webp` — Button
- `prebuiltui--button-ui--ee1962ef.webp` — Button Ui
- `jolbol1--button--59c7afdb.webp` — Button [react-aria-components]
- `motiondotdev--motion-create-button--b751f0a0.webp` — Create Button
- `moumensoliman--delete-button--e662d364.webp` — Delete Button
- `iamsatish4564--eclipse-button--24ec5a04.webp` — Eclipse Button
- `mirukullacode--expand-input--c7df6350.webp` — Expand Input
- `saurabh-2607--great-ui-minimal-buttons--15f9d954.webp` — Great UI Minimal Buttons
- `moazamtrade--hover-animation-button--3287cbea.webp` — Hover animation Button
- `abhishek-mallick--iso-button--04438e10.webp` — Iso Button
- `johuniq--joly-button--9e7586fa.webp` — Joly Button
- `edwinvakayil--new-button--4419b33c.webp` — New Button
- `nextjsshop--nextjsshop-button--296e6f9f.webp` — Nextjsshop Button
- `shadcnspace--button-23--4852e3a3.webp` — Permissions Button
- `tom-ui--rich-button--4b165c6e.webp` — Rich Button
- `adurotimi--save-button--bee4e10b.webp` — Save Button
- `educalvolpz--smooth-button--83e99286.webp` — Smooth Button
- `saurabh-2607--button--576b2533.webp` — Button
- `uilayout-contact--button-2--26d56ed2.webp` — Button
- `uilayout-contact--button-5--c44b65e9.webp` — Button
- `maxim-bort-devel--chronicle-button--edab710b.webp` — Chronicle Button
- `saurabh-2607--minimal-buttons--55f539b6.webp` — Minimal Buttons

### B2. Кнопка с иконкой и подтекстом

Статус: `extend` · Приоритет: `P0` · Классы: `.tg-btn` + предлагаемые
`.tg-btn__icon`, `.tg-btn__label`, `.tg-btn__subtext`, `.tg-btn--icon-end`

**Назначение**: действие, которому иконка добавляет смысл (позвонить, отправить,
открыть файл), или крупное действие с поясняющей второй строкой. Не для навигационных
пунктов меню — там B14.

**Состав**: обязательный текст; иконка в начале или в конце; необязательная вторая
строка (подтекст) 14 px `--text-secondary`.

```html
<button class="tg-btn tg-btn--primary" type="button">
  <svg class="tg-icon tg-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
    <use href="dist/icons/phone.svg#phone"></use>
  </svg>
  <span class="tg-btn__label">Заказать звонок</span>
</button>

<button class="tg-btn tg-btn--secondary tg-btn--lg" type="button">
  <svg class="tg-icon tg-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
    <use href="dist/icons/download.svg#download"></use>
  </svg>
  <span class="tg-btn__label">Скачать отчёт
    <span class="tg-btn__subtext">PDF, 2,4 МБ</span>
  </span>
</button>
```

**API** (предлагаемое): `__icon` выравнивает и задаёт размер 20 px; `__label` —
колонка текста; `__subtext` — вторая строка; `--icon-end` переносит иконку в конец
с учётом RTL (зеркалирование стрелок через `:dir(rtl)`).

**Варианты из референсов**: стрелка в круге справа (21, 33) — `--icon-end` с иконкой
в `--radius-pill` подложке внутри `--pill` кнопки; «Get Figma File» (66) — бренд-иконка
слева; подтекст «Download / 24 MB» (164) — `__subtext`; «Send» (167) — иконка слева; «Accept ⌘» (93) — сочетание клавиш в `kbd` после подписи; «Share» (127) — иконка + подпись, раскрытие в набор сетей реализуется меню B14.
Анимация смещения стрелки при hover (5, 6, 77) — `transform: translateX` иконки,
отключается при reduced motion.

**Состояния**: default, hover (иконка-стрелка смещается на 2 px), focus-visible,
active, disabled, loading (иконка заменяется на `.tg-spinner`, ширина сохраняется).

**Поведение и ответственность приложения**: выбирает иконку и подтекст; размер
файла и подобные данные приходят от приложения.

**Адаптивность**: подтекст переносится; при ширине < 320 px иконка остаётся, текст
не обрезается многоточием.

**Доступность**: иконка `aria-hidden`; подтекст входит в доступное имя — если он
длинный, вынести в `aria-describedby`.

**Токены и связь с TDS**: `--icon-size`, `--icon-stroke`, `--space-2`, `--fs-sm`,
`--text-secondary`.

**Критерии готовности**: иконка и подпись выровнены по базовой линии при 200%
тексте; RTL меняет сторону иконки и направление стрелки.

**Референсы** (11):

- `nextjsshop--animated-arrow-button--808b5003.webp` — Animated Arrow Button
- `shailendrakumar19999--animated-button--83444bdc.webp` — Animated Button
- `jatin-yadav05--book-a-call-button--304531ab.webp` — Book A Call Button
- `cnippet-dev--button--2b6f7946.webp` — Button
- `shadcnspace--button-witn-icon--f82c1a85.webp` — Button witn Icon
- `shadcnspace--figma-file-button--c4d59ae9.webp` — Figma File Button
- `vaib215--flow-hover-button--34c389d5.webp` — Flow Hover Button
- `uiable--kbd-button--17dd2d40.webp` — Kbd Button
- `shatlyk1011--social-button--8f8c4611.webp` — Social Share Button
- `ruixen-ui--icon-label-subtext-button--472248e9.webp` — Icon Label Subtext Button
- `m-umairwaheedansari--send-button--120df632.webp` — Send Button

### B3. Иконкокнопка

Статус: `existing` · Приоритет: `P0` · Классы: `.tg-icon-btn`, `--primary`, `--ghost`, `--pill`

**Назначение**: компактное действие с общеизвестной иконкой (закрыть, прикрепить,
голос, прокрутка вниз, назад/вперёд). Если иконка неочевидна — B2 с подписью.

**Состав**: `button` + одна иконка; видимая область может быть меньше, область
нажатия — не меньше 44×44 px.

```html
<button class="tg-icon-btn" type="button" aria-label="Прикрепить файл">
  <svg class="tg-icon" viewBox="0 0 24 24" aria-hidden="true">
    <use href="dist/icons/paperclip.svg#paperclip"></use>
  </svg>
</button>
```

**API**: существующий. Для иконки-переключателя меню (101: «гамбургер → крестик»)
используется `aria-expanded` и замена иконки, а не морфинг SVG.

**Варианты из референсов**: круглые стрелки (103) — `--pill`; кнопка «вниз» в
ленте (120) — `--pill` поверх контента со `--shadow-overlay`; голосовой ввод (152)
и вложение (12) — `--ghost` в композере.

**Состояния**: default, hover, focus-visible, active, disabled, `aria-pressed`/`aria-expanded`
при переключающем поведении.

**Поведение и ответственность приложения**: показывает кнопку «вниз» только когда
лента не прокручена до конца; управляет `aria-expanded` у меню.

**Адаптивность**: размер не меняется; в плотных панелях — `--toolbar--compact`.

**Доступность**: обязательный `aria-label`; для переключения — `aria-pressed`;
не полагаться на tooltip как единственное имя.

**Токены и связь с TDS**: `--icon-btn`, `--control-h`, `--action-border-color`, `--shadow-overlay`.

**Критерии готовности**: 44 px область нажатия при визуальном размере 32–36 px;
фокус не обрезается контейнером.

**Референсы** (5):

- `serafimcloud--attachment-button--c2bf98ae.webp` — Attachment Button
- `efferd--menu-toggle--6b5c7e50.webp` — Menu Toggle
- `arunachalam--morphing-arrow-button--b2628233.webp` — Morphing Arrow Button
- `ibelick--scroll-button--97e6bf38.webp` — Scroll Button
- `molecule-lab-rushil--voice-input--cf0bae46.webp` — Voice Input

### B4. Кнопка копирования

Статус: `extend` · Приоритет: `P1` · Классы: `.tg-icon-btn`/`.tg-btn` + предлагаемый
`.tg-copy` (`__value`, `__action`), состояние `data-state="copied"`

**Назначение**: скопировать короткое значение — промокод, ссылку, команду установки.

**Состав**: необязательное поле значения (`code` или `input readonly`); кнопка
«Копировать»; необязательные вкладки менеджеров пакетов (119) — это `.tg-tabs`.

```html
<div class="tg-copy">
  <code class="tg-copy__value" id="promo">21DEV-LEO</code>
  <button class="tg-btn tg-btn--secondary tg-btn--sm tg-copy__action" type="button"
          aria-describedby="promo">Копировать</button>
</div>
<span class="tg-sr-only" role="status" aria-live="polite"></span>
```

**API** (предлагаемое): `.tg-copy` — строка с полем `--radius-control` и встроенной
кнопкой `--radius-inset`; `data-state="copied"` меняет иконку на «галочку» на 2 s.

**Варианты из референсов**: поле + кнопка (43), одиночная иконка (44), команда с
вкладками npm/yarn/pnpm/bun (119) — `tg-tabs` + `tg-copy` с моноширинным значением.

**Состояния**: default, hover, focus-visible, copied, error (буфер недоступен).

**Поведение и ответственность приложения**: вызов `navigator.clipboard.writeText`,
обработка отказа, текст в live region («Скопировано»), возврат состояния через 2 s.

**Адаптивность**: длинное значение обрезается `tg-truncate`, полное значение доступно
выделением; на 320 px кнопка уходит под поле.

**Доступность**: результат объявляется через `role="status"`; смена иконки не
единственный сигнал.

**Токены и связь с TDS**: `--field-bg`, `--radius-control`, `--radius-inset`, `--font-family` для моноширинного значения — системный `ui-monospace`.

**Критерии готовности**: работает без JS как выделяемый текст; с JS — объявление
результата экранным диктором.

**Референсы** (3):

- `minhxthanh--copy-code-button--dacdd830.webp` — Copy Code Button
- `uiable--button-copy--e32b67bc.webp` — Copy Link Button
- `dillionverma--script-copy-button--1d9bdd6f.webp` — Script Copy Button

### B5. Кнопка с ходом выполнения

Статус: `extend` · Приоритет: `P0` · Классы: `.tg-btn` + `aria-busy`, предлагаемые
`data-state="success|error"` и `.tg-btn__progress`

**Назначение**: действие, результат которого приходит не сразу (публикация,
сохранение, отправка). Показывает загрузку и итог на месте, без смены ширины.

**Состав**: подпись; `.tg-spinner` или полоса прогресса внутри кнопки; иконка итога.

```html
<button class="tg-btn tg-btn--primary" type="button" aria-busy="true"
        aria-describedby="publish-status">
  <span class="tg-spinner" aria-hidden="true"></span>
  <span class="tg-btn__label">Публикация…</span>
</button>
<span id="publish-status" class="tg-sr-only" role="status">Публикуем пост</span>
```

**API**: `aria-busy="true"` — существующее состояние; предлагаемые `data-state="success"`
(галочка, акцентный текст на 1.5 s) и `data-state="error"`; `.tg-btn__progress` —
полоса `scaleX()` вдоль нижнего края для известного процента.

**Варианты из референсов**: «Loading…» со спиннером (165); морфинг «Save changes →
Action triggered» (102) — `data-state="success"` с сообщением в status, без
изменения ширины; «Publish / Save draft» со складывающимся прогрессом (112) —
`__progress`; чек-лист кнопок с состояниями (162) — набор B5 + B7.

**Состояния**: default, loading, success, error, disabled.

**Поведение и ответственность приложения**: ставит и снимает `aria-busy`,
блокирует повторную отправку, выбирает текст итога и время возврата.

**Адаптивность**: ширина фиксируется по самой длинной подписи состояния
(`min-inline-size` через сетку из двух слоёв), чтобы соседние элементы не прыгали.

**Доступность**: итог объявляется через live region; во время загрузки фокус
остаётся на кнопке.

**Токены и связь с TDS**: `--spinner-color`, `--progress-color`, `--duration`, `--ease`.

**Критерии готовности**: нет сдвига раскладки при смене состояний; reduced motion
оставляет только смену иконки.

**Референсы** (4):

- `radiumcoders--evilbuttons-morph-status-button--fddde928.webp` — MorphStatusButton
- `lucasbassetti--progress-fold-button--a6e2f91b.webp` — Progress Fold Button
- `ruixen-ui--checklist-button--883cd8f7.webp` — ChecklistButton 
- `coss-com--loading-button-spinner--50ae41d4.webp` — Loading Button

### B6. Подтверждение удержанием или свайпом

Статус: `new` · Приоритет: `P2` · Предлагаемые классы: `.tg-hold-btn`,
`.tg-slide-confirm` (`__track`, `__thumb`, `__label`)

**Назначение**: необратимое или платёжное действие, где случайное нажатие опасно.
Всегда дублируется обычной кнопкой с диалогом подтверждения (B16) — удержание и
свайп недоступны части пользователей.

**Состав**: дорожка; бегунок; подпись; заполнение прогресса удержания.

```html
<button class="tg-btn tg-btn--destructive tg-hold-btn" type="button"
        aria-describedby="hold-hint" style="--hold-progress: 0">
  Удалить аккаунт
</button>
<p id="hold-hint" class="tg-help">Удерживайте 2 секунды или нажмите Enter дважды</p>
```

**API** (предлагаемое): `--hold-progress` (0…1) управляет `scaleX()` заливки;
`.tg-slide-confirm` — `input type="range"` с крупным бегунком, подтверждение при
значении max.

**Варианты из референсов**: «Hold and Release» (86), «Slide to confirm» (169,
131 «Swipe to validate»), сканер отпечатка (70) — тот же контракт удержания с иконкой.

**Состояния**: idle, holding (прогресс), confirmed, cancelled, disabled.

**Поведение и ответственность приложения**: таймер удержания, отмена при уходе
указателя, клавиатурная альтернатива (Enter + подтверждение), вызов действия.

**Адаптивность**: дорожка свайпа на всю ширину до 36rem; бегунок 44 px.

**Доступность**: обязательная альтернатива без жеста; `aria-valuetext` для
свайпа («Подтверждено на 80%»); прогресс объявляется только по завершении.

**Токены и связь с TDS**: `--danger-strong`, `--accent-soft`, `--radius-pill` (дорожка — обоснованная капсула), `--duration`.

**Критерии готовности**: действие выполнимо с клавиатуры и экранным диктором;
reduced motion показывает прогресс без анимации заливки.

**Референсы** (4):

- `designali-in--finger-scan-button--c34ea25f.webp` — Finger Scan Button
- `kokonutd--hold-and-release-button--1133e8d4.webp` — Hold and Release Button
- `badtzx0--swipe-button--f116f974.webp` — Swipe Button
- `mirukullacode--tweenly-slide-button--d2a81a07.webp` — Tweenly Slide Button

### B7. Кнопка-переключатель

Статус: `extend` · Приоритет: `P0` · Классы: `.tg-btn`/`.tg-icon-btn` + `aria-pressed`,
предлагаемый `.tg-toggle`

**Назначение**: включить/выключить одно свойство действия — «В избранное», «Нравится»,
«Жирный». Для настройки системы — `.tg-switch`; для фильтра — `.tg-chip`.

**Состав**: `button` с `aria-pressed`; иконка; необязательный счётчик (`.tg-num`).

```html
<button class="tg-btn tg-btn--secondary tg-toggle" type="button" aria-pressed="false">
  <svg class="tg-icon tg-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
    <use href="dist/icons/star.svg#star"></use>
  </svg>
  <span class="tg-btn__label">В избранное</span>
  <span class="tg-num tg-text-muted">24</span>
</button>
```

**API** (предлагаемое): `.tg-toggle[aria-pressed="true"]` — заливка `--accent-soft`,
текст `--accent-readable`, иконка с заливкой. Подпись не меняется при переключении.

**Варианты из референсов**: «B» для жирного (139–141) — `.tg-icon-btn.tg-toggle`;
«Favorite 24» (65), «Like» (95) — со счётчиком; всплеск эмодзи/частиц (10, 61) —
декоративное дополнение из B19, отключаемое reduced motion; 8-bit (1) — стиль не
переносится; `useToggle` (157) — демонстрация состояния, относится к приложению.

**Состояния**: unpressed, pressed, hover, focus-visible, disabled, mixed (не
используется для одиночного переключателя).

**Поведение и ответственность приложения**: меняет `aria-pressed`, обновляет счётчик
оптимистично и откатывает при ошибке.

**Адаптивность**: счётчик не переносится отдельно от иконки; ширина фиксируется
под максимальное число разрядов.

**Доступность**: состояние передаётся `aria-pressed`, а не цветом; постоянное имя.

**Токены и связь с TDS**: `--accent-soft`, `--accent-readable`, `--control-h`.

**Критерии готовности**: экранный диктор объявляет «нажата/не нажата»; цвет —
дополнительный, а не единственный признак.

**Референсы** (9):

- `theorcdev--8bit-toggle--f0f00192.webp` — 8-bit Toggle
- `radiumcoders--ash-burst-button--a519f16e.webp` — Ash Burst Button
- `shadcnspace--button-32--6878b510.webp` — Emoji Burst Button
- `ibrandify--favorite-toggle--b610b4f2.webp` — Favorite toggle
- `badtzx0--like-button--60b4a258.webp` — Like Button
- `sean0205--toggle-1--4b172b5f.webp` — Toggle
- `shadcn--toggle--e95c8bed.webp` — Toggle
- `jolbol1--toggle-button--dc77296a.webp` — Toggle Button
- `strlrd-29--use-toggle--b3e160d7.webp` — useToggle

### B8. Сегментированный выбор

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-segmented`,
`.tg-segmented__item`, `.tg-segmented--vertical`

**Назначение**: выбор одного (или нескольких) из 2–5 взаимоисключающих вариантов
представления: «Сетка / Список», выравнивание, форматирование. Для переключения
панелей содержимого — `.tg-tabs`.

**Состав**: контейнер `--background-muted` с `--radius-control`; элементы с
`--radius-inset`; выбранный элемент получает поверхность и `--shadow-control`.

```html
<fieldset class="tg-segmented">
  <legend class="tg-sr-only">Вид</legend>
  <label class="tg-segmented__item">
    <input type="radio" name="view" value="grid" checked> Сетка
  </label>
  <label class="tg-segmented__item">
    <input type="radio" name="view" value="list"> Список
  </label>
</fieldset>
```

**API** (предлагаемое): одиночный выбор — нативные `radio`; множественный (84,
форматирование B/I/U) — `button[aria-pressed]` внутри `role="group"` с `aria-label`.
`--vertical` для вертикальной панели (150).

**Варианты из референсов**: «Grid / List» (142), вертикальная B/I/U (150), группа
форматирования с множественным выбором и счётчиком «1 of 4 selected» (84),
раскрывающаяся группа действий «Reply / Forward / …» (63) — это B13 с
`--compact`, отнесена сюда из-за общей геометрии сегментов.

**Состояния**: default, hover, focus-visible (на input — кольцо на label через
`:has(:focus-visible)`), checked/pressed, disabled.

**Поведение и ответственность приложения**: для radio клавиатура нативная (стрелки);
для `aria-pressed` — Tab по кнопкам; приложение меняет представление данных.

**Адаптивность**: на узком экране элементы растягиваются равными долями;
длинные подписи — перенос на две строки, не сжатие.

**Доступность**: группа имеет имя; выбранное состояние — нативное `checked` или
`aria-pressed`; тень выбранного сегмента — визуальное дополнение.

**Токены и связь с TDS**: `--background-muted`, `--background-raised`, `--shadow-control`
(тени для выбранных сегментов разрешены DESIGN.md), `--radius-inset`.

**Критерии готовности**: работает без JS (radio); стрелки переключают выбор;
reduced motion убирает скольжение подложки.

**Референсы** (4):

- `kuratlielia--expanding-button-group--b8d7dbd7.webp` — Expanding Button Group
- `ai2--toggle-group-multi--16aeeec9.webp` — Group-multi Toggle
- `intentui--toggle-group--22a98d15.webp` — Toggle Group
- `cnippet-dev--v-toggle-group-4--8a9833f6.webp` — Vertical Toggle Group

### B9. Группа кнопок и сплит-кнопка

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-btn-group`,
`.tg-btn-group--attached`, `.tg-split-btn` (`__main`, `__menu`)

**Назначение**: связанные действия одного уровня (Копировать / Вырезать / Вставить)
и основное действие с дополнительными вариантами в меню (Сохранить ▾).

**Состав**: ряд кнопок с общим контуром; в сплит-кнопке — основная кнопка и
иконкокнопка-триггер меню (B14).

```html
<div class="tg-split-btn">
  <button class="tg-btn tg-btn--primary tg-split-btn__main" type="button">Экспорт</button>
  <button class="tg-icon-btn tg-icon-btn--primary tg-split-btn__menu" type="button"
          aria-haspopup="menu" aria-expanded="false" aria-controls="export-menu"
          aria-label="Другие форматы экспорта">
    <svg class="tg-icon" viewBox="0 0 24 24" aria-hidden="true">
      <use href="dist/icons/chevron-down.svg#chevron-down"></use>
    </svg>
  </button>
</div>
```

**API** (предлагаемое): `--attached` убирает внутренние радиусы и сдвигает
соседние рамки; разделитель — `--action-border-color`. Сплит-кнопка — две
настоящие кнопки, а не одна с двумя зонами.

**Варианты из референсов**: «Save ▾ / Export ▾» (168), группа «Copy / Cut / Paste +
Save ▾» (11), выбор + «Submit» (121) — `select` и кнопка в одной строке
(`tg-btn-group--attached` с полем).

**Состояния**: каждая кнопка независимо — default, hover, focus-visible, disabled;
триггер — `aria-expanded`.

**Поведение и ответственность приложения**: открывает меню (B14), возвращает фокус на
триггер, выполняет выбранный вариант.

**Адаптивность**: при нехватке места группа переносится целиком на новую строку;
`--attached` на 320 px становится вертикальным стеком.

**Доступность**: обычная группа — `role="group"` с `aria-label`; у триггера сплит-кнопки
отдельное понятное имя.

**Токены и связь с TDS**: `--radius-control`, `--action-border-color`, `--control-h`.

**Критерии готовности**: фокус-кольцо каждой части видно целиком (z-index при
фокусе); RTL меняет порядок частей.

**Референсы** (3):

- `astryxdesign--astryx-button-group--bcdf0718.webp` — Astryx Button Group
- `sean0205--c-select-14--39085abb.webp` — Select With Submit Button
- `ruixen-ui--split-action-button--a31d059f.webp` — Split Action Button

### B10. Переключатель темы

Статус: `composition` · Приоритет: `P1` · Состав: `.tg-switch` или `.tg-segmented` (B8) или `.tg-icon-btn` + `aria-pressed`

**Назначение**: смена светлой/тёмной/системной темы. Тема влияет на всю систему,
поэтому визуальный эффект смены не должен затрагивать палитру компонентов.

**Состав**: для двух состояний — иконкокнопка-переключатель; для трёх (светлая,
тёмная, системная) — сегментированный выбор.

```html
<fieldset class="tg-segmented">
  <legend class="tg-sr-only">Тема</legend>
  <label class="tg-segmented__item"><input type="radio" name="theme" value="light"> Светлая</label>
  <label class="tg-segmented__item"><input type="radio" name="theme" value="dark"> Тёмная</label>
  <label class="tg-segmented__item"><input type="radio" name="theme" value="system" checked> Как в системе</label>
</fieldset>
```

**API**: новых классов нет. Тема переключается атрибутом на корне, как в текущей
витрине; Telegram-адаптер имеет приоритет над ручным выбором внутри Mini App.

**Варианты из референсов**: солнце/луна с вращением (15, 154), «шторка» (48),
горизонтальное стирание (87), переключатели-капсулы (132, 134), ряд иконок
«системная / светлая / яркая / лампа / тёмная» (135, 136). Анимации стирания и
шторки — P2 на основе View Transitions, отключаются reduced motion.

**Состояния**: выбранная тема; hover; focus-visible; disabled внутри Telegram,
если тема задаётся клиентом.

**Поведение и ответственность приложения**: сохранить выбор, применить
`prefers-color-scheme` для «системной», синхронизировать с Telegram.

**Адаптивность**: в шапке — иконкокнопка; в настройках — сегменты с подписями.

**Доступность**: подписи у иконок; смена темы не объявляется отдельно, но выбор
виден в группе.

**Токены и связь с TDS**: использует существующие три темы и их четыре входных цвета; новых тем и палитр нет.

**Критерии готовности**: переключение не вызывает вспышки неверной темы при
загрузке; reduced motion — мгновенная смена.

**Референсы** (8):

- `starc007--be-ui-theme-toggle--2bb8c329.webp` — BeUI Theme Toggle
- `fatih-developer--curtain-theme-toggle--a95aa6dc.webp` — Curtain Theme Toggle
- `arunachalam--theme-wipe-toggle--98d6496f.webp` — Horizontal Theme Wipe Toggle
- `user-hardp--switch-button--b5ee6847.webp` — Switch Button
- `designali-in--theme-switch--d6e863a8.webp` — Theme Switch
- `minhxthanh--theme-toggle-buttons--e3970159.webp` — Theme toggle buttons
- `reuno-ui--theme-toggle-buttons--ffc89935.webp` — Theme toggle buttons
- `axai-kaizoku--animated-theme-toggle--18474ed5.webp` — animated-theme-toggle

### B11. Кнопка со счётчиком

Статус: `composition` · Приоритет: `P1` · Состав: `.tg-btn`/`.tg-icon-btn` + `.tg-badge--destructive` или `.tg-badge--secondary`

**Назначение**: показать число непрочитанного рядом с действием («Входящие 8»).

**Состав**: кнопка; бейдж в углу или в строке.

```html
<a class="tg-btn tg-btn--secondary" href="/inbox">
  Входящие
  <span class="tg-badge tg-badge--destructive">8<span class="tg-sr-only"> непрочитанных</span></span>
</a>
```

**API**: существующий. Угловое положение — как у бейджа в `.tg-avatar`; для кнопки
предлагается `.tg-btn__badge` (абсолютное позиционирование на inline-end).

**Варианты из референсов**: «Inbox» с точкой-счётчиком (32), «Facturas 99+» (45),
бейджи «New/Beta» на кнопках (158).

**Состояния**: со счётчиком, без счётчика (бейдж скрыт `hidden`), 99+.

**Поведение и ответственность приложения**: считает и форматирует число, обновляет
без объявления каждого изменения.

**Адаптивность**: бейдж не выходит за пределы области нажатия, не перекрывает текст.

**Доступность**: число входит в доступное имя; бейдж статусный — без рамки.

**Токены и связь с TDS**: `.tg-badge` модификаторы, `--fs-xs`.

**Критерии готовности**: бейдж не превращается в отдельную кнопку и не перехватывает нажатия.

**Референсы** (3):

- `sean0205--c-button-39--f4a78e44.webp` — Button with Unread Badge
- `sebafermanelli--count-badge--b69fd920.webp` — Count Badge
- `ruixen-ui--badge-button-combo--f90867b3.webp` — Badge Button Combo

### B12. Плавающая кнопка и меню быстрых действий

Статус: `new` · Приоритет: `P2` · Предлагаемые классы: `.tg-fab`, `.tg-fab-menu`
(`__list`, `__item`), `.tg-fab--extended`

**Назначение**: одно главное действие экрана на мобильном (создать) и раскрывающийся
набор 3–6 связанных действий. На десктопе предпочтительнее действие в шапке.

**Состав**: круглая/капсульная кнопка над контентом; список действий с подписями.

```html
<div class="tg-fab-menu">
  <ul class="tg-fab-menu__list" id="quick-actions" hidden>
    <li><button class="tg-btn tg-btn--secondary tg-btn--pill tg-fab-menu__item" type="button">Аккаунт</button></li>
    <li><button class="tg-btn tg-btn--secondary tg-btn--pill tg-fab-menu__item" type="button">Настройки</button></li>
  </ul>
  <button class="tg-icon-btn tg-icon-btn--primary tg-fab" type="button"
          aria-expanded="false" aria-controls="quick-actions" aria-label="Быстрые действия">
    <svg class="tg-icon" viewBox="0 0 24 24" aria-hidden="true"><use href="dist/icons/plus.svg#plus"></use></svg>
  </button>
</div>
```

**API** (предлагаемое): `.tg-fab` — `--icon-btn` с `--radius-pill`, `--shadow-overlay`,
`position: fixed` с отступом `--safe-area-bottom` и `--tg-composer-height`;
`--extended` — с подписью.

**Варианты из референсов**: одиночная FAB (64, 73), вертикальный список с
подписями (75), горизонтальный ряд соцсетей (74), стек аватаров (76),
«цветок» и радиальное меню (78, 113) — радиальная раскладка P2, на мобильном
заменяется вертикальным списком.

**Состояния**: closed, open, hover, focus-visible, disabled.

**Поведение и ответственность приложения**: открытие/закрытие, Escape закрывает и
возвращает фокус, клик вне меню закрывает.

**Адаптивность**: не перекрывает `tg-tabbar` и композер; при открытой клавиатуре скрывается.

**Доступность**: `aria-expanded`; подписи у всех пунктов (радиальные иконки без
текста — только с `aria-label`); порядок фокуса — от триггера к пунктам.

**Токены и связь с TDS**: `--shadow-overlay`, `--z-sticky`, `--safe-area-bottom`, `--duration-fade-in`.

**Критерии готовности**: не закрывает основной контент на 320 px; reduced motion — без разлёта.

**Референсы** (7):

- `cult-ui--family-button--113501e8.webp` — Family Button
- `antdesign--float-button--ce2864a5.webp` — FloatButton
- `serafimcloud--floating-action-button--07da9f73.webp` — Floating Action Button
- `chetanverma16--floating-action-menu--1b991e8d.webp` — Floating Action Menu
- `ln-dev7--floating-button--239c2e01.webp` — Floating Button
- `hari--flower-menu--328c1af2.webp` — Flower menu
- `kanchanasw--radial-menu--510d7d73.webp` — Radial Menu

### B13. Панель инструментов и dock

Статус: `extend` · Приоритет: `P1` · Классы: `.tg-toolbar`, `--compact`,
`--responsive` + предлагаемые `.tg-toolbar--floating`, `.tg-toolbar__separator`

**Назначение**: набор действий над текущим объектом (масштаб холста, форматирование,
навигация приложения в виде dock).

**Состав**: ряд иконкокнопок и кнопок; разделители групп; необязательное
основное действие в конце.

```html
<div class="tg-toolbar tg-toolbar--compact tg-toolbar--floating" role="toolbar"
     aria-label="Масштаб холста">
  <button class="tg-icon-btn tg-icon-btn--ghost" type="button" aria-label="Уменьшить">…</button>
  <button class="tg-icon-btn tg-icon-btn--ghost" type="button" aria-label="Увеличить">…</button>
  <span class="tg-toolbar__separator" role="separator" aria-orientation="vertical"></span>
  <button class="tg-btn tg-btn--primary tg-btn--sm" type="button">Экспорт</button>
</div>
```

**API** (предлагаемое): `--floating` — поверхность `--background-raised`,
`--radius-control`, `--shadow-overlay`; `__separator` — линия `--border-subtle-color`.

**Варианты из референсов**: zoom-панель (36), редакторская панель (144), панель с
экспортом (143), динамическая панель с раскрытием (59), dock-навигация (54, 129) и
нижнее меню (18). Dock с увеличением иконок при наведении — декоративно, P2.

**Состояния**: каждая кнопка — свои состояния; панель — disabled целиком через `fieldset disabled` либо поштучно.

**Поведение и ответственность приложения**: при `role="toolbar"` — роуминг фокуса
стрелками (одна точка Tab), Home/End; без этой клавиатуры роль не указывается.

**Адаптивность**: переполнение уходит в меню «Ещё» (B14), а не в горизонтальный скролл.

**Доступность**: имя панели; ориентация; `aria-pressed` у переключателей форматирования.

**Токены и связь с TDS**: `--background-raised`, `--shadow-overlay`, `--space-1`.

**Критерии готовности**: клавиатурный контракт toolbar реализуется в примере
приложения и проверен в Chromium/WebKit.

**Референсы** (7):

- `0xurvish--bottom-menu--2c0de2f2.webp` — Bottom Menu
- `cnippet-dev--v-toolbar-8--d11ffc93.webp` — Canvas Zoom Toolbar
- `starc007--dock--0a3689bb.webp` — Dock
- `0xurvish--dynamic-toolbar--abfdc87e.webp` — Dynamic Toolbar
- `waleedkibhen--spotlight-button--f37f4d02.webp` — Spotlight Button
- `cnippet-dev--cnippet-toolbar--27615ed2.webp` — Toolbar
- `preetsuthar17--toolbar--525d1b9b.webp` — Toolbar

### B14. Меню действий

Статус: `new` · Приоритет: `P0` · Предлагаемые классы: `.tg-menu`, `.tg-menu__item`,
`.tg-menu__separator`, `.tg-menu__item--destructive`, `.tg-menu__shortcut`

**Назначение**: список команд, вызываемых кнопкой («…», «Создать», правый клик).
Для навигации по сайту — B22/navigation; для выбора значения поля — combobox/select из `forms`.

**Состав**: триггер (`button` с `aria-haspopup="menu"`); всплывающая поверхность;
пункты с иконкой, подписью и сочетанием клавиш; разделители; опасный пункт в конце.

```html
<button class="tg-icon-btn tg-icon-btn--ghost" type="button" id="row-actions"
        aria-haspopup="menu" aria-expanded="false" aria-controls="row-menu"
        aria-label="Действия со строкой">…</button>
<div class="tg-menu" id="row-menu" role="menu" aria-labelledby="row-actions" hidden>
  <button class="tg-menu__item" role="menuitem" type="button">Переименовать</button>
  <button class="tg-menu__item" role="menuitem" type="button">Дублировать
    <kbd class="tg-menu__shortcut">⌘D</kbd></button>
  <div class="tg-menu__separator" role="separator"></div>
  <button class="tg-menu__item tg-menu__item--destructive" role="menuitem" type="button">Удалить</button>
</div>
```

**API** (предлагаемое): поверхность `--background-raised`, `--radius-control`,
`--shadow-overlay`, внутренний отступ `--space-1`; пункт — 44 px, `--radius-inset`;
опасный пункт — `--danger-readable`. Позиционирование — Popover API / `anchor()`
как прогрессивное улучшение; фолбэк — абсолютное позиционирование под триггером.

**Варианты из референсов**: контекстное меню Cut/Copy/Paste (100), действия строки
с «Delete» (89), «Create new» (13), выпадающее меню (58, 126), пиксельное меню паузы
(2) — та же структура без стилизации, общая подсветка при наведении (14) — плавная
подложка hover, P2.

**Состояния**: closed, open, пункт hover/focus (одинаковая подсветка), disabled-пункт
(`aria-disabled`, остаётся в навигации), checked-пункт (`menuitemcheckbox`).

**Поведение и ответственность приложения**: Enter/Space/↓ открывают и фокусируют
первый пункт; ↑/↓ перемещают; Home/End; поиск по первой букве; Escape закрывает и
возвращает фокус на триггер; Tab закрывает; выбор выполняет действие и закрывает.

**Адаптивность**: на 320–480 px меню может открываться как `.tg-modal--sheet`;
не выходит за viewport, разворачивается вверх у нижнего края.

**Доступность**: роли `menu`/`menuitem` только при реализованной клавиатуре; иначе —
список ссылок/кнопок в `.tg-disclosure`.

**Токены и связь с TDS**: `--background-raised`, `--shadow-overlay`, `--z-overlay`,
`--danger-readable`, `--duration-fade-in`/`--duration-fade-out`.

**Критерии готовности**: полный клавиатурный контракт в примере; фокус не теряется
при закрытии; меню не обрезается `overflow` родителя.

**Референсы** (7):

- `theorcdev--8bit-pause-menu--8e72c98a.webp` — 8bit Pause Menu
- `starc007--be-ui-create-menu--7bd2a1bd.webp` — BeUI Create Menu
- `starc007--beui-dock--c9863552.webp` — BeUI Shared Layout Background
- `extend-hq--dropdown-menu--40587f44.webp` — Dropdown Menu
- `felipemenezes098--dropdown-10--52d15622.webp` — Icon Button Actions
- `jolbol1--menu-1--3355c6f2.webp` — Menu
- `0xurvish--smooth-dropdown--cf962fc0.webp` — Smooth Dropdown

### B15. Подсказка

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-tooltip`,
`data-side="top|bottom|inline-start|inline-end"`

**Назначение**: короткое пояснение к иконкокнопке или сокращению. Не содержит
интерактивных элементов и важной информации — для этого popover или `tg-help`.

**Состав**: триггер; всплывающий текст до ~80 символов; необязательная стрелка.

```html
<button class="tg-icon-btn" type="button" aria-label="Добавить в библиотеку"
        aria-describedby="tip-lib">…</button>
<span class="tg-tooltip" id="tip-lib" role="tooltip" data-side="top" hidden>Добавить в библиотеку</span>
```

**API** (предлагаемое): поверхность `--overlay-bg`, текст `--overlay-text`, `--fs-sm`,
`--radius-sm`; `data-side` с логическими сторонами (147 показывает все шесть).

**Варианты из референсов**: подсказка над кнопкой (72, 145, 155), тёмная панель с
форматированием (146) — это B13, а не подсказка, учтена здесь по названию; кнопка
«Trigger» (115); сетка сторон (147).

**Состояния**: hidden, visible (по hover с задержкой 500 ms и сразу по focus-visible).

**Поведение и ответственность приложения**: показ/скрытие, Escape скрывает без
потери фокуса, подсказка не исчезает при наведении на неё (WCAG 1.4.13).

**Адаптивность**: на сенсорных устройствах не используется как единственный способ
узнать назначение; текст переносится, ширина ≤ 20rem.

**Доступность**: `aria-describedby`; имя кнопки не зависит от подсказки.

**Токены и связь с TDS**: `--overlay-bg`, `--overlay-text`, `--z-toast`, `--duration-fade-in`.

**Критерии готовности**: соответствует WCAG 1.4.13 (dismissible, hoverable, persistent).

**Референсы** (6):

- `felipemenezes098--flexnative-tooltip--0bd2f504.webp` — Flexnative Tooltip
- `reshaped--reshaped-tooltip--7edc5ecb.webp` — Reshaped Tooltip
- `anubra266--tooltip-1--7b43a8c6.webp` — Tooltip
- `olivier-1b6cd5bc--tooltip-1--28bac3fe.webp` — Tooltip
- `sean0205--c-tooltip-2--8fc10f97.webp` — Tooltip Sides Grid
- `ln-dev7--indevuitooltip--8c52a8ae.webp` — indevuitooltip

### B16. Диалог и выдвижная панель

Статус: `existing` · Приоритет: `P0` · Классы: `dialog.tg-modal`, `--sheet`, `__sheet`,
`__header`, `__footer`; `.tg-bottom-panel`

**Назначение**: подтверждение действия, короткая форма, просмотр медиа. Выдвижная
снизу панель — тот же диалог с `--sheet`.

**Состав**: заголовок; описание; содержимое; футер с действиями; необязательная
кнопка закрытия.

```html
<dialog class="tg-modal" aria-labelledby="deact-title" aria-describedby="deact-desc">
  <div class="tg-modal__sheet">
    <h2 class="tg-header__title" id="deact-title">Отключить аккаунт?</h2>
    <p id="deact-desc" class="tg-text-muted">Данные будут удалены через 30 дней.</p>
    <form method="dialog" class="tg-modal__footer">
      <button class="tg-btn tg-btn--secondary" value="cancel">Отмена</button>
      <button class="tg-btn tg-btn--destructive" value="confirm">Отключить</button>
    </form>
  </div>
</dialog>
```

**API**: существующий. Видео в диалоге (151) — `tg-media` внутри `__sheet`
с увеличенной максимальной шириной через локальное свойство.

**Варианты из референсов**: alert-подтверждение (4, 51), диалог без крестика (52) —
закрытие только кнопкой футера, допустимо при Escape; создание проекта/рабочего
пространства (47); drawer с выбором значения и графиком (55–57) — `--sheet`;
видео-модалка (151).

**Состояния**: closed, open, busy (кнопка подтверждения в B5), error внутри формы.

**Поведение и ответственность приложения**: `showModal()`/`close()`, начальный
фокус (на безопасном действии для destructive), возврат фокуса, жест смахивания
sheet — улучшение, а не единственный способ закрытия.

**Адаптивность**: на мобильном `--sheet` прижат к низу с `--safe-area-bottom`; на
десктопе — по центру, ширина до 32rem.

**Доступность**: нативный `dialog` даёт модальность и Escape; заголовок связан через
`aria-labelledby`; фон блокирует прокрутку (уже реализовано через `:has()`).

**Токены и связь с TDS**: `--overlay-bg`, `--shadow-overlay`, `--radius-lg`, `--duration-fade-in`.

**Критерии готовности**: варианты из референсов собираются без новых классов, кроме размера медиа.

**Референсы** (8):

- `originui--alert-dialog--3414b7c5.webp` — Alert Dialog
- `efferd--create-workspace-modal--b8020364.webp` — CreateWorkspaceModal
- `ephraimduncan--dialog-deactivate--13c83239.webp` — Dialog Deactivate
- `sean0205--c-dialog-4--a2ec9f2c.webp` — Dialog Without Close Button
- `preetsuthar17--drawer--256b3165.webp` — Drawer
- `sean0205--drawer--ea396106.webp` — Drawer
- `shadcn--drawer--4a4190b4.webp` — Drawer
- `nyxbui--video-modal--95c34604.webp` — Video Modal

### B17. Toast, snackbar и баннер-уведомление

Статус: `existing` · Приоритет: `P1` · Классы: `.tg-toast`, `.tg-snackbar`, `.tg-notice`
+ предлагаемый `.tg-toast__action`

**Назначение**: короткий отклик о результате («Изменения сохранены») или
постоянное некритичное уведомление (cookie, апгрейд). Для ошибок формы — `tg-error-summary`.

**Состав**: текст; необязательное действие («Отменить», «Сохранить»); необязательное закрытие.

```html
<div class="tg-toast tg-toast--show" role="status">
  <span>Есть несохранённые изменения</span>
  <button class="tg-btn tg-btn--ghost tg-btn--sm tg-toast__action" type="button">Сбросить</button>
  <button class="tg-btn tg-btn--primary tg-btn--sm tg-toast__action" type="button">Сохранить</button>
</div>
```

**API**: существующий + `__action` для выравнивания действий в конце строки.

**Варианты из референсов**: «Unsaved changes / Reset / Save» (118), toast с
действием (138), простой toast (137), cookie-баннер (42) — `tg-notice` у нижнего
края с двумя кнопками, баннер апгрейда с закрытием (148) — `tg-notice--accent`.

**Состояния**: hidden, shown, с действием, dismissible.

**Поведение и ответственность приложения**: очередь сообщений, время показа
(не меньше 5 s при наличии действия, без автоскрытия у cookie), хранение отказа.

**Адаптивность**: на мобильном — на всю ширину над `tg-tabbar`; действия переносятся под текст.

**Доступность**: постоянный контейнер `role="status"`; действия доступны с
клавиатуры до скрытия; автоскрытие приостанавливается при фокусе/hover.

**Токены и связь с TDS**: `--z-toast`, `--duration-fade-in`, `--duration-fade-out`, `--shadow-overlay`.

**Критерии готовности**: действие не исчезает раньше, чем пользователь успевает до него дойти Tab.

**Референсы** (5):

- `arunachalam--cookie-banner--62510080.webp` — Cookie Banner
- `yadwinder--toast-save--af5733ff.webp` — Save Changes Toast
- `olivier-1b6cd5bc--toast-1--4701a33f.webp` — Toast
- `bundui--toast11--79d4b529.webp` — Toast with Action Button
- `victorwelander--upgrade-banner--ac93c129.webp` — Upgrade Banner

### B18. Промо-баннер с действием

Статус: `composition` · Приоритет: `P2` · Состав: `.tg-card` + `.tg-header` + `.tg-btn`; подробная спецификация — `ctas/components.md`

**Назначение**: блок продвижения с заголовком и одним действием («Ship your next
launch», «Upgrade to Pro»).

**Состав**: заголовок; текст; одно-два действия; необязательное поле поиска (149).

```html
<section class="tg-card tg-col tg-gap-3" aria-labelledby="promo-title">
  <h2 class="tg-header__title" id="promo-title">Запустите проект за день</h2>
  <p class="tg-text-muted">Шаблоны и компоненты для быстрого старта.</p>
  <a class="tg-btn tg-btn--primary" href="/start">Начать</a>
</section>
```

**API**: новых классов нет.

**Варианты из референсов**: тёмный CTA с сеткой (34), карточка со свечением (35),
поиск + «Upgrade to Pro» с жидким металлом (149) — эффекты из B19 опциональны.

**Состояния**: статичен; состояния — у вложенных кнопок.

**Поведение и ответственность приложения**: тексты, ссылки, аналитика.

**Адаптивность**: действия под текстом на мобильном.

**Доступность**: секция с заголовком; декоративный фон `aria-hidden`.

**Токены и связь с TDS**: `--background-panel`, `--radius-lg`.

**Критерии готовности**: без эффектов выглядит законченно.

**Референсы** (3):

- `thegridcn--cta-banner--5f6de9f6.webp` — CTA Banner
- `21st--cta-glow-card--30ef1d88.webp` — CTA Glow Card
- `larsen66--metal-upgrade-button--cfff46d9.webp` — Upgrade to Pro (Liquid Metal)

### B19. Декоративные эффекты кнопок

Статус: `extend` · Приоритет: `P2` · Предлагаемый модуль: `components/effects` —
классы `.tg-effect-glow`, `.tg-effect-sheen`, `.tg-effect-border-beam`,
`.tg-effect-magnetic`, `.tg-effect-layer`; существующий `.tg-glass`

**Назначение**: опциональный акцент для одной ключевой кнопки на маркетинговой
странице. Не используется в рабочих интерфейсах, формах и Telegram Mini App по умолчанию.

**Состав**: обычная `.tg-btn` + декоративный слой `::before`/`::after` или
`span.tg-effect-layer` с `aria-hidden`.

```html
<a class="tg-btn tg-btn--primary tg-effect-sheen" href="/projects">Смотреть проекты</a>
```

**API** (предлагаемое): эффект меняет только `transform`/`opacity` слоя поверх
существующей заливки, цвет берёт из `--accent-main`/`--accent-soft`. Магнитное
притяжение (98, 99) — JS-улучшение в `effects.mjs`, смещение ≤ 4 px.

**Варианты из референсов**, сведённые к четырём эффектам:
свечение/ореол (7, 71, 79, 81, 85, 156) → `glow`; блик/шиммер/металл
(9, 94, 110, 114, 124) → `sheen` или `.tg-glass`; бегущая граница (17,
122) → `border-beam`; магнит (98, 99) → `magnetic`. Частицы, gooey, dither, glitch,
вода, 3D-объём, ротация, ретро (10, 28, 29, 53, 82, 104, 109, 128, 133, 153) не
переносятся как компоненты — только как вдохновение для `effects`-каталога.

**Состояния**: эффект активен только в покое и hover; в disabled и loading эффект выключен.

**Поведение и ответственность приложения**: подключает модуль эффектов осознанно; не
комбинирует эффекты.

**Адаптивность**: на сенсорных устройствах hover-эффекты не запускаются.

**Доступность**: `prefers-reduced-motion: reduce` — эффект статичен или отключён;
контраст текста проверяется поверх эффекта; эффект не несёт смысла.

**Токены и связь с TDS**: `--accent-main`, `--accent-soft`, `--duration`, `--ease`; новые цвета запрещены.

**Критерии готовности**: при отключённом модуле кнопка выглядит как обычная
`.tg-btn`; нет анимации `width`, `inset`, `background-position` бесконечным циклом
без reduced-motion фолбэка.

**Референсы** (24):

- `chowlol202--animated-gradient-button--e5bcb0d1.webp` — Animated Gradient Button
- `jahed--apple-tahoe-liquid-glass-button--cbb4d59e.webp` — Apple Tahoe Liquid Glass Button
- `larsen66--border-beam-button--f22cc6b3.webp` — Border Beam Button
- `serafimcloud--button-retro--7100a532.webp` — Button Retro
- `designali-in--button-rotate-1--622aae1e.webp` — Button Rotate
- `radiumcoders--dither-button--ac8d0b38.webp` — Dither Button
- `ayushmxxn--flame-button--d7363e97.webp` — Flame Button
- `jahed--glass-button--aad8952d.webp` — Glass Button
- `waleedkibhen--glow-button--897366dd.webp` — Glow Button
- `dhileepkumargm--gooey-button--3dd4e09f.webp` — Gooey Button
- `radiumcoders--highlight-button--7ce74d1b.webp` — Highlight Button
- `jatin-yadav05--leather-button--3df52756.webp` — Leather Button
- `bundui--magnetic-button--334a0c33.webp` — Magnetic Button
- `kokonutd--magnetize-button--2589f931.webp` — Magnetize Button
- `shatlyk1011--motion-button--f79e56c7.webp` — Motion Button
- `kokonutd--particle-button--9da95bce.webp` — Particle Button
- `reuno-ui--pearl-button--65703d50.webp` — Pearl Button
- `uniquesonu--shimmer-button--7283b93c.webp` — React Shimmer Button Component: A Customizable Button with Animated Effects
- `muhammad-binsalman--shiny-borders-button--b4cc03a5.webp` — Shiny Borders Button
- `pate1kiran--code-pen-home-skeuomorphism-in-the-dark-button--03fd9e54.webp` — Skeuomorphism in the Dark Button
- `muhammad-binsalman--spider-verse-glitch-button--67aa5b70.webp` — Spider-Verse Glitch Button
- `bidyut10--three-d-button--86162b53.webp` — Tactile 3D Button
- `demonstrikk--water-button--8172ac8e.webp` — Water Button
- `theutkarshmail--slide-glow-button--e0671668.webp` — slide glow button

### B20. Карточки из раздела кнопок

Статус: `composition` · Приоритет: `P1` · Состав: `.tg-card`, `.tg-header`, `.tg-list`, `.tg-btn`; подробности — `cards/components.md`

**Назначение**: превью, где кнопки — лишь часть карточки: быстрые ссылки,
предложение заказа, котировки, профиль, место.

**Состав**: карточка; заголовок; содержимое; ряд действий в футере.

```html
<article class="tg-card tg-col tg-gap-3" aria-labelledby="offer-title">
  <header class="tg-header"><h3 class="tg-header__title" id="offer-title">Новая заявка</h3></header>
  <p class="tg-num">35 000 – 45 000 ₽</p>
  <div class="tg-toolbar">
    <button class="tg-btn tg-btn--primary" type="button">Принять</button>
    <button class="tg-btn tg-btn--secondary" type="button">Отклонить</button>
  </div>
</article>
```

**API**: новых классов нет.

**Варианты из референсов**: быстрые ссылки (37), проект + уведомления (38),
предложение работы (39), форма создания проекта (40), профиль на стекле (80),
место с кнопкой маршрута (96), список акций с «Buy» (130).

**Состояния**: у вложенных действий.

**Поведение и ответственность приложения**: данные и обработчики.

**Адаптивность**: действия растягиваются на мобильном (`tg-toolbar--responsive`).

**Доступность**: `article` с заголовком; числа через `.tg-num`.

**Токены и связь с TDS**: `--radius-lg`, `--border-color`.

**Критерии готовности**: собираются из существующих классов.

**Референсы** (7):

- `kavikatiyar--card-2--1fce5e81.webp` — Card
- `ln-dev7--indevui-card--a78be6f6.webp` — Card
- `ravikatiyar162--card-12--942fd986.webp` — Card
- `shadcn--card--5114cf30.webp` — Card
- `beratberkayg--glassmorphism-profile-card--d088d079.webp` — Glassmorphism Profile Card
- `lavikatiyar--location-card--59f13b1a.webp` — Location Card
- `ravikatiyar162--stock-card--886eca5a.webp` — Stock Card

### B21. Формы и загрузка из раздела кнопок

Статус: `composition` · Приоритет: `P1` · Состав: `.tg-field`, `.tg-input`, `.tg-select`, `.tg-upload`, `.tg-btn`; подробности — `forms/` и `sign-in/components.md`

**Назначение**: превью форм входа, выбора даты/частоты, группы полей и загрузки
файла, оказавшиеся в разделе кнопок.

**Состав**: поля с label; кнопка отправки; для загрузки — нативный `input type=file`.

```html
<div class="tg-upload tg-upload--dashed">
  <label class="tg-btn tg-btn--secondary">
    Загрузить изображение
    <input class="tg-sr-only" type="file" accept="image/*">
  </label>
  <p class="tg-upload__status tg-text-muted">Файл не выбран</p>
</div>
```

**API**: существующий `.tg-upload`.

**Варианты из референсов**: выбор частоты «Daily» (49) — `select` в строке;
загрузка изображения (67, 68) и превью файла с «Change/Remove» (69) — `tg-upload__preview`
и `__actions`; группа полей с суффиксами (90); карточка входа (97); регистрация (123).

**Состояния**: у полей — default, focus, invalid, disabled; у загрузки — пусто, выбран файл, ошибка.

**Поведение и ответственность приложения**: валидация, загрузка файла, preview через `URL.createObjectURL`.

**Адаптивность**: поля на всю ширину; кнопки под полями.

**Доступность**: label у каждого поля; статус загрузки в live region.

**Токены и связь с TDS**: `--field-bg`, `--border-field`.

**Критерии готовности**: собираются из существующих классов.

**Референсы** (7):

- `0xurvish--day-picker--f463653d.webp` — Day Picker
- `anubra266--file-upload-1--e09cde31.webp` — File Upload
- `sean0205--file-upload--1e90f661.webp` — File Upload
- `bankkroll--file-upload-button--6c71aaaf.webp` — File Upload Button
- `shadcn--input-group--0521fc1a.webp` — Input Group
- `arihantcodes-1f7b8c4d--login-card-1--49e3da47.webp` — Login Card
- `meschacirung--veil-sign-up-2--5f7ff238.webp` — Sign Up 2

### B22. Навигация из раздела кнопок

Статус: `composition` · Приоритет: `P1` · Состав: `.tg-pagination`, `.tg-dot`, `.tg-page-header`, `.tg-link`; подробности — `navigation/components.md`

**Назначение**: карусель, верхняя навигация и постраничная навигация,
отнесённые к кнопкам по названию.

**Состав**: ссылки разделов; кнопки «назад/вперёд»; индикаторы.

```html
<nav aria-label="Страницы результатов">
  <a class="tg-btn tg-btn--ghost" href="?page=1" rel="prev">Назад</a>
  <a class="tg-btn tg-btn--secondary" href="?page=2" aria-current="page">2</a>
  <a class="tg-btn tg-btn--ghost" href="?page=3" rel="next">Вперёд</a>
</nav>
```

**API**: существующий; нумерованная пагинация — предлагаемый `.tg-pager` в navigation.

**Варианты из референсов**: карусель со стрелками и точками (41), шапка сайта с
«Get Started» (105), нумерованная пагинация (108).

**Состояния**: текущая страница (`aria-current`), disabled для крайних.

**Поведение и ответственность приложения**: роутинг и данные страниц.

**Адаптивность**: на мобильном — только «Назад / Вперёд» и номер страницы.

**Доступность**: `nav` с `aria-label`; текущий пункт объявляется.

**Токены и связь с TDS**: `--control-h`, `--accent-strong`.

**Критерии готовности**: собираются без новых классов, кроме нумерованной пагинации.

**Референсы** (3):

- `ibelick--carousel--6740b088.webp` — Carousel
- `originui--navigation-bar--646150f6.webp` — Navigation Bar
- `sean0205--pagination--37c6a341.webp` — Pagination

## Порядок реализации

1. **P0, основа:** документировать варианты B1/B3 в витрине по референсам; ввести
   элементы `__icon`, `__label`, `__subtext` (B2); закрепить `aria-busy` и
   `data-state` (B5); `.tg-toggle` (B7).
2. **P0, всплывающие слои:** меню B14 (общий механизм позиционирования и закрытия),
   затем B16 сверить с примерами.
3. **P1:** B8 сегменты (переиспользуются B10), B9 группы (зависит от B14), B13 панели,
   B15 подсказка (общий слой с B14), B4 копирование, B17 действия в toast.
4. **P1, композиции:** B10, B11, B20–B22 — только примеры в витрине.
5. **P2:** B6 удержание/свайп, B12 FAB, B19 эффекты, B18 промо.

## Контрольный список покрытия

| Группа | Референсов |
| --- | ---: |
| B1. Базовая кнопка и варианты | 31 |
| B2. Кнопка с иконкой и подтекстом | 11 |
| B3. Иконкокнопка | 5 |
| B4. Кнопка копирования | 3 |
| B5. Кнопка с ходом выполнения | 4 |
| B6. Подтверждение удержанием или свайпом | 4 |
| B7. Кнопка-переключатель | 9 |
| B8. Сегментированный выбор | 4 |
| B9. Группа кнопок и сплит-кнопка | 3 |
| B10. Переключатель темы | 8 |
| B11. Кнопка со счётчиком | 3 |
| B12. Плавающая кнопка и меню быстрых действий | 7 |
| B13. Панель инструментов и dock | 7 |
| B14. Меню действий | 7 |
| B15. Подсказка | 6 |
| B16. Диалог и выдвижная панель | 8 |
| B17. Toast, snackbar и баннер-уведомление | 5 |
| B18. Промо-баннер с действием | 3 |
| B19. Декоративные эффекты кнопок | 24 |
| B20. Карточки из раздела кнопок | 7 |
| B21. Формы и загрузка из раздела кнопок | 7 |
| B22. Навигация из раздела кнопок | 3 |
| **Итого** | **169 из 169** |

Каждый из 169 файлов папки указан ровно в одной основной группе. Перекрёстные ссылки на другие категории даны текстом, без повторного учёта.
