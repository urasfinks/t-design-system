# t-design-system

CSS-фреймворк на основе визуальной системы **ai-splitter-ng**: мягкие поверхности,
адаптивная типографика, отступы с шагом 4 px и компоненты с префиксом `.tg-*`.
Работает в обычном HTML, Angular и Telegram Mini Apps. JavaScript для работы CSS и нативных контролов не нужен.
Волна нажатия для всех кнопок подключается один раз модулем `ui.js`.

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
а также `ui.js` и `effects.js` для стандартной волны нажатия,
и необязательный `telegram.js` для синхронизации темы с SDK.
Для полной интерактивности скопируйте оба файла `ui.js`/`effects.js` рядом и
добавьте `<script type="module" src="/styles/ui.js"></script>`. Сам CSS работает без JS.
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
// Один раз в браузерной точке входа: волна для всех кнопок без дополнительных классов.
import 't-design-system/ui/js';
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

Для работы нужен браузер с поддержкой `@layer`, `color-mix()` и `light-dark()`.
`light-dark()` выбирает цвета границ и бейджей по `color-scheme`
текущей темы. Старые WebView без этих возможностей не входят в целевую поддержку.
Перед встраиванием проверьте целевой WebView; локальные проверки запускаются
в Chromium и WebKit из установленной версии Playwright.

## Темы и токены

По умолчанию тема выбирается по `prefers-color-scheme`. Явный выбор задаётся **на html**:

```html
<html lang="ru" data-theme="dark">
```

Темы основаны на `colorSchema` из `ai-splitter-ng/src/main.ts`. Текущая система
использует четыре входных цвета на тему и общие производные роли. Остальные
исходные цветовые имена сохранены как алиасы; их значения могут отличаться
от исходного приложения. Фон Desktop Dark изменён на `#151e27`.

| `data-theme` | Исходная палитра | Фон / исходный акцент |
| --- | --- | --- |
| `light` | `light` | `#f5f5f5` / `#2481cc` |
| `dark` | `desktopDark` | `#151e27` / `#2ea6ff` |
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
| Ритм | `--space-1` … `--space-6`, `--space-8`, `--space-10`, `--space-12`, `--space-16` (4–64 px при 1rem = 16px) |
| Геометрия | `--radius-xs`, `--radius-sm`, `--radius`, `--radius-lg`, `--radius-pill`, `--control-h`, `--icon-avatar` |
| Детали | `--border-color`, `--shadow-soft`, `--shadow-elev`, `--field-bg`, `--field-bg-hover`, `--safe-area-bottom` |
| Состояния | `--choice-border-color` (граница невыбранных checkbox/radio, ≥3:1), `--action-border-color` и `--border-action` (рамка мелких действий, ≈1.7:1, заметнее рамки панелей), `--disabled-opacity` (единая прозрачность недоступных контролов) |
| Движение | `--duration`, `--duration-fast`, `--ease`, `--duration-fade-in`, `--duration-fade-out` (появление и уход всплывающих слоёв; при reduced motion остаются 120 ms) |
| Порядок | `--z-sticky`, `--z-overlay`, `--z-toast` |

Цветовые переопределения задавайте на `:root`: производные токены вычисляются там же.
Переменные `--tds-*` — внутренняя палитра резервных цветов; публичным API служат
семантические переменные из таблицы. При смене акцента меняйте цвет текста кнопки
вместе с фоном, сохраняя контраст.

### Палитра: четыре цвета × три градации

В Light, Desktop Dark и iOS Dark задаются только четыре исходных цвета:
`--bg-color`, `--button-color` (он же `--accent-main`), `--text-color` и
`--destructive-text-color` (он же `--danger-main`). Роли `*-main` ссылаются
на эти входные значения; фон и акцент каждой темы перечислены выше.

| Семейство | Исходный | Градация 2 | Градация 3 |
| --- | --- | --- | --- |
| Фон | `--background-main` | `--background-panel` | `--background-muted` |
| Акцент | `--accent-main` | `--accent-strong` | `--accent-soft` |
| Текст | `--text-main` | `--text-secondary` | `--text-muted` |
| Ошибка | `--danger-main` | `--danger-strong` | `--danger-soft` |

`color-mix()` используется только для восьми производных цветов в
`src/tokens/_index.scss`. Компоненты, эффекты и каталог используют эти 12 значений
через `var()`, без дополнительных смесей. Старые имена цветов — псевдонимы
палитры; Telegram переопределяет только четыре входных цвета. Проценты фоновых
смесей для Light и iOS Dark заданы отдельно: светлые панели на светло-серой
странице и серые панели на чёрной странице iOS Dark.
В Desktop Dark фоновые градации заданы точно: `--background-main: #151e27`,
`--background-muted: #1d2733`, `--background-panel: #212d3b`.
Порядок яркости совпадает с iOS Dark. В Desktop Dark `--background-panel` и
`--background-muted` фиксированы: переопределение `--bg-color` само по себе
их не меняет. Для собственной фоновой палитры задайте эти две роли на `:root`.
Границы и тени используют нейтральную RGBA-прозрачность.

Фокус поля: активный фон `--field-bg-hover`, рамка основным акцентом и внешнее
кольцо `--accent-soft` толщиной 4px. При `aria-invalid="true"` рамка и внешнее
кольцо используют `--danger-main` и `--danger-soft`.
Высота progress общая для всех вариантов: `--progress-height` (14 px по умолчанию).
Полосы заметные, с мягкими краями: `--progress-stripe-blur: 2px`; их размер и скорость не меняются при изменении процента.
Кнопки используют `--accent-strong` со светлым текстом. Primary-бейджи используют
`--accent-soft` с текстом `--accent-strong` в светлой теме и `--accent-strong`
с текстом `--text-main` в тёмных. Destructive-бейджи следуют той же схеме
с ролями `--danger-*`.

Карточки по умолчанию плоские; `.tg-card-shadow` возвращает опциональную тень.
Кнопки, поля и icon buttons используют один радиус. Чипы и бейджи остаются
капсулами. Базовый текст — 16 px; шкала отступов дополнена `--space-10`,
`--space-12`, `--space-16` (40, 48, 64 px при 1rem = 16px).

Проверки охватывают исходный, зелёный и фиолетовый акценты во всех трёх темах:
читаемость нейтрального текста, геометрию, состояния и границы полей/switch
проверяются в режиме `prefers-contrast: more`. В обычном режиме границы мягкие,
у switch нет отдельной контрастной обводки. Это визуальный режим с меньшим
контрастом границ, а не гарантия WCAG AA для пустого кастомного поля. При произвольной палитре
проверяйте свои пары цветов; при необходимости переопределяйте роли на `:root`.

Сообщение `.tg-notice--destructive` использует мягкую `--notice-danger-bg`,
основной цвет текста и прозрачную границу. Для варианта с иконкой добавьте
`.tg-notice--with-icon`, SVG `.tg-notice__icon` с `aria-hidden="true"` и обёртку
`.tg-notice__content`; заголовок — `.tg-notice__title`. Смысл ошибки передаётся
текстом и формой иконки, а не одной красной заливкой. Старый вариант разметки
без иконки продолжает работать.

## Иконки

Иконки берутся целиком из npm-зависимости [feather-icons](https://github.com/feathericons/feather)
версии 4.29.2 (MIT). Отдельные исходники SVG в репозитории не хранятся.
Сборка копирует все иконки пакета в `dist/icons/<name>.svg`, лицензию — в
`dist/icons-LICENSE.txt`. Общего спрайта нет: браузер запрашивает только SVG,
которые используются на текущей странице, и кеширует каждый файл отдельно.
Feather нужен при сборке TDS; его JavaScript не загружается в браузере.
Добавление иконки не требует правки TDS — используйте любое имя из пакета.

```html
<button class="tg-btn tg-btn--secondary tg-btn--pill">
  <svg class="tg-icon" viewBox="0 0 24 24" aria-hidden="true">
    <use href="/assets/icons/rotate-cw.svg#rotate-cw"></use>
  </svg>
  Обновить
</button>
```

Копируйте каталог `dist/icons/` и лицензию в публичную папку приложения; в примере
это `/assets/`. Все файлы доступны на сервере, но браузер скачивает только
запрошенные иконки. SVG должен отдаваться с того же origin через HTTP. Корень
каждого SVG имеет id с именем иконки: внешний `<use>` сохраняет `currentColor`
и оформление `.tg-icon`. Импорт отдельного ассета: `t-design-system/icons/heart`.

`.tg-icon` задаёт общую сетку 24×24, stroke 2, круглые концы линий, цвет
`currentColor` и размер 20px. `.tg-icon--sm` — 16px, `.tg-icon--lg` — 24px;
токены `--icon-size` и `--icon-stroke` доступны для настройки. Декоративный SVG
имеет `aria-hidden="true"`; кнопка без текста обязательно получает `aria-label`.
Для самостоятельного смыслового SVG задавайте доступное имя.

Варианты `.tg-btn--pill` и `.tg-icon-btn--pill` дают капсульную форму, не меняя
штатные радиусы полей и кнопок. Размер иконки остаётся независимым от размера
текста кнопки. Для собственного inline SVG старое поведение продолжает работать.

## Telegram Mini Apps

После основного файла подключить адаптер:

```html
<link rel="stylesheet" href="/styles/t-design-system.min.css">
<link rel="stylesheet" href="/styles/telegram.min.css">
```

По умолчанию используются **палитры фреймворка**, а не цвета из
`Telegram.WebApp.themeParams`. Адаптер читает четыре старые переменные:
`--tg-bg-color`, `--tg-button-color`,
`--tg-text-color`, `--tg-destructive-text-color`,
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
палитрой. В обоих режимах адаптер связывает только четыре входных цвета;
SDK-параметры для hint, section и других вторичных ролей не используются.
Фиксированные поверхности Desktop Dark сохраняются и в режиме `native`.
Удаление `data-telegram-theme` возвращает режим старых `--tg-*` переменных
с резервными цветами фреймворка.
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
Навигация включает модуль кнопок; чип целиком описан в `components/buttons`.

Исходники читаются сверху вниз: слои → токены → темы → база → компоненты →
утилиты → видимость. Внутри компонента сначала идут общие свойства, затем его
элементы, модификаторы и состояния. Связанные правила вложены через Sass `&`:

```scss
.tg-list {
  overflow: clip;

  &-item {
    padding: var(--space-3) var(--space-4);

    &__title {
      font-size: var(--fs);
      font-weight: var(--fw-semibold);
    }
  }
}
```

Это генерирует прежние `.tg-list-item` и `.tg-list-item__title` без добавления
родительских селекторов и без изменения требований к HTML. Общие свойства
родственных компонентов задаются группой селекторов; модификаторы описывают
отличия. Общая карта `src/themes/_colors.scss` связывает публичные цветовые
токены с палитрой и обоими режимами Telegram. Алиасы отступов `.tg-gap-space-*`
сгруппированы с соответствующими `.tg-gap-*`, без повторного объявления свойств.

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
| Нативный выбор | `.tg-choice`, `.tg-check`, `.tg-radio` | Нативные `checked`, `disabled`; граница без выбора — `--choice-border-color` |
| Числа | `.tg-num`, `.tg-table__num` (на `th`/`td`) | Табличные цифры и выравнивание к концу строки для сумм и количеств |
| Переключатель | `.tg-switch` + `.tg-switch__knob` | `role="switch"`, `aria-checked` |
| Фильтр | `.tg-chip` | `button` с `aria-pressed` (или `role="checkbox"` + `aria-checked` в группе выбора); выбранный — с заливкой |
| Карточка | `.tg-card`, `.tg-header`, `.tg-header-secondary` | Заголовки `.tg-header__title`, `__subtitle` |
| Список | `.tg-list`, `.tg-list-item`, `__title`, `__subtitle` | `--wrap`, `.tg-list-item-break`; строка-переход — `a.tg-list-item[href]` или `button.tg-list-item` |
| Табы | `.tg-tabs`, `.tg-tab` | `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls` |
| Нижняя панель | `.tg-tabbar`, `.tg-tabbar__item` | `aria-current="page"` |
| Аватар | `.tg-avatar`, `--outlined`, `.tg-avatar__clip`, `.tg-avatar__initials` | Статичный `span` без рамки; выбор — `button` с `role="checkbox"`, `aria-checked` и рамкой |
| Бейдж | `.tg-badge`, `--primary`, `--secondary`, `--destructive` | Статус без рамки; `a[href]`/`button` получает рамку и область 44 px. Внутри аватара — в углу |
| Сообщение | `.tg-notice`, `--destructive`, `--accent`, `--with-icon` | Для динамических сообщений приложение задаёт live region |
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

**Правило плашек:** информационные подписи, категории и статусы оформляются без
окантовки. Бордюр у плашки обозначает, что с ней можно взаимодействовать. Например,
«Пространство» использует нейтральный `tg-badge tg-badge--secondary`, а
«Новый проект» — акцентный `tg-badge tg-badge--primary`; оба без рамки.
Для других информационных плашек выбирайте `--secondary` или `--destructive`
по смыслу. Интерактивный элемент оформляйте семантической кнопкой или ссылкой:
одна рамка не добавляет поведения, клавиатурной доступности или роли.

Базовый `.tg-badge` имеет тонкую рамку; не используйте его без модификатора для
неинтерактивной информационной плашки. Модификаторы `--primary`, `--secondary`
и `--destructive` убирают её; у `--secondary` нейтральная заливка и основной
цвет текста. Прямой дочерний бейдж внутри `.tg-avatar` получает собственную
рамку, тень и положение над верхним краем со стороны конца строки; в RTL
сторона меняется. Он не перехватывает нажатия.

`.tg-avatar--outlined` добавляет нейтральную внешнюю рамку шириной 2px,
сохраняя отступ до круга инициалов. Инициалы в этом варианте имеют вес 400.
При `aria-checked="true"` рамка использует `--avatar-selection-ring-color`
с резервным `--control-border-color`; обычный аватар выделяется `--accent-main`.
Клавиатурный фокус имеет отдельный outline. Витрина использует публичные классы аватаров; отдельные миниатюры и дублирующий стек удалены.

Контролы имеют минимальную высоту 44px. Кнопки, icon buttons и чипы используют
единую минимальную высоту `--control-h` (44–48px при базовом шрифте 16px), включая состояния
загрузки и disabled. Модификаторы `--sm` и `--lg` меняют ширину/типографику,
сохраняя ту же минимальную высоту. Многострочная подпись увеличивает контрол по содержимому.
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
переносятся по таблице, а не добавляются глобальными алиасами. Темы `light`,
`desktopDark`, `iosDark` служат основой текущей четырёхцветной системы; изменения
палитры описаны в разделе «Темы и токены». Цвета SDK Telegram включаются
через явный режим `native`.
Исходный проект не изменяется. Лицензия для распространения кода должна быть
определена владельцем отдельно; новая лицензия в этот пакет не добавлялась.

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
| `.overlay-blur` / `.backdrop-blur` | `.tg-glass` использует blur 15px, `.tg-glass--backdrop` — 25px; без поддержки
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

Фоны, границы и тени используют текущие семантические токены. Историю переноса
из исходного `styles.scss` и осознанные исключения можно найти
в [отчёте аудита](docs/source-audit.md) в репозитории.

## Проверки

```sh
npm test                         # сборка и контракт CSS/SCSS
npx playwright install chromium webkit  # один раз, если браузеры не установлены
npm run test:browser              # все восемь наборов браузерных проверок (Chromium)
npm run test:browser -- --webkit  # те же проверки в WebKit
npm pack --dry-run                # состав архива
npm pack                         # локальный архив для установки
```

Браузерный запуск включает каталог, аудит переноса, эффекты, семантические роли,
палитру, focus полей, бейджи и стек аватаров витрины. Проверки создают скриншоты
в `artifacts/`. Требуется Node.js 20+.
Сам фреймворк не зависит от Node.js; он нужен только для сборки и разработки.

Визуальный эталон `tests/fixtures/cascade-baseline/` обновляется только после
ручного просмотра скриншотов: скопируйте `dist/t-design-system.css` и
`docs/catalog.css` в фикстуру и пересчитайте SHA-256 в `manifest.json`
(включая `catalogHTMLSHA256`). Скрипт браузерных проверок останавливается на
первой ошибке.

### Каталог

20 разделов — по одному на задачу — в шести группах: «Основа», «Действия»,
«Ввод», «Содержимое», «Навигация и отклик», «Примеры и интеграция». Каждый живой
пример устроен одинаково: пример → правило применения (`p.example-rule`: когда
использовать, чем заменить и почему компонент выглядит именно так) → «Посмотреть
HTML».

**Рамка у мелких элементов означает «можно нажать».** Статус (`span.tg-badge`) и
обычный аватар — без рамки. Фильтр (`button.tg-chip[aria-pressed]`), бейдж-ссылка,
аватар-кнопка, кнопки всех вариантов, радио, флажки и переключатели, а также бейдж
внутри кликабельной строки — с одной общей рамкой действия `--action-border-color`. Она
едва заметна (.04 в светлой теме, .02 в тёмных): форму несёт заливка, рамка отмечает край;
при `prefers-contrast: more` рамка становится полной. Выбранный фильтр получает заливку. Строка списка, которая куда-то ведёт, — `a.tg-list-item[href]` с
наведением, фокусом и стрелкой; строки данных не реагируют на наведение. Панели
(карточки, списки, таблицы, уведомления) сохраняют свою рамку: она отделяет
содержимое от фона. Подробнее — DESIGN.md → Outline semantics.

Поиск открывается кнопкой «Поиск», клавишей `/` или Cmd/Ctrl+K и ищет по названиям
разделов, классам `.tg-*` и токенам `--*`. Стрелки выбирают результат, Enter
переходит, Escape закрывает. Без JavaScript все разделы и примеры остаются
доступны. Логика витрины разделена на ES-модули: `catalog.js` (точка сборки),
`catalog-navigation.js`, `catalog-search.js`, `catalog-demos.js`, `demo-code.js`.

Checkbox и radio используют `--choice-size: 1.5rem` (24px при базовом шрифте
16px). Дорожка switch на `.125rem` выше (26px) для визуального выравнивания.
У switch ширина пропорциональна высоте,
а область нажатия остаётся высотой `--control-h`.

## Screen compositions

Живой пример и русское описание: [раздел «Композиции»](docs/index.html#compositions).
[Полный экран без CSS приложения](docs/compositions.html) показывает все композиции
вместе; [JavaScript примера](docs/compositions-demo.js) отвечает только за поведение.
Откройте через `npm run dev` → `http://127.0.0.1:4173/docs/#compositions`.

The main stylesheet includes reusable page and discussion compositions. They use
existing palette, typography and geometry tokens; consumers do not need CSS.

```html
<div class="tg-page-shell">
  <header class="tg-page-header">
    <div class="tg-container tg-container--reading tg-row">
      <a class="tg-brand tg-header__title" href="/">Product</a>
      <span class="tg-ms-auto tg-text-sm tg-text-muted">Demo</span>
    </div>
  </header>
  <main class="tg-container tg-container--reading tg-page-content">
    <!-- cards, toolbars, comments -->
  </main>
  <footer class="tg-composer">
    <div class="tg-container tg-container--reading tg-composer__inner tg-col">
      <form class="tg-composer__form">
        <div class="tg-composer__input">
          <textarea class="tg-textarea tg-composer__textarea" rows="1"
                    aria-label="Message"></textarea>
          <button class="tg-icon-btn tg-icon-btn--primary" aria-label="Send">…</button>
        </div>
      </form>
      <div class="tg-composer__caption tg-text-sm tg-text-muted">Help text</div>
    </div>
  </footer>
</div>
```

- `tg-container--reading` limits the existing container to `--layout-reading-width`
  (48rem). `tg-page-content` reserves room for the composer and adds desktop spacing.
- A host may measure the composer with ResizeObserver and set
  `--tg-composer-height` on the page shell or root. Set `--tg-keyboard-inset` to
  the visual viewport's bottom inset when supporting virtual keyboards. Missing
  measurements use a 10rem reserved size and zero keyboard inset. TDS owns styling;
  the host owns listeners, cleanup, textarea autosize and focus management.
- Container block padding accepts `--tg-container-padding-start` and
  `--tg-container-padding-end`; both default to `--space-4`. Page/composer
  compositions supply these properties so utility cascade does not erase spacing.
- `tg-composer__textarea` is a single-line, vertically growing textarea capped at
  `--composer-input-max-size`. Its default minimum is the standard control height.
  Ordinary `tg-textarea` behavior is unchanged.
- `tg-composer__caption` and a direct `tg-avatar-size` child of the form hide on
  mobile. `tg-reply-preview` provides the accent rule and a row for a reply target;
  use `tg-grow` and `tg-truncate` for its excerpt.
- `tg-comment` contains the avatar and `tg-comment__body`. The body contains
  `tg-comment__meta`, `tg-comment__recipient`, `tg-comment__text` and
  `tg-comment__actions`. On mobile the avatar stays beside metadata and content
  spans the full width. `tg-thread` indents replies with a separator. Use standard
  row/spacing/text utilities within those slots. Do not add `tg-row` to the comment
  root or composer form/input: those compositions already provide their layout.
- `tg-toolbar` is a wrapping row with spaced ends; `tg-toolbar--responsive` stretches
  items on mobile. `tg-toolbar--compact` uses the smallest spacing.
  `tg-tabs--responsive` makes tabs full-width on mobile; use on `tg-tabs`.
- `tg-source-link` composes a list link with leading/trailing icons.
- `tg-media` wraps an image and caption; direct images fit within
  `--media-max-size` (55dvh) without cropping. Combine with `tg-col tg-gap-3`.
- Native open `dialog.tg-modal` locks body scrolling. The host still calls
  `showModal()`/`close()` and handles dismissal.

Layout helpers: `tg-block`, `tg-contents`, `tg-nowrap` (flex wrapping),
`tg-text-nowrap`, `tg-truncate`, `tg-ms-auto`, `tg-justify-center`,
`tg-justify-between`, `tg-align-center`, `tg-hide-mobile` (up to 36rem).

Composer and page custom properties must inherit from a shared ancestor. The
styles target modern browsers with `:has()` support, as used by modal scroll lock
and page scroll padding.

## Нижняя раскрывающаяся панель

`tg-bottom-panel` закрепляет сводку у нижнего края экрана и раскрывает содержимое
вверх, как «Мои заказы» в ai-splitter-ng. Это немодальная панель: она не затемняет
страницу и не перехватывает фокус. Заголовок остаётся видимым при прокрутке панели.

[Живой пример](docs/bottom-panel.html) позволяет заменить заказ формой доставки
или длинным списком. В каталоге пример находится в разделе «Навигация».

```html
<details class="tg-bottom-panel">
  <summary class="tg-bottom-panel__header">
    <span>Итого с меня:</span>
    <strong class="tg-ms-auto">2 400 ₽</strong>
    <svg class="tg-icon tg-bottom-panel__chevron" viewBox="0 0 24 24" aria-hidden="true">
      <use href="dist/icons/chevron-up.svg#chevron-up"></use>
    </svg>
  </summary>
  <div class="tg-bottom-panel__content">
    <!-- Любая разметка: список, форма, итог, кнопки -->
    <p>Паста с грибами — 1 200 ₽</p>
    <p>Овощи на гриле — 800 ₽</p>
    <p>Лимонад — 400 ₽</p>
  </div>
</details>
```

Нативные `details`/`summary` переключаются мышью, Enter и Space без JS. Атрибут
`open` задаёт начальное раскрытие; событие `toggle` позволяет следить за состоянием.
Не помещайте дополнительные кнопки или поля внутрь `summary`: используйте блок
с отдельной кнопкой, если заголовку нужны независимые действия.

| API | Назначение |
| --- | --- |
| `.tg-bottom-panel` | Закреплённая поверхность с ограниченной высотой и прокруткой |
| `__header` | Постоянно видимый заголовок: `summary` или `button` |
| `__content` | Произвольное содержимое с отступами и верхним разделителем |
| `__chevron` | Необязательная стрелка: поворот при `open` или `aria-expanded="true"` |
| `--bottom-panel-max-height` | Максимальная высота; по умолчанию `85dvh` |
| `--bottom-panel-width` | Ширина; по умолчанию `100%`, ограничена экраном и центрирована |
| `--bottom-panel-offset` | Отступ от низа; по умолчанию `0px` |

Переменные задавайте на самой панели, например
`style="--bottom-panel-width: 48rem; --bottom-panel-max-height: 70dvh"`.
Панель учитывает `--safe-area-bottom` и использует слой `--z-sticky`.
Размещайте её у корня приложения: предки с `transform`, `filter` или `contain`
могут изменить область фиксации. Добавьте странице `padding-bottom` под высоту
свёрнутой панели, например `calc(6rem + var(--safe-area-bottom))`; увеличьте его
для многострочного заголовка. Раскрытая панель перекрывает нижнюю часть страницы.
Высота ограничена экраном; длинное содержимое прокручивается под заголовком.

### Управление из Angular

Компонент не зависит от Angular: заголовок и тело полностью задаёт приложение.
В классе standalone-компонента создайте `expanded = signal(false)`
(`import { signal } from '@angular/core'`). В шаблоне:

```html
<section class="tg-bottom-panel" aria-label="Мои заказы">
  <button type="button" class="tg-bottom-panel__header"
          [attr.aria-expanded]="expanded()" aria-controls="my-orders-content"
          (click)="expanded.set(!expanded())">
    <span>Итого с меня:</span>
    <strong class="tg-ms-auto">{{ total() }}</strong>
    <svg class="tg-icon tg-bottom-panel__chevron" viewBox="0 0 24 24" aria-hidden="true">
      <use href="assets/icons/chevron-up.svg#chevron-up"></use>
    </svg>
  </button>
  <div id="my-orders-content" class="tg-bottom-panel__content" [hidden]="!expanded()">
    <!-- Ваш шаблон заказа или другой контент -->
    <ng-content></ng-content>
  </div>
</section>
```

`total()` здесь — сигнал или метод приложения с итоговой суммой. Для нескольких
панелей задавайте уникальные пары `id`/`aria-controls`. `hidden` скрывает также
интерактивные элементы от клавиатуры. Перед программным сворачиванием верните
фокус на кнопку, если он находится внутри тела панели. Жесты перетаскивания и
автоматическое закрытие по Escape не входят в CSS-компонент.


## Общий стандарт компонентов

[Критерии компонента](docs/component-standard.md) дополняют этот README.
Вся система каскадируется: tokens → themes → base → components → utilities →
visibility. Каждый SCSS-модуль включает нужную базу; нет `!important` и отдельной
палитры для новых компонентов. Утилиты имеют приоритет над компонентами, обычный
CSS приложения вне слоёв может переопределять их. Нативный `hidden` сохраняет
приоритет над display. Локальные custom properties предназначены для настройки
экземпляра и измерений, а не для обхода общих ролей.

Витрина показывает компоненты и состояния; её CSS отвечает за раскладку документа.
Примеры не служат альтернативной реализацией компонентов. Список Feather берётся
из той же зависимости, что и SVG, поэтому галерея не отстаёт от поставки.

### Новые паттерны

Все классы ниже входят в основной CSS; выборочный SCSS — `components/patterns`.
Тексты и содержимое задаёт приложение. Новый код не требует Angular.

| Компонент | Классы | Когда применять |
| --- | --- | --- |
| Поиск | `tg-search`, `__icon`, `__input`, `__clear` | Поиск по данным; фильтрацию выполняет приложение |
| Пустое состояние | `tg-empty`, `__title`, `__description`, `__icon`, `__action` | Данных пока нет или фильтр ничего не нашёл |
| Раскрытие | `details.tg-disclosure`, `summary.__trigger`, `__content` | Дополнительные сведения внутри страницы |
| Skeleton | `tg-skeleton`, `--text`, `--circle` | Начальная загрузка без известного процента; статичен, без лишней анимации |
| Таблица | `tg-table-wrap`, `table.tg-table` | Сравнение строк с общими столбцами |
| Путь | `nav.tg-breadcrumbs` с `ol` | Иерархия страниц; последний пункт `aria-current="page"` |
| Сводка | `dl.tg-summary`, `__row` | Свойства одного объекта; каждая строка содержит `dt`/`dd` |
| Группа полей | `fieldset.tg-fieldset` с `legend` | Связанные нативные поля с общим названием |
| Сводка ошибок | `tg-error-summary`, `__title` | Ошибки после проверки формы, ссылки к полям |
| Диапазон | `input.tg-range[type=range]` | Нативный диапазон с label, min/max/step |

```html
<form role="search" aria-label="Поиск заказов">
  <label class="tg-label" for="orders-search">Найти заказ</label>
  <div class="tg-search">
    <input class="tg-search__input" id="orders-search" type="search">
    <button type="reset" class="tg-icon-btn tg-search__clear" aria-label="Очистить поиск">
      <svg class="tg-icon" viewBox="0 0 24 24" aria-hidden="true">
        <use href="dist/icons/x.svg#x"></use>
      </svg>
    </button>
  </div>
</form>

<details class="tg-disclosure">
  <summary class="tg-disclosure__trigger">Условия доставки</summary>
  <div class="tg-disclosure__content">Ваше содержимое</div>
</details>

<dl class="tg-summary">
  <div class="tg-summary__row"><dt>Итого</dt><dd>2 400 ₽</dd></div>
</dl>
```

Для контролируемого поиска синхронизируйте reset и состояние приложения.
Скрывайте декоративные skeleton через `aria-hidden="true"`, ставьте `aria-busy`
на обновляемую область и снимайте после загрузки; отдельный status сообщает ход
загрузки. Минимальная ширина таблицы настраивается через `--table-min-width` (по умолчанию 32rem).
Таблице нужны `caption`, заголовки `th scope`, а прокручиваемой оболочке —
доступное название и `tabindex="0"`. Сводке ошибок задайте `tabindex="-1"`, переводите
на неё фокус после неуспешной проверки; сообщения у полей связывайте через
`aria-describedby` и `aria-invalid`. Компонент оформляет ошибки, не валидирует форму.

### Рабочие компоненты (P0 по архиву 21st.dev)

Живой экран без CSS приложения: [docs/workspace.html](docs/workspace.html), поведение
примера — [docs/workspace-demo.js](docs/workspace-demo.js). Спецификации —
`references/21st-dev-1000/images/*/components.md`.

Компоненты встроены в каскад, а не дописаны поверх: системные значения
(`--font-family-mono`, `--fs-display`, маски `--icon-mask-check`, `--icon-mask-chevron-right`,
`--icon-mask-chevron-down`) живут в tokens; фокус, наследование шрифта и disabled —
в base; hover и переход — в общем `control-states` (владелец задаёт только
`--control-idle-bg`, `--control-hover-bg`, `--control-hover-filter`, а меню делает
окраску мгновенной через `--control-paint-duration`). Поиск и группа полей используют
одну поверхность `components/field-surface`.

| Компонент | Классы | Состояния и обязанности приложения |
| --- | --- | --- |
| Меню действий | `.tg-menu` (лучше с `popover`), `__item`, `--destructive`, `__text`, `__item-meta`, `__label`, `__separator`, `__shortcut` | `role=menu/menuitem/menuitemcheckbox/menuitemradio`, `aria-checked`, `aria-disabled`, `aria-haspopup="menu"` у пункта даёт шеврон. Приложение: ↑/↓, Home/End, поиск по букве, Escape с возвратом фокуса, Tab закрывает; `data-instant` при открытии с клавиатуры. Без CSS anchor positioning хост задаёт `--tg-anchor-block`, `--tg-anchor-inline`, `--tg-menu-origin` и `data-positioned`. На узком сенсорном экране меню становится нижним листом |
| Кнопка: части | `.tg-btn__icon`, `__label`, `__subtext`, `.tg-btn--icon-end` | Иконка после подписи — `--icon-end`, порядок логический и в RTL. Любая кнопка — ровно `--control-h` по высоте, подпись в одну строку; `__subtext` помещается в ту же высоту; не влезающая подпись в `__label` сокращается многоточием (полное имя остаётся у кнопки) |
| Кнопка: ход выполнения | `[aria-busy]`, `.tg-btn__states > [data-state=idle/busy/success/error]`, `data-state` на кнопке, `.tg-btn__progress` + `--progress` (0…1) | Все подписи в одной ячейке — ширина не прыгает; видна только активная. Итог объявляет приложение |
| Кнопка-переключатель | `.tg-toggle[aria-pressed]` | Тот же вид выбора, что у `.tg-btn--stacked` |
| Группа полей | `.tg-input-group`, `__control`, `__addon` (текст или `select`), `__action` | Рамка, фон и фокус — у обёртки; `aria-invalid`, `disabled`, `readonly` на контроле |
| Требования к значению | `.tg-requirements`, `__item[data-met]`, `--invalid` | Информация при вводе; ошибкой становится только после неудачной отправки |
| Описание выбора, группы | `.tg-choice__description`, `.tg-choice-group`, `--nested` | Вложенные варианты начинаются под текстом родителя; `indeterminate` задаёт приложение |
| Зоны карточки | `.tg-card__media` (+ `--card-media-ratio`), `__body`, `__footer`, `.tg-card--interactive`, `.tg-card--link` + `.tg-card__link` | Карточка-ссылка растягивает одну ссылку заголовка; вложенные кнопки в ней запрещены |
| Показатель | `.tg-stat`, `__label`, `__value`, `__meta`, `__delta` | Изменение — текст со знаком в бейдже, не только цвет |
| Таблица | `.tg-table--compact`, `--stack` (+ `data-label` у ячеек), `--caption-bottom`, `__cell-main`, `__cell-meta`, `__select`, `__sort` | `aria-sort` на `th`, выбор строк — флажком (строка подсвечивается сама), сортировку и объявление делает приложение |
| Массовые действия | `.tg-bulk-bar` | Счётчик в `role=status`; на телефоне прилипает к низу |
| Аккордеон | `.tg-accordion`, `--separate`, `__controls`, `.tg-disclosure__meta` | Нативные `details`; один открытый раздел — атрибут `name` |
| Сообщение: действия | `.tg-notice__actions`, `__dismiss` | Закрытие и его запоминание — приложение |
| Диалог | `.tg-modal__body`, `dialog.tg-modal--side` | Тело прокручивается, шапка и действия на месте; боковая панель у inline-end |
| Аватары | `.tg-avatar-group`, `__more` (+ `--avatar-group-ring`) | Имя группы — `aria-label` |
| Точка статуса | `.tg-badge__dot` | Повторяет цвет текста бейджа |
| Навигация | `.tg-tabs--underline`, `.tg-site-nav`, `__link[aria-current]`, `.tg-page-header--sticky`, `.tg-pager`, `__link`, `__ellipsis`, `__info` | Сегментные табы остаются видом по умолчанию; `.tg-pagination` — для каруселей |
| Чат с ассистентом | `.tg-chat`, `__log` (`role=log`), `.tg-message`, `--user`, `--assistant`, `__body`, `__meta`, `__actions`, `data-state=streaming/done/stopped/error`; `.tg-composer__toolbar`, `__attachments` | Стриминг, остановка, объявление начала и конца ответа, санитизация Markdown — приложение |

### Компоненты по архиву 21st.dev (волны 0–8)

Все 107 компонентных спецификаций из `references/21st-dev-1000/images/*/components.md`
реализованы и показаны в [docs/index.html](docs/index.html) (у каждого примера
`data-spec="ID"`). SH2 (материалы кнопки), F32 (декоративное свечение поля) и SH3 (живой аватар) удалены по решению владельца: у полей одна общая подсветка фокуса. Секции лендингов и композиции из готовых классов остаются
документацией. Статус каждой спецификации — `references/21st-dev-1000/implementation.json`,
сверка — `node scripts/verify-implementation.mjs` (код 0, когда готовы все), план —
`docs/superpowers/plans/2026-10-27-full-component-implementation.md`.

Общие движки (`floating`, `option`, `selected`, `steps`, `track`, `field-surface`) описаны в
[docs/component-standard.md](docs/component-standard.md). Поведение примеров — в
`docs/catalog-components.js`: это образец того, что делает приложение (клавиатура, фокус,
объявления), а не часть CSS.

Эффекты подключаются отдельно:

```js
import { initEffects } from 't-design-system/effects/js';
const dispose = initEffects(); // указатель для .tg-effect-*, холсты .tg-effect-layer, рябь карусели
```

| ID | Компонент | Классы и атрибуты |
| --- | --- | --- |
| **0. Основа и движки** | | |
| B8 | Сегментированный выбор | `.tg-segmented`, `.tg-segmented__item`, `.tg-segmented--vertical` |
| B15 | Подсказка | `.tg-tooltip` |
| **1. Примитивы** | | |
| A1 | Композер запроса | `.tg-composer__toolbar`, `.tg-composer__attachments` |
| B4 | Кнопка копирования | `.tg-copy`, `.tg-copy__value`, `.tg-copy__action` |
| B5 | Кнопка с ходом выполнения | `.tg-btn__progress`, `.tg-btn__states` |
| B9 | Группа кнопок и сплит-кнопка | `.tg-btn-group`, `.tg-btn-group--attached`, `.tg-split-btn`, `.tg-split-btn__main`, `.tg-split-btn__menu` |
| B13 | Панель инструментов и dock | `.tg-toolbar--floating`, `.tg-toolbar__separator` |
| B17 | Toast, snackbar и баннер-уведомление | `.tg-toast__action` |
| C2 | Медиа-карточка | `.tg-card--overlay`, `.tg-card__media--video` |
| C11 | Хронология и ход процесса | `.tg-timeline`, `.tg-timeline__item`, `.tg-timeline__marker`, `.tg-timeline__time` |
| C17 | Раскрывающаяся карточка | `.tg-card--disclosure` |
| CT1 | Баннер-объявление | `.tg-banner`, `.tg-banner--sticky`, `.tg-banner--accent`, `.tg-banner__content`, `.tg-banner__action`, `.tg-banner__dismiss` |
| D1 | Таблица данных | `.tg-table--compact`, `.tg-table--stack`, `.tg-table__cell-main`, `.tg-table__cell-meta` |
| F1 | Текстовое поле и многострочный ввод | `.tg-label__required` |
| F28 | Пошаговая форма | `.tg-stepper`, `.tg-stepper__step`, `.tg-stepper__marker`, `.tg-stepper__label` |
| M3 | Toast и стек уведомлений | `.tg-toast-region`, `.tg-toast__title`, `.tg-toast__action`, `.tg-toast__close` |
| M7 | Линейный прогресс | `.tg-progress--destructive` |
| M8 | Круговой прогресс | `.tg-progress-ring`, `.tg-progress-ring__track`, `.tg-progress-ring__value`, `.tg-progress-ring__label` |
| M9 | Шаги процесса | `.tg-stepper--vertical` |
| M10 | Хронология | `.tg-timeline--horizontal` |
| M15 | Клавиши и сочетания | `.tg-kbd` |
| M19 | Индикатор ожидания | `.tg-spinner` |
| N1 | Вкладки | `.tg-tabs--underline`, `.tg-tabs--segmented` |
| S2 | Внешние провайдеры, SSO и «сначала идентификатор» | `.tg-divider--label` |
| **2. Выбор и ввод** | | |
| C5 | Всплывающая карточка (hover card) | `.tg-hover-card` |
| D3 | Панель фильтров, поиска и столбцов | `.tg-table-toolbar` |
| F4 | Числовое поле со степпером | `.tg-number`, `.tg-number__step`, `.tg-number__input` |
| F5 | Код подтверждения (OTP) | `.tg-otp`, `.tg-otp__input`, `.tg-otp__slot`, `.tg-otp__separator` |
| F6 | Поле поиска | `.tg-search` |
| F7 | Нативный список выбора | `.tg-select` |
| F8 | Пользовательский список выбора (listbox) | `.tg-listbox-trigger`, `.tg-listbox`, `.tg-listbox__option`, `.tg-listbox__option-meta` |
| F9 | Combobox и мультивыбор с поиском | `.tg-combobox`, `.tg-combobox__input`, `.tg-combobox__list` |
| F10 | Ввод тегов | `.tg-tag-input`, `.tg-tag-input__tag`, `.tg-tag-input__remove`, `.tg-tag-input__field` |
| F13 | Радиогруппа | `.tg-radio` |
| F14 | Карточки выбора | `.tg-choice-card`, `.tg-choice-card__media`, `.tg-choice-card__title`, `.tg-choice-card__description`, `.tg-choice-card__indicator` |
| F16 | Чипы выбора | `.tg-chip` |
| F17 | Переключатель | `.tg-switch` |
| F18 | Ползунок и диапазон | `.tg-range-field`, `.tg-range-field__output`, `.tg-range-dual` |
| F19 | Загрузка файлов и dropzone | `.tg-upload__list`, `.tg-upload__item` |
| **3. Навигация и структура** | | |
| G1 | Карусель изображений | `.tg-carousel--peek`, `.tg-carousel__thumbs`, `.tg-carousel--vertical` |
| M22 | Затухание края прокрутки | `.tg-scroll-fade` |
| N2 | Раскрывающиеся иконочные вкладки | `.tg-tabs--collapsed-labels`, `.tg-tab__label` |
| N3 | Вертикальные вкладки и навигация настроек | `.tg-tabs--vertical` |
| N5 | Мега-меню и выпадающая навигация | `.tg-nav-menu`, `.tg-nav-menu__trigger`, `.tg-nav-menu__panel`, `.tg-nav-menu__group`, `.tg-nav-menu__link` |
| N6 | Мобильная навигация | `.tg-tabbar` |
| N8 | Строка меню (menubar) | `.tg-menubar`, `.tg-menubar__item` |
| N10 | Палитра команд | `.tg-command`, `.tg-command__input`, `.tg-command__list`, `.tg-command__group`, `.tg-command__item`, `.tg-command__shortcut`, `.tg-command__footer` |
| N11 | Боковая панель | `.tg-sidebar`, `.tg-sidebar__header`, `.tg-sidebar__section`, `.tg-sidebar__link`, `.tg-sidebar__footer`, `.tg-sidebar--collapsed` |
| N13 | Оглавление | `.tg-toc`, `.tg-toc__link`, `.tg-toc__link--nested` |
| N14 | Список разделов со счётчиками | `.tg-list-item` |
| N16 | Навигация карусели | `.tg-carousel`, `.tg-carousel__viewport`, `.tg-carousel__slide`, `.tg-carousel__controls` |
| **4. Дата и время** | | |
| F20 | Поле даты и времени | `.tg-date-field`, `.tg-date-field__segment` |
| F21 | Календарь | `.tg-calendar`, `.tg-calendar__header`, `.tg-calendar__grid`, `.tg-calendar__day`, `.tg-calendar__day--today`, `.tg-calendar__day--outside`, `.tg-calendar__event-dot` |
| F22 | Диапазон дат и пресеты | `.tg-calendar--range`, `.tg-calendar__day--range-start`, `.tg-calendar__day--in-range`, `.tg-calendar__day--range-end`, `.tg-calendar__presets` |
| **5. Данные** | | |
| C12 | Статусные карточки | `.tg-notice` |
| C16 | Bento-сетка | `.tg-grid--bento` |
| D5 | Состояния загрузки таблицы | `.tg-skeleton`, `.tg-empty` |
| D6 | Сортируемый список | `.tg-sortable`, `.tg-sortable__item`, `.tg-sortable__handle` |
| D7 | Линейные и площадные графики | `.tg-chart`, `.tg-chart__header`, `.tg-chart__plot`, `.tg-chart__legend`, `.tg-chart__legend-item`, `.tg-chart__tooltip`, `.tg-chart__data` |
| D8 | Столбчатые графики | `.tg-chart--bar` |
| D9 | Кольцевые и круговые диаграммы | `.tg-chart--donut`, `.tg-chart__center` |
| M11 | Расписание по времени | `.tg-schedule`, `.tg-schedule__axis`, `.tg-schedule__row`, `.tg-schedule__event` |
| **6. Ассистент, текст, карточки контента** | | |
| A5 | Ход работы агента и результаты инструментов | `.tg-agent-step`, `.tg-agent-step__icon`, `.tg-agent-step__label`, `.tg-agent-step__time`, `.tg-agent-step__detail` |
| A6 | Подтверждение действия агента | `.tg-approval`, `.tg-approval__title`, `.tg-approval__description`, `.tg-approval__options`, `.tg-approval__actions` |
| B1 | Базовая кнопка и варианты | `.tg-btn` |
| B3 | Иконкокнопка | `.tg-icon-btn` |
| B16 | Диалог и выдвижная панель | `.tg-modal` |
| PR2 | Карточка тарифа | `.tg-card--featured`, `.tg-price`, `.tg-feature-list`, `.tg-feature-list__item--off` |
| TS1 | Карточка отзыва | `.tg-testimonial`, `.tg-testimonial__quote`, `.tg-testimonial__author`, `.tg-testimonial__rating`, `.tg-testimonial__media` |
| T1 | Оболочка редактора и выделение блоков | `.tg-editor`, `.tg-editor__toolbar`, `.tg-editor__content`, `.tg-editor__status`, `.tg-editor__block` |
| T2 | Панель у выделения | `.tg-selection-toolbar` |
| **7. Продвинутые компоненты** | | |
| B6 | Подтверждение удержанием или свайпом | `.tg-hold-btn`, `.tg-slide-confirm` |
| B12 | Плавающая кнопка и меню быстрых действий | `.tg-fab`, `.tg-fab--extended`, `.tg-fab-menu`, `.tg-fab-menu__list`, `.tg-fab-menu__item` |
| C15 | Стопка и колода карточек | `.tg-card-stack`, `.tg-card-stack__item`, `.tg-card-stack__controls` |
| C21 | Медиаплеер и сравнение изображений | `.tg-player`, `.tg-player__cover`, `.tg-player__meta`, `.tg-player__controls`, `.tg-player__progress`, `.tg-compare`, `.tg-compare__before`, `.tg-compare__after`, `.tg-compare__handle` |
| F24 | Колесо выбора | `.tg-wheel`, `.tg-wheel__column`, `.tg-wheel__option` |
| F25 | Выбор цвета | `.tg-color-field`, `.tg-color-field__swatch`, `.tg-color-field__input`, `.tg-color-picker`, `.tg-color-picker__area`, `.tg-color-picker__hue`, `.tg-color-picker__swatches` |
| F26 | Выбор эмодзи | `.tg-emoji-picker`, `.tg-emoji-picker__search`, `.tg-emoji-picker__grid`, `.tg-emoji-picker__option` |
| F33 | Холст и аудио | `.tg-selection-box`, `.tg-selection-box__handle`, `.tg-waveform`, `.tg-waveform__track`, `.tg-waveform__bar`, `.tg-waveform__progress` |
| G4 | Аккордеон изображений | `.tg-image-accordion`, `.tg-image-accordion__item`, `.tg-image-accordion__trigger`, `.tg-image-accordion__panel` |
| TS4 | Бегущая лента отзывов | `.tg-marquee`, `.tg-marquee__track`, `.tg-marquee--vertical`, `.tg-marquee__pause` |
| **8. Эффекты** | | |
| B19 | Декоративные эффекты кнопок | `.tg-effect-sheen`, `.tg-effect-border-beam`, `.tg-effect-magnetic` |
| C18 | Декоративные эффекты карточек | `.tg-effect-tilt`, `.tg-effect-spotlight` |
| G2 | 3D-карусели и coverflow | `.tg-carousel--coverflow`, `.tg-carousel--fan`, `.tg-carousel--ring` |
| SH1 | Декоративный слой фона | `.tg-effect-layer` |
| SH4 | Переход слайдов с эффектом | `.tg-carousel[data-tg-effect]` |

### Полная галерея Feather

В разделе «Иконки» доступны все 287 иконок feather-icons 4.29.2: поиск по именам
и тегам (а также распространённым русским названиям), размеры 16/20/24, выбор и
копирование SVG. Если Clipboard API недоступен, разметка выделяется для ручного
копирования. `dist/icons.json` содержит `{name, tags}` для собственного каталога;
экспорт — `t-design-system/icons.json`. SVG остаются отдельными файлами.

Компонентная модель сопоставлена с официальными каталогами
[Carbon](https://www.carbondesignsystem.com/building-blocks/core/components/overview/components)
и [GOV.UK](https://design-system.service.gov.uk/components/). Используются общие
паттерны и нативная семантика; визуальный контракт TDS сохраняется.
Сложные combobox, календарь, tree и редактируемая data grid в этот набор не входят.


Дополнительная минимальная разметка паттернов (полные живые примеры — в каталоге):

```html
<div class="tg-empty">
  <h2 class="tg-empty__title">Ничего не найдено</h2>
  <p class="tg-empty__description">Измените условия поиска.</p>
</div>

<div aria-busy="true" aria-label="Данные загружаются">
  <span class="tg-skeleton tg-skeleton--text" aria-hidden="true"></span>
</div>

<div class="tg-table-wrap" role="region" aria-label="Заказы" tabindex="0">
  <table class="tg-table">
    <caption>Заказы</caption>
    <thead><tr><th scope="col">Номер</th><th scope="col">Сумма</th></tr></thead>
    <tbody><tr><th scope="row">123</th><td>2 400 ₽</td></tr></tbody>
  </table>
</div>

<nav class="tg-breadcrumbs" aria-label="Путь">
  <ol><li><a href="/">Главная</a></li><li aria-current="page">Заказы</li></ol>
</nav>

<fieldset class="tg-fieldset">
  <legend>Чаевые</legend>
  <label for="tips">Процент</label>
  <input class="tg-range" type="range" id="tips" min="0" max="30" step="5" value="10">
</fieldset>

<section class="tg-error-summary" tabindex="-1" aria-labelledby="error-title">
  <h2 class="tg-error-summary__title" id="error-title">Проверьте данные</h2>
  <ul><li><a href="#contact-email">Укажите полный адрес почты</a></li></ul>
</section>
<label class="tg-label" for="contact-email">Почта</label>
<input class="tg-input" id="contact-email" type="email"
       aria-invalid="true" aria-describedby="contact-error">
<p class="tg-help tg-help--error" id="contact-error">Укажите полный адрес почты.</p>
```

Поиск поддерживает `disabled`, `readonly`, `aria-invalid="true"`; общий фон и
кольцо фокуса принадлежат оболочке. Для композиции с кнопками/иконками при
выборочном SCSS подключите также `components/buttons` и `components/icons`.
В галерее иконок Tab входит на одну ячейку, стрелки/Home/End перемещают фокус,
Enter/Space выбирают иконку, следующий Tab выходит из галереи. Размеры
16/20/24 — при базовых 16px; rem сохраняет масштабирование текста.


### Совместимость с исходной сборкой

Ядро открыто для рефакторинга. Сохраняются внешний вид, публичные `.tg-*` классы,
поведение и пути импорта, а не текст исходников исторического коммита.
Проверки сравнивают вычисленные стили и пиксели всего каталога с сохранённой
версией до рефактора в трёх темах, ширинах и акцентах.

Общие состояния подключаются из `base` до компонентов. Кнопки, поля, иконки,
интерактивные бейджи и composer содержат свои окончательные правила в модулях
владельцев, без последующего исправления через extensions. Для выборочного SCSS
подключайте `components/buttons`, `components/forms`, `components/avatar` и
`components/compositions` по назначению. Старый `components/extensions` остаётся
совместимым входом к этим модулям, собственных переопределений в нём нет.

Акцент меняется на `:root` через `--button-color` и применяется ко всему интерфейсу.
Зелёный и фиолетовый в каталоге — альтернативы исходному акценту. Одновременные
локальные палитры и вложенные темы не входят в контракт этой сборки.

`ui.js` автоматически включает волну нажатия для кнопок, кнопочных ссылок
и интерактивных аватаров, включая динамически добавленные элементы.
Переключатели `.tg-switch` и `[role="switch"]` исключены из общего эффекта кнопки.
Дополнительный класс не нужен. Disabled/aria-disabled не анимируются; при
`prefers-reduced-motion: reduce` волна не запускается. Старые `.tg-ripple`-варианты
и низкоуровневый `initRipple` из `effects.js` сохраняют прежний контракт.

Для управления жизненным циклом используйте `initUI(container)` из `ui.js`:
функция возвращает cleanup, повторный вызов для того же корня не дублирует эффект.
Для выборочного SCSS-импорта общего отклика подключите `components/button-feedback`.
Обрезается только внутренний слой анимации; бейджи и фокус остаются видимыми.


Точечные уточнения компонентов: `tg-search__clear` не рисует собственную рамку и
подложку в покое; крестик использует `--text-secondary`. При наведении меняется
только цвет иконки, фон остаётся прозрачным. Область кнопки примыкает к внутреннему
краю поля без правого отступа; клавиатурный фокус сохраняется. Заказы собираются из общего списка: внешняя оболочка
`tg-bottom-panel tg-bottom-panel--list` только закрепляет блок и задаёт отступы.
Внутри неё — `details.tg-list`, первая строка
`summary.tg-list-item.tg-row.tg-bottom-panel__trigger` показывает итог и раскрывает
остальные строки `tg-list-item`. Обёртка строк использует `tg-contents`, без
вложенного `tg-list`, собственной рамки или сброшенных радиусов. При замене
позиций формой обёртка получает `tg-p-4` вместо `tg-contents`.

Выравнивание текста `tg-composer__textarea` находится в `components/compositions`,
рядом с остальными правилами компоновщика. При самостоятельном autosize учитывайте толщину рамки:
высота border-box равна `scrollHeight` плюс верхняя и нижняя рамки.


### Общий hover кнопок

`components/control-states` подключается общей базой; `components/control-hover`
сохранён как совместимый выборочный вход вместе с reset/base/focus/visibility. Доступные кнопки, кнопки-ссылки,
chips, tabs (включая выбранные), нижняя навигация, пагинация,
интерактивные аватары, бейджи и триггеры раскрытия получают одинаковый отклик:
залитые сохраняют семантическую заливку и меняют яркость, прозрачные получают
подложку `--surface-muted`. В светлой теме коэффициент яркости — `.92`, в тёмных —
`1.15`; его можно переопределить через `--control-hover-brightness`.

Hover работает только при наличии указателя с наведением. `disabled`,
`aria-disabled="true"` и недоступные предки не реагируют. Геометрия, выбранное
состояние и рамка фокуса сохраняются. При reduced motion подсветка меняется без
перехода; стандартная волна нажатия продолжает управляться `ui.js`.

Кнопка `tg-search__clear` — исключение из фоновой подсветки: hover меняет только цвет иконки.

### Полноширинная галерея в popup

Модификатор `.tg-carousel--fullwidth` убирает боковые поля coverflow, отдавая
активному изображению ширину viewport. Совмещается с `.tg-carousel--coverflow`:
`class="tg-carousel tg-carousel--coverflow tg-carousel--fullwidth"`.
Изображения сохраняют естественные пропорции, вписываются без обрезки и ограничены
по высоте токеном `--media-max-size`. Управление и reduced-motion остаются штатными.
