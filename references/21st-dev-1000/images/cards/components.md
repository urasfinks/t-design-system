# Карточки — спецификации компонентов

## Назначение категории

Папка `cards` (152 превью). Карточка в TDS — плоская панель `.tg-card` с рамкой и
радиусом 16 px. Почти все референсы — это **композиции** внутри карточки: медиа,
товар, профиль, статистика, график, список, квитанция, пост. Новыми компонентами
становятся только элементы с собственной семантикой: зоны карточки (`__media`,
`__footer`), KPI-плитка, карточка-ссылка целиком, всплывающая hover-карточка,
хронология и стопка карточек. Декоративные эффекты (glare, голограмма, 3D-наклон)
вынесены в опциональный модуль.

## Сводная таблица

| Компонент / паттерн | Тип работы | Референсов | Приоритет |
| --- | --- | ---: | --- |
| C1. Базовая карточка и её зоны | `extend` | 10 | `P0` |
| C2. Медиа-карточка | `extend` | 11 | `P0` |
| C3. Карточка товара | `composition` | 7 | `P1` |
| C4. Карточка профиля и контакта | `composition` | 6 | `P1` |
| C5. Всплывающая карточка (hover card) | `new` | 6 | `P1` |
| C6. KPI-плитка | `new` | 6 | `P0` |
| C7. Карточка с графиком | `composition` | 14 | `P1` |
| C8. Платёжная карта и способ оплаты | `composition` | 5 | `P2` |
| C9. Финансовые сводки | `composition` | 4 | `P1` |
| C10. Список в карточке | `composition` | 8 | `P0` |
| C11. Хронология и ход процесса | `new` | 4 | `P1` |
| C12. Статусные карточки | `existing` | 2 | `P0` |
| C13. Квитанция и сводка | `composition` | 5 | `P1` |
| C14. Публикация и пост | `composition` | 6 | `P1` |
| C15. Стопка и колода карточек | `new` | 12 | `P2` |
| C16. Bento-сетка | `composition` | 6 | `P1` |
| C17. Раскрывающаяся карточка | `extend` | 3 | `P1` |
| C18. Декоративные эффекты карточек | `extend` | 12 | `P2` |
| C19. Формы в карточке | `composition` | 13 | `P1` |
| C20. Промо, реферал и награда | `composition` | 5 | `P2` |
| C21. Медиаплеер и сравнение изображений | `new` | 3 | `P2` |
| C22. Малые виджеты | `composition` | 3 | `P2` |
| C23. Канбан-доска | `composition` | 1 | `P2` |

## Общие решения категории

- **Поверхность.** `.tg-card`: `--background-panel`, рамка `--border-color` (≈1.2:1),
  радиус `--radius-lg` (16 px), отступ `--space-6` (24 px), без тени. Тень — только
  у плавающих слоёв (C5) и выбранных элементов.
- **Зоны.** Предлагаемые элементы `__media` (выходит к краям, наследует верхние радиусы),
  `__body`, `__footer` (действия, разделитель сверху по желанию). Заголовок — существующий
  `.tg-header` с `__title`/`__subtitle`.
- **Карточка-ссылка.** Если вся карточка ведёт на страницу — единственная ссылка на
  заголовке растягивается на карточку псевдоэлементом (`.tg-card--link`); вложенные
  кнопки запрещены, иначе — обычная карточка с явными действиями в футере.
- **Числа** — `.tg-num`; изменения (+5,2%) — `.tg-badge--primary`/`--destructive` без
  рамки; стрелка тренда дублирует знак, не заменяет его.
- **Изображения** — `alt` по смыслу; декоративные — пустой `alt`; соотношение сторон
  через `aspect-ratio`, `object-fit: cover` только в `__media`.
- **Длинный контент** — заголовок до двух строк (`line-clamp` + полный текст в DOM);
  карточки в сетке выравниваются по высоте; действия прижаты к низу.
- **Состояния данных** — loading (`.tg-skeleton` + `aria-busy` на карточке), empty
  (`.tg-empty`), error (`.tg-notice--destructive` внутри карточки).
- **Ответственность приложения** — данные, форматирование чисел и дат, переходы,
  загрузка, графики (рендер библиотекой; TDS задаёт контейнер, легенду и цвета ролей).

## Спецификации компонентов

### C1. Базовая карточка и её зоны

Статус: `extend` · Приоритет: `P0` · Классы: `.tg-card`, `.tg-header`; предлагаемые `.tg-card__media`, `.tg-card__body`, `.tg-card__footer`, `.tg-card--link`, `.tg-card--interactive`

**Назначение**: группировка связанного содержимого в одну панель. Для однородных строк —
`.tg-list`; для сравнения по столбцам — `.tg-table`.

**Состав**: необязательное медиа; заголовок с подзаголовком и действием в углу; тело;
футер с действиями или метаданными.

```html
<article class="tg-card" aria-labelledby="repo-title">
  <header class="tg-header">
    <h3 class="tg-header__title" id="repo-title">ui-snippet</h3>
    <span class="tg-badge tg-badge--secondary">Публичный</span>
  </header>
  <div class="tg-card__body">
    <p class="tg-text-muted">Библиотека компонентов на базовых стилях.</p>
  </div>
  <footer class="tg-card__footer tg-text-sm tg-text-muted">
    <span>TypeScript</span><span class="tg-num">1,4k ★</span>
  </footer>
</article>
```

**API** (предлагаемое): `__media` — отрицательные отступы до краёв, верхние радиусы;
`__footer` — строка с `--space-3`, прижата к низу (`margin-block-start: auto` в
колонке); `--link` — растягивание ссылки заголовка; `--interactive` — hover-фон
`--field-bg-hover` и фокус-кольцо через `:has(:focus-visible)`.

**Варианты из референсов**: варианты карточек «default / interactive / media / stats»
(32), карточка с изображением и действием (6), с кнопкой (26), с вкладками (11 — вкладки N1
внутри), текстовый контекст (43), превью (95), блок с изображением (97), репозитории (58),
папки со счётчиками (139), сетка инфокарточек (143).

**Состояния**: default, hover (только `--interactive`/`--link`), focus-within, loading, empty, error, disabled (для выбора — см. forms F14).

**Поведение и ответственность приложения**: данные и переходы.

**Адаптивность**: в `.tg-grid` (минимум 18rem); на 320 px отступ `--space-4`.

**Доступность**: `article` с заголовком для самостоятельных карточек; карточка-ссылка —
одна остановка Tab; порядок DOM = визуальный.

**Токены и связь с TDS**: `--background-panel`, `--border-color`, `--radius-lg`, `--space-6`.

**Критерии готовности**: варианты 32 воспроизводятся; нет вложенных интерактивных элементов в `--link`.

**Референсы** (10):

- `moazamtrade--animate-card-animation--619402ff.webp` — Animate Card Animation
- `chetanverma16--animated-tabs--a944257b.webp` — Animated Tabs
- `kavikatiyar--card-9--f1db77ba.webp` — Card
- `wensity--card--0b1c70f9.webp` — Card
- `shugar--context-card--cc2d679a.webp` — Context Card
- `cnippet-dev--v-card-16--74c3ced6.webp` — GitHub Repository Cards
- `olivier-1b6cd5bc--preview-card--1c98136c.webp` — Preview Card
- `shadcnui-blocks--card-07--f475bb19.webp` — Product Card
- `uvain--folder-card--fb3a96bc.webp` — Folder Card
- `maxim-bort-devel--info-card--fbaccdb9.webp` — Info Card

### C2. Медиа-карточка

Статус: `extend` · Приоритет: `P0` · Классы: `.tg-card` + `__media`; предлагаемые `.tg-card--overlay`, `.tg-card__media--video`

**Назначение**: путешествия, жильё, статьи, видео — карточки, где изображение главное.

**Состав**: изображение/видео; заголовок; метаданные (рейтинг, цена, длительность);
действие; в варианте overlay — текст поверх изображения с затемнением.

```html
<article class="tg-card tg-card--link" aria-labelledby="trip-title">
  <figure class="tg-card__media"><img src="/hike.jpg" alt="Горная тропа на рассвете"></figure>
  <div class="tg-card__body">
    <h3 class="tg-header__title"><a id="trip-title" href="/trips/mountain">Горный поход</a></h3>
    <p class="tg-text-sm tg-text-muted">6 часов · 8 км · средняя сложность</p>
  </div>
</article>
```

**API** (предлагаемое): `--overlay` — текст поверх `__media` на градиенте затемнения
из `--overlay-bg` (единственный допустимый градиент — прозрачность одного цвета);
`__media--video` — `video` с постером, без автозапуска со звуком.

**Варианты из референсов**: направления с «Explore» (29), поход (30), коттедж с
бронированием (31), полоса раскрывающихся изображений (34 — см. galleries), блог на
стекле (61), отель (64), блог по наведению (65), трек (119), предмет крупным планом (132),
портрет с подписью (136), видео при наведении (140).

**Состояния**: default, hover (лёгкое `scale(1.02)` изображения внутри `overflow: hidden`), focus-visible, loading (skeleton медиа).

**Поведение и ответственность приложения**: изображения (размеры, `srcset`, `loading="lazy"`), воспроизведение видео.

**Адаптивность**: `aspect-ratio` 4/3 или 16/9; overlay-текст переносится и не выходит за медиа.

**Доступность**: контраст overlay-текста ≥ 4.5:1 проверяется на светлых изображениях;
видео — с управлением и без звука по умолчанию.

**Токены и связь с TDS**: `--overlay-bg`, `--overlay-text`, `--radius-lg`.

**Критерии готовности**: hover-увеличение отключается при reduced motion.

**Референсы** (11):

- `ravikatiyar162--card-21--68d4877b.webp` — Card
- `ravikatiyar162--card-25--f53fdff1.webp` — Card
- `ravikatiyar162--card-4--58213b6a.webp` — Card
- `lavikatiyar--cards--bdf7955d.webp` — Cards
- `moumensoliman--glass-blog-card-shadcnui--a9099f7d.webp` — Glass Blog Card
- `uniquesonu--hotel-card-ui-component--ec9afb30.webp` — Hotel Card UI Component
- `shadcnspace--hover-blog-card--f1935e4c.webp` — Hover Blog Card
- `ravikatiyar162--trail-card--7491a48b.webp` — Trail Card
- `ravikatiyar162--card-1--82281a75.webp` — Card
- `uilayout-contact--card-hover-2--229812bd.webp` — Card Hover
- `ruixen-ui--hover-play-card--8d870d2f.webp` — HoverPlayCard

### C3. Карточка товара

Статус: `composition` · Приоритет: `P1` · Состав: C2 + `.tg-num` + forms F14/F16 (цвет, размер) + `.tg-btn`

**Назначение**: товар в каталоге или на витрине: изображение, название, цена, варианты, «В корзину».

**Состав**: медиа; название; рейтинг; цена (старая/новая); выбор цвета и размера; действие.

```html
<article class="tg-card" aria-labelledby="p-jeans">
  <figure class="tg-card__media"><img src="/jeans.jpg" alt="Джинсы прямого кроя"></figure>
  <header class="tg-header">
    <h3 class="tg-header__title" id="p-jeans">Джинсы</h3>
    <span class="tg-num">4 000 ₽</span>
  </header>
  <fieldset class="tg-fieldset"><legend>Размер</legend><!-- forms F15/F16 --></fieldset>
  <button class="tg-btn tg-btn--primary tg-w-full" type="button">В корзину</button>
</article>
```

**API**: новых классов нет; цветовые образцы — radio с `aria-label` цвета, цвет
товара задаётся inline как данные, не токен.

**Варианты из референсов**: ряд товаров (35), блюда меню (81), джинсы с цветом и
размером (133), кроссовки на цветном фоне (134), карточка с вариантами (144), витрина
наушников (145), футболка с параллаксом (149 — эффект P2).

**Состояния**: available, out of stock (кнопка disabled + причина), adding (B5), added.

**Поведение и ответственность приложения**: корзина, наличие, цены.

**Адаптивность**: 2 колонки на мобильном в каталоге; кнопка на всю ширину.

**Доступность**: цена с валютой текстом; старая цена — `del` с пояснением для диктора.

**Токены и связь с TDS**: как у составляющих.

**Критерии готовности**: собирается без новых классов.

**Референсы** (7):

- `ravikatiyar162--cards-1--52c7bdef.webp` — Cards
- `ravikatiyar162--menu-item-card--3d69bd73.webp` — Menu Item Card
- `ravikatiyar162--card-19--b90e2728.webp` — Card
- `ravikatiyar162--card-7--2a02eeab.webp` — Card
- `beratberkayg--product-card-1--69c63173.webp` — Product Card
- `ravikatiyar162--product-card-2--2e8ea0ef.webp` — Product Card
- `ruixen-ui--shirt-parallax-card--34b3ea4d.webp` — Shirt Parallax Card

### C4. Карточка профиля и контакта

Статус: `composition` · Приоритет: `P1` · Состав: `.tg-card` + `.tg-avatar` + `.tg-summary` + `.tg-btn`

**Назначение**: человек или сообщество: аватар, имя, роль, статистика, связь.

**Состав**: обложка (необязательно); аватар; имя и роль; числа (подписчики, проекты);
действия «Подписаться», «Написать»; ссылки соцсетей.

```html
<article class="tg-card tg-col tg-align-center tg-gap-3" aria-labelledby="pf-name">
  <span class="tg-avatar"><span class="tg-avatar__initials">СБ</span></span>
  <h3 class="tg-header__title" id="pf-name">Софи Беннет</h3>
  <p class="tg-text-sm tg-text-muted">Продуктовый дизайнер</p>
  <dl class="tg-summary"><div class="tg-summary__row"><dt>Подписчики</dt><dd class="tg-num">312</dd></div></dl>
  <button class="tg-btn tg-btn--primary" type="button" aria-pressed="false">Подписаться</button>
</article>
```

**API**: новых классов нет.

**Варианты из референсов**: профиль с метриками (9), хаб сообщества с прогрессом (41),
контакты «копировать почту» (42 — buttons B4), бейдж на ленте (68 — P2-эффект),
профиль на фото (98), профиль разработчика с навыками-прогрессом (147).

**Состояния**: following/not following (B7 `aria-pressed`), online (`.tg-dot` с текстом).

**Поведение и ответственность приложения**: подписка, данные профиля.

**Адаптивность**: центрированный стек на мобильном.

**Доступность**: аватар-картинка с `alt` имени или декоративный при подписи рядом.

**Токены и связь с TDS**: `--avatar-*`.

**Критерии готовности**: без новых классов.

**Референсы** (6):

- `ravikatiyar162--animated-profile-card--eb1f4b46.webp` — Animated Profile Card
- `ravikatiyar162--community-hub-card--af4e014a.webp` — Community Hub Card
- `serafimcloud--contact-cards--190453c1.webp` — Contact Cards
- `mrcruzz--id-card-lanyard--04d52e3c.webp` — ID Card Lanyard
- `isaiahbjork--profile-hover-card--a38b0958.webp` — Profile Hover Card
- `ruixen-ui--ruixen-card02--36c7bc93.webp` — RuixenCard02

### C5. Всплывающая карточка (hover card)

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-hover-card`, `__trigger`

**Назначение**: превью профиля или ссылки при наведении/фокусе. Содержит только
дополнительную информацию: всё важное доступно по переходу.

**Состав**: триггер (ссылка, аватар); всплывающая карточка с аватаром, именем, описанием.

```html
<a class="tg-link" href="/u/acme" aria-describedby="hc-acme">@acme</a>
<div class="tg-hover-card" id="hc-acme" role="tooltip" hidden>
  <span class="tg-avatar">…</span>
  <strong>Acme</strong>
  <p class="tg-text-sm tg-text-muted">Компоненты для быстрых интерфейсов.</p>
</div>
```

**API** (предлагаемое): поверхность плавающего слоя (`--background-raised`,
`--shadow-overlay`, `--radius-lg`), ширина до 20rem, задержка показа 500 ms, скрытия 300 ms.

**Варианты из референсов**: пиксельная (3), подсказки над стеком аватаров (12),
аватар (19), Acme (66), детали по наведению (67), «View profile» с Radix-примитивом (85).

**Состояния**: hidden, visible; триггер hover/focus.

**Поведение и ответственность приложения**: показ по hover и focus, Escape скрывает;
если внутри есть ссылки/кнопки — это уже popover (non-modal dialog) с фокусом внутрь по клику.

**Адаптивность**: на сенсорных устройствах не показывается; переход по ссылке.

**Доступность**: WCAG 1.4.13; при интерактивном содержимом — `aria-expanded` и диалог.

**Токены и связь с TDS**: общие с buttons B15.

**Критерии готовности**: работает с клавиатуры; нет «ловушки» указателя.

**Референсы** (6):

- `theorcdev--8bit-hover-card--64b31e0e.webp` — 8bit Hover Card
- `lucasbassetti--animated-tooltip--ce15104e.webp` — Animated Tooltip
- `moumensoliman--avatar-hover-card--7bdaf565.webp` — Avatar Hover Card
- `halaska-studio--hover-card--ace06352.webp` — Hover Card
- `isaiahbjork--hover-detail-card--04d81500.webp` — Hover Detail Card
- `edwinvakayil--new-hover-card--fa6616e1.webp` — New Hover Card

### C6. KPI-плитка

Статус: `new` · Приоритет: `P0` · Предлагаемые классы: `.tg-stat`, `__label`, `__value`, `__delta`, `__meta`

**Назначение**: одно ключевое число с подписью и изменением. Основа дашбордов.

**Состав**: подпись; значение; изменение (бейдж); пояснение периода; необязательный спарклайн.

```html
<div class="tg-card tg-stat">
  <p class="tg-stat__label">Выручка</p>
  <p class="tg-stat__value tg-num">1 120 500 ₽</p>
  <p class="tg-stat__meta">
    <span class="tg-badge tg-badge--primary tg-stat__delta">+12,4%</span>
    <span class="tg-text-sm tg-text-muted">к прошлому кварталу</span>
  </p>
</div>
```

**API** (предлагаемое): `__value` — `--fs-lg`×1.5 (через `clamp`), `--fw-semibold`,
табличные цифры; `__delta` — бейдж без рамки; рост/падение — `--primary`/`--destructive`
и знак в тексте.

**Варианты из референсов**: три плитки в ряд (15), кольцевой индикатор (99 — `.tg-progress`
круговой P2), «фитнес-возраст» с сравнением (27), просмотры (110), выручка с деталями (111), статистика фрилансера (112).

**Состояния**: default, loading (skeleton значения), no data («—» + пояснение), error.

**Поведение и ответственность приложения**: расчёт и форматирование, период.

**Адаптивность**: в сетке `repeat(auto-fit, minmax(12rem, 1fr))`; длинные числа сокращаются приложением (1,1 млн).

**Доступность**: значение и изменение читаются как одна фраза; знак не только цветом.

**Токены и связь с TDS**: `--fs-lg`, `--fw-semibold`, `.tg-badge`.

**Критерии готовности**: числа выровнены, изменение различимо без цвета.

**Референсы** (6):

- `sean0205--area-charts-1--4673b731.webp` — Area Charts 1
- `lavikatiyar--card-4--85d2b831.webp` — Card
- `kavikatiyar--progress--d1713b1f.webp` — Progress 
- `beratberkayg--stat-card--759b8b09.webp` — Stat Card
- `sean0205--statistics-card-10--a542609a.webp` — Statistics Card 10
- `ravikatiyar162--stats-card--c128c0f2.webp` — Stats Card

### C7. Карточка с графиком

Статус: `composition` · Приоритет: `P1` · Состав: `.tg-card` + C6 + контейнер графика `figure` + легенда; подробные правила — `dashboards/components.md`

**Назначение**: тренд или распределение с заголовком, значением и фильтром периода.

**Состав**: заголовок и итоговое значение; фильтр периода (`.tg-select`/`.tg-segmented`);
график (SVG/Canvas приложения); легенда; табличная альтернатива.

```html
<figure class="tg-card" aria-labelledby="rev-title">
  <header class="tg-header">
    <figcaption class="tg-header__title" id="rev-title">Рост выручки</figcaption>
    <select class="tg-select" aria-label="Период"><option>12 месяцев</option></select>
  </header>
  <svg role="img" aria-labelledby="rev-title rev-desc">…</svg>
  <p id="rev-desc" class="tg-sr-only">Выручка выросла с 120 до 410 тыс. ₽, максимум в июле.</p>
  <details class="tg-disclosure"><summary class="tg-disclosure__trigger">Данные таблицей</summary>…</details>
</figure>
```

**API**: новых классов в cards нет; цвета серий — роли accent/danger/text-secondary и
их прозрачности, не произвольная палитра.

**Варианты из референсов**: бюджет с линией (5), анимированные столбцы (7), кампания (13),
площадь (14), столбцы на тёмном (20), категории (38), фильтр дат (40), кольцевая (48),
слоистая (74), линии (76, 77, 78), выручка столбцами (103), продажи по каналам (118).

**Состояния**: loading, empty, error, hover точки (подсказка).

**Поведение и ответственность приложения**: рендер графика, подсказки, фильтры.

**Адаптивность**: высота графика фиксирована, ширина 100%; на мобильном — меньше делений оси.

**Доступность**: текстовое резюме + таблица; подсказки доступны с клавиатуры или дублируются таблицей.

**Токены и связь с TDS**: `--accent-main`, `--accent-soft`, `--text-secondary`, `--border-subtle-color`.

**Критерии готовности**: график читаем в трёх темах без новых цветов.

**Референсы** (14):

- `jatin-yadav05--analytics-bento--4af33462.webp` — Analytics Bento
- `badtzx0--animated-card--69285a8f.webp` — Animated Card
- `ahmedmayara--area-chart-analytics-card--b55d6f8f.webp` — Area Chart Analytics Card
- `reaviz--area-chart-xs--0f2598ef.webp` — Area Chart Xs
- `legionwebdev--bar-chart--618f7794.webp` — Bar Chart
- `ahmedmayara--category-bar-chart--4f482a71.webp` — Category Bar Chart
- `shadcn--chart-filter--d6acec6d.webp` — Chart filter
- `ravikatiyar162--donut-chart--322e44b0.webp` — Donut Chart
- `reaviz--layered-chart-xl--bc68f97d.webp` — Layered Chart XL
- `legionwebdev--line-chart--a7e37e75.webp` — Line Chart
- `sean0205--line-charts-1--06bf05a4.webp` — Line Charts 1
- `sean0205--line-charts-6--2810c78e.webp` — Line Charts 6
- `sean0205--c-chart-1--f3ac0b9a.webp` — Revenue Bar Chart
- `ahmedmayara--total-sales-chart--c5d9f4be.webp` — Total Sales Chart

### C8. Платёжная карта и способ оплаты

Статус: `composition` · Приоритет: `P2` · Состав: `.tg-card` + forms F14 (выбор способа) + F27 (форма оплаты)

**Назначение**: показ сохранённой карты, выбор способа оплаты, форма ввода карты.

**Состав**: изображение карты (номер замаскирован, срок, владелец); выбор способа;
форма.

```html
<label class="tg-choice-card">
  <input class="tg-radio tg-choice-card__indicator" type="radio" name="pay" checked>
  <span class="tg-choice-card__title">Mastercard •••• 8888</span>
  <span class="tg-choice-card__description">Действует до 09/25</span>
</label>
```

**API**: новых классов нет; визуальная «пластиковая» карта (44, 45, 63) — P2-иллюстрация,
не компонент; её цвет — данные (бренд банка), а не токен.

**Варианты из референсов**: карта Mastercard (44), карта Visa (45), голографическая
карта (63), форма оплаты с картой (92), выбор сохранённой карты (93).

**Состояния**: selected, expired (бейдж `--destructive`), default method.

**Поведение и ответственность приложения**: платёжный провайдер, токенизация; TDS
никогда не обрабатывает реквизиты.

**Адаптивность**: карта-иллюстрация масштабируется по ширине с `aspect-ratio: 1.586`.

**Доступность**: номер читается как «карта, оканчивается на 8888».

**Токены и связь с TDS**: как F14.

**Критерии готовности**: без новых классов.

**Референсы** (5):

- `ravikatiyar162--credit-debit-card--d794560c.webp` — Credit  or Debit Card
- `rynkovski--credit-card--eb4f2dcf.webp` — Credit Card
- `romanvasnev--holo-card--a45e65de.webp` — Holo Card
- `designali-in--payment-card--cb9c7171.webp` — Payment Card
- `cnippet-dev--v-checkbox-6--effa0e8f.webp` — Payment Method Card Checkbox

### C9. Финансовые сводки

Статус: `composition` · Приоритет: `P1` · Состав: C6 + C7 + `.tg-table`/`.tg-list` + `.tg-num`; подробнее — `dashboards/components.md`

**Назначение**: портфель, криптовалюты, экономический календарь — плотные числовые сводки.

**Состав**: итог; список позиций с изменениями; мини-графики; новости.

```html
<section class="tg-card" aria-labelledby="pf-title">
  <h2 class="tg-header__title" id="pf-title">Портфель</h2>
  <p class="tg-stat__value tg-num">5 849,05 $</p>
  <ul class="tg-list">
    <li class="tg-list-item"><span class="tg-list-item__title">Apple</span>
      <span class="tg-num tg-ms-auto">2 324,70 $</span>
      <span class="tg-badge tg-badge--primary">+0,6%</span></li>
  </ul>
</section>
```

**API**: новых классов нет.

**Варианты из референсов**: крипто-дашборд со спарклайнами (46), экономический календарь (49),
финансовый дашборд (56), портфель с новостями (113).

**Состояния**: как C6/C7; live-обновление (без объявления каждого тика).

**Поведение и ответственность приложения**: котировки, частота обновлений.

**Адаптивность**: таблица → список на мобильном.

**Доступность**: изменения со знаком; обновления не через `aria-live` для каждого числа.

**Токены и связь с TDS**: `.tg-num`, `.tg-badge`.

**Критерии готовности**: числа выровнены по разрядам.

**Референсы** (4):

- `reuno-ui--crypto-dashboard--83b44854.webp` — Crypto Dashboard
- `ravikatiyar162--economic-calendar--7fc7de8c.webp` — Economic Calendar
- `ravikatiyar162--financial-dashboard--034cc2ce.webp` — Financial Dashboard
- `kavikatiyar--stock-portfolio-card--d49e7adf.webp` — Stock Portfolio Card

### C10. Список в карточке

Статус: `composition` · Приоритет: `P0` · Состав: `.tg-card` + `.tg-list` + `.tg-list-item` + `.tg-switch`/`.tg-avatar`/`.tg-badge`

**Назначение**: уведомления, настройки, лидерборд, доступы, разделы — однородные строки в панели.

**Состав**: заголовок; строки (ведущий элемент, текст, вторичный текст, замыкающий элемент); действие «Показать все».

```html
<section class="tg-card" aria-labelledby="ns-title">
  <h2 class="tg-header__title" id="ns-title">Уведомления</h2>
  <ul class="tg-list">
    <li class="tg-list-item">
      <span class="tg-col tg-grow"><span class="tg-list-item__title" id="ns-push">Push</span>
        <span class="tg-list-item__subtitle">О новых функциях</span></span>
      <button class="tg-switch" role="switch" aria-checked="true" aria-labelledby="ns-push"><span class="tg-switch__knob"></span></button>
    </li>
  </ul>
</section>
```

**API**: новых классов нет.

**Варианты из референсов**: уведомления (28, 87 — стопка уведомлений со счётчиком),
почтовый клиент (50), лидерборд (75), навигационные списки (84), настройки уведомлений
(88, 114), доступы к папке с ролями (107).

**Состояния**: строки — как `.tg-list-item`; список empty/loading.

**Поведение и ответственность приложения**: данные, сохранение переключателей.

**Адаптивность**: вторичный текст переносится; замыкающий элемент не сжимается.

**Доступность**: строка-ссылка без вложенных контролов; переключатель — с именем из строки.

**Токены и связь с TDS**: `--section-separator-color`.

**Критерии готовности**: без новых классов.

**Референсы** (8):

- `ravikatiyar162--card-15--7fd9ee33.webp` — Card
- `kavikatiyar--email-client-card--253eff46.webp` — Email Client Card
- `trophyso--leaderboard-card--8f1000e4.webp` — Leaderboard Card
- `arihantcodes-1f7b8c4d--nav-list-card--779ff7ef.webp` — Nav List Card
- `skyleen77--components-community-notification-list--c125b5c4.webp` — Notification List
- `felipemenezes098--card-11--76728245.webp` — Notification Settings Card
- `ravikatiyar162--share-card--ea967d38.webp` — Share Card
- `sean0205--c-switch-6--c8cf470a.webp` — Switch List Card

### C11. Хронология и ход процесса

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-timeline`, `.tg-timeline__item`, `.tg-timeline__marker`, `.tg-timeline__time`

**Назначение**: последовательность событий (инцидент, заказ, рейс, онбординг) с текущим этапом.

**Состав**: вертикальный список; маркер-точка и соединительная линия; статус-бейдж;
время; текст; необязательная полоса прогресса для текущего этапа.

```html
<ol class="tg-timeline" aria-label="Ход инцидента">
  <li class="tg-timeline__item" data-state="done">
    <span class="tg-timeline__marker" aria-hidden="true"></span>
    <span class="tg-badge tg-badge--secondary">Выявлено</span>
    <time class="tg-timeline__time" datetime="2026-03-25T14:48">14:48</time>
    <p>Причина — неверная конфигурация балансировщика.</p>
  </li>
  <li class="tg-timeline__item" aria-current="step">…Мониторинг…</li>
</ol>
```

**API** (предлагаемое): линия `--border-color`, пройденные маркеры `--accent-strong`,
текущий — кольцо, ошибка — `--danger-strong`; `data-state="done|current|upcoming|error"`.

**Варианты из референсов**: статус рейса с прогрессом (57), инцидент (69), онбординг с
текущим шагом (89), обработка задачи (96).

**Состояния**: done, current, upcoming, error.

**Поведение и ответственность приложения**: события и обновления.

**Адаптивность**: время над текстом на мобильном.

**Доступность**: `ol`; текущий — `aria-current="step"`; статус текстом.

**Токены и связь с TDS**: `--accent-strong`, `--border-color`, `--danger-strong`.

**Критерии готовности**: этапы различимы без цвета (иконки маркеров).

**Референсы** (4):

- `ravikatiyar162--flight-status-card--230fa3ee.webp` — Flight Status Card
- `cnippet-dev--incident-status-timeline--a8191453.webp` — Incident Status Timeline
- `amanshakya307--onboard-card--2531eba1.webp` — Onboard Card
- `lyanchouss--processing-card--34456895.webp` — Processing Card

### C12. Статусные карточки

Статус: `existing` · Приоритет: `P0` · Классы: `.tg-notice`, `--accent`, `--destructive`, `--with-icon`; `.tg-badge`

**Назначение**: состояние системы или функции («Защита включена», «Предупреждение»).

**Состав**: иконка; заголовок; пояснение; необязательное действие.

```html
<div class="tg-notice tg-notice--accent tg-notice--with-icon">
  <svg class="tg-icon tg-notice__icon" aria-hidden="true">…</svg>
  <div><strong>Защита включена</strong><p class="tg-text-sm">Проверено 2 минуты назад</p></div>
</div>
<span class="tg-badge tg-badge--secondary">Работает</span>
```

**API**: существующий. «Warning» и «Notice» из референса 117 не получают отдельных
цветов: предупреждение — нейтральный `--secondary` с иконкой, ошибка — `--destructive`.

**Варианты из референсов**: статусы Operational/Warning/Error/Notice (117), карточки
защиты и памяти (151).

**Состояния**: info, success (accent), error (destructive).

**Поведение и ответственность приложения**: актуальность статуса; live region для изменений.

**Адаптивность**: текст переносится.

**Доступность**: статус текстом, иконка декоративна.

**Токены и связь с TDS**: `--notice-danger-bg`, `--accent-soft`.

**Критерии готовности**: новых цветов нет.

**Референсы** (2):

- `uiable--tooltip-status--7da6ede7.webp` — Tooltip Status
- `redrob-labs--status-card--2133f57d.webp` — Status Card

### C13. Квитанция и сводка

Статус: `composition` · Приоритет: `P1` · Состав: `.tg-card` + `.tg-summary` + `.tg-num` + `.tg-divider` + `.tg-btn`

**Назначение**: подтверждение заказа, билета, поездки, итог тренировки, событие с RSVP.

**Состав**: иконка результата; заголовок; пары «свойство — значение»; итог; действия.

```html
<section class="tg-card tg-col tg-gap-3" aria-labelledby="ord-title">
  <h2 class="tg-header__title" id="ord-title">Заказ оформлен</h2>
  <dl class="tg-summary">
    <div class="tg-summary__row"><dt>Номер</dt><dd class="tg-num">57392820</dd></div>
    <div class="tg-summary__row"><dt>Итого</dt><dd class="tg-num">129 $</dd></div>
  </dl>
  <a class="tg-btn tg-btn--primary" href="/account">В личный кабинет</a>
</section>
```

**API**: новых классов нет; штрихкод/QR — изображение с текстовым кодом рядом.

**Варианты из референсов**: событие с RSVP (52), подтверждение заказа (90), билет (115 —
конфетти декоративно), детали поездки с действиями (120), итог тренировки (127).

**Состояния**: success, pending, cancelled.

**Поведение и ответственность приложения**: данные и действия.

**Адаптивность**: действия в столбец на мобильном.

**Доступность**: `dl`; успех объявляется при появлении (фокус на заголовок).

**Токены и связь с TDS**: как `.tg-summary`.

**Критерии готовности**: без новых классов.

**Референсы** (5):

- `cnippet-dev--v-card-19--c39757c3.webp` — Event RSVP Card
- `kavikatiyar--order-confirmation-card--a3a75c22.webp` — Order Confirmation Card
- `ravikatiyar162--ticket-confirmation-card--405f2e9b.webp` — Ticket Confirmation Card
- `kavikatiyar--trip-details-card--5f0ca83b.webp` — Trip Details Card
- `ravikatiyar162--workout-summary-card--5738cddb.webp` — Workout Summary Card

### C14. Публикация и пост

Статус: `composition` · Приоритет: `P1` · Состав: `.tg-card` + `.tg-comment` (если есть) + `.tg-avatar` + `.tg-media` + B7 (реакции)

**Назначение**: пост соцсети, твит, новость с автором, временем, медиа и реакциями.

**Состав**: автор; время (`time`); текст; медиа или превью ссылки; реакции и счётчики.

```html
<article class="tg-card" aria-labelledby="post-1-author">
  <header class="tg-row tg-gap-3">
    <span class="tg-avatar">…</span>
    <span class="tg-col"><strong id="post-1-author">Дориан Бэйфер</strong>
      <time class="tg-text-sm tg-text-muted" datetime="2026-10-27T10:00">3 ч назад</time></span>
  </header>
  <p>Запустили документацию…</p>
  <footer class="tg-card__footer">
    <button class="tg-btn tg-btn--ghost tg-btn--sm tg-toggle" aria-pressed="false">Нравится <span class="tg-num">128</span></button>
  </footer>
</article>
```

**API**: новых классов нет; относительное время форматирует приложение, абсолютное — в `datetime`/`title`.

**Варианты из референсов**: новость (86), пост с изображением (94), соцкарточка (108),
твиты (121, 122), относительное время в разных поясах (146).

**Состояния**: реакции pressed; медиа loading.

**Поведение и ответственность приложения**: данные, реакции.

**Адаптивность**: медиа на всю ширину карточки.

**Доступность**: время машинно-читаемое; реакции — B7.

**Токены и связь с TDS**: как у составляющих.

**Критерии готовности**: без новых классов.

**Референсы** (6):

- `ssychui--news-card--4698d7dd.webp` — News Card
- `preetsuthar17--post-card--bf107481.webp` — Post Card
- `kokonutd--social-card--ebcbd296.webp` — Social Card
- `daiwiikharihar--tweet-card--0b7b919f.webp` — Tweet Card
- `educalvolpz--tweet-card--4abb4eea.webp` — Tweet Card
- `shugar--relative-time-card-old--4ad4663f.webp` — Relative Time Card

### C15. Стопка и колода карточек

Статус: `new` · Приоритет: `P2` · Предлагаемые классы: `.tg-card-stack`, `__item`, `__controls`

**Назначение**: просмотр набора карточек по одной (онбординг, отбор вариантов, этапы).
Для обычного просмотра набора — карусель (navigation N16) или сетка.

**Состав**: наложенные карточки со смещением; текущая сверху; кнопки «Пропустить/Выбрать»
или «Назад/Вперёд»; индикатор.

```html
<section class="tg-card-stack" aria-roledescription="стопка карточек" aria-label="Города">
  <article class="tg-card tg-card-stack__item" aria-label="1 из 5">Лиссабон</article>
  <div class="tg-card-stack__controls">
    <button class="tg-btn tg-btn--secondary" type="button">Пропустить</button>
    <button class="tg-btn tg-btn--primary" type="button">Выбрать</button>
  </div>
</section>
```

**API** (предлагаемое): наложение через `grid-area: 1/1`; смещение и масштаб задних
карточек — `transform`; свайп — улучшение, кнопки обязательны.

**Варианты из референсов**: пиксельная карусель (2), веер вакансий (8), стопки
изображений (33, 36, 137, 150), карусели карточек (37, 123 вертикальная, 138 с вращением),
рабочие пространства (51), сложенные карты (109), «рука» карт (135).

**Состояния**: current, leaving, empty (все просмотрены).

**Поведение и ответственность приложения**: порядок, свайп-жесты, результат выбора.

**Адаптивность**: на мобильном — свайп + кнопки; на десктопе — кнопки и стрелки.

**Доступность**: только текущая карточка в дереве доступности (остальные `inert`);
действия — кнопки; reduced motion — мгновенная смена.

**Токены и связь с TDS**: `--shadow-soft` для задних карточек допустим (плавающий слой).

**Критерии готовности**: полностью управляется без жестов.

**Референсы** (12):

- `theorcdev--8bit-carousel--1b24eb14.webp` — 8bit Carousel
- `kavikatiyar--animated-card--3991c22e.webp` — Animated Card
- `motiondotdev--motion-card-stack--3f030361.webp` — Card stack
- `youcefbnm--cards-stack--31a14648.webp` — Cards Stack
- `kokonutd--carousel-cards--c001d214.webp` — Carousel Cards
- `21st--environment-card-stack--e0bc306c.webp` — Environment Card Stack
- `itsankitverma--stack-card--09f4c33c.webp` — Stack Card
- `sean0205--c-carousel-2--5af55bd6.webp` — Vertical Carousel
- `ruixen-ui--card-hand-gallery--bd102112.webp` — Card Hand Gallery
- `kuratlielia--card-stack--633c7977.webp` — Card Stack
- `hyperiux--cards-rotate-slider--897ae609.webp` — Cards Rotate Slider
- `uilayout-contact--stacking-card--03baf02f.webp` — Stacking card

### C16. Bento-сетка

Статус: `composition` · Приоритет: `P1` · Состав: `.tg-grid` + `.tg-card` + C6/C7; предлагаемый модификатор `.tg-grid--bento`

**Назначение**: обзор продукта или метрик плитками разного размера.

**Состав**: сетка 4–6 колонок; плитки с `grid-column`/`grid-row: span`.

```html
<section class="tg-grid tg-grid--bento" aria-labelledby="bento-title">
  <h2 class="tg-sr-only" id="bento-title">Наши результаты</h2>
  <article class="tg-card" style="--span: 2">…</article>
  <article class="tg-card">…</article>
</section>
```

**API** (предлагаемое): `--bento` — `grid-template-columns: repeat(4, 1fr)` на ≥ 64rem,
2 на ≥ 36rem, 1 на мобильном; плитки читают `--span`/`--row-span` (документированные
локальные свойства).

**Варианты из референсов**: bento-карточка продукта (21), сетка возможностей (22),
сетка FAQ-превью (128), «О нас» (129), конструктор bento (131), бесконечная панорама (142 — P2).

**Состояния**: как у плиток.

**Поведение и ответственность приложения**: содержимое плиток.

**Адаптивность**: порядок DOM сохраняется при перестроении; `grid-auto-flow: dense` не
используется, если ломает порядок чтения.

**Доступность**: порядок фокуса = визуальный.

**Токены и связь с TDS**: `--space-4` промежуток.

**Критерии готовности**: плитки не перекрываются при 200% тексте.

**Референсы** (6):

- `0xurvish--bento-card--09ff49be.webp` — Bento Card
- `kokonutd--bento-grid--715197b2.webp` — Bento Grid
- `anubra266--timeline-animation--b01b377b.webp` — timeline-animation
- `uilayout-contact--about-bento--20e93d15.webp` — About Bento
- `edwinvakayil--bento-builder--c02be132.webp` — Bento Builder
- `kapishdima--infinite-bento-pan--b1a22ed6.webp` — Infinite Bento Pan

### C17. Раскрывающаяся карточка

Статус: `extend` · Приоритет: `P1` · Классы: `details.tg-disclosure`; для перехода «карточка → диалог» — `dialog.tg-modal`

**Назначение**: карточка с дополнительными деталями по запросу (FAQ, проект, расширенный вид).

**Состав**: свёрнутая карточка с заголовком; раскрываемое содержимое; либо карточка,
открывающая диалог с подробностями.

```html
<details class="tg-disclosure">
  <summary class="tg-disclosure__trigger">Можно ли сменить тариф позже?</summary>
  <div class="tg-disclosure__content">Да, в любой момент в настройках.</div>
</details>
```

**API**: существующий; «морфинг» карточки в диалог (83) — View Transitions как
улучшение, без него — обычное открытие `dialog`.

**Варианты из референсов**: аккордеон FAQ (4), раскрывающиеся проекты (10),
карточка → диалог (83).

**Состояния**: collapsed, expanded, focus-visible.

**Поведение и ответственность приложения**: для диалога — `showModal()`, возврат фокуса.

**Адаптивность**: на всю ширину.

**Доступность**: нативные `details/summary`; группа аккордеона с одним открытым —
атрибут `name` у `details`.

**Токены и связь с TDS**: как `.tg-disclosure`.

**Критерии готовности**: без JS работает.

**Референсы** (3):

- `arihantcodes-1f7b8c4d--accordion-card--f44ab595.webp` — Accordion Card
- `isaiahbjork--animated-project-cards--a194efa1.webp` — Animated Project Cards
- `patrick-xin--morphing-dialog--54d2e455.webp` — Morphing Dialog

### C18. Декоративные эффекты карточек

Статус: `extend` · Приоритет: `P2` · Модуль `effects`: предлагаемые `.tg-effect-tilt`, `.tg-effect-glare`, `.tg-effect-spotlight`; существующий `.tg-glass`

**Назначение**: маркетинговые акценты для одной-двух карточек на странице.

**Состав**: обычная карточка + декоративный слой `aria-hidden`.

```html
<article class="tg-card tg-effect-spotlight">…</article>
```

**API** (предлагаемое): `spotlight` — радиальный блик под указателем через
`--pointer-x/--pointer-y` (документированные локальные свойства) и `opacity`;
`tilt` — `transform: rotateX/Y` ≤ 6°; `glare` — блик-полоса `transform`.

**Варианты из референсов**: парящая 3D-карточка (1), аврора (17), свечение за курсором
(47), шифр под указателем (53), заглушки (54), блики (59, 60), стеклянные слои (62),
сканер (105), голографическая лента (106), переворот (116), стираемый слой (148). Голограмма,
сканер, шифр, стирание — не переносятся как компоненты.

**Состояния**: эффект только в покое/hover; отключён на сенсорных устройствах.

**Поведение и ответственность приложения**: подключение модуля; координаты указателя — `effects.mjs`.

**Адаптивность**: на мобильном эффект отсутствует.

**Доступность**: reduced motion — без наклона и движения; контраст текста не зависит от эффекта.

**Токены и связь с TDS**: `--accent-soft`, `--duration`, `--ease`.

**Критерии готовности**: без модуля карточка обычная; нет новых цветов.

**Референсы** (12):

- `n38693842--3d-card--f93f3018.webp` — 3d-card
- `dhileepkumargm--aurora-card--fc00ceb1.webp` — AuroraCard
- `badtzx0--cursor-cards--c2ee1d75.webp` — Cursor Cards
- `manuarora700--evervault-card--28b0c394.webp` — Evervault Card
- `lyanchouss--fallback-card--0e6c6b2b.webp` — Fallback Card
- `manuarora700--glare-card--cce132fb.webp` — Glare Card
- `daiwiikharihar--glare-cards--2e3dd80e.webp` — Glare Cards
- `kedhareswer--glass-cards--7ca9f329.webp` — Glass Cards
- `rahil1202--scanner-card-stream--ae43ca0d.webp` — ScannerCardStream 
- `dhileepkumargm--scrolling-holographic-card-feed--4760b408.webp` — Scrolling Holographic Card Feed
- `cesaroeduardo--flip-card--af999cec.webp` — Tilt Flip Card
- `arihantcodes-1f7b8c4d--scratch-card--491274ad.webp` — Scratch Card

### C19. Формы в карточке

Статус: `composition` · Приоритет: `P1` · Подробнее — `forms/` и `sign-in/components.md`

**Назначение**: карточки входа, смены и сброса пароля, OTP, назначения задачи, загрузки
видео, календаря.

**Состав**: `.tg-card` с формой из forms.

```html
<form class="tg-card tg-col tg-gap-4" aria-labelledby="rp-title">
  <h2 class="tg-header__title" id="rp-title">Сброс пароля</h2>
  <div class="tg-field"><label class="tg-label" for="rp-email">Почта</label>
    <input class="tg-input" id="rp-email" type="email" autocomplete="email"></div>
  <button class="tg-btn tg-btn--primary" type="submit">Отправить ссылку</button>
</form>
```

**API**: новых классов нет.

**Варианты из референсов**: назначение задачи с выбором (16 — forms F9), вход (18, 79, 82),
календари (23, 24 — forms F21), смена пароля (39), AI-поле (70), переключатели M3 (80),
OTP (91), сброс пароля (102), загрузка видео (124), регистрация (152).

**Состояния**: как forms F27.

**Поведение и ответственность приложения**: как forms.

**Адаптивность**: как forms.

**Доступность**: как forms.

**Токены и связь с TDS**: как forms.

**Критерии готовности**: собираются из forms.

**Референсы** (13):

- `shadcnspace--card-11--6c6bc219.webp` — Assign Task Card
- `deltacomponents--auth-form--d0cba2e1.webp` — Auth Form
- `shadcn--calendar-with-localisation--264ba47e.webp` — Calendar with localisation
- `shadcn--calendar-with-time-picker-inline--f636008a.webp` — Calendar with time picker inline
- `cnippet-dev--v-form-6--533c261d.webp` — Change Password Form
- `ravikatiyar162--input--56a8752b.webp` — Input
- `meschacirung--login-2--b41fc551.webp` — Login Page 2
- `jahed--material-design-3-switch--62dab435.webp` — Material Design 3 Switch
- `pulseawan--modern-login-signup--6e706600.webp` — Modern Login & Signup
- `educalvolpz--otp-input--bbe63b3a.webp` — Otp Input
- `diarmuradi--reset-password-icon-card--b08ec51f.webp` — Reset Password Card
- `isaiahbjork--video-upload-card--336587c0.webp` — Video Upload Card
- `ruixen-ui--success-login-card--d1142c81.webp` — Success Login Card

### C20. Промо, реферал и награда

Статус: `composition` · Приоритет: `P2` · Состав: `.tg-card` + C2 + buttons B4/B6 + `.tg-badge`

**Назначение**: продвижение (сериал, интеграция), реферальная ссылка, подарок, серия.

**Состав**: иллюстрация; заголовок; шаги «как это работает»; ссылка с копированием; действие.

```html
<section class="tg-card tg-col tg-gap-3" aria-labelledby="ref-title">
  <h2 class="tg-header__title" id="ref-title">Пригласите друга</h2>
  <ol class="tg-col tg-gap-2"><li>Поделитесь ссылкой</li><li>Друг регистрируется</li></ol>
  <div class="tg-copy"><code class="tg-copy__value">https://app.example/r/123</code>
    <button class="tg-btn tg-btn--secondary tg-btn--sm tg-copy__action" type="button">Копировать</button></div>
</section>
```

**API**: новых классов нет.

**Варианты из референсов**: интеграции (71), промо сериала (100), реферал (101),
подарок со свайпом (104 — buttons B6), серия видео (125).

**Состояния**: copied, claimed.

**Поведение и ответственность приложения**: ссылки, начисления.

**Адаптивность**: иллюстрация скрывается на узких экранах при нехватке места.

**Доступность**: декоративные иллюстрации `aria-hidden`.

**Токены и связь с TDS**: как у составляющих.

**Критерии готовности**: без новых классов.

**Референсы** (5):

- `shadcnspace--integration-card--5dc5efdf.webp` — Integration Card
- `ravikatiyar162--promo-card--2bf0e167.webp` — Promo Card
- `lavikatiyar--referral-card--dc140edb.webp` — Referral Card
- `ravikatiyar162--reward-card--6e728210.webp` — Reward Card
- `sh20raj--voxel-video-streak-card--78c33993.webp` — Voxel Video Streak Card

### C21. Медиаплеер и сравнение изображений

Статус: `new` · Приоритет: `P2` · Предлагаемые классы: `.tg-player` (`__cover`, `__meta`, `__controls`, `__progress`), `.tg-compare` (`__before`, `__after`, `__handle`)

**Назначение**: «сейчас играет» с управлением; сравнение «до/после» перетаскиванием.

**Состав**: обложка, название, исполнитель, прогресс, кнопки; два изображения и
разделитель-ползунок.

```html
<section class="tg-card tg-player" aria-label="Сейчас играет">
  <img class="tg-player__cover" src="/cover.jpg" alt="">
  <div class="tg-player__meta"><strong>Low Tide Radio</strong><span class="tg-text-muted">Marisol Vane</span></div>
  <input class="tg-range tg-player__progress" type="range" min="0" max="213" value="58" aria-label="Позиция" aria-valuetext="0:58 из 3:33">
  <div class="tg-player__controls">
    <button class="tg-icon-btn tg-icon-btn--ghost" aria-label="Предыдущий">…</button>
    <button class="tg-icon-btn tg-icon-btn--primary tg-toggle" aria-pressed="true" aria-label="Пауза">…</button>
  </div>
</section>
```

**API** (предлагаемое): прогресс — нативный range; сравнение — `range` поверх двух
изображений, обрезка `clip-path: inset()` по `--compare` (без анимации — прямое следование).

**Варианты из референсов**: «Now playing» (25, 130), сравнение изображений (141).

**Состояния**: playing/paused, buffering, error.

**Поведение и ответственность приложения**: Media Session API, аудио/видео.

**Адаптивность**: управление 44 px.

**Доступность**: кнопки с именами; ползунок сравнения с `aria-valuetext` («до 50%»).

**Токены и связь с TDS**: `--accent-strong`.

**Критерии готовности**: управляется с клавиатуры.

**Референсы** (3):

- `kavikatiyar--card-6--3379aed6.webp` — Card
- `isaiahbjork--bjork-now-playing-card--b742dd5b.webp` — BJORK Now playing card
- `wensity--before-after-card--d302d671.webp` — Image Comparison Slider

### C22. Малые виджеты

Статус: `composition` · Приоритет: `P2` · Состав: `.tg-card` + `.tg-summary`/forms F14 + `.tg-num`

**Назначение**: погода, быстрая оценка сервиса, командная строка действий.

**Состав**: компактная карточка с одним видом данных или одним действием.

```html
<fieldset class="tg-card tg-segmented">
  <legend class="tg-label">Понравился сервис?</legend>
  <label class="tg-segmented__item"><input type="radio" name="rate" value="1"><span aria-label="Плохо">😞</span></label>
  <label class="tg-segmented__item"><input type="radio" name="rate" value="5"><span aria-label="Отлично">😍</span></label>
</fieldset>
```

**API**: новых классов нет.

**Варианты из референсов**: оценка эмодзи (55), командная строка в карточке (72 — navigation N10),
погода (126).

**Состояния**: как у составляющих.

**Поведение и ответственность приложения**: данные.

**Адаптивность**: в сетке виджетов.

**Доступность**: эмодзи имеют текстовые имена.

**Токены и связь с TDS**: как у составляющих.

**Критерии готовности**: без новых классов.

**Референсы** (3):

- `arihantcodes-1f7b8c4d--feedback-card--aee679ef.webp` — Feedback Card
- `dhileepkumargm--interactive-command-card--7e2060bb.webp` — Interactive Command Card
- `user-xn1cklas--weather-card--9046a5d9.webp` — Weather Card

### C23. Канбан-доска

Статус: `composition` · Приоритет: `P2` · Состав: `.tg-row` колонок + `.tg-card` задач + `.tg-badge`; подробнее — `dashboards/components.md`

**Назначение**: задачи по статусам с перемещением между колонками.

**Состав**: колонки с заголовком и счётчиком; карточки задач; добавление.

```html
<section class="tg-row tg-row-valign-top" aria-label="Задачи">
  <section class="tg-col tg-gap-2" aria-labelledby="col-todo">
    <h3 id="col-todo" class="tg-text-sm">К выполнению <span class="tg-badge tg-badge--secondary">2</span></h3>
    <article class="tg-card">Настроить онбординг</article>
  </section>
</section>
```

**API**: новых классов в cards нет.

**Варианты из референсов**: перемещение карточек (73).

**Состояния**: dragging, drop target.

**Поведение и ответственность приложения**: drag-and-drop и **обязательная** клавиатурная
альтернатива (меню «Переместить в…»), сохранение.

**Адаптивность**: колонки прокручиваются горизонтально в доступной оболочке.

**Доступность**: перемещение объявляется в status.

**Токены и связь с TDS**: как у составляющих.

**Критерии готовности**: перемещение возможно без мыши.

**Референсы** (1):

- `rmahammad--kanban-card-movement--3736b9ec.webp` — Kanban Card Movement

## Порядок реализации

1. **P0:** зоны C1 (`__media`, `__body`, `__footer`, `--link`, `--interactive`) — от
   них зависят C2–C4, C13, C14; C6 KPI-плитка (нужна dashboards); C10 и C12 — примеры.
2. **P1:** C2 overlay, C5 hover card (общий слой с buttons B15), C11 хронология,
   C16 `--bento`, C17; композиции C3, C4, C7, C9, C13, C14, C19.
3. **P2:** C15 стопка, C18 эффекты, C21 плеер/сравнение, C8, C20, C22, C23.

## Контрольный список покрытия

| Группа | Референсов |
| --- | ---: |
| C1. Базовая карточка и её зоны | 10 |
| C2. Медиа-карточка | 11 |
| C3. Карточка товара | 7 |
| C4. Карточка профиля и контакта | 6 |
| C5. Всплывающая карточка (hover card) | 6 |
| C6. KPI-плитка | 6 |
| C7. Карточка с графиком | 14 |
| C8. Платёжная карта и способ оплаты | 5 |
| C9. Финансовые сводки | 4 |
| C10. Список в карточке | 8 |
| C11. Хронология и ход процесса | 4 |
| C12. Статусные карточки | 2 |
| C13. Квитанция и сводка | 5 |
| C14. Публикация и пост | 6 |
| C15. Стопка и колода карточек | 12 |
| C16. Bento-сетка | 6 |
| C17. Раскрывающаяся карточка | 3 |
| C18. Декоративные эффекты карточек | 12 |
| C19. Формы в карточке | 13 |
| C20. Промо, реферал и награда | 5 |
| C21. Медиаплеер и сравнение изображений | 3 |
| C22. Малые виджеты | 3 |
| C23. Канбан-доска | 1 |
| **Итого** | **152 из 152** |

Каждый из 152 файлов папки указан ровно в одной основной группе. Перекрёстные ссылки на другие категории даны текстом, без повторного учёта.
