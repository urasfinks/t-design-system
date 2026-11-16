import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';

const engine = process.argv.includes('--webkit') ? 'webkit' : 'chromium';
const css = await readFile('dist/t-design-system.css', 'utf8');
const browser = await (engine === 'webkit' ? webkit : chromium).launch();
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  const actions = ['12', '3', 'Ответить', 'Изображения', 'Ссылки', 'Ответы'].map((label, index) =>
    `<button type="button" class="tg-btn tg-btn--ghost"${index < 2 ? ' aria-pressed="false"' : ''}><span class="tg-btn__label">${label}</span></button>`).join('');
  const comment = id => `<article class="tg-comment"><span class="tg-avatar">А</span><div class="tg-comment__body"><p class="tg-comment__text">Обсуждение публикации</p><div class="tg-comment__actions"><div id="${id}" class="tg-comment__action-grid" role="group" aria-label="Действия с комментарием">${actions}</div><time datetime="2026-11-16">Сегодня</time></div></div></article>`;
  await page.setContent(`<style>${css}</style><main style="width: 560px">${comment('wide')}<div class="tg-thread" style="max-width: 350px">${comment('nested')}</div></main><article class="tg-comment"><div class="tg-comment__body"><p id="legacy-text" class="tg-comment__text">Обычный ряд</p><div class="tg-comment__actions tg-row"><button class="tg-btn tg-btn--ghost" id="legacy-action">Ответить</button></div></div></article>`);
  const near = (a, b) => Math.abs(a - b) < 1;
  assert.ok(await page.locator('#legacy-action').evaluate(button => {
    const range = document.createRange();
    range.selectNodeContents(button);
    return Math.abs(range.getBoundingClientRect().left - document.querySelector('#legacy-text').getBoundingClientRect().left) < 1;
  }), 'ordinary row still aligns its first ghost label with the comment text');
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    for (const [id, columns] of [['wide', 4], ['nested', 2]]) {
      const state = await page.locator('#' + id).evaluate(grid => {
        const box = grid.getBoundingClientRect();
        const style = getComputedStyle(grid);
        return {
          left: box.left, right: box.right,
          tracks: style.gridTemplateColumns.split(' ').map(parseFloat),
          gap: parseFloat(style.columnGap),
          buttons: [...grid.children].map(el => {
            const button = el.getBoundingClientRect();
            return { left: button.left, right: button.right, top: button.top, width: button.width, height: button.height,
              margin: getComputedStyle(el).marginInlineStart };
          })
        };
      });
      assert.equal(state.tracks.length, columns, `${theme}/${id}: expected column count`);
      assert.ok(state.tracks.every(track => near(track, state.tracks[0])), 'cells have equal width');
      for (const [index, button] of state.buttons.entries()) {
        const center = state.left + (index % columns) * (state.tracks[0] + state.gap) + state.tracks[0] / 2;
        assert.ok(near((button.left + button.right) / 2, center), `${theme}/${id}/${index}: centered in its cell`);
        assert.ok(button.width >= 44 && button.height >= 44, 'retains button target');
        assert.equal(button.margin, '0px', 'no first-action optical offset in a grid');
        assert.ok(button.left >= state.left - 1 && button.right <= state.right + 1, 'action stays in group');
      }
      assert.ok(state.buttons[columns].top > state.buttons[0].top, 'next row starts after preset column count');
    }
    await mkdir('artifacts/comment-actions', { recursive: true });
    await page.locator('main').screenshot({ path: `artifacts/comment-actions/${engine}-${theme}.png` });
  }
  console.log('Comment action grid: equal centered cells, two/four columns in nested/wide groups, 44px targets and all themes.');
} finally { await browser.close(); }
