# Отзывы — спецификации компонентов

## Назначение категории

Папка `testimonials` (30 превью): карточки отзывов, сетки, слайдеры, бегущие ленты
и полосы логотипов клиентов. Основа — один компонент цитаты (`figure` +
`blockquote` + `figcaption`), остальное — раскладки. Главный риск — автопрокрутка и
бесконечные ленты: документ требует паузу, reduced motion и статичную альтернативу.

## Сводная таблица

| Компонент / паттерн | Тип работы | Референсов | Приоритет |
| --- | --- | ---: | --- |
| TS1. Карточка отзыва | `new` | 8 | `P1` |
| TS2. Сетка отзывов | `composition` | 7 | `P1` |
| TS3. Слайдер и стопка отзывов | `composition` | 8 | `P2` |
| TS4. Бегущая лента отзывов | `new` | 5 | `P2` |
| TS5. Полоса доверия с логотипами | `composition` | 1 | `P1` |
| TS6. Вход с отзывом | `composition` | 1 | `P2` |

## Общие решения категории

- **Семантика цитаты.** `figure` → `blockquote` (текст отзыва) → `figcaption` (автор,
  роль, компания). Рейтинг — текст «5 из 5» + декоративные звёзды.
- **Подлинность.** Компонент показывает реальные отзывы, переданные приложением; примеры
  в каталоге помечены как образец и не используют реальных людей и компаний.
- **Аватар** — `.tg-avatar` с `alt=""` (имя уже в подписи); логотип компании — изображение
  с `alt` названия или текст.
- **Движение.** Автопрокрутка и marquee выключены при reduced motion; всегда есть кнопка
  паузы; при hover/фокусе движение останавливается (WCAG 2.2.2).
- **Длинный текст** — ограничение 6–8 строк с «Читать полностью» (`details`), а не
  обрезка без доступа к полному тексту.
- **Ответственность приложения** — отзывы, их источник и согласие авторов, порядок,
  загрузка.

## Спецификации компонентов

### TS1. Карточка отзыва

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-testimonial`, `__quote`, `__author`, `__rating`, `__media`

**Назначение**: один отзыв с автором; используется отдельно или в TS2–TS4.

**Состав**: необязательный рейтинг; текст; автор (аватар, имя, роль, компания);
необязательное фото автора крупно (12, 18).

```html
<figure class="tg-card tg-testimonial">
  <p class="tg-testimonial__rating"><span aria-hidden="true">★★★★★</span><span class="tg-sr-only">5 из 5</span></p>
  <blockquote class="tg-testimonial__quote">
    <p>Компоненты экономят нам неделю на каждом проекте.</p>
  </blockquote>
  <figcaption class="tg-testimonial__author">
    <span class="tg-avatar"><img class="tg-avatar__clip" src="/a.jpg" alt=""></span>
    <span class="tg-col"><strong>Сара Чен</strong><span class="tg-text-sm tg-text-muted">CEO, Пример</span></span>
  </figcaption>
</figure>
```

**API** (предлагаемое): `__quote` — 16–18 px, `--text-main`, без курсива по умолчанию;
кавычка-иконка декоративна; `__rating` — звёзды цвета `--accent-main` (не жёлтого);
`__media` — вариант с фото слева/сверху.

**Варианты из референсов**: тёмная карточка с рейтингом (3), минимальная с группой
аватаров (7), отзыв с аватаром по центру (16), строка с подтверждённым аккаунтом (17),
с портретом (18, 12 split), карточки с рейтингом (19), «Trusted by thousands» (25).

**Состояния**: статично; длинный текст — свёрнут/развёрнут.

**Поведение и ответственность приложения**: данные.

**Адаптивность**: фото над текстом на мобильном.

**Доступность**: правильная семантика цитаты; рейтинг текстом.

**Токены и связь с TDS**: `--radius-lg`, `--accent-main`, `.tg-avatar`.

**Критерии готовности**: звёзды без нового цвета; цитата корректно читается диктором.

**Референсы** (8):

- `lavikatiyar--card-1--48ce604f.webp` — Card
- `jatin-yadav05--minimal-testimonial--de250c19.webp` — Minimal Testimonial
- `jatin-yadav05--split-testimonial--1fe3012e.webp` — Split Testimonial
- `anurag-mishra22--testimonial--6731bd90.webp` — Testimonial
- `ncdai--testimonial--dfbe2a6b.webp` — Testimonial
- `ravikatiyar162--testimonial--435ab977.webp` — Testimonial
- `preetsuthar17--testimonial-card--1c191765.webp` — Testimonial Card
- `tommyjepsen--testimonials--b78e8d64.webp` — Testimonials

### TS2. Сетка отзывов

Статус: `composition` · Приоритет: `P1` · Состав: `section` + `.tg-grid` / колонки masonry + TS1

**Назначение**: несколько отзывов одновременно на странице.

**Состав**: заголовок секции; сетка или колонки разной высоты; необязательная кнопка
«Показать ещё».

```html
<section class="tg-container tg-col tg-gap-6" aria-labelledby="reviews-title">
  <h2 id="reviews-title">Нас любят разработчики</h2>
  <ul class="tg-grid" role="list"><li><!-- TS1 --></li></ul>
</section>
```

**API**: новых классов нет; masonry — `columns: 18rem` (порядок чтения по колонкам
приемлем для независимых отзывов) или `grid-template-rows: masonry` как улучшение.

**Варианты из референсов**: встроенные отзывы (6), шахматная сетка (14), секция с
акцентными карточками (21 — синие заливки не переносятся, акцент — рамкой), портреты (22),
сетки (24, 26 — с логотипами, 27 — тёмная).

**Состояния**: статично; «Показать ещё» — загрузка.

**Поведение и ответственность приложения**: пагинация отзывов.

**Адаптивность**: 3 → 2 → 1 колонка.

**Доступность**: список отзывов; «Показать ещё» переносит фокус на первый новый.

**Токены и связь с TDS**: `--space-4`.

**Критерии готовности**: без новых цветов.

**Референсы** (7):

- `educalvolpz--inline-testimonials--9667abfe.webp` — Inline Testimonials
- `efferd--testimonials-3--b3dc5fd1.webp` — Staggered Testimonials Grid
- `solaceui--testimonial-section-1--de22cb77.webp` — Testimonial Section
- `solaceui--testimonial-section-4--1ca88884.webp` — Testimonial Section 4
- `ayushmxxn--testimonials--ff4a22c2.webp` — Testimonials
- `shadcnui-blocks--testimonials-13--27fc7cda.webp` — Testimonials 13
- `efferd--testimonials-section--300ccb33.webp` — Testimonials Section

### TS3. Слайдер и стопка отзывов

Статус: `composition` · Приоритет: `P2` · Состав: `.tg-carousel` (navigation N16) / `.tg-card-stack` (cards C15) + TS1

**Назначение**: по одному отзыву за раз с переключением.

**Состав**: область слайда; кнопки; индикаторы; пауза при автопрокрутке.

```html
<section class="tg-carousel" aria-roledescription="карусель" aria-label="Отзывы клиентов">
  <div class="tg-carousel__viewport" tabindex="0">
    <div class="tg-carousel__slide" role="group" aria-roledescription="слайд" aria-label="1 из 6"><!-- TS1 --></div>
  </div>
  <div class="tg-carousel__controls">…</div>
</section>
```

**API**: из N16/C15.

**Варианты из референсов**: стопка карточек (2), дизайн-отзыв с крупным номером (4),
ретро-карусель (8), «катушка» (9), скользящий (11), «веер» (13), слайдер (15),
полноэкранный с миниатюрами авторов (23).

**Состояния**: как N16.

**Поведение и ответственность приложения**: как N16; автопрокрутка выключена по умолчанию.

**Адаптивность**: свайп.

**Доступность**: как N16; миниатюры авторов — кнопки с именами.

**Токены и связь с TDS**: как N16.

**Критерии готовности**: reduced motion — смена без анимации.

**Референсы** (8):

- `youcefbnm--animated-cards-stack--3e4003d4.webp` — Animated Cards Stack
- `jatin-yadav05--design-testimonial--c1b80463.webp` — Design Testimonial
- `ishamsu--retro-testimonial--ad5787d1.webp` — Retro Testimonial Carousel
- `smammar--scroll-reel-testimonials--49ca60a2.webp` — Scroll Reel Testimonials
- `kinfe123--sliding-testimonial--0d04dcbc.webp` — Sliding Testimonial
- `vaib215--stagger-testimonials--099af010.webp` — Stagger Testimonials
- `karthikmudunuri--testimonal-slider--358d0b56.webp` — Testimonal Slider 
- `kavikatiyar--testimonial-slider-1--4efe0a67.webp` — Testimonial Slider

### TS4. Бегущая лента отзывов

Статус: `new` · Приоритет: `P2` · Предлагаемые классы: `.tg-marquee`, `.tg-marquee__track`, `.tg-marquee--vertical`, `.tg-marquee__pause`

**Назначение**: бесконечная горизонтальная или вертикальная лента отзывов/логотипов как
фон доверия.

**Состав**: дорожка с элементами; дубликат для бесшовности (`aria-hidden`); кнопка паузы.

```html
<section class="tg-marquee" aria-label="Отзывы">
  <button class="tg-btn tg-btn--ghost tg-btn--sm tg-marquee__pause" type="button" aria-pressed="false">Остановить ленту</button>
  <ul class="tg-marquee__track"><li><!-- TS1 --></li>…</ul>
  <ul class="tg-marquee__track" aria-hidden="true"><!-- копия --></ul>
</section>
```

**API** (предлагаемое): анимация `transform: translateX(-100%)` дорожки
(`--marquee-duration`, документированное свойство); `animation-play-state: paused` при
`:hover`, `:focus-within` и `aria-pressed="true"`; маска краёв — misc M22.

**Варианты из референсов**: бесконечные карточки (5), лента (20), с полосой логотипов (28),
вертикальная (29), с подписью секции (30).

**Состояния**: running, paused, reduced (статичная сетка).

**Поведение и ответственность приложения**: кнопка паузы.

**Адаптивность**: на мобильном — горизонтальная прокрутка вручную вместо автодвижения.

**Доступность**: копия скрыта от диктора и из порядка фокуса (`inert`); при reduced motion
— статичный список; пауза ≥ 5 s движения обязательна.

**Токены и связь с TDS**: `--duration` не используется — длительность ленты своя, но в документированном свойстве.

**Критерии готовности**: проходит WCAG 2.2.2; без JS — статичный ряд с прокруткой.

**Референсы** (5):

- `nexus-ui--infinite-moving-cards--a3df816f.webp` — Infinite Moving Cards
- `componentry--testimonial-marquee--3323b28e.webp` — Testimonial Marquee
- `kedhareswer--ink-orbit-testimonials--7ae5611d.webp` — Testimonials Section with Logo Marquee
- `scrollxui--testimonials-with-verticalmarquee--062a2cc9.webp` — Testimonials Vertical Marquee
- `serafimcloud--testimonials-with-marquee--0a0722e3.webp` — Testimonials with Marquee

### TS5. Полоса доверия с логотипами

Статус: `composition` · Приоритет: `P1` · Состав: `section` + `ul` логотипов; подробнее о каруселях логотипов — `galleries/components.md` (G7)

**Назначение**: утверждение («Нам доверяют…») и логотипы клиентов.

**Состав**: короткий текст; ряд логотипов (монохромные, `--text-secondary` через `currentColor` SVG).

```html
<section class="tg-container tg-col tg-gap-3 tg-align-center" aria-labelledby="trust">
  <p id="trust" class="tg-text-muted">Помогаем компаниям и их сотрудникам</p>
  <ul class="tg-row tg-gap-6 tg-justify-center" role="list">
    <li><img src="/logo-a.svg" alt="Компания A" height="24"></li>
  </ul>
</section>
```

**API**: новых классов нет.

**Варианты из референсов**: утверждение с логотипами (1).

**Состояния**: статично.

**Поведение и ответственность приложения**: логотипы и права на их использование.

**Адаптивность**: перенос; на мобильном — 2–3 в ряд.

**Доступность**: `alt` с названием компании.

**Токены и связь с TDS**: `--text-secondary`.

**Критерии готовности**: логотипы монохромны во всех темах.

**Референсы** (1):

- `uilayout-contact--testimonial-1--a5ab866f.webp` — Testimonial

### TS6. Вход с отзывом

Статус: `composition` · Приоритет: `P2` · Состав: sign-in S4 + TS1

**Назначение**: страница входа с отзывом клиента на медиа-половине.

**Состав**: форма; изображение с карточкой отзыва поверх.

```html
<main class="tg-grid">
  <form class="tg-card" aria-labelledby="ts6-title"><h1 id="ts6-title" class="tg-header__title">Добро пожаловать</h1>…</form>
  <aside class="tg-hide-mobile"><!-- TS1 поверх изображения --></aside>
</main>
```

**API**: из S4/TS1.

**Варианты из референсов**: вход с отзывом на абстрактном фоне (10).

**Состояния**: как S1.

**Поведение и ответственность приложения**: как S1.

**Адаптивность**: отзыв скрыт на мобильном.

**Доступность**: `aside` с отзывом после формы в DOM.

**Токены и связь с TDS**: как у составляющих.

**Критерии готовности**: см. sign-in.

**Референсы** (1):

- `jahed--sign-in--3182ee40.webp` — Sign In

## Порядок реализации

1. **P1:** TS1 `.tg-testimonial`; примеры TS2 и TS5.
2. **P2:** TS4 `.tg-marquee` (общий с galleries G7), TS3 (после navigation N16), TS6.

## Контрольный список покрытия

| Группа | Референсов |
| --- | ---: |
| TS1. Карточка отзыва | 8 |
| TS2. Сетка отзывов | 7 |
| TS3. Слайдер и стопка отзывов | 8 |
| TS4. Бегущая лента отзывов | 5 |
| TS5. Полоса доверия с логотипами | 1 |
| TS6. Вход с отзывом | 1 |
| **Итого** | **30 из 30** |

Каждый из 30 файлов папки указан ровно в одной основной группе. Перекрёстные ссылки на другие категории даны текстом, без повторного учёта.
