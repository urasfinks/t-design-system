import { scrollWithin } from './demo-navigation.js';
const normalize = value => value.toLocaleLowerCase('ru').trim().replace(/\s+/g, ' ');
// textContent drops <br>; read headings with line breaks as spaces.
const headingText = heading => {
  if (!heading) return '';
  const copy = heading.cloneNode(true);
  for (const br of copy.querySelectorAll('br')) br.replaceWith(' ');
  return copy.textContent.trim().replace(/\s+/g, ' ');
};

export function initCatalogSearch({ root = document, navigate } = {}) {
  if (typeof navigate !== 'function') throw new TypeError('Catalog search requires navigate(id, { focus }).');
  const dialog = root.querySelector('#catalog-search');
  const input = root.querySelector('#catalog-search-input');
  const results = root.querySelector('#catalog-search-results');
  const status = root.querySelector('#catalog-search-status');
  const openers = [...root.querySelectorAll('[data-catalog-search-open]')];
  const entries = [...root.querySelectorAll('main [data-catalog-title]')].map(section => {
    const parent = section.dataset.catalogParent && root.getElementById(section.dataset.catalogParent);
    const title = parent
      ? `${parent.dataset.catalogTitle} / ${section.dataset.catalogTitle}`
      : headingText(section.querySelector(':scope > .section-heading h2')) || headingText(section.querySelector(':scope h1')) || section.dataset.catalogTitle;
    const tokens = [...section.querySelectorAll('[data-search-tokens]')].map(row => row.dataset.searchTokens).join(' ');
    const classTag = section.matches('h3')
      ? section.parentElement.querySelector(':scope > .class-tag')
      : section.querySelector(':scope > .section-heading > .class-tag');
    const classes = (classTag?.textContent || '').match(/\.[\w-]+/g) || [];
    return {
      id: section.id,
      title,
      classes,
      keywords: normalize(`${section.dataset.catalogGroup || ''} ${section.dataset.searchKeywords || ''} ${tokens} ${classes.join(' ')}`),
    };
  });
  let matches = [];
  let activeIndex = -1;
  let previousFocus;
  let restoreFocus = true;
  let closeTimer;

  for (const opener of openers) opener.hidden = false;

  function select(index) {
    if (!matches.length) return;
    activeIndex = (index + matches.length) % matches.length;
    for (const [itemIndex, option] of [...results.querySelectorAll('[role="option"]')].entries()) {
      const active = itemIndex === activeIndex;
      option.classList.toggle('is-active', active);
      option.setAttribute('aria-selected', String(active));
      if (active) {
        input.setAttribute('aria-activedescendant', option.id);
        scrollWithin(results, option);
      }
    }
  }

  function render() {
    const query = normalize(input.value);
    function rank(entry) {
      if (entry.classes.includes(query)) return 0;
      if (query.startsWith('.tg-') && entry.classes.some(name => name.startsWith(`${query}--`) || name.startsWith(`${query}__`))) return 1;
      const title = normalize(entry.title);
      if (title === query) return 2;
      return title.includes(query) ? 3 : 4;
    }
    matches = entries.filter(entry => !query || normalize(`${entry.title} ${entry.keywords}`).includes(query));
    if (query) matches.sort((a, b) => rank(a) - rank(b));
    activeIndex = -1;
    input.removeAttribute('aria-activedescendant');
    results.replaceChildren();
    for (const [index, entry] of matches.entries()) {
      const item = document.createElement('li');
      item.setAttribute('role', 'none');
      const option = document.createElement('a');
      const title = document.createElement('span');
      const meta = document.createElement('span');
      option.id = `catalog-search-result-${index}`;
      option.href = `#${entry.id}`;
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');
      option.tabIndex = -1;
      title.textContent = entry.title;
      meta.className = 'catalog-search__meta';
      meta.textContent = `#${entry.id}${query && entry.classes.includes(query) ? ` · Компонент ${query}` : ''}`;
      option.append(title, meta);
      option.addEventListener('click', event => {
        event.preventDefault();
        choose(entry.id);
      });
      item.append(option);
      results.append(item);
    }
    status.textContent = matches.length ? `Найдено разделов: ${matches.length}` : 'Ничего не найдено. Измените запрос.';
  }

  // Keyboard commands repeat often, so a keyboard-opened search appears without animation.
  function open({ instant = false, trigger } = {}) {
    if (dialog.open) return;
    clearTimeout(closeTimer);
    dialog.classList.toggle('is-instant', instant);
    restoreFocus = true;
    // Safari does not necessarily focus a button on pointer click.
    previousFocus = trigger || document.activeElement;
    dialog.classList.remove('is-closing');
    input.value = '';
    render();
    dialog.showModal();
    input.focus({ preventScroll: true });
  }

  function finishClose() {
    clearTimeout(closeTimer);
    if (dialog.open) dialog.close();
    dialog.classList.remove('is-closing');
  }

  function close() {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    if (getComputedStyle(dialog).animationName === 'none') { finishClose(); return; }
    dialog.classList.add('is-closing');
    closeTimer = setTimeout(finishClose, 250);
  }

  function choose(id) {
    restoreFocus = false;
    finishClose();
    navigate(id, { focus: true });
  }

  for (const opener of openers) opener.addEventListener('click', event => open({ instant: event.detail === 0, trigger: opener }));
  root.querySelector('[data-catalog-search-close]').addEventListener('click', () => close());
  input.addEventListener('input', render);
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      select(activeIndex + (event.key === 'ArrowDown' ? 1 : -1));
    } else if (event.key === 'Enter' && matches.length) {
      event.preventDefault();
      choose(matches[activeIndex < 0 ? 0 : activeIndex].id);
    }
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('animationend', event => {
    if (event.target === dialog && dialog.classList.contains('is-closing')) finishClose();
  });
  dialog.addEventListener('close', () => {
    if (restoreFocus && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  });
  root.addEventListener('keydown', event => {
    const command = (event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k';
    if (dialog.open) {
      if (command) event.preventDefault();
      return;
    }
    if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
    if (command) {
      event.preventDefault();
      open({ instant: true });
      return;
    }
    if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      open({ instant: true });
    }
  });

  return { open, close };
}
