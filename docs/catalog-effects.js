import { initEffects } from '../dist/effects.js';

// Optional effects do not need canvas contexts, observers or motion listeners
// until their section approaches the viewport. Core controls initialize eagerly.
export function initCatalogEffects({ root = document } = {}) {
  const sections = [...root.querySelectorAll('main > .catalog-cluster > section, main > section')]
    .filter(section => section.querySelector('[data-tg-effect], .tg-effect-tilt, .tg-effect-spotlight, .tg-effect-magnetic'));
  const pending = new Set(sections);
  const cleanups = [];
  const activate = section => {
    if (!pending.delete(section)) return;
    cleanups.push(initEffects(section));
    observer?.unobserve(section);
  };
  const observer = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) activate(entry.target);
    }, { rootMargin: '400px' }) : null;
  for (const section of sections) {
    if (observer) observer.observe(section); else activate(section);
  }
  // Capture runs before the example's action handlers: a deep link or fast
  // keyboard/pointer activation must never miss the first effect interaction.
  const interact = event => {
    const section = event.target.closest?.('section');
    for (const candidate of pending) if (candidate === section || candidate.contains(event.target)) activate(candidate);
  };
  for (const type of ['pointerover', 'pointerdown', 'focusin']) root.addEventListener(type, interact, true);
  return () => {
    observer?.disconnect();
    for (const type of ['pointerover', 'pointerdown', 'focusin']) root.removeEventListener(type, interact, true);
    for (const cleanup of cleanups) cleanup();
  };
}
