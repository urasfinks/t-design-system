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
    if (host?.matches('.tg-btn--ghost, .tg-icon-btn--ghost, .tg-search__clear, .tg-tag-input__remove')) return;
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

/**
 * Opt-in decorative effects. Returns cleanup.
 * - Pointer: .tg-effect-spotlight / -glare (pointer coordinates), -tilt (≤ 6°),
 *   -magnetic (≤ 4px). Only with a fine hovering pointer; tilt and magnet also need motion.
 * - Layers: canvas.tg-effect-layer[data-tg-effect="field|waveform"] draws behind a section.
 *   States on the canvas: running, paused (off screen or hidden tab), static (reduced
 *   motion, touch), failed (no canvas: the CSS fill stays).
 * - Ripple: .tg-carousel[data-tg-effect="ripple"] plays a short ripple of the new slide
 *   over the viewport when its current picker changes. The slides themselves change at once.
 */
export function initEffects(root = globalThis.document) {
  if (!root?.addEventListener) return () => {};
  const doc = root.nodeType === 9 ? root : root.ownerDocument;
  const view = doc?.defaultView;
  if (!view) return () => {};
  const media = query => view.matchMedia(query);
  const finePointer = media('(hover: hover) and (pointer: fine)');
  const reducedMotion = media('(prefers-reduced-motion: reduce)');
  const cleanups = [];

  // ---- Pointer effects --------------------------------------------------------------
  const pointerHosts = '.tg-effect-spotlight, .tg-effect-glare, .tg-effect-tilt, .tg-effect-magnetic';
  let frame = 0, pending = null, current = null;
  const reset = host => {
    host.removeAttribute('data-effect-active');
    for (const name of ['--tilt-x', '--tilt-y', '--magnet-x', '--magnet-y']) host.style.removeProperty(name);
  };
  const apply = () => {
    frame = 0;
    if (!pending) return;
    const { host, x, y } = pending;
    const rect = host.getBoundingClientRect();
    const px = x - rect.left, py = y - rect.top;
    const rx = Math.min(1, Math.max(0, px / rect.width)), ry = Math.min(1, Math.max(0, py / rect.height));
    host.style.setProperty('--pointer-x', `${px}px`);
    host.style.setProperty('--pointer-y', `${py}px`);
    host.style.setProperty('--pointer-rx', rx.toFixed(3));
    host.style.setProperty('--pointer-ry', ry.toFixed(3));
    if (reducedMotion.matches) return;
    host.setAttribute('data-effect-active', '');
    if (host.matches('.tg-effect-tilt')) {
      host.style.setProperty('--tilt-x', `${((.5 - ry) * 12).toFixed(2)}deg`);
      host.style.setProperty('--tilt-y', `${((rx - .5) * 12).toFixed(2)}deg`);
    }
    if (host.matches('.tg-effect-magnetic')) {
      host.style.setProperty('--magnet-x', `${((rx - .5) * 8).toFixed(2)}px`);
      host.style.setProperty('--magnet-y', `${((ry - .5) * 8).toFixed(2)}px`);
    }
  };
  const move = event => {
    if (!finePointer.matches || event.pointerType === 'touch') return;
    const target = event.target?.nodeType === 1 ? event.target : event.target?.parentElement;
    const host = target?.closest(pointerHosts);
    if (current && current !== host) reset(current);
    current = host && !host.matches(':disabled, [aria-disabled="true"], [aria-busy="true"]') ? host : null;
    if (!current) return;
    pending = { host: current, x: event.clientX, y: event.clientY };
    if (!frame) frame = view.requestAnimationFrame(apply);
  };
  const leave = event => { if (current && !current.contains(event.relatedTarget)) { reset(current); current = null; } };
  root.addEventListener('pointermove', move);
  root.addEventListener('pointerout', leave);
  cleanups.push(() => { root.removeEventListener('pointermove', move); root.removeEventListener('pointerout', leave); view.cancelAnimationFrame(frame); if (current) reset(current); });

  // ---- Background layers ------------------------------------------------------------
  const programs = {
    // Slowly drifting points of light; density and alpha follow --effect-intensity.
    field(ctx, w, h, t, seed, intensity) {
      const count = Math.round((w * h) / 9000 * intensity) + 8;
      for (let i = 0; i < count; i++) {
        const a = seed[i % seed.length], b = seed[(i * 7 + 3) % seed.length];
        const x = (a * w + Math.sin(t * .00018 + i) * 24 + w) % w;
        const y = (b * h + Math.cos(t * .00014 + i * 1.3) * 18 + h) % h;
        const r = 1 + ((a + b) % 1) * 2.2;
        ctx.globalAlpha = (.18 + .5 * ((Math.sin(t * .0007 + i * 2.1) + 1) / 2)) * intensity;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
    },
    // Layered sine lines across the bottom half.
    waveform(ctx, w, h, t, seed, intensity) {
      ctx.lineWidth = 1.5;
      for (let line = 0; line < 5; line++) {
        ctx.globalAlpha = (.06 + line * .04) * intensity;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const y = h * (.58 + line * .06) + Math.sin(x * .012 + t * .0009 * (1 + line * .25) + line) * (14 + line * 5) * Math.sin(x / w * Math.PI);
          if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
    },
  };
  const seed = Array.from({ length: 97 }, (_, i) => (Math.sin(i * 12.9898) * 43758.5453) % 1).map(v => Math.abs(v));
  for (const canvas of root.querySelectorAll('canvas.tg-effect-layer[data-tg-effect]')) {
    const program = programs[canvas.dataset.tgEffect];
    if (!program) continue;
    const ctx = canvas.getContext('2d');
    if (!ctx) { canvas.dataset.state = 'failed'; continue; }
    let w = 0, h = 0, visible = true, raf = 0;
    const intensity = () => Math.min(1, Math.max(0, Number.parseFloat(view.getComputedStyle(canvas).getPropertyValue('--effect-intensity')) || 1));
    const draw = time => {
      const color = view.getComputedStyle(canvas).color;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color; ctx.strokeStyle = color;
      program(ctx, w, h, time, seed, intensity());
    };
    const still = () => reducedMotion.matches || !finePointer.matches;
    const loop = time => { draw(time); raf = view.requestAnimationFrame(loop); };
    const update = () => {
      view.cancelAnimationFrame(raf); raf = 0;
      if (!w || !h) return;
      if (still()) { canvas.dataset.state = 'static'; draw(4000); return; }
      if (!visible || doc.hidden) { canvas.dataset.state = 'paused'; return; }
      canvas.dataset.state = 'running';
      raf = view.requestAnimationFrame(loop);
    };
    const resize = () => {
      const dpr = Math.min(2, view.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      update();
    };
    const resizer = new view.ResizeObserver(resize); resizer.observe(canvas);
    const seen = new view.IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }); seen.observe(canvas);
    const onVisibility = () => update();
    doc.addEventListener('visibilitychange', onVisibility);
    reducedMotion.addEventListener('change', update);
    cleanups.push(() => { view.cancelAnimationFrame(raf); resizer.disconnect(); seen.disconnect(); doc.removeEventListener('visibilitychange', onVisibility); reducedMotion.removeEventListener('change', update); });
  }

  // ---- Ripple between slides ----------------------------------------------------------
  for (const carousel of root.querySelectorAll('.tg-carousel[data-tg-effect="ripple"]')) {
    const canvas = carousel.querySelector(':scope > canvas.tg-effect-layer');
    const viewport = carousel.querySelector(':scope > .tg-carousel__viewport');
    const ctx = canvas?.getContext('2d');
    if (!ctx || !viewport) { if (canvas) canvas.dataset.state = 'static'; continue; }
    canvas.dataset.state = 'idle';
    const pickers = [...carousel.querySelectorAll('.tg-carousel__thumbs > button, .tg-pagination > .tg-dot')];
    const slides = [...viewport.children];
    let raf = 0, last = pickers.findIndex(p => p.getAttribute('aria-current') === 'true');
    const duration = () => (Number.parseFloat(view.getComputedStyle(carousel).getPropertyValue('--duration')) || 180) * 3;
    const play = index => {
      view.cancelAnimationFrame(raf);
      const image = slides[index]?.querySelector('img');
      if (!image?.complete || reducedMotion.matches || !finePointer.matches) { canvas.dataset.state = 'idle'; return; }
      const dpr = Math.min(2, view.devicePixelRatio || 1);
      const { width: w, height: h } = viewport.getBoundingClientRect();
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // object-fit: cover
      const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
      const sw = w / scale, sh = h / scale, sx = (image.naturalWidth - sw) / 2, sy = (image.naturalHeight - sh) / 2;
      const total = duration(), start = view.performance.now(), strip = 3;
      canvas.dataset.state = 'transitioning';
      const step = now => {
        const p = Math.min(1, (now - start) / total), amp = 10 * (1 - p) * (1 - p);
        ctx.clearRect(0, 0, w, h);
        ctx.globalAlpha = 1 - p * p;
        for (let y = 0; y < h; y += strip) {
          const dx = Math.sin(y * .06 - p * 14) * amp;
          ctx.drawImage(image, sx, sy + (y / h) * sh, sw, (strip / h) * sh, dx, y, w, strip);
        }
        if (p < 1) raf = view.requestAnimationFrame(step); else { canvas.dataset.state = 'idle'; ctx.clearRect(0, 0, w, h); }
      };
      raf = view.requestAnimationFrame(step);
    };
    const observer = new view.MutationObserver(() => {
      const index = pickers.findIndex(p => p.getAttribute('aria-current') === 'true');
      if (index !== last && index >= 0) { last = index; play(index); }
    });
    observer.observe(carousel, { subtree: true, attributes: true, attributeFilter: ['aria-current'] });
    cleanups.push(() => { observer.disconnect(); view.cancelAnimationFrame(raf); });
  }

  return () => cleanups.splice(0).forEach(cleanup => cleanup());
}
