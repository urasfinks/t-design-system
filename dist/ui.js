import { initRipple } from './effects.js';

/** Initialize TDS interactions in a document or subtree. Returns cleanup. */
export function initUI(root = globalThis.document) {
  return initRipple(root);
}

// Delegation also covers controls inserted after this module loads.
if (globalThis.document?.addEventListener) initUI(globalThis.document);
