// Demo controller for .tg-menu: what a host application does around the styles.
// Popover top layer, roving focus, typeahead, Escape/Tab, instant keyboard opening,
// and a measured fallback when CSS anchor positioning is unavailable.
const anchorSupported = typeof CSS !== 'undefined' && CSS.supports('position-area: block-end');

export function initMenus({ root = document, onAction = () => {} } = {}) {
  let openMenu = null;
  const menuItems = menu => [...menu.querySelectorAll('[role^="menuitem"]')];

  function placeMenu(trigger, menu) {
    menu.dataset.positioned = '';
    const rect = trigger.getBoundingClientRect();
    const { offsetWidth: width, offsetHeight: height } = menu;
    const rtl = getComputedStyle(trigger).direction === 'rtl';
    const gap = 4;
    const below = rect.bottom + gap + height <= innerHeight || rect.top < height;
    const block = below ? rect.bottom + gap : rect.top - gap - height;
    let inline = rtl ? innerWidth - rect.right : rect.left;
    if (inline + width > innerWidth - 8) inline = Math.max(8, (rtl ? innerWidth - rect.left : rect.right) - width);
    menu.style.setProperty('--tg-anchor-block', `${Math.max(8, block)}px`);
    menu.style.setProperty('--tg-anchor-inline', `${inline}px`);
    menu.style.setProperty('--tg-menu-origin', `${below ? 'top' : 'bottom'} ${rtl ? 'right' : 'left'}`);
  }

  function showMenu(trigger, { focus = 'first', instant = false } = {}) {
    const menu = root.getElementById(trigger.getAttribute('aria-controls'));
    if (openMenu && openMenu.menu !== menu) closeMenu({ restore: false });
    menu.toggleAttribute('data-instant', instant);
    menu.removeAttribute('data-positioned');
    if (anchorSupported) {
      try { menu.showPopover({ source: trigger }); } catch { menu.showPopover(); placeMenu(trigger, menu); }
    } else {
      menu.showPopover();
      placeMenu(trigger, menu);
    }
    trigger.setAttribute('aria-expanded', 'true');
    openMenu = { trigger, menu };
    const items = menuItems(menu);
    (focus === 'last' ? items.at(-1) : items[0])?.focus({ preventScroll: true });
  }

  function closeMenu({ restore = true } = {}) {
    if (!openMenu) return;
    const { trigger, menu } = openMenu;
    openMenu = null;
    trigger.setAttribute('aria-expanded', 'false');
    if (menu.matches(':popover-open')) menu.hidePopover();
    if (restore) trigger.focus({ preventScroll: true });
  }

  let typeahead = '', typeaheadTimer = 0;
  function onMenuKey(event) {
    const items = menuItems(event.currentTarget);
    const index = items.indexOf(document.activeElement);
    const move = next => { event.preventDefault(); items[(next + items.length) % items.length].focus(); };
    switch (event.key) {
      case 'ArrowDown': return move(index + 1);
      case 'ArrowUp': return move(index - 1);
      case 'Home': return move(0);
      case 'End': return move(items.length - 1);
      case 'Escape': event.preventDefault(); return closeMenu();
      case 'Tab': event.preventDefault(); return closeMenu();
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && event.key !== ' ') {
      clearTimeout(typeaheadTimer);
      typeahead += event.key.toLocaleLowerCase('ru');
      typeaheadTimer = setTimeout(() => { typeahead = ''; }, 500);
      const order = [...items.slice(index + 1), ...items.slice(0, index + 1)];
      order.find(item => item.textContent.trim().toLocaleLowerCase('ru').startsWith(typeahead))?.focus();
    }
  }

  for (const trigger of root.querySelectorAll('[data-menu-trigger]')) {
    trigger.addEventListener('click', () => {
      if (openMenu?.trigger === trigger) return closeMenu();
      showMenu(trigger);
    });
    trigger.addEventListener('keydown', event => {
      if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
        showMenu(trigger, { focus: event.key === 'ArrowUp' ? 'last' : 'first', instant: true });
      } else if (['Enter', ' '].includes(event.key)) {
        event.preventDefault();
        if (openMenu?.trigger === trigger) closeMenu(); else showMenu(trigger, { instant: true });
      }
    });
  }

  for (const menu of root.querySelectorAll('.tg-menu[popover]')) {
    menu.addEventListener('keydown', onMenuKey);
    // Light dismiss (click outside) closes without stealing focus.
    menu.addEventListener('toggle', event => { if (event.newState === 'closed' && openMenu?.menu === menu) closeMenu({ restore: false }); });
    menu.addEventListener('pointermove', event => {
      const item = event.target.closest('[role^="menuitem"]');
      if (item && document.activeElement !== item) item.focus({ preventScroll: true });
    });
    menu.addEventListener('click', event => {
      const item = event.target.closest('[role^="menuitem"]');
      if (!item) return;
      if (item.getAttribute('aria-disabled') === 'true') { event.preventDefault(); return; }
      const trigger = openMenu?.trigger;
      const role = item.getAttribute('role');
      if (role === 'menuitemcheckbox') item.setAttribute('aria-checked', String(item.getAttribute('aria-checked') !== 'true'));
      if (role === 'menuitemradio') {
        const group = item.closest('[role="group"]') ?? menu;
        for (const radio of group.querySelectorAll('[role="menuitemradio"]')) radio.setAttribute('aria-checked', String(radio === item));
      }
      const keepFocus = onAction(item, trigger) === 'keep-focus';
      closeMenu({ restore: !item.matches('a[href]') && !keepFocus });
    });
  }
  return { closeMenu };
}
