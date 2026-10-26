import { initRipple } from './effects.mjs';

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
    if (!host || host.closest('.tg-ripple') || (root !== doc && !root.contains(host))) return;
    if (host.matches('input, select, textarea') || target.closest('input, select, textarea') ||
        host.matches(':disabled') || host.closest('[disabled], [aria-disabled="true"]') ||
        view.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
    root.removeEventListener('click', click);
    stopLegacy();
    for (const node of active.keys()) remove(node);
    registrations.delete(root);
  };
  registrations.set(root, cleanup);
  return cleanup;
}

if (globalThis.document?.addEventListener) initUI(globalThis.document);
