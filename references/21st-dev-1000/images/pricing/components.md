# Тарифы — спецификации компонентов

## Назначение категории

Папка `pricing` (26 превью): секции тарифов с переключателем периода оплаты,
одиночные карточки тарифов, таблицы сравнения, калькуляторы и выбор дополнений. Это
композиции из `.tg-card`, `.tg-segmented` (buttons B8), `.tg-badge`, `.tg-btn`,
`.tg-table` и форм. Новый элемент — список возможностей тарифа с отметками
(`.tg-feature-list`), который повторяется почти во всех референсах.

## Сводная таблица

| Компонент / паттерн | Тип работы | Референсов | Приоритет |
| --- | --- | ---: | --- |
| PR1. Секция тарифов с периодом оплаты | `composition` | 12 | `P1` |
| PR2. Карточка тарифа | `extend` | 6 | `P1` |
| PR3. Таблица сравнения тарифов | `composition` | 3 | `P1` |
| PR4. Калькулятор и дополнения | `composition` | 2 | `P2` |
| PR5. Предложения и товар | `composition` | 3 | `P2` |

## Общие решения категории

- **Цена** — `.tg-num` крупно (`--fs-lg`×1.75), период и валюта рядом мелким
  `--text-secondary`; старая цена — `del` с поясняющим текстом для диктора.
- **Рекомендуемый тариф** выделяется рамкой 2 px `--accent-main` и бейджем
  `--primary` «Популярный», а не инвертированной тёмной или градиентной карточкой
  (5, 10, 14 — инверсия не переносится).
- **Период оплаты** — `.tg-segmented` (radio) «Месяц / Год −20%»; экономия — бейдж
  `--primary`. Смена периода меняет только текст цен, раскладка не прыгает
  (`min-inline-size` по самой длинной цене).
- **Возможности** — `.tg-feature-list`: галочка `--accent-readable`, недоступное —
  тире и `--text-secondary` с текстом «нет» для диктора.
- **Действия** — primary у рекомендуемого, secondary у остальных; «Связаться» для
  корпоративного тарифа — ссылка-кнопка.
- **Ответственность приложения** — цены, валюты, налоги, пересчёт периода, оформление
  подписки.

## Спецификации компонентов

### PR1. Секция тарифов с периодом оплаты

Статус: `composition` · Приоритет: `P1` · Состав: `section` + `.tg-segmented` + `.tg-grid` + PR2

**Назначение**: сравнение 2–4 тарифов на странице цен.

**Состав**: заголовок и описание; переключатель периода; сетка карточек; примечание
(налоги, пробный период); необязательный FAQ (misc M1).

```html
<section class="tg-container tg-col tg-gap-6" aria-labelledby="pricing-title">
  <div class="tg-col tg-gap-2 tg-text-center">
    <h2 id="pricing-title">Тарифы, которые растут вместе с вами</h2>
    <fieldset class="tg-segmented">
      <legend class="tg-sr-only">Период оплаты</legend>
      <label class="tg-segmented__item"><input type="radio" name="period" value="month" checked> Месяц</label>
      <label class="tg-segmented__item"><input type="radio" name="period" value="year"> Год <span class="tg-badge tg-badge--primary">−20%</span></label>
    </fieldset>
  </div>
  <ul class="tg-grid" role="list"><!-- PR2 × 3 --></ul>
  <p class="tg-text-sm tg-text-muted tg-text-center">Цены без НДС. 14 дней бесплатно.</p>
</section>
```

**API**: новых классов нет.

**Варианты из референсов**: секции из трёх тарифов с переключателем (1, 9, 13, 15, 16, 17,
20), адаптивная тёмная (2), тёмная с градиентом (5), масштабируемые планы (10),
компонент с бейджем «Популярный» (14), планы стартапов (24).

**Состояния**: period month/year; карточки — PR2.

**Поведение и ответственность приложения**: пересчёт цен при смене периода, объявление
новой цены (`aria-live="polite"` на цене).

**Адаптивность**: 3 колонки → 1; на мобильном рекомендуемый тариф первым только если это
не ломает порядок сравнения (лучше — горизонтальная прокрутка карточек с точками).

**Доступность**: переключатель — radio с legend; цена объявляется при смене.

**Токены и связь с TDS**: `--accent-main`, `--space-6`.

**Критерии готовности**: смена периода не сдвигает раскладку.

**Референсы** (12):

- `uilayout-contact--pricing-section--cab8d4d3.webp` — Pricing Section
- `vaib215--adaptive-pricing-section--431e61b9.webp` — Adaptive Pricing Section
- `vaib215--dark-gradient-pricing--3d6e3d60.webp` — Dark Gradient Pricing
- `codehagen--pricing--aac2d602.webp` — Pricing
- `efferd--pricing--e6adee24.webp` — Pricing
- `prebuiltui--pricing-cards--9ca09462.webp` — Pricing Cards
- `jatin-yadav05--pricing-component--af006184.webp` — Pricing Component
- `uiable--block-pricing-18--5ba0b658.webp` — Pricing Plans with Billing Toggle
- `aymanch-03--pricing-section--c5db8efd.webp` — Pricing Section
- `shadcnstore--pricing-section-1--c1ff50d0.webp` — Pricing Section 1
- `dgearsonu1--pricing-table--422836a7.webp` — Pricing table
- `shadcnspace--pricing-01--e199a742.webp` — Startup Pricing Plans

### PR2. Карточка тарифа

Статус: `extend` · Приоритет: `P1` · Классы: `.tg-card`; предлагаемые `.tg-card--featured`, `.tg-price`, `.tg-feature-list`, `.tg-feature-list__item--off`

**Назначение**: один тариф: название, цена, кому подходит, возможности, действие.

**Состав**: название и бейдж; описание; цена и период; действие; список возможностей.

```html
<li class="tg-card tg-card--featured tg-col tg-gap-4" aria-labelledby="plan-pro">
  <header class="tg-row tg-justify-between">
    <h3 class="tg-header__title" id="plan-pro">Pro</h3>
    <span class="tg-badge tg-badge--primary">Популярный</span>
  </header>
  <p class="tg-price"><span class="tg-num">99 $</span><span class="tg-text-sm tg-text-muted"> в месяц</span></p>
  <a class="tg-btn tg-btn--primary" href="/checkout?plan=pro" aria-describedby="plan-pro">Выбрать</a>
  <ul class="tg-feature-list">
    <li>Безлимитные проекты</li>
    <li class="tg-feature-list__item--off">Выделенный менеджер<span class="tg-sr-only"> — не входит</span></li>
  </ul>
</li>
```

**API** (предлагаемое): `--featured` — рамка 2 px `--accent-main` (компенсация 1 px
отступа, чтобы размер не менялся); `.tg-price` — крупная `.tg-num` и период; `.tg-feature-list`
— список с иконкой-галочкой через `::before` (маска Feather `check`), `--off` — тире.

**Варианты из референсов**: компактная карточка (3), пожизненный доступ со старой
ценой (6), карточка с проектами (11), с подробным списком и «Записаться на звонок» (12),
«мягкая» карточка (23 — эффект нажатия не переносится), два плана (26).

**Состояния**: default, featured, current plan (бейдж «Ваш тариф», кнопка disabled
«Текущий»), unavailable.

**Поведение и ответственность приложения**: ссылки оформления, текущий план.

**Адаптивность**: список возможностей сворачивается после 6 пунктов в `details`.

**Доступность**: имя кнопки уточняется названием тарифа; недоступные пункты объявляются.

**Токены и связь с TDS**: `--accent-main`, `--accent-readable`, `--radius-lg`.

**Критерии готовности**: featured-рамка не меняет высоту карточки; без инверсии цветов.

**Референсы** (6):

- `jshguo--interfaces-card--1238a12a.webp` — Card
- `diarmuradi--pricing-6--b71ab10b.webp` — Lifetime Deal Pricing Card
- `ravikatiyar162--pricing-card-1--0cee1d7c.webp` — Pricing Card
- `erikvalencia1--pricing-card-with-features--d75d8959.webp` — Pricing Card With Features
- `uniquesonu--squishy-card-component--8ab0e33e.webp` — Squishy Card Component
- `ln-dev7--pricing-16--34a4e7c5.webp` — Two-Plan Pricing Cards

### PR3. Таблица сравнения тарифов

Статус: `composition` · Приоритет: `P1` · Состав: `.tg-table` (dashboards D1) + `.tg-feature-list`-иконки + `.tg-btn`

**Назначение**: подробное сравнение возможностей по тарифам.

**Состав**: заголовки-тарифы с ценой и действием (прилипающие); группы строк; ячейки
с галочкой/тире/значением; переключатель «только различия».

```html
<div class="tg-table-wrap" role="region" aria-labelledby="cmp-cap" tabindex="0">
  <table class="tg-table">
    <caption id="cmp-cap">Сравнение тарифов</caption>
    <thead><tr><th scope="col">Возможность</th><th scope="col">Starter</th><th scope="col">Pro</th></tr></thead>
    <tbody>
      <tr><th scope="rowgroup" colspan="3">Совместная работа</th></tr>
      <tr><th scope="row">Участники команды</th><td class="tg-table__num">3</td><td>Без ограничений</td></tr>
      <tr><th scope="row">SSO</th><td>—<span class="tg-sr-only"> нет</span></td><td>✓<span class="tg-sr-only"> есть</span></td></tr>
    </tbody>
  </table>
</div>
```

**API**: новых классов нет; прилипающая шапка таблицы — `position: sticky` в `thead`
(утилита в D1).

**Варианты из референсов**: таблицы сравнения (18, 19), две колонки с режимом «только
изменения» (25).

**Состояния**: all rows / differences only; выбранный тариф подсвечен столбцом (`--accent-soft`).

**Поведение и ответственность приложения**: фильтр различий, данные.

**Адаптивность**: на мобильном — выбор двух тарифов для сравнения (`.tg-select`) вместо
широкой таблицы.

**Доступность**: галочки и тире с текстом; группы — `scope="rowgroup"`.

**Токены и связь с TDS**: как D1.

**Критерии готовности**: таблица читаема без цвета и без иконок.

**Референсы** (3):

- `kokonutd--pricing-table--a9ee8c4e.webp` — Pricing Table
- `my--pricing-table--9e8c60d4.webp` — Pricing Table
- `dhxwhy--two-plan-diff-pricing-table--61105576.webp` — Two-Plan Diff Pricing Comparison Table

### PR4. Калькулятор и дополнения

Статус: `composition` · Приоритет: `P2` · Состав: forms F18 (ползунок) / F12 (флажки дополнений) + `.tg-summary` + `.tg-btn`

**Назначение**: оценка стоимости или экономии, выбор дополнительных опций к тарифу.

**Состав**: входные параметры (ползунок, количество); список дополнений с ценами;
итог; действие.

```html
<form class="tg-card tg-col tg-gap-4" aria-labelledby="addon-title">
  <h2 class="tg-header__title" id="addon-title">Настройте тариф</h2>
  <fieldset class="tg-fieldset tg-choice-group"><legend>Дополнения</legend>
    <label class="tg-choice"><input class="tg-check" type="checkbox" checked><span>Высокая доступность <span class="tg-num tg-text-muted">+20 $</span></span></label>
  </fieldset>
  <dl class="tg-summary"><div class="tg-summary__row"><dt>Итого в месяц</dt><dd class="tg-num" aria-live="polite">49 $</dd></div></dl>
  <button class="tg-btn tg-btn--primary" type="submit">Подтвердить</button>
</form>
```

**API**: новых классов нет.

**Варианты из референсов**: выбор дополнений с итогом (8), калькулятор ROI (22).

**Состояния**: default, recalculating, invalid input.

**Поведение и ответственность приложения**: расчёт; итог объявляется политно.

**Адаптивность**: итог прилипает к низу на мобильном.

**Доступность**: итог — `aria-live="polite"` без объявления на каждый шаг ползунка (debounce).

**Токены и связь с TDS**: как у составляющих.

**Критерии готовности**: без новых классов.

**Референсы** (2):

- `cnippet-dev--plan-addon-selector--77026291.webp` — Plan Add-on Selector
- `diarmuradi--pricing-12--9c823fd0.webp` — ROI Pricing Calculator

### PR5. Предложения и товар

Статус: `composition` · Приоритет: `P2` · Состав: cards C2/C3 + `.tg-carousel` (navigation N16)

**Назначение**: карточки предложений (отели со скидкой), товар с ценой и вариантами,
место — референсы, отнесённые к тарифам по наличию цены.

**Состав**: медиа; название; цена/скидка; варианты; действие.

```html
<article class="tg-card" aria-labelledby="lamp">
  <figure class="tg-card__media"><img src="/lamp.jpg" alt="Настольная лампа-шар"></figure>
  <h3 class="tg-header__title" id="lamp">Лампа Orbit</h3>
  <p><span class="tg-num">129 $</span> <del class="tg-text-muted">159 $</del> <span class="tg-badge tg-badge--primary">−19%</span></p>
  <button class="tg-btn tg-btn--primary" type="button">В корзину</button>
</article>
```

**API**: из cards C2/C3.

**Варианты из референсов**: место с описанием (4), карусель предложений (7), карточка
товара с «Добавлено» (21 — buttons B5 success).

**Состояния**: как C3.

**Поведение и ответственность приложения**: как C3.

**Адаптивность**: как C3.

**Доступность**: скидка текстом.

**Токены и связь с TDS**: как C3.

**Критерии готовности**: см. cards C3.

**Референсы** (3):

- `lavikatiyar--card-7--c440aea8.webp` — Card
- `lavikatiyar--offers-carousel--26b95f92.webp` — Offers Carousel
- `21st--product-card--f1159bc3.webp` — Product Card

## Порядок реализации

1. **P1:** `.tg-feature-list`, `.tg-price`, `.tg-card--featured` (PR2); пример PR1
   (после buttons B8); PR3 (после dashboards D1).
2. **P2:** PR4, PR5.

## Контрольный список покрытия

| Группа | Референсов |
| --- | ---: |
| PR1. Секция тарифов с периодом оплаты | 12 |
| PR2. Карточка тарифа | 6 |
| PR3. Таблица сравнения тарифов | 3 |
| PR4. Калькулятор и дополнения | 2 |
| PR5. Предложения и товар | 3 |
| **Итого** | **26 из 26** |

Каждый из 26 файлов папки указан ровно в одной основной группе. Перекрёстные ссылки на другие категории даны текстом, без повторного учёта.
