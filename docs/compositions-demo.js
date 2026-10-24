import '../dist/ui.js';
// Demo behavior only. All presentation comes from TDS.
const root = document.documentElement;
const theme = document.querySelector('#demo-theme');
theme.addEventListener('change', () => {
  if (theme.value === 'auto') delete root.dataset.theme;
  else root.dataset.theme = theme.value;
});
if (window.parent !== window && window.parent.location.origin === location.origin) {
  document.querySelector('#demo-theme-control').hidden = true;
  const parentRoot = window.parent.document.documentElement;
  function syncTheme() {
    if (parentRoot.dataset.theme) root.dataset.theme = parentRoot.dataset.theme;
    else delete root.dataset.theme;
    for (const name of ['--button-color', '--button-text-color', '--link-color', '--accent-text-color']) {
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
const input = document.querySelector('#demo-message');
const send = document.querySelector('#demo-send');
const preview = document.querySelector('#demo-reply-preview');
function resizeInput() {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, parseFloat(getComputedStyle(input).maxHeight))}px`;
  send.disabled = !input.value.trim();
}
input.addEventListener('input', resizeInput);
const composer = document.querySelector('#demo-composer');
const observer = new ResizeObserver(() => root.style.setProperty('--tg-composer-height', `${composer.getBoundingClientRect().height}px`));
observer.observe(composer);
const viewport = window.visualViewport;
function updateViewport() {
  root.style.setProperty('--tg-keyboard-inset', `${viewport ? Math.max(0, innerHeight - viewport.height - viewport.offsetTop) : 0}px`);
}
viewport?.addEventListener('resize', updateViewport);
viewport?.addEventListener('scroll', updateViewport);
window.addEventListener('pagehide', () => {
  observer.disconnect();
  viewport?.removeEventListener('resize', updateViewport);
  viewport?.removeEventListener('scroll', updateViewport);
}, { once: true });
resizeInput();
updateViewport();
document.querySelector('#demo-reply').addEventListener('click', () => {
  document.querySelector('#demo-excerpt').textContent = document.querySelector('#demo-original').textContent;
  preview.hidden = false;
  input.focus();
});
document.querySelector('#demo-cancel-reply').addEventListener('click', () => { preview.hidden = true; input.focus(); });
const toggle = document.querySelector('#demo-toggle-replies');
toggle.addEventListener('click', () => {
  const replies = document.querySelector('#demo-replies');
  replies.hidden = !replies.hidden;
  toggle.setAttribute('aria-expanded', String(!replies.hidden));
  toggle.textContent = replies.hidden ? 'Показать ответы' : 'Скрыть ответы';
});
const form = document.querySelector('#demo-message-form');
form.addEventListener('submit', event => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  const item = document.createElement('div');
  item.className = 'tg-list-item';
  const article = document.createElement('article');
  article.className = 'tg-comment';
  article.innerHTML = '<span class="tg-avatar" aria-hidden="true"><span class="tg-avatar__initials">В</span></span><div class="tg-comment__body"><header class="tg-comment__meta"><span class="tg-list-item__title">Вы</span></header><p class="tg-comment__text tg-mt-2 tg-mb-0"></p></div>';
  article.querySelector('p').textContent = text;
  item.append(article);
  const isReply = !preview.hidden;
  const destination = document.querySelector(isReply ? '#demo-replies' : '#demo-messages');
  destination.append(item);
  if (isReply) {
    destination.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.textContent = 'Скрыть ответы';
  }
  preview.hidden = true;
  input.value = '';
  resizeInput();
  item.scrollIntoView({ block: 'center' });
  document.querySelector('#demo-status').textContent = isReply ? 'Ответ добавлен' : 'Сообщение добавлено';
});
input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); form.requestSubmit(); }
});
const dialog = document.querySelector('#demo-media');
document.querySelector('#demo-open-media').addEventListener('click', () => dialog.showModal());
document.querySelector('#demo-close-media').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
