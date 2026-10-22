import { initRipple } from '../dist/effects.js';
initRipple();

const root = document.documentElement;
const themeSelect = document.querySelector('#theme');
let storage;
try { storage = localStorage; } catch { /* The file preview can disable storage. */ }
const savedTheme = storage?.getItem('tds-theme');
if (['auto', 'light', 'dark', 'ios-dark'].includes(savedTheme)) themeSelect.value = savedTheme;
function applyTheme(value) {
  if (value === 'auto') delete root.dataset.theme;
  else root.dataset.theme = value;
  try { storage?.setItem('tds-theme', value); } catch { /* Theme still works without persistence. */ }
}
applyTheme(themeSelect.value);
themeSelect.addEventListener('change', () => applyTheme(themeSelect.value));
const accents = { green: '#18745b', violet: '#7151c7' };
document.querySelector('[aria-label="Акцентный цвет"]').addEventListener('change', event => {
  const color = accents[event.target.value];
  for (const property of ['--button-color', '--link-color', '--accent-text-color']) {
    if (color) root.style.setProperty(property, color);
    else root.style.removeProperty(property);
  }
  if (color) root.style.setProperty('--button-text-color', '#ffffff');
  else root.style.removeProperty('--button-text-color');
});
for (const control of document.querySelectorAll('button[role="switch"], button[role="checkbox"]')) {
  control.addEventListener('click', () => control.setAttribute('aria-checked', String(control.getAttribute('aria-checked') !== 'true')));
}
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab, focus = false) {
  for (const item of tabs) {
    const active = item === tab;
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
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
const toast = document.querySelector('#demo-toast');
let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('tg-toast--show');
  toastTimer = setTimeout(() => { toast.classList.remove('tg-toast--show'); }, 3200);
}
document.querySelector('#show-toast').addEventListener('click', () => showToast('Изменения сохранены. Всё готово!'));
const dialog = document.querySelector('#demo-dialog');
document.querySelector('#open-dialog').addEventListener('click', () => dialog.showModal());
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close('cancel'));
dialog.addEventListener('close', () => {
  if (dialog.returnValue === 'create') showToast('Пример: пространство создано');
});
for (const example of document.querySelectorAll('[data-example]')) {
  const details = document.createElement('details');
  details.className = 'example-code';
  const summary = document.createElement('summary');
  summary.textContent = 'Посмотреть HTML';
  const pre = document.createElement('pre');
  const code = document.createElement('code');
  // Capture the initial markup, before the user changes the demo state.
  code.textContent = example.innerHTML.trim();
  pre.append(code);
  details.append(summary, pre);
  example.closest('.example-panel').append(details);
}
const links = [...document.querySelectorAll('.nav-link')];
const sectionSelect = document.querySelector('#section-select');
sectionSelect.addEventListener('change', () => {
  location.hash = sectionSelect.value;
  // Assigning an unchanged hash doesn't scroll. A committed selection always should.
  document.getElementById(sectionSelect.value).scrollIntoView({ behavior: 'instant', block: 'start' });
});
function syncSectionMenu() {
  const id = location.hash.slice(1);
  if ([...sectionSelect.options].some(option => option.value === id)) sectionSelect.value = id;
}
syncSectionMenu();
addEventListener('hashchange', syncSectionMenu);
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      sectionSelect.value = entry.target.id;
      for (const link of links) {
        const active = link.hash === `#${entry.target.id}`;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    }
  }, { rootMargin: '-100px 0px -60% 0px', threshold: 0 });
  for (const section of document.querySelectorAll('main > section')) observer.observe(section);
}

const upload = document.querySelector('#demo-file');
const uploadPreview = document.querySelector('#demo-upload-preview');
const uploadStatus = document.querySelector('#demo-upload-status');
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
const snackbar = document.querySelector('#demo-snackbar');
let snackbarTimer;
document.querySelector('#show-snackbar').addEventListener('click', () => {
  clearTimeout(snackbarTimer);
  snackbar.querySelector('.tg-snackbar__content').textContent = 'Готово: уведомление в верхней части экрана';
  snackbar.classList.add('tg-snackbar--show');
  snackbarTimer = setTimeout(() => snackbar.classList.remove('tg-snackbar--show'), 3200);
});

for (const button of document.querySelectorAll('.tg-pagination .tg-dot')) {
  button.addEventListener('click', () => {
    for (const sibling of button.parentElement.querySelectorAll('.tg-dot')) sibling.setAttribute('aria-current', sibling === button ? 'page' : 'false');
    const index = [...button.parentElement.children].indexOf(button) + 1;
    document.querySelector('#demo-page-status').textContent = `Страница ${index} из 3`;
  });
}

// The refresh icon has a real refresh action; all demo state is recreated on load.
document.querySelector('#reload-examples').addEventListener('click', () => location.reload());
