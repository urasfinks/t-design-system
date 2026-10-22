const root = document.documentElement;
const themeSelect = document.querySelector('#theme');
let storage;
try { storage = localStorage; } catch { /* The file preview can disable storage. */ }
const savedTheme = storage?.getItem('tds-theme');
if (['auto', 'light', 'dark'].includes(savedTheme)) themeSelect.value = savedTheme;
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
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
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
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
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
