# Вход и регистрация — спецификации компонентов

## Назначение категории

Папка `sign-in` (11 превью) показывает экраны входа: почта и пароль, внешние
провайдеры и SSO, вход без пароля (ссылка, код, QR), разделённый экран с изображением.
Всё это композиции из существующих полей, кнопок и карточек TDS. Логика
аутентификации, сессии, восстановление пароля и защита от перебора — за пределами
системы: TDS даёт разметку, состояния и доступность.

## Сводная таблица

| Компонент / паттерн | Тип работы | Референсов | Приоритет |
| --- | --- | ---: | --- |
| S1. Вход по почте и паролю | `composition` | 3 | `P0` |
| S2. Внешние провайдеры, SSO и «сначала идентификатор» | `composition` | 3 | `P1` |
| S3. Вход без пароля: ссылка, код, QR | `composition` | 2 | `P1` |
| S4. Разделённый экран с изображением | `composition` | 2 | `P2` |
| S5. Шапка страницы авторизации | `composition` | 1 | `P1` |

## Общие решения категории

- **Карточка формы** — `.tg-card` шириной до 26rem по центру `--background-main`;
  заголовок `h1` (на странице входа это главный заголовок), короткое описание.
- **Поля** — из `forms`: почта (`type="email"`, `autocomplete="email"`,
  `spellcheck="false"`), пароль (F3 с показом), OTP (F5). Label всегда видим.
- **Действия.** Одно primary «Войти»/«Продолжить» на всю ширину; провайдеры —
  `.tg-btn--secondary` с бренд-иконкой (иконка — изображение провайдера, не Feather,
  цвет логотипа не становится токеном); разделитель «или» — `.tg-divider` с подписью.
- **Ссылки** «Забыли пароль?», «Создать аккаунт» — `.tg-link`, не кнопки.
- **Ошибки** — общая ошибка входа в `.tg-notice--destructive` над формой без указания,
  что именно неверно; ошибки полей — `.tg-help--error`.
- **Ответственность приложения**: проверка учётных данных, redirect провайдеров,
  отправка ссылок/кодов, ограничение попыток, CAPTCHA, хранение сессии. TDS не хранит
  и не передаёт данные.

## Спецификации компонентов

### S1. Вход по почте и паролю

Статус: `composition` · Приоритет: `P0` · Состав: `.tg-card`, `.tg-field`, `.tg-input`, `.tg-input-group` (forms F2/F3), `.tg-choice`, `.tg-btn`, `.tg-link`, `.tg-notice`

**Назначение**: стандартный вход для существующего пользователя.

**Состав**: заголовок; почта; пароль со ссылкой «Забыли пароль?»; «Запомнить меня»;
«Войти»; ссылка на регистрацию; необязательная кнопка провайдера.

```html
<main class="tg-container tg-page-content">
  <form class="tg-card tg-col tg-gap-4" method="post" aria-labelledby="login-title">
    <h1 class="tg-header__title" id="login-title">С возвращением</h1>
    <div class="tg-notice tg-notice--destructive" role="alert" hidden>Неверная почта или пароль.</div>
    <div class="tg-field">
      <label class="tg-label" for="login-email">Почта</label>
      <input class="tg-input" id="login-email" name="email" type="email" autocomplete="username" spellcheck="false" required>
    </div>
    <div class="tg-field">
      <div class="tg-row tg-justify-between">
        <label class="tg-label" for="login-pw">Пароль</label>
        <a class="tg-link tg-text-sm" href="/reset">Забыли пароль?</a>
      </div>
      <div class="tg-input-group">
        <input class="tg-input-group__control" id="login-pw" name="password" type="password" autocomplete="current-password" required>
        <button class="tg-icon-btn tg-icon-btn--ghost tg-input-group__action" type="button" aria-pressed="false" aria-label="Показать пароль">…</button>
      </div>
    </div>
    <label class="tg-choice"><input class="tg-check" type="checkbox" name="remember"><span>Запомнить меня</span></label>
    <button class="tg-btn tg-btn--primary tg-w-full" type="submit">Войти</button>
    <p class="tg-text-sm tg-text-center">Нет аккаунта? <a class="tg-link" href="/signup">Зарегистрироваться</a></p>
  </form>
</main>
```

**API**: новых классов нет.

**Варианты из референсов**: вход или создание аккаунта с Google (5), минимальная
форма со сбросом пароля (6), карточка с логотипом и провайдерами (10).

**Состояния**: default, field invalid, submitting (кнопка B5 `aria-busy`), auth error
(notice), locked (слишком много попыток — notice с временем ожидания).

**Поведение и ответственность приложения**: отправка, ошибки, перенаправление,
сохранение «запомнить меня».

**Адаптивность**: на 320 px карточка без рамки на всю ширину (`tg-no-border`), отступы `--space-4`.

**Доступность**: `autocomplete="username"`/`current-password`; общая ошибка — `role="alert"`
и фокус на неё; кнопка показа пароля — `aria-pressed`.

**Токены и связь с TDS**: `--radius-lg`, `--background-panel`, `--danger-soft`.

**Критерии готовности**: менеджеры паролей заполняют форму; ошибка не раскрывает,
существует ли аккаунт.

**Референсы** (3):

- `socolled--login-2--2d061c18.webp` — Login 2
- `ephraimduncan--login-03--6a03924a.webp` — Login with Email and Password
- `rafa-porto--sign-in--f06a2b0a.webp` — Sign In

### S2. Внешние провайдеры, SSO и «сначала идентификатор»

Статус: `composition` · Приоритет: `P1` · Состав: S1 + `.tg-btn--secondary` с бренд-иконкой + `.tg-divider`; предлагаемая подпись разделителя `.tg-divider--label`

**Назначение**: вход через Google/Apple/GitHub, корпоративный SSO и сценарий «сначала
почта — затем подходящий способ».

**Состав**: кнопки провайдеров; разделитель «или»; поле почты; «Продолжить»;
переход на SSO или пароль в зависимости от домена.

```html
<form class="tg-card tg-col tg-gap-4" aria-labelledby="sso-title">
  <h1 class="tg-header__title" id="sso-title">Вход в Acme</h1>
  <button class="tg-btn tg-btn--secondary tg-w-full" type="button">
    <img src="/icons/google.svg" alt="" width="20" height="20"> Продолжить с Google
  </button>
  <div class="tg-divider tg-divider--label" role="separator"><span>или</span></div>
  <div class="tg-field">
    <label class="tg-label" for="id-email">Рабочая почта</label>
    <input class="tg-input" id="id-email" type="email" autocomplete="username" spellcheck="false">
  </div>
  <button class="tg-btn tg-btn--primary tg-w-full" type="submit">Продолжить</button>
  <a class="tg-link tg-text-center" href="/login/password">Войти по паролю</a>
</form>
```

**API** (предлагаемое): `.tg-divider--label` — линия с текстом посередине
(`--text-secondary`, `--fs-sm`); остальное существующее.

**Варианты из референсов**: модальное окно «Войти или создать» (1 — `dialog.tg-modal`),
«сначала идентификатор» с SSO и иконками провайдеров (3), SSO-кнопка под формой (7).

**Состояния**: default, redirecting (кнопка провайдера `aria-busy`), domain detected
(показывается SSO), provider error (notice).

**Поведение и ответственность приложения**: OAuth/SAML, определение домена, обработка возврата.

**Адаптивность**: иконочные кнопки провайдеров в ряд — только при подписи `aria-label`;
на 320 px — в столбец с текстом.

**Доступность**: у бренд-иконки пустой `alt`, имя — текст кнопки; разделитель не объявляется лишний раз.

**Токены и связь с TDS**: `--action-border-color`, `--border-subtle-color`.

**Критерии готовности**: порядок фокуса совпадает с визуальным; модальный вариант возвращает фокус.

**Референсы** (3):

- `efferd--auth-modal--04a06f37.webp` — Auth Modal
- `dhxwhy--identifier-first-login--938e5938.webp` — Identifier First Login
- `ephraimduncan--login-08--2c71e2b0.webp` — Login with SSO

### S3. Вход без пароля: ссылка, код, QR

Статус: `composition` · Приоритет: `P1` · Состав: S1 + OTP (forms F5) + `.tg-media` для QR + `.tg-notice` + `.tg-progress`/`.tg-spinner`

**Назначение**: вход по ссылке из письма, одноразовому коду или сканированием QR
телефоном с резервным паролем.

**Состав**: шаг ввода почты; шаг «проверьте почту» с вводом кода и повторной отправкой;
экран успеха; для QR — изображение кода, шаги инструкции, статус ожидания, ссылка
«Войти паролем».

```html
<section class="tg-card tg-col tg-gap-4" aria-labelledby="qr-title">
  <h1 class="tg-header__title" id="qr-title">Наведите камеру телефона</h1>
  <figure class="tg-media">
    <img src="/qr.svg" alt="QR-код для входа. Если сканирование недоступно, войдите паролем.">
  </figure>
  <ol class="tg-col tg-gap-2">
    <li>Откройте приложение на телефоне</li>
    <li>Отсканируйте код камерой</li>
  </ol>
  <p class="tg-text-sm tg-text-muted" role="status">Ждём подтверждения…</p>
  <a class="tg-link" href="/login/password">Войти паролем</a>
</section>
```

**API**: новых классов нет.

**Варианты из референсов**: ссылка и код с экраном «Вы вошли, Мария» (8), QR со
сценарием и запасным паролем (9).

**Состояния**: request, sent (таймер повтора), verifying, success, expired (QR/код
устарел — кнопка «Обновить»), error.

**Поведение и ответственность приложения**: генерация и обновление кода/QR, опрос
статуса, отправка письма, таймеры.

**Адаптивность**: QR не меньше 160 px; на мобильном QR не показывается — вместо него
вход ссылкой или кодом (сканировать свой же экран нельзя).

**Доступность**: у QR всегда есть альтернатива; статус ожидания в `role="status"`
без частых обновлений; успех объявляется и переводит фокус на следующий шаг.

**Токены и связь с TDS**: `--accent-readable` для успеха, `--radius-lg`.

**Критерии готовности**: каждый способ имеет обычную текстовую альтернативу.

**Референсы** (2):

- `dhxwhy--magic-link-otp-login--0924c376.webp` — Magic Link and OTP Code Login Form
- `dhxwhy--qr-code-scan-login--b31a3613.webp` — QR Code Scan Login Form with Password Fallback

### S4. Разделённый экран с изображением

Статус: `composition` · Приоритет: `P2` · Состав: `.tg-grid` (две колонки) + S1/S2 + `.tg-media` или карусель (navigation N16)

**Назначение**: маркетинговая страница входа: форма с одной стороны, изображение или
слайдер с другой.

**Состав**: колонка формы; колонка медиа (декоративная или с отзывами).

```html
<main class="tg-grid tg-h-full">
  <section class="tg-col tg-justify-center tg-p-6"><!-- форма S1 --></section>
  <figure class="tg-media tg-hide-mobile" aria-hidden="true"><img src="/auth.jpg" alt=""></figure>
</main>
```

**API**: новых классов нет; при необходимости — локальный `--media-max-size: 100dvh`
для колонки изображения.

**Варианты из референсов**: изображение со слайдером (4), фото с формой и
провайдерами (11).

**Состояния**: как S1; медиа загружается лениво.

**Поведение и ответственность приложения**: выбор изображений; слайдер без автопрокрутки
или с паузой.

**Адаптивность**: до 48rem медиа скрывается, форма на весь экран.

**Доступность**: декоративное изображение — `alt=""`/`aria-hidden`; если слайдер с
отзывами — правила карусели N16.

**Токены и связь с TDS**: `--background-panel`.

**Критерии готовности**: без изображения страница выглядит законченно.

**Референсы** (2):

- `ravikatiyar162--image-slider--98787da5.webp` — Image Slider
- `bhomikproductivitylab--sign-in-page--7a9ac2e7.webp` — SignInPage

### S5. Шапка страницы авторизации

Статус: `composition` · Приоритет: `P1` · Состав: `.tg-page-header` + `.tg-site-nav` (navigation N4)

**Назначение**: центрированная шапка с логотипом и минимальной навигацией над формой
входа или лендингом.

**Состав**: бренд; ссылки; «Войти» и primary «Начать».

```html
<header class="tg-page-header">
  <div class="tg-container tg-row">
    <a class="tg-brand tg-header__title" href="/">Acme</a>
    <nav class="tg-site-nav tg-hide-mobile" aria-label="Основная">…</nav>
    <a class="tg-link tg-ms-auto" href="/login">Войти</a>
    <a class="tg-btn tg-btn--primary tg-btn--sm" href="/signup">Начать</a>
  </div>
</header>
```

**API**: из navigation N4.

**Варианты из референсов**: центрированная шапка над скелетом страницы (2).

**Состояния**: как N4.

**Поведение и ответственность приложения**: как N4.

**Адаптивность**: как N4.

**Доступность**: как N4; на странице входа ссылка «Войти» имеет `aria-current="page"`.

**Токены и связь с TDS**: как N4.

**Критерии готовности**: см. navigation N4.

**Референсы** (1):

- `olewandowski1--centered-nav-header--2e1cfe67.webp` — Centered Nav Header

## Порядок реализации

1. **P0:** пример S1 в витрине (зависит от forms F2/F3).
2. **P1:** `.tg-divider--label` и S2; S3 (после forms F5); S5 (после navigation N4).
3. **P2:** S4.

## Контрольный список покрытия

| Группа | Референсов |
| --- | ---: |
| S1. Вход по почте и паролю | 3 |
| S2. Внешние провайдеры, SSO и «сначала идентификатор» | 3 |
| S3. Вход без пароля: ссылка, код, QR | 2 |
| S4. Разделённый экран с изображением | 2 |
| S5. Шапка страницы авторизации | 1 |
| **Итого** | **11 из 11** |

Каждый из 11 файлов папки указан ровно в одной основной группе. Перекрёстные ссылки на другие категории даны текстом, без повторного учёта.
