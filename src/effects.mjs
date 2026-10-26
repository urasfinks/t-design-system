const registrations = new WeakMap();
const handledEvents = new WeakSet();
const controls = '.tg-ripple, .tg-btn, .tg-icon-btn, .tg-chip, .tg-tab, .tg-tabbar__item, .tg-dot, button.tg-avatar, .tg-switch, button.tg-badge, a.tg-badge[href], .tg-disclosure > summary, .tg-disclosure__summary, .tg-bottom-panel__header, button[class*="tg-"]';

/** Delegated TDS button ripple, including legacy .tg-ripple hosts. Dispose on unmount. */
export function initRipple(root = globalThis.document) {
  if (!root?.addEventListener) return () => {};
  if (registrations.has(root)) return registrations.get(root);
  const doc = root.nodeType === 9 ? root : root.ownerDocument;
  const view = doc?.defaultView;
  if (!view) return () => {};
  const active = new Map();
  const remove = node => {
    const entry = active.get(node);
    if (!entry) return;
    view.clearTimeout(entry.timer);
    node.removeEventListener('animationend', entry.end);
    const layer = node.parentElement;
    node.remove();
    if (layer?.classList.contains('tg-ripple__layer') && !layer.childElementCount) layer.remove();
    active.delete(node);
  };
  const milliseconds = value => Number.parseFloat(value) * (value.trim().endsWith('ms') ? 1 : 1000) || 0;
  const lifetime = node => {
    const style = view.getComputedStyle(node);
    const durations = style.animationDuration.split(',').map(milliseconds);
    const delays = style.animationDelay.split(',').map(milliseconds);
    const iterations = style.animationIterationCount.split(',').map(value => Number.parseFloat(value) || 1);
    return Math.max(0, ...durations.map((duration, i) => duration * iterations[i % iterations.length] + delays[i % delays.length])) + 80;
  };
  const pressed = new WeakMap();
  const activate = event => {
    if (handledEvents.has(event)) return;
    if (event.type === 'pointerdown' && (event.button !== 0 || event.isPrimary === false)) return;
    const target = event.target?.nodeType === 1 ? event.target : event.target?.parentElement;
    const host = target?.closest(controls);
    if (!host || (root !== doc && !root.contains(host))) return;
    // Replaced/void elements cannot own the effect nodes. Native disabled
    // fieldsets and disabled ancestors also suppress synthetic activation.
    if (host.matches('input, img, br, hr, area, base, embed, link, meta, source, track, wbr, select, textarea') ||
        target.closest('input, select, textarea') ||
        host.matches(':disabled') || host.closest('[disabled], [aria-disabled="true"]') ||
        view.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    handledEvents.add(event);
    if (event.type === 'click' && event.detail !== 0 && pressed.has(host)) {
      pressed.delete(host);
      return;
    }
    if (event.type === 'pointerdown') pressed.set(host, true);
    const rect = host.getBoundingClientRect();
    const keyboard = event.type === 'click' && event.detail === 0;
    const x = keyboard ? rect.width / 2 : event.clientX - rect.left;
    const y = keyboard ? rect.height / 2 : event.clientY - rect.top;
    // Legacy opt-in hosts already clip their contents. Standard controls use a
    // separate clipping layer so badges and focus outlines remain outside it.
    let layer = host;
    if (!host.classList.contains('tg-ripple')) {
      layer = doc.createElement('span');
      layer.className = 'tg-ripple__layer';
      layer.setAttribute('aria-hidden', 'true');
      host.append(layer);
    }
    for (const effect of ['wave', 'ring', 'wash']) {
      const node = doc.createElement('span');
      node.className = `tg-ripple__${effect}`;
      node.setAttribute('aria-hidden', 'true');
      if (effect === 'wave') {
        node.style.setProperty('--ripple-x', `${x}px`);
        node.style.setProperty('--ripple-y', `${y}px`);
        node.style.setProperty('--ripple-host-width', `${rect.width}px`);
        node.style.setProperty('--ripple-host-height', `${rect.height}px`);
        node.style.setProperty('--ripple-radius', view.getComputedStyle(host).borderRadius);
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        node.style.setProperty('--ripple-size', `${Math.max(rect.width, rect.height) * 2}px`);
      }
      layer.append(node);
      const end = e => { if (e.target === node) remove(node); };
      node.addEventListener('animationend', end);
      const timer = view.setTimeout(() => remove(node), lifetime(node));
      active.set(node, { timer, end });
    }
  };
  const cancel = event => {
    const host = event.target?.closest?.(controls);
    if (host) pressed.delete(host);
  };
  root.addEventListener('pointercancel', cancel);
  root.addEventListener('pointerdown', activate);
  root.addEventListener('click', activate);
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    root.removeEventListener('pointercancel', cancel);
    root.removeEventListener('pointerdown', activate);
    root.removeEventListener('click', activate);
    registrations.delete(root);
    for (const node of active.keys()) remove(node);
  };
  registrations.set(root, dispose);
  return dispose;
}
