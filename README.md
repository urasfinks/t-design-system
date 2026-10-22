# t-design-system

CSS-фреймворк на основе визуальной системы **ai-splitter-ng**: мягкие поверхности,
адаптивная типографика, отступы с шагом 4 px и компоненты с префиксом `.tg-*`.
Работает в обычном HTML, Angular и Telegram Mini Apps. JavaScript для работы CSS не нужен.

## Посмотреть

```sh
npm ci
npm run dev
```

Открыть [локальную витрину](http://127.0.0.1:4173/docs/).
Она также открывается напрямую из `docs/index.html` после сборки. Сервис слушает
только localhost и отдаёт только `docs/` и `dist/`. После изменения SCSS выполнить
`npm run build` и обновить страницу.

## Подключить готовый CSS

Скопировать `dist/t-design-system.min.css` в свой проект:

```html
<link rel="stylesheet" href="/styles/t-design-system.min.css">

<article class="tg-card tg-col">
  <h2 class="tg-header__title">Ваш проект</h2>
  <p class="tg-header__subtitle">Готов к следующему шагу.</p>
  <button type="button" class="tg-btn tg-btn--primary">Продолжить</button>
</article>
```

В `dist/` лежат обычная и минифицированная версии основного файла и адаптера Telegram.
Шрифты — системные; сетевые запросы к шрифтовым сервисам отсутствуют.

Пакет предназначен для локального использования (`private: true`). Чтобы получить
переносимый npm-архив:

```sh
npm pack
# В другом проекте:
npm install /path/to/t-design-system-0.1.0.tgz
```

При наличии сборщика:

```js
import 't-design-system/css';
// Или минифицированный файл:
import 't-design-system/css/min';
```

Для Angular добавить в глобальный `src/styles.scss` (не в инкапсулированные стили компонента):

```scss
@import 't-design-system/css';
```

Это CSS-импорт, не устаревший Sass-импорт исходных модулей. Если сборщик не разрешает
экспорт пакета, добавить `node_modules/t-design-system/dist/t-design-system.css`
в массив `styles` в `angular.json`. Не подключать оба способа одновременно.

## Каскад

```css
@layer tds.reset, tds.tokens, tds.themes, tds.base, tds.components, tds.utilities, tds.visibility;
```

Слои объявляются до всех правил, в том числе при выборочном подключении модулей.
Утилиты переопределяют компоненты независимо от порядка классов в HTML.
Обычный пользовательский CSS вне слоёв имеет приоритет над стилями фреймворка.
Фреймворк не использует `!important`. Финальный слой `tds.visibility` сохраняет
приоритет нативного атрибута `hidden` над display компонентов и утилит.

```css
/* Подключить после основного CSS. */
:root {
  --button-color: #18745b;
  --button-text-color: #fff;
  --link-color: #18745b;
  --accent-text-color: #18745b;
  --radius: .75rem;
}

.my-card { max-inline-size: 40rem; }
```

Глобальная база устанавливает box-sizing, фон и типографику body. Она не сбрасывает
отступы заголовков, списков и всех элементов форм страницы. Для компонента
используйте его класс; для ссылок в тексте — `.tg-link`.

Правила [`@layer`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@layer)
и `color-mix()` требуют современного браузера: Chrome/Edge 111+, Firefox 113+,
Safari/iOS 16.2+. Старые WebView не входят в целевую поддержку.

## Темы и токены

По умолчанию тема выбирается по `prefers-color-scheme`. Явный выбор задаётся **на html**:

```html
<html lang="ru" data-theme="dark">
```

Значения `light` и `dark` переопределяют выбор ОС. Для автоматического режима удалите
`data-theme`. Вложенные независимые темы в первой версии не поддерживаются.

| Группа | Публичные переменные |
| --- | --- |
| Цвета | `--bg-color`, `--text-color`, `--hint-color`, `--link-color`, `--button-color`, `--button-text-color` |
| Поверхности | `--section-bg-color`, `--secondary-bg-color`, `--header-bg-color`, `--bottom-bar-bg-color` |
| Семантика | `--accent-text-color`, `--destructive-text-color`, `--subtitle-text-color`, `--section-header-text-color`, `--section-separator-color` |
| Шрифты | `--font-family`, `--fs-xs`, `--fs-sm`, `--fs`, `--fs-lg`, `--fw-regular`, `--fw-medium`, `--fw-semibold` |
| Ритм | `--space-1` … `--space-6`, `--space-8` (4, 8, 12, 16, 20, 24, 32 px при 1rem = 16px) |
| Геометрия | `--radius-xs`, `--radius-sm`, `--radius`, `--radius-lg`, `--radius-pill`, `--control-h`, `--icon-avatar` |
| Детали | `--border-color`, `--shadow-soft`, `--shadow-elev`, `--field-bg`, `--field-bg-hover`, `--safe-area-bottom` |
| Движение | `--duration`, `--duration-fast`, `--ease` |
| Порядок | `--z-sticky`, `--z-overlay`, `--z-toast` |

Цветовые переопределения задавайте на `:root`: производные токены вычисляются там же.
Переменные `--tds-*` — внутренняя палитра резервных цветов; публичным API служат
семантические переменные из таблицы. При смене акцента меняйте цвет текста кнопки
вместе с фоном, сохраняя контраст.

## Telegram Mini Apps

После основного файла подключить адаптер:

```html
<link rel="stylesheet" href="/styles/t-design-system.min.css">
<link rel="stylesheet" href="/styles/telegram.min.css">
```

SDK приложения задаёт официальные `--tg-theme-*` переменные и обновляет их при смене
темы. Адаптер использует их, затем старые `--tg-*` имена из ai-splitter, затем
самостоятельную палитру фреймворка. Без SDK интерфейс остаётся оформленным.
Частичная тема Telegram дополняется резервной палитрой текущего режима.

Пример без Telegram:

```css
:root {
  --tg-theme-button-color: #2678b6;
  --tg-theme-button-text-color: #fff;
}
```

Для резервной тёмной палитры и нативных контролов синхронизируйте `data-theme` с
`Telegram.WebApp.colorScheme` при запуске и событии `themeChanged`. Адаптер не
подключает SDK, не вызывает API и не управляет событиями. Цвета заданы в отдельном
CSS-слое темы; ваши переопределения вне слоёв сохраняют приоритет.

Документация переменных: [Telegram ThemeParams](https://core.telegram.org/bots/webapps#themeparams).

## SCSS по модулям

Все исходники включены в архив. В проекте со стандартным разрешением Sass-путей:

```scss
@use 't-design-system/src/components/buttons';
@use 't-design-system/src/components/forms';
@use 't-design-system/src/utilities';
```

Укажите `node_modules` в Sass `loadPaths`. Компоненты автоматически включают
общие токены, темы и базу; Sass `@use` исключает дублирование в одной сборке.
Навигация включает общий модуль кнопок, от которого зависят чипы.

Поддерживаются также package imports с `sass.NodePackageImporter`:

```scss
@use 'pkg:t-design-system/scss/components/buttons';
@use 'pkg:t-design-system/scss/components/forms';
```

Полный вход: `pkg:t-design-system/scss`. Список модулей — `src/components/`.

## Разметка и состояния

| Компонент | База и модификаторы | Состояние |
| --- | --- | --- |
| Кнопка | `.tg-btn`, `--primary`, `--secondary`, `--ghost`, `--destructive`, `--sm`, `--lg` | `disabled`, `aria-busy`, `data-pressed` |
| Иконкокнопка | `.tg-icon-btn`, `--primary` | Нужен `aria-label` |
| Поля | `.tg-field`, `.tg-label`, `.tg-input`, `.tg-select`, `.tg-textarea`, `.tg-help` | `disabled`, `readonly`, `aria-invalid`, `.tg-help--error` |
| Нативный выбор | `.tg-choice`, `.tg-check`, `.tg-radio` | Нативные `checked`, `disabled` |
| Переключатель | `.tg-switch` + `.tg-switch__knob` | `role="switch"`, `aria-checked` |
| Чип | `.tg-chip` | Для переключения: `role="checkbox"`, `aria-checked` |
| Карточка | `.tg-card`, `.tg-header`, `.tg-header-secondary` | Заголовки `.tg-header__title`, `__subtitle` |
| Список | `.tg-list`, `.tg-list-item`, `__title`, `__subtitle` | `--wrap`, `.tg-list-item-break` |
| Табы | `.tg-tabs`, `.tg-tab` | `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls` |
| Нижняя панель | `.tg-tabbar`, `.tg-tabbar__item` | `aria-current="page"` |
| Аватар | `.tg-avatar`, `.tg-avatar__clip`, `.tg-avatar__initials` | Выбор кнопкой с `role="checkbox"`, `aria-checked` |
| Бейдж | `.tg-badge`, `--primary`, `--secondary`, `--destructive` | Внутри аватара размещается в углу, отдельно — в потоке |
| Сообщение | `.tg-notice`, `--destructive` | Для динамических сообщений приложение задаёт live region |
| Прогресс | `.tg-progress`, `.tg-progress__bar`, `--striped` | Нативный `value/max` или `--progress:42%` с `role="progressbar"` |
| Индикатор | `.tg-spinner` | Декоративный: `aria-hidden="true"`; состояние загрузки на родителе |
| Toast | `.tg-toast`, `.tg-toast--show` | Постоянный контейнер `role="status"`, обновляемый текст |
| Диалог | `dialog.tg-modal`, `--sheet`, `__sheet`, `__header`, `__footer` | Нативные `showModal()` и `close()` |

В таблице `--primary` означает суффикс полного класса, например `.tg-btn--primary`.
Полные примеры доступны в витрине по ссылкам «Посмотреть HTML».

Фреймворк предоставляет **стили**, приложение отвечает за обработчики событий,
клавиатурную навигацию табов и изменение ARIA. В `docs/catalog.js` приведены
рабочие примеры, но этот файл не является runtime-библиотекой.
Для неактивного действия предпочтителен `<button disabled>`: `aria-disabled`
сам по себе не блокирует клики и требует обработчика приложения.

Контролы имеют минимальную высоту 44px; подписи кнопок могут переноситься.
У форм шрифт не меньше 16px, чтобы ввод не увеличивал страницу на iOS.
В режиме `prefers-reduced-motion: reduce` декоративные анимации отключены.

```html
<label class="tg-field">
  <span class="tg-label">Имя</span>
  <input class="tg-input" autocomplete="given-name" placeholder="Ваше имя">
</label>

<button class="tg-switch" type="button" role="switch"
  aria-label="Уведомления" aria-checked="false">
  <span class="tg-switch__knob"></span>
</button>

<dialog class="tg-modal" aria-labelledby="title">
  <div class="tg-modal__sheet">
    <h2 class="tg-header__title" id="title">Подтверждение</h2>
    <form method="dialog" class="tg-modal__footer">
      <button class="tg-btn tg-btn--primary">Закрыть</button>
    </form>
  </div>
</dialog>
```

## Компоновка и утилиты

- `.tg-container`: центрированный контейнер до 72rem с внутренним отступом.
- `.tg-grid`: адаптивные колонки минимум 18rem, одна колонка на узком экране.
- `.tg-row`, `.tg-col`, `.tg-grow`, `.tg-w-full`, `.tg-h-full`.
- `.tg-gap-0` … `.tg-gap-6`, `.tg-p-0` … `.tg-p-6`, `.tg-mt-0` … `.tg-mt-6`, `.tg-mb-0` … `.tg-mb-6`.
- `.tg-text-muted`, `.tg-text-accent`, `.tg-text-destructive`, `.tg-text-sm`, `.tg-text-center`.
- `.tg-card-shadow`, `.tg-card-shadow-none`, `.tg-card-border-radius`, `.tg-no-border`.
- `.tg-no-radius-top`, `.tg-no-radius-bottom`, `.tg-sr-only`.

Отступы и выравнивание используют логические CSS-свойства. Переключатель учитывает
`dir="rtl"` на предке.

## Перенос из ai-splitter

Сохранены основные `.tg-*` компоненты и их подэлементы, размеры `--space-*`, `--fs*`,
`--radius*`, дополнительные `.tg-btn-s0` … `s3`, `.tg-btn-box`, `.tg-tabs-s0` … `s2`,
`.tg-gap-space-1` … `3`, `.tg-row-valign-top`, `.tg-avatar-initials`,
`.tg-avatar-undefined`, `.tg-avatar-size`, `.tg-component-size`,
`.tg-list-item-border-dashed`, `.tg-divider-transparent`.

Непредфиксированные служебные классы приложения не переносятся автоматически:

| Было в приложении | Во фреймворке |
| --- | --- |
| `.w100`, `.h100` | `.tg-w-full`, `.tg-h-full` |
| `.hint-color`, `.text-destructive` | `.tg-text-muted`, `.tg-text-destructive` |
| `.without-border` | `.tg-no-border` |
| `.notice-block` | `.tg-notice` |
| `.spinner` | `.tg-spinner` |
| `.progress`, `.progress__bar` | `.tg-progress`, `.tg-progress__bar` |
| Overlay с `.tg-modal` и атрибутом `open` | Нативный `<dialog class="tg-modal">` с `showModal()` |

Ripple, подсветка элементов счёта, CDK-overlay, стили маршрутов и Angular-компоненты
остаются в приложении. Цвета самостоятельных тем нормализованы для читаемости;
адаптер Telegram сохраняет цвета, которые передаёт SDK.
Исходный проект не изменяется. Лицензия для распространения кода должна быть
определена владельцем отдельно; новая лицензия в этот пакет не добавлялась.

## Проверки

```sh
npm test                         # сборка и контракт CSS/SCSS
npx playwright install chromium webkit  # один раз, если браузеры не установлены
npm run test:browser              # темы, каскад, состояния, размеры, каталог
npm run test:browser -- --webkit  # те же проверки в WebKit
npm pack --dry-run                # состав архива
npm pack                         # локальный архив для установки
```

Браузерные проверки создают скриншоты в `artifacts/`. Требуется Node.js 20+.
Сам фреймворк не зависит от Node.js; он нужен только для сборки и разработки.
