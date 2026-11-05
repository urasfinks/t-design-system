const scrollRegistrations = new WeakMap();

/** Opt-in keyboard access for named overflow regions; returns cleanup. */
export function initScrollRegions(root = globalThis.document) {
  if (!root?.querySelectorAll) return () => {};
  if (scrollRegistrations.has(root)) return scrollRegistrations.get(root);
  const doc = root.nodeType === 9 ? root : root.ownerDocument;
  const view = doc?.defaultView;
  if (!view?.ResizeObserver) return () => {};
  const regions = new Map();
  let frame = 0;
  let disposed = false;
  const update = () => {
    frame = 0;
    const nodes = [...root.querySelectorAll('.tg-scroll-region')];
    if (root.matches?.('.tg-scroll-region')) nodes.unshift(root);
    const current = new Set(nodes);
    for (const [el, record] of regions) if (!current.has(el)) {
      resize.unobserve(el);
      if (record.content) resize.unobserve(record.content);
      if (record.original === null) el.removeAttribute('tabindex'); else el.setAttribute('tabindex', record.original);
      regions.delete(el);
    }
    for (const el of nodes) {
      if (!regions.has(el)) { regions.set(el, { original: el.getAttribute('tabindex'), content: null }); resize.observe(el); }
      const record = regions.get(el);
      if (record.content !== el.firstElementChild) {
        if (record.content) resize.unobserve(record.content);
        record.content = el.firstElementChild;
        if (record.content) resize.observe(record.content);
      }
      const overflowing = el.clientWidth > 0 && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
      const value = overflowing ? '0' : '-1';
      if (el.getAttribute('tabindex') !== value) el.setAttribute('tabindex', value);
    }
  };
  const schedule = () => { if (!disposed && !frame) frame = view.requestAnimationFrame(update); };
  const resize = new view.ResizeObserver(schedule);
  // Content can change without resizing its viewport (e.g. code in an open
  // disclosure). Ignore tabindex mutations written by this initializer.
  const mutations = new view.MutationObserver(schedule);
  mutations.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'hidden', 'open'] });
  // WebKit does not consistently scroll a focused <pre> with arrow keys.
  // Handle only the region itself; nested fields/widgets retain their keyboard.
  const keydown = event => {
    const el = event.target;
    if (!el.matches?.('.tg-scroll-region') || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const horizontal = ['ArrowLeft', 'ArrowRight'].includes(event.key);
    const vertical = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(event.key);
    if (!(horizontal && el.scrollWidth > el.clientWidth + 1) && !(vertical && el.scrollHeight > el.clientHeight + 1)) return;
    const style = view.getComputedStyle(el);
    const step = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.5;
    const direction = ['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key) ? -1 : 1;
    const distance = event.key.startsWith('Page') ? el.clientHeight : step;
    event.preventDefault();
    el.scrollBy({ left: horizontal ? direction * distance : 0, top: vertical ? direction * distance : 0, behavior: 'instant' });
  };
  root.addEventListener('keydown', keydown);
  view.addEventListener('resize', schedule);
  doc.fonts?.ready.then(schedule);
  update();
  const cleanup = () => {
    disposed = true;
    resize.disconnect(); mutations.disconnect();
    view.cancelAnimationFrame(frame);
    view.removeEventListener('resize', schedule);
    root.removeEventListener('keydown', keydown);
    for (const [el, { original }] of regions) {
      if (original === null) el.removeAttribute('tabindex'); else el.setAttribute('tabindex', original);
    }
    scrollRegistrations.delete(root);
  };
  scrollRegistrations.set(root, cleanup);
  return cleanup;
}

import { initRipple } from './effects.js';

const registrations = new WeakMap();
const handled = new WeakSet();
const controls = 'button, .tg-btn, .tg-icon-btn, .tg-chip, .tg-tab, .tg-tabbar__item, .tg-dot, a.tg-badge[href], .tg-disclosure__trigger, .tg-bottom-panel__header, .tg-bottom-panel__trigger';

/** Standard button feedback, including dynamic controls. Returns cleanup. */
export function initUI(root = globalThis.document) {
  if (!root?.addEventListener) return () => {};
  if (registrations.has(root)) return registrations.get(root);
  const doc = root.nodeType === 9 ? root : root.ownerDocument;
  const view = doc?.defaultView;
  if (!view) return () => {};
  const stopLegacy = initRipple(root);
  const stopScrollRegions = initScrollRegions(root);
  const ranges = 'input[type="range"].tg-range';
  const updateRange = el => {
    const min = Number(el.min || 0);
    const max = Number(el.max || 100);
    const progress = max > min ? Math.min(100, Math.max(0, (el.valueAsNumber - min) / (max - min) * 100)) : 0;
    el.style.setProperty('--range-progress', `${progress}%`);
  };
  const syncRanges = () => {
    if (root.matches?.(ranges)) updateRange(root);
    root.querySelectorAll(ranges).forEach(updateRange);
  };
  const rangeInput = event => { if (event.target?.matches(ranges)) updateRange(event.target); };
  let resetTimer;
  const resetRanges = () => {
    view.clearTimeout(resetTimer);
    resetTimer = view.setTimeout(syncRanges, 0);
  };
  syncRanges();
  const rangeObserver = new view.MutationObserver(syncRanges);
  rangeObserver.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['min', 'max', 'value', 'class', 'type'] });
  root.addEventListener('input', rangeInput);
  root.addEventListener('change', rangeInput);
  root.addEventListener('reset', resetRanges);
  const active = new Map();
  const remove = node => {
    const entry = active.get(node);
    if (!entry) return;
    view.clearTimeout(entry.timer);
    node.removeEventListener('animationend', entry.end);
    const layer = node.parentElement;
    node.remove();
    if (layer && !layer.childElementCount) {
      const host = layer.parentElement;
      layer.remove();
      if (host && !host.querySelector(':scope > .tg-feedback-layer')) host.classList.remove('tg-feedback-host');
    }
    active.delete(node);
  };
  const milliseconds = value => Number.parseFloat(value) * (value.trim().endsWith('ms') ? 1 : 1000) || 0;
  const lifetime = node => {
    const style = view.getComputedStyle(node);
    const durations = style.animationDuration.split(',').map(milliseconds);
    const delays = style.animationDelay.split(',').map(milliseconds);
    return Math.max(0, ...durations.map((duration, i) => duration + delays[i % delays.length])) + 80;
  };
  const click = event => {
    if (handled.has(event)) return;
    const target = event.target?.nodeType === 1 ? event.target : event.target?.parentElement;
    if (target?.closest('.tg-switch, [role="switch"]')) return;
    const host = target?.closest(controls);
    if (host?.matches('.tg-btn--ghost, .tg-icon-btn--ghost, .tg-search__clear, .tg-tag-input__remove')) return;
    if (!host || host.closest('.tg-ripple') || (root !== doc && !root.contains(host))) return;
    if (host.matches('input, select, textarea') || target.closest('input, select, textarea') ||
        host.matches(':disabled') || host.closest('[disabled], [aria-disabled="true"]') ||
        !view.matchMedia || view.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    handled.add(event);
    host.classList.add('tg-feedback-host');
    const rect = host.getBoundingClientRect();
    const keyboard = event.detail === 0;
    const layer = doc.createElement('span');
    layer.className = 'tg-feedback-layer';
    layer.setAttribute('aria-hidden', 'true');
    host.append(layer);
    for (const effect of ['wave', 'ring', 'wash']) {
      const node = doc.createElement('span');
      node.className = `tg-ripple__${effect}`;
      if (effect === 'wave') {
        node.style.left = `${keyboard ? rect.width / 2 : event.clientX - rect.left}px`;
        node.style.top = `${keyboard ? rect.height / 2 : event.clientY - rect.top}px`;
        node.style.setProperty('--ripple-size', `${Math.hypot(rect.width, rect.height) * 2}px`);
      }
      layer.append(node);
      const end = event => { if (event.target === node) remove(node); };
      node.addEventListener('animationend', end);
      active.set(node, { timer: view.setTimeout(() => remove(node), lifetime(node)), end });
    }
  };
  root.addEventListener('click', click);
  const cleanup = () => {
    rangeObserver.disconnect();
    view.clearTimeout(resetTimer);
    root.removeEventListener('input', rangeInput);
    root.removeEventListener('change', rangeInput);
    root.removeEventListener('reset', resetRanges);
    root.removeEventListener('click', click);
    stopLegacy();
    stopScrollRegions();
    for (const node of active.keys()) remove(node);
    registrations.delete(root);
  };
  registrations.set(root, cleanup);
  return cleanup;
}

if (globalThis.document?.addEventListener) initUI(globalThis.document);

const positionedMenus = new WeakMap();
/** Viewport-safe placement for a menu that is already in the popover top layer. */
export function positionMenu(menu, trigger) {
  const view = menu.ownerDocument.defaultView;
  if (!view) return () => {};
  const token = {};
  positionedMenus.set(menu, token);
  let frame = 0;
  const place = () => {
    frame = 0;
    if (!menu.isConnected || !trigger.isConnected || !menu.matches(':popover-open')) return;
    const visual = view.visualViewport;
    const leftEdge = visual?.offsetLeft ?? 0, topEdge = visual?.offsetTop ?? 0;
    const width = visual?.width ?? view.innerWidth, height = visual?.height ?? view.innerHeight;
    const anchor = trigger.getBoundingClientRect();
    if (anchor.bottom < topEdge || anchor.top > topEdge + height || anchor.right < leftEdge || anchor.left > leftEdge + width) {
      menu.hidePopover(); return;
    }
    const css = view.getComputedStyle(menu);
    const gap = Number.parseFloat(css.paddingBlockStart) || 4;
    const margin = gap * 2;
    const rtl = view.getComputedStyle(trigger).direction === 'rtl';
    menu.setAttribute('data-positioned', '');
    menu.style.setProperty('--tg-menu-available-inline', `${Math.max(1, width - margin * 2)}px`);
    menu.style.setProperty('--tg-menu-available-block', `${Math.max(1, height - margin * 2)}px`);
    const w = menu.offsetWidth, h = menu.offsetHeight;
    const belowSpace = topEdge + height - margin - anchor.bottom - gap;
    const aboveSpace = anchor.top - topEdge - margin - gap;
    const below = belowSpace >= h || belowSpace >= aboveSpace;
    const x = Math.max(leftEdge + margin, Math.min(rtl ? anchor.left : anchor.right - w, leftEdge + width - margin - w));
    const y = Math.max(topEdge + margin, Math.min(below ? anchor.bottom + gap : anchor.top - gap - h, topEdge + height - margin - h));
    menu.style.setProperty('--tg-anchor-block', `${y}px`);
    menu.style.setProperty('--tg-anchor-inline', `${rtl ? menu.ownerDocument.documentElement.clientWidth - x - w : x}px`);
    menu.style.setProperty('--tg-menu-origin', `${below ? 'top' : 'bottom'} ${rtl ? 'left' : 'right'}`);
  };
  const schedule = () => { if (!frame) frame = view.requestAnimationFrame(place); };
  place();
  view.addEventListener('resize', schedule);
  view.addEventListener('scroll', schedule, true);
  view.visualViewport?.addEventListener('resize', schedule);
  view.visualViewport?.addEventListener('scroll', schedule);
  const observer = new view.ResizeObserver(schedule);
  observer.observe(trigger); observer.observe(menu);
  return () => {
    view.cancelAnimationFrame(frame);
    view.removeEventListener('resize', schedule);
    view.removeEventListener('scroll', schedule, true);
    view.visualViewport?.removeEventListener('resize', schedule);
    view.visualViewport?.removeEventListener('scroll', schedule);
    observer.disconnect();
    // Keep the exit transition anchored. A rapid reopen owns a new token.
    Promise.allSettled(menu.getAnimations().map(animation => animation.finished)).then(() => {
      if (positionedMenus.get(menu) !== token || menu.matches(':popover-open')) return;
      for (const name of ['--tg-menu-available-inline', '--tg-menu-available-block', '--tg-anchor-block', '--tg-anchor-inline', '--tg-menu-origin']) menu.style.removeProperty(name);
      menu.removeAttribute('data-positioned');
      if (!menu.getAttribute('style')?.trim()) menu.removeAttribute('style');
      positionedMenus.delete(menu);
    });
  };
}
