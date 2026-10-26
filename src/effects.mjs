/** Opt-in delegated ripple. Call the returned function when unmounting. */
export function initRipple(root = globalThis.document) {
  if (!root?.addEventListener) return () => {};
  const doc = root.nodeType === 9 ? root : root.ownerDocument;
  const view = doc?.defaultView;
  if (!view) return () => {};
  const active = new Map();
  const remove = node => {
    const entry = active.get(node);
    if (!entry) return;
    view.clearTimeout(entry.timer);
    node.removeEventListener('animationend', entry.end);
    node.remove();
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
  const click = event => {
    const target = event.target?.nodeType === 1 ? event.target : event.target?.parentElement;
    const host = target?.closest('.tg-ripple');
    if (host?.matches('.tg-btn--ghost, .tg-icon-btn--ghost, .tg-search__clear')) return;
    if (!host || (root !== doc && !root.contains(host))) return;
    // Replaced/void elements cannot own the effect nodes. Native disabled
    // fieldsets and disabled ancestors also suppress synthetic activation.
    if (host.matches('input, img, br, hr, area, base, embed, link, meta, source, track, wbr, select, textarea') ||
        target.closest('input, select, textarea') ||
        host.matches(':disabled') || host.closest('[disabled], [aria-disabled="true"]') ||
        view.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = host.getBoundingClientRect();
    const keyboard = event.detail === 0;
    const x = keyboard ? rect.width / 2 : event.clientX - rect.left;
    const y = keyboard ? rect.height / 2 : event.clientY - rect.top;
    for (const effect of ['wave', 'ring', 'wash']) {
      const node = doc.createElement('span');
      node.className = `tg-ripple__${effect}`;
      node.setAttribute('aria-hidden', 'true');
      if (effect === 'wave') {
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        node.style.setProperty('--ripple-size', `${Math.max(rect.width, rect.height) * 2}px`);
      }
      host.append(node);
      const end = e => { if (e.target === node) remove(node); };
      node.addEventListener('animationend', end);
      const timer = view.setTimeout(() => remove(node), lifetime(node));
      active.set(node, { timer, end });
    }
  };
  root.addEventListener('click', click);
  return () => {
    root.removeEventListener('click', click);
    for (const node of active.keys()) remove(node);
  };
}
