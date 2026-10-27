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
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        sectionSelect.value = entry.target.id;
        for (const link of links) {
          const active = link.hash === `#${entry.target.id}`;
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        }
      }
    }, { rootMargin: '-100px 0px -60% 0px', threshold: 0 });
    for (const section of sections) observer.observe(section);
  }

  return { navigate, sync };
}
