# Секции возможностей — спецификации компонентов

## Назначение категории

Папка `features` (17 превью): маркетинговые секции, объясняющие возможности
продукта, — сетки карточек с иконками, bento-раскладки, акцентные карточки, ряды меток,
переключаемые демонстрации. Это **композиции** из примитивов TDS (`.tg-card`, `.tg-grid`,
`.tg-badge`, `.tg-tabs`, `.tg-disclosure`, `.tg-media`) и предложенных в других
документах (`.tg-grid--bento` из cards C16, `.tg-carousel` из navigation N16).
Документ не дублирует внутренние примитивы, а задаёт структуру секции, порядок дочерних
элементов и адаптивные перестроения.

## Сводная таблица

| Компонент / паттерн | Тип работы | Референсов | Приоритет |
| --- | --- | ---: | --- |
| FE1. Сетка возможностей | `composition` | 6 | `P1` |
| FE2. Bento возможностей | `composition` | 4 | `P1` |
| FE3. Акцентная карточка возможности | `composition` | 2 | `P2` |
| FE4. Ряд меток | `composition` | 1 | `P2` |
| FE5. Переключаемая демонстрация | `composition` | 3 | `P1` |
| FE6. Карусель возможностей | `composition` | 1 | `P2` |

## Общие решения категории

- **Каркас секции.** `section` с `aria-labelledby`; заголовочная структура
  `.section-heading`-подобная: `h2` + вводный абзац 16 px; без декоративных номеров и
  eyebrow-надписей (DESIGN.md). Отступ между секциями — 64 px на десктопе (`--space-16`),
  40 px на мобильном.
- **Контейнер** — `.tg-container` (72rem); текстовые секции — `--reading`.
- **Карточки возможностей** — плоские `.tg-card` с иконкой Feather 24 px в
  `--accent-readable`, заголовком `h3` и описанием 14–16 px. Иллюстрации и фото —
  `.tg-card__media`. Цветные пастельные фоны карточек (10, 13) не переносятся:
  различие — иллюстрацией, а не новой палитрой.
- **Перестроения.** 3–4 колонки → 2 (≥ 36rem) → 1; bento — по правилам cards C16.
  Порядок DOM = порядок чтения.
- **Движение.** Появление при прокрутке — только `opacity`/`transform` и только один
  раз; reduced motion — без появления.
- **Ответственность приложения** — тексты, иллюстрации, ссылки, аналитика.

## Спецификации компонентов

### FE1. Сетка возможностей

Статус: `composition` · Приоритет: `P1` · Состав: `section` + `.tg-container` + `.tg-grid` + `.tg-card` + `.tg-icon` + `.tg-link`

**Назначение**: 3–9 равноправных возможностей с иконкой и коротким описанием.

**Состав**: заголовок секции и вводный текст; сетка карточек; в каждой — иконка,
`h3`, описание, необязательная ссылка «Подробнее».

```html
<section class="tg-container tg-col tg-gap-6" aria-labelledby="feat-title">
  <div class="tg-col tg-gap-2">
    <h2 id="feat-title">Четыре опоры. Один деплой.</h2>
    <p class="tg-text-muted">Всё, что нужно для запуска, в одном месте.</p>
  </div>
  <ul class="tg-grid" role="list">
    <li class="tg-card tg-col tg-gap-2">
      <svg class="tg-icon tg-text-accent" aria-hidden="true">…zap…</svg>
      <h3 class="tg-header__title">Развёртывание за секунды</h3>
      <p class="tg-text-muted">Каждый пуш — новое превью.</p>
    </li>
  </ul>
</section>
```

**API**: новых классов нет.

**Варианты из референсов**: четыре опоры (2), сетка с иконками (3), чипы-возможности на
тёмном фоне (6 — компактные строки иконка + текст, `.tg-list` в сетке), «Grid card» с
сеткой-фоном (11 — фон декоративный), пастельные карточки с иллюстрациями (10),
сервисы с иллюстрациями (13).

**Состояния**: статично; карточка-ссылка — hover/focus по cards C1 `--link`.

**Поведение и ответственность приложения**: тексты и иконки.

**Адаптивность**: `.tg-grid` (минимум 18rem); компактный вариант (6) — 2 колонки на мобильном.

**Доступность**: список карточек — `ul`; иконки декоративны; заголовки `h3` под `h2` секции.

**Токены и связь с TDS**: `--accent-readable`, `--radius-lg`, `--space-6`.

**Критерии готовности**: собирается без новых классов в трёх темах.

**Референсы** (6):

- `ln-dev7--bento-01--1675d8e7.webp` — Bento Feature Grid
- `manuarora700--bento-grid--8781038b.webp` — Bento Grid
- `21st--chip-grid--8cee0d0e.webp` — Chip Grid
- `ravikatiyar162--gradient-card--5c347bbf.webp` — Gradient Card
- `efferd--grid-card--3cf03f54.webp` — Grid Card
- `lavikatiyar--service-card--2d4fdc88.webp` — Service Card

### FE2. Bento возможностей

Статус: `composition` · Приоритет: `P1` · Состав: `.tg-grid--bento` (cards C16) + `.tg-card` + C6 KPI + `.tg-card__media`

**Назначение**: обзор продукта плитками разного размера: скриншоты, крупные цифры,
интеграции.

**Состав**: заголовок; bento-сетка; плитки с медиа, KPI (`10×`, `42%`), списками.

```html
<section class="tg-container" aria-labelledby="bento-feat">
  <h2 id="bento-feat">Возможности продукта</h2>
  <div class="tg-grid tg-grid--bento">
    <article class="tg-card" style="--span: 2"><h3 class="tg-header__title">Интеграция с Zapier</h3>…</article>
    <article class="tg-card tg-stat"><p class="tg-stat__value tg-num">10×</p><p class="tg-stat__label">быстрее релизы</p></article>
  </div>
</section>
```

**API**: из cards C16/C6.

**Варианты из референсов**: фото-bento (4), продуктовые возможности с числами (5),
лупа над плиткой (12 — эффект P2), превью компонентов (14).

**Состояния**: статично.

**Поведение и ответственность приложения**: содержимое.

**Адаптивность**: по C16.

**Доступность**: числа с подписью в одной плитке; медиа с `alt`.

**Токены и связь с TDS**: как C16.

**Критерии готовности**: без эффектов выглядит законченно.

**Референсы** (4):

- `ravikatiyar162--bento-grid--8fca79a1.webp` — Bento Grid
- `kavikatiyar--bento-product-features--d2747aec.webp` — Bento Product Features
- `0xurvish--magnified-bento--581942a3.webp` — Magnified Bento
- `reuno-ui--special-card--bc050921.webp` — Special Card

### FE3. Акцентная карточка возможности

Статус: `composition` · Приоритет: `P2` · Состав: `.tg-card` + `.tg-card__media` + `.tg-progress` + `.tg-btn`

**Назначение**: одна возможность крупно — с иллюстрацией или живым примером данных.

**Состав**: иллюстрация/пример; заголовок; описание; действие.

```html
<article class="tg-card tg-col tg-gap-3 tg-text-center" aria-labelledby="timing">
  <figure class="tg-card__media"><img src="/stopwatch.png" alt=""></figure>
  <h3 class="tg-header__title" id="timing">Идеальный момент</h3>
  <p class="tg-text-muted">Индикаторы подсказывают, когда входить в сделку.</p>
  <a class="tg-btn tg-btn--primary" href="/try">Попробовать</a>
</article>
```

**API**: новых классов нет.

**Варианты из референсов**: накопительные цели с прогрессом (8), карточка с иллюстрацией
и CTA (9).

**Состояния**: статично.

**Поведение и ответственность приложения**: данные примера.

**Адаптивность**: на всю ширину на мобильном.

**Доступность**: декоративная иллюстрация `alt=""`; прогресс — с подписью и значением.

**Токены и связь с TDS**: `--progress-color`.

**Критерии готовности**: без новых классов.

**Референсы** (2):

- `ravikatiyar162--feature-card--9b15eae6.webp` — Feature Card
- `ravikatiyar162--feature-highlight-card--d624e0ef.webp` — Feature Highlight Card

### FE4. Ряд меток

Статус: `composition` · Приоритет: `P2` · Состав: `p` + `.tg-badge` / `code`

**Назначение**: короткое утверждение с набором меток (методы API, поддерживаемые
платформы).

**Состав**: фраза; метки в строке.

```html
<p class="tg-row tg-gap-2 tg-justify-center">Каждый метод типизирован:
  <code class="tg-badge tg-badge--secondary">GET</code>
  <code class="tg-badge tg-badge--primary">POST</code>
  <code class="tg-badge tg-badge--destructive">DELETE</code>
</p>
```

**API**: новых классов нет; цвета методов сводятся к трём ролям бейджа, не к пяти
отдельным цветам.

**Варианты из референсов**: методы HTTP на тёмном фоне (1).

**Состояния**: статично.

**Поведение и ответственность приложения**: нет.

**Адаптивность**: перенос меток.

**Доступность**: метки — текст; `translate="no"` для кода.

**Токены и связь с TDS**: `.tg-badge`.

**Критерии готовности**: без новых цветов.

**Референсы** (1):

- `21st--badge-row--96287be2.webp` — Badge Row

### FE5. Переключаемая демонстрация

Статус: `composition` · Приоритет: `P1` · Состав: `.tg-tabs`/`details.tg-disclosure` (navigation N1, misc M1) + `.tg-media`

**Назначение**: список возможностей слева и иллюстрация выбранной справа.

**Состав**: вкладки или аккордеон с короткими описаниями; панель с иллюстрацией
или примером кода.

```html
<section class="tg-container tg-grid" aria-labelledby="demo-title">
  <h2 id="demo-title" class="tg-sr-only">Возможности</h2>
  <div class="tg-tabs tg-tabs--vertical" role="tablist" aria-orientation="vertical" aria-label="Возможности">
    <button class="tg-tab" role="tab" aria-selected="true" aria-controls="demo-text">Текст</button>
    <button class="tg-tab" role="tab" aria-selected="false" aria-controls="demo-img" tabindex="-1">Изображения</button>
  </div>
  <div role="tabpanel" id="demo-text" class="tg-media">…</div>
</section>
```

**API**: из N1/N3 и M1.

**Варианты из референсов**: аккордеон с изображением (7), вкладки с иллюстрацией (16),
аккордеон возможностей (17).

**Состояния**: как N1/M1.

**Поведение и ответственность приложения**: как N1; без автопереключения по таймеру
(или с паузой и остановкой при взаимодействии).

**Адаптивность**: на мобильном — аккордеон, иллюстрация внутри раскрытого раздела.

**Доступность**: как N1/M1.

**Токены и связь с TDS**: как N1.

**Критерии готовности**: мобильный вид без дублирования содержимого.

**Референсы** (3):

- `shadcnblockscom--accordion-feature-section--70fe54c0.webp` — Feature 197
- `cult-ui--tabs-illustration-vercel--1fd077cb.webp` — Tabs Illustration Vercel
- `ruixen-ui--feature-accordion-section--b5dee363.webp` — Feature Accordion Section

### FE6. Карусель возможностей

Статус: `composition` · Приоритет: `P2` · Состав: `.tg-carousel` (navigation N16) + `.tg-card__media`

**Назначение**: набор изображений-возможностей с раскрытием активного слайда.

**Состав**: слайды-изображения; подпись активного; кнопки.

```html
<section class="tg-carousel" aria-roledescription="карусель" aria-label="Примеры раскладок">…</section>
```

**API**: N16; «сжатие» соседних слайдов (15) — `transform: scaleX` слайдов, P2.

**Варианты из референсов**: сжимающаяся карусель (15).

**Состояния**: как N16.

**Поведение и ответственность приложения**: как N16.

**Адаптивность**: как N16.

**Доступность**: как N16.

**Токены и связь с TDS**: как N16.

**Критерии готовности**: см. N16.

**Референсы** (1):

- `yura--carousel-squeeze--8a3fce85.webp` — Squeeze Carousel

## Порядок реализации

1. **P1:** примеры FE1, FE2, FE5 в разделе «Композиции» каталога — после cards C1/C16 и
   navigation N1/N3.
2. **P2:** FE3, FE4, FE6.

## Контрольный список покрытия

| Группа | Референсов |
| --- | ---: |
| FE1. Сетка возможностей | 6 |
| FE2. Bento возможностей | 4 |
| FE3. Акцентная карточка возможности | 2 |
| FE4. Ряд меток | 1 |
| FE5. Переключаемая демонстрация | 3 |
| FE6. Карусель возможностей | 1 |
| **Итого** | **17 из 17** |

Каждый из 17 файлов папки указан ровно в одной основной группе. Перекрёстные ссылки на другие категории даны текстом, без повторного учёта.
