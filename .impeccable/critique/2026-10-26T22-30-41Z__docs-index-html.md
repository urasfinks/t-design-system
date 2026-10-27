---
target: аудит дизайн-системы и каталога компонентов
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/sfinks/WebstormProjects/t-design-system/docs/index.html"
target_fingerprint: "sha256:adfa85b9345f373d06c278443ef0f950660c65d783a1c8ed4743f82e77b976d8"
target_path: /Users/sfinks/WebstormProjects/t-design-system/docs/index.html
timestamp: 2026-10-26T22-30-41Z
slug: docs-index-html
---
⚠️ DEGRADED: single-context (использование субагентов запрещено инструкциями среды)

# Аудит t-design-system

## Оценка UX

| # | Эвристика Нильсена | Оценка | Главное наблюдение |
|---|---|---:|---|
| 1 | Видимость статуса | 3 | Есть loading, toast, aria-live и активный раздел; не все состояния одинаково заметны. |
| 2 | Соответствие реальному миру | 3 | Знакомые паттерны, но часть поэтичных заголовков не помогает поиску. |
| 3 | Контроль и свобода | 3 | Native dialog, Escape, reset и мобильная навигация работают хорошо. |
| 4 | consistency и стандарты | 3 | Общая геометрия сильная; disabled-opacity и motion-длительности различаются. |
| 5 | Предотвращение ошибок | 3 | Есть labels, native validation и понятные error states. |
| 6 | Распознавание вместо памяти | 2 | 14 плоских разделов без глобального поиска. |
| 7 | Эффективность для опытных | 2 | Keyboard support есть у иконок, но нет быстрого перехода ко всем компонентам. |
| 8 | Эстетика и минимализм | 3 | Спокойная система, но длинные повторяющиеся панели утомляют. |
| 9 | Восстановление после ошибок | 4 | Ошибки конкретны, расположены рядом с полем и связаны с error-summary. |
| 10 | Помощь и документация | 2 | Живые примеры полезны, но документация не searchable и недостаточно task-focused. |
| **Итого** | | **28/40** | **Хорошая основа; нужны точечные UX-исправления.** |

Когнитивная нагрузка **умеренная**: 14 равноправных пунктов навигации, длинная лента и недостаточное progressive disclosure. Эмоционально каталог начинается уверенно, но середина превращается в однообразную прокрутку.

## Специфичность дизайна

Система выглядит авторской, а не как универсальный dashboard. Четырёхцветные темы, спокойные поверхности, одинаковая геометрия и живые Telegram-oriented композиции образуют узнаваемый язык. Главный недостаток не визуальный, а навигационный: каталог демонстрирует систему, но ещё не помогает быстро ею пользоваться.

Детерминированный CLI-скан `docs/index.html` нашёл 4 срабатывания; browser overlay — 10. Подтверждены низкий контраст placeholder и избыток длинных тире. Скрытое превью загрузки без `src`, паддинги таблицы, функциональные stripes и 8 вложенных панелей-примеров являются ложными срабатываниями в этом контексте.

## Что уже хорошо

- Семантические токены, четыре исходных цвета, 4px spacing и общая высота контролов.
- Видимый focus, reduced-motion, forced-colors, native semantics и понятные ошибки.
- Три аккуратные палитры, живые интерактивные примеры и отсутствие горизонтального overflow вплоть до 320px.

## Приоритетные исправления

### 1. [P1] Вернуть видимые границы unchecked checkbox/radio

Сейчас невыбранный контрол получает `border-color: transparent`. Замер в Chromium показал контраст заливки с внешним фоном только **1.14:1 Light, 1.11:1 Dark и 1.23:1 iOS Dark**: контрол трудно обнаружить до наведения. [forms](kimi-cite://md-line?path=%2FUsers%2Fsfinks%2FWebstormProjects%2Ft-design-system%2Fsrc%2Fcomponents%2F_forms.scss&line=128&text=%26%3Anot(%3Achecked)%20%7B "citation")

**Исправление:** добавить `--choice-border-color` с контрастом не менее 3:1 к соседнему фону; checked состояние оставить акцентным. Обновить сознательно задокументированный quiet-control контракт и тест, который сейчас закрепляет transparent border.

**Команда:** `$impeccable audit`.

### 2. [P1] Задать placeholder поиска через семантический токен

`.tg-input` и `.tg-textarea` используют `--text-secondary`, а `.tg-search__input` остаётся с браузерным `#757575`. Замер дал **3.69:1 Light, 3.28:1 Dark и 3.70:1 iOS Dark** вместо 4.5:1. [forms](kimi-cite://md-line?path=%2FUsers%2Fsfinks%2FWebstormProjects%2Ft-design-system%2Fsrc%2Fcomponents%2F_forms.scss&line=74&text=.tg-input%3A%3Aplaceholder%2C%20.tg-textarea%3A%3Aplaceholder%20%7B "citation"), [patterns](kimi-cite://md-line?path=%2FUsers%2Fsfinks%2FWebstormProjects%2Ft-design-system%2Fsrc%2Fcomponents%2F_patterns.scss&line=24&text=.tg-search__input%20%7B "citation")

**Исправление:** `.tg-search__input::placeholder { color: var(--text-secondary); opacity: 1; }` и отдельный browser-тест во всех темах.

**Команда:** `$impeccable audit`.

### 3. [P1] Превратить каталог из ленты в инструмент поиска

В навигации 14 равноправных разделов, а полноценный поиск существует только для иконок. На desktop страница занимает около 15.2 высот viewport: найти конкретный токен или компонент трудно. [index](kimi-cite://md-line?path=%2FUsers%2Fsfinks%2FWebstormProjects%2Ft-design-system%2Fdocs%2Findex.html&line=24&text=%3Cnav%20class%3D%22mobile-navigation%22 "citation")

**Исправление:** глобальный поиск по компонентам, токенам и классам; группы «Основа / Компоненты / Паттерны / Подключение»; `/` или Cmd/Ctrl+K для быстрого входа. На мобильном сохранить текущий select и добавить поиск отдельно.

**Команда:** `$impeccable layout`.

### 4. [P2] Ввести публичную числовую типографику

Все ячейки таблицы выравниваются влево, хотя DESIGN.md требует tabular numerals для сумм. Без модификатора суммы и количества дрожат по ширине и хуже сравниваются. [patterns](kimi-cite://md-line?path=%2FUsers%2Fsfinks%2FWebstormProjects%2Ft-design-system%2Fsrc%2Fcomponents%2F_patterns.scss&line=120&text=%3Ais(th%2C%20td)%20%7B "citation"), [DESIGN](kimi-cite://md-line?path=%2FUsers%2Fsfinks%2FWebstormProjects%2Ft-design-system%2FDESIGN.md&line=98&text=Keep%20names%2C%20quantities%20and%20amounts%20aligned%3B%20use%20tabular%20numerals%20for%20amounts. "citation")

**Исправление:** `.tg-num` / `.tg-table__num` с `font-variant-numeric: tabular-nums; text-align: end`; применять к числовым заголовкам, суммам и денежным значениям списков.

**Команда:** `$impeccable typeset`.

### 5. [P2] Убрать layout-анимации и разнобой длительностей

Progress анимирует `width`/`inline-size`, switch — `inset-inline-start`, а fade использует 350ms вместо общего `--duration`. Это лишняя работа для layout и разный характер движения. [feedback](kimi-cite://md-line?path=%2FUsers%2Fsfinks%2FWebstormProjects%2Ft-design-system%2Fsrc%2Fcomponents%2F_feedback.scss&line=72&text=transition%3A%20width%20var(--progress-duration)%3B "citation"), [forms](kimi-cite://md-line?path=%2FUsers%2Fsfinks%2FWebstormProjects%2Ft-design-system%2Fsrc%2Fcomponents%2F_forms.scss&line=241&text=transition%3A%20inset-inline-start%20var(--duration)%20var(--ease)%3B "citation"), [effects](kimi-cite://md-line?path=%2FUsers%2Fsfinks%2FWebstormProjects%2Ft-design-system%2Fsrc%2Fcomponents%2F_effects.scss&line=145&text=animation%3A%20tg-effect-in%20350ms%20ease%20both%3B "citation")

**Исправление:** `scaleX()` для progress, `translateX()` для knob с учётом RTL, fade через `var(--duration)`. Сохранить reduced-motion и функциональный linear spinner.

**Команда:** `$impeccable animate`.

## Практический план Before / After / Why

| Before | After | Why |
|---|---|---|
| `border-color: transparent` у unchecked | `--choice-border-color`, контраст ≥3:1 | Контрол виден до взаимодействия. |
| UA `#757575` у search placeholder | `var(--text-secondary)`, `opacity: 1` | Контраст и единая тема. |
| 14 плоских ссылок | Группы + глобальный поиск + Cmd/Ctrl+K | Меньше памяти и прокрутки. |
| `text-align: start` для чисел | `.tg-num`: tabular nums + end | Быстрое сравнение значений. |
| `width`, `inline-size`, `inset-inline-start` | `transform` + общий `--duration` | Меньше layout work, спокойнее motion. |

## Дополнительные рекомендации

- **P2 — единый disabled-token.** Сейчас встречаются `.45`, `.5` и `--disabled-opacity`. В замере disabled primary text составил 2.16–2.70:1. Disabled формально исключён из WCAG contrast, поэтому это требование читаемости, а не заявленное нарушение WCAG. Не гасить весь контейнер без необходимости и сохранять понятную причину недоступности. [base](kimi-cite://md-line?path=%2FUsers%2Fsfinks%2FWebstormProjects%2Ft-design-system%2Fsrc%2Fbase%2F_index.scss&line=51&text=opacity%3A%20.45%3B "citation")
- **P2 — один вход для акцента.** В каталоге достаточно менять `--button-color`; `--link-color` и `--accent-text-color` уже наследуются. Лишние overrides повышают риск рассинхронизации. [catalog](kimi-cite://md-line?path=%2FUsers%2Fsfinks%2FWebstormProjects%2Ft-design-system%2Fdocs%2Fcatalog.js&line=20&text=for%20(const%20property%20of%20%5B%27--button-color%27%2C%20%27--link-color%27%2C%20%27--accent-text-color%27%5D)%20%7B "citation")
- **P2 — мобильная palette-table.** Заменить четыре сжатые колонки строками: swatch + полное имя токена + роль. Сейчас `overflow-wrap: anywhere` дробит имена переменных по слогам. [catalog](kimi-cite://md-line?path=%2FUsers%2Fsfinks%2FWebstormProjects%2Ft-design-system%2Fdocs%2Fcatalog.css&line=214&text=.palette-table%20code%20%7B "citation")
- **P2 — обновить stale baseline.** Последний коммит ввёл `--accent-readable` и `--danger-readable`; baseline ожидает прежние цвета. Обновить снимок после визуального review и оставить отдельные contrast assertions. Это единственный падший browser-suite; остальные проверки прошли. [tokens](kimi-cite://md-line?path=%2FUsers%2Fsfinks%2FWebstormProjects%2Ft-design-system%2Fsrc%2Ftokens%2F_index.scss&line=79&text=--accent-readable%3A%20light-dark "citation"), [baseline-compatibility](kimi-cite://md-line?path=%2FUsers%2Fsfinks%2FWebstormProjects%2Ft-design-system%2Ftests%2Fbaseline-compatibility.browser.mjs&line=65&text=if(actual%5Bi%5D%5Bpart%5D%5Bproperty%5D!%3D%3Dexpected%5Bi%5D%5Bpart%5D%5Bproperty%5D) "citation")
- **P3 — редактура.** Уменьшить число длинных тире и общих маркетинговых фраз; использовать task-focused заголовки «Формы», «Таблицы», «Навигация» вместо поэтичных формулировок.

## Persona red flags

- **Alex, опытный разработчик:** нет Cmd/Ctrl+K или полного поиска; нахождение нужного компонента требует прокрутки длинной страницы.
- **Jordan, новичок:** unchecked контрол трудно отличить от фона, а поэтичные заголовки не всегда подсказывают содержимое раздела.
- **Sam, клавиатура и низкое зрение:** focus и keyboard semantics сильные, но placeholder поиска и границы choice controls недостаточно различимы.

## Вопрос для следующей итерации

Может ли главная страница каталога стать прежде всего быстрым справочником, а маркетинговый hero и длинные демонстрации раскрываться по мере необходимости?
