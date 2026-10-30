import { scrollWithin } from './demo-navigation.js';
// Behaviour for the component examples of the catalog: what a host application does
// around the TDS styles. Each widget has its own init function; all are scoped to `root`.
const anchorSupported = typeof CSS !== 'undefined' && CSS.supports('position-area: block-end');

// Measured placement for browsers without CSS anchor positioning. `side` is logical.
export function placeFloating(trigger, layer, side = 'block-end', gap = 6) {
  layer.dataset.positioned = '';
  const rect = trigger.getBoundingClientRect();
  const { offsetWidth: width, offsetHeight: height } = layer;
  const rtl = getComputedStyle(trigger).direction === 'rtl';
  const physical = { 'block-start': 'top', top: 'top', 'block-end': 'bottom', bottom: 'bottom',
    'inline-start': rtl ? 'right' : 'left', 'inline-end': rtl ? 'left' : 'right' }[side] ?? 'bottom';
  let top, left;
  if (physical === 'top' || physical === 'bottom') {
    left = rect.left + rect.width / 2 - width / 2;
    top = physical === 'top' ? rect.top - gap - height : rect.bottom + gap;
    if (top < 8 && physical === 'top') top = rect.bottom + gap;
    if (top + height > innerHeight - 8 && physical === 'bottom') top = rect.top - gap - height;
  } else {
    top = rect.top + rect.height / 2 - height / 2;
    left = physical === 'left' ? rect.left - gap - width : rect.right + gap;
  }
  left = Math.min(Math.max(8, left), innerWidth - width - 8);
  top = Math.min(Math.max(8, top), innerHeight - height - 8);
  // The layer is fixed and uses logical inset: convert left to inline-start.
  layer.style.setProperty('--tg-anchor-block', `${top}px`);
  layer.style.setProperty('--tg-anchor-inline', `${rtl ? innerWidth - left - width : left}px`);
}

export function showAnchored(trigger, layer, side) {
  layer.removeAttribute('data-positioned');
  if (anchorSupported) {
    try { layer.showPopover({ source: trigger }); return; } catch { layer.showPopover(); }
  } else layer.showPopover();
  placeFloating(trigger, layer, side);
}

// Tooltips: 500 ms delay on hover, instant on focus and while another tooltip was just
// open (moving along a toolbar), Escape hides without moving focus.
export function initTooltips({ root = document } = {}) {
  let open = null, showTimer = 0, hideTimer = 0, warmUntil = 0;
  const hide = () => {
    clearTimeout(showTimer);
    if (!open) return;
    if (open.matches(':popover-open')) open.hidePopover();
    open = null;
    warmUntil = performance.now() + 300;
  };
  const show = (trigger, tip, instant) => {
    clearTimeout(hideTimer); clearTimeout(showTimer);
    const run = () => {
      if (open && open !== tip) { open.hidePopover(); }
      open = tip;
      tip.toggleAttribute('data-instant', instant || performance.now() < warmUntil);
      if (!tip.matches(':popover-open')) showAnchored(trigger, tip, tip.dataset.side ?? 'block-start');
    };
    if (instant || open || performance.now() < warmUntil) run(); else showTimer = setTimeout(run, 500);
  };
  for (const trigger of root.querySelectorAll('[data-tooltip]')) {
    const tip = root.getElementById(trigger.dataset.tooltip);
    if (!tip) continue;
    trigger.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') show(trigger, tip, false); });
    trigger.addEventListener('pointerleave', () => { clearTimeout(showTimer); hideTimer = setTimeout(hide, 80); });
    trigger.addEventListener('focus', () => { if (trigger.matches(':focus-visible')) show(trigger, tip, true); });
    trigger.addEventListener('blur', hide);
    trigger.addEventListener('pointerdown', hide);
  }
  root.addEventListener('keydown', event => { if (event.key === 'Escape' && open) { hide(); } });
}

// Independent toggles: aria-pressed flips on click.
export function initPressToggles({ root = document } = {}) {
  for (const button of root.querySelectorAll('[data-press-toggle]')) {
    button.addEventListener('click', () => button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true')));
  }
}

const announce = (region, text) => { if (!region) return; region.textContent = ''; requestAnimationFrame(() => { region.textContent = text; }); };

// Toolbar: one Tab stop, arrows/Home/End move focus (WAI-ARIA toolbar pattern).
export function initToolbars({ root = document } = {}) {
  for (const bar of root.querySelectorAll('[role="toolbar"]')) {
    const items = () => [...bar.querySelectorAll('button, a[href], input, select')].filter(el => !el.disabled && el.offsetParent !== null);
    const set = current => { for (const el of items()) el.tabIndex = el === current ? 0 : -1; };
    set(items()[0]);
    bar.addEventListener('focusin', event => { if (items().includes(event.target)) set(event.target); });
    bar.addEventListener('keydown', event => {
      const list = items(), index = list.indexOf(document.activeElement);
      if (index < 0) return;
      const vertical = bar.getAttribute('aria-orientation') === 'vertical';
      const rtl = getComputedStyle(bar).direction === 'rtl';
      const next = { [vertical ? 'ArrowDown' : (rtl ? 'ArrowLeft' : 'ArrowRight')]: index + 1, [vertical ? 'ArrowUp' : (rtl ? 'ArrowRight' : 'ArrowLeft')]: index - 1, Home: 0, End: list.length - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      list[(next + list.length) % list.length].focus({ preventScroll: true });
    });
  }
}

// Copy: clipboard write, a two-second confirmation, a spoken result, a visible failure.
export function initCopy({ root = document } = {}) {
  const status = root.getElementById('demo-copy-status');
  for (const button of root.querySelectorAll('[data-copy]')) {
    let timer = 0;
    button.addEventListener('click', async () => {
      const copy = button.closest('.tg-copy');
      const value = root.getElementById(button.dataset.copy).textContent.trim();
      let ok = true;
      try { await navigator.clipboard.writeText(value); } catch { ok = false; }
      copy.dataset.state = ok ? 'copied' : 'error';
      if (button.classList.contains('tg-btn')) button.dataset.state = ok ? 'success' : 'error';
      announce(status, ok ? 'Скопировано' : 'Не удалось скопировать: выделите текст вручную');
      clearTimeout(timer);
      timer = setTimeout(() => { delete copy.dataset.state; if (button.classList.contains('tg-btn')) button.dataset.state = 'idle'; }, 2000);
    });
  }
}

// Toast region with a stack: newest in front, three visible, expands on hover/focus,
// pauses its timers while expanded, Escape closes the focused toast.
export function initToastRegion({ root = document } = {}) {
  const region = root.getElementById('demo-toast-region');
  if (!region) return;
  const list = region.firstElementChild;
  const messages = {
    saved: { icon: 'check-circle', title: 'Черновик сохранён', text: 'Счёт №4402', action: null },
    paid: { icon: 'credit-card', title: 'Платёж проведён', text: '12 400 ₽ от «Лесной артели»', action: 'Открыть' },
    deleted: { icon: 'trash-2', title: 'Счёт удалён', text: 'Его можно вернуть в течение 10 секунд', action: 'Отменить' },
  };
  const timers = new Map();
  const layout = () => {
    const toasts = [...list.children].reverse(); // newest first
    let offset = 0;
    const gap = 8;
    toasts.forEach((toast, index) => {
      toast.style.setProperty('--toast-index', index);
      toast.style.setProperty('--toast-offset', `${offset}px`);
      toast.toggleAttribute('data-front', index === 0);
      toast.toggleAttribute('data-overflow', index > 2);
      offset += toast.offsetHeight + gap;
    });
    const front = toasts[0]?.offsetHeight ?? 0;
    list.style.setProperty('--toast-stack-height', `${front + Math.min(toasts.length - 1, 2) * 10}px`);
    list.style.setProperty('--toast-stack-expanded', `${Math.max(0, offset - gap)}px`);
  };
  const paused = () => region.matches(':hover, :focus-within');
  const schedule = (toast, ms) => {
    clearTimeout(timers.get(toast));
    timers.set(toast, setTimeout(function tick() {
      if (paused()) { timers.set(toast, setTimeout(tick, 500)); return; }
      dismiss(toast);
    }, ms));
  };
  const dismiss = toast => {
    clearTimeout(timers.get(toast)); timers.delete(toast);
    const hadFocus = toast.contains(document.activeElement);
    toast.classList.remove('tg-toast--show');
    setTimeout(() => { toast.remove(); layout(); }, 200);
    if (hadFocus) root.querySelector('[data-toast-demo]')?.focus({ preventScroll: true });
  };
  const icon = name => `<svg class="tg-icon" viewBox="0 0 24 24" aria-hidden="true"><use href="../dist/icons/${name}.svg#${name}"></use></svg>`;
  for (const button of root.querySelectorAll('[data-toast-demo]')) {
    button.addEventListener('click', () => {
      const m = messages[button.dataset.toastDemo];
      const toast = document.createElement('div');
      toast.className = 'tg-toast';
      toast.innerHTML = `${icon(m.icon)}<div class="tg-toast__body"><strong class="tg-toast__title">${m.title}</strong><span>${m.text}</span></div>`
        + (m.action ? `<button class="tg-btn tg-btn--ghost tg-btn--sm tg-toast__action" type="button">${m.action}</button>` : '')
        + `<button class="tg-icon-btn tg-icon-btn--ghost tg-toast__close" type="button" aria-label="Закрыть уведомление">${icon('x')}</button>`;
      list.append(toast);
      layout();
      requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('tg-toast--show')));
      toast.addEventListener('click', event => { if (event.target.closest('.tg-toast__close, .tg-toast__action')) dismiss(toast); });
      toast.addEventListener('keydown', event => { if (event.key === 'Escape') { event.stopPropagation(); dismiss(toast); } });
      schedule(toast, m.action ? 8000 : 5000);
      while (list.children.length > 5) dismiss(list.firstElementChild);
    });
  }
  new ResizeObserver(layout).observe(list);
}

export function initBanners({ root = document } = {}) {
  for (const button of root.querySelectorAll('[data-banner-dismiss]')) {
    button.addEventListener('click', () => {
      const banner = button.closest('.tg-banner');
      banner.hidden = true;
      // Focus returns to the start of the content the banner sat above.
      const target = banner.parentElement.querySelector('.tg-banner:not([hidden]) .tg-banner__dismiss') ?? banner.closest('section')?.querySelector('h2');
      if (target) { if (!target.matches('button, a, [tabindex]')) target.tabIndex = -1; target.focus({ preventScroll: true }); }
    });
  }
}

// Stepper: Back/Next move aria-current and data-state, the counter follows.
export function initSteppers({ root = document } = {}) {
  for (const button of root.querySelectorAll('[data-stepper-move]')) {
    button.addEventListener('click', () => {
      const stepper = root.getElementById(button.getAttribute('aria-controls'));
      const steps = [...stepper.querySelectorAll('.tg-stepper__step')];
      const current = Math.max(0, steps.findIndex(step => step.getAttribute('aria-current') === 'step'));
      const next = Math.min(steps.length - 1, Math.max(0, current + Number(button.dataset.stepperMove)));
      steps.forEach((step, index) => {
        if (index === next) { step.setAttribute('aria-current', 'step'); step.removeAttribute('data-state'); }
        else { step.removeAttribute('aria-current'); if (index < next) step.dataset.state = 'done'; else step.removeAttribute('data-state'); }
        const marker = step.querySelector('.tg-stepper__marker');
        marker.innerHTML = index < next ? '<svg class="tg-icon" viewBox="0 0 24 24" aria-hidden="true"><use href="../dist/icons/check.svg#check"></use></svg>' : String(index + 1);
      });
      const count = root.getElementById(`${stepper.id}-count`);
      if (count) count.textContent = `Шаг ${next + 1} из ${steps.length}`;
    });
  }
}

export function initProgressRings({ root = document } = {}) {
  const range = root.getElementById('demo-ring-range'), ring = root.getElementById('demo-ring');
  range?.addEventListener('input', () => { ring.style.setProperty('--value', range.value); ring.setAttribute('aria-valuenow', range.value); });
}

// Card → dialog: a shared view-transition name makes the card grow into the dialog.
export function initMorphDialogs({ root = document } = {}) {
  for (const button of root.querySelectorAll('[data-morph-open]')) {
    const dialog = root.getElementById(button.dataset.morphOpen);
    const card = button.closest('.tg-card');
    const swap = (from, to, run) => {
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!document.startViewTransition || reduced) { run(); return; }
      from.style.viewTransitionName = 'tg-card-morph';
      const transition = document.startViewTransition(() => { from.style.viewTransitionName = ''; run(); to.style.viewTransitionName = 'tg-card-morph'; });
      transition.finished.finally(() => { to.style.viewTransitionName = ''; });
    };
    button.addEventListener('click', () => swap(card, dialog, () => dialog.showModal()));
    dialog.querySelector('[data-dialog-close]')?.addEventListener('click', () => swap(dialog, card, () => dialog.close()));
    dialog.addEventListener('close', () => button.focus({ preventScroll: true }));
  }
}

const icon = name => `<svg class="tg-icon" viewBox="0 0 24 24" aria-hidden="true"><use href="../dist/icons/${name}.svg#${name}"></use></svg>`;
const escapeHTML = value => value.replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));

// Select-only combobox (APG): the trigger keeps focus, aria-activedescendant names the
// active option; arrows, Home/End and typeahead move it, Enter/Space/Tab choose.
export function initListboxes({ root = document } = {}) {
  for (const trigger of root.querySelectorAll('[data-listbox]')) {
    const list = root.getElementById(trigger.getAttribute('aria-controls'));
    const hidden = trigger.parentElement.querySelector('input[type="hidden"]');
    const options = () => [...list.querySelectorAll('[role="option"]')];
    const enabled = () => options().filter(option => option.getAttribute('aria-disabled') !== 'true');
    let active = null, closedAt = 0, typed = '', typedTimer = 0;
    const setActive = option => {
      for (const o of options()) o.toggleAttribute('data-active', o === option);
      active = option;
      if (option) { trigger.setAttribute('aria-activedescendant', option.id); scrollWithin(list, option); }
      else trigger.removeAttribute('aria-activedescendant');
    };
    const open = () => {
      list.style.setProperty('--tg-anchor-width', `${trigger.offsetWidth}px`);
      showAnchored(trigger, list, 'block-end');
      if (list.dataset.positioned !== undefined) list.style.minInlineSize = `${trigger.offsetWidth}px`;
      trigger.setAttribute('aria-expanded', 'true');
      setActive(options().find(o => o.getAttribute('aria-selected') === 'true') ?? enabled()[0]);
    };
    let closing = false;
    const close = () => {
      closing = true;
      if (list.matches(':popover-open')) list.hidePopover();
      closing = false;
      trigger.setAttribute('aria-expanded', 'false');
      setActive(null);
    };
    const choose = option => {
      if (!option || option.getAttribute('aria-disabled') === 'true') return;
      for (const o of options()) o.setAttribute('aria-selected', String(o === option));
      const value = trigger.querySelector('[data-listbox-value]');
      value.textContent = option.querySelector('.tg-listbox__text')?.firstChild.textContent.trim() ?? option.textContent.trim();
      const media = option.querySelector(':scope > .tg-icon, :scope > .tg-avatar');
      trigger.querySelector(':scope > .tg-icon, :scope > .tg-avatar')?.replaceWith(media.cloneNode(true));
      if (hidden) hidden.value = option.id.split('-').pop();
      close();
    };
    // A light dismiss (pointerdown outside, including on the trigger) closes the list before
    // the trigger's click; remember it so that click does not reopen the list.
    list.addEventListener('beforetoggle', event => { if (event.newState === 'closed' && !closing) closedAt = performance.now(); });
    list.addEventListener('toggle', event => { if (event.newState === 'closed') { trigger.setAttribute('aria-expanded', 'false'); setActive(null); } });
    trigger.addEventListener('click', () => {
      if (performance.now() - closedAt < 200) return; // the light dismiss of this same click
      trigger.getAttribute('aria-expanded') === 'true' ? close() : open();
    });
    trigger.addEventListener('keydown', event => {
      delete list.dataset.pointer;
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';
      const list_ = enabled();
      const index = list_.indexOf(active);
      if (!isOpen) {
        if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) { event.preventDefault(); list.toggleAttribute('data-instant', true); open(); if (event.key === 'ArrowUp') setActive(list_.at(-1)); }
        return;
      }
      const move = next => { event.preventDefault(); setActive(list_[Math.max(0, Math.min(list_.length - 1, next))]); };
      switch (event.key) {
        case 'ArrowDown': return move(index + 1);
        case 'ArrowUp': return move(index - 1);
        case 'Home': return move(0);
        case 'End': return move(list_.length - 1);
        case 'Enter': case ' ': event.preventDefault(); return choose(active);
        case 'Tab': return choose(active);
        case 'Escape': event.preventDefault(); return close();
      }
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        clearTimeout(typedTimer); typed += event.key.toLocaleLowerCase('ru');
        typedTimer = setTimeout(() => { typed = ''; }, 500);
        const found = list_.find(o => o.textContent.trim().toLocaleLowerCase('ru').startsWith(typed));
        if (found) setActive(found);
      }
    });
    list.addEventListener('pointermove', event => { list.dataset.pointer = ''; const option = event.target.closest('[role="option"]'); if (option && option !== active && option.getAttribute('aria-disabled') !== 'true') setActive(option); });
    list.addEventListener('click', event => { const option = event.target.closest('[role="option"]'); if (option) { choose(option); trigger.focus({ preventScroll: true }); } });
  }
}

// Editable combobox with list autocomplete; single value or tags for several.
export function initComboboxes({ root = document } = {}) {
  for (const box of root.querySelectorAll('[data-combobox]')) {
    const input = box.querySelector('.tg-combobox__input');
    const list = box.querySelector('.tg-combobox__list');
    const status = root.getElementById(`${list.id.replace(/-list$/, '')}-status`);
    const multiple = box.hasAttribute('data-multiple');
    const all = box.dataset.options.split('|');
    const tagBox = box.querySelector('.tg-tag-input');
    // With scripts the custom list replaces the native datalist fallback.
    input.removeAttribute('list');
    const chosen = () => tagBox ? [...tagBox.querySelectorAll('.tg-tag-input__tag')].map(tag => tag.dataset.value) : [];
    let active = -1, items = [];
    const render = () => {
      const query = input.value.trim().toLocaleLowerCase('ru');
      items = all.filter(value => value.toLocaleLowerCase('ru').includes(query));
      list.innerHTML = items.map((value, index) => `<li class="tg-listbox__option" role="option" id="${list.id}-${index}" aria-selected="${multiple ? chosen().includes(value) : value === input.value}">${escapeHTML(value)}</li>`).join('');
      active = -1;
      input.removeAttribute('aria-activedescendant');
      announce(status, items.length ? `Найдено: ${items.length}` : 'Ничего не найдено');
    };
    const open = () => { render(); list.hidden = false; input.setAttribute('aria-expanded', 'true'); };
    const close = () => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); };
    const setActive = index => {
      const options = [...list.children];
      if (!options.length) return;
      active = (index + options.length) % options.length;
      options.forEach((option, i) => option.toggleAttribute('data-active', i === active));
      input.setAttribute('aria-activedescendant', options[active].id);
      scrollWithin(list, options[active]);
    };
    const addTag = value => {
      if (chosen().includes(value)) { tagBox.querySelector(`[data-value="${CSS.escape(value)}"] .tg-tag-input__remove`)?.click(); return; }
      const tag = document.createElement('span');
      tag.className = 'tg-tag-input__tag'; tag.dataset.value = value;
      tag.innerHTML = `${escapeHTML(value)}<button class="tg-tag-input__remove" type="button" aria-label="Удалить ${escapeHTML(value)}">${icon('x')}</button>`;
      input.before(tag);
      announce(status, `Добавлено: ${value}`);
    };
    const choose = index => {
      const value = items[index];
      if (value === undefined) return;
      if (multiple) { addTag(value); input.value = ''; render(); input.focus({ preventScroll: true }); }
      else { input.value = value; close(); announce(status, `Выбрано: ${value}`); }
    };
    input.addEventListener('input', open);
    input.addEventListener('focus', () => { if (multiple) open(); });
    input.addEventListener('keydown', event => {
      delete list.dataset.pointer;
      const isOpen = !list.hidden;
      if (event.key === 'ArrowDown') { event.preventDefault(); if (!isOpen) open(); setActive(active + 1); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); if (!isOpen) open(); setActive(active - 1); }
      else if (event.key === 'Enter' && isOpen && active >= 0) { event.preventDefault(); choose(active); }
      else if (event.key === 'Escape') { if (isOpen) { event.preventDefault(); close(); } else if (input.value) input.value = ''; }
      else if (event.key === 'Backspace' && multiple && !input.value) { const last = [...tagBox.querySelectorAll('.tg-tag-input__tag')].at(-1); if (last) { announce(status, `Удалено: ${last.dataset.value}`); last.remove(); render(); } }
    });
    list.addEventListener('pointerdown', event => event.preventDefault());
    list.addEventListener('pointermove', event => { list.dataset.pointer = ''; const option = event.target.closest('[role="option"]'); if (option) setActive([...list.children].indexOf(option)); });
    list.addEventListener('click', event => { const option = event.target.closest('[role="option"]'); if (option) choose([...list.children].indexOf(option)); });
    tagBox?.addEventListener('click', event => {
      const remove = event.target.closest('.tg-tag-input__remove');
      if (remove) { const tag = remove.closest('.tg-tag-input__tag'); announce(status, `Удалено: ${tag.dataset.value}`); tag.remove(); render(); input.focus({ preventScroll: true }); }
      else if (event.target === tagBox) input.focus({ preventScroll: true });
    });
    box.addEventListener('focusout', event => { if (!box.contains(event.relatedTarget)) close(); });
  }
}

// Free tags: Enter, comma or paste add; duplicates are ignored; Backspace removes the
// last; arrows move between tags; each change is announced.
export function initTagInputs({ root = document } = {}) {
  for (const box of root.querySelectorAll('[data-tag-input]')) {
    const field = box.querySelector('.tg-tag-input__field');
    const status = root.getElementById(`${field.id}-status`);
    const limit = Number(box.dataset.limitCount || Infinity);
    const tags = () => [...box.querySelectorAll('.tg-tag-input__tag')];
    const values = () => tags().map(tag => tag.firstChild.textContent.trim());
    const sync = () => { box.toggleAttribute('data-limit', tags().length >= limit); field.placeholder = tags().length >= limit ? 'Достигнут предел' : 'Новый тег'; };
    const add = raw => {
      for (const value of raw.split(',').map(part => part.trim()).filter(Boolean)) {
        if (values().includes(value)) { announce(status, `Тег «${value}» уже есть`); continue; }
        if (tags().length >= limit) { announce(status, `Не больше ${limit} тегов`); break; }
        const tag = document.createElement('span');
        tag.className = 'tg-tag-input__tag';
        tag.innerHTML = `${escapeHTML(value)}<button class="tg-tag-input__remove" type="button" aria-label="Удалить тег ${escapeHTML(value)}">${icon('x')}</button><input type="hidden" name="tags[]" value="${escapeHTML(value)}">`;
        field.before(tag);
        announce(status, `Добавлен тег «${value}»`);
      }
      sync();
    };
    const remove = tag => { const value = tag.firstChild.textContent.trim(); tag.remove(); announce(status, `Удалён тег «${value}»`); sync(); };
    field.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ',') && field.value.trim()) { event.preventDefault(); add(field.value); field.value = ''; }
      else if (event.key === 'Backspace' && !field.value && tags().length) remove(tags().at(-1));
      else if (event.key === 'ArrowLeft' && field.selectionStart === 0 && tags().length) { event.preventDefault(); tags().at(-1).querySelector('button').focus({ preventScroll: true }); }
    });
    field.addEventListener('paste', event => { const text = event.clipboardData?.getData('text') ?? ''; if (text.includes(',')) { event.preventDefault(); add(text); } });
    box.addEventListener('click', event => {
      const button = event.target.closest('.tg-tag-input__remove');
      if (button) { remove(button.closest('.tg-tag-input__tag')); field.focus({ preventScroll: true }); }
      else if (event.target === box) field.focus({ preventScroll: true });
    });
    box.addEventListener('keydown', event => {
      const button = event.target.closest('.tg-tag-input__remove');
      if (!button) return;
      const list = tags(), index = list.indexOf(button.closest('.tg-tag-input__tag'));
      if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); list[index - 1].querySelector('button').focus({ preventScroll: true }); }
      if (event.key === 'ArrowRight') { event.preventDefault(); (list[index + 1]?.querySelector('button') ?? field).focus({ preventScroll: true }); }
      if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); const next = list[index + 1]?.querySelector('button') ?? field; remove(list[index]); next.focus({ preventScroll: true }); }
    });
    sync();
  }
}

export function initNumberFields({ root = document } = {}) {
  for (const box of root.querySelectorAll('[data-number]')) {
    const input = box.querySelector('input');
    const [down, up] = box.querySelectorAll('[data-step]');
    const sync = () => { const value = Number(input.value); down.disabled = value <= Number(input.min); up.disabled = value >= Number(input.max); };
    for (const button of [down, up]) button.addEventListener('click', () => {
      button.dataset.step === '1' ? input.stepUp() : input.stepDown();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      if (button.disabled) input.focus({ preventScroll: true });
    });
    input.addEventListener('input', sync);
    sync();
  }
}

// One-time code: one real field; the cells mirror it and show the caret position.
export function initOtp({ root = document } = {}) {
  for (const box of root.querySelectorAll('[data-otp]')) {
    const input = box.querySelector('.tg-otp__input');
    const slots = [...box.querySelectorAll('.tg-otp__slot')];
    const status = root.getElementById(`${input.id}-status`);
    const render = () => {
      const digits = input.value;
      slots.forEach((slot, index) => { slot.textContent = digits[index] ?? ''; slot.toggleAttribute('data-active', index === Math.min(digits.length, slots.length - 1)); });
    };
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '').slice(0, slots.length);
      delete box.dataset.state;
      render();
      if (input.value.length === slots.length) {
        box.setAttribute('aria-busy', 'true');
        setTimeout(() => {
          box.removeAttribute('aria-busy');
          const ok = input.value === '246810';
          box.dataset.state = ok ? 'success' : 'error';
          input.setAttribute('aria-invalid', String(!ok));
          announce(status, ok ? 'Код подтверждён' : 'Неверный код, попробуйте ещё раз');
          if (!ok) setTimeout(() => { input.value = ''; render(); }, 900);
        }, 400);
      }
    });
    input.addEventListener('focus', render);
    // Keep the caret at the end: the cells show one position only.
    input.addEventListener('select', () => input.setSelectionRange(input.value.length, input.value.length));
    render();
  }
}

export function initRanges({ root = document } = {}) {
  const money = value => `${Number(value).toLocaleString('ru-RU')} ₽`;
  for (const range of root.querySelectorAll('[data-range-output]')) {
    const output = root.getElementById(range.dataset.rangeOutput);
    const sync = () => {
      const percent = (range.value - range.min) / (range.max - range.min) * 100;
      range.style.setProperty('--range-progress', `${percent}%`);
      output.textContent = `${range.value}${range.dataset.rangeSuffix ?? ''}`;
    };
    range.addEventListener('input', sync);
  }
  for (const field of root.querySelectorAll('[data-range-dual]')) {
    const track = field.querySelector('.tg-range-dual');
    const [low, high] = track.querySelectorAll('input');
    const output = field.querySelector('output');
    const sync = event => {
      const gap = Number(low.step || 1);
      if (Number(low.value) > Number(high.value) - gap) {
        if (event?.target === low) low.value = Number(high.value) - gap; else high.value = Number(low.value) + gap;
      }
      const span = high.max - high.min;
      track.style.setProperty('--range-start', `${(low.value - low.min) / span * 100}%`);
      track.style.setProperty('--range-end', `${(high.value - high.min) / span * 100}%`);
      low.setAttribute('aria-valuetext', `от ${money(low.value)}`);
      high.setAttribute('aria-valuetext', `до ${money(high.value)}`);
      output.textContent = `${Number(low.value).toLocaleString('ru-RU')} – ${money(high.value)}`;
    };
    low.addEventListener('input', sync); high.addEventListener('input', sync);
    sync();
  }
}

// Hover cards: 500 ms to show, 300 ms to hide, the card itself keeps them open.
export function initHoverCards({ root = document } = {}) {
  for (const trigger of root.querySelectorAll('[data-hover-card]')) {
    const card = root.getElementById(trigger.dataset.hoverCard);
    let showTimer = 0, hideTimer = 0;
    const show = delay => { clearTimeout(hideTimer); clearTimeout(showTimer); showTimer = setTimeout(() => { if (!card.matches(':popover-open')) showAnchored(trigger, card, 'block-end'); }, delay); };
    const hide = delay => { clearTimeout(showTimer); clearTimeout(hideTimer); hideTimer = setTimeout(() => { if (card.matches(':popover-open')) card.hidePopover(); }, delay); };
    trigger.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') show(500); });
    trigger.addEventListener('pointerleave', () => hide(300));
    card.addEventListener('pointerenter', () => clearTimeout(hideTimer));
    card.addEventListener('pointerleave', () => hide(300));
    trigger.addEventListener('focus', () => { card.toggleAttribute('data-instant', true); show(0); });
    trigger.addEventListener('blur', () => { card.removeAttribute('data-instant'); hide(0); });
    trigger.addEventListener('keydown', event => { if (event.key === 'Escape') hide(0); });
  }
}

// Table toolbar: search, status chips, reset, count, empty state and column visibility.
export function initTableFilters({ root = document } = {}) {
  const table = root.getElementById('demo-filter-table');
  if (!table) return;
  const bar = root.getElementById('demo-filter-bar');
  const search = bar.querySelector('[data-filter-search]');
  const chips = [...bar.querySelectorAll('[data-filter-status]')];
  const count = root.getElementById('demo-filter-count');
  const empty = root.getElementById('demo-filter-empty');
  const resets = [...root.querySelectorAll('[data-filter-reset]')];
  const plural = n => `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'счёт' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'счёта' : 'счетов'}`;
  let timer = 0;
  const apply = () => {
    const query = search.value.trim().toLocaleLowerCase('ru');
    const statuses = chips.filter(chip => chip.getAttribute('aria-pressed') === 'true').map(chip => chip.dataset.filterStatus);
    let shown = 0;
    for (const row of table.tBodies[0].rows) {
      const visible = (!query || row.dataset.text.toLocaleLowerCase('ru').includes(query)) && (!statuses.length || statuses.includes(row.dataset.status));
      row.hidden = !visible; shown += visible;
    }
    count.textContent = plural(shown);
    empty.hidden = shown > 0;
    table.hidden = shown === 0;
    resets[0].hidden = !(query || statuses.length);
  };
  search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(apply, 150); });
  // The catalog already flips aria-pressed on every chip; here the filter follows it.
  for (const chip of chips) chip.addEventListener('click', apply);
  for (const reset of resets) reset.addEventListener('click', () => { search.value = ''; for (const chip of chips) chip.setAttribute('aria-pressed', 'false'); apply(); search.focus({ preventScroll: true }); });
  const menu = root.getElementById('demo-columns-menu');
  new MutationObserver(() => {
    for (const item of menu.querySelectorAll('[data-column]')) {
      const index = Number(item.dataset.column), hide = item.getAttribute('aria-checked') !== 'true';
      for (const row of table.rows) if (row.cells[index]) row.cells[index].hidden = hide;
    }
  }).observe(menu, { subtree: true, attributes: true, attributeFilter: ['aria-checked'] });
}

// Carousels (APG): buttons move one slide, dots/thumbnails choose, the indicator follows
// the scroll position; the live region speaks only after a manual change.
export function initCarousels({ root = document } = {}) {
  for (const carousel of root.querySelectorAll('[data-carousel]')) {
    const viewport = carousel.querySelector('.tg-carousel__viewport');
    const slides = [...viewport.children];
    const pickers = [...carousel.querySelectorAll('.tg-pagination > .tg-dot, .tg-carousel__thumbs > button')];
    const prev = carousel.querySelector('[data-carousel-prev]'), next = carousel.querySelector('[data-carousel-next]');
    const status = carousel.querySelector('[data-carousel-status]');
    const vertical = carousel.classList.contains('tg-carousel--vertical');
    let current = 0, manual = false;
    const goTo = (index, speak = true) => {
      index = Math.max(0, Math.min(slides.length - 1, index));
      manual = speak;
      const slide = slides[index];
      const rtl = getComputedStyle(viewport).direction === 'rtl';
      if (vertical) viewport.scrollTo({ top: slide.offsetTop - viewport.offsetTop });
      else {
        const peek = carousel.classList.contains('tg-carousel--peek');
        // Positions are taken inside the scroller, so the scroller's own offset comes off both ways.
        const offset = slide.offsetLeft - viewport.offsetLeft - (peek ? (viewport.clientWidth - slide.clientWidth) / 2 : 0);
        viewport.scrollTo({ left: rtl ? offset - viewport.scrollWidth + viewport.clientWidth : offset });
      }
      mark(index);
    };
    const mark = index => {
      if (index === current && pickers[index]?.getAttribute('aria-current') === 'true') return;
      current = index;
      pickers.forEach((picker, i) => picker.setAttribute('aria-current', String(i === index)));
      if (prev) prev.disabled = index === 0;
      if (next) next.disabled = index === slides.length - 1;
      if (manual && status) status.textContent = slides[index].getAttribute('aria-label');
      scrollWithin(pickers[index]?.parentElement, pickers[index]);
    };
    prev?.addEventListener('click', () => goTo(current - 1));
    next?.addEventListener('click', () => goTo(current + 1));
    pickers.forEach((picker, index) => picker.addEventListener('click', () => goTo(index)));
    viewport.addEventListener('keydown', event => {
      const back = vertical ? 'ArrowUp' : (getComputedStyle(viewport).direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft');
      const forward = vertical ? 'ArrowDown' : (getComputedStyle(viewport).direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
      if (event.key === back) { event.preventDefault(); goTo(current - 1); }
      if (event.key === forward) { event.preventDefault(); goTo(current + 1); }
      if (event.key === 'Home') { event.preventDefault(); goTo(0); }
      if (event.key === 'End') { event.preventDefault(); goTo(slides.length - 1); }
    });
    // The slide closest to the viewport centre is current (covers swipe and wheel). Distance,
    // not visible share: a turned 3D neighbour (G2) can be fully visible without being current.
    let settle = 0;
    const nearest = () => {
      const v = viewport.getBoundingClientRect(), centre = vertical ? v.top + v.height / 2 : v.left + v.width / 2;
      const distance = slide => { const r = slide.getBoundingClientRect(); return Math.abs((vertical ? r.top + r.height / 2 : r.left + r.width / 2) - centre); };
      return slides.reduce((best, slide, i) => distance(slide) < distance(slides[best]) ? i : best, 0);
    };
    viewport.addEventListener('scroll', () => { clearTimeout(settle); settle = setTimeout(() => mark(nearest()), 80); }, { passive: true });
    viewport.addEventListener('pointerdown', () => { manual = false; });
  }
}

// Vertical and collapsed-label tabs: arrows follow aria-orientation, Home/End, panels.
export function initOrientedTabs({ root = document } = {}) {
  for (const list of root.querySelectorAll('.tg-tabs--vertical[role="tablist"], .tg-tabs--collapsed-labels[role="tablist"]')) {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const vertical = list.getAttribute('aria-orientation') === 'vertical';
    const select = tab => {
      for (const t of tabs) {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = root.getElementById(t.getAttribute('aria-controls'));
        if (panel && tabs.filter(x => x.getAttribute('aria-controls') === t.getAttribute('aria-controls')).length === 1) panel.hidden = !on;
        if (panel && on) { panel.setAttribute('aria-labelledby', t.id); panel.hidden = false; }
      }
      tab.focus({ preventScroll: true });
    };
    list.addEventListener('click', event => { const tab = event.target.closest('[role="tab"]'); if (tab) select(tab); });
    list.addEventListener('keydown', event => {
      const index = tabs.indexOf(document.activeElement);
      if (index < 0) return;
      const rtl = getComputedStyle(list).direction === 'rtl';
      const keys = vertical ? { ArrowDown: 1, ArrowUp: -1 } : { [rtl ? 'ArrowLeft' : 'ArrowRight']: 1, [rtl ? 'ArrowRight' : 'ArrowLeft']: -1 };
      if (event.key in keys) { event.preventDefault(); select(tabs[(index + keys[event.key] + tabs.length) % tabs.length]); }
      if (event.key === 'Home') { event.preventDefault(); select(tabs[0]); }
      if (event.key === 'End') { event.preventDefault(); select(tabs.at(-1)); }
    });
  }
}

export function initSidebars({ root = document } = {}) {
  for (const toggle of root.querySelectorAll('[data-sidebar-toggle]')) {
    const sidebar = root.getElementById(toggle.getAttribute('aria-controls'));
    toggle.addEventListener('click', () => {
      const collapsed = sidebar.classList.toggle('tg-sidebar--collapsed');
      toggle.setAttribute('aria-pressed', String(collapsed));
      toggle.setAttribute('aria-label', collapsed ? 'Развернуть панель' : 'Свернуть панель');
    });
  }
}

// Disclosure navigation (APG): one panel open at a time, Escape returns to its button,
// a click outside closes, hover opens with a delay only for a fine pointer.
export function initNavMenus({ root = document } = {}) {
  for (const nav of root.querySelectorAll('[data-nav-menu]')) {
    const triggers = [...nav.querySelectorAll('.tg-nav-menu__trigger')];
    const panel = trigger => root.getElementById(trigger.getAttribute('aria-controls'));
    const set = (trigger, open, instant = false) => {
      for (const t of triggers) {
        const on = t === trigger && open;
        t.setAttribute('aria-expanded', String(on));
        panel(t).hidden = !on;
        panel(t).toggleAttribute('data-instant', on && instant);
      }
    };
    let hoverTimer = 0;
    for (const trigger of triggers) {
      trigger.addEventListener('click', event => set(trigger, trigger.getAttribute('aria-expanded') !== 'true', event.detail === 0));
      trigger.parentElement.addEventListener('pointerenter', event => {
        if (event.pointerType !== 'mouse' || !matchMedia('(hover: hover) and (pointer: fine) and (min-width: 48.01rem)').matches) return;
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => set(trigger, true), 200);
      });
      trigger.parentElement.addEventListener('pointerleave', event => {
        if (event.pointerType !== 'mouse') return;
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => { if (!trigger.parentElement.contains(document.activeElement)) set(trigger, false); }, 250);
      });
    }
    nav.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const open = triggers.find(t => t.getAttribute('aria-expanded') === 'true');
      if (open) { event.preventDefault(); set(open, false); open.focus({ preventScroll: true }); }
    });
    nav.addEventListener('focusout', event => { if (!nav.contains(event.relatedTarget)) for (const t of triggers) if (t.getAttribute('aria-expanded') === 'true') set(t, false); });
    document.addEventListener('pointerdown', event => { if (!nav.contains(event.target)) for (const t of triggers) if (t.getAttribute('aria-expanded') === 'true') set(t, false); });
  }
}

// Menubar (APG): roving focus over items; ↓/Enter/Space open the menu; with a menu open
// ←/→ move to the neighbouring menu; Escape closes back to the bar.
export function initMenubars({ root = document } = {}) {
  for (const bar of root.querySelectorAll('[data-menubar]')) {
    const items = [...bar.querySelectorAll('.tg-menubar__item')];
    const menuOf = item => root.getElementById(item.getAttribute('aria-controls'));
    const entries = menu => [...menu.querySelectorAll('[role^="menuitem"]')];
    let openItem = null;
    const rove = item => { for (const i of items) i.tabIndex = i === item ? 0 : -1; item.focus({ preventScroll: true }); };
    const close = (focusItem = true) => {
      if (!openItem) return;
      const item = openItem; openItem = null;
      const menu = menuOf(item);
      if (menu.matches(':popover-open')) menu.hidePopover();
      item.setAttribute('aria-expanded', 'false');
      if (focusItem) rove(item);
    };
    const open = (item, focus = 'first') => {
      if (openItem && openItem !== item) close(false);
      const menu = menuOf(item);
      menu.toggleAttribute('data-instant', true);
      showAnchored(item, menu, 'block-end');
      item.setAttribute('aria-expanded', 'true');
      openItem = item;
      for (const i of items) i.tabIndex = i === item ? 0 : -1;
      const list = entries(menu);
      (focus === 'last' ? list.at(-1) : list[0]).focus({ preventScroll: true });
    };
    const step = (item, delta) => items[(items.indexOf(item) + delta + items.length) % items.length];
    bar.addEventListener('keydown', event => {
      const item = event.target.closest('.tg-menubar__item');
      if (!item) return;
      const rtl = getComputedStyle(bar).direction === 'rtl';
      const fwd = rtl ? 'ArrowLeft' : 'ArrowRight', back = rtl ? 'ArrowRight' : 'ArrowLeft';
      if (event.key === fwd) { event.preventDefault(); rove(step(item, 1)); }
      else if (event.key === back) { event.preventDefault(); rove(step(item, -1)); }
      else if (event.key === 'Home') { event.preventDefault(); rove(items[0]); }
      else if (event.key === 'End') { event.preventDefault(); rove(items.at(-1)); }
      else if (['ArrowDown', 'Enter', ' '].includes(event.key)) { event.preventDefault(); open(item); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); open(item, 'last'); }
    });
    bar.addEventListener('click', event => { const item = event.target.closest('.tg-menubar__item'); if (item) openItem === item ? close() : open(item); });
    bar.addEventListener('pointerover', event => { const item = event.target.closest('.tg-menubar__item'); if (item && openItem && item !== openItem) open(item); });
    for (const item of items) {
      const menu = menuOf(item);
      menu.addEventListener('keydown', event => {
        const list = entries(menu), index = list.indexOf(document.activeElement);
        const rtl = getComputedStyle(bar).direction === 'rtl';
        const move = n => { event.preventDefault(); list[(n + list.length) % list.length].focus({ preventScroll: true }); };
        switch (event.key) {
          case 'ArrowDown': return move(index + 1);
          case 'ArrowUp': return move(index - 1);
          case 'Home': return move(0);
          case 'End': return move(list.length - 1);
          case 'Escape': event.preventDefault(); return close();
          case 'Tab': close(false); return;
        }
        if (event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) { event.preventDefault(); open(step(item, 1)); }
        if (event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) { event.preventDefault(); open(step(item, -1)); }
      });
      menu.addEventListener('click', event => {
        const entry = event.target.closest('[role^="menuitem"]');
        if (!entry) return;
        if (entry.getAttribute('role') === 'menuitemcheckbox') entry.setAttribute('aria-checked', String(entry.getAttribute('aria-checked') !== 'true'));
        close();
      });
      menu.addEventListener('pointermove', event => { const entry = event.target.closest('[role^="menuitem"]'); if (entry && entry !== document.activeElement) entry.focus({ preventScroll: true }); });
      menu.addEventListener('toggle', event => { if (event.newState === 'closed' && openItem === item) { openItem = null; item.setAttribute('aria-expanded', 'false'); } });
    }
  }
}

// Table of contents: the section in view is current; following a link focuses its heading.
export function initTocs({ root = document } = {}) {
  for (const toc of root.querySelectorAll('[data-toc]')) {
    const links = [...toc.querySelectorAll('.tg-toc__link')];
    const scroller = root.querySelector('[data-toc-root]');
    const targets = links.map(link => root.getElementById(link.hash.slice(1)));
    const setCurrent = link => links.forEach(l => l === link ? l.setAttribute('aria-current', 'location') : l.removeAttribute('aria-current'));
    let lock = 0;
    const observer = new IntersectionObserver(entries => {
      if (performance.now() < lock) return;
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setCurrent(links[targets.indexOf(visible.target)]);
    }, { root: scroller, rootMargin: '0px 0px -60% 0px' });
    targets.forEach(target => target && observer.observe(target));
    toc.addEventListener('click', event => {
      const link = event.target.closest('.tg-toc__link');
      if (!link) return;
      event.preventDefault();
      const target = root.getElementById(link.hash.slice(1));
      lock = performance.now() + 600;
      setCurrent(link);
      scroller.scrollTo({ top: target.offsetTop - scroller.offsetTop });
      target.focus({ preventScroll: true });
    });
  }
}

// Command palette: Ctrl/Cmd+K opens at once, grouped results filter as you type.
export function initCommandPalette({ root = document } = {}) {
  const dialog = root.getElementById('demo-command');
  if (!dialog) return;
  const input = dialog.querySelector('.tg-command__input');
  const list = dialog.querySelector('.tg-command__list');
  const status = root.getElementById('demo-command-status');
  const commands = [
    { group: 'Недавние', label: 'Новый счёт', icon: 'file-plus', key: 'N' },
    { group: 'Недавние', label: 'Отчёт о выручке', icon: 'bar-chart-2' },
    { group: 'Переходы', label: 'Открыть счета', icon: 'file-text', key: 'G S' },
    { group: 'Переходы', label: 'Открыть клиентов', icon: 'users', key: 'G C' },
    { group: 'Переходы', label: 'Открыть настройки', icon: 'settings', key: 'G ,' },
    { group: 'Действия', label: 'Пригласить участника', icon: 'user-plus' },
    { group: 'Действия', label: 'Экспорт в Excel', icon: 'download' },
    { group: 'Действия', label: 'Сменить тему', icon: 'moon' },
  ];
  let active = 0, shown = [], opener = null;
  const render = () => {
    const query = input.value.trim().toLocaleLowerCase('ru');
    shown = query ? commands.filter(c => c.label.toLocaleLowerCase('ru').includes(query)) : commands.filter(c => c.group === 'Недавние');
    const groups = [...new Set(shown.map(c => c.group))];
    list.innerHTML = shown.length ? groups.map((group, g) => `<div class="tg-command__group" role="group" aria-labelledby="demo-command-g${g}"><div class="tg-command__group-label" id="demo-command-g${g}">${group}</div>${shown.filter(c => c.group === group).map(c => `<div class="tg-command__item" role="option" id="demo-command-${commands.indexOf(c)}" aria-selected="false">${icon(c.icon)}<span class="tg-command__text">${c.label}</span>${c.key ? `<kbd class="tg-command__shortcut">${c.key}</kbd>` : ''}</div>`).join('')}</div>`).join('')
      : '<div class="tg-empty"><p class="tg-empty__title">Ничего не найдено</p><p class="tg-empty__description">Попробуйте другое слово.</p></div>';
    shown = [...list.querySelectorAll('[role="option"]')];
    setActive(0);
    announce(status, shown.length ? `Команд: ${shown.length}` : 'Ничего не найдено');
  };
  const setActive = index => {
    if (!shown.length) { input.removeAttribute('aria-activedescendant'); return; }
    active = (index + shown.length) % shown.length;
    shown.forEach((option, i) => option.setAttribute('aria-selected', String(i === active)));
    input.setAttribute('aria-activedescendant', shown[active].id);
    scrollWithin(list, shown[active]);
  };
  const open = () => {
    opener = document.activeElement;
    dialog.toggleAttribute('data-instant', true);
    input.value = '';
    dialog.showModal();
    render();
    input.focus({ preventScroll: true });
  };
  const run = option => { if (!option) return; dialog.close(); announce(root.getElementById('demo-copy-status'), `Выполнено: ${option.textContent.trim()}`); };
  root.querySelectorAll('[data-command-open]').forEach(button => button.addEventListener('click', open));
  // The catalog owns Ctrl/Cmd+K for its own search; inside this example the palette takes it.
  const scope = dialog.closest('.example-body');
  scope.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); event.stopPropagation(); dialog.open ? dialog.close() : open(); }
  });
  input.addEventListener('input', render);
  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive(active + 1); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive(active - 1); }
    if (event.key === 'Enter') { event.preventDefault(); run(shown[active]); }
    // A search field would clear itself on Escape; in the palette Escape closes at once.
    if (event.key === 'Escape') { event.preventDefault(); dialog.close(); }
  });
  list.addEventListener('pointermove', event => { const option = event.target.closest('[role="option"]'); if (option) setActive(shown.indexOf(option)); });
  list.addEventListener('click', event => run(event.target.closest('[role="option"]')));
  dialog.addEventListener('close', () => opener?.focus({ preventScroll: true }));
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
}

const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const DAYS = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const longDate = d => `${DAYS[(d.getDay() + 6) % 7]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`;
const TODAY = new Date(2026, 9, 28);

// Builds the rows of a month table (Monday first). `decorate(button, date)` adds state.
function renderMonth(table, year, month, decorate) {
  const first = new Date(year, month, 1);
  const start = addDays(first, -((first.getDay() + 6) % 7));
  const last = new Date(year, month + 1, 0);
  const weeks = Math.ceil((((first.getDay() + 6) % 7) + last.getDate()) / 7);
  const body = table.tBodies[0];
  body.innerHTML = '';
  for (let w = 0; w < weeks; w++) {
    const row = body.insertRow();
    for (let i = 0; i < 7; i++) {
      const date = addDays(start, w * 7 + i);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tg-calendar__day';
      button.dataset.date = iso(date);
      button.textContent = date.getDate();
      button.tabIndex = -1;
      button.setAttribute('aria-pressed', 'false');
      if (date.getMonth() !== month) button.classList.add('tg-calendar__day--outside');
      if (iso(date) === iso(TODAY)) { button.classList.add('tg-calendar__day--today'); button.setAttribute('aria-current', 'date'); }
      button.setAttribute('aria-label', longDate(date));
      decorate?.(button, date);
      row.insertCell().append(button);
    }
  }
}

// Shared grid keyboard (APG date grid). `move(date)` focuses or re-renders to reach it.
function gridKeys(event, date, move, select) {
  const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
  const dow = (date.getDay() + 6) % 7;
  const map = {
    ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: 7, ArrowUp: -7,
    Home: -dow, End: 6 - dow,
  };
  let target;
  if (event.key in map) target = addDays(date, map[event.key]);
  else if (event.key === 'PageUp' || event.key === 'PageDown') {
    const step = (event.key === 'PageUp' ? -1 : 1) * (event.shiftKey ? 12 : 1);
    const t = new Date(date.getFullYear(), date.getMonth() + step, 1);
    target = new Date(t.getFullYear(), t.getMonth(), Math.min(date.getDate(), new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()));
  } else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(date); return; }
  if (target) { event.preventDefault(); move(target); }
}

export function initCalendars({ root = document } = {}) {
  for (const cal of root.querySelectorAll('[data-calendar]')) {
    const table = cal.querySelector('.tg-calendar__grid');
    const title = cal.querySelector('.tg-calendar__header .tg-header__title');
    const status = cal.querySelector('[data-calendar-status]');
    const events = new Map([...table.querySelectorAll('.tg-calendar__day')].filter(b => b.querySelector('.tg-calendar__events')).map(b => [b.dataset.date, b.querySelector('.tg-calendar__events').outerHTML + '|' + b.getAttribute('aria-label').split(', ').slice(2).join(', ')]));
    let year = Number(cal.dataset.year), month = Number(cal.dataset.month);
    let selected = cal.dataset.selected ? parse(cal.dataset.selected) : null;
    let focus = selected ?? TODAY;
    const draw = (focusDate = focus) => {
      focus = focusDate;
      title.textContent = `${MONTHS[month]} ${year}`;
      renderMonth(table, year, month, (button, date) => {
        const key = iso(date);
        if (selected && key === iso(selected)) button.setAttribute('aria-pressed', 'true');
        if (events.has(key) && date.getMonth() === month) {
          const [dots, label] = events.get(key).split('|');
          button.insertAdjacentHTML('beforeend', dots);
          button.setAttribute('aria-label', `${longDate(date)}, ${label}`);
        }
        if (key === iso(focus)) button.tabIndex = 0;
      });
    };
    const move = date => {
      if (date.getMonth() !== month || date.getFullYear() !== year) { year = date.getFullYear(); month = date.getMonth(); draw(date); }
      else { focus = date; for (const b of table.querySelectorAll('.tg-calendar__day')) b.tabIndex = b.dataset.date === iso(date) ? 0 : -1; }
      table.querySelector(`[data-date="${iso(date)}"]`).focus({ preventScroll: true });
    };
    const select = date => {
      selected = date;
      for (const b of table.querySelectorAll('.tg-calendar__day')) b.setAttribute('aria-pressed', String(b.dataset.date === iso(date)));
      status.textContent = `Выбрано: ${longDate(date)}`;
    };
    table.addEventListener('keydown', event => { const b = event.target.closest('.tg-calendar__day'); if (b) gridKeys(event, parse(b.dataset.date), move, select); });
    table.addEventListener('click', event => { const b = event.target.closest('.tg-calendar__day'); if (b && b.getAttribute('aria-disabled') !== 'true') { const d = parse(b.dataset.date); if (d.getMonth() !== month) move(d); select(d); } });
    cal.querySelector('[data-calendar-prev]').addEventListener('click', () => { const d = new Date(year, month - 1, 1); year = d.getFullYear(); month = d.getMonth(); draw(d); });
    cal.querySelector('[data-calendar-next]').addEventListener('click', () => { const d = new Date(year, month + 1, 1); year = d.getFullYear(); month = d.getMonth(); draw(d); });
    draw();
  }
}

// Range: first click sets the start, the second the end; hovering previews the band.
export function initRangeCalendars({ root = document } = {}) {
  for (const cal of root.querySelectorAll('[data-range-calendar]')) {
    const tables = [...cal.querySelectorAll('.tg-calendar__grid')];
    const titles = [...cal.querySelectorAll('.tg-calendar__month .tg-header__title')];
    const output = cal.querySelector('[data-range-output]');
    const status = cal.querySelector('[data-calendar-status]');
    const presets = [...cal.querySelectorAll('[data-preset]')];
    let start = parse(cal.dataset.start), end = parse(cal.dataset.end), picking = false, saved = [start, end];
    let year = start.getFullYear(), month = start.getMonth();
    let focus = start;
    const fmt = (a, b) => a.getFullYear() === b.getFullYear() ? `${a.getDate()} ${MONTHS_GEN[a.getMonth()]} – ${b.getDate()} ${MONTHS_GEN[b.getMonth()]} ${b.getFullYear()}` : `${a.getDate()} ${MONTHS_GEN[a.getMonth()]} ${a.getFullYear()} – ${b.getDate()} ${MONTHS_GEN[b.getMonth()]} ${b.getFullYear()}`;
    // Range classes and labels on the rendered days; hovering repaints without re-rendering.
    const paint = (preview = null) => {
      const e = picking ? (preview ?? start) : end;
      const [a, b] = start <= e ? [start, e] : [e, start];
      for (const button of cal.querySelectorAll('.tg-calendar__day:not(:disabled)')) {
        const date = parse(button.dataset.date), t = date.getTime();
        button.classList.toggle('tg-calendar__day--range-start', t === a.getTime());
        button.classList.toggle('tg-calendar__day--range-end', t === b.getTime());
        button.classList.toggle('tg-calendar__day--in-range', t > a.getTime() && t < b.getTime());
        button.setAttribute('aria-label', t === a.getTime() ? `${t === b.getTime() ? 'Начало и конец' : 'Начало'} периода, ${longDate(date)}` : t === b.getTime() ? `Конец периода, ${longDate(date)}` : longDate(date));
        button.tabIndex = iso(date) === iso(focus) ? 0 : -1;
      }
      if (!picking) output.textContent = fmt(start, end);
    };
    const draw = (preview = null) => {
      tables.forEach((table, i) => {
        const d = new Date(year, month + i, 1);
        titles[i].textContent = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
        renderMonth(table, d.getFullYear(), d.getMonth(), (button, date) => {
          if (date.getMonth() !== d.getMonth()) { button.style.visibility = 'hidden'; button.disabled = true; }
        });
      });
      paint(preview);
    };
    const choose = date => {
      if (!picking) { start = date; end = date; picking = true; status.textContent = `Начало периода: ${longDate(date)}. Выберите конец.`; }
      else { if (date < start) [start, end] = [date, start]; else end = date; picking = false; status.textContent = `Период: ${fmt(start, end)}`; }
      for (const p of presets) p.setAttribute('aria-pressed', 'false');
      focus = date;
      paint();
      cal.querySelector(`[data-date="${iso(date)}"]:not(:disabled)`)?.focus({ preventScroll: true });
    };
    const move = date => {
      const first = new Date(year, month, 1), lastShown = new Date(year, month + 2, 0);
      if (date < first || date > lastShown) { year = date.getFullYear(); month = date < first ? date.getMonth() : date.getMonth() - 1; if (month < 0) { month += 12; year -= 1; } }
      const shown = cal.querySelector(`[data-date="${iso(date)}"]:not(:disabled)`);
      focus = date;
      if (shown) paint(picking ? date : null); else draw(picking ? date : null);
      cal.querySelector(`[data-date="${iso(date)}"]:not(:disabled)`).focus({ preventScroll: true });
    };
    for (const table of tables) {
      table.addEventListener('click', event => { const b = event.target.closest('.tg-calendar__day'); if (b && !b.disabled) choose(parse(b.dataset.date)); });
      table.addEventListener('pointerover', event => { const b = event.target.closest('.tg-calendar__day'); if (picking && b && !b.disabled) paint(parse(b.dataset.date)); });
      table.addEventListener('keydown', event => { const b = event.target.closest('.tg-calendar__day'); if (b) gridKeys(event, parse(b.dataset.date), move, choose); });
    }
    cal.querySelector('[data-calendar-prev]').addEventListener('click', () => { month -= 1; if (month < 0) { month = 11; year -= 1; } draw(); });
    cal.querySelector('[data-calendar-next]').addEventListener('click', () => { month += 1; if (month > 11) { month = 0; year += 1; } draw(); });
    for (const preset of presets) preset.addEventListener('click', () => {
      const kind = preset.dataset.preset;
      if (kind === '7' || kind === '30') { end = TODAY; start = addDays(TODAY, -(Number(kind) - 1)); }
      if (kind === 'month') { start = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1); end = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0); }
      if (kind === 'prev') { start = new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1); end = new Date(TODAY.getFullYear(), TODAY.getMonth(), 0); }
      picking = false;
      year = start.getFullYear(); month = start.getMonth(); focus = start;
      for (const p of presets) p.setAttribute('aria-pressed', String(p === preset));
      draw();
      status.textContent = `Период: ${fmt(start, end)}`;
    });
    cal.querySelector('[data-range-cancel]').addEventListener('click', () => { [start, end] = saved; picking = false; year = start.getFullYear(); month = start.getMonth(); draw(); status.textContent = 'Изменения отменены'; });
    cal.querySelector('[data-range-apply]').addEventListener('click', () => { saved = [start, end]; status.textContent = `Применён период: ${fmt(start, end)}`; });
    draw();
  }
}

// Segmented date: ↑/↓ change, digits type, ←/→ move between segments.
export function initDateFields({ root = document } = {}) {
  for (const field of root.querySelectorAll('[data-date-field]')) {
    const segments = [...field.querySelectorAll('.tg-date-field__segment')];
    const hidden = field.querySelector('input[type="hidden"]');
    let typed = '';
    const value = s => Number(s.getAttribute('aria-valuenow'));
    const set = (segment, n) => {
      const min = Number(segment.getAttribute('aria-valuemin')), max = Number(segment.getAttribute('aria-valuemax'));
      if (n > max) n = min; if (n < min) n = max;
      segment.setAttribute('aria-valuenow', n);
      segment.textContent = segment.dataset.part === 'year' ? n : String(n).padStart(2, '0');
      if (segment.dataset.part === 'month') segment.setAttribute('aria-valuetext', MONTHS[n - 1]);
      const [d, m, y] = segments.map(value);
      const daysIn = new Date(y, m, 0).getDate();
      const day = segments[0];
      day.setAttribute('aria-valuemax', daysIn);
      if (d > daysIn) { day.setAttribute('aria-valuenow', daysIn); day.textContent = String(daysIn).padStart(2, '0'); }
      hidden.value = `${y}-${String(m).padStart(2, '0')}-${String(Math.min(d, daysIn)).padStart(2, '0')}`;
    };
    segments.forEach((segment, index) => {
      segment.addEventListener('focus', () => { typed = ''; });
      segment.addEventListener('keydown', event => {
        const rtl = getComputedStyle(field).direction === 'rtl';
        if (event.key === 'ArrowUp') { event.preventDefault(); set(segment, value(segment) + 1); }
        else if (event.key === 'ArrowDown') { event.preventDefault(); set(segment, value(segment) - 1); }
        else if (event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) { event.preventDefault(); segments[index + 1]?.focus({ preventScroll: true }); }
        else if (event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) { event.preventDefault(); segments[index - 1]?.focus({ preventScroll: true }); }
        else if (/^\d$/.test(event.key)) {
          event.preventDefault();
          typed += event.key;
          const width = segment.dataset.part === 'year' ? 4 : 2;
          if (typed.length >= width || Number(typed + '0') > Number(segment.getAttribute('aria-valuemax'))) {
            set(segment, Number(typed)); typed = ''; segments[index + 1]?.focus({ preventScroll: true });
          } else segment.textContent = typed.padStart(width, '0');
        }
      });
    });
  }
}

// Charts drawn as inline SVG from data attributes: line/area, bars, donut; with hover.
export function initCharts({ root = document } = {}) {
  const fmt = n => String(n).replace('.', ',');
  for (const figure of root.querySelectorAll('[data-chart]')) {
    const plot = figure.querySelector('.tg-chart__plot');
    const labels = figure.dataset.labels.split('|');
    const series = [1, 2, 3].map(i => figure.dataset[`series-${i}`] ?? figure.getAttribute(`data-series-${i}`)).filter(Boolean).map(s => s.split('|').map(Number));
    const unit = figure.dataset.unit ?? '';
    const kind = figure.dataset.chart;
    const ns = 'http://www.w3.org/2000/svg';
    const tooltip = document.createElement('div');
    tooltip.className = 'tg-chart__tooltip';
    tooltip.setAttribute('aria-hidden', 'true');
    if (kind === 'donut') {
      const total = series[0].reduce((a, b) => a + b, 0);
      const r = 40, c = 2 * Math.PI * r, gap = 1.6;
      let offset = 0;
      const segs = series[0].map((v, i) => {
        const len = v / total * c;
        const s = `<circle class="tg-chart__segment" data-series="${i + 1}"${i === 2 ? ' data-texture' : ''} data-index="${i}" cx="50" cy="50" r="${r}" stroke-width="16" stroke-dasharray="${Math.max(0, len - gap)} ${c}" stroke-dashoffset="${-offset}" transform="rotate(-90 50 50)"/>`;
        offset += len;
        return s;
      }).join('');
      plot.insertAdjacentHTML('afterbegin', `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><pattern id="tg-chart-hatch" class="tg-chart__hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" fill="currentColor" fill-opacity=".18"/><line x1="0" y1="0" x2="0" y2="4" stroke="currentColor" stroke-width="2"/></pattern></defs>${segs}</svg>`);
      plot.append(tooltip);
      plot.addEventListener('pointermove', event => {
        const seg = event.target.closest('.tg-chart__segment');
        for (const s of plot.querySelectorAll('.tg-chart__segment')) s.toggleAttribute('data-active', s === seg);
        if (!seg) { delete plot.dataset.hover; return; }
        const i = Number(seg.dataset.index);
        const box = plot.getBoundingClientRect();
        tooltip.innerHTML = `<strong>${labels[i]}</strong><span>Доля <b>${series[0][i]}%</b></span>`;
        plot.style.setProperty('--tooltip-x', `${event.clientX - box.left}px`);
        plot.style.setProperty('--tooltip-y', `${event.clientY - box.top}px`);
        tooltip.style.setProperty('--tooltip-x', `${event.clientX - box.left}px`);
        tooltip.style.setProperty('--tooltip-y', `${event.clientY - box.top}px`);
        plot.dataset.hover = '';
      });
      plot.addEventListener('pointerleave', () => { delete plot.dataset.hover; for (const s of plot.querySelectorAll('.tg-chart__segment')) s.removeAttribute('data-active'); });
      continue;
    }
    let W, H, band, xMid, y, svgEl;
    const P = { t: 16, r: 16, b: 28, l: 40 };
    const draw = () => {
    plot.querySelector('svg')?.remove();
    W = Math.max(240, Math.round(plot.clientWidth)); H = W < 480 ? 200 : 240;
    const max = Math.max(...series.flat());
    // Clean ticks: a step of 1, 2 or 5 × 10ⁿ, at most five intervals.
    const step = (() => { const raw = max / 4, p = 10 ** Math.floor(Math.log10(raw)); return [1, 2, 5, 10].map(m => m * p).find(s => s >= raw); })();
    const niceMax = Math.ceil(max / step) * step;
    y = v => P.t + (H - P.t - P.b) * (1 - v / niceMax);
    const ticks = Array.from({ length: Math.round(niceMax / step) + 1 }, (_, i) => +(i * step).toFixed(6));
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">`;
    svg += ticks.map(t => `<line class="tg-chart__${t === 0 ? 'baseline' : 'grid'}" x1="${P.l}" x2="${W - P.r}" y1="${y(t)}" y2="${y(t)}"/><text class="tg-chart__tick" x="${P.l - 8}" y="${y(t) + 4}" text-anchor="end">${fmt(+t.toFixed(1))}</text>`).join('');
    band = (W - P.l - P.r) / labels.length;
    xMid = i => P.l + band * (i + .5);
    if (kind === 'line') {
      const pts = s => s.map((v, i) => `${xMid(i)},${y(v)}`).join(' ');
      svg += `<polygon class="tg-chart__area" points="${xMid(0)},${y(0)} ${pts(series[0])} ${xMid(labels.length - 1)},${y(0)}"/>`;
      series.slice().reverse().forEach((s, ri) => { const si = series.length - ri; svg += `<polyline class="tg-chart__line" data-series="${si}" points="${pts(s)}"/>`; });
      const last = labels.length - 1;
      svg += `<circle class="tg-chart__point" cx="${xMid(last)}" cy="${y(series[0][last])}" r="4"/>`;
      svg += `<text class="tg-chart__label" x="${xMid(last) - 8}" y="${y(series[0][last]) - 10}" text-anchor="end">${fmt(series[0][last])}</text>`;
      svg += `<line class="tg-chart__crosshair" x1="0" x2="0" y1="${P.t}" y2="${H - P.b}"/>`;
      svg += series.map((_, si) => `<circle class="tg-chart__point tg-chart__hover-point" data-series="${si + 1}" r="4" cx="-20" cy="-20"/>`).join('');
    } else {
      const bw = Math.min(24, band * .6);
      series[0].forEach((v, i) => {
        const x = xMid(i) - bw / 2, top = y(v), h = y(0) - top, r = Math.min(4, h);
        svg += `<path class="tg-chart__bar" data-index="${i}"${String(i) === figure.dataset.highlight ? ' data-active' : ''} d="M${x},${y(0)} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${y(0)} Z"/>`;
      });
      const hi = Number(figure.dataset.highlight);
      if (!Number.isNaN(hi)) svg += `<text class="tg-chart__label" x="${xMid(hi)}" y="${y(series[0][hi]) - 8}" text-anchor="middle">${series[0][hi]}</text>`;
    }
    svg += labels.map((l, i) => `<text class="tg-chart__tick" x="${xMid(i)}" y="${H - 8}" text-anchor="middle">${l}</text>`).join('');
    svg += `<rect class="tg-chart__hit" x="${P.l}" y="0" width="${W - P.l - P.r}" height="${H}"/></svg>`;
    plot.insertAdjacentHTML('afterbegin', svg);
    svgEl = plot.querySelector('svg');
    };
    draw();
    plot.append(tooltip);
    let lastWidth = plot.clientWidth;
    new ResizeObserver(() => { if (Math.abs(plot.clientWidth - lastWidth) > 1) { lastWidth = plot.clientWidth; draw(); } }).observe(plot);
    const pick = event => {
      const box = svgEl.getBoundingClientRect();
      const vx = (event.clientX - box.left) / box.width * W;
      const i = Math.max(0, Math.min(labels.length - 1, Math.floor((vx - P.l) / band)));
      return { i, box };
    };
    plot.addEventListener('pointermove', event => {
      const { i, box } = pick(event);
      const scale = box.width / W;
      if (kind === 'line') {
        const cross = svgEl.querySelector('.tg-chart__crosshair');
        cross.setAttribute('x1', xMid(i)); cross.setAttribute('x2', xMid(i));
        svgEl.querySelectorAll('.tg-chart__hover-point').forEach((p, si) => { p.setAttribute('cx', xMid(i)); p.setAttribute('cy', y(series[si][i])); });
      } else {
        for (const bar of svgEl.querySelectorAll('.tg-chart__bar')) bar.toggleAttribute('data-active', Number(bar.dataset.index) === i);
      }
      const names = [...figure.querySelectorAll('.tg-chart__legend-item')].map(li => li.textContent.trim());
      tooltip.innerHTML = `<strong>${labels[i]}</strong>` + series.map((s, si) => `<span>${names[si] ?? 'Значение'} <b>${fmt(s[i])} ${unit}</b></span>`).join('');
      const top = Math.min(...series.map(s => y(s[i]))) * scale;
      tooltip.style.setProperty('--tooltip-x', `${xMid(i) * scale}px`);
      tooltip.style.setProperty('--tooltip-y', `${top}px`);
      plot.dataset.hover = '';
    });
    plot.addEventListener('pointerleave', () => {
      delete plot.dataset.hover;
      if (kind === 'bar') for (const bar of svgEl.querySelectorAll('.tg-chart__bar')) bar.toggleAttribute('data-active', bar.dataset.index === figure.dataset.highlight);
    });
  }
}

// Sortable list: pointer drag by the handle, or the keyboard (Space, arrows, Space/Escape).
export function initSortables({ root = document } = {}) {
  for (const list of root.querySelectorAll('[data-sortable]')) {
    const status = root.getElementById('demo-sort-status');
    const items = () => [...list.children];
    const name = item => item.querySelector('span:not(.tg-num)').textContent;
    const renumber = () => items().forEach((item, i) => { item.querySelector('.tg-num').textContent = i + 1; });
    let grabbed = null, origin = -1;
    const say = text => announce(status, text);
    list.addEventListener('keydown', event => {
      const handle = event.target.closest('.tg-sortable__handle');
      if (!handle) return;
      const item = handle.closest('.tg-sortable__item');
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        if (!grabbed) { grabbed = item; origin = items().indexOf(item); item.dataset.grabbed = ''; handle.setAttribute('aria-pressed', 'true'); say(`${name(item)} поднят, позиция ${origin + 1} из ${items().length}. Стрелки двигают, Пробел кладёт.`); }
        else { delete grabbed.dataset.grabbed; handle.setAttribute('aria-pressed', 'false'); say(`${name(item)} на позиции ${items().indexOf(item) + 1} из ${items().length}`); grabbed = null; renumber(); }
      } else if (grabbed === item && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        event.preventDefault();
        const index = items().indexOf(item);
        if (event.key === 'ArrowUp' && index > 0) list.insertBefore(item, items()[index - 1]);
        if (event.key === 'ArrowDown' && index < items().length - 1) list.insertBefore(items()[index + 1], item);
        handle.focus({ preventScroll: true });
        say(`${name(item)}, позиция ${items().indexOf(item) + 1} из ${items().length}`);
      } else if (grabbed === item && event.key === 'Escape') {
        event.preventDefault();
        list.insertBefore(item, items().filter(i => i !== item)[origin] ?? null);
        delete item.dataset.grabbed; handle.setAttribute('aria-pressed', 'false'); grabbed = null;
        handle.focus({ preventScroll: true });
        say(`Отменено, ${name(item)} на позиции ${origin + 1}`);
      }
    });
    list.addEventListener('pointerdown', event => {
      const handle = event.target.closest('.tg-sortable__handle');
      if (!handle || event.button !== 0) return;
      event.preventDefault();
      const item = handle.closest('.tg-sortable__item');
      item.dataset.grabbed = '';
      handle.setPointerCapture(event.pointerId);
      const startY = event.clientY;
      let target = null, place = 'before';
      const moveAt = e => {
        item.style.translate = `0 ${e.clientY - startY}px`;
        for (const other of items()) delete other.dataset.drop;
        target = items().find(other => other !== item && e.clientY < other.getBoundingClientRect().bottom) ?? items().at(-1);
        if (target && target !== item) {
          const r = target.getBoundingClientRect();
          place = e.clientY < r.top + r.height / 2 ? 'before' : 'after';
          target.dataset.drop = place;
        }
      };
      const up = () => {
        handle.removeEventListener('pointermove', moveAt);
        item.style.translate = '';
        delete item.dataset.grabbed;
        for (const other of items()) delete other.dataset.drop;
        if (target && target !== item) list.insertBefore(item, place === 'before' ? target : target.nextSibling);
        renumber();
        say(`${name(item)} на позиции ${items().indexOf(item) + 1} из ${items().length}`);
      };
      handle.addEventListener('pointermove', moveAt);
      handle.addEventListener('pointerup', up, { once: true });
      handle.addEventListener('pointercancel', up, { once: true });
    });
  }
}

// Agent progress: a running timer that is not announced; the step change is.
export function initAgentSteps({ root = document } = {}) {
  const running = root.getElementById('demo-agent-running');
  if (!running) return;
  const timer = running.querySelector('[data-agent-timer]');
  let seconds = 3;
  const tick = setInterval(() => {
    seconds += 1;
    timer.textContent = `${seconds} с`;
    if (seconds >= 8) {
      clearInterval(tick);
      running.dataset.state = 'done';
      running.querySelector('.tg-agent-step__icon').innerHTML = icon('check');
      running.querySelector('.tg-agent-step__label').textContent = 'Подготовил 3 напоминания';
      announce(root.getElementById('demo-agent-status'), 'Подготовил 3 напоминания. Нужно ваше подтверждение.');
    }
  }, 1000);
}

// Approval: after a decision the card becomes a record without controls; focus moves on.
export function initApprovals({ root = document } = {}) {
  for (const card of root.querySelectorAll('.tg-approval')) {
    card.addEventListener('click', event => {
      const button = event.target.closest('[data-approval]');
      if (!button) return;
      const allow = button.dataset.approval === 'allow';
      const tone = card.querySelector('input:checked')?.nextElementSibling.textContent.split(':')[0].toLowerCase() ?? '';
      const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      card.dataset.state = 'decided';
      card.innerHTML = `<p class="tg-approval__title">${icon(allow ? 'check-circle' : 'x-circle')}${allow ? 'Разрешено' : 'Отклонено'} в ${time}</p><p class="tg-approval__description">${allow ? `Напоминания отправлены, тон — ${tone}.` : 'Письма не отправлены.'}</p>`;
      announce(root.getElementById('demo-agent-status'), allow ? 'Разрешено, напоминания отправлены' : 'Отклонено');
      (root.querySelector('#demo-chat-form textarea') ?? card).focus({ preventScroll: true });
    });
  }
}

// Editor demo: formatting commands with aria-pressed following the selection, block
// selection with Escape and arrows, a toolbar at the selection (Alt+F10 to reach it).
export function initEditor({ root = document } = {}) {
  const content = root.querySelector('[data-editor]');
  if (!content) return;
  const editor = content.closest('.tg-editor');
  const toolbar = editor.querySelector('.tg-editor__toolbar');
  const floating = root.getElementById('demo-selection-toolbar');
  const status = root.getElementById('demo-editor-status');
  const save = editor.querySelector('[data-editor-save]');
  const count = editor.querySelector('[data-editor-count]');
  const blocks = () => [...content.querySelectorAll('.tg-editor__block')];
  let saveTimer = 0;
  const run = command => {
    content.focus({ preventScroll: true });
    if (command === 'link') { const url = 'https://example.com'; document.execCommand('createLink', false, url); }
    else if (command === 'quote') document.execCommand('formatBlock', false, 'blockquote');
    else document.execCommand(command);
    sync();
    changed();
  };
  const sync = () => {
    for (const button of editor.querySelectorAll('[data-command][aria-pressed]')) {
      let on = false;
      try { on = document.queryCommandState(button.dataset.command); } catch { /* unsupported */ }
      button.setAttribute('aria-pressed', String(on));
    }
    // Undo and redo are available only when the editing history has a step to take.
    for (const button of editor.querySelectorAll('[data-command="undo"], [data-command="redo"]')) {
      let enabled = false;
      try { enabled = document.queryCommandEnabled(button.dataset.command); } catch { /* unsupported */ }
      button.setAttribute('aria-disabled', String(!enabled));
    }
  };
  const changed = () => {
    save.textContent = 'Сохраняем…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { save.textContent = 'Сохранено'; }, 700);
    count.textContent = `${content.textContent.trim().split(/\s+/).length} слов`;
  };
  editor.addEventListener('click', event => {
    const button = event.target.closest('[data-command]');
    if (button?.getAttribute('aria-disabled') === 'true') { event.preventDefault(); return; }
    if (button) { event.preventDefault(); run(button.dataset.command); }
    const action = event.target.closest('[data-selection-action]');
    if (action) { announce(status, action.dataset.selectionAction === 'improve' ? 'Предложение применено' : 'Комментарий добавлен'); floating.hidden = true; content.focus({ preventScroll: true }); }
  });
  editor.addEventListener('mousedown', event => { if (event.target.closest('[data-command], [data-selection-action]')) event.preventDefault(); });
  content.addEventListener('input', () => { changed(); sync(); });
  content.addEventListener('keydown', event => {
    const selected = blocks().filter(b => b.getAttribute('aria-selected') === 'true');
    if ((event.ctrlKey || event.metaKey) && ['b', 'i', 'u'].includes(event.key.toLowerCase())) { event.preventDefault(); run({ b: 'bold', i: 'italic', u: 'underline' }[event.key.toLowerCase()]); return; }
    if (event.altKey && event.key === 'F10') { event.preventDefault(); (floating.hidden ? toolbar : floating).querySelector('button').focus({ preventScroll: true }); return; }
    if (event.key === 'Escape') {
      const node = getSelection().anchorNode;
      const block = (node?.nodeType === 1 ? node : node?.parentElement)?.closest('.tg-editor__block');
      if (block) { event.preventDefault(); blocks().forEach(b => b.setAttribute('aria-selected', String(b === block))); getSelection().removeAllRanges(); floating.hidden = true; announce(status, `Выбран блок: ${block.textContent.trim().slice(0, 40)}`); }
      return;
    }
    if (selected.length && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      const list = blocks(), index = list.indexOf(selected.at(-1));
      const next = list[Math.max(0, Math.min(list.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))];
      list.forEach(b => b.setAttribute('aria-selected', String(b === next)));
      announce(status, `Выбран блок: ${next.textContent.trim().slice(0, 40)}`);
      return;
    }
    if (selected.length && event.key.length === 1) blocks().forEach(b => b.removeAttribute('aria-selected'));
  });
  content.addEventListener('pointerdown', () => blocks().forEach(b => b.removeAttribute('aria-selected')));
  document.addEventListener('selectionchange', () => {
    const selection = getSelection();
    if (!selection.rangeCount || !content.contains(selection.anchorNode)) { if (!floating.contains(document.activeElement)) floating.hidden = true; return; }
    sync();
    if (selection.isCollapsed) { floating.hidden = true; return; }
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    const box = editor.getBoundingClientRect();
    const rtl = getComputedStyle(editor).direction === 'rtl';
    const x = rect.left + rect.width / 2 - box.left;
    floating.style.setProperty('--anchor-x', `${rtl ? box.width - x : x}px`);
    const above = rect.top - box.top > 56;
    floating.dataset.placement = above ? 'above' : 'below';
    floating.style.setProperty('--anchor-y', `${(above ? rect.top : rect.bottom) - box.top}px`);
    floating.hidden = false;
  });
  floating.addEventListener('keydown', event => {
    const items = [...floating.querySelectorAll('button')], index = items.indexOf(document.activeElement);
    if (event.key === 'Escape') { event.preventDefault(); floating.hidden = true; content.focus({ preventScroll: true }); }
    if (event.key === 'ArrowRight') { event.preventDefault(); items[(index + 1) % items.length].focus({ preventScroll: true }); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); items[(index - 1 + items.length) % items.length].focus({ preventScroll: true }); }
  });
}

// Hold to confirm (1.2 s), with a keyboard path (double Enter within a second).
export function initGestures({ root = document } = {}) {
  const status = root.getElementById('demo-gesture-status');
  for (const button of root.querySelectorAll('[data-hold]')) {
    let frame = 0, start = 0, lastEnter = -Infinity;
    const label = button.querySelector('.tg-btn__label');
    const reset = () => { cancelAnimationFrame(frame); delete button.dataset.state; button.style.setProperty('--hold-progress', 0); };
    const confirm = () => { cancelAnimationFrame(frame); button.dataset.state = 'confirmed'; label.textContent = 'Удалено'; announce(status, 'Удалено'); setTimeout(() => { reset(); label.textContent = 'Удалить удержанием'; }, 1600); };
    const step = now => {
      const progress = Math.min(1, (now - start) / 1200);
      button.style.setProperty('--hold-progress', progress);
      if (progress >= 1) confirm(); else frame = requestAnimationFrame(step);
    };
    button.addEventListener('pointerdown', event => { if (event.button) return; button.dataset.state = 'holding'; start = performance.now(); frame = requestAnimationFrame(step); });
    for (const type of ['pointerup', 'pointerleave', 'pointercancel']) button.addEventListener(type, () => { if (button.dataset.state === 'holding') { reset(); announce(status, 'Удаление отменено'); } });
    button.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      const now = performance.now();
      if (now - lastEnter < 1000) confirm(); else { lastEnter = now; announce(status, 'Нажмите Enter ещё раз, чтобы удалить'); }
    });
  }
  for (const box of root.querySelectorAll('[data-slide-confirm]')) {
    const thumb = box.querySelector('input');
    const alt = box.parentElement.querySelector('[data-slide-alt]');
    const done = () => { box.dataset.state = 'confirmed'; thumb.value = 100; thumb.setAttribute('aria-valuetext', 'подтверждено'); box.style.setProperty('--slide-progress', 1); announce(status, 'Оплата подтверждена'); };
    thumb.addEventListener('input', () => { box.style.setProperty('--slide-progress', thumb.value / 100); thumb.setAttribute('aria-valuetext', thumb.value >= 100 ? 'подтверждено' : `сдвинуто на ${thumb.value}%`); if (Number(thumb.value) >= 100) done(); });
    thumb.addEventListener('change', () => { if (box.dataset.state !== 'confirmed') { thumb.value = 0; box.style.setProperty('--slide-progress', 0); thumb.setAttribute('aria-valuetext', 'не подтверждено'); } });
    alt?.addEventListener('click', done);
  }
}

export function initFab({ root = document } = {}) {
  for (const fab of root.querySelectorAll('[data-fab]')) {
    const menu = root.getElementById(fab.getAttribute('aria-controls'));
    const set = open => { fab.setAttribute('aria-expanded', String(open)); menu.hidden = !open; if (open) menu.querySelector('button').focus({ preventScroll: true }); };
    fab.addEventListener('click', () => set(fab.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('keydown', event => { if (event.key === 'Escape') { set(false); fab.focus({ preventScroll: true }); } });
    menu.addEventListener('click', event => { if (event.target.closest('button')) { set(false); fab.focus({ preventScroll: true }); } });
    document.addEventListener('pointerdown', event => { if (!menu.hidden && !menu.contains(event.target) && !fab.contains(event.target)) set(false); });
  }
}

// Wheel columns: the option nearest the centre band is selected; arrows step.
export function initWheels({ root = document } = {}) {
  for (const wheel of root.querySelectorAll('[data-wheel]')) {
    const output = wheel.parentElement.querySelector('[data-wheel-output]');
    const columns = [...wheel.querySelectorAll('.tg-wheel__column')];
    const value = column => column.querySelector('[aria-selected="true"]').textContent;
    const choose = (column, option, scroll = true) => {
      for (const o of column.children) o.setAttribute('aria-selected', String(o === option));
      column.setAttribute('aria-activedescendant', option.id);
      if (scroll) column.scrollTo({ top: option.offsetTop - column.clientHeight / 2 + option.clientHeight / 2 });
      output.textContent = columns.map(value).join(':');
    };
    for (const column of columns) {
      const selected = column.querySelector('[aria-selected="true"]');
      column.scrollTop = selected.offsetTop - column.clientHeight / 2 + selected.clientHeight / 2;
      let timer = 0;
      column.addEventListener('scroll', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          const centre = column.scrollTop + column.clientHeight / 2;
          const nearest = [...column.children].reduce((best, o) => Math.abs(o.offsetTop + o.clientHeight / 2 - centre) < Math.abs(best.offsetTop + best.clientHeight / 2 - centre) ? o : best);
          if (nearest.getAttribute('aria-selected') !== 'true') choose(column, nearest, false);
        }, 90);
      });
      column.addEventListener('keydown', event => {
        const options = [...column.children], index = options.findIndex(o => o.getAttribute('aria-selected') === 'true');
        const next = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: options.length - 1 }[event.key];
        if (next === undefined) return;
        event.preventDefault();
        choose(column, options[Math.max(0, Math.min(options.length - 1, next))]);
      });
      column.addEventListener('click', event => { const option = event.target.closest('[role="option"]'); if (option) choose(column, option); });
    }
  }
}

export function initColorPickers({ root = document } = {}) {
  for (const field of root.querySelectorAll('[data-color-field]')) {
    const swatch = field.querySelector('input[type="color"]'), hex = field.querySelector('.tg-color-field__input');
    swatch.addEventListener('input', () => { hex.value = swatch.value.toUpperCase(); hex.removeAttribute('aria-invalid'); });
    hex.addEventListener('input', () => {
      const value = hex.value.startsWith('#') ? hex.value : `#${hex.value}`;
      const ok = /^#[0-9a-f]{6}$/i.test(value);
      hex.setAttribute('aria-invalid', String(!ok));
      if (ok) swatch.value = value.toLowerCase();
    });
  }
  for (const picker of root.querySelectorAll('[data-color-picker]')) {
    const area = picker.querySelector('.tg-color-picker__area');
    const [s, v] = area.querySelectorAll('input');
    const hue = picker.querySelector('.tg-color-picker__hue');
    const sync = () => {
      picker.style.setProperty('--picker-hue', hue.value);
      picker.style.setProperty('--picker-s', s.value / 100);
      picker.style.setProperty('--picker-v', v.value / 100);
      s.setAttribute('aria-valuetext', `насыщенность ${s.value}%`);
      v.setAttribute('aria-valuetext', `яркость ${v.value}%`);
      hue.setAttribute('aria-valuetext', `оттенок ${hue.value}°`);
      hue.style.setProperty('--range-progress', `${hue.value / 3.6}%`);
    };
    for (const input of [s, v, hue]) input.addEventListener('input', sync);
    // Arrow keys on the area: ←/→ saturation, ↑/↓ brightness (focus sits on the first slider).
    s.addEventListener('keydown', event => { if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); v.value = Number(v.value) + (event.key === 'ArrowUp' ? 1 : -1); sync(); } });
    const drag = event => {
      const r = area.getBoundingClientRect();
      s.value = Math.round(Math.min(1, Math.max(0, (event.clientX - r.left) / r.width)) * 100);
      v.value = Math.round((1 - Math.min(1, Math.max(0, (event.clientY - r.top) / r.height))) * 100);
      sync();
    };
    area.addEventListener('pointerdown', event => { area.setPointerCapture(event.pointerId); drag(event); s.focus({ preventScroll: true }); area.addEventListener('pointermove', drag); });
    area.addEventListener('pointerup', () => area.removeEventListener('pointermove', drag));
    picker.querySelectorAll('.tg-color-picker__swatches input').forEach(input => input.addEventListener('change', () => {
      const hexValue = input.value, r = parseInt(hexValue.slice(1, 3), 16) / 255, g = parseInt(hexValue.slice(3, 5), 16) / 255, b = parseInt(hexValue.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
      let h = 0;
      if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      hue.value = Math.round((h * 60 + 360) % 360); s.value = Math.round((max ? d / max : 0) * 100); v.value = Math.round(max * 100);
      sync();
    }));
    sync();
  }
}

export function initEmojiPickers({ root = document } = {}) {
  for (const picker of root.querySelectorAll('[data-emoji-picker]')) {
    const search = picker.querySelector('input[type="search"]');
    const status = root.getElementById('demo-emoji-status');
    const all = [...picker.querySelectorAll('.tg-emoji-picker__option')];
    const grid = picker.querySelector('.tg-emoji-picker__grid');
    const visible = () => all.filter(o => !o.hidden);
    const columns = () => Math.max(1, Math.round(grid.clientWidth / all[0].offsetWidth));
    search.addEventListener('input', () => {
      const q = search.value.trim().toLocaleLowerCase('ru');
      for (const o of all) o.hidden = q && !o.dataset.name.includes(q);
      const list = visible();
      list.forEach((o, i) => { o.tabIndex = i === 0 ? 0 : -1; });
      announce(status, list.length ? `Найдено: ${list.length}` : 'Ничего не найдено');
    });
    grid.addEventListener('keydown', event => {
      const list = visible(), index = list.indexOf(document.activeElement);
      if (index < 0) return;
      const rtl = getComputedStyle(grid).direction === 'rtl';
      const cols = columns();
      const next = { ArrowRight: index + (rtl ? -1 : 1), ArrowLeft: index + (rtl ? 1 : -1), ArrowDown: index + cols, ArrowUp: index - cols, Home: 0, End: list.length - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      const target = list[Math.max(0, Math.min(list.length - 1, next))];
      list.forEach(o => { o.tabIndex = o === target ? 0 : -1; });
      target.focus({ preventScroll: true });
    });
    grid.addEventListener('click', event => { const o = event.target.closest('.tg-emoji-picker__option'); if (o) { all.forEach(x => x.setAttribute('aria-selected', String(x === o))); announce(status, `Выбрано: ${o.dataset.name}`); } });
  }
}

export function initMediaDemos({ root = document } = {}) {
  for (const player of root.querySelectorAll('[data-player]')) {
    const range = player.querySelector('input[type="range"]'), time = player.querySelector('[data-player-time]'), toggle = player.querySelector('[data-player-toggle]');
    const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    let timer = 0;
    const sync = () => { time.textContent = fmt(Number(range.value)); range.style.setProperty('--range-progress', `${range.value / range.max * 100}%`); range.setAttribute('aria-valuetext', `${Math.floor(range.value / 60)} мин ${range.value % 60} с из 38 минут`); };
    range.addEventListener('input', sync);
    player.querySelectorAll('[data-player-skip]').forEach(b => b.addEventListener('click', () => { range.value = Number(range.value) + Number(b.dataset.playerSkip); sync(); }));
    toggle.addEventListener('click', () => {
      const playing = toggle.getAttribute('aria-pressed') !== 'true';
      toggle.setAttribute('aria-pressed', String(playing));
      toggle.setAttribute('aria-label', playing ? 'Пауза' : 'Воспроизвести');
      toggle.innerHTML = icon(playing ? 'pause' : 'play');
      clearInterval(timer);
      if (playing) timer = setInterval(() => { range.value = Number(range.value) + 1; sync(); }, 1000);
    });
  }
  for (const compare of root.querySelectorAll('[data-compare]')) {
    const handle = compare.querySelector('.tg-compare__handle');
    const sync = () => { compare.style.setProperty('--compare', `${handle.value}%`); handle.setAttribute('aria-valuetext', `до ${handle.value}%`); };
    handle.addEventListener('input', sync);
  }
  for (const wave of root.querySelectorAll('[data-waveform]')) {
    const range = wave.querySelector('input'), bars = [...wave.querySelectorAll('.tg-waveform__bar')];
    range.addEventListener('input', () => {
      bars.forEach((bar, i) => bar.toggleAttribute('data-played', i < Number(range.value)));
      const seconds = Math.round(range.value / range.max * 44);
      range.setAttribute('aria-valuetext', `0:${String(seconds).padStart(2, '0')} из 0:44`);
    });
  }
  for (const box of root.querySelectorAll('[data-selection-box]')) {
    const read = name => parseFloat(box.style.getPropertyValue(name));
    box.addEventListener('keydown', event => {
      const step = 2, map = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
      if (!map) return;
      event.preventDefault();
      if (event.shiftKey) {
        box.style.setProperty('--box-w', `${Math.max(10, Math.min(100 - read('--box-x'), read('--box-w') + map[0]))}%`);
        box.style.setProperty('--box-h', `${Math.max(10, Math.min(100 - read('--box-y'), read('--box-h') + map[1]))}%`);
      } else {
        box.style.setProperty('--box-x', `${Math.max(0, Math.min(100 - read('--box-w'), read('--box-x') + map[0]))}%`);
        box.style.setProperty('--box-y', `${Math.max(0, Math.min(100 - read('--box-h'), read('--box-y') + map[1]))}%`);
      }
    });
    // Pointer: drag the frame to move it, drag a corner handle to resize. Values stay in %
    // of the stage, inside it, at least 10% each way.
    const stage = box.parentElement;
    box.addEventListener('pointerdown', event => {
      if (event.button) return;
      event.preventDefault();
      box.focus({ preventScroll: true });
      box.setPointerCapture(event.pointerId);
      const corner = event.target.closest('.tg-selection-box__handle')?.dataset.corner;
      const rtl = getComputedStyle(box).direction === 'rtl';
      const s = stage.getBoundingClientRect();
      const start = { px: event.clientX, py: event.clientY, x: read('--box-x'), y: read('--box-y'), w: read('--box-w'), h: read('--box-h') };
      const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
      const move = e => {
        const dx = (e.clientX - start.px) / s.width * 100 * (rtl ? -1 : 1), dy = (e.clientY - start.py) / s.height * 100;
        let { x, y, w, h } = start;
        if (!corner) { x = clamp(x + dx, 0, 100 - w); y = clamp(y + dy, 0, 100 - h); }
        else {
          if (corner.includes('w')) { const nx = clamp(x + dx, 0, x + w - 10); w += x - nx; x = nx; } else w = clamp(w + dx, 10, 100 - x);
          if (corner.includes('n')) { const ny = clamp(y + dy, 0, y + h - 10); h += y - ny; y = ny; } else h = clamp(h + dy, 10, 100 - y);
        }
        for (const [name, v] of [['--box-x', x], ['--box-y', y], ['--box-w', w], ['--box-h', h]]) box.style.setProperty(name, `${v.toFixed(2)}%`);
      };
      const end = () => { box.removeEventListener('pointermove', move); box.removeEventListener('pointerup', end); box.removeEventListener('pointercancel', end); };
      box.addEventListener('pointermove', move);
      box.addEventListener('pointerup', end);
      box.addEventListener('pointercancel', end);
    });
  }
  for (const list of root.querySelectorAll('[data-image-accordion]')) {
    list.addEventListener('click', event => {
      const trigger = event.target.closest('.tg-image-accordion__trigger');
      if (!trigger) return;
      for (const t of list.querySelectorAll('.tg-image-accordion__trigger')) {
        const on = t === trigger;
        t.setAttribute('aria-expanded', String(on));
        root.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      }
    });
  }
  for (const stack of root.querySelectorAll('[data-card-stack]')) {
    const deck = stack.querySelector('.tg-card-stack__deck'), count = stack.querySelector('[data-stack-count]');
    const layout = () => {
      const items = [...deck.querySelectorAll('.tg-card-stack__item:not([data-leaving])')];
      items.forEach((item, i) => { item.style.setProperty('--depth', i); item.dataset.depth = Math.min(i, 4); item.inert = i > 0; });
      const n = items.length;
      count.textContent = n ? `Осталось ${n} ${n === 1 ? 'заявка' : n < 5 ? 'заявки' : 'заявок'}` : 'Все заявки разобраны';
      stack.querySelectorAll('[data-stack]').forEach(b => { b.disabled = !n; });
    };
    stack.querySelectorAll('[data-stack]').forEach(button => button.addEventListener('click', () => {
      const top = deck.querySelector('.tg-card-stack__item:not([data-leaving])');
      if (!top) return;
      const accept = button.dataset.stack === 'accept';
      top.style.setProperty('--leave-x', accept ? '110%' : '-110%');
      top.style.setProperty('--leave-r', accept ? '6deg' : '-6deg');
      top.dataset.leaving = '';
      top.inert = true;
      layout();
      setTimeout(() => top.remove(), 260);
    }));
    layout();
  }
  for (const marquee of root.querySelectorAll('[data-marquee]')) {
    const button = marquee.querySelector('[data-marquee-pause]');
    button.addEventListener('click', () => {
      const paused = !marquee.hasAttribute('data-paused');
      marquee.toggleAttribute('data-paused', paused);
      button.setAttribute('aria-pressed', String(paused));
      button.querySelector('.tg-btn__label').textContent = paused ? 'Продолжить' : 'Пауза';
      button.querySelector('.tg-icon').outerHTML = icon(paused ? 'play' : 'pause').replace('class="tg-icon"', 'class="tg-icon tg-btn__icon"');
    });
  }
}

// G2: the segmented control swaps the 3D variant of one carousel.
export function initCarouselVariants({ root = document } = {}) {
  for (const group of root.querySelectorAll('[data-carousel-variant]')) {
    const carousel = group.parentElement.querySelector('.tg-carousel');
    group.addEventListener('change', event => {
      for (const name of ['coverflow', 'fan', 'ring']) carousel.classList.toggle(`tg-carousel--${name}`, event.target.value === name);
    });
  }
}

export function initCatalogComponents({ root = document } = {}) {
  initTooltips({ root });
  initPressToggles({ root });
  initToolbars({ root });
  initCopy({ root });
  initToastRegion({ root });
  initBanners({ root });
  initSteppers({ root });
  initProgressRings({ root });
  initMorphDialogs({ root });
  initListboxes({ root });
  initComboboxes({ root });
  initTagInputs({ root });
  initNumberFields({ root });
  initOtp({ root });
  initRanges({ root });
  initHoverCards({ root });
  initTableFilters({ root });
  initCarousels({ root });
  initOrientedTabs({ root });
  initSidebars({ root });
  initNavMenus({ root });
  initMenubars({ root });
  initTocs({ root });
  initCommandPalette({ root });
  initCalendars({ root });
  initRangeCalendars({ root });
  initDateFields({ root });
  initCharts({ root });
  initSortables({ root });
  initAgentSteps({ root });
  initApprovals({ root });
  initEditor({ root });
  initGestures({ root });
  initFab({ root });
  initWheels({ root });
  initColorPickers({ root });
  initEmojiPickers({ root });
  initMediaDemos({ root });
  initCarouselVariants({ root });
}
