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
Для интерактивных примеров используется локальный сервер: ES-модули витрины
не предназначены для открытия через file://. Сервис слушает только localhost
и отдаёт только файлы внутри `docs/` и `dist/`. После изменения SCSS выполнить
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

В `dist/` лежат обычная и минифицированная версии основного файла и адаптера Telegram,
а также необязательные модули `telegram.js` для синхронизации темы с SDK
и `effects.js` для эффекта нажатия.
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

Для Angular добавить готовый файл в глобальный массив `styles` в `angular.json`:

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "node_modules/t-design-system/dist/t-design-system.css",
              "src/styles.scss"
            ]
          }
        }
      }
    }
  }
}
```

Вставьте путь в существующий массив, сохранив остальные настройки приложения.
`src/styles.scss` после фреймворка содержит ваши переопределения. Стили должны
быть глобальными, а не инкапсулированными стилями компонента. Для SCSS-модулей
используйте описанный ниже `@use`, не extensionless Sass `@import`.

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

Палитры перенесены без изменения 51 исходного значения из `colorSchema` в
`ai-splitter-ng/src/main.ts`, включая `highlight_bg_color` и `highlight_ficus_color`.

| `data-theme` | Исходная палитра | Фон / кнопка |
| --- | --- | --- |
| `light` | `light` | `#f5f5f5` / `#2481cc` |
| `dark` | `desktopDark` | `#18222d` / `#2ea6ff` |
| `ios-dark` | `iosDark` | `#000000` / `#3e88f7` |

Явный выбор переопределяет ОС. Для автоматического режима удалите `data-theme`.
Атрибут `data-platform="ios"` на html выбирает iOS-палитру в автоматическом тёмном
режиме и при `data-theme="dark"`; светлая тема остаётся той же. `ios-dark` всегда
выбирает iOS-палитру независимо от платформы. JS-помощник определяет платформу
через SDK и user agent; CSS самостоятельно не определяет устройство.
Вложенные независимые темы в первой версии не поддерживаются.

| Группа | Публичные переменные |
| --- | --- |
| Цвета | `--bg-color`, `--text-color`, `--hint-color`, `--link-color`, `--button-color`, `--button-text-color` |
| Поверхности | `--section-bg-color`, `--secondary-bg-color`, `--header-bg-color`, `--bottom-bar-bg-color` |
| Семантика | `--accent-text-color`, `--destructive-text-color`, `--subtitle-text-color`, `--section-header-text-color`, `--section-separator-color`, `--highlight-bg-color`, `--highlight-ficus-color` |
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

По умолчанию используются **палитры исходного приложения**, а не цвета из
`Telegram.WebApp.themeParams`. Адаптер читает старые `--tg-*` переменные,
которые устанавливает исходный `applyTheme()`, затем резервные значения
выбранной палитры. Переменные SDK `--tg-theme-*` не подменяют эти цвета.

Чтобы автоматически повторить логику `applyFromTelegram()`:

```js
import { initTelegramTheme } from 't-design-system/telegram/js';

const stopThemeSync = initTelegramTheme(window.Telegram?.WebApp);
// При уничтожении приложения / размонтировании интеграции:
// stopThemeSync();
```

Для HTML без сборщика модуль можно импортировать по пути:

```html
<script type="module">
  import { initTelegramTheme } from '/styles/telegram.js';
  initTelegramTheme(window.Telegram?.WebApp);
</script>
```

SDK Telegram должен быть подключён до вызова помощника. Он подписывается на
`themeChanged`, вызывает `ready()` и сразу применяет тему: `light` до готовности
параметров SDK, `dark` для тёмной Desktop, `ios-dark` для тёмной iOS.
Платформа iOS определяется по `tg.platform` либо `iPad|iPhone|iPod` в user agent,
как в исходном проекте. Устанавливается прежний `--tg-ios-h` (0.8rem для iOS
с готовой темой, иначе 0rem). Обработчик не копирует цвета SDK и не скрывает страницу.

Возвращаемая функция отключает подписку; последняя выбранная тема сохраняется.
Повторные инициализации должны сопровождаться вызовом предыдущей функции очистки.
Без Telegram помощник ничего не меняет: CSS продолжает работать самостоятельно.
Для обычного сайта JavaScript не требуется.

Если нужны именно **цвета пользователя Telegram**, включить отдельный режим:

```html
<html lang="ru" data-telegram-theme="native">
```

В этом режиме порядок резервирования: официальные `--tg-theme-*` → старые
`--tg-*` → выбранная палитра проекта. Отсутствующие цвета SDK дополняются текущей
палитрой. Удаление `data-telegram-theme` возвращает исходные цвета приложения.
Ваш CSS вне слоёв имеет приоритет в обоих режимах.

Документация SDK: [Telegram ThemeParams](https://core.telegram.org/bots/webapps#themeparams).

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
| Сообщение | `.tg-notice`, `--destructive`, `--accent` | Для динамических сообщений приложение задаёт live region |
| Прогресс | `.tg-progress`, `.tg-progress__bar`, `--striped` | Нативный `value/max` или `--progress:42%` с `role="progressbar"` |
| Индикатор | `.tg-spinner`, `--lg` | Декоративный: `aria-hidden="true"`; состояние загрузки на родителе |
| Верхнее уведомление | `.tg-snackbar`, `--show`, `__content` | Приложение управляет текстом и видимостью |
| Загрузка файла | `.tg-upload`, `--dashed`, `--disabled`, `__preview`, `__actions`, `__status` | Нативный `input[type=file]`, label и локальный preview |
| Индикаторы страниц | `.tg-pagination`, `.tg-dot` | `aria-current="page"`; переключение данных реализует приложение |
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
- `.tg-no-radius-top`, `.tg-no-radius-bottom` убирают также стыкующуюся границу.
- `.tg-ios-spacer` потребляет `--ios-h` из Telegram-адаптера.
- `.tg-sr-only`, `.tg-no-select`, `.tg-no-events`, `.tg-text`.

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
| `.notice-block` | `.tg-notice tg-notice--accent` |
| `.spinner` | `.tg-spinner tg-spinner--lg` |
| `.progress`, `.progress__bar` | `.tg-progress`, `.tg-progress__bar` |
| `.overlay-blur` / `.backdrop-blur` | `.tg-glass` / `.tg-glass tg-glass--backdrop` |
| `.btn-dark`, `.btn-light` | `.tg-ripple tg-ripple--dark`, `.tg-ripple tg-ripple--light` |
| `.add-image`, `.add-image-2`, `.thumb` | `.tg-upload`, `.tg-upload--dashed`, `.tg-upload__preview` |
| `.ios-extra` | `.tg-ios-spacer` |
| `.overlay`, `.overlay-2` | `.tg-overlay`, `.tg-overlay--absolute` |
| `.snackbar-container`, `.snackbar-hide` | `.tg-snackbar`, добавление/удаление `.tg-snackbar--show` |
| `.fade-in`, `.fade-out`, `.transition-ot` | `.tg-fade-in`, `.tg-fade-out`, `.tg-transition` |
| `.dot.active` | `.tg-dot[aria-current="page"]` |
| Overlay с `.tg-modal` и атрибутом `open` | Нативный `<dialog class="tg-modal">` с `showModal()` |

Бизнес-подсветка элементов счёта, CDK-overlay, стили маршрутов и Angular-компоненты
остаются в приложении. Все общие `.tg-*` имена сохранены; классы без префикса
переносятся по таблице, а не добавляются глобальными алиасами. Палитры `light`, `desktopDark`, `iosDark` сохранены дословно;
использование цветов SDK Telegram включается только через явный режим `native`.
Исходный проект не изменяется. Лицензия для распространения кода должна быть
определена владельцем отдельно; новая лицензия в этот пакет не добавлялась.

## Эффекты и поверхности

CSS эффектов включён в основной файл; выборочный SCSS — `components/effects`.
Они работают с теми же темами и не требуют Angular.

```html
<button class="tg-btn tg-btn--primary tg-ripple tg-ripple--dark">Нажать</button>
<div class="tg-card tg-glass">Полупрозрачная панель</div>
```

```js
import { initRipple } from 't-design-system/effects/js';
const stopRipple = initRipple(); // по умолчанию document
// Можно ограничить одним контейнером: initRipple(container).
// При размонтировании:
// stopRipple();
```

`tg-ripple--dark` — светлая волна на тёмной поверхности, `--light` — тёмная на
светлой. Вариант `--inline` подходит для текстового фрагмента. `initRipple`
делегирует клики, включая клавиатурную активацию кнопки, не меняет обработчики
действий приложения. Disabled и reduced-motion не создают волну. Узлы эффекта
удаляются после анимации с резервным таймером; cleanup удаляет подписку и волны.
Повторно инициализировать один контейнер следует после вызова предыдущего cleanup.
Тайминги исходника: `--ripple-duration:500ms`, `--ring-duration:600ms`,
`--wash-duration:700ms`. Наличие `effects.js` не обязательно для остальных компонентов.

`.tg-glass` использует blur 15px, `.tg-glass--backdrop` — 25px; без поддержки
backdrop-filter остаётся полупрозрачная поверхность. `.tg-overlay` создаёт
полноэкранную подложку; `--absolute` ограничивает её позиционированным контейнером.
`.tg-fade-in`, `.tg-fade-out` и `.tg-transition` переносят исходные появления и
скрытия. У transition скрытое состояние — `.is-hidden` или `aria-hidden="true"`.
При удалении контента из навигации используйте также `hidden`/`inert` по состоянию
приложения; CSS-эффект не управляет жизненным циклом и фокусом.

Загрузка файла — оформление нативного поля. Реальный upload, проверку размера
и работу с сервером реализует приложение. Для отключённого блока задайте
`.tg-upload--disabled` и `disabled` на вложенном input. Витрина показывает только
локальный preview и не отправляет файлы.

Производные цвета фонов, прозрачность границ и формулы теней восстановлены из
исходного `styles.scss`. Полный состав переноса и осознанные исключения описаны
в [отчёте аудита](docs/source-audit.md) в репозитории.

## Проверки

```sh
npm test                         # сборка и контракт CSS/SCSS
npx playwright install chromium webkit  # один раз, если браузеры не установлены
npm run test:browser              # каталог + аудит исходных стилей + эффекты
npm run test:browser -- --webkit  # те же проверки в WebKit
npm pack --dry-run                # состав архива
npm pack                         # локальный архив для установки
```

Браузерные проверки создают скриншоты в `artifacts/`. Требуется Node.js 20+.
Сам фреймворк не зависит от Node.js; он нужен только для сборки и разработки.
