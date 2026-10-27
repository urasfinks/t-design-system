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
  const entries = [...root.querySelectorAll('main > section[id]')].map(section => ({
    id: section.id,
    title: headingText(section.querySelector(':scope > .section-heading h2')) || headingText(section.querySelector(':scope h1')) || section.id,
    keywords: normalize(`${section.dataset.searchKeywords || ''} ${[...section.querySelectorAll('[data-search-tokens]')].map(row => row.dataset.searchTokens).join(' ')}`),
  }));
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
        option.scrollIntoView({ block: 'nearest' });
      }
    }
  }

  function render() {
    const query = normalize(input.value);
    matches = entries.filter(entry => !query || normalize(`${entry.title} ${entry.keywords}`).includes(query));
    activeIndex = -1;
    input.removeAttribute('aria-activedescendant');
    results.replaceChildren();
    for (const [index, entry] of matches.entries()) {
      const item = document.createElement('li');
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
      meta.textContent = `#${entry.id}`;
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

  function open() {
    if (dialog.open) return;
    clearTimeout(closeTimer);
    restoreFocus = true;
    previousFocus = document.activeElement;
    dialog.classList.remove('is-closing');
    input.value = '';
    render();
    dialog.showModal();
    input.focus();
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

  for (const opener of openers) opener.addEventListener('click', open);
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
    if (command) {
      event.preventDefault();
      open();
      return;
    }
    if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      open();
    }
  });

  return { open, close };
}
