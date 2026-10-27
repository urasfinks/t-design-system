# Формы и ввод — спецификации компонентов

## Назначение категории

Папка `forms` (223 превью) — самая большая в архиве. В ней поля, выбор, переключатели,
диапазоны, загрузка файлов, календари, выбор цвета, коды подтверждения и целые
формы. Базовые нативные контролы в TDS уже есть (`.tg-field`, `.tg-input`, `.tg-select`,
`.tg-textarea`, `.tg-check`, `.tg-radio`, `.tg-switch`, `.tg-range`, `.tg-upload`,
`.tg-search`, `.tg-fieldset`, `.tg-error-summary`). Новыми становятся только виджеты
с собственным клавиатурным контрактом: listbox/combobox, ввод тегов, OTP, число со
степпером, календарь, выбор цвета и пошаговая форма.

## Сводная таблица

| Компонент / паттерн | Тип работы | Референсов | Приоритет |
| --- | --- | ---: | --- |
| F1. Текстовое поле и многострочный ввод | `existing` | 13 | `P0` |
| F2. Поле с дополнениями (input group) | `new` | 12 | `P0` |
| F3. Пароль и проверка требований | `extend` | 4 | `P0` |
| F4. Числовое поле со степпером | `new` | 2 | `P1` |
| F5. Код подтверждения (OTP) | `new` | 9 | `P1` |
| F6. Поле поиска | `existing` | 2 | `P0` |
| F7. Нативный список выбора | `existing` | 11 | `P0` |
| F8. Пользовательский список выбора (listbox) | `new` | 10 | `P1` |
| F9. Combobox и мультивыбор с поиском | `new` | 4 | `P1` |
| F10. Ввод тегов | `new` | 4 | `P1` |
| F11. Флажок | `existing` | 12 | `P0` |
| F12. Группа флажков и «выбрать все» | `extend` | 7 | `P0` |
| F13. Радиогруппа | `existing` | 9 | `P0` |
| F14. Карточки выбора | `new` | 6 | `P1` |
| F15. Сегменты в формах | `composition` | 4 | `P1` |
| F16. Чипы выбора | `existing` | 2 | `P1` |
| F17. Переключатель | `existing` | 14 | `P0` |
| F18. Ползунок и диапазон | `extend` | 10 | `P1` |
| F19. Загрузка файлов и dropzone | `extend` | 9 | `P0` |
| F20. Поле даты и времени | `new` | 3 | `P1` |
| F21. Календарь | `new` | 15 | `P1` |
| F22. Диапазон дат и пресеты | `extend` | 7 | `P1` |
| F23. Выбор времени и запись | `composition` | 7 | `P2` |
| F24. Колесо выбора | `new` | 3 | `P2` |
| F25. Выбор цвета | `new` | 7 | `P2` |
| F26. Выбор эмодзи | `new` | 2 | `P2` |
| F27. Формы и группы полей | `composition` | 10 | `P0` |
| F28. Пошаговая форма | `new` | 3 | `P1` |
| F29. Регистрация и вход | `composition` | 7 | `P1` |
| F30. AI-поле ввода | `composition` | 5 | `P1` |
| F31. Матрица настроек | `composition` | 1 | `P1` |
| F32. Декоративные поля | `extend` | 2 | `P2` |
| F33. Холст и аудио | `new` | 3 | `P2` |
| F34. Календарные данные и афиша | `composition` | 3 | `P2` |
| F35. Список переходов | `composition` | 1 | `P1` |

## Общие решения категории

- **Поле — это label + контрол + помощь.** Каждый ввод находится в `.tg-field` с видимым
  `.tg-label`; placeholder не заменяет label. Помощь и ошибка — `.tg-help` / `.tg-help--error`,
  связаны через `aria-describedby`.
- **Геометрия.** Высота `--control-h`, радиус `--radius-control` (12 px), вложенные
  элементы — `--radius-inset` (8 px). Шрифт ввода не меньше 16 px (iOS не масштабирует).
- **Цвет.** Фон `--field-bg`/`--field-bg-hover`, тихая граница `--field-border-color`;
  фокус — `--accent-main` + внешнее кольцо 4 px `--accent-soft`; ошибка — `--danger-main`
  + `--danger-soft`. Пустые checkbox/radio — `--choice-border-color` (≥ 3:1).
- **Нативный HTML прежде custom.** `input type="date|time|color|range|file|number"`,
  `select`, `datalist` используются, пока их возможностей достаточно. Пользовательский
  виджет появляется только с полным клавиатурным контрактом.
- **Валидация** — обязанность приложения. TDS оформляет `aria-invalid`,
  `.tg-help--error` и `.tg-error-summary`, не проверяет значения.
- **Отключение.** `disabled` + `--disabled-opacity`; `readonly` визуально отличается от
  disabled (фон `--background-muted`, текст основной).
- **Длинный контент и RTL.** Подписи переносятся; суффиксы и иконки — логические стороны;
  числа — `.tg-num`.
- **Telegram.** В Mini App нативные пикеры даты/времени предпочтительнее собственных:
  они согласованы с клавиатурой и системной темой.

## Спецификации компонентов

### F1. Текстовое поле и многострочный ввод

Статус: `existing` · Приоритет: `P0` · Классы: `.tg-field`, `.tg-label`, `.tg-input`, `.tg-textarea`, `.tg-help`, `.tg-help--error`

**Назначение**: однострочный и многострочный текстовый ввод. Для поиска — F6, для
значения с единицей или префиксом — F2.

**Состав**: label (обязательно, с отметкой обязательности); контрол; помощь или ошибка;
необязательный счётчик символов.

```html
<div class="tg-field">
  <label class="tg-label" for="app-name">Название приложения</label>
  <input class="tg-input" id="app-name" name="app" aria-invalid="true"
         aria-describedby="app-name-error" value="admin">
  <p class="tg-help tg-help--error" id="app-name-error">Имя зарезервировано. Выберите другое.</p>
</div>

<div class="tg-field">
  <label class="tg-label" for="bio">О себе</label>
  <textarea class="tg-textarea" id="bio" name="bio" rows="3" maxlength="280"
            aria-describedby="bio-count"></textarea>
  <p class="tg-help" id="bio-count">0 / 280</p>
</div>
```

**API**: существующий. Предлагаемое дополнение — `.tg-label__required` для звёздочки
с `aria-hidden` (обязательность передаётся атрибутом `required`).

**Варианты из референсов**: поля профиля (32), ошибка «имя зарезервировано» и
readonly-идентификатор (33), поле с подсказкой (41, 112), размеры small/default/large
(50) — у TDS единая высота, размер меняет только ширину; тёмное поле (48), поле с
иконкой поиска (49) — F6; анимированная подпись/плавающий label (83, 125, 156) —
не переносится: плавающий label ухудшает читаемость, оставляем постоянный label над полем;
textarea с кнопкой (43).

**Состояния**: default, hover, focus-visible, filled, readonly, disabled, invalid, invalid+focus.

**Поведение и ответственность приложения**: валидация, тексты ошибок, autosize
textarea (CSS `field-sizing: content` как улучшение), счётчик символов.

**Адаптивность**: на всю ширину контейнера формы; ширина по смыслу (индекс, CVC)
задаётся локально `max-inline-size`, не новой высотой.

**Доступность**: `label for`; `autocomplete`; `inputmode`; ошибка через
`aria-describedby` и `aria-invalid`; при отправке — фокус на `tg-error-summary`.

**Токены и связь с TDS**: `--field-bg`, `--field-border-color`, `--focus`, `--danger-main`, `--danger-soft`.

**Критерии готовности**: все варианты собираются существующими классами; ошибка видна без цвета (иконка или текст).

**Референсы** (13):

- `intentui--field--cfbdf83d.webp` — Field
- `russellbloxwich--field--297c15fe.webp` — Field
- `kevingirelli--form--3423b258.webp` — Form Field
- `paceui--form-textarea--5edc780a.webp` — Form Textarea
- `muntasirszn--input--f4166adb.webp` — Input
- `preetsuthar17--input--aba8f2cb.webp` — Input
- `shugar--input--7fe9d931.webp` — Input
- `redrob-labs--name-input--2e53f648.webp` — Name Input
- `reshaped--reshaped-text-field--f03086cf.webp` — Reshaped Text field
- `oui--oui-text-field--0aeb0394.webp` — Text Field
- `felipemenezes098--the-input--1eedd092.webp` — The Input
- `minhxthanh--animated-input--5fa607ae.webp` — Animated Input
- `tom-ui--exploding-input--17bf1c89.webp` — Exploding Input

### F2. Поле с дополнениями (input group)

Статус: `new` · Приоритет: `P0` · Предлагаемые классы: `.tg-input-group`,
`.tg-input-group__addon`, `.tg-input-group__control`, `.tg-input-group__action`

**Назначение**: значение с префиксом/суффиксом (`https://`, `px`, `₽`), с выбором
единицы или кода страны, с иконкой-подсказкой или кнопкой внутри поля.

**Состав**: внешняя рамка поля; аддоны (текст, иконка, `select`, бейдж); собственно
`input`; встроенное действие (`tg-icon-btn`).

```html
<div class="tg-field">
  <label class="tg-label" for="phone">Телефон</label>
  <div class="tg-input-group">
    <select class="tg-input-group__addon" aria-label="Код страны">
      <option>+7</option><option>+49</option>
    </select>
    <input class="tg-input-group__control" id="phone" type="tel"
           autocomplete="tel-national" inputmode="tel">
  </div>
</div>

<div class="tg-field">
  <label class="tg-label" for="width">Ширина</label>
  <div class="tg-input-group">
    <input class="tg-input-group__control tg-num" id="width" inputmode="decimal" value="280">
    <span class="tg-input-group__addon" aria-hidden="true">px</span>
  </div>
</div>
```

**API** (предлагаемое): рамка, фон и фокус переходят с `input` на контейнер через
`:has(:focus-visible)` и `:has([aria-invalid="true"])`; аддоны — без собственной рамки,
`--text-secondary`; разделитель между `select` и вводом — `--border-subtle-color`.

**Варианты из референсов**: подсказки-иконки у полей (42, 161), бейдж «Beta» у
label (51), стеклянная группа (52 — материал `.tg-glass` опционально), роль участника
в строке (59), микрофон и индикатор записи (60), inline-label в select (90),
число + валюта (163), «Press Start» (189), таблица свойств с единицами (217),
телефон с кодом страны (72, 191).

**Состояния**: default, hover, focus-within (кольцо на контейнере), invalid, disabled
(весь контейнер), readonly.

**Поведение и ответственность приложения**: маски и форматирование номера, смена
единицы, перерасчёт значений.

**Адаптивность**: аддоны не сжимаются; контрол — `flex: 1`, `min-inline-size: 0`;
на 320 px длинный аддон переносится над полем.

**Доступность**: аддон-текст дублируется в доступном имени (`aria-describedby`) если он
важен для смысла (валюта); `select` в аддоне имеет своё имя; иконка-подсказка —
кнопка с B15-подсказкой или `tg-help` под полем.

**Токены и связь с TDS**: те же, что у `.tg-input`; новых ролей нет.

**Критерии готовности**: фокус-кольцо одно на группе; RTL меняет стороны аддонов;
работает с 200% текста.

**Референсы** (12):

- `cnippet-dev--v-tooltip-13--6c1f0d7a.webp` — Form Fields with Tooltip Hints
- `uiable--input-badge--e8c2f972.webp` — Input Badge
- `ai2--input-group-glass--2604544a.webp` — Input Group Glass
- `sean0205--c-input-group-32--569128c6.webp` — Member Role Input Group
- `sean0205--c-input-group-6--621efefb.webp` — Microphone Input Group
- `mohammadshehadeh--phone-input--0406bd6c.webp` — Phone Input
- `felipemenezes098--select-14--6e510982.webp` — Select With Inline Label
- `sean0205--c-input-group-14--67d05fe1.webp` — Input Group with Tooltip
- `ruixen-ui--input-with-select--3a9ce6d2.webp` — Input With Select
- `sean0205--reui-input-group--983da3b5.webp` — ReUI Input Group
- `larsen66--reui-phone-input--f3bf6e60.webp` — ReUI Phone Input
- `arikchakma--unit-field--bf673cc9.webp` — Unit Field

### F3. Пароль и проверка требований

Статус: `extend` · Приоритет: `P0` · Классы: `.tg-input-group` (F2) + предлагаемые
`.tg-requirements`, `.tg-requirements__item`, `[data-met="true"]`

**Назначение**: ввод пароля с показом/скрытием и подсказкой требований; проверка
адреса почты по ходу ввода.

**Состав**: поле `type="password"`; кнопка «Показать»; список требований; необязательная
индикация надёжности (`.tg-progress`).

```html
<div class="tg-field">
  <label class="tg-label" for="pw">Пароль</label>
  <div class="tg-input-group">
    <input class="tg-input-group__control" id="pw" type="password"
           autocomplete="new-password" aria-describedby="pw-rules">
    <button class="tg-icon-btn tg-icon-btn--ghost tg-input-group__action" type="button"
            aria-pressed="false" aria-label="Показать пароль">…</button>
  </div>
  <ul class="tg-requirements" id="pw-rules">
    <li class="tg-requirements__item" data-met="true">Не меньше 8 символов</li>
    <li class="tg-requirements__item" data-met="false">Одна цифра</li>
  </ul>
</div>
```

**API** (предлагаемое): `__item` с иконкой-кружком/галочкой; `data-met="true"` —
иконка и текст `--accent-readable`, `false` — `--text-secondary`. Красный цвет только
после попытки отправки.

**Варианты из референсов**: показ/скрытие (70), список требований (182),
«каждое правило загорается по мере ввода» (118), проверка домена почты (168) —
`tg-help` с предложением исправления.

**Состояния**: hidden/visible пароль; требование выполнено/не выполнено; invalid после отправки.

**Поведение и ответственность приложения**: проверка правил, переключение `type`,
обновление `aria-pressed`, подсказка исправления почты.

**Адаптивность**: список требований в одну колонку; на ширине ≥ 36rem — две.

**Доступность**: обновления требований не объявляются на каждое нажатие; итог при
отправке — в `tg-error-summary`; кнопка показа — `aria-pressed`.

**Токены и связь с TDS**: `--accent-readable`, `--text-secondary`, `--danger-readable`.

**Критерии готовности**: менеджеры паролей распознают поле (`autocomplete`); выполненное правило отличимо не только цветом.

**Референсы** (4):

- `anubra266--password-input--a39abaa7.webp` — Password Input
- `dhxwhy--validation-checklist-input--cdd7bdca.webp` — Validation Checklist Input
- `ruixen-ui--mail-checker-input--1fd82836.webp` — Mail Checker Input
- `uilayout-contact--password-input-1--16821589.webp` — Password Input

### F4. Числовое поле со степпером

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-number`, `.tg-number__step`, `.tg-number__input`

**Назначение**: небольшие целые количества (гости, штуки, сумма шага). Для широкого
диапазона — F18, для точного значения без шага — F1 с `inputmode="decimal"`.

**Состав**: кнопка «−»; поле; кнопка «+».

```html
<div class="tg-field">
  <label class="tg-label" for="qty">Количество</label>
  <div class="tg-number">
    <button class="tg-icon-btn tg-number__step" type="button" aria-label="Уменьшить" aria-controls="qty">−</button>
    <input class="tg-number__input tg-num" id="qty" type="number" inputmode="numeric" min="0" max="20" value="5">
    <button class="tg-icon-btn tg-number__step" type="button" aria-label="Увеличить" aria-controls="qty">+</button>
  </div>
</div>
```

**API** (предлагаемое): контейнер наследует геометрию `.tg-input-group`; кнопки
`--ghost` внутри; `--pill` для капсульного варианта (183) допустим как явный модификатор.

**Варианты из референсов**: капсула «− 0 +» (183), поле суммы со степпером (190).

**Состояния**: default, focus-within, min/max (кнопка disabled), invalid, disabled.

**Поведение и ответственность приложения**: `stepUp()`/`stepDown()`, ограничения,
событие `input`; нативные стрелки ↑/↓ уже работают в `type=number`.

**Адаптивность**: поле минимум на 3 символа; кнопки 44 px.

**Доступность**: кнопки с именами; у крайнего значения кнопка `disabled`, текущее
значение объявляется нативно.

**Токены и связь с TDS**: `--control-h`, `--radius-control`.

**Критерии готовности**: ввод с клавиатуры и стрелками; нативный спиннер браузера скрыт, но поведение сохранено.

**Референсы** (2):

- `coss-com--p-number-field-11--d1bb7398.webp` — Pill Number Field
- `sean0205--reui-number-field--1b0ca5f7.webp` — ReUI Number Field

### F5. Код подтверждения (OTP)

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-otp`, `.tg-otp__input`, `.tg-otp__slot`, `.tg-otp__separator`

**Назначение**: ввод одноразового кода из SMS/почты или PIN.

**Состав**: одно скрытое за ячейками поле или набор ячеек; разделитель групп; помощь
(«Код отправлен на …»), ссылка повторной отправки с таймером.

```html
<div class="tg-field">
  <label class="tg-label" for="otp">Код из SMS</label>
  <div class="tg-otp" style="--otp-length: 6">
    <input class="tg-otp__input" id="otp" inputmode="numeric" autocomplete="one-time-code"
           pattern="[0-9]{6}" maxlength="6" aria-describedby="otp-help">
    <span class="tg-otp__slot" aria-hidden="true"></span>
    <!-- … 6 визуальных ячеек … -->
  </div>
  <p class="tg-help" id="otp-help">Отправили на +7 ••• ••• 12 34. Повторить через 0:30</p>
</div>
```

**API** (предлагаемое): **одно** настоящее поле (поддержка вставки и `one-time-code`),
визуальные ячейки — декоративные `__slot` с подсветкой активной через `data-active`;
`__separator` между группами 3+3.

**Варианты из референсов**: 4–6 ячеек (54, 68, 162, 179, 181), разделитель (178),
подсказки-плейсхолдеры (177), «Code accepted» в акцентных ячейках (179), OTP в
диалоге (176), шаговый сценарий с инструкциями (180).

**Состояния**: empty, typing (активная ячейка), complete, verifying (`aria-busy`), error, success, disabled.

**Поведение и ответственность приложения**: проверка кода, таймер повтора, автопроверка
при заполнении, очистка при ошибке.

**Адаптивность**: ячейки ≥ 44 px, при 8 цифрах на 320 px — уменьшение промежутка, не
высоты.

**Доступность**: одно поле — одна остановка Tab и одно имя; результат в `role="status"`;
таймер не объявляется каждую секунду.

**Токены и связь с TDS**: `--field-bg`, `--radius-control`, `--accent-main`, `--danger-main`.

**Критерии готовности**: работает автозаполнение iOS/Android и вставка всего кода.

**Референсы** (9):

- `clevision--input-otps--99dc3686.webp` — Input OTPs
- `ai2--inputs-otp--1e54365e.webp` — OTP Pin Input
- `jshguo--interfaces-input-otp--f091a29a.webp` — Input OTP
- `ruixen-ui--otpdialog--5addeb53.webp` — OTP Dialog
- `coss-com--p-otp-field-9--3a943ca8.webp` — OTP Field with Placeholder Hints
- `coss-com--otp-field-separator--6e99ee06.webp` — OTP Field with Separator
- `ddoemonn--otp-input--c30f383d.webp` — OTP Input
- `uvain--otp-input-verification--1cd6d4ac.webp` — OTP Input
- `sean0205--c-input-otp-5--823532be.webp` — OTP PIN Field

### F6. Поле поиска

Статус: `existing` · Приоритет: `P0` · Классы: `.tg-search`, `__icon`, `__input`, `__clear`

**Назначение**: поиск по данным страницы. Поиск с выбором категории — `tg-search` +
аддон-`select` (F2); поиск с подсказками — F9.

**Состав**: `form role="search"`; label; иконка; `input type="search"`; кнопка очистки.

```html
<form role="search" aria-label="Поиск товаров">
  <label class="tg-label" for="q">Найти товар</label>
  <div class="tg-search">
    <input class="tg-search__input" id="q" type="search" name="q">
    <button type="reset" class="tg-icon-btn tg-search__clear" aria-label="Очистить поиск">…</button>
  </div>
</form>
```

**API**: существующий.

**Варианты из референсов**: поиск с категорией (9), React Aria SearchField (195).

**Состояния**: empty, filled (видна кнопка очистки), focus, disabled.

**Поведение и ответственность приложения**: фильтрация, debounce, синхронизация reset.

**Адаптивность**: на всю ширину; категория уходит под поле на 320 px.

**Доступность**: `role="search"`, видимый или `tg-sr-only` label; количество результатов — в status.

**Токены и связь с TDS**: как у `.tg-input`.

**Критерии готовности**: без новых классов.

**Референсы** (2):

- `sean0205--category-search-input--eea4a768.webp` — Category Search Input
- `adobe--aria-css-searchfield--a2ee8004.webp` — React Aria SearchField

### F7. Нативный список выбора

Статус: `existing` · Приоритет: `P0` · Классы: `.tg-select`

**Назначение**: выбор одного значения из списка, когда не нужны поиск, иконки и
описания у пунктов. Первый выбор по умолчанию.

**Состав**: label; `select`; `option`/`optgroup`; помощь.

```html
<div class="tg-field">
  <label class="tg-label" for="freq">Частота уведомлений</label>
  <select class="tg-select" id="freq" name="freq" aria-describedby="freq-help">
    <option value="" disabled selected>Выберите частоту</option>
    <option>Каждый день</option>
    <option disabled>Каждый час (только Pro)</option>
  </select>
  <p class="tg-help" id="freq-help">Как часто присылать письма.</p>
</div>
```

**API**: существующий. Для браузеров с `appearance: base-select` (customizable select)
— прогрессивное улучшение оформления списка, без изменения разметки.

**Варианты из референсов**: базовые (65, 85, 88, 93), disabled (27), отключённые
пункты (91, 92), частота + кнопка (67, 111, 119), пиксельный select (2) — стиль не переносится.

**Состояния**: default, hover, focus-visible, disabled, invalid, placeholder (первый disabled option).

**Поведение и ответственность приложения**: данные опций, зависимые списки.

**Адаптивность**: на мобильном открывается системный список — это плюс, не недостаток.

**Доступность**: нативная.

**Токены и связь с TDS**: `--select-arrow`, `--field-bg`.

**Критерии готовности**: без новых классов.

**Референсы** (11):

- `theorcdev--8bit-select--b33f7dd6.webp` — 8-bit Select
- `felipemenezes098--select-03--2e3c5868.webp` — Disabled Select
- `wensity--native-select--f7abc9f3.webp` — Native Select
- `cnippet-dev--v-select-7--9e3e56a0.webp` — Notification Frequency Select
- `cnippet-dev--select--9b236859.webp` — Select
- `originui--select-native--faa28ec4.webp` — Select (Native)
- `felipemenezes098--select-07--dad6cc5e.webp` — Select with Disabled Items
- `cnippet-dev--v-select-11--a34d35ef.webp` — Select with Disabled Options
- `felipemenezes098--select-10--9c4862d0.webp` — Select with Label
- `felipemenezes098--dropdown-19--812fa36d.webp` — TanStack Form Dropdown
- `avanishverma4--dropdown-01--d053f07a.webp` — dropdown 01

### F8. Пользовательский список выбора (listbox)

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-listbox-trigger`, `.tg-listbox`,
`.tg-listbox__option`, `.tg-listbox__option-meta`

**Назначение**: выбор одного значения, когда у пунктов есть аватар, иконка, описание
или превью (выбор модели, приоритета, шрифта, участника). Если всего этого нет — F7.

**Состав**: триггер-кнопка с текущим значением; всплывающий список; пункты с
ведущим медиа, заголовком, описанием и галочкой выбранного.

```html
<label class="tg-label" id="model-label">Модель</label>
<button class="tg-listbox-trigger" type="button" aria-haspopup="listbox"
        aria-expanded="false" aria-labelledby="model-label model-value" aria-controls="model-list">
  <span id="model-value">Быстрая</span>
</button>
<ul class="tg-listbox" id="model-list" role="listbox" aria-labelledby="model-label" hidden>
  <li class="tg-listbox__option" role="option" aria-selected="true" id="opt-fast">
    Быстрая <span class="tg-listbox__option-meta">Ответы за секунды</span>
  </li>
  <li class="tg-listbox__option" role="option" aria-selected="false" aria-disabled="true">
    Глубокая <span class="tg-listbox__option-meta">Только Pro</span>
  </li>
</ul>
```

**API** (предлагаемое): триггер визуально совпадает с `.tg-select`; список — та же
поверхность, что `.tg-menu` из buttons (B14); пункт 44 px, выбранный — галочка в конце
и `--accent-readable`, активный (клавиатура) — фон `--background-muted`.

**Варианты из референсов**: шрифты с превью (86), фрукты (87), участники с аватарами
(31, 200 «Choose model» с иконками и описаниями), модель/режим (143, 169), стиль с живым
превью (167), анимированный и морфящийся select (5, 172 — анимация открытия
`opacity`/`transform` по общим длительностям), приоритет во всплывающем окне (185).

**Состояния**: closed, open, option active, selected, disabled, empty, loading.

**Поведение и ответственность приложения**: ↓/↑/Enter/Space открывают; ↑/↓, Home/End,
поиск по первым буквам; Enter выбирает и закрывает; Escape закрывает без изменений;
фокус остаётся на триггере (`aria-activedescendant`); значение отправляется
скрытым `input`.

**Адаптивность**: на мобильном — `.tg-modal--sheet` со списком; ширина списка ≥ ширины триггера.

**Доступность**: роли `listbox`/`option`, `aria-selected`; disabled-пункты пропускаются
стрелками или объявляются недоступными; не использовать для навигации.

**Токены и связь с TDS**: `--background-raised`, `--shadow-overlay`, `--z-overlay`, `--radius-control`.

**Критерии готовности**: полный клавиатурный контракт APG «Select-only combobox»;
отправка формы без JS деградирует до нативного `select`.

**Референсы** (10):

- `evansliaudet--animated-select-1--614522d6.webp` — Animated Select
- `rynkovski--select--e18a6d62.webp` — Extended Select
- `olivier-1b6cd5bc--select-1--1d9a79ca.webp` — Select
- `sean0205--select--6975538f.webp` — Select
- `zanwei--claude-model-selector--69a8df26.webp` — Claude Model Selector
- `ruixen-ui--live-preview-style-select--bff4547f.webp` — Live Preview Style Select
- `21st--lp-model-picker-stack--e257d274.webp` — Model menu selects working mode
- `starc007--select-morph--d37b8310.webp` — Morph Select
- `ln-dev7--priority-selector--54a2841c.webp` — Priority Selector
- `geekles007--select--cfd638eb.webp` — Select

### F9. Combobox и мультивыбор с поиском

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-combobox`, `.tg-combobox__input`, `.tg-combobox__list` (= `.tg-listbox`)

**Назначение**: выбор из длинного или подгружаемого списка с вводом текста (пользователи,
технологии, адрес, метки); одиночный или множественный.

**Состав**: поле ввода; выбранные значения-чипы (для множественного); список подсказок;
состояния загрузки и «ничего не найдено».

```html
<div class="tg-field">
  <label class="tg-label" for="user-input">Исполнитель</label>
  <div class="tg-combobox">
    <input class="tg-combobox__input tg-input" id="user-input" role="combobox"
           aria-autocomplete="list" aria-expanded="true" aria-controls="user-list"
           aria-activedescendant="user-2">
    <ul class="tg-listbox tg-combobox__list" id="user-list" role="listbox">
      <li class="tg-listbox__option" role="option" id="user-1">Иван Петров</li>
      <li class="tg-listbox__option" role="option" id="user-2" aria-selected="false">Мария Ким</li>
    </ul>
  </div>
</div>
```

**API** (предлагаемое): использует `.tg-listbox`; для множественного выбора — чипы
из F10 перед полем, `aria-multiselectable="true"` на списке.

**Варианты из референсов**: мультиселектор технологий (63), асинхронный поиск
пользователей (128), выбор меток с цветными чипами (165), адресный выбор по карте (174 —
карта как декоративное дополнение, источник истины — список).

**Состояния**: empty, typing, loading (`aria-busy` на списке), results, no results (`.tg-empty` в списке), selected, error, disabled.

**Поведение и ответственность приложения**: запросы и debounce, фильтрация, создание
нового значения, ↓ открывает список, ↑/↓ двигают `aria-activedescendant`, Enter
выбирает, Escape закрывает, Backspace в пустом поле удаляет последний чип.

**Адаптивность**: список в пределах viewport; на мобильном — полноэкранный sheet
с полем вверху.

**Доступность**: APG combobox; количество результатов в `role="status"`; выбранные чипы
— кнопки удаления с именами.

**Токены и связь с TDS**: как у F8.

**Критерии готовности**: проверен экранными дикторами VoiceOver/NVDA; без JS доступен
`input` + `datalist`.

**Референсы** (4):

- `hsuanyi-chou--multiple-selector--b0cffc7b.webp` — Multiple Selector
- `rudrodip--async-select--cad96b4f.webp` — Async Select
- `ln-dev7--label-selector--969e412d.webp` — Label Selector
- `sumipghb--nepal-address-picker--8d6ec091.webp` — Nepal Address Picker 

### F10. Ввод тегов

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-tag-input`, `.tg-tag-input__tag`, `.tg-tag-input__remove`, `.tg-tag-input__field`

**Назначение**: свободный ввод нескольких коротких значений (теги, адреса почты).

**Состав**: контейнер-поле; теги-чипы с кнопкой удаления; поле ввода; лимит и подсказка.

```html
<div class="tg-field">
  <label class="tg-label" for="tags">Теги</label>
  <div class="tg-tag-input">
    <span class="tg-tag-input__tag">react
      <button class="tg-tag-input__remove" type="button" aria-label="Удалить тег react">×</button>
    </span>
    <input class="tg-tag-input__field" id="tags" aria-describedby="tags-help">
  </div>
  <p class="tg-help" id="tags-help">До 6 тегов. Enter или запятая — добавить.</p>
</div>
```

**API** (предлагаемое): контейнер наследует оформление и фокус `.tg-input-group`;
тег — геометрия `.tg-chip` (капсула), но не `aria-pressed`; кнопка удаления 24 px с
областью нажатия 44 px за счёт отступов.

**Варианты из референсов**: теги внутри поля (55, 144), лимит «max 6» и вставка
списком (209), цветные теги (210 — цвет только из ролей accent/secondary).

**Состояния**: empty, with tags, focus-within, limit reached, invalid tag, disabled.

**Поведение и ответственность приложения**: разбор Enter/запятой/вставки, дубликаты,
лимит, Backspace удаляет последний тег, ←/→ перемещают фокус по тегам.

**Адаптивность**: теги переносятся; поле занимает остаток строки, минимум 8ch.

**Доступность**: добавление/удаление объявляется в status; у кнопок удаления имена с
текстом тега.

**Токены и связь с TDS**: `--chip-h`, `--radius-pill`, `--background-muted`.

**Критерии готовности**: значения отправляются формой (скрытые `input name="tags[]"`).

**Референсы** (4):

- `originui--input-with-inner-tags--190de24f.webp` — Input with inner tags
- `ruixen-ui--clean-tag-input--da549ece.webp` — Clean Tag Input
- `mohammadshehadeh--tag-input--ba4b5eac.webp` — Tag Input
- `uilayout-contact--tags-input-2--0ed3cc65.webp` — Tags Input

### F11. Флажок

Статус: `existing` · Приоритет: `P0` · Классы: `.tg-choice`, `.tg-check`

**Назначение**: согласие или независимое да/нет внутри формы. Для мгновенного
включения настройки — F17.

**Состав**: label-обёртка `.tg-choice`; `input type="checkbox"`; текст; необязательное описание и ошибка.

```html
<label class="tg-choice">
  <input class="tg-check" type="checkbox" name="terms" required aria-describedby="terms-error" aria-invalid="true">
  <span>Принимаю условия использования</span>
</label>
<p class="tg-help tg-help--error" id="terms-error">Нужно принять условия, чтобы продолжить.</p>
```

**API**: существующий. Предлагаемый элемент `.tg-choice__description` для второй строки.

**Варианты из референсов**: базовые и с описанием (10, 14, 15, 18, 74, 80), invalid/required
(56, 14), тёмная тема (11), анимация галочки (3 — `stroke-dashoffset` недопустим,
заменяем на `opacity`/`transform`), круглые (13), рисованные (45), цветные квадраты (12 —
цвет акцента только через `--accent-main`).

**Состояния**: unchecked, checked, indeterminate, focus-visible, disabled, invalid.

**Поведение и ответственность приложения**: валидация, `indeterminate` для «выбрать все».

**Адаптивность**: текст переносится, флажок выравнивается по первой строке.

**Доступность**: нативный; вся строка кликабельна; граница пустого флажка ≥ 3:1.

**Токены и связь с TDS**: `--choice-size`, `--choice-border-color`, `--accent-strong`.

**Критерии готовности**: без новых классов, кроме описания.

**Референсы** (12):

- `molecule-lab-rushil--animate-checkbox--8d5a779e.webp` — Animate Checkbox
- `subframeapp--checkbox-1--a9859d20.webp` — Checkbox
- `anubra266--checkbox-1--867fc00d.webp` — Checkbox
- `berlix--checkbox--fc9a07a9.webp` — Checkbox
- `f0rextasy--checkbox--bea8e871.webp` — Checkbox
- `robertlib--checkbox--0586c740.webp` — Checkbox
- `sean0205--checkbox-1--1b16eefb.webp` — Checkbox
- `jolbol1--checkbox--cfc10da3.webp` — Checkbox [react-aria-components]
- `kanchanasw--checkbox--0004ccd3.webp` — Hand-Drawn Checkbox
- `felipemenezes098--checkbox-11--55ecb362.webp` — Invalid / Required Checkbox
- `isaiahbjork--primitive-checkbox--7ae5fa9c.webp` — Primitive Checkbox
- `reshaped--reshaped-checkbox--69593357.webp` — Reshaped Checkbox

### F12. Группа флажков и «выбрать все»

Статус: `extend` · Приоритет: `P0` · Классы: `fieldset.tg-fieldset` + `.tg-choice`; предлагаемые `.tg-choice-group`, `.tg-choice-group--nested`

**Назначение**: несколько связанных независимых выборов (уведомления, данные для
экспорта, права, задачи).

**Состав**: `legend`; необязательный «выбрать все» с `indeterminate`; список флажков с
описаниями; вложенные уровни; счётчик выбранного.

```html
<fieldset class="tg-fieldset tg-choice-group">
  <legend>Данные для экспорта</legend>
  <label class="tg-choice">
    <input class="tg-check" type="checkbox" id="all" aria-controls="exp-posts exp-pages">
    <span>Выбрать всё</span>
  </label>
  <div class="tg-choice-group tg-choice-group--nested">
    <label class="tg-choice"><input class="tg-check" type="checkbox" id="exp-posts"><span>Записи</span></label>
    <label class="tg-choice"><input class="tg-check" type="checkbox" id="exp-pages"><span>Страницы</span></label>
  </div>
  <p class="tg-help" role="status">Выбрано 0 из 8</p>
</fieldset>
```

**API** (предлагаемое): `.tg-choice-group` — вертикальный стек с `--space-3`;
`--nested` — отступ `--space-6` и линия-направляющая `--border-subtle-color`.

**Варианты из референсов**: группы с legend (16, 17, 113), экспорт с вложенностью и
счётчиком (22), уведомления с описаниями (66), «выбрать все разрешения» (89),
список задач с прогрессом (142 — композиция с `.tg-progress`).

**Состояния**: none / some (indeterminate) / all; disabled группа; invalid группа
(«выберите хотя бы один»).

**Поведение и ответственность приложения**: синхронизация «выбрать все» и детей,
счётчик, валидация минимального выбора.

**Адаптивность**: на ширине ≥ 48rem длинные группы — две колонки через `tg-grid`.

**Доступность**: `fieldset/legend`; ошибка группы связана с legend через
`aria-describedby` на fieldset.

**Токены и связь с TDS**: `--space-3`, `--space-6`, `--border-subtle-color`.

**Критерии готовности**: `indeterminate` отображается и объявляется как «частично выбрано».

**Референсы** (7):

- `olivier-1b6cd5bc--checkbox-group-1--e7b1c264.webp` — Checkbox Group
- `cnippet-dev--v-field-13--a4b2a4d7.webp` — Checkbox Group Field
- `cnippet-dev--v-checkbox-group-14--1f7717e4.webp` — Data Export Checkbox Group
- `cnippet-dev--v-checkbox-group-8--668e1249.webp` — Notification Checkbox Group
- `felipemenezes098--checkbox-06--89849b22.webp` — Select All Checkbox
- `edwinvakayil--the-checkbox-group--b2e6fba0.webp` — The Checkbox Group
- `uiable--checkbox-todo-list--1b5fc90f.webp` — Checkbox Todo List

### F13. Радиогруппа

Статус: `existing` · Приоритет: `P0` · Классы: `fieldset.tg-fieldset`, `.tg-choice`, `.tg-radio`

**Назначение**: один выбор из 2–7 видимых вариантов. Больше вариантов — F7/F8; вариантов
с иллюстрацией и описанием — F14.

**Состав**: legend; варианты с текстом и необязательным описанием.

```html
<fieldset class="tg-fieldset">
  <legend>Доставка</legend>
  <label class="tg-choice"><input class="tg-radio" type="radio" name="ship" checked><span>Обычная</span></label>
  <label class="tg-choice"><input class="tg-radio" type="radio" name="ship"><span>Срочная</span></label>
</fieldset>
```

**API**: существующий + `.tg-choice__description` (общий с F11).

**Варианты из референсов**: базовые (1, 75, 76, 78, 79, 81), с описаниями (76), плавная
подсветка при наведении (77 — подложка `opacity`), рисованные (46), объёмные (121 — не
переносится).

**Состояния**: unchecked, checked, focus-visible, disabled, invalid (группа).

**Поведение и ответственность приложения**: нативная клавиатура (стрелки); валидация.

**Адаптивность**: горизонтальная раскладка коротких вариантов переходит в вертикальную на 320 px.

**Доступность**: нативная.

**Токены и связь с TDS**: `--choice-size`, `--choice-border-color`.

**Критерии готовности**: без новых классов.

**Референсы** (9):

- `shadcnspace--radio-group-dashed-demo--c2191237.webp` —  Radio Group Dashed Demo
- `sarat-asymmetrica--radio--9eb94d33.webp` — Hand-drawn Radio Group
- `preetsuthar17--radio--5d11e0ff.webp` — Radio
- `anubra266--radio-group--b6a790bc.webp` — Radio Group
- `micka-design--radio-group-base--b02f9ce0.webp` — Radio Group (Fluid Hover)
- `shadcnspace--radio-group-animated--5a28a8fe.webp` — Radio Group Animated
- `minhxthanh--radio-button--27dffae9.webp` — Radio button
- `reshaped--reshaped-radio--8f95c443.webp` — Reshaped Radio
- `ravikatiyar162--3d-radio-group--b698476f.webp` — 3D Radio Group

### F14. Карточки выбора

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-choice-card`, `__media`, `__title`, `__description`, `__indicator`

**Назначение**: выбор тарифа, сценария, формата отчёта, профиля, роли с правами —
когда вариант нуждается в описании, иконке или изображении.

**Состав**: label-карточка; скрытый за оформлением нативный radio/checkbox;
медиа; заголовок; описание; индикатор выбора.

```html
<fieldset class="tg-fieldset tg-grid">
  <legend>Что настроить первым?</legend>
  <label class="tg-choice-card">
    <input class="tg-radio tg-choice-card__indicator" type="radio" name="start" value="payments" checked>
    <svg class="tg-icon tg-choice-card__media" aria-hidden="true">…</svg>
    <span class="tg-choice-card__title">Платежи</span>
    <span class="tg-choice-card__description">Принимайте оплату от клиентов</span>
  </label>
</fieldset>
```

**API** (предлагаемое): поверхность `.tg-card` (16 px, плоская с рамкой);
выбранная — рамка `--accent-main` 2 px через `:has(:checked)`, без смены фона на
насыщенный; фокус через `:has(:focus-visible)`. Индикатор — настоящий `input`.

**Варианты из референсов**: тарифы-строки (44), иконки-карточки (47), права с
описаниями и бейджами (84 — checkbox), эмодзи-оценка (154), профили «Кто смотрит» (186 —
аватары, вариант `--media-only` с подписью под медиа), формат отчёта (196).

**Состояния**: default, hover, focus-visible, checked, disabled, invalid (группа).

**Поведение и ответственность приложения**: данные вариантов; без JS работает нативно.

**Адаптивность**: `tg-grid` — 1 колонка на 320 px, до 4 на 1440 px.

**Доступность**: доступное имя = заголовок, описание через `aria-describedby`;
выбор — нативный, не только рамка.

**Токены и связь с TDS**: `--radius-lg`, `--border-color`, `--accent-main`.

**Критерии готовности**: выбор виден в режиме высокого контраста (forced-colors).

**Референсы** (6):

- `ai2--radio-group-tone--2b2ce06e.webp` — Group Tone Radio
- `sean0205--c-radio-group-11--5cc1cd3c.webp` — Icon Card Radio Group
- `cnippet-dev--role-permissions-picker--9de68130.webp` — Role Permissions Picker
- `ruixen-ui--emoji-radio-group--20876275.webp` — Emoji Radio Group
- `ravikatiyar162--profile-selector--de6c9cbc.webp` — Profile Selector
- `21st--lp-report-format-carousel--92028904.webp` — Report Format Carousel

### F15. Сегменты в формах

Статус: `composition` · Приоритет: `P1` · Состав: `.tg-segmented` (buttons B8)

**Назначение**: короткий взаимоисключающий выбор прямо в форме (среда «Test/Prod»,
«Source/Output», приоритет задачи, форматирование).

**Состав**: fieldset с radio, оформленный как сегменты.

```html
<fieldset class="tg-segmented">
  <legend class="tg-label">Среда</legend>
  <label class="tg-segmented__item"><input type="radio" name="env" value="test"> Test</label>
  <label class="tg-segmented__item"><input type="radio" name="env" value="prod" checked> Prod</label>
</fieldset>
```

**API**: из buttons B8; новых классов нет.

**Варианты из референсов**: «Source / Output» (109), «Test / Prod» (166), B/I/U (213),
приоритет в каждой задаче (211).

**Состояния**: как у B8.

**Поведение и ответственность приложения**: нативное для radio.

**Адаптивность**: равные доли ширины.

**Доступность**: legend обязателен.

**Токены и связь с TDS**: `--shadow-control` для выбранного.

**Критерии готовности**: пример в разделе форм ссылается на B8.

**Референсы** (4):

- `shugar--switch--bade03bb.webp` — Switch
- `xubohuah--liquid-radio--c042bebe.webp` — LiquidRadio
- `cnippet-dev--v-toggle-15--6f445618.webp` — Task Priority Toggle List
- `edwinvakayil--toggle-group--5dc5fc50.webp` — Toggle Group

### F16. Чипы выбора

Статус: `existing` · Приоритет: `P1` · Классы: `.tg-chip` + `aria-pressed` или `role="checkbox"`

**Назначение**: множественный выбор предпочтений и фильтров с короткими подписями.

**Состав**: группа с именем; чипы; необязательный счётчик в чипе; «Сбросить».

```html
<div role="group" aria-labelledby="cuisine-label" class="tg-row tg-gap-2">
  <span id="cuisine-label" class="tg-label">Любимые кухни</span>
  <button class="tg-chip" type="button" aria-pressed="true">Итальянская</button>
  <button class="tg-chip" type="button" aria-pressed="false">Японская</button>
</div>
```

**API**: существующий; счётчик — `.tg-num` внутри чипа.

**Варианты из референсов**: кухни (150), фильтр ролей со счётчиками и «Clear» (199).

**Состояния**: unpressed, pressed (заливка), hover, focus-visible, disabled.

**Поведение и ответственность приложения**: меняет `aria-pressed`, считает результаты.

**Адаптивность**: перенос строк; без горизонтального скролла.

**Доступность**: состояние в ARIA; группа имеет имя.

**Токены и связь с TDS**: `--chip-h`, `--action-border-color`.

**Критерии готовности**: без новых классов.

**Референсы** (2):

- `uniquesonu--cuisine-selector-chips--1f1989fd.webp` — Cuisine Selector Chips
- `cnippet-dev--v-toggle-10--13d525d2.webp` — Role Filter Chips

### F17. Переключатель

Статус: `existing` · Приоритет: `P0` · Классы: `.tg-switch`, `.tg-switch__knob`, `--on`

**Назначение**: мгновенно применяемая настройка (Wi-Fi, аналитика). В форме с кнопкой
«Сохранить» — F11.

**Состав**: подпись; необязательное описание; переключатель; необязательная иконка в ручке.

```html
<div class="tg-row tg-justify-between tg-align-center">
  <span class="tg-col">
    <span id="sync-label">Синхронизация между устройствами</span>
    <span id="sync-desc" class="tg-text-sm tg-text-muted">Выключится, когда вы выйдете</span>
  </span>
  <button class="tg-switch" type="button" role="switch" aria-checked="false"
          aria-labelledby="sync-label" aria-describedby="sync-desc">
    <span class="tg-switch__knob"></span>
  </button>
</div>
```

**API**: существующий. Предлагаемая строка настройки `.tg-setting-row` не нужна — это
`.tg-list-item` с переключателем в конце.

**Варианты из референсов**: базовые (106–108, 120, 206–208, 212), с описанием (110),
«Managed by admin» — disabled с причиной (208), стеклянный (115), «невозможный»
и небесный с иллюстрацией (159, 202 — декоративно, не переносится), переключатель
темы с иконками (214), Reshaped (82).

**Состояния**: off, on, focus-visible, disabled (с причиной), busy (`aria-busy` при сохранении).

**Поведение и ответственность приложения**: меняет `aria-checked`, отправляет изменение,
откатывает при ошибке.

**Адаптивность**: подпись переносится, переключатель остаётся справа (логически — в конце).

**Доступность**: `role="switch"`; RTL инвертирует направление ручки (уже реализовано).

**Токены и связь с TDS**: `--switch-track-color`, `--switch-knob-color`, `--accent-strong`.

**Критерии готовности**: без новых классов.

**Референсы** (14):

- `reshaped--reshaped-switch--c4089ba0.webp` — Reshaped Switch
- `bysages--switch--770df11a.webp` — Switch
- `cnippet-dev--cnippet-switch--71f558c8.webp` — Switch
- `preetsuthar17--switch--3f426ddd.webp` — Switch
- `sean0205--switch-with-description--aa24dbfc.webp` — Switch With Description
- `zochory--toggle-switch-glass--1c41160a.webp` — Toggle Switch Glass
- `shailendrakumar19999--switch--dc1e1499.webp` — switch
- `jh3yy-deleted--impossible-checkbox--c5b382b3.webp` — Impossible Checkbox
- `ravikatiyar162--sky-toggle--8cd3fcf6.webp` — Sky Toggle
- `kuratlielia--switch--c20d095d.webp` — Switch
- `micka-design--switch--bb04d268.webp` — Switch
- `serafimcloud--switch--4080c6e2.webp` — Switch
- `edil-ozi--toggle--39ab204e.webp` — Toggle
- `shadcnspace--toggle-theme--d205b9a6.webp` — Toggle theme

### F18. Ползунок и диапазон

Статус: `extend` · Приоритет: `P1` · Классы: `input.tg-range` + предлагаемые `.tg-range-field`, `.tg-range-field__output`, `.tg-range-dual`

**Назначение**: выбор значения в непрерывном диапазоне (громкость, прозрачность,
бюджет) и интервала (цена от–до).

**Состав**: label; значение (`output`); ползунок; необязательные метки min/max и деления;
для интервала — два ползунка.

```html
<div class="tg-range-field">
  <label class="tg-label" for="vol">Громкость</label>
  <output class="tg-range-field__output tg-num" for="vol">40</output>
  <input class="tg-range" id="vol" type="range" min="0" max="100" value="40">
</div>

<fieldset class="tg-fieldset tg-range-dual">
  <legend>Цена, ₽</legend>
  <input class="tg-range" type="range" min="0" max="1000" value="150" aria-label="Минимальная цена">
  <input class="tg-range" type="range" min="0" max="1000" value="650" aria-label="Максимальная цена">
</fieldset>
```

**API** (предлагаемое): `__output` — справа от label; `.tg-range-dual` — два нативных
`range`, наложенные на одну дорожку, заполнение между ними через `--range-start`/`--range-end`.

**Варианты из референсов**: одиночные (96–99, 102, 103), значение рядом (98, 102, 103),
набор ползунков в карточке (100), бюджет в форме (101), двойной (28, 73 с «Clear» и
делениями).

**Состояния**: default, hover, focus-visible, active (перетаскивание), disabled.

**Поведение и ответственность приложения**: обновляет `output`, не даёт ручкам
пересечься, форматирует значение.

**Адаптивность**: на всю ширину; ручка 44 px области нажатия.

**Доступность**: нативные стрелки, PageUp/PageDown; `aria-valuetext` для денежных значений.

**Токены и связь с TDS**: `--accent-strong`, `--progress-track-color`.

**Критерии готовности**: двойной ползунок полностью работает с клавиатуры.

**Референсы** (10):

- `arihantcodes-1f7b8c4d--dual-range-slider--fc382cc6.webp` — Dual Range Slider
- `shadcnspace--slider-06--c0fd181b.webp` — Price Range Slider
- `halaska-studio--slider--111e036d.webp` — Slider
- `jshguo--interfaces-slider--c784ab18.webp` — Slider
- `kuratlielia--slider--08d9cf1d.webp` — Slider
- `shadcn--slider--d4e09089.webp` — Slider
- `wensity--slider--264e1fb9.webp` — Slider
- `felipemenezes098--tsf-fields-04--83849d4d.webp` — Slider Field (TanStack Form)
- `jolbol1--slider--7440c319.webp` — Slider [react-aria-components]
- `bundui--slider4--d4a3b6f5.webp` — Slider with Value Output

### F19. Загрузка файлов и dropzone

Статус: `extend` · Приоритет: `P0` · Классы: `.tg-upload`, `--dashed`, `__preview`, `__actions`, `__status` + предлагаемые `.tg-upload__list`, `.tg-upload__item`

**Назначение**: выбор одного или нескольких файлов, перетаскивание, превью и прогресс.

**Состав**: зона с иконкой, текстом и кнопкой выбора; ограничения (типы, размер);
список файлов с прогрессом и удалением.

```html
<div class="tg-upload tg-upload--dashed">
  <svg class="tg-icon tg-upload__icon" aria-hidden="true">…</svg>
  <p>Перетащите файлы или
    <label class="tg-link">выберите<input class="tg-sr-only" type="file" multiple accept=".csv,.json"></label>
  </p>
  <p class="tg-help">CSV или JSON, до 2 ГБ</p>
</div>
<ul class="tg-upload__list" aria-label="Загружаемые файлы">
  <li class="tg-upload__item">
    <span class="tg-truncate">report.csv</span>
    <progress class="tg-progress" max="100" value="42">42%</progress>
    <button class="tg-icon-btn tg-icon-btn--ghost" type="button" aria-label="Отменить загрузку report.csv">×</button>
  </li>
</ul>
```

**API** (предлагаемое): `__list` и `__item` — строки с именем, размером, прогрессом,
статусом и действием; состояние строки `data-state="uploading|done|error"`.

**Варианты из референсов**: dropzone (4, 36, 218 — пустое состояние), поле «Choose
file» (37, 219), загрузка в форме (35, 117), список с прогрессом (129), загрузка
изображения с превью (223).

**Состояния**: idle, dragover, selected, uploading, done, error, disabled.

**Поведение и ответственность приложения**: drag-and-drop события, проверка типа/размера,
загрузка, повтор, превью через object URL.

**Адаптивность**: на мобильном текст про перетаскивание скрывается — остаётся «Выбрать файл».

**Доступность**: нативный `input type=file` в label; прогресс — `progress` с текстом;
итог в status.

**Токены и связь с TDS**: `--progress-color`, `--border-color`, `--radius-lg`.

**Критерии готовности**: работает без JS (выбор файла); список не требует новых цветов.

**Референсы** (9):

- `educalvolpz--animated-file-upload--3e1a2ff4.webp` — Animated File Upload
- `ephraimduncan--file-upload--135aec24.webp` — File Upload
- `ephraimduncan--file-upload-04--b9a7f18f.webp` — File Upload Drag & Drop
- `cnippet-dev--v-field-21--c703108c.webp` — File Upload Field
- `ephraimduncan--upload-advanced--cb77b7ed.webp` — Upload Advanced
- `starc007--be-ui-file-upload--d2d7115d.webp` — BeUI File Upload
- `arihantcodes-1f7b8c4d--upload-empty--68caa9be.webp` — Upload Dropzone Empty State
- `ruixen-ui--ruixen-upload-input--89307ad0.webp` — Upload Input
- `originui--use-image-upload--9d4b603e.webp` — useImageUpload

### F20. Поле даты и времени

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-date-field`, `.tg-date-field__segment`; базово — `input.tg-input[type=date|time|datetime-local]`

**Назначение**: ввод известной даты (день рождения) или времени, когда календарь не нужен.

**Состав**: label; поле или сегменты день/месяц/год; необязательная кнопка календаря (F21).

```html
<div class="tg-field">
  <label class="tg-label" for="birth">Дата рождения</label>
  <input class="tg-input" id="birth" type="date" autocomplete="bday">
</div>
```

**API**: первая ступень — нативный `input type=date/time` с оформлением `.tg-input`.
Сегментное поле (`__segment`, `role="spinbutton"`) — только если нативное не подходит
(формат, ограничения).

**Варианты из референсов**: дата + время «от–до» (7), сегментное поле (23), ряд дат (116).

**Состояния**: empty, filled, focus, invalid, disabled.

**Поведение и ответственность приложения**: формат локали, ограничения min/max, часовой пояс.

**Адаптивность**: на мобильном — системный пикер.

**Доступность**: у сегментов `aria-label` («день», «месяц»), ↑/↓ меняют, ←/→ переходят.

**Токены и связь с TDS**: как `.tg-input`.

**Критерии готовности**: нативный вариант документирован первым.

**Референсы** (3):

- `shadcn--calendar-date-and-time-range--8f83bd9c.webp` — Calendar Date and Time range
- `jolbol1--datefield--4a056212.webp` — Date Field [react-aria-components]
- `ai2--date-picker-tone--4b30d6a8.webp` — Tone Date Picker

### F21. Календарь

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-calendar`, `__header`, `__grid`, `__day`, `__day--today`, `__day--outside`, `__event-dot`

**Назначение**: выбор даты, когда важен контекст месяца (дни недели, события,
недоступные дни). Встраивается в страницу или во всплывающее окно у поля.

**Состав**: заголовок месяца с кнопками «назад/вперёд»; сетка `table` 7×6; дни
текущего и соседних месяцев; отметки событий; легенда.

```html
<div class="tg-calendar" role="group" aria-labelledby="cal-title">
  <div class="tg-calendar__header">
    <button class="tg-icon-btn tg-icon-btn--ghost" type="button" aria-label="Предыдущий месяц">‹</button>
    <h2 class="tg-header__title" id="cal-title" aria-live="polite">Октябрь 2026</h2>
    <button class="tg-icon-btn tg-icon-btn--ghost" type="button" aria-label="Следующий месяц">›</button>
  </div>
  <table class="tg-calendar__grid" role="grid" aria-labelledby="cal-title">
    <thead><tr><th scope="col" abbr="Понедельник">Пн</th>…</tr></thead>
    <tbody>
      <tr>
        <td><button class="tg-calendar__day" type="button" tabindex="-1">1</button></td>
        <td><button class="tg-calendar__day tg-calendar__day--today" type="button" aria-current="date" aria-pressed="true" tabindex="0">14</button></td>
      </tr>
    </tbody>
  </table>
</div>
```

**API** (предлагаемое): день — 44 px, `--radius-inset`; выбранный — заливка
`--accent-strong`; сегодня — кольцо `--accent-main`; вне месяца — `--text-secondary`;
недоступный — `--disabled-opacity` + перечёркивание не используется (только атрибут
`aria-disabled`); `__event-dot` — до трёх точек цветами accent/danger/secondary.

**Варианты из референсов**: базовые месяцы (133, 134, 135, 138, 139, 197), с полем над
сеткой (8), выбор с подтверждением (6, 25), Apple-стиль со временем (126), события
с легендой (140), недоступные выходные (141), пустой календарь (155), стекло (157),
несколько месяцев (173).

**Состояния**: day default, hover, focus-visible, selected, today, outside, disabled,
with events; календарь loading.

**Поведение и ответственность приложения**: стрелки — на день/неделю, PageUp/PageDown —
месяц, Shift+PageUp/Down — год, Home/End — начало/конец недели, Enter/Space выбирают;
roving tabindex; правила доступности дат; локаль и первый день недели.

**Адаптивность**: на 320 px ячейки 40–44 px без промежутков; несколько месяцев
перестраиваются в один столбец.

**Доступность**: APG «Date picker dialog»; `aria-current="date"`; название месяца
обновляется политно; выбранная дата объявляется полностью («вторник, 14 октября»).

**Токены и связь с TDS**: `--accent-strong`, `--accent-main`, `--text-secondary`, `--radius-inset`.

**Критерии готовности**: полный клавиатурный контракт; первый день недели по локали;
RTL зеркалит стрелки.

**Референсы** (15):

- `shugar--calendar--7b3f4f9d.webp` — Calendar
- `shadcn--calendar-input--83893a76.webp` — Calendar input
- `bidyut10--date-range-picker-card--ca9881e5.webp` — Date Range Picker Card
- `pulseawan--apple-calendar-picker--a606bb31.webp` — Apple Calendar Picker
- `coss-com--calendar--83100f73.webp` — Calendar
- `ebnsina--calendar--3811ba86.webp` — Calendar
- `clevision--calendar-1--b97b1382.webp` — Calendar 
- `shadcn--calendar-variable-size--603479de.webp` — Calendar Variable size
- `originui--calendar--f71be2e1.webp` — Calendar [React Day Picker]
- `cnippet-dev--v-calendar-10--161940f1.webp` — Calendar with Event Indicators
- `shadcn--calendar-with-disabled-weekends--7466b5c0.webp` — Calendar with disabled weekends
- `flohoeller--empty-calendar--08354a8b.webp` — Empty Calendar
- `ravikatiyar162--glass-calendar--cfaaae21.webp` — Glass Calendar
- `ruixen-ui--multi-month-calendar--36f29fe9.webp` — Multi Month Calendar
- `reshaped--reshaped-calendar--d96d5b49.webp` — Reshaped Calendar

### F22. Диапазон дат и пресеты

Статус: `extend` · Приоритет: `P1` · Расширение F21: предлагаемые `.tg-calendar--range`, `.tg-calendar__day--range-start`, `__day--in-range`, `__day--range-end`, `.tg-calendar__presets`

**Назначение**: период отчёта, бронирование, выбор месяцев; быстрые пресеты «Сегодня»,
«Последние 7 дней».

**Состав**: поле-триггер с диапазоном; один-два месяца; список пресетов; «Отмена/Применить».

```html
<div class="tg-calendar tg-calendar--range">
  <ul class="tg-calendar__presets" aria-label="Быстрый выбор">
    <li><button class="tg-btn tg-btn--ghost tg-btn--sm" type="button">Этот месяц</button></li>
    <li><button class="tg-btn tg-btn--ghost tg-btn--sm" type="button">Последние 3 месяца</button></li>
  </ul>
  <!-- сетка F21: дни с классами __day--range-start / --in-range / --range-end -->
  <div class="tg-modal__footer">
    <button class="tg-btn tg-btn--secondary" type="button">Отмена</button>
    <button class="tg-btn tg-btn--primary" type="button">Применить</button>
  </div>
</div>
```

**API** (предлагаемое): промежуток — фон `--accent-soft` сплошной полосой; концы —
`--accent-strong`; пресеты — список кнопок `--ghost`, на мобильном — горизонтальные
чипы.

**Варианты из референсов**: пресеты «Today / Tomorrow / In a week» (24, 136),
выпадающий диапазон (152), месяцы (171), минимальная длина диапазона (188), два месяца
(216), React Aria (187).

**Состояния**: выбор начала, выбор конца (hover-превью диапазона), диапазон выбран, ошибка (меньше минимума).

**Поведение и ответственность приложения**: правила минимальной/максимальной длины,
применение, локализация подписи диапазона.

**Адаптивность**: два месяца → один со свайпом на мобильном; пресеты сверху.

**Доступность**: начало и конец объявляются («начало периода, 12 июня»); ограничение
сообщается в `tg-help`.

**Токены и связь с TDS**: `--accent-soft`, `--accent-strong`.

**Критерии готовности**: выбор диапазона с клавиатуры (Enter для начала и конца).

**Референсы** (7):

- `cnippet-dev--date-picker-with-presets--a9a703eb.webp` — Date Picker with Presets
- `uiable--calendar-presets--0199122c.webp` — Calendar Presets
- `ruixen-ui--dropdown-range-date-picker--b07b2b33.webp` — Dropdown Range Date Picker
- `haassiib--month-range-picker--05dec9c5.webp` — Month Range Picker
- `jolbol1--range-calendar--51f8f627.webp` — Range Calendar [react-aria-components]
- `shadcn--range-selection-calendar-with-min--5eccfd63.webp` — Range selection calendar with min.
- `cnippet-dev--v-calendar-9--2090140e.webp` — Two-Month Range Picker

### F23. Выбор времени и запись

Статус: `composition` · Приоритет: `P2` · Состав: F21 + список слотов (`.tg-chip` или radio) + `.tg-card`

**Назначение**: запись на приём, планирование встречи, бронирование ночей.

**Состав**: календарь; список свободных слотов; сводка выбора; действие.

```html
<div class="tg-grid">
  <div class="tg-calendar">…</div>
  <fieldset class="tg-fieldset">
    <legend>Свободное время, 21 октября</legend>
    <label class="tg-chip"><input class="tg-sr-only" type="radio" name="slot" value="09:30">09:30</label>
    <label class="tg-chip"><input class="tg-sr-only" type="radio" name="slot" value="10:00">10:00</label>
  </fieldset>
</div>
```

**API**: новых классов нет; радио-чип — `.tg-chip` с вложенным radio (выбор
отражается через `:has(:checked)`).

**Варианты из референсов**: слоты справа (127, 184), бронирование заезда/выезда (131),
планировщик встреч (137), календарь с формой события (160), дата и время публикации
(194), спринты (204).

**Состояния**: слот свободен/выбран/занят (disabled); загрузка слотов.

**Поведение и ответственность приложения**: доступность слотов, часовые пояса,
подтверждение записи.

**Адаптивность**: слоты под календарём на мобильном.

**Доступность**: слоты — радиогруппа с legend, включающим выбранную дату.

**Токены и связь с TDS**: как у F21.

**Критерии готовности**: собирается из F21 и существующих классов.

**Референсы** (7):

- `shadcnspace--calendar-03--48df975c.webp` — Appointment Picker Calendar
- `cnippet-dev--v-calendar-15--e69d1b92.webp` — Booking Calendar
- `ruixen-ui--calendar-scheduler--344d12e0.webp` — Calendar Scheduler 
- `ruixen-ui--inbox-calendar--ec7bbb12.webp` — Inbox Calendar
- `sean0205--c-calendar-14--30d2e455.webp` — Preset Time Selection Calendar
- `sean0205--reui-time-picker-13--2cda4ba0.webp` — ReUI time picker - Date and time
- `cnippet-dev--sprint-planner-calendar--e21a5c27.webp` — Sprint Planner Calendar

### F24. Колесо выбора

Статус: `new` · Приоритет: `P2` · Предлагаемые классы: `.tg-wheel`, `.tg-wheel__column`, `.tg-wheel__option`

**Назначение**: выбор даты/времени в стиле iOS на сенсорных экранах. На десктопе
заменяется F7/F20.

**Состав**: столбцы прокрутки со snap; выделенная центральная строка.

```html
<div class="tg-wheel" role="group" aria-label="Время">
  <ul class="tg-wheel__column" role="listbox" aria-label="Часы" tabindex="0">
    <li class="tg-wheel__option" role="option" aria-selected="true">9</li>
  </ul>
  <ul class="tg-wheel__column" role="listbox" aria-label="Минуты" tabindex="0">
    <li class="tg-wheel__option" role="option" aria-selected="true">41</li>
  </ul>
</div>
```

**API** (предлагаемое): `scroll-snap-type: y mandatory`; центральная полоса
`--background-muted`; затухание краёв маской `opacity`.

**Варианты из референсов**: дата колесом (151), время с AM/PM (222), «перекидные»
часы с пресетами времени суток (38).

**Состояния**: default, scrolling, focus-visible, disabled-option.

**Поведение и ответственность приложения**: синхронизация значения со snap, ↑/↓ на
столбце.

**Адаптивность**: ширина столбца по содержимому.

**Доступность**: каждый столбец — listbox с именем; значение объявляется; есть
альтернатива нативным полем.

**Токены и связь с TDS**: `--background-muted`, `--fs-lg`.

**Критерии готовности**: работает с клавиатуры; reduced motion — без инерции.

**Референсы** (3):

- `shadcnspace--select-10--b2be6468.webp` — Flip Clock Daypart Picker
- `osiris-balonga--date-wheel-picker--5703dd51.webp` — Date Wheel Picker
- `kokonutd--wheel-picker--0df7ed30.webp` — Wheel Picker

### F25. Выбор цвета

Статус: `new` · Приоритет: `P2` · Предлагаемые классы: `.tg-color-field` (`__swatch`, `__input`), `.tg-color-picker` (`__area`, `__hue`, `__swatches`)

**Назначение**: ввод пользовательского цвета (заливка, метка). Не для выбора темы TDS.

**Состав**: образец цвета; поле HEX/HSL; необязательная прозрачность; палитра
образцов; панель насыщенности и оттенка; проверка контраста.

```html
<div class="tg-field">
  <label class="tg-label" for="fill">Цвет заливки</label>
  <div class="tg-input-group tg-color-field">
    <input class="tg-color-field__swatch" type="color" value="#f97316" aria-label="Выбрать цвет">
    <input class="tg-input-group__control tg-color-field__input" id="fill" value="#F97316" spellcheck="false">
    <span class="tg-input-group__addon tg-num">100%</span>
  </div>
</div>
```

**API** (предлагаемое): базовый уровень — нативный `input type=color` + HEX-поле в
input group; расширенный `.tg-color-picker` (область 2D, ползунок оттенка как
`.tg-range`, образцы-радио) — P2.

**Варианты из референсов**: поле с образцом и процентом (19), полный пикер с
палитрой и контрастом (20, 146, 147, 148), спектр (145), проверка контраста WCAG (192 —
полезна как композиция с `.tg-badge`).

**Состояния**: default, focus, invalid (неверный HEX), disabled.

**Поведение и ответственность приложения**: конвертация форматов, пипетка (EyeDropper
API как улучшение), расчёт контраста.

**Адаптивность**: пикер на мобильном — в `.tg-modal--sheet`.

**Доступность**: 2D-область — два слайдера с `aria-valuetext` («насыщенность 60%»); всегда
есть текстовое поле; цвет имеет текстовое описание.

**Токены и связь с TDS**: геометрия `.tg-input-group`; сами пользовательские цвета не
становятся токенами.

**Критерии готовности**: всё выполнимо без мыши.

**Референсы** (7):

- `extend--document-color-picker--e33d0851.webp` — Color Picker
- `uplusion23--color-picker--ec98e99d.webp` — Color Picker
- `designali-in--color-picker--3d3fd8e8.webp` — Color Picker
- `edwinvakayil--color-picker--c0c5e56a.webp` — Color Picker
- `starc007--color-picker--88760f9f.webp` — Color Picker
- `wensity--color-picker--35af2bfd.webp` — Color Picker
- `sean0205--reui-color-picker-13--8b44a9f0.webp` — ReUI color picker - Contrast checker

### F26. Выбор эмодзи

Статус: `new` · Приоритет: `P2` · Предлагаемые классы: `.tg-emoji-picker`, `__search`, `__grid`, `__option`

**Назначение**: вставка эмодзи в сообщение или реакцию.

**Состав**: поиск; категории; сетка; подсказки по шорткоду.

```html
<div class="tg-emoji-picker" role="dialog" aria-label="Эмодзи">
  <div class="tg-search"><input class="tg-search__input" type="search" aria-label="Найти эмодзи"></div>
  <div class="tg-emoji-picker__grid" role="grid" aria-label="Улыбки">
    <div role="row"><button class="tg-emoji-picker__option" role="gridcell" type="button" aria-label="улыбка">🙂</button></div>
  </div>
</div>
```

**API** (предлагаемое): ячейка 44 px; сетка `repeat(auto-fill, minmax(44px, 1fr))`.

**Варианты из референсов**: сетка с поиском (153), подсказки `:shortcode:` в композере (193).

**Состояния**: default, hover, focus, recent, no results.

**Поведение и ответственность приложения**: набор эмодзи, недавние, вставка в курсор.

**Адаптивность**: на мобильном — sheet.

**Доступность**: grid-навигация стрелками; имена эмодзи на языке интерфейса.

**Токены и связь с TDS**: `--background-raised`, `--shadow-overlay`.

**Критерии готовности**: клавиатурная навигация; поиск по названию.

**Референсы** (2):

- `liveblocks--emoji-picker--33b6ad91.webp` — Emoji Picker
- `sean0205--reui-emoji-picker-6--1efe9635.webp` — ReUI emoji picker - Shortcode suggestions

### F27. Формы и группы полей

Статус: `composition` · Приоритет: `P0` · Состав: `form`, `.tg-fieldset`, `.tg-field`, `.tg-error-summary`, `.tg-btn`, `.tg-modal`

**Назначение**: шаблоны типовых форм — профиль, оплата, обращение в поддержку,
настройки, форма в диалоге.

**Состав**: заголовок и описание; группы полей; сводка ошибок; действия в конце.

```html
<form class="tg-col tg-gap-4" novalidate aria-labelledby="pay-title">
  <h2 class="tg-header__title" id="pay-title">Данные оплаты</h2>
  <div class="tg-error-summary" tabindex="-1" hidden>…</div>
  <fieldset class="tg-fieldset">
    <legend>Карта</legend>
    <div class="tg-field"><label class="tg-label" for="cc-name">Имя на карте</label>
      <input class="tg-input" id="cc-name" autocomplete="cc-name"></div>
    <div class="tg-field"><label class="tg-label" for="cc-num">Номер карты</label>
      <input class="tg-input tg-num" id="cc-num" autocomplete="cc-number" inputmode="numeric"></div>
  </fieldset>
  <div class="tg-toolbar">
    <button class="tg-btn tg-btn--secondary" type="button">Отмена</button>
    <button class="tg-btn tg-btn--primary" type="submit">Оплатить</button>
  </div>
</form>
```

**API**: новых классов нет. Предлагается документированная раскладка «label слева» на
≥ 48rem (39) через `tg-grid` с двумя колонками.

**Варианты из референсов**: диалоги редактирования (26, 29), оплата (34, 71, 170),
настройки с группами слева (39), поиск отеля (40), форма в модалке (53), форма с
обязательными полями (61), обращение (105).

**Состояния**: pristine, invalid после отправки (summary + поля), submitting (B5), success.

**Поведение и ответственность приложения**: валидация, отправка, фокус на summary,
сохранение черновика.

**Адаптивность**: одна колонка до 48rem; короткие поля (срок, CVC) в строку.

**Доступность**: порядок полей = порядок чтения; группы — fieldset; autocomplete для оплаты.

**Токены и связь с TDS**: `--space-4`, `--space-6`.

**Критерии готовности**: примеры в витрине для оплаты, профиля и обращения.

**Референсы** (10):

- `lailai0916--dialog--6a0f5bcb.webp` — Dialog
- `cnippet-dev--v-dialog-9--4daf4300.webp` — Edit Profile Dialog
- `shadcn--field-1--6a21187b.webp` — Field
- `ephraimduncan--form-1--d4519338.webp` — Form
- `lavikatiyar--form--30a126e2.webp` — Form
- `arihantcodes-1f7b8c4d--input-modal--51ffda8e.webp` — Input Modal
- `cnippet-dev--v-field-17--dc291b8a.webp` — Multi-Field Form
- `cnippet-dev--v-fieldset-6--3f42d16c.webp` — Payment Information Fieldset
- `cnippet-dev--v-fieldset-9--e3abe861.webp` — Support Request Fieldset
- `ruixen-ui--modern-payment-form--a6ae07a9.webp` — Modern Payment Form

### F28. Пошаговая форма

Статус: `new` · Приоритет: `P1` · Предлагаемые классы: `.tg-stepper`, `.tg-stepper__step`, `.tg-stepper__marker`, `.tg-stepper__label`

**Назначение**: длинная форма, разбитая на 3–6 шагов (онбординг, настройка, регистрация).

**Состав**: индикатор шагов; текущий шаг формы; «Назад/Далее»; экран завершения.

```html
<nav aria-label="Шаги регистрации">
  <ol class="tg-stepper">
    <li class="tg-stepper__step" data-state="done"><span class="tg-stepper__marker" aria-hidden="true">✓</span><span class="tg-stepper__label">Аккаунт</span></li>
    <li class="tg-stepper__step" aria-current="step"><span class="tg-stepper__marker" aria-hidden="true">2</span><span class="tg-stepper__label">Рабочее пространство</span></li>
    <li class="tg-stepper__step"><span class="tg-stepper__marker" aria-hidden="true">3</span><span class="tg-stepper__label">Команда</span></li>
  </ol>
</nav>
```

**API** (предлагаемое): маркер 32 px круг (обоснованная капсула), линия между шагами
`--border-color`, пройденные — `--accent-strong`, текущий — `aria-current="step"`.

**Варианты из референсов**: шаги конфигурации (21), регистрация с итогом (62),
онбординг с иллюстрацией (69).

**Состояния**: шаг upcoming, current, done, error; форма шага — как F27.

**Поведение и ответственность приложения**: переход между шагами, сохранение,
валидация шага, фокус на заголовок нового шага.

**Адаптивность**: на мобильном — «Шаг 2 из 3» + полоса `.tg-progress`, подписи скрыты.

**Доступность**: `ol` + `aria-current="step"`; заголовок шага получает фокус при переходе.

**Токены и связь с TDS**: `--accent-strong`, `--border-color`.

**Критерии готовности**: состояние «ошибка шага» отличимо иконкой.

**Референсы** (3):

- `shadcnspace--stepper-02--c053c92b.webp` — Configuration Stepper
- `dhileepkumargm--multiple-form--516f2858.webp` — Multiple Form
- `ravikatiyar162--onboarding-form--da028d8e.webp` — Onboarding Form

### F29. Регистрация и вход

Статус: `composition` · Приоритет: `P1` · Подробная спецификация — `sign-in/components.md`

**Назначение**: формы входа и создания аккаунта, найденные в разделе форм.

**Состав**: заголовок; кнопки внешних провайдеров; разделитель «или»; поля; действие;
ссылка на альтернативный сценарий.

```html
<form class="tg-card tg-col tg-gap-4" aria-labelledby="signup-title">
  <h1 class="tg-header__title" id="signup-title">Создать аккаунт</h1>
  <div class="tg-field"><label class="tg-label" for="su-email">Почта</label>
    <input class="tg-input" id="su-email" type="email" autocomplete="email" spellcheck="false"></div>
  <button class="tg-btn tg-btn--primary" type="submit">Создать аккаунт</button>
</form>
```

**API**: новых классов нет.

**Варианты из референсов**: вход и регистрация (57, 58, 201), регистрация (94, 95,
149), космический фон (104 — фон декоративный, форма стандартная).

**Состояния**: как F27.

**Поведение и ответственность приложения**: аутентификация вне TDS.

**Адаптивность**: карточка до 26rem по центру.

**Доступность**: `autocomplete` email/current-password/new-password.

**Токены и связь с TDS**: `--radius-lg`.

**Критерии готовности**: см. sign-in.

**Референсы** (7):

- `ephraimduncan--login-signup--3fceb0d1.webp` — Login & Signup
- `designali-in--login-page--42ae427e.webp` — Login page
- `cnippet-dev--v-form-9--0a3b6762.webp` — Sign Up Form
- `diarmuradi--sign-up-2--b6f26b49.webp` — Sign Up Form
- `naturaldoc--space-login--72d7bc46.webp` — Space Login
- `ruixen-ui--creat-account-form--482309c8.webp` — Create Account Form
- `ruixen-ui--sign-in-form--98a20cd6.webp` — Sign In Form

### F30. AI-поле ввода

Статус: `composition` · Приоритет: `P1` · Подробная спецификация — `ai-chats/components.md`

**Назначение**: поле запроса к ассистенту с вложениями и выбором модели.

**Состав**: `.tg-composer` с textarea; иконкокнопки вложения/голоса; выбор модели (F8);
отправка.

```html
<form class="tg-composer__form">
  <div class="tg-composer__input">
    <textarea class="tg-textarea tg-composer__textarea" rows="1" aria-label="Сообщение"></textarea>
    <button class="tg-icon-btn tg-icon-btn--primary" type="submit" aria-label="Отправить">…</button>
  </div>
</form>
```

**API**: существующий `.tg-composer`.

**Варианты из референсов**: тёмное поле (122), с файлом (123), с выбором модели и
апгрейдом (124), с подсказкой над полем (158), «умный помощник» (203).

**Состояния**: empty, typing, sending, disabled.

**Поведение и ответственность приложения**: отправка, вложения, модели.

**Адаптивность**: как композер.

**Доступность**: имя поля; Enter/Shift+Enter документированы.

**Токены и связь с TDS**: `--composer-input-max-size`.

**Критерии готовности**: см. ai-chats.

**Референсы** (5):

- `daiwiikharihar--ai-chat-input--d3e7877b.webp` — AI Chat Input
- `kokonutd--ai-input-with-file--9b0a69a1.webp` — AI Input With File
- `hellocloud-webdev--ai-prompt-composer-with-model-selector--a6239a54.webp` — AI Prompt Composer with Model Selector
- `ruixen-ui--gradient-chat-input--84789813.webp` — Gradient Chat Input
- `ruixen-ui--smart-assist-input--64bbe7b4.webp` — Smart Assist Input

### F31. Матрица настроек

Статус: `composition` · Приоритет: `P1` · Состав: `.tg-table` + `.tg-check`

**Назначение**: настройки «событие × канал» (уведомления по почте, push, SMS).

**Состав**: таблица; заголовки каналов; флажки в ячейках; «Сохранить».

```html
<div class="tg-table-wrap" role="region" aria-labelledby="np-caption" tabindex="0">
  <table class="tg-table">
    <caption id="np-caption">Настройки уведомлений</caption>
    <thead><tr><th scope="col">Событие</th><th scope="col">Почта</th><th scope="col">Push</th></tr></thead>
    <tbody><tr><th scope="row">Упоминание</th>
      <td><input class="tg-check" type="checkbox" aria-label="Упоминание — почта" checked></td>
      <td><input class="tg-check" type="checkbox" aria-label="Упоминание — push"></td></tr></tbody>
  </table>
</div>
```

**API**: новых классов нет; центровка ячейки с флажком — утилита `tg-text-center`.

**Варианты из референсов**: матрица уведомлений (175).

**Состояния**: как F11; «выбрать столбец» — заголовок-флажок с indeterminate.

**Поведение и ответственность приложения**: сохранение, массовые переключения.

**Адаптивность**: на мобильном — список событий с группой флажков в каждом.

**Доступность**: у каждого флажка имя из строки и столбца.

**Токены и связь с TDS**: как `.tg-table`.

**Критерии готовности**: пример в витрине.

**Референсы** (1):

- `cnippet-dev--v-checkbox-13--8fd2b936.webp` — Notification Preferences Matrix

### F32. Декоративные поля

Статус: `extend` · Приоритет: `P2` · Модуль `effects`: свечение фокуса, частицы — опционально

**Назначение**: маркетинговые поля с эффектами (градиентное свечение, частицы под
указателем). В рабочих формах не используются.

**Состав**: обычное `.tg-field` + декоративный слой `aria-hidden`.

```html
<div class="tg-field tg-effect-glow">
  <label class="tg-label" for="wait-email">Почта для списка ожидания</label>
  <input class="tg-input" id="wait-email" type="email" autocomplete="email">
</div>
```

**API**: эффекты из buttons B19; фокус-кольцо поля остаётся стандартным.

**Варианты из референсов**: градиентное «цветение» (130), поле с частицами (164).

**Состояния**: как F1; эффект отключён в disabled.

**Поведение и ответственность приложения**: подключение модуля эффектов.

**Адаптивность**: эффект не на сенсорных устройствах.

**Доступность**: reduced motion — без анимации; контраст label/текста не страдает.

**Токены и связь с TDS**: `--accent-soft`.

**Критерии готовности**: без модуля поле выглядит стандартно.

**Референсы** (2):

- `diogotesch--bloom-field-gradient--ed3b74d7.webp` — Bloom Field gradient
- `klyv-ui--klyv-particle-field--44c0688c.webp` — Klyv Particle Field

### F33. Холст и аудио

Статус: `new` · Приоритет: `P2` · Предлагаемые классы: `.tg-selection-box` (`__handle`), `.tg-waveform` (`__track`, `__bar`, `__progress`)

**Назначение**: прямоугольное выделение на изображении/холсте и визуализация аудио
с воспроизведением.

**Состав**: рамка выделения с 8 ручками; дорожка волны с прогрессом и кнопкой Play.

```html
<figure class="tg-waveform">
  <button class="tg-icon-btn" type="button" aria-label="Воспроизвести">▶</button>
  <div class="tg-waveform__track" aria-hidden="true"><!-- полосы --></div>
  <input class="tg-range" type="range" min="0" max="187" value="0" aria-label="Позиция" aria-valuetext="0:00 из 3:07">
  <figcaption class="tg-text-sm tg-text-muted">Голосовое сообщение</figcaption>
</figure>
```

**API** (предлагаемое): волна — декоративные полосы `scaleY()` поверх нативного
`range` для позиции; рамка выделения — `--accent-main` 2 px, ручки 12 px с областью 44 px.

**Варианты из референсов**: выделение области (132), волна (220), плеер с волной (221).

**Состояния**: idle, playing, paused, dragging, focus.

**Поведение и ответственность приложения**: аудио API, расчёт полос, координаты выделения.

**Адаптивность**: волна масштабируется по ширине (число полос пересчитывается).

**Доступность**: позиция — нативный range; выделение меняется стрелками (Shift — размер).

**Токены и связь с TDS**: `--accent-main`, `--progress-track-color`.

**Критерии готовности**: управление без указателя.

**Референсы** (3):

- `framecn--bounding-box-selector--05b51cfb.webp` — Bounding Box Selector
- `elevenlabs-crawled--waveform--2d3a4524.webp` — Waveform
- `ruixen-ui--waveform-player--cb1ebf1d.webp` — WaveformPlayer

### F34. Календарные данные и афиша

Статус: `composition` · Приоритет: `P2` · Подробнее — `dashboards/components.md` (тепловая карта активности)

**Назначение**: отображение (не ввод) данных по дням — карта активности, серия дней,
список дат тура.

**Состав**: сетка ячеек-дней с интенсивностью; сводные числа; список дат с действиями.

```html
<figure class="tg-card">
  <figcaption class="tg-header__title">Активность за год</figcaption>
  <table class="tg-table" aria-label="Вклады по дням"><!-- ячейки с title и sr-only числом --></table>
  <p class="tg-num">1 839 вкладов</p>
</figure>
```

**API**: новых классов в forms нет; тепловая карта специфицируется в dashboards.

**Варианты из референсов**: GitHub-календарь с игрой (198 — игровая часть не
переносится), статистика серии (205), афиша тура с датами и билетами (215).

**Состояния**: статично; ячейка hover с подсказкой.

**Поведение и ответственность приложения**: данные.

**Адаптивность**: горизонтальная прокрутка в доступной оболочке.

**Доступность**: таблица-альтернатива и итоговые числа текстом.

**Токены и связь с TDS**: интенсивность — ступени прозрачности `--accent-main`.

**Критерии готовности**: см. dashboards.

**Референсы** (3):

- `jahirulislamrayhan07--retro-space-shooter-git-hub-calendar--87969e52.webp` — Retro Space Shooter GitHub Calendar
- `ham7a311--streak-field-stats--1956a956.webp` — Streak Field Stats
- `21st--mg-audio-tour-dates--83cc683f.webp` — Tour Dates Poster

### F35. Список переходов

Статус: `composition` · Приоритет: `P1` · Состав: `.tg-list`, `a.tg-list-item[href]`, `.tg-avatar`/медиа

**Назначение**: меню разделов в виде крупных строк с превью и шевроном.

**Состав**: список; строки-ссылки с медиа, заголовком и шевроном.

```html
<nav aria-label="Разделы">
  <ul class="tg-list">
    <li><a class="tg-list-item" href="/effects"><span class="tg-list-item__title">Все эффекты</span></a></li>
    <li><a class="tg-list-item" href="/components"><span class="tg-list-item__title">Компоненты</span></a></li>
  </ul>
</nav>
```

**API**: существующий.

**Варианты из референсов**: «Elevate Navbar» с превью-строками (30).

**Состояния**: hover, focus-visible, current (`aria-current="page"`).

**Поведение и ответственность приложения**: роутинг.

**Адаптивность**: строки на всю ширину.

**Доступность**: без вложенных интерактивных элементов в строке.

**Токены и связь с TDS**: как `.tg-list`.

**Критерии готовности**: без новых классов.

**Референсы** (1):

- `hyperiux--elevate-navbar--a09dfb80.webp` — Elevate Navbar

## Порядок реализации

1. **P0, базовые поля:** документировать F1, F6, F7, F11, F13, F17 по референсам
   (новых классов почти нет); ввести `.tg-choice__description`.
2. **P0, расширения:** F2 input group (на нём строятся F3, F4, F10, F25), F12
   вложенные группы и indeterminate, F19 список файлов, F27 шаблоны форм.
3. **P1, виджеты с клавиатурой:** F8 listbox → F9 combobox → F10 теги (общая
   всплывающая поверхность с `.tg-menu` из buttons); F5 OTP; F4 степпер; F18 двойной
   ползунок; F14 карточки выбора; F28 stepper.
4. **P1, дата:** F20 нативные поля → F21 календарь → F22 диапазоны.
5. **P1, композиции:** F15, F16, F29, F30, F31, F35 — примеры в витрине.
6. **P2:** F23, F24, F25, F26, F32, F33, F34.

## Контрольный список покрытия

| Группа | Референсов |
| --- | ---: |
| F1. Текстовое поле и многострочный ввод | 13 |
| F2. Поле с дополнениями (input group) | 12 |
| F3. Пароль и проверка требований | 4 |
| F4. Числовое поле со степпером | 2 |
| F5. Код подтверждения (OTP) | 9 |
| F6. Поле поиска | 2 |
| F7. Нативный список выбора | 11 |
| F8. Пользовательский список выбора (listbox) | 10 |
| F9. Combobox и мультивыбор с поиском | 4 |
| F10. Ввод тегов | 4 |
| F11. Флажок | 12 |
| F12. Группа флажков и «выбрать все» | 7 |
| F13. Радиогруппа | 9 |
| F14. Карточки выбора | 6 |
| F15. Сегменты в формах | 4 |
| F16. Чипы выбора | 2 |
| F17. Переключатель | 14 |
| F18. Ползунок и диапазон | 10 |
| F19. Загрузка файлов и dropzone | 9 |
| F20. Поле даты и времени | 3 |
| F21. Календарь | 15 |
| F22. Диапазон дат и пресеты | 7 |
| F23. Выбор времени и запись | 7 |
| F24. Колесо выбора | 3 |
| F25. Выбор цвета | 7 |
| F26. Выбор эмодзи | 2 |
| F27. Формы и группы полей | 10 |
| F28. Пошаговая форма | 3 |
| F29. Регистрация и вход | 7 |
| F30. AI-поле ввода | 5 |
| F31. Матрица настроек | 1 |
| F32. Декоративные поля | 2 |
| F33. Холст и аудио | 3 |
| F34. Календарные данные и афиша | 3 |
| F35. Список переходов | 1 |
| **Итого** | **223 из 223** |

Каждый из 223 файлов папки указан ровно в одной основной группе. Перекрёстные ссылки на другие категории даны текстом, без повторного учёта.
