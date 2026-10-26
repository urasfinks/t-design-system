import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
const css = await readFile('dist/t-design-system.css', 'utf8');
const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
const page = await browser.newPage();
try {
  await page.setContent(`<style>${css}</style>
    <div class="tg-row tg-nowrap" id="nowrap">No wrap</div><div class="tg-page-shell">
      <header class="tg-page-header"><div class="tg-container tg-container--reading tg-row"><a class="tg-brand tg-header__title" href="#">Discussion</a><span class="tg-ms-auto">Demo</span></div></header>
      <main class="tg-container tg-container--reading tg-page-content">
        <div class="tg-toolbar tg-toolbar--responsive"><h1 class="tg-header__title">Comments</h1><div class="tg-tabs tg-tabs--responsive"><button class="tg-tab">Best</button><button class="tg-tab">New</button></div></div>
        <article class="tg-comment"><span class="tg-avatar">AB</span><div class="tg-comment__body"><header class="tg-comment__meta tg-row"><span>Author</span></header><p class="tg-comment__text">${'longword'.repeat(40)}\nSecond line</p><div class="tg-comment__actions tg-row"><button class="tg-btn">Reply</button></div></div></article>
        <div class="tg-thread"><p>Nested reply</p></div>
        <figure class="tg-media"><img alt="Sample" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2000' height='2000'%3E%3C/svg%3E"></figure>
      </main>
      <footer class="tg-composer"><div class="tg-container tg-container--reading tg-composer__inner tg-col"><div class="tg-reply-preview"><div class="tg-grow"><p class="tg-truncate">${'preview '.repeat(100)}</p></div><button class="tg-icon-btn">×</button></div><form class="tg-composer__form"><span class="tg-avatar">AB</span><div class="tg-composer__input"><textarea class="tg-textarea tg-composer__textarea" rows="1" aria-label="Message"></textarea><button class="tg-icon-btn">↑</button></div></form><div class="tg-composer__caption">Hint</div></div></footer>
    </div><dialog class="tg-modal"><div class="tg-modal__sheet">Dialog</div></dialog>`);
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const state = await page.evaluate(() => {
      const style = selector => getComputedStyle(document.querySelector(selector));
      const box = selector => document.querySelector(selector).getBoundingClientRect();
      return { position: style('.tg-composer').position, bottom: box('.tg-composer').bottom,
        inputHeight: box('textarea').height, containerWidth: box('main').width,
        overflow: document.documentElement.scrollWidth > innerWidth,
        commentDisplay: style('.tg-comment').display,
        imageHeight: box('.tg-media img').height,
        contentPadding: parseFloat(style('main').paddingBottom), caption: style('.tg-composer__caption').display,
        whitespace: style('.tg-comment__text').whiteSpace };
    });
    assert.equal(await page.locator('#nowrap').evaluate(el => getComputedStyle(el).flexWrap), 'nowrap');
    assert.equal(state.position, 'fixed', 'composer remains fixed to viewport');
    assert.equal(state.bottom, 900);
    assert.ok(state.inputHeight >= 44 && state.inputHeight <= 48, 'single-line composer preserves TDS control height');
    assert.equal(state.containerWidth, Math.min(width, 768), 'reading container width');
    assert.equal(state.overflow, false, `no overflow at ${width}px`);
    assert.ok(await page.locator('.tg-reply-preview > button').evaluate(el => el.getBoundingClientRect().right <= innerWidth), 'long reply keeps cancel button on screen');
    assert.equal(state.commentDisplay, 'flex');
    assert.ok(state.imageHeight <= 495, 'media fits viewport');
    assert.equal(state.whitespace, 'pre-wrap');
    assert.ok(state.contentPadding >= 160, 'content reserves composer space');
    assert.equal(state.caption === 'none', width <= 576, 'responsive caption');
  }
  await page.locator('dialog').evaluate(el => el.showModal());
  assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).overflow), 'hidden');
  await page.locator('dialog').evaluate(el => el.close());
  await page.evaluate(() => document.documentElement.style.setProperty('--tg-keyboard-inset', '180px'));
  assert.equal(await page.locator('.tg-composer').evaluate(el => el.getBoundingClientRect().bottom), 720);
  await page.evaluate(() => document.documentElement.style.removeProperty('--tg-keyboard-inset'));
  await mkdir('artifacts/compositions', { recursive: true });
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.screenshot({ path: `artifacts/compositions/${theme}-${width}.png` });
    }
  }
  console.log('Composition checks passed at 320–1280px, keyboard inset, modal lock and all themes.');
} finally { await browser.close(); }
