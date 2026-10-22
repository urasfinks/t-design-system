/**
 * Optional Telegram theme synchronization. Colors stay in CSS, as in the source
 * application's light/desktopDark/iosDark palettes. Returns an unsubscribe function.
 */
export function initTelegramTheme(tg, {
  root = globalThis.document?.documentElement,
  userAgent = globalThis.navigator?.userAgent ?? '',
} = {}) {
  if (!tg) return () => {};
  if (!root) throw new TypeError('initTelegramTheme requires a document root');
  function apply() {
    const hasTheme = tg.themeParams && Object.keys(tg.themeParams).length > 0;
    const isIOS = tg.platform === 'ios' || /iPad|iPhone|iPod/.test(userAgent);
    root.dataset.platform = isIOS ? 'ios' : 'desktop';
    root.dataset.theme = hasTheme && tg.colorScheme === 'dark'
      ? (isIOS ? 'ios-dark' : 'dark')
      : 'light';
    root.style.setProperty('--tg-ios-h', hasTheme && isIOS ? '0.8rem' : '0rem');
  }
  tg.onEvent?.('themeChanged', apply);
  tg.ready?.();
  apply();
  return () => tg.offEvent?.('themeChanged', apply);
}
