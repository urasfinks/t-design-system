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
