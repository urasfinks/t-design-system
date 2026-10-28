// Every button in the catalog is one control height on every width and theme, and its
// text stays inside it. Stacked choice tiles (.tg-btn--stacked) are tiles, not buttons.
import assert from 'node:assert/strict';
import { openCatalog } from './helpers/catalog-page.mjs';

const { page, check, theme, close } = await openCatalog({ port: 4209 });
try {
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const name of ['light', 'dark', 'ios-dark']) {
      await theme(name);
      const report = await page.evaluate(() => {
        const probe = document.createElement('div'); probe.style.blockSize = 'var(--control-h)'; document.body.append(probe);
        const control = probe.getBoundingClientRect().height; probe.remove();
        const off = [], spill = [];
        for (const el of document.querySelectorAll('main :is(.tg-btn, .tg-icon-btn, .tg-chip, .tg-fab):not(.tg-btn--stacked)')) {
          if (!el.checkVisibility()) continue;
          const box = el.getBoundingClientRect(), name = `${el.className} "${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 30)}"`;
          if (Math.abs(box.height - control) > .6) off.push(`${name} ${box.height.toFixed(1)}px`);
          // Text nodes only: effect layers and hidden inputs may extend past the edge on purpose.
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            if (!node.textContent.trim() || node.parentElement.closest('[aria-hidden="true"], .tg-sr-only')) continue;
            const range = document.createRange(); range.selectNodeContents(node);
            for (const r of range.getClientRects()) if (r.width && (r.right > box.right + .5 || r.left < box.left - .5)) { spill.push(name); break; }
          }
          for (const part of el.querySelectorAll('.tg-btn__label, .tg-btn__subtext')) if (part.scrollWidth > part.clientWidth + 1) spill.push(`${name} (cut by ellipsis)`);
        }
        return { control, off, spill: [...new Set(spill)] };
      });
      check(`${width}px ${name}: every button is ${report.control.toFixed(1)}px tall`, report.off.length === 0, report.off.join('; '));
      check(`${width}px ${name}: button text stays inside the button`, report.spill.length === 0, report.spill.join('; '));
    }
  }
  await theme(null);
  await page.setViewportSize({ width: 1440, height: 900 });
} finally {
  console.log(`${await close()} button height checks passed`);
}
