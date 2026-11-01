import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';

const css = await readFile(process.env.AVATAR_TEST_CSS || 'dist/t-design-system.css', 'utf8');
const engine = process.argv.includes('--webkit') ? 'webkit' : 'chromium';
const browser = await ({ chromium, webkit }[engine]).launch();
try {
  const page = await browser.newPage({ viewport: { width: 320, height: 700 } });
  await mkdir('artifacts/avatar-group', { recursive: true });
  for (const theme of ['light', 'dark', 'ios-dark']) {
    for (const size of [32, 44, 64]) {
      await page.setContent(`<html data-theme="${theme}" lang="ru"><style>${css}</style><main style="padding:24px">${['+4', '+105988'].map(count => `<p><span role="group" class="tg-avatar-group" aria-label="Проголосовали" style="--icon-avatar:${size}px"><span class="tg-avatar"><span class="tg-avatar__initials">АК</span></span><span class="tg-avatar"><span class="tg-avatar__initials">М</span></span><span class="tg-avatar"><span class="tg-avatar__initials">ДЛ</span></span><span class="tg-avatar tg-avatar-group__more" title="Ещё участников: ${count.slice(1)}">${count}</span></span></p>`).join('')}</main></html>`);
      for (const counter of await page.locator('.tg-avatar-group__more').all()) {
        const geometry = await counter.evaluate(el => {
          const range = document.createRange();
          range.selectNodeContents(el);
          const text = range.getBoundingClientRect(), box = el.getBoundingClientRect();
          const avatar = el.previousElementSibling.getBoundingClientRect();
          const group = el.parentElement.getBoundingClientRect();
          const style = getComputedStyle(el);
          return { textLeft: text.left, textRight: text.right, left: box.left, right: box.right, height: box.height, width: box.width, avatarWidth: avatar.width, avatarHeight: avatar.height, groupRight: group.right, padding: parseFloat(style.paddingInlineStart) };
        });
        assert.ok(geometry.textLeft >= geometry.left + geometry.padding - .5 && geometry.textRight <= geometry.right - geometry.padding + .5, `${theme}/${size}: counter text fits inside its surface: ${JSON.stringify(geometry)}`);
        assert.equal(geometry.height, geometry.avatarHeight, 'counter preserves avatar height');
        assert.ok(geometry.width >= geometry.avatarWidth, 'short counter stays at least avatar wide');
        assert.ok(geometry.right <= geometry.groupRight + .5, 'group includes the complete counter');
      }
      if (size === 32) await page.screenshot({ path: `artifacts/avatar-group/${engine}-${theme}.png` });
    }
  }
  console.log(`${engine}: avatar counters fit in 3 themes at 3 inherited sizes`);
} finally { await browser.close(); }
