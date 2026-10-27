# Галереи и слайдеры — спецификации компонентов

## Назначение категории

Папка `galleries` (34 превью): карусели изображений (обычные и 3D), сетки с
фильтрами, аккордеоны изображений, сравнение «до/после», ленты логотипов и — по
названию «slider» — ползунки значений. Базовый механизм — нативная прокрутка со snap
(`.tg-carousel`, navigation N16); 3D, coverflow, веер и «портал» — P2-эффекты поверх
того же контракта. Ползунки значений отнесены к forms F18 по семантике.

## Сводная таблица

| Компонент / паттерн | Тип работы | Референсов | Приоритет |
| --- | --- | ---: | --- |
| G1. Карусель изображений | `extend` | 9 | `P1` |
| G2. 3D-карусели и coverflow | `extend` | 7 | `P2` |
| G3. Сетка галереи с фильтром | `composition` | 3 | `P1` |
| G4. Аккордеон изображений | `new` | 2 | `P2` |
| G5. Галерея в диалоге | `composition` | 1 | `P1` |
| G6. Сравнение изображений | `composition` | 2 | `P2` |
| G7. Лента логотипов | `composition` | 3 | `P1` |
| G8. Ползунки значений | `composition` | 6 | `P1` |
| G9. Разворачивающийся буклет | `composition` | 1 | `P2` |

## Общие решения категории

- **Карусель = прокручиваемая область.** `overflow-x: auto` + `scroll-snap`; кнопки и
  точки — улучшение. Без JS всё содержимое доступно прокруткой.
- **Автопрокрутка** выключена по умолчанию; при включении — кнопка паузы, остановка
  при hover/фокусе/взаимодействии; reduced motion — только ручное переключение.
- **Изображения** — `alt` по смыслу, `loading="lazy"` кроме первого слайда,
  `aspect-ratio` для отсутствия сдвигов; подписи — `figcaption`.
- **3D-эффекты** (perspective, rotateY) — только `transform`/`opacity`, не влияют на
  порядок фокуса и семантику; на сенсорных и при reduced motion — плоская лента.
- **Цвет** — фоновые и рамочные цвета из ролей; фильтры изображений (ч/б → цвет)
  допускаются как `filter` на изображении, не как новые цвета интерфейса.
- **Ответственность приложения** — медиа, порядок, загрузка, полноэкранный просмотр,
  синхронизация индикаторов.

## Спецификации компонентов

### G1. Карусель изображений

Статус: `extend` · Приоритет: `P1` · Базовый компонент — `.tg-carousel` (navigation N16); предлагаемые `.tg-carousel--peek`, `.tg-carousel__thumbs`, `.tg-carousel--vertical`

**Назначение**: последовательный просмотр изображений с подписями.

**Состав**: область просмотра; слайды-изображения; подпись; стрелки; точки или
миниатюры; счётчик.

```html
<section class="tg-carousel tg-carousel--peek" aria-roledescription="карусель" aria-label="Пейзажи">
  <div class="tg-carousel__viewport" tabindex="0">
    <figure class="tg-carousel__slide" role="group" aria-roledescription="слайд" aria-label="1 из 6">
      <img src="/desert.jpg" alt="Красные скалы пустыни под голубым небом">
      <figcaption>Сахарское золото</figcaption>
    </figure>
  </div>
  <div class="tg-carousel__thumbs" role="group" aria-label="Выбор слайда">
    <button type="button" aria-label="Слайд 1" aria-current="true"><img src="/desert-s.jpg" alt=""></button>
  </div>
</section>
```

**API** (предлагаемое): `--peek` — соседние слайды видны по краям (`scroll-padding`);
`__thumbs` — миниатюры-кнопки 44 px, текущая с рамкой `--accent-main`; `--vertical` —
вертикальная ось со snap по Y.

**Варианты из референсов**: базовые (5, 6, 22), «элегантная» с текстом слева (21),
вертикальная (15), вертикальные миниатюры (34), бесконечная лента (16 — loop без дубликатов
в дереве доступности), изогнутая (33 — эффект P2), подпись с размытием (11 — подложка
`--overlay-bg` вместо `backdrop-filter`).

**Состояния**: current slide, first/last, playing/paused, loading.

**Поведение и ответственность приложения**: ←/→ на области, кнопки, синхронизация
индикаторов через IntersectionObserver.

**Адаптивность**: свайп нативной прокруткой; миниатюры уходят под изображение.

**Доступность**: APG Carousel; только текущий слайд объявляется при ручном переключении.

**Токены и связь с TDS**: `--radius-lg`, `--accent-main`, `--overlay-bg`.

**Критерии готовности**: работает без JS как прокрутка.

**Референсы** (9):

- `appica-dev--carousel--c4dad647.webp` — Carousel
- `manuarora700--carousel--076cb324.webp` — Carousel
- `ibelick--progressive-blur--cecd6004.webp` — Progressive blur
- `shadcnui-blocks--carousel-03--80748bf1.webp` — Vertical Carousel
- `hardikkashiyani123456788--argent-loop-infinite-slider--32bfbbe1.webp` — argent-loop-infinite-slider
- `dev-yadhakim--elegant-carousel--5c24186c.webp` — Elegant Carousel
- `uilayout-contact--framer-carousel--1612c055.webp` — Framer Carousel
- `mirukullacode--tweenly-curved-carousel--018a6037.webp` — Tweenly Curved Carousel
- `uilayout-contact--vertical-thumbnail-slider--cc06c904.webp` — Vertical Thumbnail Slider

### G2. 3D-карусели и coverflow

Статус: `extend` · Приоритет: `P2` · Модуль `effects`: предлагаемые `.tg-carousel--coverflow`, `.tg-carousel--fan`, `.tg-carousel--ring`

**Назначение**: выразительные маркетинговые галереи (альбомы, портфолио).

**Состав**: G1 + трансформации слайдов по расстоянию до центра.

```html
<section class="tg-carousel tg-carousel--coverflow" aria-roledescription="карусель" aria-label="Альбомы">…G1…</section>
```

**API** (предлагаемое): трансформации — `rotateY`, `translateZ`, `scale` через
scroll-driven animations (`animation-timeline: view()`) или JS-улучшение; без
поддержки — плоская G1.

**Варианты из референсов**: CD-диски (1), 3D-лента (2), веер карточек (4), стеклянная (8),
портал (10), coverflow с меню (17), круговая (19).

**Состояния**: как G1.

**Поведение и ответственность приложения**: как G1.

**Адаптивность**: на мобильном — плоская лента.

**Доступность**: reduced motion — плоская лента; порядок фокуса не меняется трансформациями.

**Токены и связь с TDS**: как G1.

**Критерии готовности**: при отключённом эффекте — полноценная G1.

**Референсы** (7):

- `kedhareswer--disc-cascade-carousel--479d027c.webp` — 3D CD Disc Carousel
- `cult-ui--3d-carousel--cfddf030.webp` — 3D Carousel
- `aayush-duhan--card-fan-carousel--eed058c3.webp` — Card Fan Carousel
- `ham7a311--glass-carousel--76fe0b54.webp` — Glass Carousel
- `hyperiux--portal-carousel--3bca931b.webp` — Portal Carousel
- `dg-singh252525--3-d-coverflow-carousel--bb99be87.webp` — 3D Coverflow Carousel
- `nexus-ui--circular-carousel--ebca4120.webp` — Circular Carousel

### G3. Сетка галереи с фильтром

Статус: `composition` · Приоритет: `P1` · Состав: `.tg-grid` + `.tg-chip` (фильтры) + `figure` + forms F19 (добавление)

**Назначение**: просмотр набора изображений сеткой, фильтр по категории, добавление новых.

**Состав**: фильтры-чипы; сетка миниатюр; счётчик; плитка «+ добавить».

```html
<section aria-labelledby="gal-title">
  <h2 id="gal-title">Галерея</h2>
  <div role="group" aria-label="Фильтр" class="tg-row tg-gap-2"><button class="tg-chip" type="button" aria-pressed="true">Все</button></div>
  <ul class="tg-grid" role="list" style="--grid-min: 10rem">
    <li><a href="/photo/1"><img src="/p1.jpg" alt="Путник в поле"></a></li>
  </ul>
</section>
```

**API**: новых классов нет; минимальная ширина плитки — локальное свойство сетки,
если `.tg-grid` его поддерживает (предлагается документировать `--grid-min`).

**Варианты из референсов**: фильтр с ч/б → цвет (7), бесконечное поле изображений (9 — P2
панорамирование), сетка с загрузкой (14).

**Состояния**: filter active, empty (`.tg-empty`), loading (skeleton плиток).

**Поведение и ответственность приложения**: фильтрация, загрузка.

**Адаптивность**: 2 колонки на мобильном.

**Доступность**: результат фильтра в status; изображения со смысловым `alt`.

**Токены и связь с TDS**: `--radius-inset`.

**Критерии готовности**: без новых классов, кроме `--grid-min`.

**Референсы** (3):

- `dhxwhy--color-filter-gallery--f4193df9.webp` — Color Filter Image Gallery
- `componentry--infinite-image-field--0b6671e3.webp` — Infinite Image Field
- `elements--uploadthing-image-grid--eb95acfd.webp` — UploadThing Image Grid

### G4. Аккордеон изображений

Статус: `new` · Приоритет: `P2` · Предлагаемые классы: `.tg-image-accordion`, `__item`, `__trigger`, `__panel`

**Назначение**: ряд узких вертикальных полос-изображений, одна раскрыта с подписью.

**Состав**: элементы-кнопки; раскрытая панель с изображением и текстом.

```html
<div class="tg-image-accordion" role="group" aria-label="Направления">
  <button class="tg-image-accordion__trigger" type="button" aria-expanded="true" aria-controls="ia-1">Горы</button>
  <figure class="tg-image-accordion__panel" id="ia-1"><img src="/m.jpg" alt="Горное озеро"><figcaption>Горы</figcaption></figure>
</div>
```

**API** (предлагаемое): раскладка `grid-template-columns` с `fr` по состоянию;
переход — без анимации ширины (DESIGN.md запрещает): смена мгновенная + `opacity`
подписи; на мобильном — вертикальный список `details`.

**Варианты из референсов**: «корешки» (12), галерея-аккордеон с модальным просмотром (23).

**Состояния**: item collapsed/expanded, hover (только превью, без раскрытия по hover на сенсорных).

**Поведение и ответственность приложения**: одна раскрытая; Enter/Space раскрывают.

**Адаптивность**: вертикальный стек на мобильном.

**Доступность**: `aria-expanded`; подписи текстом у каждого триггера.

**Токены и связь с TDS**: `--radius-lg`.

**Критерии готовности**: нет анимации ширины.

**Референсы** (2):

- `crafterui--spine-accordion--0885c0ac.webp` — Spine Accordion
- `uilayout-contact--gallery-modal-accordion--f7016dab.webp` — Gallery Modal Accordion

### G5. Галерея в диалоге

Статус: `composition` · Приоритет: `P1` · Состав: `dialog.tg-modal` + G1 + `.tg-btn`

**Назначение**: просмотр изображений крупно в модальном окне (тур, товар).

**Состав**: диалог; карусель; описание; действия.

```html
<dialog class="tg-modal" aria-labelledby="trip-title">
  <div class="tg-modal__sheet">
    <h2 class="tg-header__title" id="trip-title">Поездка на Бали</h2>
    <section class="tg-carousel" aria-roledescription="карусель" aria-label="Фото поездки">…</section>
    <form method="dialog" class="tg-modal__footer"><button class="tg-btn tg-btn--primary">Забронировать</button></form>
  </div>
</dialog>
```

**API**: новых классов нет.

**Варианты из референсов**: анимированная модалка с фото и деталями тура (3).

**Состояния**: как B16 + G1.

**Поведение и ответственность приложения**: как B16; ←/→ в карусели не конфликтуют с диалогом.

**Адаптивность**: `--sheet` на мобильном.

**Доступность**: как B16.

**Токены и связь с TDS**: как B16.

**Критерии готовности**: без новых классов.

**Референсы** (1):

- `manuarora700--animated-modal--f55ad7c1.webp` — Animated Modal

### G6. Сравнение изображений

Статус: `composition` · Приоритет: `P2` · Компонент `.tg-compare` специфицирован в `cards/components.md` (C21)

**Назначение**: «до/после» перетаскиванием разделителя.

**Состав**: два изображения; ползунок-разделитель.

```html
<div class="tg-compare" style="--compare: 50%">
  <img class="tg-compare__before" src="/bw.jpg" alt="До: чёрно-белый снимок">
  <img class="tg-compare__after" src="/color.jpg" alt="После: цветной снимок">
  <input class="tg-range tg-compare__handle" type="range" min="0" max="100" value="50" aria-label="Положение разделителя">
</div>
```

**API**: из C21.

**Варианты из референсов**: сравнение пейзажа (20), раскрытие изображения (24).

**Состояния**: как C21.

**Поведение и ответственность приложения**: как C21.

**Адаптивность**: как C21.

**Доступность**: как C21.

**Токены и связь с TDS**: как C21.

**Критерии готовности**: см. C21.

**Референсы** (2):

- `diceui--compare-slider--76508701.webp` — Compare Slider
- `motiondotdev--motion-image-reveal-slider--5ea9258e.webp` — Image reveal slider

### G7. Лента логотипов

Статус: `composition` · Приоритет: `P1` · Состав: testimonials TS5 (статичная полоса) / TS4 `.tg-marquee` (движущаяся)

**Назначение**: логотипы клиентов или партнёров.

**Состав**: подпись; ряд логотипов; при движении — дубликат и пауза.

```html
<section class="tg-marquee" aria-label="Нам доверяют">
  <button class="tg-btn tg-btn--ghost tg-btn--sm tg-marquee__pause" type="button" aria-pressed="false">Остановить</button>
  <ul class="tg-marquee__track"><li><img src="/stripe.svg" alt="Stripe" height="24"></li></ul>
  <ul class="tg-marquee__track" aria-hidden="true">…</ul>
</section>
```

**API**: из TS4/TS5. Логотипы монохромны через `currentColor` или `filter: grayscale(1)`.

**Варианты из референсов**: «Join new cult» (25), «Powering the Web» (26), «Trusted by
fast-growing teams» (27).

**Состояния**: как TS4.

**Поведение и ответственность приложения**: логотипы и права.

**Адаптивность**: как TS4.

**Доступность**: как TS4; `alt` с названием компании.

**Токены и связь с TDS**: `--text-secondary`.

**Критерии готовности**: см. TS4.

**Референсы** (3):

- `cult-ui--logo-carousel--ebe596c3.webp` — Logo Carousel
- `jahed--logo-carousel--776049cf.webp` — Logo Carousel
- `witharc--logo-carousel--1a760bb9.webp` — Logo Carousel

### G8. Ползунки значений

Статус: `composition` · Приоритет: `P1` · Компонент — forms F18 (`.tg-range`, `.tg-range-field`, `.tg-range-dual`)

**Назначение**: выбор числа или интервала (громкость, температура, окно времени, угол,
позиция воспроизведения) — референсы попали в галереи из-за слова «slider».

**Состав**: label; значение; ползунок; деления; для интервала — два ползунка.

```html
<div class="tg-range-field">
  <label class="tg-label" for="temp">Температура</label>
  <output class="tg-range-field__output tg-num" for="temp">21 °C</output>
  <input class="tg-range" id="temp" type="range" min="16" max="30" value="21" aria-valuetext="21 градус, комфортно">
</div>
```

**API**: из F18. Круговой ползунок угла (18) — P2-вариант: `role="slider"` с ↑/↓/←/→.

**Варианты из референсов**: угол (18), скраббер воспроизведения (28 — forms F33),
поле формы (29), число с анимацией (30 — смена цифр `transform`), температура (31),
окно времени (32 — двойной).

**Состояния**: как F18.

**Поведение и ответственность приложения**: как F18.

**Адаптивность**: как F18.

**Доступность**: `aria-valuetext` с единицами.

**Токены и связь с TDS**: как F18.

**Критерии готовности**: см. forms F18.

**Референсы** (6):

- `anubra266--angle-slider--ff15ac99.webp` — Angle Slider
- `sltowl--matte-scrub-slider--bdd609ce.webp` — Playback Scrubber
- `coss-com--p-slider-23--a4b130d0.webp` — Slider Form Field
- `barvian--slider-number-flow--773a792d.webp` — Slider Number Flow
- `shadcnspace--slider-03--143676ee.webp` — Temperature Control Slider
- `sltowl--matte-hours-slider--6232a095.webp` — Time Window Slider

### G9. Разворачивающийся буклет

Статус: `composition` · Приоритет: `P2` · Состав: `.tg-card` + `.tg-btn` + misc M1 (на мобильном)

**Назначение**: меню ресторана/буклет, раскрывающийся по действию.

**Состав**: обложка; развороты с разделами; действие «Забронировать».

```html
<section class="tg-card" aria-labelledby="menu-title">
  <h2 id="menu-title">Осеннее меню</h2>
  <div class="tg-grid"><section aria-labelledby="m-a"><h3 id="m-a">Закуски</h3><ul>…</ul></section></div>
  <a class="tg-btn tg-btn--primary" href="/book">Забронировать стол</a>
</section>
```

**API**: новых классов нет; эффект раскрытия створок (13) — P2 `transform: rotateY`.

**Варианты из референсов**: трёхстворчатое меню (13).

**Состояния**: closed/open.

**Поведение и ответственность приложения**: содержимое.

**Адаптивность**: на мобильном — разделы аккордеоном.

**Доступность**: содержимое доступно без раскрытия-эффекта; reduced motion — без вращения.

**Токены и связь с TDS**: как у составляющих.

**Критерии готовности**: без эффекта содержимое полностью читается.

**Референсы** (1):

- `21st--mg-food-menu-unfold--342e87ba.webp` — Trifold Menu Unfold

## Порядок реализации

1. **P1:** G1 расширения `.tg-carousel` (после navigation N16); композиции G3, G5, G7, G8.
2. **P2:** G2 эффекты, G4, G6 (после cards C21), G9.

## Контрольный список покрытия

| Группа | Референсов |
| --- | ---: |
| G1. Карусель изображений | 9 |
| G2. 3D-карусели и coverflow | 7 |
| G3. Сетка галереи с фильтром | 3 |
| G4. Аккордеон изображений | 2 |
| G5. Галерея в диалоге | 1 |
| G6. Сравнение изображений | 2 |
| G7. Лента логотипов | 3 |
| G8. Ползунки значений | 6 |
| G9. Разворачивающийся буклет | 1 |
| **Итого** | **34 из 34** |

Каждый из 34 файлов папки указан ровно в одной основной группе. Перекрёстные ссылки на другие категории даны текстом, без повторного учёта.
