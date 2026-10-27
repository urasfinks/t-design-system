# AI-чаты — спецификации компонентов

## Назначение категории

Папка `ai-chats` (17 превью): поле запроса к ассистенту, подсказки быстрых
действий, выбор режима, окно чата с сообщениями, ход работы агента и вызовы
инструментов, подтверждение действий агента, ветвление ответа, «спросить ИИ о выделенном»,
генерация медиа и аватар ассистента. В TDS уже есть композиция `.tg-composer`
(поле с автоподстройкой высоты, резерв места под композер), `.tg-thread`,
`.tg-comment`, `.tg-reply-preview`.

Документ жёстко разделяет три слоя:

1. **CSS-оболочка TDS** — раскладка, поверхности, состояния, типографика сообщений.
2. **JS-поведение** — автопрокрутка ленты, фокус, клавиши, live regions; пример даёт
   витрина, реализует приложение.
3. **Прикладные данные и логика AI** — модели, стриминг, инструменты, разрешения,
   история, ошибки провайдера. Это никогда не часть TDS.

## Сводная таблица

| Компонент / паттерн | Тип работы | Референсов | Приоритет |
| --- | --- | ---: | --- |
| A1. Композер запроса | `extend` | 3 | `P0` |
| A2. Подсказки и быстрые действия | `composition` | 2 | `P1` |
| A3. Выбор режима и модели | `composition` | 1 | `P1` |
| A4. Окно чата и сообщения | `new` | 3 | `P0` |
| A5. Ход работы агента и результаты инструментов | `new` | 2 | `P1` |
| A6. Подтверждение действия агента | `new` | 2 | `P1` |
| A7. Ветвление ответа | `composition` | 1 | `P2` |
| A8. Спросить ИИ о выделенном | `composition` | 1 | `P2` |
| A9. Генерация медиа | `composition` | 1 | `P2` |
| A10. Аватар ассистента | `composition` | 1 | `P2` |

## Общие решения категории

- **Состояния ответа — контракт приложения.** `idle → submitting → streaming → done`,
  плюс `stopped`, `error`, `needs-approval`. TDS даёт атрибут состояния на сообщении
  (`data-state`) и оформление каждого состояния; переходы выполняет приложение.
- **Live regions.** Лента сообщений — `role="log"` с `aria-live="polite"`; во время
  стриминга объявляется не каждый токен, а начало («Ассистент отвечает») и завершение
  ответа (через отдельный `role="status"`). Ошибки — `role="alert"` только для сбоя
  отправки.
- **Фокус.** После отправки фокус остаётся в поле; кнопка «Отправить» становится
  «Остановить» (та же позиция, `aria-label` меняется); новые сообщения не перехватывают
  фокус.
- **Прокрутка.** Лента прилипает к низу, только если пользователь уже внизу; иначе —
  кнопка «К новым сообщениям» (buttons B3). Пространство под композер — существующие
  `--tg-composer-height`, `--tg-keyboard-inset`.
- **Клавиши.** Enter — отправить, Shift+Enter — новая строка (на мобильном Enter
  вставляет строку, отправка — кнопкой); Escape — остановить генерацию при фокусе в поле;
  ↑ в пустом поле — редактировать последнее сообщение (по желанию).
- **Без мистики в оформлении.** Свечения, ауры и «живые» градиенты (9, 11) — P2-эффекты;
  состояние «думает» передаётся текстом и спиннером, а не только анимацией.
- **Ответственность приложения**: модель, стриминг, инструменты, разрешения, хранение,
  ограничения, модерация, вложения, оценка ответов.

## Спецификации компонентов

### A1. Композер запроса

Статус: `extend` · Приоритет: `P0` · Классы: `.tg-composer`, `__inner`, `__form`, `__input`, `__textarea`, `__caption`; предлагаемые `.tg-composer__toolbar`, `.tg-composer__attachments`, `[data-state="streaming"]`

**Назначение**: ввод запроса к ассистенту с вложениями, выбором режима и отправкой/остановкой.

**Состав**: многострочное поле; панель под полем (вложение, голос, режим, отправка);
вложения-чипы над полем; подпись-подсказка.

```html
<footer class="tg-composer" data-state="idle">
  <div class="tg-container tg-container--reading tg-composer__inner tg-col">
    <form class="tg-composer__form">
      <ul class="tg-composer__attachments" aria-label="Вложения"></ul>
      <div class="tg-composer__input">
        <textarea class="tg-textarea tg-composer__textarea" rows="1" name="prompt"
                  aria-label="Сообщение ассистенту" enterkeyhint="send"></textarea>
      </div>
      <div class="tg-composer__toolbar">
        <button class="tg-icon-btn tg-icon-btn--ghost" type="button" aria-label="Прикрепить файл">…</button>
        <button class="tg-icon-btn tg-icon-btn--primary tg-ms-auto" type="submit" aria-label="Отправить">…</button>
      </div>
    </form>
    <p class="tg-composer__caption tg-text-sm tg-text-muted">Ассистент может ошибаться. Проверяйте важное.</p>
  </div>
</footer>
```

**API** (предлагаемое): `__toolbar` — строка действий под полем внутри общей рамки;
`__attachments` — чипы файлов с удалением (forms F10-подобные); `data-state="streaming"`
меняет иконку отправки на «стоп» (`aria-label="Остановить ответ"`), `submitting` —
`aria-busy` на кнопке; `disabled` — при отсутствии доступа.

**Варианты из референсов**: компактный ввод (3), «светящееся» поле (11 — свечение P2),
ввод с подсказкой «Replying… press stop to cancel» (13 — состояние streaming с подписью).

**Состояния**: idle, typing, submitting, streaming (кнопка «стоп»), error (сообщение под
полем, текст сохранён), disabled, limit reached (счётчик, `tg-help--error`).

**Поведение и ответственность приложения**: отправка, остановка, автовысота (CSS
`field-sizing` или ResizeObserver), вставка файлов, сохранение черновика, клавиши из
«Общих решений».

**Адаптивность**: прилипает к низу с `--tg-keyboard-inset`; подпись скрывается на
мобильном (уже реализовано); панель действий не переносится — лишнее уходит в меню «+».

**Доступность**: имя поля; смена «Отправить/Остановить» объявляется через имя кнопки;
ошибка связана с полем `aria-describedby`.

**Токены и связь с TDS**: `--composer-input-max-size`, `--field-bg`, `--radius-control`.

**Критерии готовности**: состояние streaming без сдвига раскладки; работает в Telegram с виртуальной клавиатурой.

**Референсы** (3):

- `preetsuthar17--ai-chat-input--f5fadcda.webp` — AI Chat Input
- `minhxthanh--glowing-input--a07bc846.webp` — Glowing Input
- `tinkerers-labs--prompt-input--45a704e9.webp` — Prompt Input

### A2. Подсказки и быстрые действия

Статус: `composition` · Приоритет: `P1` · Состав: `.tg-chip` / `.tg-btn--secondary --sm` + A1

**Назначение**: готовые запросы в пустом чате и действия над текстом в поле
(«Исправить», «Сократить», «Дружелюбнее»).

**Состав**: ряд кнопок над/под полем; применённое действие — бейдж-отметка.

```html
<div role="group" aria-label="Действия с текстом" class="tg-row tg-gap-2">
  <button class="tg-btn tg-btn--secondary tg-btn--sm" type="button">Сократить</button>
  <button class="tg-btn tg-btn--secondary tg-btn--sm" type="button">Дружелюбнее</button>
</div>
<span class="tg-badge tg-badge--primary" role="status">Исправлено</span>
```

**API**: новых классов нет. Это действия, поэтому кнопки (с рамкой), а применённое
состояние — статусный бейдж (без рамки).

**Варианты из референсов**: подсказки «Summarize / Condense» и отметка «Proofread» (4),
поле с вариантами переписывания (9 — «аура» P2).

**Состояния**: default, busy (кнопка `aria-busy`), applied (бейдж).

**Поведение и ответственность приложения**: запуск действия, замена текста с
возможностью отмены.

**Адаптивность**: горизонтальная прокрутка ряда на мобильном или перенос.

**Доступность**: результат в status; отмена доступна (Cmd/Ctrl+Z или кнопка).

**Токены и связь с TDS**: как у составляющих.

**Критерии готовности**: без новых классов.

**Референсы** (2):

- `kokonutd--ai-input-with-suggestions--89301933.webp` — AI Input with Suggestions
- `ham7a311--aura-field--dbb901cd.webp` — Aura Field

### A3. Выбор режима и модели

Статус: `composition` · Приоритет: `P1` · Компонент — forms F8 (`.tg-listbox`) в `__toolbar` композера

**Назначение**: выбор режима работы («Агент», «Чат») или модели прямо в композере.

**Состав**: компактный триггер с текущим режимом; список с описаниями.

```html
<button class="tg-listbox-trigger tg-btn--sm" type="button" aria-haspopup="listbox"
        aria-expanded="false" aria-label="Режим: Агент">Агент</button>
```

**API**: из F8; в композере триггер — `--ghost`-вид размера `--sm`.

**Варианты из референсов**: переключатель режима «Agent» (12).

**Состояния**: как F8.

**Поведение и ответственность приложения**: доступные режимы, сохранение выбора.

**Адаптивность**: на мобильном — sheet.

**Доступность**: имя триггера включает текущее значение.

**Токены и связь с TDS**: как F8.

**Критерии готовности**: см. forms F8.

**Референсы** (1):

- `serafimcloud--mode-selector--c5eef5f3.webp` — Mode Selector

### A4. Окно чата и сообщения

Статус: `new` · Приоритет: `P0` · Предлагаемые классы: `.tg-chat`, `.tg-chat__log`, `.tg-message`, `.tg-message--user`, `.tg-message--assistant`, `.tg-message__body`, `.tg-message__meta`, `.tg-message__actions`, `.tg-chat__empty`

**Назначение**: лента диалога пользователя и ассистента — полноэкранно, в боковой
панели или во всплывающем окне по кнопке.

**Состав**: шапка (название, «Новый чат»); пустое состояние с приветствием и
подсказками (A2); лента сообщений; композер (A1).

```html
<section class="tg-chat" aria-labelledby="chat-title">
  <header class="tg-row tg-justify-between">
    <h2 class="tg-header__title" id="chat-title">Новый чат</h2>
    <button class="tg-icon-btn tg-icon-btn--ghost" type="button" aria-label="Начать новый чат">…</button>
  </header>
  <div class="tg-chat__log" role="log" aria-live="polite" aria-relevant="additions">
    <article class="tg-message tg-message--user" aria-label="Вы">
      <div class="tg-message__body"><p>Сколько стоит доставка?</p></div>
    </article>
    <article class="tg-message tg-message--assistant" data-state="done" aria-label="Ассистент">
      <div class="tg-message__body"><p>Доставка бесплатна от 3 000 ₽.</p></div>
      <div class="tg-message__actions">
        <button class="tg-icon-btn tg-icon-btn--ghost" type="button" aria-label="Скопировать ответ">…</button>
      </div>
    </article>
  </div>
  <p class="tg-sr-only" role="status"></p>
  <!-- A1 -->
</section>
```

**API** (предлагаемое): сообщение пользователя — пузырь `--background-muted`,
`--radius-lg`, выравнивание к inline-end, ширина до 80%; ассистента — без пузыря,
текст на фоне (читаемые длинные ответы), типографика Markdown (`p`, `ul`, `code`,
`pre` с горизонтальной прокруткой и кнопкой копирования B4, `table` → `.tg-table`);
`data-state`: `streaming` (курсор-индикатор, `aria-busy="true"`), `stopped`
(подпись «Ответ остановлен»), `error` (`.tg-notice--destructive` внутри + «Повторить»);
`__meta` — время, модель; `__actions` — копировать, оценить, повторить.

**Варианты из референсов**: кнопка «AI» открывает панель над доской (1), карточка
нового чата с приветствием (2), чат-аккордеон FAQ с пузырями вопросов и ответов (17).

**Состояния**: empty, loading history (skeleton), message streaming/done/stopped/error,
offline.

**Поведение и ответственность приложения**: стриминг (добавление текста в одно
сообщение), прилипание к низу (см. «Общие решения»), история, рендер Markdown
(санитизация HTML!), объявления начала и конца ответа.

**Адаптивность**: полноэкранно на мобильном; боковая панель 24–28rem на десктопе
(`.tg-modal--side` из misc M13 для всплывающего варианта).

**Доступность**: `role="log"`; каждое сообщение — `article` с автором; стриминговый
текст не объявляется по частям (`aria-busy` до завершения); код с `translate="no"`.

**Токены и связь с TDS**: `--background-muted`, `--radius-lg`, `--layout-reading-width`, `.tg-thread`/`.tg-comment` для комментариев (не для чата).

**Критерии готовности**: экранный диктор слышит «Ассистент отвечает» и полный ответ один
раз; длинный код не ломает ширину.

**Референсы** (3):

- `victordiazjauregui--aichat-button--4184c7af.webp` — AI Chat Button
- `arihantcodes-1f7b8c4d--ai-chat-card--69f315f1.webp` — AI Chat Card
- `anshuman008--faq-chat-accordion--916328bc.webp` — FAQ Chat Accordion

### A5. Ход работы агента и результаты инструментов

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-agent-step`, `__icon`, `__label`, `__time`, `__detail`

**Назначение**: показать, что агент делает сейчас («Ищет», «Думает 3 м 2,6 с») и что
вернули инструменты (найденные результаты).

**Состав**: строка статуса с иконкой/спиннером, названием шага и временем; раскрываемые
детали (`details`) с результатами инструмента.

```html
<details class="tg-disclosure tg-agent-step" data-state="running">
  <summary class="tg-disclosure__trigger">
    <span class="tg-spinner" aria-hidden="true"></span>
    <span class="tg-agent-step__label">Ищу рейсы SFO → Токио</span>
    <span class="tg-agent-step__time tg-num tg-text-muted">3 м 2,6 с</span>
  </summary>
  <ol class="tg-agent-step__detail tg-list">
    <li class="tg-list-item"><span class="tg-truncate">United UA837 · 1 105 $</span>
      <a class="tg-link tg-ms-auto" href="https://example.com">google.com/flights</a></li>
  </ol>
</details>
```

**API** (предлагаемое): `data-state="running|done|error"` — спиннер, галочка, иконка
ошибки; текст статуса `--text-secondary` моноширинным только для технических
названий; детали — список/таблица.

**Варианты из референсов**: статус «Churning 3m 2.6s» (6), результаты поиска
инструмента (14).

**Состояния**: running, done, error, cancelled; collapsed/expanded.

**Поведение и ответственность приложения**: события агента, таймер, данные инструмента,
ссылки источников.

**Адаптивность**: длинные названия обрезаются с полным текстом в деталях.

**Доступность**: смена шага объявляется в status не чаще раза в несколько секунд;
таймер не объявляется; ссылки источников с понятными именами.

**Токены и связь с TDS**: `--spinner-color`, `--text-secondary`.

**Критерии готовности**: состояние понятно без анимации (текст + иконка).

**Референсы** (2):

- `starc007--agent-progress--adee98b8.webp` — Agent Progress
- `serafimcloud--search-tool--eff65896.webp` — Search Tool

### A6. Подтверждение действия агента

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-approval`, `__title`, `__description`, `__options`, `__actions`

**Назначение**: агент запрашивает разрешение или выбор перед действием с последствиями
(опубликовать, отправить, удалить; «сколько вариантов запустить?»).

**Состав**: иконка; вопрос; описание последствий; варианты (radio) или свободный ответ;
«Разрешить / Отклонить».

```html
<section class="tg-card tg-approval" role="group" aria-labelledby="ap-title" aria-describedby="ap-desc">
  <h3 class="tg-approval__title" id="ap-title">Опубликовать релиз?</h3>
  <p class="tg-approval__description" id="ap-desc">Агент опубликует 14 компонентов в публичный реестр.</p>
  <div class="tg-approval__actions">
    <button class="tg-btn tg-btn--primary tg-btn--sm" type="button">Разрешить</button>
    <button class="tg-btn tg-btn--ghost tg-btn--sm" type="button">Отклонить</button>
  </div>
</section>
```

**API** (предлагаемое): поверхность `.tg-card` внутри ленты; варианты — radio-группа
(forms F13) или F14; после решения карточка становится статичной записью
(«Разрешено в 14:02»), кнопки удаляются, фокус переходит в композер.

**Варианты из референсов**: «Publish this release? Approve / Deny» (7), вопрос с
вариантами и свободным ответом, пагинация вопросов (8).

**Состояния**: pending, approved, denied, expired, submitting.

**Поведение и ответственность приложения**: **решение о разрешении принимает
приложение** (права, политика, повторное подтверждение для опасных действий); TDS
только оформляет вопрос. Опасное действие — destructive-кнопка и описание последствий.

**Адаптивность**: действия на всю ширину на мобильном.

**Доступность**: появление карточки объявляется (status: «Нужно ваше подтверждение»);
фокус не переносится насильно, но карточка достижима сразу после последнего сообщения.

**Токены и связь с TDS**: `--radius-lg`, `--danger-strong` для опасных действий.

**Критерии готовности**: после решения не остаётся активных кнопок; итог записан текстом.

**Референсы** (2):

- `syeddhasnainn--approval-card--5f8c3ad0.webp` — Approval Card
- `theshanelevine--approval-card--23cd8dbb.webp` — Approval Card

### A7. Ветвление ответа

Статус: `composition` · Приоритет: `P2` · Состав: `.tg-tabs` / `.tg-pager` (navigation N12) + A4

**Назначение**: несколько вариантов ответа или путей рассуждения с переключением.

**Состав**: подпись «Вариант 2 из 3»; кнопки «предыдущий/следующий»; необязательная схема
ветвей.

```html
<nav class="tg-row tg-gap-2" aria-label="Варианты ответа">
  <button class="tg-icon-btn tg-icon-btn--ghost" type="button" aria-label="Предыдущий вариант">‹</button>
  <span class="tg-num tg-text-sm" aria-live="polite">2 / 3</span>
  <button class="tg-icon-btn tg-icon-btn--ghost" type="button" aria-label="Следующий вариант">›</button>
</nav>
```

**API**: новых классов нет; схема ветвей (10) — декоративная иллюстрация.

**Варианты из референсов**: «Несколько путей, один ответ» со схемой (10).

**Состояния**: current branch; first/last.

**Поведение и ответственность приложения**: хранение ветвей, генерация вариантов.

**Адаптивность**: компактный вид на мобильном.

**Доступность**: смена варианта объявляется; схема `aria-hidden`.

**Токены и связь с TDS**: как у составляющих.

**Критерии готовности**: без новых классов.

**Референсы** (1):

- `dhxwhy--branching-reasoning-chat-input--29482f70.webp` — Branching Reasoning AI Chat Input

### A8. Спросить ИИ о выделенном

Статус: `composition` · Приоритет: `P2` · Компонент — text T2 (`.tg-selection-toolbar`)

**Назначение**: действие «Спросить ИИ» над выделенным текстом.

**Состав**: плавающая панель форматирования с кнопкой «Спросить ИИ».

```html
<div class="tg-toolbar tg-toolbar--compact tg-toolbar--floating tg-selection-toolbar" role="toolbar" aria-label="Выделенный текст">
  <button class="tg-btn tg-btn--primary tg-btn--sm" type="button">Спросить ИИ</button>
</div>
```

**API**: из text T2.

**Варианты из референсов**: выделение с «Ask AI» (15).

**Состояния**: как T2.

**Поведение и ответственность приложения**: передача выделенного фрагмента в запрос.

**Адаптивность**: как T2.

**Доступность**: как T2.

**Токены и связь с TDS**: как T2.

**Критерии готовности**: см. text T2.

**Референсы** (1):

- `21st--select-and-ask--4fbd7c58.webp` — Select Text and Ask AI

### A9. Генерация медиа

Статус: `composition` · Приоритет: `P2` · Состав: `.tg-card` + forms F19 (референсы-изображения) + A1 + `.tg-segmented` (тип: изображение/видео)

**Назначение**: запрос на генерацию изображения или видео с референсами.

**Состав**: превью загруженных референсов; поле описания; выбор типа результата;
отправка; результат с прогрессом.

```html
<form class="tg-card tg-col tg-gap-3" aria-labelledby="gen-title">
  <h2 class="tg-header__title tg-sr-only" id="gen-title">Генерация видео</h2>
  <ul class="tg-row tg-gap-2" aria-label="Референсы"><li><img src="/ref1.jpg" alt="Референс 1" width="56"></li></ul>
  <textarea class="tg-textarea" aria-label="Описание ролика"></textarea>
  <fieldset class="tg-segmented"><legend class="tg-sr-only">Результат</legend>
    <label class="tg-segmented__item"><input type="radio" name="out" value="image"> Изображение</label>
    <label class="tg-segmented__item"><input type="radio" name="out" value="video" checked> Видео</label></fieldset>
  <button class="tg-btn tg-btn--primary" type="submit">Создать</button>
</form>
```

**API**: новых классов нет.

**Варианты из референсов**: карточка генерации видео (16).

**Состояния**: idle, generating (прогресс misc M7/M8), done (медиа), error.

**Поведение и ответственность приложения**: генерация, очередь, хранение результатов.

**Адаптивность**: на всю ширину.

**Доступность**: прогресс с текстом; результат с `alt`/описанием.

**Токены и связь с TDS**: как у составляющих.

**Критерии готовности**: без новых классов.

**Референсы** (1):

- `ravikatiyar162--video-generator-card--4e96590e.webp` — Video Generator Card

### A10. Аватар ассистента

Статус: `composition` · Приоритет: `P2` · Состав: `.tg-avatar` + опциональный эффект из `shaders/components.md` (SH3)

**Назначение**: визуальный образ ассистента в чате.

**Состав**: аватар-изображение или инициалы; необязательная анимация «думает».

```html
<span class="tg-avatar" aria-hidden="true"><img class="tg-avatar__clip" src="/assistant.svg" alt=""></span>
```

**API**: существующий `.tg-avatar`; «живой» шар (5) — эффект SH3.

**Варианты из референсов**: светящийся шар с глазами (5).

**Состояния**: idle, thinking (анимация — дополнение к тексту статуса).

**Поведение и ответственность приложения**: состояние.

**Адаптивность**: размеры `.tg-avatar-size`.

**Доступность**: аватар декоративен — автор сообщения указан текстом.

**Токены и связь с TDS**: `.tg-avatar`.

**Критерии готовности**: reduced motion — статичный аватар.

**Референсы** (1):

- `odysseyui--components-primitives-avatar--e1f83afe.webp` — AI Orb Avatar

## Порядок реализации

1. **P0:** A4 `.tg-chat`/`.tg-message` с состояниями; A1 `__toolbar`, `__attachments`,
   `data-state` (поверх существующего `.tg-composer`).
2. **P1:** A5 шаги агента, A6 подтверждение; композиции A2, A3 (после forms F8).
3. **P2:** A7, A8 (после text T2), A9, A10 (после shaders SH3).

## Контрольный список покрытия

| Группа | Референсов |
| --- | ---: |
| A1. Композер запроса | 3 |
| A2. Подсказки и быстрые действия | 2 |
| A3. Выбор режима и модели | 1 |
| A4. Окно чата и сообщения | 3 |
| A5. Ход работы агента и результаты инструментов | 2 |
| A6. Подтверждение действия агента | 2 |
| A7. Ветвление ответа | 1 |
| A8. Спросить ИИ о выделенном | 1 |
| A9. Генерация медиа | 1 |
| A10. Аватар ассистента | 1 |
| **Итого** | **17 из 17** |

Каждый из 17 файлов папки указан ровно в одной основной группе. Перекрёстные ссылки на другие категории даны текстом, без повторного учёта.
