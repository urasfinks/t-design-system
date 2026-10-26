import '../dist/ui.js';
const root = document.documentElement;
const theme = document.querySelector('#panel-theme');
theme.addEventListener('change', () => root.dataset.theme = theme.value);
let parentRoot;
try {
  if (window.parent !== window && window.parent.location.origin === location.origin) {
    parentRoot = window.parent.document.documentElement;
  }
} catch {
  // A cross-origin embed keeps its own theme control.
}
if (parentRoot) {
  theme.parentElement.hidden = true;
  function syncTheme() {
    if (parentRoot.dataset.theme) root.dataset.theme = parentRoot.dataset.theme;
    else delete root.dataset.theme;
    for (const name of ['--button-color', '--text-color', '--bg-color', '--destructive-text-color']) {
      const value = parentRoot.style.getPropertyValue(name);
      if (value) root.style.setProperty(name, value);
      else root.style.removeProperty(name);
    }
  }
  syncTheme();
  const observer = new MutationObserver(syncTheme);
  observer.observe(parentRoot, { attributes: true, attributeFilter: ['data-theme', 'style'] });
  window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
}
const example = document.querySelector('#panel-example');
const content = document.querySelector('#panel-content');
function updateExample() {
  const isForm = example.value === 'form';
  const template = document.querySelector(isForm ? '#form-content' : '#orders-content');
  content.replaceChildren(template.content.cloneNode(true));
  if (example.value === 'long') {
    const list = content.querySelector('.tg-list');
    for (let index = 4; index <= 30; index++) {
      const row = document.createElement('div');
      row.className = 'tg-list-item';
      row.textContent = `Позиция заказа ${index} · 100 ₽`;
      list.append(row);
    }
  }
  document.querySelector('#panel-label').textContent = isForm ? 'Доставка' : 'Итого с меня:';
  document.querySelector('#panel-total').textContent = isForm ? 'Адрес и комментарий' : example.value === 'long' ? '5 100 ₽' : '2 400 ₽';
}
example.addEventListener('change', updateExample);
updateExample();
