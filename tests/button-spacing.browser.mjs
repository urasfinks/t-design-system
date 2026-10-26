import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';

const css = await readFile('dist/t-design-system.css', 'utf8');
const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
try {
  const page = await browser.newPage();
  let checks = 0;
  for (const theme of ['light', 'dark', 'ios-dark']) {
    for (const fontSize of [16, 32]) {
      for (const width of [48, 60, 140, 260]) {
        for (const tag of ['button', 'a']) {
          await page.setContent(`<html data-theme="${theme}" style="font-size:${fontSize}px"><style>${css}</style><div style="width:${width}px"><${tag} class="tg-btn tg-btn--secondary" href="#test"><svg class="tg-icon" viewBox="0 0 24 24" aria-hidden="true"></svg>Скопировать разметку</${tag}></div>`);
          const metrics = await page.locator('.tg-btn').evaluate(el => {
            const box = el.getBoundingClientRect();
            const icon = el.querySelector('svg').getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(el.lastChild);
            const text = range.getBoundingClientRect();
            const style = getComputedStyle(el);
            return {
              left: icon.left - box.left,
              right: box.right - text.right,
              top: text.top - box.top,
              bottom: box.bottom - text.bottom,
              inlinePadding: parseFloat(style.paddingInlineStart),
            };
          });
          const label = `${theme}/${fontSize}px/${width}px/${tag}`;
          assert.ok(metrics.left >= metrics.inlinePadding, `${label}: icon keeps left inset: ${JSON.stringify(metrics)}`);
          assert.ok(metrics.right >= metrics.inlinePadding, `${label}: label keeps right inset: ${JSON.stringify(metrics)}`);
          assert.ok(metrics.top >= 8 && metrics.bottom >= 8, `${label}: wrapped text stays inside button: ${JSON.stringify(metrics)}`);
          checks++;
        }
      }
    }
  }
  console.log(`${checks} button spacing checks passed: narrow containers, wrapped labels, links, three themes and 200% text.`);
} finally { await browser.close(); }
