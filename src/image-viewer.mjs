// The stage owns the pointer stream. A gesture that has zoomed or panned
// stays with the current image until all fingers are lifted.
export function initImageViewer(stage, image, onSwipe, onScale) {
  const listeners = new AbortController();
  const pointers = new Map();
  let scale = 1;
  let x = 0;
  let y = 0;
  let swipeStart;
  let cancelled = false;

  function paint() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const fit = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const limitX = Math.max(0, (image.naturalWidth * fit * scale - width) / 2) || 0;
    const limitY = Math.max(0, (image.naturalHeight * fit * scale - height) / 2) || 0;
    x = Math.max(-limitX, Math.min(limitX, x));
    y = Math.max(-limitY, Math.min(limitY, y));
    image.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    onScale?.(scale);
    return scale;
  }

  function zoom(next, fromX = 0, fromY = 0, toX = fromX, toY = fromY) {
    const previous = scale;
    scale = Math.max(1, Math.min(5, next));
    x = toX - (fromX - x) * scale / previous;
    y = toY - (fromY - y) * scale / previous;
    return paint();
  }

  function reset() {
    for (const id of pointers.keys()) {
      if (stage.hasPointerCapture(id)) stage.releasePointerCapture(id);
    }
    pointers.clear();
    swipeStart = undefined;
    scale = 1;
    x = y = 0;
    return paint();
  }

  function point(event) {
    const rect = stage.getBoundingClientRect();
    return { x: event.clientX - rect.left - rect.width / 2,
      y: event.clientY - rect.top - rect.height / 2 };
  }

  function listen(target, type, handler) {
    target.addEventListener(type, handler, { signal: listeners.signal });
  }
  listen(stage, 'pointerdown', event => {
    if (event.button !== 0 || pointers.size >= 2) return;
    const start = point(event);
    if (!pointers.size) {
      swipeStart = scale === 1 ? start : undefined;
      cancelled = false;
    } else {
      swipeStart = undefined;
    }
    pointers.set(event.pointerId, start);
    stage.setPointerCapture(event.pointerId);
  });
  listen(stage, 'pointermove', event => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    const next = point(event);
    pointers.set(event.pointerId, next);
    if (pointers.size === 2) {
      const other = [...pointers].find(([id]) => id !== event.pointerId)[1];
      const distance = Math.hypot(previous.x - other.x, previous.y - other.y);
      if (distance > 0) zoom(scale * Math.hypot(next.x - other.x, next.y - other.y) / distance,
        (previous.x + other.x) / 2, (previous.y + other.y) / 2,
        (next.x + other.x) / 2, (next.y + other.y) / 2);
    } else if (scale > 1) {
      swipeStart = undefined;
      x += next.x - previous.x;
      y += next.y - previous.y;
      paint();
    }
  });
  function end(event) {
    if (!pointers.delete(event.pointerId)) return;
    cancelled ||= event.type !== 'pointerup';
    if (!swipeStart || pointers.size || cancelled) return;
    const next = point(event);
    const dx = next.x - swipeStart.x;
    const dy = next.y - swipeStart.y;
    swipeStart = undefined;
    if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.25) onSwipe(dx < 0 ? 1 : -1);
  }
  listen(stage, 'pointerup', end);
  listen(stage, 'pointercancel', end);
  listen(stage, 'lostpointercapture', end);
  listen(stage, 'dblclick', event => {
    const anchor = point(event);
    zoom(scale === 1 ? 2 : 1, anchor.x, anchor.y);
  });
  listen(image, 'load', paint);
  const resize = new ResizeObserver(paint);
  resize.observe(stage);

  return {
    reset,
    zoomBy: factor => zoom(scale * factor),
    destroy() {
      listeners.abort();
      resize.disconnect();
      image.style.removeProperty('transform');
    },
  };
}
