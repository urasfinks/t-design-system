# Разное: отклик, раскрытие, статусы — спецификации компонентов

## Назначение категории

Папка `misc` (125 превью) не имеет общей темы, поэтому документ **не** вводит
«разный компонент». Каждое превью отнесено к конкретной задаче: раскрытие (аккордеон),
сообщения и toast, центр уведомлений, аватары, бейджи и чипы, прогресс, шаги,
хронология, поиск, диалоги, подсказки, клавиши и т. д. Большинство групп опираются на
существующие компоненты TDS (`.tg-disclosure`, `.tg-notice`, `.tg-toast`, `.tg-avatar`,
`.tg-badge`, `.tg-chip`, `.tg-progress`, `.tg-spinner`, `.tg-modal`) или на компоненты,
специфицированные в других документах (меню, подсказка, stepper, timeline, палитра команд).

## Сводная таблица

| Компонент / паттерн | Тип работы | Референсов | Приоритет |
| --- | --- | ---: | --- |
| M1. Аккордеон | `extend` | 20 | `P0` |
| M2. Сообщение (alert) | `extend` | 12 | `P0` |
| M3. Toast и стек уведомлений | `extend` | 10 | `P1` |
| M4. Центр уведомлений | `composition` | 3 | `P1` |
| M5. Аватары и группа аватаров | `extend` | 10 | `P0` |
| M6. Бейджи и чипы | `existing` | 8 | `P0` |
| M7. Линейный прогресс | `existing` | 7 | `P0` |
| M8. Круговой прогресс | `new` | 4 | `P1` |
| M9. Шаги процесса | `composition` | 6 | `P1` |
| M10. Хронология | `composition` | 8 | `P1` |
| M11. Расписание по времени | `new` | 2 | `P2` |
| M12. Поиск и палитра команд | `composition` | 10 | `P1` |
| M13. Диалоги и выдвижные панели | `existing` | 8 | `P0` |
| M14. Подсказки | `composition` | 5 | `P1` |
| M15. Клавиши и сочетания | `new` | 2 | `P1` |
| M16. Выпадающие меню | `composition` | 3 | `P1` |
| M17. Строки настроек с выбором | `composition` | 1 | `P1` |
| M18. Панель инструментов | `composition` | 2 | `P1` |
| M19. Индикатор ожидания | `existing` | 1 | `P1` |
| M20. Распределение оценок | `composition` | 1 | `P2` |
| M21. Длинный документ | `composition` | 1 | `P1` |
| M22. Затухание края прокрутки | `extend` | 1 | `P2` |

## Общие решения категории

- **Отклик по важности.** Ошибка формы — `.tg-error-summary` + поле; ошибка экрана —
  `.tg-notice--destructive`; результат действия — `.tg-toast`; системное событие —
  `.tg-snackbar`/центр уведомлений. Один тип сообщения — один компонент.
- **Без новых статусных цветов.** «Warning», «Success», «Info» из референсов
  сводятся к трём ролям: нейтральная (`--secondary`/без модификатора), акцентная
  (`--accent`/`--primary`), опасная (`--destructive`). Предупреждение отличается иконкой
  и текстом, а не жёлтой палитрой.
- **Live regions.** Постоянный контейнер `role="status"` (вежливый) для toast и прогресса;
  `role="alert"` — только для ошибок, требующих немедленного внимания.
- **Раскрытие** — нативные `details/summary`; группа с одним открытым — атрибут `name`.
- **Движение** — индикаторы прогресса через `scaleX()`/`rotate()`, появление слоёв —
  `--duration-fade-in`/`--duration-fade-out`; reduced motion сохраняет только короткий fade.
- **Пиксельные (8-bit) варианты** (1, 2, 3) учитываются по назначению; стилизация не переносится.

## Спецификации компонентов

### M1. Аккордеон

Статус: `extend` · Приоритет: `P0` · Классы: `details.tg-disclosure`, `summary.tg-disclosure__trigger`, `.tg-disclosure__content`; предлагаемые `.tg-accordion`, `.tg-accordion__controls`, `.tg-disclosure__meta`

**Назначение**: FAQ, условия, история изменений, шаги онбординга — несколько раскрываемых
разделов подряд. Для одного раскрытия — просто `.tg-disclosure`.

**Состав**: группа; разделы с заголовком, необязательной иконкой и метаданными
справа (дата, «3 зоны»); содержимое; необязательные «Развернуть всё / Свернуть всё».

```html
<section class="tg-accordion" aria-labelledby="faq-title">
  <h2 class="tg-header__title" id="faq-title">Частые вопросы</h2>
  <div class="tg-accordion__controls">
    <button class="tg-btn tg-btn--ghost tg-btn--sm" type="button">Развернуть всё</button>
  </div>
  <details class="tg-disclosure" name="faq">
    <summary class="tg-disclosure__trigger">Как отследить заказ?
      <span class="tg-disclosure__meta">2 мин</span></summary>
    <div class="tg-disclosure__content">В разделе «Заказы» есть ссылка на трекинг.</div>
  </details>
  <details class="tg-disclosure" name="faq">…</details>
</section>
```

**API** (предлагаемое): `.tg-accordion` — стек `.tg-disclosure` с общей рамкой и
разделителями (вариант «отдельные карточки» — с промежутком `--space-2`);
`__meta` — вторичный текст перед шевроном; индикатор — шеврон (по умолчанию) или
плюс/минус (18) как иконка, не новый компонент.

**Варианты из референсов**: доступный аккордеон (4), базовые (5–13, 39), со вложенной
панелью и превью (14), типографский список «WHO AM I?» (15 — навигация по разделам,
оформление не переносится), активный фон (16), с иконками (17, 42), плюс/минус (18),
история версий с бейджами (45), «развернуть всё» (60), пружинная анимация (42, 97 —
заменяется общей `--ease`).

**Состояния**: collapsed, expanded, hover, focus-visible, disabled (раздел недоступен —
`aria-disabled` на summary с пояснением).

**Поведение и ответственность приложения**: «Развернуть всё» выставляет `open` всем;
при атрибуте `name` открыт один раздел; анимация высоты не используется — содержимое
появляется через `opacity` (или `interpolate-size` как прогрессивное улучшение без
обязательности).

**Адаптивность**: заголовки переносятся, шеврон остаётся в конце строки.

**Доступность**: нативные `details/summary`; заголовок раздела внутри summary — без
вложенных ссылок/кнопок; при `h3` внутри summary структура заголовков страницы сохраняется.

**Токены и связь с TDS**: `--border-color`, `--section-separator-color`, `--radius-lg`.

**Критерии готовности**: работает без JS; «Развернуть всё» — улучшение.

**Референсы** (20):

- `a11ypros--a11y-accordion--3d6d2ce1.webp` — Accessible Accordion
- `subframeapp--accordion-1--f4ddbca4.webp` — Accordion
- `avanishverma4--accordion-2--d960f1b7.webp` — Accordion
- `brijr--accordion-1--ffbd668d.webp` — Accordion
- `clevision--accordion-1--6162d989.webp` — Accordion
- `cnippet-dev--cnippet-accordion--326e3cbc.webp` — Accordion
- `coss-com--coss-accordion--526f43ee.webp` — Accordion
- `ddoemonn--accordion--4b5a7025.webp` — Accordion
- `fuma-nama--accordion--2484276a.webp` — Accordion
- `olivier-1b6cd5bc--accordion-1--7cb1eafa.webp` — Accordion
- `designali-in--accordion-02-1--318d0327.webp` — Accordion 02
- `designali-in--accordion-05--6e61ffdc.webp` — Accordion 05
- `uiable--accordion-active-bg--4720c3b7.webp` — Accordion Active Background
- `shadcnspace--accordion-space--0116234e.webp` — Accordion Space
- `cnippet-dev--v-accordion-5--ac99fcae.webp` — Accordion with Plus/Minus Indicators
- `educalvolpz--basic-accordion--04cb6850.webp` — Basic Accordion
- `starc007--be-ui-bouncy-accordion--e3672a13.webp` — BeUI Bouncy Accordion
- `cnippet-dev--v-accordion-10--77e4468c.webp` — Changelog Accordion
- `felipemenezes098--accordion-14--670af909.webp` — Expand All Accordion
- `ppramanik62--accordion--88dd0974.webp` — Proximity Accordion

### M2. Сообщение (alert)

Статус: `extend` · Приоритет: `P0` · Классы: `.tg-notice`, `--accent`, `--destructive`, `--with-icon`, `__icon`; предлагаемые `.tg-notice__title`, `.tg-notice__actions`, `.tg-notice__dismiss`

**Назначение**: сообщение внутри страницы: подтвердите почту, новая функция, лимит,
ошибка оплаты. Остаётся, пока причина актуальна.

**Состав**: иконка; заголовок; описание с шагом восстановления; действия; закрытие.

```html
<div class="tg-notice tg-notice--with-icon" role="status">
  <svg class="tg-icon tg-notice__icon" aria-hidden="true">…mail…</svg>
  <div class="tg-col tg-gap-1">
    <strong class="tg-notice__title">Подтвердите почту</strong>
    <p>Мы отправили ссылку на hello@example.com.</p>
  </div>
  <div class="tg-notice__actions">
    <button class="tg-btn tg-btn--secondary tg-btn--sm" type="button">Отправить снова</button>
  </div>
  <button class="tg-icon-btn tg-icon-btn--ghost tg-notice__dismiss" type="button" aria-label="Закрыть сообщение">×</button>
</div>
```

**API** (предлагаемое): `__title` — `--fw-semibold`; `__actions` — в конце строки на
десктопе, под текстом на мобильном; `__dismiss` — иконкокнопка в углу. Предупреждение —
базовый notice с иконкой `alert-triangle`, без жёлтого фона.

**Варианты из референсов**: пиксельное (1), цветные полосы (22), «не хватает данных» (23),
«Heads up» (24), опасное светлое (25), подтверждение почты (59), новая функция (62),
сохранено в рабочее пространство (70 — «ореол» декоративен), с иконкой (71), набор
info/success/warning/error (78), предупреждение (125), стек закрываемых (55).

**Состояния**: info, accent (успех/новое), destructive; dismissible; с действием.

**Поведение и ответственность приложения**: закрытие и его запоминание; повторная
отправка; появление динамического сообщения — в live region.

**Адаптивность**: действия под текстом до 36rem.

**Доступность**: статичное сообщение — без роли; динамическое — `role="status"`,
критичное — `role="alert"`; закрытие возвращает фокус логично (к следующему элементу).

**Токены и связь с TDS**: `--notice-danger-bg`, `--accent-soft`, `--background-muted`.

**Критерии готовности**: четыре референсных типа выражены тремя ролями без новых цветов.

**Референсы** (12):

- `theorcdev--8bit-alert--45da959e.webp` — 8-bit Alert
- `sean0205--alert--3ae91862.webp` — Alert
- `serafimcloud--alert--f00a16ce.webp` — Alert
- `shadcn--alert--343f604d.webp` — Alert
- `uiable--alert-light-danger--4bf32e2a.webp` — Alert Light Danger
- `olewandowski1--notifications-5--c594ba9a.webp` — Dismissible Alert Stack
- `cnippet-dev--v-alert-15--11f8fd51.webp` — Email Verification Alert
- `sean0205--c-alert-18--0a3a1c19.webp` — Feature Discovery Alert
- `cult-ui--halo-notification--5195e9db.webp` — Halo Notification
- `sean0205--icon-alert--8a1ccea5.webp` — Icon Alert
- `corr--notice-alert--b768c79c.webp` — Notice Alert
- `cnippet-dev--v-alert-6--28922326.webp` — Warning Alert

### M3. Toast и стек уведомлений

Статус: `extend` · Приоритет: `P1` · Классы: `.tg-toast`, `--show`; предлагаемые `.tg-toast-region`, `.tg-toast__title`, `.tg-toast__action`, `.tg-toast__close`

**Назначение**: короткий результат действия («Заказ оформлен», «Скопировано») и
очередь из нескольких таких сообщений.

**Состав**: постоянный регион; toast с иконкой, заголовком, описанием, действием и
закрытием; стек с наложением.

```html
<section class="tg-toast-region" aria-label="Уведомления">
  <div role="status" aria-live="polite">
    <div class="tg-toast tg-toast--show">
      <strong class="tg-toast__title">Платёж проведён</strong>
      <span class="tg-text-sm">Заказ №4402</span>
      <button class="tg-btn tg-btn--ghost tg-btn--sm tg-toast__action" type="button">Открыть</button>
      <button class="tg-icon-btn tg-icon-btn--ghost tg-toast__close" type="button" aria-label="Закрыть">×</button>
    </div>
  </div>
</section>
```

**API** (предлагаемое): `.tg-toast-region` — фиксированный слой у нижнего края
(с `--safe-area-bottom`) или верхнего; стек — до 3 видимых, задние смещены `transform`
и уменьшены по `opacity`; при наведении/фокусе стек раскрывается.

**Варианты из референсов**: alert-toast по типам (26), базовые (41, 116), «Было
полезно?» с оценкой (64), подтверждение заказа (84), цветные push (108 — цвета сводятся
к ролям), облако уведомлений (117), «гравитационный» стек (118 — физика не переносится),
toast с действиями (119), триггеры info/warning/error (79).

**Состояния**: entering, shown, paused (hover/focus), leaving; типы info/accent/destructive.

**Поведение и ответственность приложения**: очередь, время (≥ 5 s, дольше при
действии), пауза таймера при hover/focus, закрытие Escape при фокусе внутри.

**Адаптивность**: на мобильном — на всю ширину, над `tg-tabbar`/композером.

**Доступность**: регион существует до появления сообщения; действие доступно Tab
(F6/сочетание для перехода в регион документируется).

**Токены и связь с TDS**: `--z-toast`, `--shadow-overlay`, `--duration-fade-in`, `--duration-fade-out`.

**Критерии готовности**: сообщения объявляются один раз; стек не закрывает основное действие экрана.

**Референсы** (10):

- `lavikatiyar--alert-toast--ecd99092.webp` — Alert Toast
- `anubra266--basic-toast--e57ed857.webp` — Basic Toast
- `arunachalam--feedback-toast--dc60302f.webp` — Feedback Toast
- `alexisroe--notification--6242dc4e.webp` — Notification
- `bundui--toast6--ea2765c9.webp` — Order Confirmation Toast
- `maxim-bort-devel--splashed-push-notifications--e2a537c8.webp` — Splashed Push Notifications
- `shugar--toast--2fefa4fd.webp` — Toast
- `21st--toast-cloud--92f6c799.webp` — Toast Cloud
- `nikolas-sapa--toast-gravity-stack--1d1a6037.webp` — Toast Gravity Stack
- `russellbloxwich--toast--4e0860de.webp` — Toast Notifications

### M4. Центр уведомлений

Статус: `composition` · Приоритет: `P1` · Состав: buttons B11 (кнопка со счётчиком) + всплывающая поверхность B14 + `.tg-list` + `.tg-dot` + `.tg-btn`

**Назначение**: колокольчик со счётчиком и список последних уведомлений с действиями.

**Состав**: кнопка с бейджем; всплывающая панель; список (непрочитанные с точкой);
действия в элементе; «Прочитать все».

```html
<button class="tg-icon-btn" type="button" aria-haspopup="dialog" aria-expanded="false"
        aria-controls="inbox" aria-label="Уведомления, 3 непрочитанных">
  …bell… <span class="tg-badge tg-badge--destructive" aria-hidden="true">3</span>
</button>
<div class="tg-card" id="inbox" role="dialog" aria-label="Уведомления" hidden>
  <ul class="tg-list">
    <li class="tg-list-item"><span class="tg-dot" aria-hidden="true"></span>
      <span class="tg-grow">Добро пожаловать!<span class="tg-sr-only"> Не прочитано.</span></span></li>
  </ul>
</div>
```

**API**: новых классов нет.

**Варианты из референсов**: popover входящих (80), альтернативный (81), с действиями (82).

**Состояния**: closed/open; unread/read; empty (`.tg-empty`); loading.

**Поведение и ответственность приложения**: данные, отметка прочитанного, открытие/закрытие
(Escape, клик снаружи, возврат фокуса).

**Адаптивность**: на мобильном — отдельный экран или sheet.

**Доступность**: имя кнопки содержит число; непрочитанность текстом.

**Токены и связь с TDS**: как у составляющих.

**Критерии готовности**: собирается без новых классов.

**Референсы** (3):

- `ruixen-ui--notification-inbox-popover--f4246ad4.webp` — NotificationIn box Popover
- `ruixen-ui--notifications-alt--628d935b.webp` — NotificationsAlt
- `ruixen-ui--notifications-with-actions--5d60418b.webp` — NotificationsWithActions

### M5. Аватары и группа аватаров

Статус: `extend` · Приоритет: `P0` · Классы: `.tg-avatar`, `--outlined`, `__clip`, `__initials`, `.tg-avatar-size`; предлагаемые `.tg-avatar-group`, `.tg-avatar-group__more`

**Назначение**: изображение человека или сущности; набор участников с остатком «+3».

**Состав**: изображение или инициалы; необязательный статус/бейдж; группа с наложением
и счётчиком остатка.

```html
<div class="tg-avatar-group" role="group" aria-label="Команда проекта: 7 участников">
  <span class="tg-avatar"><img class="tg-avatar__clip" src="/u1.jpg" alt="Анна Ким"></span>
  <span class="tg-avatar"><span class="tg-avatar__initials">ВП</span></span>
  <span class="tg-avatar tg-avatar-group__more" aria-label="и ещё 5">+5</span>
</div>
```

**API** (предлагаемое): `.tg-avatar-group` — отрицательный отступ `calc(var(--space-2) * -1)`
и кольцо цвета фона (`box-shadow: 0 0 0 2px var(--background-panel)`) для разделения;
`__more` — инициалы на `--background-muted`. Это превращает каталожный `.avatar-stack`
в публичный компонент с новым именем; старый каталожный класс не трогается.

**Варианты из референсов**: группа инициалов и с переполнением (28), разные аватары (29,
30, 31), круги «+99» (32), одиночный (33), стек с подсказками (34, 68 — подсказка B15 по
фокусу), фолбэк инициалов (83), Reshaped (101).

**Состояния**: image, initials fallback (при ошибке загрузки), selected (существующий
ring), interactive (`button.tg-avatar` с рамкой).

**Поведение и ответственность приложения**: фолбэк при ошибке изображения, число остатка.

**Адаптивность**: размер через `.tg-avatar-size`; группа не переносится, лишнее уходит в `__more`.

**Доступность**: имя у каждого аватара или у группы целиком (тогда отдельные — `alt=""`).

**Токены и связь с TDS**: `--avatar-initials-color`, `--icon-avatar`, `--background-panel`.

**Критерии готовности**: группа выглядит как каталожный стек; RTL меняет направление наложения.

**Референсы** (10):

- `astryxdesign--astryx-avatar-group--b0843619.webp` — Astryx Avatar Group
- `jshguo--avatar-variants-interfacesds--96a20ab5.webp` — Avatar
- `preetsuthar17--avatar--4456e95a.webp` — Avatar
- `shugar--avatar-1--2135545f.webp` — Avatar
- `dillionverma--avatar-circles--4f41ca63.webp` — Avatar Circles
- `shadcnspace--avatar-one--162a84f1.webp` — Avatar One
- `arihantcodes-1f7b8c4d--avatar-stack--a5e85fe0.webp` — Avatar Stack
- `saurabh-2607--great-ui-avatar-stack--46fb142d.webp` — Great UI Avatar Stack
- `edwinvakayil--one-avatar--b447ad87.webp` — One Avatar
- `reshaped--reshaped-avatar--d9e873ce.webp` — Reshaped Avatar

### M6. Бейджи и чипы

Статус: `existing` · Приоритет: `P0` · Классы: `.tg-badge` (`--primary`, `--secondary`, `--destructive`), `.tg-chip`; предлагаемый `.tg-badge__dot`

**Назначение**: статус, категория, счётчик (бейдж, без рамки) и фильтр/реакция (чип, с
рамкой — это действие).

**Состав**: текст; необязательная точка статуса или иконка; для чипа — счётчик.

```html
<span class="tg-badge tg-badge--secondary"><span class="tg-badge__dot" aria-hidden="true"></span>Активен</span>
<span class="tg-badge tg-badge--primary">Новое</span>
<button class="tg-chip" type="button" aria-pressed="false">👍 <span class="tg-num">12</span><span class="tg-sr-only"> реакций «нравится»</span></button>
```

**API**: существующий + `__dot` (6 px круг цвета текущего текста — не новый цвет).
«Success/Warning/Live/Recording» не получают отдельных модификаторов.

**Варианты из референсов**: цитаты-чипы (35 — ссылки `a.tg-badge[href]` с рамкой),
статусы в таблице (36), варианты (37, 38, 111), чипы-фильтры (47), многосостоятельный
бейдж «Start → …» (77 — это кнопка B5, не бейдж), реакции (99).

**Состояния**: бейдж — статичен; чип — pressed/unpressed, hover, focus.

**Поведение и ответственность приложения**: реакции и фильтры.

**Адаптивность**: не переносится внутри; набор переносится.

**Доступность**: статус текстом; реакции с полным именем.

**Токены и связь с TDS**: `.tg-badge`, `--chip-h`, `--action-border-color`.

**Критерии готовности**: правило «рамка = действие» соблюдено во всех примерах.

**Референсы** (8):

- `isaiahbjork--bjork-citation-chips--94f2d988.webp` — BJORK Citation chips
- `bandhuhitesh52003--badge--b126c8c9.webp` — Badge
- `sean0205--badge-variants--7282dfde.webp` — Badge Variants
- `sean0205--base-badge--681d85dd.webp` — Base Badge
- `preetsuthar17--chip--0253d265.webp` — Chip
- `motiondotdev--motion-multi-state-badge--18c56c8d.webp` — Multi state badge
- `jatin-yadav05--reaction-chip--77ec6100.webp` — Reaction Chip
- `ai2--badges-styled--5a281777.webp` — Styled Badges

### M7. Линейный прогресс

Статус: `existing` · Приоритет: `P0` · Классы: `.tg-progress`, `__bar`, `--striped`; `progress.tg-progress`

**Назначение**: известная доля выполнения: загрузка, экспорт, квота, синхронизация.

**Состав**: подпись; значение; полоса; необязательный статус ошибки.

```html
<div class="tg-field">
  <div class="tg-row tg-justify-between"><span class="tg-label" id="up-l">Загрузка report.pdf</span><span class="tg-num">40%</span></div>
  <progress class="tg-progress" max="100" value="40" aria-labelledby="up-l">40%</progress>
</div>
```

**API**: существующий. Ошибка — `--destructive` модификатор цвета полосы через
`--progress-color: var(--danger-main)` (документированное локальное свойство), квота —
обычная полоса.

**Варианты из референсов**: экспорт (87), загрузка с кругом (88 → M8), тонкие полосы
(89, 90), с подписью (91, 92), несколько индикаторов с ошибкой синхронизации (94),
список загрузок файлов со временем (65 — forms F19 `__list`).

**Состояния**: determinate, indeterminate (`progress` без `value`), complete, error.

**Поведение и ответственность приложения**: значение, ошибки.

**Адаптивность**: на всю ширину.

**Доступность**: нативный `progress` или `role="progressbar"` с `aria-valuenow`; обновления
не объявляются каждый процент — итог в status.

**Токены и связь с TDS**: `--progress-color`, `--progress-track-color`.

**Критерии готовности**: без новых классов.

**Референсы** (7):

- `sean0205--c-progress-5--d06aca67.webp` — File Upload Progress List
- `coss-com--progress--9b2803d9.webp` — Progress
- `sean0205--progress--14a8a805.webp` — Progress
- `shadcn--progress--833a1cbb.webp` — Progress
- `adobe--css-progressbar--9717bb4d.webp` — Progress Bar
- `ddoemonn--progress-bar--04a5f122.webp` — Progress Bar
- `robertlib--progress--f7a62ecf.webp` — Progress Indicator

### M8. Круговой прогресс

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-progress-ring`, `__track`, `__value`, `__label`

**Назначение**: компактная доля выполнения (профиль заполнен на 75%, загрузка в кнопке,
оценка).

**Состав**: SVG-кольцо (дорожка и значение); число в центре; подпись.

```html
<div class="tg-progress-ring" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"
     aria-label="Заполнение профиля" style="--value: 50">
  <svg viewBox="0 0 36 36" aria-hidden="true">
    <circle class="tg-progress-ring__track" cx="18" cy="18" r="16"/>
    <circle class="tg-progress-ring__value" cx="18" cy="18" r="16" pathLength="100"/>
  </svg>
  <span class="tg-progress-ring__label tg-num">50%</span>
</div>
```

**API** (предлагаемое): значение — `stroke-dasharray` от `--value` (без анимации
свойства — изменение мгновенное, плавность только у `transform: rotate` для
неопределённого режима); цвет — `--progress-color`; размеры 24/40/64 px.

**Варианты из референсов**: шкала 0–100% (48), собственный цвет (49 — только через
`--progress-color` из ролей), маленькие кольца (93), загрузка (88).

**Состояния**: determinate, indeterminate (вращение `rotate`), complete, error.

**Поведение и ответственность приложения**: значение.

**Адаптивность**: фиксированный размер.

**Доступность**: `role="progressbar"`; при неопределённом — без `aria-valuenow`.

**Токены и связь с TDS**: `--progress-color`, `--progress-track-color`.

**Критерии готовности**: reduced motion — неопределённый режим без вращения (пульс `opacity`).

**Референсы** (4):

- `hihahihahoho--circle-progress--a75853d3.webp` — Circle Progress
- `shadcnui-blocks--progress-10--c27df99c.webp` — Circular Progress with Custom Color
- `edwinvakayil--r-progress--8c7e3e3d.webp` — Progress
- `intentui--progress-circle--40afc5ef.webp` — Progress Circle

### M9. Шаги процесса

Статус: `composition` · Приоритет: `P1` · Компонент `.tg-stepper` специфицирован в `forms/components.md` (F28)

**Назначение**: прогресс многошагового сценария, чек-лист онбординга, этапы доставки.

**Состав**: шаги с номером/иконкой, подписью, описанием, состоянием; горизонтальный
или вертикальный; кнопки «Назад/Далее».

```html
<ol class="tg-stepper tg-stepper--vertical">
  <li class="tg-stepper__step" data-state="done"><span class="tg-stepper__marker" aria-hidden="true">✓</span>
    <span class="tg-stepper__label">Аккаунт<span class="tg-text-sm tg-text-muted">Создайте аккаунт</span></span></li>
  <li class="tg-stepper__step" aria-current="step">…</li>
</ol>
```

**API**: из F28 + предлагаемый `.tg-stepper--vertical` с описаниями.

**Варианты из референсов**: базовый (40), логотипы-шаги (73), этапы доставки со
значениями (98), корзина → оплата (110), вертикальный с описаниями (124), чек-лист
«Getting started 1/5» (95 — это F12 с прогрессом).

**Состояния**: upcoming, current, done, error.

**Поведение и ответственность приложения**: как F28.

**Адаптивность**: как F28.

**Доступность**: как F28.

**Токены и связь с TDS**: как F28.

**Критерии готовности**: `--vertical` добавлен в F28.

**Референсы** (6):

- `sean0205--c-stepper-1--9344f5cb.webp` — Basic Stepper
- `scrollxui--logo-stepper--f98c037f.webp` — Logo Stepper
- `flohoeller--progress-tracker--5862fe2e.webp` — Progress Tracker
- `sean0205--reui-stepper-18--38e51d39.webp` — ReUI stepper - Stepper with key-value stage details
- `kevingirelli--stepper--d9749ed8.webp` — Stepper
- `sean0205--c-stepper-13--24d00646.webp` — Vertical Descriptive Stepper

### M10. Хронология

Статус: `composition` · Приоритет: `P1` · Компонент `.tg-timeline` специфицирован в `cards/components.md` (C11)

**Назначение**: история изменений, вехи компании, дорожная карта.

**Состав**: события с датой, заголовком, описанием, медиа; вертикальная или
горизонтальная ось.

```html
<ol class="tg-timeline" aria-label="История продукта">
  <li class="tg-timeline__item"><time class="tg-timeline__time" datetime="2024">2024</time>
    <h3>Основание</h3><p>Команда из трёх человек…</p></li>
</ol>
```

**API**: C11 + предлагаемый `.tg-timeline--horizontal` (квартальная дорожная карта,
прокрутка в доступной оболочке).

**Варианты из референсов**: журнал изменений с версиями (46), история роста с фото (69),
вехи (75, 115), продукт (86), анимация при прокрутке (103 — появление через `opacity`,
reduced motion — без), горизонтальная по кварталам (113), рельс лет (114).

**Состояния**: past, current, future.

**Поведение и ответственность приложения**: данные.

**Адаптивность**: горизонтальная → вертикальная на мобильном.

**Доступность**: `ol`, `time datetime`.

**Токены и связь с TDS**: как C11.

**Критерии готовности**: горизонтальный модификатор добавлен в C11.

**Референсы** (8):

- `shadcnui-blocks--timeline-06--4c1f3035.webp` — Changelog Timeline
- `shadcnspace--timeline-01--78ee459f.webp` — Growth Story Timeline
- `olewandowski1--timeline-1--982874e6.webp` — Milestone Timeline
- `hyperiux--timeline--9e11400c.webp` — Product Timeline
- `ibrandify--scroll-timeline--61b95fbf.webp` — Scroll animated timeline
- `slide-cn--timeline--944b113a.webp` — Timeline
- `nayan-radadiya6--timeline-rail--ff908480.webp` — Timeline Rail
- `ruixen-ui--timeline-02--8e9f4125.webp` — Timeline-02

### M11. Расписание по времени

Статус: `new` · Приоритет: `P2` · Предлагаемые классы: `.tg-schedule`, `__axis`, `__row`, `__event`

**Назначение**: события дня по часам и диаграмма Ганта по ресурсам.

**Состав**: ось времени; строки (часы или ресурсы); блоки событий; добавление события.

```html
<section class="tg-schedule" aria-labelledby="day-title">
  <h2 id="day-title" class="tg-header__title">Расписание на 14 октября</h2>
  <ol class="tg-schedule__row">
    <li class="tg-schedule__event" style="--start: 9; --end: 10.5">
      <time datetime="09:00">9:00</time>–<time datetime="10:30">10:30</time> Встреча с командой
    </li>
  </ol>
</section>
```

**API** (предлагаемое): позиция блока — `grid-row`/`grid-column` от `--start`/`--end`;
блок — `--accent-soft` фон, текст `--text-main`, рамка inline-start `--accent-main`.

**Варианты из референсов**: дневной планировщик с формой (51), Гант по командам (112).

**Состояния**: event default/hover/focus/selected; drag (P2); conflict.

**Поведение и ответственность приложения**: расчёт позиций, создание и перенос событий
(с клавиатурной альтернативой).

**Адаптивность**: на мобильном — список событий по времени.

**Доступность**: событие — элемент списка с полным временем текстом; сетка — дополнение.

**Токены и связь с TDS**: `--accent-soft`, `--accent-main`, `--border-subtle-color`.

**Критерии готовности**: список-альтернатива доступен всегда.

**Референсы** (2):

- `ruixen-ui--daily-timeline-scheduler--5b365c4a.webp` — Daily Timeline Scheduler
- `abui--timeline--1bc81c95.webp` — Timeline

### M12. Поиск и палитра команд

Статус: `composition` · Приоритет: `P1` · Состав: `.tg-search` (forms F6), палитра (navigation N10), M15 клавиши

**Назначение**: поле поиска с сочетанием клавиш, поиск по категориям, палитра действий.

**Состав**: поле; подсказка сочетания `⌘K`; список результатов/команд с подписью типа.

```html
<button class="tg-search" type="button" aria-haspopup="dialog" aria-keyshortcuts="Meta+K Control+K">
  <span class="tg-text-muted">Поиск…</span> <kbd class="tg-kbd">⌘K</kbd>
</button>
```

**API**: из F6, N10, M15; кнопка-триггер, выглядящая как поле, — `button` с оформлением
`.tg-search`.

**Варианты из референсов**: пиксельная команда (2), палитры действий (19, 20, 50),
поле с «лучом» по рамке (43 — эффект P2), поле с фавиконами (61), морфинг в палитру
(76), сочетание и переключатель ОС (104), поисковая модалка (105), поиск с категорией (106).

**Состояния**: как N10.

**Поведение и ответственность приложения**: как N10.

**Адаптивность**: как N10.

**Доступность**: `aria-keyshortcuts`; сочетание не срабатывает при вводе в поле.

**Токены и связь с TDS**: как у составляющих.

**Критерии готовности**: совпадает с поиском каталога.

**Референсы** (10):

- `theorcdev--8bit-command--b0677815.webp` — 8-bit Command
- `kokonutd--action-search-bar--b3513899.webp` — Action Search Bar
- `koustubhayadiyala36--action-searchbar--816bbcdd.webp` — Action Searchbar
- `arihantcodes-1f7b8c4d--beam-search--53724389.webp` — Beam Search Bar
- `adobe--tailwind-commandpalette--cd7203b5.webp` — Command Palette
- `educalvolpz--favicon-search--78dd7f0e.webp` — Favicon Search
- `starc007--morphing-search--baebcad1.webp` — Morphing Search
- `shadcnspace--kbd-04--6db7e2b1.webp` — Search Input with Keyboard Shortcut
- `efferd--search-modal--9e55566b.webp` — Search Modal
- `ruixen-ui--search-with-category--212c8858.webp` — Search With Category

### M13. Диалоги и выдвижные панели

Статус: `existing` · Приоритет: `P0` · Классы: `dialog.tg-modal`, `--sheet`, `__sheet`, `__header`, `__footer`; предлагаемые `.tg-modal--side`, `.tg-modal__body`

**Назначение**: прокручиваемое содержимое (политика), обратная связь, профиль сбоку,
стек шагов, нижние панели.

**Состав**: заголовок; прокручиваемое тело; футер с действиями.

```html
<dialog class="tg-modal" aria-labelledby="pp-title">
  <div class="tg-modal__sheet">
    <header class="tg-modal__header"><h2 class="tg-header__title" id="pp-title">Политика конфиденциальности</h2></header>
    <div class="tg-modal__body" tabindex="0">…длинный текст…</div>
    <form method="dialog" class="tg-modal__footer">
      <button class="tg-btn tg-btn--secondary" value="decline">Отклонить</button>
      <button class="tg-btn tg-btn--primary" value="accept">Принять</button>
    </form>
  </div>
</dialog>
```

**API**: существующий + предлагаемые `__body` (прокрутка с закреплёнными header/footer)
и `--side` (панель справа на всю высоту, на мобильном → `--sheet`).

**Варианты из референсов**: нижние панели (44, 56, 57), прокручиваемое содержимое (52),
стек диалогов (53 — «Назад» внутри одного диалога, не вложенные модалки), обратная
связь с чипами (63), политика (85), профиль сбоку (107).

**Состояния**: как buttons B16.

**Поведение и ответственность приложения**: как B16; стек — смена содержимого и
фокус на новый заголовок.

**Адаптивность**: `--side` до 36rem становится `--sheet`.

**Доступность**: прокручиваемое тело с `tabindex="0"` и именем, если нет фокусируемых элементов.

**Токены и связь с TDS**: как B16.

**Критерии готовности**: `__body` и `--side` добавлены без изменения существующего API.

**Референсы** (8):

- `ruixen-ui--bottom-drawers--becfaa8b.webp` — Bottom Drawers
- `uiable--dialog-scrollable-content--a651255d.webp` — Dialog Scrollable Content
- `haydenbleasel--dialog-stack--f0a0f386.webp` — Dialog Stack
- `coss-com--drawer--68ad3e42.webp` — Drawer
- `ruixen-ui--drawer-inner-content--755131ef.webp` — Drawer Inner Content
- `syeddhasnainn--feedback-dialog--16c9d485.webp` — Feedback Dialog
- `ruixen-ui--privacy-policy-modal--46e69cc6.webp` — Privacy Policy Modal
- `shadcnspace--dialog-04--f516d822.webp` — Slide-in Profile Dialog

### M14. Подсказки

Статус: `composition` · Приоритет: `P1` · Компонент `.tg-tooltip` специфицирован в `buttons/components.md` (B15)

**Назначение**: пояснения к иконкам, точкам на карте, узлам дерева.

**Состав**: триггер; подсказка.

```html
<button class="tg-icon-btn" type="button" aria-label="Код" aria-describedby="tt-code">{ }</button>
<span class="tg-tooltip" id="tt-code" role="tooltip" hidden>Вставить блок кода</span>
```

**API**: B15.

**Варианты из референсов**: плавающие (66), маркер на карте (74), с границами области (121),
группа на панели (122 — B13 с подсказками; при переходе между кнопками подсказка
появляется без задержки), узел дерева (123 — дерево файлов само по себе P2 `role="tree"`).

**Состояния**: как B15.

**Поведение и ответственность приложения**: как B15.

**Адаптивность**: как B15.

**Доступность**: как B15.

**Токены и связь с TDS**: как B15.

**Критерии готовности**: «группа без задержки» добавлена в поведение B15.

**Референсы** (5):

- `unlumen--floating-tooltip--cba994eb.webp` — Floating Tooltip
- `mapcn--mapcn-marker-tooltip--4877ff07.webp` — MarkerTooltip
- `airbnb-visx--tooltip--beec12ef.webp` — Tooltip
- `ddoemonn--tooltip-group--40a74211.webp` — Tooltip Group
- `ruixen-ui--tree-node-tooltip--e461de79.webp` — Tree Node Tooltip

### M15. Клавиши и сочетания

Статус: `new` · Приоритет: `P1` · Предлагаемый класс: `.tg-kbd` (на элементе `kbd`)

**Назначение**: отображение клавиш и сочетаний в подсказках, меню, справке.

**Состав**: `kbd` для каждой клавиши; вложенные `kbd` для сочетания.

```html
<p>Сохранить: <kbd class="tg-kbd"><kbd>Ctrl</kbd> + <kbd>S</kbd></kbd></p>
```

**API** (предлагаемое): `--fs-xs`/`--fs-sm`, моноширинный системный шрифт, фон
`--background-muted`, рамка `--border-subtle-color` (информационная, не действие),
радиус `--radius-xs`, минимальная ширина 1.5em.

**Варианты из референсов**: пиксельные клавиши (3), набор сочетаний (72).

**Состояния**: статичный.

**Поведение и ответственность приложения**: правильные символы для ОС (⌘ на macOS).

**Адаптивность**: не переносится внутри сочетания.

**Доступность**: для символов — `aria-label`/`title` с названием клавиши («Command»).

**Токены и связь с TDS**: `--background-muted`, `--border-subtle-color`, `--radius-xs`.

**Критерии готовности**: используется в меню, палитре и каталоге единообразно.

**Референсы** (2):

- `theorcdev--8bit-kbd--5b296156.webp` — 8-bit Keyboard Key
- `tom-ui--kbd--291865a0.webp` — Keyboard Shortcuts

### M16. Выпадающие меню

Статус: `composition` · Приоритет: `P1` · Компонент `.tg-menu` специфицирован в `buttons/components.md` (B14)

**Назначение**: выбор опции из короткого меню (видимость, категория).

**Состав**: триггер; список.

```html
<button class="tg-btn tg-btn--secondary" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="vis-menu">Видимость</button>
<div class="tg-menu" id="vis-menu" role="menu" hidden>
  <button class="tg-menu__item" role="menuitemradio" aria-checked="true">Все</button>
</div>
```

**API**: B14 / navigation N9. Если выбирается **значение формы** — forms F8 listbox.

**Варианты из референсов**: анимированное (27), простое (58), «жидкое» с иконками (67).

**Состояния**: как B14.

**Поведение и ответственность приложения**: как B14.

**Адаптивность**: как B14.

**Доступность**: роль по назначению: команда — menu, значение — listbox.

**Токены и связь с TDS**: как B14.

**Критерии готовности**: см. B14.

**Референсы** (3):

- `shatlyk1011--animated-dropdown--e9d26680.webp` — Animated Dropdown
- `ddoemonn--dropdown--296905d7.webp` — Dropdown
- `koustubhayadiyala36--fluid-dropdown--fef8a9ce.webp` — Fluid Dropdown

### M17. Строки настроек с выбором

Статус: `composition` · Приоритет: `P1` · Состав: `.tg-list` + `.tg-list-item` + `.tg-select`

**Назначение**: список настроек, где у каждой строки своё значение из списка (частота писем).

**Состав**: строка с названием, описанием и `select` в конце.

```html
<ul class="tg-list">
  <li class="tg-list-item">
    <span class="tg-col tg-grow"><label for="dg-activity" class="tg-list-item__title">Сводка активности</label>
      <span class="tg-list-item__subtitle">Комментарии и упоминания</span></span>
    <select class="tg-select" id="dg-activity"><option>Каждый день</option><option>Выкл.</option></select>
  </li>
</ul>
```

**API**: новых классов нет.

**Варианты из референсов**: частота писем (54).

**Состояния**: как `.tg-select`.

**Поведение и ответственность приложения**: сохранение.

**Адаптивность**: select под текстом до 36rem.

**Доступность**: `label for`.

**Токены и связь с TDS**: как у составляющих.

**Критерии готовности**: без новых классов.

**Референсы** (1):

- `felipemenezes098--notifications-3--70fd4f5c.webp` — Digest Frequency

### M18. Панель инструментов

Статус: `composition` · Приоритет: `P1` · Компонент — buttons B13 (`.tg-toolbar`)

**Назначение**: выравнивание, правка, «Ещё» над объектом.

**Состав**: иконкокнопки с подписями; выпадающее «Ещё».

```html
<div class="tg-toolbar tg-toolbar--compact" role="toolbar" aria-label="Выравнивание">
  <button class="tg-btn tg-btn--ghost tg-btn--sm" type="button" aria-pressed="true">По левому краю</button>
  <button class="tg-btn tg-btn--ghost tg-btn--sm" type="button" aria-haspopup="menu">Ещё</button>
</div>
```

**API**: B13.

**Варианты из референсов**: панель действий (21), компактная панель (120).

**Состояния**: как B13.

**Поведение и ответственность приложения**: как B13.

**Адаптивность**: как B13.

**Доступность**: как B13.

**Токены и связь с TDS**: как B13.

**Критерии готовности**: см. B13.

**Референсы** (2):

- `ruixen-ui--action-toolbar--7b1644ee.webp` — Action Toolbar
- `coss-com--toolbar--48355381.webp` — Toolbar

### M19. Индикатор ожидания

Статус: `existing` · Приоритет: `P1` · Классы: `.tg-spinner`, `--lg`

**Назначение**: ожидание без известного прогресса в небольшой области.

**Состав**: декоративный индикатор; состояние на родителе; текст статуса.

```html
<div aria-busy="true">
  <span class="tg-spinner" aria-hidden="true"></span>
  <span class="tg-sr-only" role="status">Загрузка…</span>
</div>
```

**API**: существующий. Квадратный «аккордеон-лоадер» (109) — стилистический вариант,
не переносится.

**Варианты из референсов**: квадратный лоадер (109).

**Состояния**: spinning; reduced motion — медленная пульсация `opacity`.

**Поведение и ответственность приложения**: показ только после 300–500 ms ожидания, чтобы избежать мерцания.

**Адаптивность**: размеры 16/24/40 px.

**Доступность**: индикатор скрыт, статус текстом.

**Токены и связь с TDS**: `--spinner-color`, `--spinner-track-color`.

**Критерии готовности**: без новых классов.

**Референсы** (1):

- `loading-ui--square-accordion--3f9254ee.webp` — Square Accordion Loader

### M20. Распределение оценок

Статус: `composition` · Приоритет: `P2` · Состав: `.tg-list` + `.tg-progress` + `.tg-num` + `.tg-chip`

**Назначение**: распределение отзывов по звёздам с фильтром по оценке.

**Состав**: строки «5 ★ — полоса — 5 168»; выбор строки фильтрует отзывы.

```html
<fieldset class="tg-fieldset">
  <legend>Фильтр по оценке</legend>
  <label class="tg-choice"><input class="tg-check" type="checkbox" name="rating" value="5">
    <span>5 звёзд</span><progress class="tg-progress" max="100" value="62" aria-hidden="true"></progress><span class="tg-num">5 168</span></label>
</fieldset>
```

**API**: новых классов нет.

**Варианты из референсов**: полосы оценок (102).

**Состояния**: строка выбрана/не выбрана.

**Поведение и ответственность приложения**: фильтрация.

**Адаптивность**: полоса сжимается, число не переносится.

**Доступность**: число отзывов текстом; звёзды — текстом «5 звёзд».

**Токены и связь с TDS**: `--progress-color`.

**Критерии готовности**: без новых классов.

**Референсы** (1):

- `ruixen-ui--review-filter-bars--9b7a3b2f.webp` — Review Filter Bars

### M21. Длинный документ

Статус: `composition` · Приоритет: `P1` · Состав: `.tg-container--reading` + `.tg-toc` (navigation N13) + `.tg-summary` + C6

**Назначение**: отчёт или исследование с разделами, ключевыми цифрами и оглавлением.

**Состав**: заголовок; резюме; разделы `h2`; ключевые числа; оглавление сбоку.

```html
<article class="tg-container tg-container--reading tg-col tg-gap-6">
  <h1>Ландшафт агентских интерфейсов</h1>
  <section aria-labelledby="sum"><h2 id="sum">Резюме</h2><p>…</p></section>
  <div class="tg-grid"><div class="tg-card tg-stat">…</div></div>
</article>
```

**API**: новых классов нет.

**Варианты из референсов**: исследовательский отчёт с оглавлением-рейкой и цифрами (100).

**Состояния**: статично.

**Поведение и ответственность приложения**: содержимое.

**Адаптивность**: оглавление сверху на мобильном.

**Доступность**: иерархия заголовков без пропусков.

**Токены и связь с TDS**: `--layout-reading-width`.

**Критерии готовности**: без новых классов.

**Референсы** (1):

- `syeddhasnainn--research-report--418afe65.webp` — Research Report

### M22. Затухание края прокрутки

Статус: `extend` · Приоритет: `P2` · Предлагаемая утилита: `.tg-scroll-fade`

**Назначение**: подсказать, что в области есть ещё содержимое, мягким затуханием края.

**Состав**: прокручиваемый контейнер с маской.

```html
<div class="tg-scroll-fade" tabindex="0" role="region" aria-label="Список">…</div>
```

**API** (предлагаемое): `mask-image` линейного градиента прозрачности (не цвет) на
краях; при поддержке scroll-driven animations маска снимается у края.

**Варианты из референсов**: прогрессивное размытие списка (96 — размытие `backdrop-filter`
не используется из-за производительности; заменяется маской).

**Состояния**: at start, middle, at end.

**Поведение и ответственность приложения**: нет (CSS).

**Адаптивность**: работает на любых ширинах.

**Доступность**: содержимое под маской остаётся читаемым при прокрутке; область фокусируема.

**Токены и связь с TDS**: не использует цвета.

**Критерии готовности**: без JS; не скрывает фокус-кольцо.

**Референсы** (1):

- `dillionverma--progressive-blur--a4cb40d3.webp` — Progressive Blur

## Порядок реализации

1. **P0:** M1 `.tg-accordion` и `__meta`; M2 `__title`/`__actions`/`__dismiss`; M5
   `.tg-avatar-group`; M6 `__dot`; M7, M13 `__body`/`--side` — опираются на существующие классы.
2. **P1:** M3 регион и стек toast; M8 кольцо; M15 `kbd`; добавить `--vertical` в
   forms F28 (M9) и `--horizontal` в cards C11 (M10); композиции M4, M12, M14, M16–M18, M21.
3. **P2:** M11 расписание, M20, M22.

## Контрольный список покрытия

| Группа | Референсов |
| --- | ---: |
| M1. Аккордеон | 20 |
| M2. Сообщение (alert) | 12 |
| M3. Toast и стек уведомлений | 10 |
| M4. Центр уведомлений | 3 |
| M5. Аватары и группа аватаров | 10 |
| M6. Бейджи и чипы | 8 |
| M7. Линейный прогресс | 7 |
| M8. Круговой прогресс | 4 |
| M9. Шаги процесса | 6 |
| M10. Хронология | 8 |
| M11. Расписание по времени | 2 |
| M12. Поиск и палитра команд | 10 |
| M13. Диалоги и выдвижные панели | 8 |
| M14. Подсказки | 5 |
| M15. Клавиши и сочетания | 2 |
| M16. Выпадающие меню | 3 |
| M17. Строки настроек с выбором | 1 |
| M18. Панель инструментов | 2 |
| M19. Индикатор ожидания | 1 |
| M20. Распределение оценок | 1 |
| M21. Длинный документ | 1 |
| M22. Затухание края прокрутки | 1 |
| **Итого** | **125 из 125** |

Каждый из 125 файлов папки указан ровно в одной основной группе. Перекрёстные ссылки на другие категории даны текстом, без повторного учёта.
