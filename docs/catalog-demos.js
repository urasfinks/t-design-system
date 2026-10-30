import { initMenus } from './menu-demo.js';
export function initCatalogDemos({ root = document } = {}) {
  const documentRoot = root.documentElement;
  const themeSelect = root.querySelector('#theme');
  themeSelect.addEventListener('pointerdown', () => themeSelect.focus({ preventScroll: true }));
  let storage;
  try { storage = localStorage; } catch { /* The file preview can disable storage. */ }
  const savedTheme = storage?.getItem('tds-theme');
  if (['auto', 'light', 'dark', 'ios-dark'].includes(savedTheme)) themeSelect.value = savedTheme;
  function applyTheme(value) {
    if (value === 'auto') delete documentRoot.dataset.theme;
    else documentRoot.dataset.theme = value;
    try { storage?.setItem('tds-theme', value); } catch { /* Theme still works without persistence. */ }
    // Match the browser chrome to the chosen theme; auto falls back to the media-specific metas.
    requestAnimationFrame(() => {
      const colour = value === 'auto' ? null : getComputedStyle(root.body).backgroundColor;
      for (const meta of root.querySelectorAll('meta[name="theme-color"]')) {
        meta.dataset.initial ??= meta.content;
        meta.content = colour ?? meta.dataset.initial;
      }
    });
  }
  applyTheme(themeSelect.value);
  themeSelect.addEventListener('change', () => applyTheme(themeSelect.value));
  const accents = { green: '#18745b', violet: '#7151c7' };
  root.querySelector('[aria-label="Акцентный цвет"]').addEventListener('change', event => {
    const color = accents[event.target.value];
    if (color) documentRoot.style.setProperty('--button-color', color);
    else documentRoot.style.removeProperty('--button-color');
    if (color) documentRoot.style.setProperty('--button-text-color', '#ffffff');
    else documentRoot.style.removeProperty('--button-text-color');
  });
  for (const control of root.querySelectorAll('button[role="switch"], button[role="checkbox"]')) {
    control.addEventListener('click', () => control.setAttribute('aria-checked', String(control.getAttribute('aria-checked') !== 'true')));
  }
  // Filters are toggle buttons; the application owns what they filter.
  for (const chip of root.querySelectorAll('.tg-chip[aria-pressed]')) {
    chip.addEventListener('click', () => chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true')));
  }
  // Each tablist is its own group: several tab sets may live on one page.
  // Vertical and collapsed-label tab sets have their own controller (catalog-components.js).
  for (const list of root.querySelectorAll('[role="tablist"]:not(.tg-tabs--vertical, .tg-tabs--collapsed-labels)')) initTabs([...list.querySelectorAll('[role="tab"]')]);
  function initTabs(tabs) {
  function selectTab(tab, focus = false) {
    for (const item of tabs) {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      root.getElementById(item.getAttribute('aria-controls')).hidden = !active;
    }
    if (focus) tab.focus({ preventScroll: true });
  }
  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      const direction = getComputedStyle(tab.parentElement).direction === 'rtl' ? -1 : 1;
      if (event.key === 'ArrowRight') next = (index + direction + tabs.length) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - direction + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectTab(tabs[next], true); }
    });
  }
  }
  const toast = root.querySelector('#demo-toast');
  let toastTimer;
  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('tg-toast--show');
    toastTimer = setTimeout(() => { toast.classList.remove('tg-toast--show'); }, 3200);
  }
  root.querySelector('#show-toast').addEventListener('click', () => showToast('Изменения сохранены. Всё готово!'));
  const dialog = root.querySelector('#demo-dialog');
  root.querySelector('#open-dialog').addEventListener('click', () => dialog.showModal());
  root.querySelector('#close-dialog').addEventListener('click', () => dialog.close('cancel'));
  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'create') showToast('Пример: пространство создано');
  });

  const upload = root.querySelector('#demo-file');
  const uploadPreview = root.querySelector('#demo-upload-preview');
  const uploadStatus = root.querySelector('#demo-upload-status');
  let previewURL;
  upload.addEventListener('change', () => {
    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = undefined;
    uploadPreview.hidden = true;
    uploadPreview.removeAttribute('src');
    const file = upload.files[0];
    if (!file) { uploadStatus.textContent = 'Файл не выбран'; return; }
    if (!file.type.startsWith('image/')) { uploadStatus.textContent = 'Выберите изображение'; return; }
    previewURL = URL.createObjectURL(file);
    uploadPreview.src = previewURL;
    uploadPreview.hidden = false;
    uploadStatus.textContent = `Выбран файл: ${file.name}`;
  });
  const snackbar = root.querySelector('#demo-snackbar');
  let snackbarTimer;
  root.querySelector('#show-snackbar').addEventListener('click', () => {
    clearTimeout(snackbarTimer);
    snackbar.querySelector('.tg-snackbar__content').textContent = 'Готово: уведомление в верхней части экрана';
    snackbar.classList.add('tg-snackbar--show');
    snackbarTimer = setTimeout(() => snackbar.classList.remove('tg-snackbar--show'), 3200);
  });

  for (const button of root.querySelectorAll('.tg-pagination .tg-dot')) {
    button.addEventListener('click', () => {
      for (const sibling of button.parentElement.querySelectorAll('.tg-dot')) sibling.setAttribute('aria-current', sibling === button ? 'page' : 'false');
      const index = [...button.parentElement.children].indexOf(button) + 1;
      root.querySelector('#demo-page-status').textContent = `Страница ${index} из 3`;
    });
  }

  initWorkspaceDemos(root);

  // The refresh icon has a real refresh action; all demo state is recreated on load.
  root.querySelector('#reload-examples').addEventListener('click', () => location.reload());
  const range = root.querySelector('#demo-range');
  range.addEventListener('input', () => root.querySelector('#range-output').value = `${range.value}%`);
  for (const link of root.querySelectorAll('.tg-error-summary a')) {
    link.addEventListener('click', () => root.querySelector(link.hash)?.focus({ preventScroll: true }));
  }
  const transitionToggle = root.querySelector('#transition-toggle');
  transitionToggle.addEventListener('click', () => {
    const expanded = transitionToggle.getAttribute('aria-expanded') !== 'true';
    transitionToggle.setAttribute('aria-expanded', String(expanded));
    transitionToggle.textContent = expanded ? 'Скрыть описание' : 'Показать описание';
    const content = root.querySelector('#transition-demo');
    content.classList.toggle('is-hidden', !expanded);
    content.inert = !expanded;
    content.setAttribute('aria-hidden', String(!expanded));
  });
}

// Demos for the cascade-built components; the application owns all of this behavior.
function initWorkspaceDemos(root) {
  const say = (node, text) => { node.textContent = ''; requestAnimationFrame(() => { node.textContent = text; }); };
  const plural = (n, one, few, many) => {
    const mod10 = n % 10, mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  };
  const menuStatus = root.querySelector('#demo-menu-status');
  initMenus({ root, onAction: item => say(menuStatus, `Пример: ${item.textContent.trim().replace(/\s+/g, ' ')}`) });

  for (const toggle of root.querySelectorAll('.tg-toggle[aria-pressed]')) {
    toggle.addEventListener('click', () => toggle.setAttribute('aria-pressed', String(toggle.getAttribute('aria-pressed') !== 'true')));
  }

  const save = root.querySelector('#demo-async-save');
  const saveStatus = root.querySelector('#demo-async-status');
  save.addEventListener('click', () => {
    if (save.dataset.state === 'busy') return;
    save.dataset.state = 'busy';
    save.setAttribute('aria-busy', 'true');
    say(saveStatus, 'Публикуем');
    setTimeout(() => {
      save.dataset.state = 'success';
      save.removeAttribute('aria-busy');
      say(saveStatus, 'Опубликовано');
      setTimeout(() => { save.dataset.state = 'idle'; }, 1600);
    }, 900);
  });

  const password = root.querySelector('#demo-new-password');
  const rules = { length: value => value.length >= 10, digit: value => /\d/.test(value) };
  password.addEventListener('input', () => {
    for (const rule of root.querySelectorAll('#demo-password-rules [data-rule]')) rule.dataset.met = String(rules[rule.dataset.rule](password.value));
  });
  root.querySelector('#demo-reveal').addEventListener('click', event => {
    const shown = password.type === 'password';
    password.type = shown ? 'text' : 'password';
    event.currentTarget.setAttribute('aria-pressed', String(shown));
  });

  const exportAll = root.querySelector('#demo-export-all');
  const exportItems = [...root.querySelectorAll('[data-export]')];
  const syncExport = () => {
    const count = exportItems.filter(box => box.checked).length;
    exportAll.checked = count === exportItems.length;
    exportAll.indeterminate = count > 0 && count < exportItems.length;
    root.querySelector('#demo-export-count').textContent = `Выбрано ${count} из ${exportItems.length}`;
  };
  exportAll.addEventListener('change', () => { for (const box of exportItems) box.checked = exportAll.checked; syncExport(); });
  for (const box of exportItems) box.addEventListener('change', syncExport);
  syncExport();

  const expand = root.querySelector('#demo-faq-expand');
  const sections = [...root.querySelectorAll('#demo-faq > details')];
  const label = () => { expand.textContent = sections.every(section => section.open) ? 'Свернуть всё' : 'Развернуть всё'; };
  expand.addEventListener('click', () => { const open = !sections.every(section => section.open); for (const section of sections) section.open = open; label(); });
  for (const section of sections) section.addEventListener('toggle', label);

  const table = root.querySelector('#demo-payments');
  const all = root.querySelector('#demo-payments-all');
  const bulk = root.querySelector('#demo-bulk');
  const rowChecks = () => [...table.querySelectorAll('tbody .tg-check')];
  const syncRows = () => {
    const chosen = rowChecks().filter(box => box.checked).length;
    all.checked = chosen > 0 && chosen === rowChecks().length;
    all.indeterminate = chosen > 0 && chosen < rowChecks().length;
    // The bar stays in place: empty, it says so and its actions are unavailable.
    bulk.toggleAttribute('data-empty', chosen === 0);
    for (const button of bulk.querySelectorAll('button')) button.disabled = chosen === 0;
    root.querySelector('#demo-bulk-count').textContent = chosen ? `Выбрано ${chosen} ${plural(chosen, 'участник', 'участника', 'участников')}` : 'Ничего не выбрано';
  };
  all.addEventListener('change', () => { for (const box of rowChecks()) box.checked = all.checked; syncRows(); });
  table.addEventListener('change', event => { if (event.target.closest('tbody .tg-table__select')) syncRows(); });
  root.querySelector('#demo-bulk-clear').addEventListener('click', () => { for (const box of rowChecks()) box.checked = false; syncRows(); all.focus({ preventScroll: true }); });
  const sortNames = { due: 'сроку', amount: 'сумме' };
  table.addEventListener('click', event => {
    const button = event.target.closest('.tg-table__sort');
    if (!button) return;
    const header = button.closest('th');
    const next = header.getAttribute('aria-sort') === 'descending' ? 'ascending' : 'descending';
    for (const th of table.querySelectorAll('th[aria-sort]')) th.setAttribute('aria-sort', 'none');
    header.setAttribute('aria-sort', next);
    const key = header.dataset.sort;
    const value = row => key === 'amount' ? Number(row.dataset.amount) : Date.parse(row.dataset.due);
    const body = table.tBodies[0];
    body.append(...[...body.rows].sort((a, b) => (value(a) - value(b)) * (next === 'ascending' ? 1 : -1)));
    say(root.querySelector('#demo-payments-status'), `Отсортировано по ${sortNames[key]}, ${next === 'ascending' ? 'по возрастанию' : 'по убыванию'}`);
  });

  for (const dismiss of root.querySelectorAll('[data-dismiss]')) {
    dismiss.addEventListener('click', () => {
      const notice = root.getElementById(dismiss.dataset.dismiss);
      const section = notice.closest('section');
      notice.hidden = true;
      const heading = section.querySelector('h2');
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    });
  }

  const side = root.querySelector('#demo-side-dialog');
  root.querySelector('#open-side-dialog').addEventListener('click', () => side.showModal());
  side.querySelector('[data-close-side]').addEventListener('click', () => side.close());
  root.querySelector('#demo-chat-form').addEventListener('submit', event => event.preventDefault());
}
