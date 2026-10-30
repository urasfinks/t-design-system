import test from 'node:test';
import assert from 'node:assert/strict';
import {initGestures} from '../docs/catalog-components.js';

test('an early first Enter asks for confirmation and a distinct second Enter confirms', t => {
  let now = 100;
  t.mock.method(performance, 'now', () => now);
  const previousFrame = globalThis.requestAnimationFrame;
  const previousCancel = globalThis.cancelAnimationFrame;
  globalThis.requestAnimationFrame = callback => { callback(now); return 1; };
  globalThis.cancelAnimationFrame = () => {};
  t.mock.method(globalThis, 'setTimeout', () => 1);
  try {
    const handlers = new Map();
    const status = {textContent: ''};
    const label = {textContent: 'Удалить удержанием'};
    const button = {dataset: {}, style: {setProperty() {}}, querySelector: () => label, addEventListener: (name, listener) => handlers.set(name, listener)};
    initGestures({root: {getElementById: () => status, querySelectorAll: selector => selector === '[data-hold]' ? [button] : []}});
    const enter = () => handlers.get('keydown')({key: 'Enter', preventDefault() {}});
    enter();
    assert.equal(button.dataset.state, undefined);
    assert.match(status.textContent, /ещё раз/);
    now = 200;
    enter();
    assert.equal(button.dataset.state, 'confirmed');
  } finally {
    if (previousFrame === undefined) delete globalThis.requestAnimationFrame; else globalThis.requestAnimationFrame = previousFrame;
    if (previousCancel === undefined) delete globalThis.cancelAnimationFrame; else globalThis.cancelAnimationFrame = previousCancel;
  }
});
