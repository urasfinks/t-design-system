# Первые экраны (hero) — спецификации компонентов

## Назначение категории

Папка `heroes` (15 превью): первые экраны лендингов — полноэкранные слайдеры
изображений, декоративные фоны (поля частиц, волны, звёзды), bento-сетки, hero с
шапкой и CTA, hero с формой. Все — **композиции**. Декоративные фоны специфицированы как
опциональные эффекты (см. `shaders/components.md`); hero обязан быть понятен и без них.

## Сводная таблица

| Компонент / паттерн | Тип работы | Референсов | Приоритет |
| --- | --- | ---: | --- |
| H1. Hero со слайдером изображений | `composition` | 5 | `P2` |
| H2. Hero с декоративным фоном | `composition` | 6 | `P2` |
| H3. Hero-bento | `composition` | 1 | `P2` |
| H4. Hero с шапкой и действиями | `composition` | 1 | `P1` |
| H5. Hero с формой | `composition` | 1 | `P2` |
| H6. Hero с карточкой продукта | `composition` | 1 | `P2` |

## Общие решения категории

- **Структура.** `header` (navigation N4) → `main` → `section.hero` с единственным `h1`,
  подзаголовком, одним primary и одним secondary действием, необязательным медиа.
- **Типографика.** Заголовок через `clamp()` от `--fs-lg`×2 до ~3.5rem, вес умеренный,
  трекинг не плотнее −0.03 em; ширина текста до 40ch.
- **Фон.** Сплошной `--background-main` по умолчанию. Изображение — через `.tg-media`
  с затемнением `--overlay-bg` под текстом; анимированный фон — `aria-hidden`, отключается
  при reduced motion, не блокирует первый рендер и не обязателен (без WebGL текст и CTA
  остаются).
- **Высота.** Не больше `100svh`; на мобильном — по содержимому, CTA видны без прокрутки.
- **Производительность.** Изображение hero — `fetchpriority="high"`, корректный `srcset`;
  эффекты загружаются после первого рендера.
- **Ответственность приложения** — тексты, медиа, эффекты, аналитика.

## Спецификации компонентов

### H1. Hero со слайдером изображений

Статус: `composition` · Приоритет: `P2` · Состав: `.tg-carousel` (navigation N16) + `.tg-card--overlay` (cards C2) + `.tg-btn`

**Назначение**: первый экран из нескольких полноэкранных изображений с подписью и
навигацией (путешествия, портфолио).

**Состав**: слайды-изображения с заголовком; кнопки «назад/вперёд», счётчик; пауза при
автопрокрутке.

```html
<section class="tg-carousel" aria-roledescription="карусель" aria-label="Направления">
  <button class="tg-btn tg-btn--secondary tg-btn--sm" type="button" aria-pressed="false">Пауза</button>
  <div class="tg-carousel__viewport" tabindex="0">
    <figure class="tg-carousel__slide tg-card--overlay" role="group" aria-roledescription="слайд" aria-label="1 из 4">
      <img src="/clouds.jpg" alt="Горный хребет над облаками на закате">
      <figcaption><h1>Над облаками</h1><p>Валле, Швейцария</p></figcaption>
    </figure>
  </div>
</section>
```

**API**: из N16 и C2. Переходы между слайдами (растекание чернил 4, RGB-глитч 9, ступенчатый
морфинг 12, размытие с зумом 15) — P2-эффекты; базовый переход — fade `opacity`.

**Варианты из референсов**: ink blot (4), аккордеон изображений с текстом слева (5 — см.
galleries G4), RGB-глитч (9), ступенчатый морфинг с номером слайда (12), зум-размытие (15).

**Состояния**: playing/paused, current slide, first/last.

**Поведение и ответственность приложения**: автопрокрутка выключена по умолчанию; если
включена — пауза кнопкой, при hover и фокусе, остановка при взаимодействии (WCAG 2.2.2).

**Адаптивность**: подпись под изображением на узких экранах при нехватке контраста.

**Доступность**: только текущий слайд в дереве доступности; `h1` один на страницу
(в первом слайде или вне карусели).

**Токены и связь с TDS**: `--overlay-bg`, `--overlay-text`.

**Критерии готовности**: reduced motion — без переходов; управление с клавиатуры.

**Референсы** (5):

- `kedhareswer--ink-blot-carousel--eb12d88c.webp` — Ink Blot Reveal Image Carousel
- `minhxthanh--interactive-image-accordion--dbb37185.webp` — Interactive Image Accordion
- `kedhareswer--rgb-glitch-carousel--6cc30ed1.webp` — RGB Glitch Image Carousel
- `kedhareswer--stepped-morph-slider--5045478a.webp` — Stepped Morph Image Slider
- `kedhareswer--lens-zoom-carousel--4f213830.webp` — Zoom Blur Image Carousel

### H2. Hero с декоративным фоном

Статус: `composition` · Приоритет: `P2` · Состав: hero-текст + декоративный слой (shaders SH1) `aria-hidden`

**Назначение**: первый экран с анимированным абстрактным фоном (волны, частицы, звёзды,
поле точек).

**Состав**: фон-слой; заголовок; подзаголовок; CTA.

```html
<section class="tg-container tg-col tg-gap-4 tg-align-center tg-text-center" aria-labelledby="hero-title">
  <canvas class="tg-effect-layer" aria-hidden="true"></canvas>
  <h1 id="hero-title">Звуковая волна</h1>
  <p class="tg-text-muted">Анализ потока в реальном времени.</p>
  <a class="tg-btn tg-btn--primary" href="/start">Начать</a>
</section>
```

**API**: предлагаемый `.tg-effect-layer` — абсолютный слой за содержимым с
`pointer-events: none`, `z-index: -1` в изолированном контексте (подробно — shaders).

**Варианты из референсов**: «размерное поле» (2), полутоновый баннер портфолио (8),
звуковая волна (10), звёздное поле (11), поле точек (14), лунная гравитация (6).

**Состояния**: effect running/paused/unavailable (фолбэк — сплошной фон).

**Поведение и ответственность приложения**: запуск эффекта после загрузки, пауза при
невидимости (IntersectionObserver, `visibilitychange`).

**Адаптивность**: на слабых устройствах и мобильном эффект упрощается или выключается.

**Доступность**: контраст текста проверяется на самом светлом кадре фона; reduced motion — статичный кадр.

**Токены и связь с TDS**: фон-эффект берёт цвета из `--accent-main`/`--background-main`.

**Критерии готовности**: страница полностью работает без эффекта.

**Референсы** (6):

- `mengto--dimensional-field--f1c65777.webp` — Dimensional Field
- `alexperezcedeno--lunar-gravity-card--c92551cc.webp` — Lunar Gravity Card
- `iamtoribryan--portfolio-banner--b97f24a4.webp` — Portfolio Banner
- `dhileepkumargm--sonic-waveform--b4dbe47d.webp` — Sonic Waveform
- `designali-in--starfield-1--1bdcf4bf.webp` — Starfield
- `mengto--void-field--8e43ae87.webp` — Void Field

### H3. Hero-bento

Статус: `composition` · Приоритет: `P2` · Состав: hero-текст + `.tg-grid--bento` (cards C16) + `.tg-badge`

**Назначение**: заголовок и плитки-направления сразу на первом экране.

**Состав**: заголовок и описание; bento-плитки с бейджами («Скоро»).

```html
<section class="tg-container tg-grid" aria-labelledby="h3-title">
  <h1 id="h3-title">Частные проекты теперь открыты</h1>
  <div class="tg-grid tg-grid--bento"><article class="tg-card">…<span class="tg-badge tg-badge--secondary">Скоро</span></article></div>
</section>
```

**API**: из C16; пастельные заливки плиток не переносятся.

**Варианты из референсов**: цветная bento-сетка (1).

**Состояния**: статично.

**Поведение и ответственность приложения**: содержимое.

**Адаптивность**: по C16.

**Доступность**: `h1` один.

**Токены и связь с TDS**: как C16.

**Критерии готовности**: без новых цветов.

**Референсы** (1):

- `radu--colorful-bento-grid--77524458.webp` — Colorful Bento Grid

### H4. Hero с шапкой и действиями

Статус: `composition` · Приоритет: `P1` · Состав: navigation N4 + hero-текст + `.tg-btn` ×2

**Назначение**: классический первый экран SaaS: шапка, заголовок, подзаголовок, два действия.

**Состав**: шапка; `h1`; подзаголовок; primary и secondary CTA; необязательная иллюстрация.

```html
<header class="tg-page-header">…N4…</header>
<main>
  <section class="tg-container tg-col tg-gap-4 tg-align-center tg-text-center" aria-labelledby="h4-title">
    <h1 id="h4-title">Собирайте и развёртывайте в облаке</h1>
    <p class="tg-text-muted">Инструменты и инфраструктура для веба.</p>
    <div class="tg-toolbar tg-justify-center">
      <a class="tg-btn tg-btn--primary" href="/start">Начать развёртывание</a>
      <a class="tg-btn tg-btn--secondary" href="/demo">Демо</a>
    </div>
  </section>
</main>
```

**API**: новых классов нет.

**Варианты из референсов**: шапка Vercel-типа с hero (13 — градиентная иллюстрация
внизу декоративна).

**Состояния**: статично.

**Поведение и ответственность приложения**: ссылки.

**Адаптивность**: CTA в столбец на 320 px.

**Доступность**: skip-link; один `h1`.

**Токены и связь с TDS**: как у составляющих.

**Критерии готовности**: пример в разделе «Композиции».

**Референсы** (1):

- `designali-in--vercel-navbar--9254de63.webp` — Vercel Navbar

### H5. Hero с формой

Статус: `composition` · Приоритет: `P2` · Состав: `.tg-grid` + иллюстрация + sign-in S1

**Назначение**: экран входа/регистрации с иллюстрацией или маскотом.

**Состав**: иллюстрация; форма.

```html
<main class="tg-grid tg-align-center">
  <img src="/mascot.svg" alt="" class="tg-hide-mobile">
  <form class="tg-card" aria-labelledby="h5-title"><h1 id="h5-title" class="tg-header__title">Вход</h1>…</form>
</main>
```

**API**: из sign-in S1/S4.

**Варианты из референсов**: лис-маскот со входом (3).

**Состояния**: как S1.

**Поведение и ответственность приложения**: как S1.

**Адаптивность**: иллюстрация скрывается на мобильном.

**Доступность**: иллюстрация декоративна.

**Токены и связь с TDS**: как S1.

**Критерии готовности**: см. sign-in.

**Референсы** (1):

- `fadeichev2121--fox-mascot-sign-in--9013e384.webp` — Fox Mascot Sign In

### H6. Hero с карточкой продукта

Статус: `composition` · Приоритет: `P2` · Состав: `.tg-card` + C6 + `.tg-btn` на нейтральном фоне

**Назначение**: первый экран, демонстрирующий продукт одной живой карточкой.

**Состав**: карточка с данными (прогноз «дождь через 20 минут», график осадков, действие).

```html
<section class="tg-container tg-col tg-align-center" aria-label="Пример планировщика">
  <article class="tg-card tg-stat"><p class="tg-stat__label">Дождь через 20 мин</p>
    <p class="tg-stat__value tg-num">42 минуты</p><button class="tg-btn tg-btn--primary" type="button">Начать</button></article>
</section>
```

**API**: новых классов нет.

**Варианты из референсов**: карточка-планировщик (7).

**Состояния**: статично.

**Поведение и ответственность приложения**: данные.

**Адаптивность**: карточка до 24rem.

**Доступность**: график — с текстовым резюме.

**Токены и связь с TDS**: как C6.

**Критерии готовности**: без новых классов.

**Референсы** (1):

- `ravikatiyar162--planner-card--bcaf41c0.webp` — Planner Card

## Порядок реализации

1. **P1:** H4 в каталоге композиций (после navigation N4).
2. **P2:** H1 (после navigation N16), H2 (после shaders `.tg-effect-layer`), H3, H5, H6.

## Контрольный список покрытия

| Группа | Референсов |
| --- | ---: |
| H1. Hero со слайдером изображений | 5 |
| H2. Hero с декоративным фоном | 6 |
| H3. Hero-bento | 1 |
| H4. Hero с шапкой и действиями | 1 |
| H5. Hero с формой | 1 |
| H6. Hero с карточкой продукта | 1 |
| **Итого** | **15 из 15** |

Каждый из 15 файлов папки указан ровно в одной основной группе. Перекрёстные ссылки на другие категории даны текстом, без повторного учёта.
