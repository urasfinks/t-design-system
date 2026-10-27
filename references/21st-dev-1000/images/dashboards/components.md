# Данные и дашборды — спецификации компонентов

## Назначение категории

Папка `dashboards` (66 превью): таблицы данных (выбор строк, фильтры, сортировка,
видимость столбцов), сортируемые списки, графики разных типов и целые экраны дашбордов.
В TDS есть статичная `.tg-table` в доступной прокручиваемой оболочке `.tg-table-wrap`,
`.tg-num`/`.tg-table__num`, `.tg-skeleton`, `.tg-empty`, `.tg-pager` (предложен в navigation).
Главное правило документа: **CSS-таблица ≠ редактируемая data grid**. Таблица остаётся
таблицей с нативной навигацией Tab; виджет `role="grid"` со стрелочной навигацией
по ячейкам вводится только для редактирования и выделения ячеек — отдельным P2-контрактом.
Графики рисует приложение; TDS задаёт контейнер, подписи, легенду, цвета ролей и
доступную альтернативу.

## Сводная таблица

| Компонент / паттерн | Тип работы | Референсов | Приоритет |
| --- | --- | ---: | --- |
| D1. Таблица данных | `existing` | 13 | `P0` |
| D2. Выбор строк и массовые действия | `extend` | 6 | `P0` |
| D3. Панель фильтров, поиска и столбцов | `extend` | 10 | `P1` |
| D4. Сортировка по столбцам | `extend` | 1 | `P0` |
| D5. Состояния загрузки таблицы | `existing` | 1 | `P0` |
| D6. Сортируемый список | `new` | 4 | `P2` |
| D7. Линейные и площадные графики | `new` | 10 | `P1` |
| D8. Столбчатые графики | `new` | 4 | `P1` |
| D9. Кольцевые и круговые диаграммы | `new` | 5 | `P1` |
| D10. Свечные графики | `composition` | 2 | `P2` |
| D11. Специальные визуализации | `composition` | 4 | `P2` |
| D12. Экран дашборда | `composition` | 4 | `P1` |
| D13. Иллюстрации продукта | `composition` | 2 | `P2` |

## Общие решения категории

- **Таблица.** `table.tg-table` внутри `.tg-table-wrap` с `role="region"`, именем и
  `tabindex="0"`; обязательны `caption` (может быть `tg-sr-only`) и `th scope`.
  Числа — `.tg-table__num` (табличные цифры, выравнивание к концу). Итоговая строка —
  `tfoot`.
- **Плотность.** Строка 44 px по умолчанию; плотный режим (предлагаемый
  `.tg-table--compact`) — 36 px визуально, контролы внутри сохраняют 44 px область.
- **Статусы в ячейках** — `.tg-badge` без рамки (`--primary`, `--secondary`,
  `--destructive`); собственные цвета статусов («зелёный Paid», «жёлтый Pending») не
  вводятся — смысл передают текст и модификатор.
- **Мобильная таблица.** До 36rem: горизонтальная прокрутка в оболочке (по умолчанию)
  или превращение строки в карточку (предлагаемый `.tg-table--stack` с `data-label`
  на ячейках) для 3–5 столбцов.
- **Палитра графиков.** Серии используют роли: 1 — `--accent-main`, 2 — `--text-secondary`,
  3 — `--danger-main`; дальнейшие серии — прозрачности `--accent-main` (100/70/45/25%) и
  паттерны (штриховка), а не новые оттенки. Сетка — `--border-subtle-color`, подписи
  осей — `--text-secondary` 12–14 px.
- **Доступность графиков.** `figure` + `figcaption`; SVG `role="img"` с кратким выводом;
  данные — таблицей в `details` или рядом; подсказки дублируются таблицей; цвет не
  единственный способ различить серии (маркеры, штриховка, подписи).
- **Анимация** появления графика — только `opacity`/`transform` контейнера; при reduced
  motion график отрисовывается сразу.
- **Ответственность приложения.** Данные, сортировка, фильтрация, пагинация, запросы,
  выбор библиотеки графиков, расчёт осей, форматирование чисел и дат по локали.

## Спецификации компонентов

### D1. Таблица данных

Статус: `existing` · Приоритет: `P0` · Классы: `.tg-table-wrap`, `.tg-table`, `.tg-table__num`; предлагаемые `.tg-table--compact`, `.tg-table--stack`, `.tg-table__cell-main`

**Назначение**: сравнение записей по общим столбцам: пользователи, счета, товары,
лидерборд, участники.

**Состав**: подпись; заголовки; строки; ячейка с медиа (аватар + имя + почта); числа;
статусы; действия строки; итог; пагинация под таблицей.

```html
<div class="tg-table-wrap" role="region" aria-labelledby="inv-cap" tabindex="0">
  <table class="tg-table">
    <caption id="inv-cap">История счетов</caption>
    <thead>
      <tr><th scope="col">Счёт</th><th scope="col">Клиент</th><th scope="col">Статус</th>
          <th scope="col" class="tg-table__num">Сумма</th><th scope="col"><span class="tg-sr-only">Действия</span></th></tr>
    </thead>
    <tbody>
      <tr><th scope="row">INV-2025-001</th><td>Acme Corp</td>
          <td><span class="tg-badge tg-badge--secondary">Оплачен</span></td>
          <td class="tg-table__num">4 200,00 $</td>
          <td><a class="tg-link" href="/inv/1">Открыть<span class="tg-sr-only"> INV-2025-001</span></a></td></tr>
    </tbody>
    <tfoot><tr><th scope="row" colspan="3">Итого</th><td class="tg-table__num">11 470,00 $</td><td></td></tr></tfoot>
  </table>
</div>
```

**API** (предлагаемое): `__cell-main` — аватар + две строки текста в ячейке;
`--compact` — плотность; `--stack` — карточный вид на мобильном (заголовок ячейки из
`data-label` через `::before`). Минимальная ширина — существующий `--table-min-width`.

**Варианты из референсов**: пользователи с аватарами и ролями (14), анимированное
появление строк (16 — только fade), сравнение товаров (25), участники с выплатами и
итогом (28), тёмная игровая (38), счета (42), лидерборд (44), каталог товаров (53),
простые таблицы (59, 60, 63), плотная таблица лидов со спарклайнами (10), проекты (15).

**Состояния**: default, row hover (только если строка интерактивна), loading (D5),
empty (`.tg-empty` в `td colspan`), error.

**Поведение и ответственность приложения**: данные, ссылки строк, форматирование.

**Адаптивность**: прокрутка в оболочке с фиксированным первым столбцом (`position: sticky`,
опционально); `--stack` для узких таблиц.

**Доступность**: `caption`, `scope`, уникальные имена действий в строках; строка
целиком не делается ссылкой — ссылка в ключевой ячейке.

**Токены и связь с TDS**: `--section-separator-color`, `--background-panel`, `.tg-num`.

**Критерии готовности**: все варианты собираются без новых цветов; таблица читаема
экранным диктором по ячейкам.

**Референсы** (13):

- `isaiahbjork--leads-data-table--c4824275.webp` — Leads Data Table
- `alain00--user-table--cf490fe2.webp` — User Table
- `ln-dev7--projects-table--4662eecf.webp` — projects-table
- `arunachalam--animated-table--eb321818.webp` — Animated Table
- `ruixen-ui--comparison-table--f17e6512.webp` — Comparison Table
- `ruixen-ui--contributors-overview-table--bbfbd680.webp` — ContributorsOverviewTable 
- `chrisdalbano--fz-table--6653c7f6.webp` — Forza Table
- `cnippet-dev--v-table-12--56bbebcc.webp` — Invoice History Table
- `arihantcodes-1f7b8c4d--leaderboard-table--4ac98adf.webp` — Leaderboard Table
- `ruixen-ui--product-table--f2d88c16.webp` — ProductTable
- `coss-com--table--8c9392be.webp` — Table
- `originui--table--fd970185.webp` — Table
- `jolbol1--table--7fd7696f.webp` — Table [react-aria-components]

### D2. Выбор строк и массовые действия

Статус: `extend` · Приоритет: `P0` · Классы: D1 + `.tg-check`; предлагаемые `.tg-table__select`, `tr[aria-selected]`, `.tg-bulk-bar`

**Назначение**: выбрать несколько записей и применить действие (удалить, экспортировать,
изменить статус).

**Состав**: флажок «выбрать все» в заголовке; флажки строк; панель массовых действий
со счётчиком; подтверждение опасных действий в диалоге.

```html
<div class="tg-bulk-bar" role="region" aria-label="Действия с выбранными" hidden>
  <span role="status">Выбрано 3</span>
  <button class="tg-btn tg-btn--secondary tg-btn--sm" type="button">Экспорт</button>
  <button class="tg-btn tg-btn--destructive tg-btn--sm" type="button">Удалить</button>
  <button class="tg-btn tg-btn--ghost tg-btn--sm" type="button">Снять выбор</button>
</div>
<table class="tg-table">
  <thead><tr><th scope="col" class="tg-table__select">
    <input class="tg-check" type="checkbox" aria-label="Выбрать все строки"></th>…</tr></thead>
  <tbody><tr aria-selected="true"><td class="tg-table__select">
    <input class="tg-check" type="checkbox" checked aria-label="Выбрать Бен Лопес"></td>…</tr></tbody>
</table>
```

**API** (предлагаемое): выбранная строка — фон `--accent-soft` (без насыщенной
заливки); `.tg-bulk-bar` — `.tg-toolbar` над таблицей или прилипающий снизу
(`position: sticky`, `--shadow-overlay`).

**Варианты из референсов**: контакты с модальным просмотром (27), таблица с флажками
и «0 of 5 selected» (30), панель «3 selected / Clear selection» (33), выделение ячеек
в платежах (49 — это уже data grid, см. «Поведение»), таблица с диалогом (62), выбор строк (64).

**Состояния**: none / some (indeterminate в заголовке) / all; строка selected; панель hidden/shown.

**Поведение и ответственность приложения**: синхронизация «выбрать все» (на странице
или во всех результатах — явный выбор), Shift+клик для диапазона (улучшение), выполнение
действий. Выделение отдельных ячеек (49) требует `role="grid"`: стрелки по ячейкам,
Shift+стрелки — диапазон, Ctrl/Cmd+C — копирование; это P2 и отдельный компонент
`.tg-data-grid` (предлагаемый), не модификатор таблицы.

**Адаптивность**: панель действий на мобильном прилипает к низу над `tg-tabbar`.

**Доступность**: имена флажков из ключевой ячейки строки; счётчик в status; `aria-selected`
на строке только в grid-режиме, в обычной таблице состояние несёт флажок.

**Токены и связь с TDS**: `--accent-soft`, `--shadow-overlay`.

**Критерии готовности**: всё выполнимо с клавиатуры; indeterminate объявляется.

**Референсы** (6):

- `isaiahbjork--contacts-table-with-modal--5eba104f.webp` — Contacts Table With Modal
- `shadcn--data-table--2c4ab4e3.webp` — Data Table
- `skovhm--data-table-toolbar--8dc014d8.webp` — Data Table Toolbar
- `bundui--table11--b870bcb4.webp` — Payments Table with Cell Selection
- `ruixen-ui--table-with-dialog--44899b1e.webp` — Table With Dialog
- `felipemenezes098--table-07--3186f8c9.webp` — Table with Row Selection

### D3. Панель фильтров, поиска и столбцов

Статус: `extend` · Приоритет: `P1` · Классы: `.tg-toolbar`, `.tg-search`, `.tg-chip`, `.tg-select`, buttons B14 `.tg-menu`; предлагаемый `.tg-table-toolbar`

**Назначение**: сужение данных таблицы: поиск, фильтры по статусу/дате, видимость
столбцов, экспорт, количество результатов.

**Состав**: поиск; фильтры-чипы или выпадающие с множественным выбором; активные
фильтры с «Сбросить»; меню «Столбцы» с `menuitemcheckbox`; экспорт; счётчик.

```html
<div class="tg-toolbar tg-table-toolbar" role="search" aria-label="Фильтры счетов">
  <div class="tg-search"><input class="tg-search__input" type="search" aria-label="Поиск по клиенту"></div>
  <button class="tg-chip" type="button" aria-pressed="true">Не оплачены</button>
  <button class="tg-btn tg-btn--secondary tg-btn--sm" type="button" aria-haspopup="menu" aria-expanded="false">Столбцы</button>
  <span class="tg-text-sm tg-text-muted tg-ms-auto" role="status">18 счетов</span>
</div>
```

**API** (предлагаемое): `.tg-table-toolbar` — `.tg-toolbar` над таблицей с
`--responsive`; дальше — существующие классы.

**Варианты из референсов**: видимость столбцов (24), сложная таблица с фильтром и
столбцами (26), таблица с поиском и пагинацией (29, 31), фильтры статуса и приоритета (32),
фильтруемые счета с суммой (36), гибкие фильтры по полям (37), журнал с уровнями (41),
поды Kubernetes с вкладками статуса (9), поиск над таблицей (66).

**Состояния**: no filters, filters active (чипы pressed + «Сбросить»), no results (`.tg-empty`
с действием «Сбросить фильтры»), loading.

**Поведение и ответственность приложения**: фильтрация, debounce поиска, сохранение в URL,
обновление счётчика.

**Адаптивность**: на мобильном фильтры уходят в `.tg-modal--sheet` по кнопке «Фильтры (2)».

**Доступность**: результат фильтрации объявляется в status; у меню столбцов —
`menuitemcheckbox`.

**Токены и связь с TDS**: как у составляющих.

**Критерии готовности**: фильтры и столбцы доступны без мыши; состояние «ничего не найдено» с выходом.

**Референсы** (10):

- `mohammadshehadeh--k8s-pod-table--36882b68.webp` — Kubernetes Pod Table
- `felipemenezes098--table-15--76184db2.webp` — Column Visibility Table
- `felipemenezes098--table-20--9fba4ab9.webp` — Complex Data Table
- `ephraimduncan--table-05--7bcc5f7d.webp` — Data Table
- `wensity--data-table--db1ce0cd.webp` — Data Table
- `uniquesonu--data-table-filter--e5db66c7.webp` — Data Table Filter
- `olewandowski1--table-2--30a4f70a.webp` — Filterable Invoices Table
- `ruixen-ui--flexi-filter-table--88a1a39f.webp` — Flexi Filter Table
- `moumensoliman--interactive-logs-table-shadcnui--b2b9fb70.webp` — Interactive Logs Table
- `hamidonsol--spotlight-table--c8401255.webp` — spotlight-table

### D4. Сортировка по столбцам

Статус: `extend` · Приоритет: `P0` · Классы: D1; предлагаемый `.tg-table__sort` (кнопка в `th`)

**Назначение**: упорядочить записи по столбцу.

**Состав**: кнопка в заголовке столбца; иконка направления; `aria-sort` на `th`.

```html
<th scope="col" aria-sort="descending">
  <button class="tg-table__sort" type="button">Сборка
    <svg class="tg-icon" aria-hidden="true">…arrow-down…</svg></button>
</th>
```

**API** (предлагаемое): кнопка во всю ширину `th`, текст заголовка + иконка 16 px;
неотсортированные — иконка `--text-secondary` при hover/focus, отсортированный —
`--text-main`.

**Варианты из референсов**: сервисы с сортировкой по времени сборки (58).

**Состояния**: none, ascending, descending, focus-visible.

**Поведение и ответственность приложения**: цикл none → ascending → descending, сортировка
данных, объявление нового порядка в status.

**Адаптивность**: в `--stack` сортировка выносится в `.tg-select` «Сортировать по».

**Доступность**: `aria-sort` только на одном `th`; кнопка с понятным именем.

**Токены и связь с TDS**: `--text-secondary`, `--icon-size`.

**Критерии готовности**: состояние сортировки объявляется экранным диктором.

**Референсы** (1):

- `ddoemonn--sortable-table--4309eb56.webp` — Sortable Table

### D5. Состояния загрузки таблицы

Статус: `existing` · Приоритет: `P0` · Классы: `.tg-skeleton`, `--text`; `.tg-empty`

**Назначение**: первая загрузка таблицы без известного прогресса.

**Состав**: строки-скелеты той же высоты, что настоящие; `aria-busy` на оболочке; отдельный status.

```html
<div class="tg-table-wrap" role="region" aria-label="Пользователи" aria-busy="true" tabindex="0">
  <table class="tg-table" aria-hidden="true">
    <tbody><tr><td><span class="tg-skeleton tg-skeleton--text"></span></td>…</tr></tbody>
  </table>
</div>
<p class="tg-sr-only" role="status">Загружаем пользователей</p>
```

**API**: существующий.

**Варианты из референсов**: табличный скелет (61).

**Состояния**: loading → loaded (снять `aria-busy`) / empty / error.

**Поведение и ответственность приложения**: переключение состояний.

**Адаптивность**: число скелет-строк = ожидаемое на экране.

**Доступность**: скелеты скрыты от диктора; статус сообщает ход.

**Токены и связь с TDS**: `--background-muted`.

**Критерии готовности**: без новых классов; без мерцающей анимации при reduced motion.

**Референсы** (1):

- `uiable--uiable-skeleton-table--7554199c.webp` — Table Skeleton

### D6. Сортируемый список

Статус: `new` · Приоритет: `P2` · Предлагаемые классы: `.tg-sortable`, `.tg-sortable__item`, `.tg-sortable__handle`

**Назначение**: ручной порядок элементов (файлы, шаги, варианты товара), вложенные группы.

**Состав**: список; ручка перетаскивания; номер позиции; необязательная вложенность.

```html
<ol class="tg-list tg-sortable" aria-label="Порядок файлов">
  <li class="tg-list-item tg-sortable__item">
    <button class="tg-icon-btn tg-icon-btn--ghost tg-sortable__handle" type="button"
            aria-describedby="sort-help" aria-label="Переместить «Демо продукта», позиция 1 из 5">…</button>
    <span class="tg-list-item__title">Демо продукта</span>
    <span class="tg-badge tg-badge--secondary">image</span>
  </li>
</ol>
<p id="sort-help" class="tg-sr-only">Пробел — взять, стрелки — переместить, пробел — отпустить, Escape — отменить.</p>
<p class="tg-sr-only" role="status" aria-live="assertive"></p>
```

**API** (предлагаемое): перетаскиваемый элемент — `--shadow-overlay` и
`transform`; место вставки — линия 2 px `--accent-main`; ручка — 44 px область.

**Варианты из референсов**: ручка редактирования (35), вложенный список (47),
файлы (56), простой список (57).

**Состояния**: idle, grabbed, moving, dropped, cancelled.

**Поведение и ответственность приложения**: drag-and-drop + клавиатура (Пробел, стрелки,
Escape), объявление позиции, сохранение порядка; альтернатива — кнопки «Выше/Ниже» в меню.

**Адаптивность**: на сенсорных — долгое нажатие на ручку.

**Доступность**: каждый шаг объявляется («Демо продукта, позиция 3 из 5»).

**Токены и связь с TDS**: `--accent-main`, `--shadow-overlay`.

**Критерии готовности**: порядок меняется без указателя.

**Референсы** (4):

- `alwurts--editable-handle--fe4eebc9.webp` — Editable Handle
- `sean0205--sortable-nested-list--7fe4f48f.webp` — Nested Sortable List
- `sean0205--c-sortable-1--eda72af3.webp` — Sortable File List
- `ebnsina--sortable--12f9839b.webp` — Sortable List

### D7. Линейные и площадные графики

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-chart`, `__header`, `__plot`, `__legend`, `__legend-item`, `__tooltip`, `__data`

**Назначение**: изменение величины во времени, сравнение 1–3 серий, аномалии, скользящие средние.

**Состав**: заголовок с итогом и изменением (cards C6); переключатель периода; область
графика; легенда; подсказка; таблица данных.

```html
<figure class="tg-card tg-chart" aria-labelledby="visits-title">
  <div class="tg-chart__header">
    <figcaption class="tg-header__title" id="visits-title">Посетители по неделям</figcaption>
    <ul class="tg-chart__legend">
      <li class="tg-chart__legend-item" style="--series: var(--accent-main)">Визиты</li>
      <li class="tg-chart__legend-item" style="--series: var(--text-secondary)">Регистрации</li>
    </ul>
  </div>
  <svg class="tg-chart__plot" role="img" aria-labelledby="visits-title visits-sum">…</svg>
  <p id="visits-sum" class="tg-sr-only">Визиты выросли с 400 до 820, регистрации стабильны около 50.</p>
  <details class="tg-disclosure tg-chart__data"><summary class="tg-disclosure__trigger">Таблица данных</summary>…</details>
</figure>
```

**API** (предлагаемое): `--series` — локальное свойство серии, принимающее **только**
роли/их прозрачности; `__legend-item` — маркер 8 px с формой (круг, квадрат, ромб) для
различения без цвета; `__tooltip` — поверхность плавающего слоя. Площадь — заливка
`--series` с `opacity: .16`; штриховка (6) — SVG-паттерн того же цвета.

**Варианты из референсов**: области (2, 6), линия с двумя сериями (11, 22, 46),
посетители (12), аномалии с отметками (17 — маркеры `--danger-main`), волна (45),
портфель с объёмом (52), SMA (55).

**Состояния**: loading (skeleton области), empty, error, hover/focus точки.

**Поведение и ответственность приложения**: библиотека рендера, оси, подсказки,
клавиатурная навигация по точкам (←/→) как улучшение.

**Адаптивность**: высота 12–20rem; на 320 px — меньше делений, подписи осей не наклоняются.

**Доступность**: краткий вывод + таблица; подсказка доступна фокусом; контраст линий ≥ 3:1 к фону.

**Токены и связь с TDS**: `--accent-main`, `--text-secondary`, `--danger-main`, `--border-subtle-color`.

**Критерии готовности**: графики в трёх темах без новых цветов; таблица данных синхронна с графиком.

**Референсы** (10):

- `arihantcodes-1f7b8c4d--area-chart--2bcfffe5.webp` — Area Chart
- `sean0205--c-chart-18--e6d7f628.webp` — Crosshatch Area Chart
- `kuratlielia--line-chart--a1909687.webp` — Line Chart
- `olewandowski1--charts-4--1fb52fa6.webp` — Monthly Visitors Line Chart
- `astralyxdev--anomaly-chart--1dad54b3.webp` — Anomaly Chart
- `shobky--charts--2b5a2dd5.webp` — Charts
- `cnippet-dev--v-chart-4--1096c092.webp` — Line Chart
- `heygaia--line-chart--83b2afa3.webp` — Line Chart
- `arihantcodes-1f7b8c4d--portfolio-chart--4a1f7ac8.webp` — Portfolio Chart
- `ssychui--sma-chart--dd7fc743.webp` — SMA Chart

### D8. Столбчатые графики

Статус: `new` · Приоритет: `P1` · Классы: `.tg-chart` (D7) + предлагаемый `.tg-chart--bar`

**Назначение**: сравнение категорий и периодов, распределения, Парето.

**Состав**: как D7; столбцы с радиусом верхних углов `--radius-xs`; подписи значений
по желанию.

```html
<figure class="tg-card tg-chart tg-chart--bar" aria-labelledby="sales-title">
  <figcaption class="tg-header__title" id="sales-title">Продажи по месяцам</figcaption>
  <svg class="tg-chart__plot" role="img" aria-labelledby="sales-title sales-sum">…</svg>
  <p id="sales-sum" class="tg-sr-only">Максимум — август, 310 продаж; минимум — февраль, 120.</p>
</figure>
```

**API** (предлагаемое): ширина столбца и промежуток задаёт библиотека; цвета — `--series`
D7; выделенный столбец — 100%, остальные — 45%.

**Варианты из референсов**: штрихованные столбцы (7), сгруппированные с легендой (18),
доска Гальтона (39 — иллюстрация распределения), Парето с кумулятивной линией (48).

**Состояния**: как D7.

**Поведение и ответственность приложения**: как D7.

**Адаптивность**: при > 12 категорий — горизонтальные столбцы на мобильном.

**Доступность**: как D7.

**Токены и связь с TDS**: как D7.

**Критерии готовности**: группы различимы штриховкой/формой в режиме без цвета.

**Референсы** (4):

- `sean0205--c-chart-3--c7cbfdb4.webp` — Diagonal Stripe Bar Chart
- `uiable--chart-example-legend--88719aa7.webp` — Bar Chart with Legend
- `21st--galton-board-chart--50eac113.webp` — Galton Board Chart
- `klyv-ui--pareto-chart--26710d37.webp` — Pareto Chart

### D9. Кольцевые и круговые диаграммы

Статус: `new` · Приоритет: `P1` · Классы: `.tg-chart` (D7) + предлагаемый `.tg-chart--donut`, `__center`

**Назначение**: доли целого (2–6 сегментов) с итогом в центре.

**Состав**: кольцо; число в центре; легенда со значениями и процентами (`.tg-num`).

```html
<figure class="tg-card tg-chart tg-chart--donut" aria-labelledby="earn-title">
  <figcaption class="tg-header__title" id="earn-title">Доход по каналам</figcaption>
  <div class="tg-chart__plot">
    <svg role="img" aria-labelledby="earn-title earn-sum">…</svg>
    <p class="tg-chart__center"><span class="tg-num">27 850 $</span><span class="tg-text-sm tg-text-muted">всего</span></p>
  </div>
  <ul class="tg-chart__legend" id="earn-sum">
    <li class="tg-chart__legend-item" style="--series: var(--accent-main)">Сайт <span class="tg-num">16 358 $</span></li>
  </ul>
</figure>
```

**API** (предлагаемое): легенда-список **является** текстовой альтернативой; сегменты
различаются прозрачностью акцента и паттернами (21, 34 — полутон/дизеринг как паттерн).

**Варианты из референсов**: приоритет багов (3), доход (8), полутоновое кольцо (21),
дизеринг (34), солнечные лучи с выбором сегмента (50).

**Состояния**: как D7; сегмент hover/selected.

**Поведение и ответственность приложения**: как D7; выбор сегмента — кнопками легенды.

**Адаптивность**: легенда под кольцом на мобильном.

**Доступность**: легенда с числами и процентами обязательна; > 6 сегментов → столбцы D8.

**Токены и связь с TDS**: как D7.

**Критерии готовности**: значения читаются без наведения.

**Референсы** (5):

- `sean0205--c-chart-21--844cf306.webp` — Bug Priority Pie Chart
- `shadcnspace--chart-02--e679b3a6.webp` — Earnings Donut Chart
- `nikolas-sapa--chart-donut-halftone--2dcf4d9f.webp` — Chart Donut Halftone
- `su2491251--dither-donut-chart--6d6cb10f.webp` — Dither Donut Chart
- `airbnb-visx--pie-chart--1f10c156.webp` — Pie chart

### D10. Свечные графики

Статус: `composition` · Приоритет: `P2` · Состав: `.tg-chart` (D7) + `.tg-segmented` периода + C6

**Назначение**: котировки (открытие, закрытие, максимум, минимум) и объём.

**Состав**: свечи; объём столбцами; переключатель периода; текущая цена и изменение.

```html
<figure class="tg-card tg-chart" aria-labelledby="aapl-title">
  <figcaption class="tg-header__title" id="aapl-title">AAPL <span class="tg-num">1 227,59 $</span></figcaption>
  <svg class="tg-chart__plot" role="img" aria-label="Свечной график за месяц, рост на 3,07%">…</svg>
</figure>
```

**API**: рост — `--accent-main`, падение — `--danger-main`, плюс форма (полая/заполненная
свеча) для различения без цвета.

**Варианты из референсов**: свечи с объёмом (19), крупные свечи (20).

**Состояния**: как D7.

**Поведение и ответственность приложения**: данные, масштаб, подсказка OHLC.

**Адаптивность**: на мобильном — меньше свечей, период выбирается сегментами.

**Доступность**: OHLC в таблице данных.

**Токены и связь с TDS**: как D7.

**Критерии готовности**: рост/падение различимы без цвета.

**Референсы** (2):

- `ssychui--candle-chart--63fbf1c1.webp` — Candle Chart
- `bklitai--candlestick-chart--b891ce02.webp` — Candlestick Chart

### D11. Специальные визуализации

Статус: `composition` · Приоритет: `P2` · Состав: `.tg-chart` (D7) + таблица данных

**Назначение**: когорты (тепловая карта), гексбин-карта, Sankey-поток, радар.

**Состав**: визуализация; шкала/легенда интенсивности; обязательная таблица.

```html
<figure class="tg-card tg-chart" aria-labelledby="cohort-title">
  <figcaption class="tg-header__title" id="cohort-title">Удержание по когортам</figcaption>
  <div class="tg-table-wrap" role="region" aria-labelledby="cohort-title" tabindex="0">
    <table class="tg-table"><!-- ячейки с фоном color-mix(--accent-main N%) и числом --></table>
  </div>
</figure>
```

**API**: интенсивность — шаги прозрачности `--accent-main` (5 ступеней) с числом в ячейке;
текст в ячейке меняет цвет для контраста.

**Варианты из референсов**: когорты (23), гексбин (43), Sankey воронки (51), радар (54).

**Состояния**: как D7.

**Поведение и ответственность приложения**: расчёт и рендер.

**Адаптивность**: тепловая карта — таблица с прокруткой; Sankey и радар на мобильном
заменяются таблицей.

**Доступность**: таблица — основной способ чтения; визуализация — дополнение.

**Токены и связь с TDS**: прозрачности `--accent-main` (через существующие роли, без новых `color-mix` в компонентах — ступени задаются в tokens при реализации).

**Критерии готовности**: тепловая карта читаема как таблица.

**Референсы** (4):

- `arihantcodes-1f7b8c4d--cohort-chart--828270c8.webp` — Cohort Retention Chart
- `daiwiikharihar--isometric-hex-chart--69169a15.webp` — Isometric Hex Chart
- `legionwebdev--pipeline-echarts-sankey-chart--2b3c14db.webp` — Pipeline Sankey Chart
- `arihantcodes-1f7b8c4d--radar-chart--d4ff9fd6.webp` — Radar Chart

### D12. Экран дашборда

Статус: `composition` · Приоритет: `P1` · Состав: navigation N11 (боковая панель) / N4 (шапка) + cards C6 + D7–D9 + D1 + `.tg-grid--bento` (cards C16)

**Назначение**: обзорный экран продукта: KPI сверху, графики, таблица последних событий.

**Состав**: шапка или боковая панель; заголовок страницы и период; ряд KPI; сетка
графиков; таблица.

```html
<div class="tg-page-shell">
  <header class="tg-page-header"><div class="tg-container tg-row"><h1 class="tg-header__title">Дашборд</h1></div></header>
  <main class="tg-container tg-page-content tg-col tg-gap-6">
    <section class="tg-grid" aria-label="Ключевые показатели"><!-- C6 × 4 --></section>
    <section class="tg-grid tg-grid--bento" aria-label="Графики"><!-- D7, D9 --></section>
    <section aria-labelledby="recent"><h2 id="recent" class="tg-header__title">Последние операции</h2><!-- D1 --></section>
  </main>
</div>
```

**API**: новых классов нет.

**Варианты из референсов**: аналитический bento (1), «Builder OS» (4), шапка дашборда
с вкладками (5), портфель акций (13).

**Состояния**: каждая область загружается независимо (свои skeleton/empty/error).

**Поведение и ответственность приложения**: данные, период, обновления.

**Адаптивность**: KPI 4 → 2 → 1 колонка; графики в одну колонку на мобильном.

**Доступность**: заголовки областей (`h2`) для навигации диктора; без live-обновлений каждого числа.

**Токены и связь с TDS**: `--space-6`.

**Критерии готовности**: пример экрана в композициях каталога.

**Референсы** (4):

- `romanvasnev--analytics-bento--4840aa2f.webp` — Analytics Bento
- `drewdog--builder-os-bento--ddb614bc.webp` — Builder OS Bento
- `kumail-ali-r--core-header-navbar--a3a81407.webp` — Core Header Navbar
- `moumensoliman--stocks-dashboard-shadcnui--e745533a.webp` — Stocks Dashboard

### D13. Иллюстрации продукта

Статус: `composition` · Приоритет: `P2` · Состав: heroes/features композиции + `.tg-media`

**Назначение**: маркетинговые иллюстрации интерфейса (изометрия, планшет со стилусом),
попавшие в раздел дашбордов. Это не компоненты данных.

**Состав**: изображение или SVG-иллюстрация; заголовок; описание.

```html
<figure class="tg-media">
  <img src="/board.png" alt="Доска с заметками и выделенным показателем +38%">
  <figcaption class="tg-text-muted">Отмечайте важное прямо на доске</figcaption>
</figure>
```

**API**: новых классов нет.

**Варианты из референсов**: изометрический поворотный стол (40), планшет с разметкой (65).

**Состояния**: статично.

**Поведение и ответственность приложения**: изображения.

**Адаптивность**: как `.tg-media`.

**Доступность**: `alt` по смыслу; анимации — с reduced motion фолбэком.

**Токены и связь с TDS**: `--media-max-size`.

**Критерии готовности**: см. heroes/features.

**Референсы** (2):

- `lucasmarkes--turntable--2d84f4c1.webp` — Hairline Turntable
- `21st--mg-dev-tablet--ab4dbbae.webp` — Tablet Stylus Markup

## Порядок реализации

1. **P0:** D1 (`__cell-main`, `--compact`, `--stack`), D4 сортировка, D2 выбор строк и
   `.tg-bulk-bar`, D5 — примеры состояний. Зависят от cards C6 и navigation N12.
2. **P1:** D3 панель фильтров (после buttons B14 и forms F9); `.tg-chart` и легенда
   (D7), затем D8, D9; D12 экран.
3. **P2:** D6 сортируемый список, D10, D11, D13; отдельно — контракт `.tg-data-grid`
   для выделения и редактирования ячеек.

## Контрольный список покрытия

| Группа | Референсов |
| --- | ---: |
| D1. Таблица данных | 13 |
| D2. Выбор строк и массовые действия | 6 |
| D3. Панель фильтров, поиска и столбцов | 10 |
| D4. Сортировка по столбцам | 1 |
| D5. Состояния загрузки таблицы | 1 |
| D6. Сортируемый список | 4 |
| D7. Линейные и площадные графики | 10 |
| D8. Столбчатые графики | 4 |
| D9. Кольцевые и круговые диаграммы | 5 |
| D10. Свечные графики | 2 |
| D11. Специальные визуализации | 4 |
| D12. Экран дашборда | 4 |
| D13. Иллюстрации продукта | 2 |
| **Итого** | **66 из 66** |

Каждый из 66 файлов папки указан ровно в одной основной группе. Перекрёстные ссылки на другие категории даны текстом, без повторного учёта.
