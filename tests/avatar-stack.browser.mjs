import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';

const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
try {
  const page = await browser.newPage();
  const html = await readFile('docs/index.html', 'utf8');
  const stack = html.match(/<div class="avatar-stack"[^>]*>.*?<\/div>/s)?.[0];
  assert.ok(stack);
  const css = await readFile('dist/t-design-system.css', 'utf8');
  const catalog = await readFile('docs/catalog.css', 'utf8');
  await page.setContent(`<style>${css}\n${catalog}</style><div class="tg-card">${stack}</div>`);
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    for (const rootSize of [16, 32]) {
      await page.evaluate(size => document.documentElement.style.fontSize = `${size}px`, rootSize);
      for (const direction of ['ltr', 'rtl']) {
        await page.evaluate(dir => document.documentElement.dir = dir, direction);
        const avatars = await page.locator('.mini-avatar').evaluateAll(elements => elements.map(el => {
          const circle = el.getBoundingClientRect();
          const label = el.querySelector('.mini-avatar__label').getBoundingClientRect();
          const style = getComputedStyle(el);
          return { width: circle.width, height: circle.height, border: parseFloat(style.borderTopWidth), x: circle.x,
            dx: label.x + label.width / 2 - circle.x - circle.width / 2,
            dy: label.y + label.height / 2 - circle.y - circle.height / 2 };
        }));
        for (const avatar of avatars) {
          assert.equal(avatar.width, rootSize * 2.25);
          assert.equal(avatar.height, avatar.width);
          assert.equal(avatar.border, rootSize * .1875);
          assert.ok(Math.abs(avatar.dx) <= .5 && Math.abs(avatar.dy) <= .5, `${theme}/${direction}: label off-center ${JSON.stringify(avatar)}`);
        }
        assert.equal(Math.abs(avatars[1].x - avatars[0].x), rootSize * 1.75);
      }
    }
  }
  console.log('Avatar stack: wider separators, centered labels, RTL and 200% text passed in all themes.');
} finally { await browser.close(); }
