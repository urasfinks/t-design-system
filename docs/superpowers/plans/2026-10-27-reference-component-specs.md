# Reference Component Specifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать 17 реализационных спецификаций `components.md`, которые группируют все 1000 превью 21st.dev в компоненты и композиции TDS.

**Architecture:** Каждая папка категории получает самостоятельный Markdown-документ единой структуры. Группировка выполняется по назначению и поведению с учётом имён, метаданных и визуальной проверки референсов; Python-проверка подтверждает полноту покрытия и обязательные разделы.

**Tech Stack:** Markdown, HTML в примерах, существующие SCSS/API TDS, Python 3 standard library.

**Spec:** `docs/superpowers/specs/2026-10-27-reference-component-specs-design.md`

## Global Constraints

- Создаются только спецификации и их проверка; SCSS/JS-компоненты не реализуются.
- Сохраняются существующие `.tg-*` API, четырёхцветные темы, системный шрифт, 4 px-сетка и размеры TDS.
- Каждый компонент содержит назначение, состав, HTML-каркас, API, варианты, состояния, поведение, адаптивность, доступность, токены, критерии готовности и референсы.
- Статусы: `existing`, `extend`, `new`, `composition`; приоритеты: `P0`, `P1`, `P2`.
- Все 1000 существующих `.webp` должны быть упомянуты по точному имени хотя бы в одном документе; выдуманные имена запрещены.
- Новые классы явно помечаются как предлагаемые; существующие контракты не переопределяются.
- Никаких git-коммитов без отдельного запроса владельца.

## Review Focus

- Неточные имена/исходные категории: спецификация должна следовать фактической семантике превью; проверяется визуальной выборкой в задачах 2–5.
- Дублирование существующих компонентов: сначала проверяются `README.md`, `DESIGN.md` и `docs/component-standard.md`; статус `new` требует новой семантики или структуры.
- Сложные виджеты: combobox, calendar, carousel, data grid и navigation получают явный клавиатурный контракт и раздел ответственности приложения.
- Декоративные эффекты: glass, 3D и motion не должны менять базовую палитру и обязаны иметь reduced-motion fallback.
- Папка `misc`: элементы не объединяются в один неопределённый компонент; каждая группа получает конкретное назначение и основной набор референсов.

---

### Task 1: Инвентаризация и проверка спецификаций

**Files:**
- Create: `references/21st-dev-1000/verify_components.py`
- Read: `references/21st-dev-1000/manifest.csv`
- Read: `README.md`, `DESIGN.md`, `docs/component-standard.md`

**Interfaces:**
- Consumes: `references/21st-dev-1000/images/<category>/*.webp` and future `components.md` files.
- Produces: `python references/21st-dev-1000/verify_components.py` with exit code 0 only for 17 valid documents and complete reference coverage.

- [x] **Step 1: Запустить проверку до создания документов**

Run: `python references/21st-dev-1000/verify_components.py`
Expected: FAIL; сообщает об отсутствии 17 `components.md`.

- [x] **Step 2: Реализовать проверку**

Проверить точный набор из 17 категорий; наличие в каждом документе разделов «Сводная таблица», «Общие решения», «Порядок реализации»; наличие HTML, состояний, доступности и референсов в спецификациях; точное совпадение найденных `.webp` с файлами на диске; отсутствие неучтённых и несуществующих имён.

- [x] **Step 3: Зафиксировать контрольный список существующих API**

Для задач 2–5 подготовить внутреннее соответствие существующих классов категориям, чтобы `existing`/`extend` не назначались по догадке.

### Task 2: Действия, ввод и навигация

**Files:**
- Create: `references/21st-dev-1000/images/buttons/components.md`
- Create: `references/21st-dev-1000/images/forms/components.md`
- Create: `references/21st-dev-1000/images/navigation/components.md`
- Create: `references/21st-dev-1000/images/sign-in/components.md`

**Interfaces:**
- Consumes: существующие `.tg-btn`, `.tg-icon-btn`, `.tg-field`, `.tg-choice`, `.tg-switch`, `.tg-tabs`, `.tg-modal` и связанные токены.
- Produces: четыре спецификации с приоритетами базовых расширений и новых интерактивных паттернов.

- [x] **Step 1: Проанализировать имена, метаданные и репрезентативные превью четырёх папок**

Выделить семантические группы; отдельно проверить неочевидные названия и референсы, визуально не соответствующие исходной категории.

- [x] **Step 2: Написать четыре документа по утверждённому шаблону**

Для combobox, picker, carousel и сложной навигации явно указать клавиатуру, управление фокусом, ARIA и обязанности приложения; для sign-in не переносить бизнес-логику авторизации.

- [x] **Step 3: Проверить категории**

Run: `python references/21st-dev-1000/verify_components.py`
Expected: FAIL только из-за ещё не созданных категорий; для этих четырёх документов нет несуществующих референсов или пропущенных обязательных разделов.

### Task 3: Карточки, данные и смешанные референсы

**Files:**
- Create: `references/21st-dev-1000/images/cards/components.md`
- Create: `references/21st-dev-1000/images/dashboards/components.md`
- Create: `references/21st-dev-1000/images/text/components.md`
- Create: `references/21st-dev-1000/images/misc/components.md`

**Interfaces:**
- Consumes: `.tg-card`, `.tg-list`, `.tg-table`, `.tg-badge`, `.tg-avatar`, `.tg-num`, layout utilities.
- Produces: четыре спецификации, отделяющие примитивы от data/dashboard/marketing композиций.

- [x] **Step 1: Сгруппировать референсы по задаче и структуре**

Проверить `misc` визуально и по метаданным; не создавать общий «разный компонент». Для data grid отличать CSS-таблицу от редактируемого виджета.

- [x] **Step 2: Написать четыре документа**

Указать переполнение данных, табличные числа, длинный контент, empty/loading/error, мобильное представление и состав композиций.

- [x] **Step 3: Проверить категории**

Run: `python references/21st-dev-1000/verify_components.py`
Expected: ошибки только для ещё отсутствующих документов; референсы этих четырёх категорий валидны.

### Task 4: Секции, коллекции и отзывы

**Files:**
- Create: `references/21st-dev-1000/images/features/components.md`
- Create: `references/21st-dev-1000/images/heroes/components.md`
- Create: `references/21st-dev-1000/images/ctas/components.md`
- Create: `references/21st-dev-1000/images/footers/components.md`
- Create: `references/21st-dev-1000/images/pricing/components.md`
- Create: `references/21st-dev-1000/images/testimonials/components.md`
- Create: `references/21st-dev-1000/images/galleries/components.md`

**Interfaces:**
- Consumes: примитивы действий, карточек, форм, навигации и данных из задач 2–3.
- Produces: семь спецификаций преимущественно со статусом `composition`, без дублирования внутренних примитивов.

- [x] **Step 1: Выделить повторяющиеся композиции**

Сгруппировать grids, columns, carousels, stacked cards, pricing intervals, media layouts и navigation/footer patterns; проверить репрезентативные изображения каждой группы.

- [x] **Step 2: Написать семь документов**

Описать структуру секций, порядок дочерних компонентов, адаптивные перестроения, контентные ограничения, доступную альтернативу автопрокрутки и reduced motion.

- [x] **Step 3: Проверить категории**

Run: `python references/21st-dev-1000/verify_components.py`
Expected: ошибки только для ещё отсутствующих документов; референсы этих семи категорий валидны.

### Task 5: AI-чаты и визуальные эффекты

**Files:**
- Create: `references/21st-dev-1000/images/ai-chats/components.md`
- Create: `references/21st-dev-1000/images/shaders/components.md`

**Interfaces:**
- Consumes: forms, buttons, cards, lists, feedback, effects и токены motion/z-index.
- Produces: две спецификации с чётким разделением CSS-оболочки, JS-поведения и прикладных данных.

- [x] **Step 1: Сгруппировать chat/composer/message/tool states и shader/background variants**

Отделить переносимые структуры от WebGL/Canvas-демо и бизнес-логики AI.

- [x] **Step 2: Написать два документа**

Для чата описать live regions, фокус, loading/streaming/error как контракты приложения; для shaders — декоративность, `aria-hidden`, производительность, fallback и запрет обязательного WebGL для базового UI.

- [x] **Step 3: Проверить категории**

Run: `python references/21st-dev-1000/verify_components.py`
Expected: PASS по структуре всех 17 документов и покрытию всех референсов.

### Task 6: Итоговый аудит полноты и согласованности

**Files:**
- Modify: все 17 `components.md` только по найденным замечаниям
- Test: `references/21st-dev-1000/verify_components.py`

**Interfaces:**
- Consumes: все документы задач 2–5.
- Produces: проверенный комплект спецификаций, готовый к дальнейшему планированию реализации.

- [x] **Step 1: Сверить документы со спецификацией дизайна**

Проверить единый шаблон, корректные статусы/приоритеты, отсутствие новых палитр, сохранение существующих классов и явные клавиатурные контракты.

- [x] **Step 2: Запустить автоматическую проверку**

Run: `python references/21st-dev-1000/verify_components.py`
Expected: `PASS: 17 components.md; 1000 unique references; 0 missing; 0 unknown`.

- [x] **Step 3: Проверить количество документов и отсутствие лишних файлов изображений**

Run: `python references/21st-dev-1000/verify.py && python references/21st-dev-1000/verify_components.py`
Expected: исходные 1000 изображений остаются валидными; итоговая проверка спецификаций проходит.
