# Навигация — спецификации компонентов

## Назначение категории

Папка `navigation` (89 превью): вкладки, шапки сайтов, мега-меню, панели меню,
контекстные и выпадающие меню, палитры команд, боковые панели, пагинация, оглавления
и dock-панели. В TDS уже есть `.tg-tabs`/`.tg-tab`, `.tg-tabbar`, `.tg-breadcrumbs`,
`.tg-pagination`/`.tg-dot`, `.tg-page-header` и `.tg-list-item`. Документ уточняет,
где навигация (ссылки, `aria-current`), а где команды (`menu`, `menuitem`), — эти
контракты не смешиваются.

## Сводная таблица

| Компонент / паттерн | Тип работы | Референсов | Приоритет |
| --- | --- | ---: | --- |
| N1. Вкладки | `existing` | 14 | `P0` |
| N2. Раскрывающиеся иконочные вкладки | `extend` | 3 | `P2` |
| N3. Вертикальные вкладки и навигация настроек | `extend` | 2 | `P1` |
| N4. Шапка сайта | `extend` | 13 | `P0` |
| N5. Мега-меню и выпадающая навигация | `new` | 4 | `P1` |
| N6. Мобильная навигация | `existing` | 2 | `P0` |
| N7. Dock | `composition` | 7 | `P2` |
| N8. Строка меню (menubar) | `new` | 7 | `P2` |
| N9. Выпадающее и контекстное меню | `extend` | 16 | `P0` |
| N10. Палитра команд | `new` | 3 | `P1` |
| N11. Боковая панель | `new` | 4 | `P1` |
| N12. Пагинация | `extend` | 7 | `P0` |
| N13. Оглавление | `new` | 2 | `P1` |
| N14. Список разделов со счётчиками | `existing` | 1 | `P1` |
| N15. Меню уведомлений | `composition` | 1 | `P1` |
| N16. Навигация карусели | `new` | 1 | `P1` |
| N17. Навигация календаря | `composition` | 2 | `P1` |

## Общие решения категории

- **Навигация ≠ меню команд.** Переход — `nav` + `a href` + `aria-current="page"`.
  Команды — `button` и, при полном клавиатурном контракте, `role="menu"`. Шапка сайта
  с выпадающими разделами не получает `role="menubar"`.
- **Вкладки** переключают панели на одной странице (`role="tablist"`). Если вкладка
  меняет URL — это навигация, а не `tab`.
- **Выбранное** передаётся `aria-selected`/`aria-current`, цвет и подложка —
  дополнительно. Подложка выбранного сегмента — `--background-raised` + `--shadow-control`;
  подчёркивание — 2 px `--accent-main`.
- **Скольжение индикатора** (tubelight, pill morph) — только `transform`/`opacity`;
  при reduced motion индикатор переставляется без движения.
- **Плавающие слои** (меню, мега-меню, палитра) используют общую поверхность
  `--background-raised`, `--radius-control`, `--shadow-overlay`, `--z-overlay` и общую
  логику закрытия (Escape, клик снаружи, возврат фокуса) — общий модуль с buttons B14.
- **Мобильная версия.** Шапка сворачивается в кнопку меню + `dialog.tg-modal--sheet`
  со списком ссылок; нижняя навигация — `.tg-tabbar`, не dock.
- **Ответственность.** TDS — разметка и оформление; приложение — роутинг, текущий
  раздел, клавиатурная логика меню и вкладок, загрузка результатов поиска.

## Спецификации компонентов

### N1. Вкладки

Статус: `existing` · Приоритет: `P0` · Классы: `.tg-tabs`, `.tg-tab`, `.tg-tabs--responsive`; предлагаемые `.tg-tabs--underline`, `.tg-tabs--segmented`

**Назначение**: переключение равноправных панелей содержимого одного контекста.
Для выбора значения формы — `.tg-segmented`; для разделов сайта — N4.

**Состав**: `tablist`; вкладки с текстом и необязательной иконкой/счётчиком; панели.

```html
<div class="tg-tabs tg-tabs--underline" role="tablist" aria-label="Код примера">
  <button class="tg-tab" role="tab" id="t-js" aria-selected="true" aria-controls="p-js">JavaScript</button>
  <button class="tg-tab" role="tab" id="t-rs" aria-selected="false" aria-controls="p-rs" tabindex="-1">Rust</button>
</div>
<div role="tabpanel" id="p-js" aria-labelledby="t-js" tabindex="0">…</div>
<div role="tabpanel" id="p-rs" aria-labelledby="t-rs" tabindex="0" hidden>…</div>
```

**API**: существующий + предлагаемые модификаторы внешнего вида: `--underline`
(линия 2 px `--accent-main` под выбранной), `--segmented` (подложка
`--background-muted`, выбранная — `--background-raised` + `--shadow-control`; это
текущий вид по умолчанию, модификатор фиксирует его явно).

**Варианты из референсов**: подчёркивание (33, 83), сегменты
(7, 41, 84), капсулы (30, 39, 40 — `--pill` допустим как явный модификатор),
с иконками (85), растягивающиеся (77 = `--responsive`), с формой в панели (56),
тёмная тема (38), пиксельные (2 — стиль не переносится).

**Состояния**: selected, hover, focus-visible, disabled; панель loading.

**Поведение и ответственность приложения**: ←/→ — соседняя вкладка (с циклом),
Home/End; активация автоматическая или по Enter; roving tabindex; синхронизация с
URL-хэшем по желанию.

**Адаптивность**: переполнение — горизонтальная прокрутка вкладок с fade-краями
(`mask` с `opacity`), не перенос строк; `--responsive` — равные доли на мобильном.

**Доступность**: APG Tabs; имя у `tablist`; иконочные вкладки — `aria-label`.

**Токены и связь с TDS**: `--accent-main`, `--background-muted`, `--background-raised`, `--shadow-control`.

**Критерии готовности**: индикатор не анимирует `width`/`left` — только `transform: translateX() scaleX()`.

**Референсы** (14):

- `theorcdev--8bit-tabs--4f0dc9bc.webp` — 8-bit Tabs
- `starc007--beui-tabs--af113d09.webp` — BeUI Tabs
- `ruixen-ui--pill-morph-tabs--861c2134.webp` — Pill Morph Tabs
- `k3menn--simple-tabs-with-underline-and-bold-font--fb4908ec.webp` — Simple Tabs with underline and bold font
- `ln-dev7--indevui-tabs--e0481d9d.webp` — indevuiTabs
- `uniquesonu--animated-chip-tab-component--5d2c8f35.webp` — Animated Chip Tab Component
- `builduilabs--animated-tabs--32498cbc.webp` — Animated Tabs
- `educalvolpz--animated-tabs--12b09f30.webp` — Animated Tabs
- `skyleen77--headless-tabs--cb022c09.webp` — Headless Tabs
- `dhxwhy--stretch-tabs--8bc6a139.webp` — Stretch Tabs
- `fuma-nama--tabs--9e403978.webp` — Tabs
- `shugar--tabs-1--6319ba8c.webp` — Tabs
- `micka-design--tabs-subtle--9cb8fe7a.webp` — Tabs Subtle
- `shadcnspace--tabs-03--dc3d0a80.webp` — Tabs With Icons

### N2. Раскрывающиеся иконочные вкладки

Статус: `extend` · Приоритет: `P2` · Класс: `.tg-tabs` + предлагаемый `.tg-tabs--collapsed-labels`

**Назначение**: компактная панель, где у неактивных вкладок видна только иконка, а
у активной — иконка с подписью.

**Состав**: вкладки с иконкой и подписью; подпись неактивных скрыта визуально.

```html
<div class="tg-tabs tg-tabs--collapsed-labels" role="tablist" aria-label="Почта">
  <button class="tg-tab" role="tab" aria-selected="true">
    <svg class="tg-icon" aria-hidden="true">…</svg><span class="tg-tab__label">Входящие</span>
  </button>
  <button class="tg-tab" role="tab" aria-selected="false" tabindex="-1">
    <svg class="tg-icon" aria-hidden="true">…</svg><span class="tg-tab__label">Календарь</span>
  </button>
</div>
```

**API** (предлагаемое): у неактивных `.tg-tab__label` — `tg-sr-only`-подобное скрытие
(имя сохраняется для экранного диктора); раскрытие — `opacity` подписи, ширина меняется
без анимации.

**Варианты из референсов**: раскрывающиеся вкладки (53, 54), только иконки с
переключением вида сетки (57).

**Состояния**: как N1.

**Поведение и ответственность приложения**: как N1.

**Адаптивность**: используется в узких панелях; на широких — обычные N1 с подписями.

**Доступность**: подпись всегда есть в DOM; tooltip — дополнительно.

**Токены и связь с TDS**: как N1.

**Критерии готовности**: нет анимации ширины; reduced motion — мгновенная смена.

**Референсы** (3):

- `rjcuff2000--expandable-tabs--a79bf898.webp` — Expandable Tabs
- `aicanvas--expanding-tabs--e59a63e0.webp` — Expanding Tabs
- `felipemenezes098--tabs-08--d3239e52.webp` — Icon Only Tabs

### N3. Вертикальные вкладки и навигация настроек

Статус: `extend` · Приоритет: `P1` · Предлагаемый модификатор `.tg-tabs--vertical`; для страниц настроек — N11-подобный `nav`

**Назначение**: разделы настроек профиля (Профиль, Безопасность, Уведомления) слева
от формы.

**Состав**: вертикальный список вкладок или ссылок с иконками и счётчиками; панель.

```html
<div class="tg-row tg-row-valign-top">
  <div class="tg-tabs tg-tabs--vertical" role="tablist" aria-orientation="vertical" aria-label="Настройки">
    <button class="tg-tab" role="tab" aria-selected="true">Профиль</button>
    <button class="tg-tab" role="tab" aria-selected="false" tabindex="-1">Безопасность</button>
  </div>
  <section role="tabpanel" class="tg-grow">…</section>
</div>
```

**API** (предлагаемое): `--vertical` — колонка, выбранная с подложкой или линией
2 px на inline-start; `aria-orientation="vertical"` меняет клавиши на ↑/↓.

**Варианты из референсов**: иконки со счётчиками и панелью-карточкой (87),
настройки профиля с формой (88).

**Состояния**: как N1.

**Поведение и ответственность приложения**: ↑/↓, Home/End; если разделы — отдельные
URL, используется `nav` со ссылками и `aria-current`.

**Адаптивность**: на мобильном превращается в `.tg-select` или горизонтальные N1.

**Доступность**: `aria-orientation`.

**Токены и связь с TDS**: как N1.

**Критерии готовности**: переход в мобильный вид без дублирования разметки (CSS-only для ссылок).

**Референсы** (2):

- `sean0205--c-tabs-8--202ea7af.webp` — Vertical Icon Tabs
- `cnippet-dev--v-tabs-13--25aa453a.webp` — Vertical Settings Tabs

### N4. Шапка сайта

Статус: `extend` · Приоритет: `P0` · Классы: `.tg-page-header`, `.tg-brand`, `.tg-container` + предлагаемые `.tg-site-nav`, `.tg-site-nav__link`, `.tg-page-header--sticky`, `.tg-page-header--floating`

**Назначение**: глобальная навигация сайта: логотип, разделы, действия (вход, CTA), меню на мобильном.

**Состав**: бренд; список ссылок разделов; действия; кнопка меню на мобильном.

```html
<header class="tg-page-header tg-page-header--sticky">
  <div class="tg-container tg-row">
    <a class="tg-brand tg-header__title" href="/">Product</a>
    <nav class="tg-site-nav tg-hide-mobile" aria-label="Основная">
      <a class="tg-site-nav__link" href="/" aria-current="page">Главная</a>
      <a class="tg-site-nav__link" href="/pricing">Цены</a>
      <a class="tg-site-nav__link" href="/docs">Документация</a>
    </nav>
    <a class="tg-btn tg-btn--primary tg-btn--sm tg-ms-auto" href="/start">Начать</a>
    <button class="tg-icon-btn tg-icon-btn--ghost" type="button" aria-label="Меню"
            aria-expanded="false" aria-controls="mobile-nav">…</button>
  </div>
</header>
```

**API** (предлагаемое): `__link` — 44 px высоты, текущая — `--text-main` +
подчёркивание/подложка, остальные — `--text-secondary`; `--sticky` — `position: sticky`
+ фон `--background-main` с границей при прокрутке; `--floating` — капсула-остров над
контентом (`--radius-pill`, `--shadow-overlay`, опционально `.tg-glass`).

**Варианты из референсов**: классическая шапка (23, 24, 62, 78), остров/капсула
(19, 35, 66), подсветка текущего пункта «tubelight» (35), сворачивание при прокрутке
(22, 34), подчёркнутые пункты с иконками (86), свечение (16), эмодзи-пункты (52),
градиентный фон (29 — фон не переносится).

**Состояния**: link default/hover/focus/current; шапка at-top / scrolled; mobile-menu open.

**Поведение и ответственность приложения**: текущий раздел, класс прокрутки
(IntersectionObserver на sentinel), открытие мобильного меню.

**Адаптивность**: до 48rem — бренд, CTA и кнопка меню; ссылки в `dialog.tg-modal--sheet`
(N6). Не скрывать ссылки без альтернативы.

**Доступность**: `nav aria-label`; `aria-current="page"`; skip-link «К содержимому» перед шапкой.

**Токены и связь с TDS**: `--background-main`, `--border-subtle-color`, `--z-sticky`, `--shadow-overlay`.

**Критерии готовности**: sticky-шапка не перекрывает якорные цели (`scroll-padding-top`).

**Референсы** (13):

- `spoonyvu--glow-menu--3a933ae3.webp` — Glow menu
- `gughigug--liquid-glass-navbar--8111fc8f.webp` — Liquid Glass Navbar
- `laziekiki--morphing-scroll-navbar--117824fb.webp` — Morphing Scroll Navbar
- `mohitsapat--navbar--35a6acd2.webp` — NavBar
- `preetsuthar17--navbar-1--bb52e56c.webp` — Navbar 1 
- `reuelaraujo7--pedidosmenu-com--f19611ab.webp` — PedidosMenu.com
- `chetanverma16--stacking-navbar--a4afe7fd.webp` — Stacking Navbar
- `ayushmxxn--tubelight-navbar--5a7090c5.webp` — Tubelight Navbar
- `kaif-ui--emoji-nav--b5e67d96.webp` — Emoji Nav
- `minhxthanh--menu-hover-effects--2c072d78.webp` — Menu Hover Effects
- `abushaidislam7--morphing-island-navbar--fddc89a4.webp` — Morphing Island Navbar
- `arihantcodes-1f7b8c4d--tab-navbar--587c65b5.webp` — Tab Navbar
- `shadcnui-blocks--navigation-menu-05--eb95d7ee.webp` — Underlined Navigation Menu

### N5. Мега-меню и выпадающая навигация

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-nav-menu`, `.tg-nav-menu__trigger`, `.tg-nav-menu__panel`, `.tg-nav-menu__group`, `.tg-nav-menu__link`

**Назначение**: разделы сайта с подразделами и описаниями («Продукты», «Решения»). Это
навигация по ссылкам, не меню команд.

**Состав**: триггеры разделов (`button aria-expanded`); панель с группами ссылок,
описаниями, иконками; необязательная промо-карточка.

```html
<nav class="tg-nav-menu" aria-label="Основная">
  <ul>
    <li>
      <button class="tg-nav-menu__trigger" type="button" aria-expanded="false" aria-controls="nm-products">Продукты</button>
      <div class="tg-nav-menu__panel" id="nm-products" hidden>
        <section class="tg-nav-menu__group" aria-labelledby="nm-dev">
          <h3 id="nm-dev" class="tg-text-sm tg-text-muted">Разработчикам</h3>
          <a class="tg-nav-menu__link" href="/previews">Превью<span class="tg-text-sm tg-text-muted">Развёртывание каждой ветки</span></a>
        </section>
      </div>
    </li>
    <li><a class="tg-nav-menu__link" href="/pricing">Цены</a></li>
  </ul>
</nav>
```

**API** (предлагаемое): панель — поверхность плавающих слоёв, сетка групп
`repeat(auto-fit, minmax(14rem, 1fr))`; ссылка — 44 px, заголовок + описание 14 px.

**Варианты из референсов**: мега-меню с карточками (25, 60), выпадающие колонки
продуктов (50), меню с шевронами (68).

**Состояния**: trigger collapsed/expanded, link hover/focus/current.

**Поведение и ответственность приложения**: Enter/Space открывают; Escape закрывает и
возвращает фокус; Tab свободно проходит по ссылкам; открытие по hover — только с
задержкой и при `pointer: fine`; клик снаружи закрывает.

**Адаптивность**: на мобильном — вложенные `details.tg-disclosure` внутри мобильного меню.

**Доступность**: шаблон APG «Disclosure navigation», не `menubar`; группы с заголовками.

**Токены и связь с TDS**: `--background-raised`, `--shadow-overlay`, `--z-overlay`.

**Критерии готовности**: работает без hover; все ссылки доступны Tab.

**Референсы** (4):

- `manuarora700--navbar-menu--c1f39249.webp` — Navbar Menu
- `ln-dev7--dorpdown-navigation--b1b8f484.webp` — Dorpdown Navigation
- `anelkabag--navbar2--49727752.webp` — Mega Menu Navbar
- `sean0205--navigation-menu-1--9427cbda.webp` — Navigation Menu

### N6. Мобильная навигация

Статус: `existing` · Приоритет: `P0` · Классы: `.tg-tabbar`, `.tg-tabbar__item`, `dialog.tg-modal--sheet`

**Назначение**: нижняя панель основных разделов приложения (3–5) и полноэкранное меню сайта.

**Состав**: панель с пунктами-иконками и подписями; полноэкранный диалог со списком ссылок.

```html
<nav class="tg-tabbar" aria-label="Разделы">
  <a class="tg-tabbar__item" href="/" aria-current="page">Главная</a>
  <a class="tg-tabbar__item" href="/stats">Статистика</a>
  <a class="tg-tabbar__item" href="/profile">Профиль</a>
</nav>
```

**API**: существующий. Полноэкранное меню (58) — `dialog.tg-modal` с крупными ссылками
и закрытием; без новых классов, кроме размера типографики ссылок (утилита).

**Варианты из референсов**: нижняя панель с раскрытой подписью активного пункта (44),
полноэкранная навигация с превью (58).

**Состояния**: current, hover, focus-visible; меню open/closed.

**Поведение и ответственность приложения**: текущий раздел; открытие/закрытие диалога.

**Адаптивность**: tabbar учитывает `--safe-area-bottom`; на десктопе заменяется N4/N11.

**Доступность**: подписи у иконок всегда видимы или в `aria-label`; диалог — модальный.

**Токены и связь с TDS**: `--bottom-bar-bg-color`, `--safe-area-bottom`.

**Критерии готовности**: без новых классов.

**Референсы** (2):

- `arunachalam--bottom-nav-bar--b2e69d9b.webp` — Bottom Nav Bar
- `hyperiux--immersive-full-screen-nav--ef181f7a.webp` — Immersive Full Screen Navigation

### N7. Dock

Статус: `composition` · Приоритет: `P2` · Состав: `.tg-toolbar--floating` (buttons B13) + `.tg-icon-btn`

**Назначение**: плавающая панель быстрых переходов в стиле macOS. В рабочих
интерфейсах предпочтительнее N4/N6.

**Состав**: ряд иконкокнопок или ссылок; необязательные подписи-подсказки; индикатор активного.

```html
<nav class="tg-toolbar tg-toolbar--floating" aria-label="Быстрый доступ">
  <a class="tg-icon-btn tg-icon-btn--ghost" href="/" aria-label="Главная" aria-current="page">…</a>
  <a class="tg-icon-btn tg-icon-btn--ghost" href="/search" aria-label="Поиск">…</a>
</nav>
```

**API**: новых классов нет; увеличение при наведении (42, 89) — P2-эффект `transform: scale()`.

**Варианты из референсов**: простые dock (13, 49), «желейный» (17), LumaBar (20),
Apple/macOS (42, 89), плавающий (55).

**Состояния**: hover (подсказка B15), focus-visible, current.

**Поведение и ответственность приложения**: роутинг.

**Адаптивность**: на мобильном — `.tg-tabbar`.

**Доступность**: подписи через `aria-label` и подсказку; эффекты отключаются при reduced motion.

**Токены и связь с TDS**: `--shadow-overlay`, `--radius-pill`.

**Критерии готовности**: увеличение не сдвигает соседей через `width`.

**Референсы** (7):

- `ruixen-ui--dock--e12049ec.webp` — Dock
- `ruixen-ui--gooey-dock--3b028d2e.webp` — Gooey Dock
- `ruixen-ui--futuristic-nav--303d6c91.webp` — LumaBar
- `shadcnspace--apple-dock--478c4622.webp` — Apple Dock
- `luv-jeri-c92deb60--dock--39f8f4f2.webp` — Dock
- `manuarora700--floating-dock--4372c42e.webp` — Floating Dock
- `dhmnpunit--mac-os-dock--cd37a6cf.webp` — macOS Dock

### N8. Строка меню (menubar)

Статус: `new` · Приоритет: `P2` · Предлагаемые классы: `.tg-menubar`, `.tg-menubar__item` (+ `.tg-menu` из buttons B14 для подменю)

**Назначение**: меню приложения-редактора «Файл / Правка / Вид». Не для сайтов.

**Состав**: горизонтальный ряд пунктов; у каждого — выпадающее меню команд с подменю,
сочетаниями клавиш, checkable-пунктами.

```html
<div class="tg-menubar" role="menubar" aria-label="Редактор">
  <button class="tg-menubar__item" role="menuitem" aria-haspopup="menu" aria-expanded="false">Файл</button>
  <button class="tg-menubar__item" role="menuitem" aria-haspopup="menu" aria-expanded="false" tabindex="-1">Правка</button>
</div>
```

**API** (предлагаемое): пункты 36 px визуально / 44 px область, `--radius-inset`;
открытое меню — подложка `--background-muted`.

**Варианты из референсов**: классический menubar (21, 63, 65), панель приложения с
иконками (5, 64), вложенное меню дашборда (26), пиксельный (1 — стиль не переносится).

**Состояния**: item default/hover/focus/expanded; пункты меню как B14.

**Поведение и ответственность приложения**: ←/→ — пункты, ↓ — открыть, при открытом
меню ←/→ переключают соседние меню, Escape закрывает; полный контракт APG Menubar.

**Адаптивность**: на мобильном — одна кнопка «Меню» с B14.

**Доступность**: только при полной клавиатуре; иначе — набор B14.

**Токены и связь с TDS**: как B14.

**Критерии готовности**: проверенный контракт APG Menubar.

**Референсы** (7):

- `theorcdev--8bit-menubar--af3e88b6.webp` — 8-bit Menubar
- `ruixen-ui--app-menu-bar--8b28ffdc.webp` — App Menu Bar
- `shadcn--menubar--63314273.webp` — Menubar
- `ruixen-ui--nested-dashboard-menu--257deafb.webp` — Nested Dashboard Menu
- `olivier-1b6cd5bc--menubar-1--46af7824.webp` — Menubar
- `preetsuthar17--menubar--852d5317.webp` — Menubar
- `sean0205--menubar--cd9bea15.webp` — Menubar

### N9. Выпадающее и контекстное меню

Статус: `extend` · Приоритет: `P0` · Базовый компонент — `.tg-menu` (buttons B14); предлагаемые расширения: `.tg-menu__label`, `.tg-menu__submenu`, `menuitemcheckbox`/`menuitemradio`, `.tg-menu__item-meta`

**Назначение**: команды над объектом — по кнопке «…», правому клику или из профиля.
Расширяет B14 группами, подменю и отмечаемыми пунктами.

**Состав**: заголовок группы; пункты с иконкой, подписью, описанием, сочетанием клавиш;
подменю; отмечаемые пункты; опасный пункт.

```html
<div class="tg-menu" role="menu" aria-label="Действия с файлом">
  <div role="group" aria-labelledby="mg-view">
    <div class="tg-menu__label" id="mg-view">Вид</div>
    <button class="tg-menu__item" role="menuitemcheckbox" aria-checked="true">Показывать закладки</button>
  </div>
  <button class="tg-menu__item" role="menuitem" aria-haspopup="menu" aria-expanded="false">Ещё
    <svg class="tg-icon" aria-hidden="true">…chevron-right…</svg></button>
  <div class="tg-menu__separator" role="separator"></div>
  <button class="tg-menu__item tg-menu__item--destructive" role="menuitem">Удалить навсегда
    <kbd class="tg-menu__shortcut">⌘⌫</kbd></button>
</div>
```

**API** (предлагаемое): `__label` — 12–14 px `--text-secondary`; `__item-meta` —
вторая строка описания; подменю открывается сбоку (inline-end), на мобильном —
переход «вглубь» с кнопкой «Назад» (51).

**Варианты из референсов**: «Add block» с описаниями (3), меню проекта (4), базовые
(6, 14, 15, 31, 37, 61, 72), контекстные (10, 11, 12 с checkable и radio), панель
действий с опасным пунктом (32), меню пользователя с темой (36), drill-down подменю
(51), радиальное «marking menu» (18 — P2, альтернатива — обычный список).

**Состояния**: как B14 + checked, submenu expanded.

**Поведение и ответственность приложения**: B14 + →/Enter открывают подменю, ← закрывает;
контекстное меню — `contextmenu` + Shift+F10 и клавиша меню; позиция у курсора с
удержанием в viewport.

**Адаптивность**: на сенсорных устройствах контекстное меню вызывается долгим нажатием
и показывается как sheet.

**Доступность**: роли пунктов соответствуют поведению; состояния отметки в ARIA.

**Токены и связь с TDS**: как B14.

**Критерии готовности**: подменю доступно с клавиатуры; контекстное меню имеет кнопочную альтернативу.

**Референсы** (16):

- `bundui--dropdown-menu11--84362075.webp` — Add Block Dropdown Menu
- `ibrandify--anchored-action-menu--786dc9a1.webp` — Anchored action menu
- `sean0205--base-menu--3788770b.webp` — Base Menu
- `subframeapp--context-menu-1--353c4fbe.webp` — Context Menu
- `ddoemonn--context-menu--bae2d283.webp` — Context Menu
- `sean0205--context-menu-1--17234266.webp` — Context Menu
- `prebuiltui--dropdown-menu--e8d24410.webp` — Dropdown Menu
- `wensity--dropdown-menu--7d650d77.webp` — Dropdown Menu
- `kokonutd--kokonut-marking-menu--08d3279a.webp` — Kokonut UI Marking Menu
- `skyleen77--radix-dropdown-menu--33badb3d.webp` — Radix Dropdown Menu
- `ruixen-ui--ruixen-menu-options--7b8b1da4.webp` — RuixenMenuOptions
- `kuratlielia--user-menu--0999df85.webp` — User Menu
- `ln-dev7--indevui-dropdown-menu--9642cfcb.webp` — indevuiDropdownMenu
- `shadcnspace--dropdown-menu-04--e1c9f7a7.webp` — Drill-down Submenu Dropdown
- `retroui--menu-style-default--ecfd1bbe.webp` — Menu
- `reshaped--reshaped-menu-item--ca45660f.webp` — Reshaped Menu item

### N10. Палитра команд

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-command`, `__input`, `__list`, `__group`, `__item`, `__shortcut`, `__footer`

**Назначение**: быстрый поиск команд и разделов по Cmd/Ctrl+K. Каталог TDS уже
содержит глобальный поиск на `dialog` — палитра обобщает его.

**Состав**: `dialog`; поле поиска; сгруппированный список результатов; подсказки клавиш в футере;
необязательная панель превью.

```html
<dialog class="tg-modal tg-command" aria-label="Команды">
  <div class="tg-search">
    <input class="tg-search__input tg-command__input" type="search" role="combobox"
           aria-expanded="true" aria-controls="cmd-list" aria-activedescendant="cmd-1"
           aria-label="Введите команду или поиск">
  </div>
  <div class="tg-command__list" id="cmd-list" role="listbox">
    <div class="tg-command__group" role="group" aria-labelledby="cg-nav">
      <div id="cg-nav" class="tg-menu__label">Переходы</div>
      <div class="tg-command__item" role="option" id="cmd-1" aria-selected="true">Открыть дашборд
        <kbd class="tg-command__shortcut">G D</kbd></div>
    </div>
  </div>
</dialog>
```

**API** (предлагаемое): ширина до 40rem, верхнее положение (20vh); пункты 44 px;
активный — `--background-muted`.

**Варианты из референсов**: палитра с превью документа (8), глобальный поиск с
недавними (9), классический command (46).

**Состояния**: empty query (недавние), results, loading, no results (`.tg-empty`), item active.

**Поведение и ответственность приложения**: Cmd/Ctrl+K и `/` (не в поле ввода)
открывают без анимации; ↑/↓, Enter, Escape; фокус возвращается; поиск и ранжирование.

**Адаптивность**: на мобильном — полноэкранный диалог.

**Доступность**: combobox + listbox; количество результатов в status.

**Токены и связь с TDS**: `--overlay-bg`, `--shadow-overlay`.

**Критерии готовности**: совместим с текущим поиском каталога (тот же контракт клавиш).

**Референсы** (3):

- `uvain--command-menu-palette--e414fc46.webp` — Command Menu
- `ephraimduncan--command-menu-04--a0ddfc92.webp` — Command Menu with Global Search
- `originui--command--c687d593.webp` — Command

### N11. Боковая панель

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-sidebar`, `__header`, `__section`, `__link`, `__footer`, `.tg-sidebar--collapsed`

**Назначение**: основная навигация веб-приложения/дашборда с группами, вложенностью,
поиском и профилем.

**Состав**: бренд/рабочее пространство; поиск; группы ссылок с заголовками; вложенные
разделы (`details`); счётчики; профиль и действие в футере.

```html
<nav class="tg-sidebar" aria-label="Приложение">
  <div class="tg-sidebar__header"><a class="tg-brand" href="/">Able</a></div>
  <ul class="tg-sidebar__section" aria-labelledby="sb-main">
    <li class="tg-menu__label" id="sb-main">Основное</li>
    <li><a class="tg-sidebar__link" href="/" aria-current="page">Дашборд</a></li>
    <li>
      <details class="tg-disclosure" open>
        <summary class="tg-disclosure__trigger tg-sidebar__link">Аналитика</summary>
        <ul><li><a class="tg-sidebar__link" href="/analytics/live">В реальном времени</a></li></ul>
      </details>
    </li>
  </ul>
  <div class="tg-sidebar__footer">…профиль…</div>
</nav>
```

**API** (предлагаемое): ширина 16–18rem; ссылка 40–44 px, `--radius-inset`, текущая —
подложка `--background-muted` + `--text-main`; `--collapsed` — только иконки
(подписи доступны через `aria-label`/подсказку).

**Варианты из референсов**: тёмная панель дашборда (48), многоуровневое меню (67),
простая (75), с поиском и профилем (76).

**Состояния**: link default/hover/focus/current; group expanded/collapsed; панель collapsed.

**Поведение и ответственность приложения**: текущий раздел, сохранение свёрнутости,
раскрытие группы с текущей страницей.

**Адаптивность**: до 64rem — скрыта за кнопкой меню в `dialog` (off-canvas).

**Доступность**: `nav` с именем; вложенность через `details` (нативная клавиатура);
`aria-current="page"`.

**Токены и связь с TDS**: `--background-panel`, `--background-muted`, `--border-subtle-color`.

**Критерии готовности**: работает без JS (details); свёрнутый вид не теряет имён.

**Референсы** (4):

- `arunjdass--dashboard-sidebar--6fc2d8d5.webp` — Dashboard Sidebar
- `cnippet-dev--multi-level-collapsible-menu--c030ec6e.webp` — Multi-level Collapsible Menu
- `preetsuthar17--sidebar--40e2b1c6.webp` — Sidebar
- `uiable--sidebar-5--a2045095.webp` — Sidebar with Search and Profile

### N12. Пагинация

Статус: `extend` · Приоритет: `P0` · Существующие `.tg-pagination`, `.tg-dot` (точки); предлагаемые `.tg-pager`, `.tg-pager__link`, `.tg-pager__ellipsis`, `.tg-pager__info`

**Назначение**: переход между страницами списка или таблицы. Точки `.tg-pagination` —
для карусели и онбординга, нумерация `.tg-pager` — для данных.

**Состав**: «Назад»; номера с многоточием; «Вперёд»; необязательно «Стр. 1 из 10» и
выбор размера страницы.

```html
<nav class="tg-pager" aria-label="Страницы">
  <a class="tg-pager__link" href="?p=1" rel="prev">Назад</a>
  <a class="tg-pager__link" href="?p=1">1</a>
  <a class="tg-pager__link" href="?p=2" aria-current="page">2</a>
  <span class="tg-pager__ellipsis" aria-hidden="true">…</span>
  <a class="tg-pager__link" href="?p=10">10</a>
  <a class="tg-pager__link" href="?p=3" rel="next">Вперёд</a>
</nav>
```

**API** (предлагаемое): ссылки — геометрия `.tg-btn--ghost` 44 px; текущая — обводка
`--action-border-color` или заливка `--accent-soft`; `__info` — `.tg-num`; размер
страницы — `.tg-select`.

**Варианты из референсов**: нумерованная (28, 43, 69, 71, 73), с информацией и размером
страницы (70), табличная «Rows per page / 1–10 of 100» (79).

**Состояния**: link default/hover/focus/current; prev/next disabled (`aria-disabled` на
`a` без `href`).

**Поведение и ответственность приложения**: расчёт диапазона страниц, URL, загрузка данных.

**Адаптивность**: на мобильном — «Назад · 2 из 10 · Вперёд».

**Доступность**: `nav aria-label`; текущая — `aria-current="page"`; у номеров имя «Страница 3».

**Токены и связь с TDS**: `--control-h`, `--accent-soft`, `--action-border-color`.

**Критерии готовности**: работает как обычные ссылки без JS.

**Референсы** (7):

- `originui--numbered-pagination--a4eede40.webp` — Numbered Pagination
- `isaiahbjork--primitive-pagination--ef5a30e8.webp` — Bjork Pagination
- `thegridcn--thegridcn-pagination--79026c80.webp` — Pagination
- `bundui--pagination9--b84278bb.webp` — Pagination with Page Info and Page Size
- `shadcnui-blocks--pagination-04--7d74adfc.webp` — Pagination with Rounded Buttons
- `reshaped--reshaped-pagination--817cf637.webp` — Reshaped Pagination
- `shadcnui-blocks--pagination-14--9905e453.webp` — Table Pagination

### N13. Оглавление

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-toc`, `.tg-toc__link`, `.tg-toc__link--nested`

**Назначение**: навигация по разделам длинной страницы с подсветкой текущего.

**Состав**: заголовок «На странице»; список якорных ссылок с вложенностью; индикатор текущего.

```html
<nav class="tg-toc" aria-labelledby="toc-title">
  <h2 id="toc-title" class="tg-text-sm tg-text-muted">На странице</h2>
  <ol>
    <li><a class="tg-toc__link" href="#intro" aria-current="location">Введение</a></li>
    <li><a class="tg-toc__link tg-toc__link--nested" href="#geometry">Геометрия</a></li>
  </ol>
</nav>
```

**API** (предлагаемое): линия на inline-start `--border-subtle-color`, текущая —
`--accent-main` 2 px; вложенные — отступ `--space-4`.

**Варианты из референсов**: оглавление с карточкой превью раздела (80), классическое (81).

**Состояния**: link default/hover/focus/current.

**Поведение и ответственность приложения**: IntersectionObserver для текущего раздела
(`aria-current="location"`); остановка корректировки при ручной прокрутке.

**Адаптивность**: на десктопе — sticky справа; на мобильном — `details` над контентом.

**Доступность**: `nav` с именем; переход по якорю переводит фокус к заголовку.

**Токены и связь с TDS**: `--border-subtle-color`, `--accent-main`.

**Критерии готовности**: работает без JS (ссылки-якоря).

**Референсы** (2):

- `zanwei--table-of-content--1bdc946d.webp` — Table of Content
- `inference-sh--table-of-contents--764c0b15.webp` — Table of Contents

### N14. Список разделов со счётчиками

Статус: `existing` · Приоритет: `P1` · Классы: `.tg-list`, `a.tg-list-item[href]`, `.tg-badge`

**Назначение**: разделы почты/папки со счётчиками непрочитанного.

**Состав**: строки-ссылки с иконкой, названием и бейджем-счётчиком.

```html
<nav aria-label="Папки">
  <ul class="tg-list">
    <li><a class="tg-list-item" href="/inbox" aria-current="page">Входящие
      <span class="tg-badge tg-badge--primary tg-ms-auto">14<span class="tg-sr-only"> непрочитанных</span></span></a></li>
  </ul>
</nav>
```

**API**: существующий.

**Варианты из референсов**: список с бейджами (59).

**Состояния**: hover, focus-visible, current.

**Поведение и ответственность приложения**: счётчики.

**Адаптивность**: на всю ширину.

**Доступность**: бейдж входит в имя ссылки.

**Токены и связь с TDS**: как `.tg-list`.

**Критерии готовности**: без новых классов.

**Референсы** (1):

- `uiable--list-group-badge--408dc349.webp` — List Group Badge

### N15. Меню уведомлений

Статус: `composition` · Приоритет: `P1` · Состав: всплывающая поверхность B14 + `.tg-tabs` + `.tg-list` + `.tg-avatar` + `.tg-btn`

**Назначение**: список уведомлений из иконки-колокольчика с фильтрами и действиями.

**Состав**: заголовок и «Прочитать все»; вкладки фильтров; список с аватаром, текстом,
временем и действиями; пустое состояние.

```html
<section class="tg-card tg-col tg-gap-3" aria-labelledby="notif-title">
  <header class="tg-row tg-justify-between">
    <h2 class="tg-header__title" id="notif-title">Уведомления</h2>
    <button class="tg-btn tg-btn--ghost tg-btn--sm" type="button">Прочитать все</button>
  </header>
  <ul class="tg-list"><li class="tg-list-item">…</li></ul>
</section>
```

**API**: новых классов нет.

**Варианты из референсов**: меню уведомлений с действиями «Принять/Отклонить» (27).

**Состояния**: unread (точка `.tg-dot`), read, empty (`.tg-empty`), loading (`.tg-skeleton`).

**Поведение и ответственность приложения**: данные, отметка прочитанного.

**Адаптивность**: на мобильном — отдельная страница или sheet.

**Доступность**: непрочитанное — текстом для экранного диктора, не только точкой.

**Токены и связь с TDS**: как у составляющих.

**Критерии готовности**: собирается без новых классов.

**Референсы** (1):

- `ahmedmayara--notifications-menu--c4ae9840.webp` — Notifications Menu

### N16. Навигация карусели

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-carousel`, `__viewport`, `__slide`, `__controls`; точки — существующие `.tg-pagination`/`.tg-dot`

**Назначение**: просмотр набора слайдов по одному с кнопками и индикаторами. Подробные
композиции галерей — `galleries/components.md`.

**Состав**: область прокрутки со snap; слайды; кнопки «назад/вперёд»; индикаторы.

```html
<section class="tg-carousel" aria-roledescription="карусель" aria-label="Фотографии">
  <div class="tg-carousel__viewport" tabindex="0">
    <div class="tg-carousel__slide" role="group" aria-roledescription="слайд" aria-label="1 из 5">…</div>
  </div>
  <div class="tg-carousel__controls">
    <button class="tg-icon-btn" type="button" aria-label="Предыдущий слайд">‹</button>
    <div class="tg-pagination"><button class="tg-dot" type="button" aria-label="Слайд 1" aria-current="true"></button></div>
    <button class="tg-icon-btn" type="button" aria-label="Следующий слайд">›</button>
  </div>
</section>
```

**API** (предлагаемое): `__viewport` — `overflow-x: auto; scroll-snap-type: x mandatory`;
кнопки прокручивают на ширину слайда.

**Варианты из референсов**: карусель изображений со стрелками (47).

**Состояния**: first/last (кнопка disabled), current slide.

**Поведение и ответственность приложения**: прокрутка, синхронизация точек; без
автопрокрутки по умолчанию; при автопрокрутке — кнопка паузы.

**Адаптивность**: свайп нативной прокруткой.

**Доступность**: APG Carousel; текущий слайд объявляется только при ручном переключении.

**Токены и связь с TDS**: `--radius-lg`.

**Критерии готовности**: работает как прокручиваемая область без JS.

**Референсы** (1):

- `shadcnspace--carousel-02--21a4146f.webp` — Custom Navigation Carousel

### N17. Навигация календаря

Статус: `composition` · Приоритет: `P1` · Состав: календарь `forms` F21 + `.tg-select` для месяца/года

**Назначение**: быстрый переход по месяцам и годам в календаре.

**Состав**: выпадающие месяц/год; стрелки; сетка.

```html
<div class="tg-calendar__header">
  <select class="tg-select" aria-label="Месяц"><option>Август</option></select>
  <select class="tg-select" aria-label="Год"><option>2026</option></select>
  <button class="tg-icon-btn tg-icon-btn--ghost" type="button" aria-label="Следующий месяц">›</button>
</div>
```

**API**: из F21; новых классов нет.

**Варианты из референсов**: выпадающие месяц/год (45), стрелки справа (74).

**Состояния**: как F21.

**Поведение и ответственность приложения**: как F21.

**Адаптивность**: как F21.

**Доступность**: у select имена.

**Токены и связь с TDS**: как F21.

**Критерии готовности**: см. forms F21.

**Референсы** (2):

- `cnippet-dev--v-calendar-4--9f5bad49.webp` — Calendar with Dropdown Navigation
- `shadcnspace--calendar-10--f1e799bd.webp` — Right Side Navigation Calendar

## Порядок реализации

1. **P0:** документировать N1 (модификаторы `--underline`, `--segmented`) и N6; ввести
   N4 `.tg-site-nav` и sticky/floating шапку; N12 `.tg-pager`; N9 расширения `.tg-menu`
   (после buttons B14).
2. **P1:** N10 палитра (на базе поиска каталога и F9 combobox), N11 боковая панель,
   N5 мега-меню, N3 вертикальные вкладки, N13 оглавление, N16 карусель (общая с galleries).
3. **P1, композиции:** N14, N15, N17.
4. **P2:** N8 menubar, N2, N7 эффекты dock.

## Контрольный список покрытия

| Группа | Референсов |
| --- | ---: |
| N1. Вкладки | 14 |
| N2. Раскрывающиеся иконочные вкладки | 3 |
| N3. Вертикальные вкладки и навигация настроек | 2 |
| N4. Шапка сайта | 13 |
| N5. Мега-меню и выпадающая навигация | 4 |
| N6. Мобильная навигация | 2 |
| N7. Dock | 7 |
| N8. Строка меню (menubar) | 7 |
| N9. Выпадающее и контекстное меню | 16 |
| N10. Палитра команд | 3 |
| N11. Боковая панель | 4 |
| N12. Пагинация | 7 |
| N13. Оглавление | 2 |
| N14. Список разделов со счётчиками | 1 |
| N15. Меню уведомлений | 1 |
| N16. Навигация карусели | 1 |
| N17. Навигация календаря | 2 |
| **Итого** | **89 из 89** |

Каждый из 89 файлов папки указан ровно в одной основной группе. Перекрёстные ссылки на другие категории даны текстом, без повторного учёта.
