export function initCatalogNavigation({ root = document } = {}) {
  const links = [...root.querySelectorAll('.nav-link')];
  const sectionSelect = root.querySelector('#section-select');
  const sections = [...root.querySelectorAll('main > section')];

  function navigate(id, { focus = false } = {}) {
    const section = root.getElementById(id);
    if (!section) return;
    location.hash = id;
    section.scrollIntoView({ behavior: 'instant', block: 'start' });
    sectionSelect.value = id;
    if (focus) {
      if (!section.hasAttribute('tabindex')) section.tabIndex = -1;
      section.focus({ preventScroll: true });
    }
  }

  function sync() {
    const id = location.hash.slice(1);
    if ([...sectionSelect.options].some(option => option.value === id)) sectionSelect.value = id;
    for (const link of links) {
      const active = link.hash === `#${id}`;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }

  sectionSelect.addEventListener('change', () => navigate(sectionSelect.value));
  for (const link of links) {
    link.addEventListener('click', event => {
      event.preventDefault();
      navigate(link.hash.slice(1));
    });
  }
  // Late content (the icon gallery) grows the page after the browser has already
  // scrolled to a deep link. Keep the target aligned until layout settles or the
  // reader takes over scrolling.
  function holdInitialHash() {
    const section = location.hash.length > 1 && root.getElementById(location.hash.slice(1));
    if (!section || !('ResizeObserver' in window)) return;
    const align = () => section.scrollIntoView({ behavior: 'instant', block: 'start' });
    const observer = new ResizeObserver(align);
    const release = () => {
      observer.disconnect();
      for (const type of releaseEvents) removeEventListener(type, release, { capture: true });
    };
    const releaseEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown', 'hashchange'];
    for (const type of releaseEvents) addEventListener(type, release, { capture: true, passive: true });
    observer.observe(root.body);
    setTimeout(release, 4000);
  }

  sync();
  holdInitialHash();
  addEventListener('hashchange', sync);
  // Observer batches describe intersection changes, not the current viewport order.
  // A full-page capture or resize can leave an old section active at scrollY=0.
  // Derive the active section from current geometry on scroll and resize instead.
  let frame = 0;
  function updateVisibleSection() {
    frame = 0;
    const section = sections.findLast(section => section.getBoundingClientRect().top <= 100) || sections[0];
    if (!section) return;
    sectionSelect.value = section.id;
    for (const link of links) {
      const active = link.hash === `#${section.id}`;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }
  function scheduleVisibleSection() {
    if (!frame) frame = requestAnimationFrame(updateVisibleSection);
  }
  addEventListener('scroll', scheduleVisibleSection, { passive: true });
  addEventListener('resize', scheduleVisibleSection);
  scheduleVisibleSection();

  return { navigate, sync };
}
