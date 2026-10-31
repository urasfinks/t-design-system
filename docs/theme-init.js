// Parser-blocking bootstrap, loaded before CSS: the first UI frame uses its real theme.
(() => {
  const root = document.documentElement;
  let parentRoot;
  try {
    if (window.parent !== window && window.parent.location.origin === location.origin) {
      parentRoot = window.parent.document.documentElement;
    }
  } catch { /* A cross-origin frame uses its own preference. */ }

  let value;
  if (parentRoot) {
    value = parentRoot.dataset.theme;
    if (parentRoot.dataset.platform) root.dataset.platform = parentRoot.dataset.platform;
    for (const name of ['--button-color', '--button-text-color', '--link-color', '--accent-text-color']) {
      const color = parentRoot.style.getPropertyValue(name);
      if (color) root.style.setProperty(name, color);
    }
  } else {
    try { value = localStorage.getItem('tds-theme'); } catch { /* CSS still follows the system. */ }
  }

  if (['light', 'dark', 'ios-dark'].includes(value)) root.dataset.theme = value;
  else delete root.dataset.theme;

  // Native surfaces also use the right scheme while the stylesheet is being fetched.
  const scheme = document.querySelector('meta[name="color-scheme"]');
  if (scheme) scheme.content = value === 'light' ? 'light' : ['dark', 'ios-dark'].includes(value) ? 'dark' : 'light dark';
})();
