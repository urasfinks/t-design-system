# Creatable Tags Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Добавить отдельный пример тегов с подсказками и созданием своего значения.
**Architecture:** Опциональное расширение существующего initComboboxes, без копии обработчиков и CSS.
**Tech Stack:** HTML, JavaScript, Playwright.
**Spec:** docs/superpowers/specs/2026-11-01-creatable-tags-design.md

## Global Constraints
Сохранить старые примеры. Использовать TDS. Клавиатура, ARIA, hidden inputs; без новых зависимостей.

## Review Focus
Пробелы и регистр; пустой ввод; HTML в значении; IME Enter; отсутствие изменений у обычного выбора команд.

### Task 1: Пример и опциональное создание
Files: docs/index.html, docs/catalog-components.js, tests/creatable-tags.browser.mjs.
Interfaces: data-combobox + data-multiple + data-allow-custom + data-name="tags[]".
- [x] Написать браузерный тест фильтрации, создания мышью/Enter, повторов, формы, Escape и безопасного текста.
- [x] Увидеть падение теста до реализации.
- [x] Добавить пример с существующими классами; расширить render/choose/Enter существующего combobox.
- [x] Проверить Chromium/WebKit во всех темах, components-wave-2 и option-spacing/selection; npm test и diff.
- [x] Проверить скриншоты примера, отметить результат. Не создавать коммит без запроса пользователя.

## Результат проверки

- RED: новый пример отсутствует; после реализации отдельно воспроизведено неверное объявление удаления выбранной команды и исправлено.
- GREEN: `creatable-tags.browser.mjs` в Chromium/WebKit, light/dark/ios-dark: выбор, создание, повтор, IME, безопасный текст, FormData, геометрия и скриншоты.
- `npm test`: 34/34; `git diff --check`: без замечаний.
- `option-spacing.browser.mjs` и `option-selection.browser.mjs`: оба браузера прошли.
- `components-wave-2.browser.mjs`: Chromium 104 проверки; WebKit не прошёл — после F14 arrow keys получена ошибка ResizeObserver loop completed with undelivered notifications.
- Независимое ревью: замечание об объявлении удаления команды исправлено и покрыто регрессионной проверкой.
- Работа выполнена в текущем каталоге вместе с предыдущим исправлением фокуса; коммит не создавался.
