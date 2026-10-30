import '../dist/ui.js';
const svgNS = 'http://www.w3.org/2000/svg';
const aliases = { home: 'дом главная', search: 'поиск', mail: 'почта письмо', user: 'пользователь профиль', settings: 'настройки', heart: 'сердце избранное', 'trash-2': 'удалить корзина', x: 'закрыть', check: 'галочка готово', plus: 'добавить плюс', menu: 'меню', calendar: 'календарь', clock: 'время часы', bell: 'уведомления', download: 'скачать', upload: 'загрузить' };

export async function initIconBrowser(scope = document) {
  const root = scope.matches?.('[data-icon-browser]') ? scope : scope.querySelector('[data-icon-browser]');
  if (!root || root.dataset.initialized) return;
  root.dataset.initialized = 'true';
  const focusOptions = { preventScroll: !!root.closest('.example-body') };
  const get = id => root.querySelector(`#icon-${id}`);
  const search = get('search'), size = get('size'), grid = get('grid'), count = get('count');
  const markup = get('markup'), status = get('copy-status');
  let icons, selected = 'home', activeName = 'home';
  const iconClass = () => `tg-icon${size.value === '16' ? ' tg-icon--sm' : size.value === '24' ? ' tg-icon--lg' : ''}`;
  const assetBase = root.dataset.iconBase || '../dist/icons/';
  const updateMarkup = () => {
    markup.textContent = `<svg class="${iconClass()}" viewBox="0 0 24 24" width="${size.value}" height="${size.value}" aria-hidden="true"><use href="${assetBase}${selected}.svg#${selected}"></use></svg>`;
    status.textContent = '';
  };
  const render = () => {
    const query = search.value.trim().toLocaleLowerCase();
    const matches = icons.filter(icon => `${icon.name} ${icon.tags.join(' ')} ${aliases[icon.name] || ''}`.toLocaleLowerCase().includes(query));
    if (!matches.some(icon => icon.name === activeName)) activeName = matches.some(icon => icon.name === selected) ? selected : matches[0]?.name;
    const fragment = document.createDocumentFragment();
    for (const icon of matches) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'tg-btn tg-btn--stacked icon-swatch';
      button.setAttribute('aria-label', icon.name);
      button.tabIndex = icon.name === activeName ? 0 : -1;
      button.setAttribute('aria-pressed', String(selected === icon.name));
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('class', iconClass()); svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', size.value); svg.setAttribute('height', size.value);
      const use = document.createElementNS(svgNS, 'use');
      use.setAttribute('href', `${assetBase}${icon.name}.svg#${icon.name}`);
      svg.append(use);
      const label = document.createElement('span');
      label.className = 'tg-text-muted';
      label.textContent = icon.name;
      button.append(svg, label);
      button.addEventListener('click', () => {
        selected = icon.name; activeName = icon.name;
        grid.querySelector('[tabindex="0"]')?.setAttribute('tabindex', '-1');
        button.tabIndex = 0;
        grid.querySelector('[aria-pressed="true"]')?.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-pressed', 'true'); updateMarkup();
      });
      fragment.append(button);
    }
    grid.replaceChildren(fragment);
    count.textContent = `${matches.length} / ${icons.length} иконок`;
    get('empty').hidden = matches.length > 0;
  };
  try {
    const response = await fetch(root.dataset.manifestUrl || '../dist/icons.json');
    if (!response.ok) throw new Error('Manifest request failed');
    icons = await response.json();
    icons = icons.filter(icon => /^[a-z0-9-]+$/.test(icon.name) && Array.isArray(icon.tags));
  } catch {
    count.textContent = 'Не удалось загрузить иконки. Обновите страницу.';
    get('copy').disabled = true;
    return;
  }
  grid.addEventListener('keydown', event => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (!keys.includes(event.key) || !event.target.matches('.icon-swatch')) return;
    const buttons = [...grid.querySelectorAll('.icon-swatch')];
    const current = buttons.indexOf(event.target);
    const firstTop = buttons[0].getBoundingClientRect().top;
    const columns = buttons.filter(button => Math.abs(button.getBoundingClientRect().top - firstTop) < 1).length;
    const rtl = getComputedStyle(grid).direction === 'rtl';
    const step = {ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: columns, ArrowUp: -columns};
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, current + step[event.key]));
    event.preventDefault();
    event.target.tabIndex = -1;
    buttons[next].tabIndex = 0;
    activeName = buttons[next].getAttribute('aria-label');
    buttons[next].focus(focusOptions);
  });
  search.addEventListener('input', render);
  size.addEventListener('change', () => { render(); updateMarkup(); });
  get('reset').addEventListener('click', () => { search.value = ''; render(); search.focus(focusOptions); });
  get('copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(markup.textContent);
      status.textContent = 'Разметка скопирована';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange(); range.selectNodeContents(markup);
      selection.removeAllRanges(); selection.addRange(range); markup.focus(focusOptions);
      status.textContent = 'Разметка выделена. Нажмите Ctrl+C или ⌘C, чтобы скопировать.';
    }
  });
  render(); updateMarkup();
}

initIconBrowser();
