import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';

const modulePath = new URL('../dist/telegram.js', import.meta.url);
async function loadBridge() {
  await assert.doesNotReject(access(modulePath), 'build must ship the optional Telegram theme bridge');
  return import(modulePath.href);
}
function fixture({ scheme = 'dark', platform = 'tdesktop', params = { bg_color: '#abcdef' } } = {}) {
  const root = { dataset: {}, style: { values: {}, setProperty(key, value) { this.values[key] = value; } } };
  const listeners = new Map();
  const tg = { colorScheme: scheme, platform, themeParams: params,
    onEvent(event, callback) { listeners.set(event, callback); },
    offEvent(event, callback) { assert.equal(listeners.get(event), callback); listeners.delete(event); },
    ready() {} };
  return { root, tg, listeners };
}
test('bridge uses the source project dark/platform selection and responds to themeChanged', async () => {
  const { initTelegramTheme } = await loadBridge();
  const { root, tg, listeners } = fixture();
  const dispose = initTelegramTheme(tg, { root, userAgent: '' });
  assert.equal(root.dataset.theme, 'dark');
  assert.equal(root.dataset.platform, 'desktop');
  tg.platform = 'ios'; listeners.get('themeChanged')();
  assert.equal(root.dataset.theme, 'ios-dark');
  assert.equal(root.style.values['--tg-ios-h'], '0.8rem');
  tg.colorScheme = 'light'; listeners.get('themeChanged')();
  assert.equal(root.dataset.theme, 'light');
  dispose(); assert.equal(listeners.size, 0);
});
test('bridge handles not-ready SDK and iOS browser detection without changing palettes', async () => {
  const { initTelegramTheme } = await loadBridge();
  const { root, tg, listeners } = fixture({ params: {} });
  initTelegramTheme(tg, { root, userAgent: 'iPhone' });
  assert.equal(root.dataset.theme, 'light');
  tg.themeParams = { bg_color: '#abcdef' }; listeners.get('themeChanged')();
  assert.equal(root.dataset.theme, 'ios-dark');
  assert.deepEqual(Object.keys(root.style.values), ['--tg-ios-h']);
});
test('bridge without Telegram leaves standalone theme selection intact', async () => {
  const { initTelegramTheme } = await loadBridge();
  const root = { dataset: { theme: 'ios-dark' } };
  const dispose = initTelegramTheme(undefined, { root });
  assert.equal(root.dataset.theme, 'ios-dark');
  assert.equal(typeof dispose, 'function');
  dispose();
});

test('background sync is automatic and macOS sends the latest palette after startup', async () => {
  const { initTelegramTheme } = await loadBridge();
  const { root, tg, listeners } = fixture({ scheme: 'light' });
  const sent = [];
  tg.setBackgroundColor = color => sent.push(color);
  root.ownerDocument = { defaultView: {
    getComputedStyle: element => ({
      getPropertyValue: name => {
        assert.equal(name, '--bg-body');
        return element.dataset.theme === 'dark' ? '#131720' : '#f5f5f5';
      },
    }),
  } };

  tg.platform = 'macos';
  const stop = initTelegramTheme(tg, { root });
  tg.colorScheme = 'dark';
  listeners.get('themeChanged')();
  assert.deepEqual(sent, []);
  await new Promise(resolve => setTimeout(resolve, 250));
  assert.deepEqual(sent, ['#131720']);

  tg.colorScheme = 'light';
  listeners.get('themeChanged')();
  stop();
  await new Promise(resolve => setTimeout(resolve, 250));
  assert.deepEqual(sent, ['#131720']);
  assert.equal(listeners.size, 0);

  tg.platform = 'tdesktop';
  const stopDesktop = initTelegramTheme(tg, { root });
  assert.deepEqual(sent, ['#131720', '#f5f5f5']);
  stopDesktop();
});

test('iOS sends the page background to both native surfaces on launch and theme changes', async () => {
  const { initTelegramTheme } = await loadBridge();
  const { root, tg, listeners } = fixture({ platform: 'ios' });
  const headers = [];
  const backgrounds = [];
  root.ownerDocument = { defaultView: {
    getComputedStyle: element => ({
      getPropertyValue: () => element.dataset.theme === 'ios-dark' ? '#000000' : '#ffffff',
    }),
  } };
  tg.setHeaderColor = color => headers.push(color);
  tg.setBackgroundColor = color => backgrounds.push(color);
  tg.isVersionAtLeast = () => true;
  const stop = initTelegramTheme(tg, { root });
  tg.colorScheme = 'light';
  listeners.get('themeChanged')();
  assert.deepEqual(headers, ['#000000', '#ffffff']);
  assert.deepEqual(backgrounds, headers);
  stop();
});

test('the native header stays untouched on desktop and older iOS SDKs use a supported color key', async () => {
  const { initTelegramTheme } = await loadBridge();
  const { root, tg, listeners } = fixture();
  const headers = [];
  root.ownerDocument = { defaultView: {
    getComputedStyle: () => ({ getPropertyValue: () => '#000000' }),
  } };
  tg.setHeaderColor = color => headers.push(color);
  tg.setBackgroundColor = () => {};
  tg.isVersionAtLeast = () => false;
  const stop = initTelegramTheme(tg, { root });
  assert.deepEqual(headers, []);
  tg.platform = 'ios';
  listeners.get('themeChanged')();
  assert.deepEqual(headers, ['bg_color']);
  stop();
});
