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
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  function selectTab(tab, focus = false) {
    for (const item of tabs) {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      root.getElementById(item.getAttribute('aria-controls')).hidden = !active;
    }
    if (focus) tab.focus();
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

  // The refresh icon has a real refresh action; all demo state is recreated on load.
  root.querySelector('#reload-examples').addEventListener('click', () => location.reload());
  const range = root.querySelector('#demo-range');
  range.addEventListener('input', () => root.querySelector('#range-output').value = `${range.value}%`);
  for (const link of root.querySelectorAll('.tg-error-summary a')) {
    link.addEventListener('click', () => root.querySelector(link.hash)?.focus());
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
