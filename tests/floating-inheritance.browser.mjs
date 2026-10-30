import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({reducedMotion: 'reduce'});
  const css = await readFile('dist/t-design-system.css', 'utf8');
  const catalog = await readFile('docs/catalog.css', 'utf8');
  const labels = ['tg-menu__label', 'tg-sidebar__label', 'tg-nav-menu__title', 'tg-command__group-label'];
  const classes = ['tg-menu', 'tg-listbox', 'tg-hover-card', 'tg-tooltip', 'tg-modal', 'tg-modal tg-command', 'tg-modal catalog-search', 'tg-toast', 'tg-bottom-panel', 'tg-chart__tooltip', 'tg-nav-menu__panel', 'tg-selection-toolbar', 'tg-toolbar tg-toolbar--floating'];
  await page.setContent(`<style>${css}\n${catalog}</style><div style="--surface-bg: rgb(200, 0, 0)">${classes.map(c => `<${c.includes('modal') ? 'dialog open' : 'div'} class="${c}"></${c.includes('modal') ? 'dialog' : 'div'}>`).join('')}${labels.map((c, i) => `<div class="${['tg-menu', 'tg-sidebar', 'tg-nav-menu__panel', 'tg-command'][i]}"><div class="${c}">Section</div></div>`).join('')}<div class="tg-bottom-panel tg-bottom-panel--list"><div class="tg-list"><button class="tg-bottom-panel__trigger">Open</button></div></div></div>`);
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.evaluate(theme => {
      document.documentElement.dataset.theme = theme;
      for (const [key, value] of Object.entries({'--floating-bg': 'rgb(12, 34, 56)', '--floating-color': 'rgb(240, 241, 242)', '--floating-border': '3px solid rgb(60, 70, 80)', '--floating-shadow': 'none'})) document.documentElement.style.setProperty(key, value);
    }, theme);
    const labelStyles = await page.locator(labels.map(c => '.'+c).join(',')).evaluateAll(nodes => nodes.map(el => {
      const s = getComputedStyle(el); return [s.padding, s.fontSize, s.fontWeight, s.lineHeight, s.letterSpacing, s.color];
    }));
    for (const style of labelStyles) assert.deepEqual(style, labelStyles[0], `${theme}: canonical group label`);
    const listStyles = await page.locator('.tg-bottom-panel--list > .tg-list').evaluate(el => {
      const s = getComputedStyle(el); return [s.backgroundColor, s.color, s.borderTopWidth, s.boxShadow];
    });
    assert.deepEqual(listStyles, ['rgb(12, 34, 56)', 'rgb(240, 241, 242)', '3px', 'none'], `${theme}: visible list panel paint`);
    const listFill = listStyles[0];
    const triggerFill = await page.locator('.tg-bottom-panel--list .tg-bottom-panel__trigger').evaluate(el => getComputedStyle(el).backgroundColor);
    assert.equal(listFill, 'rgb(12, 34, 56)', `${theme}: list panel visible surface`);
    assert.equal(triggerFill, listFill, `${theme}: trigger matches visible list surface`);
    for (const name of classes) {
      const actual = await page.locator('.' + name.split(' ').join('.')).first().evaluate(el => {
        const s = getComputedStyle(el);
        return [s.backgroundColor, s.color, s.borderTopWidth, s.boxShadow, s.getPropertyValue('--ring-bg').trim()];
      });
      assert.equal(actual[4], 'rgb(12, 34, 56)', `${theme}: ${name} ring fill`);
      assert.deepEqual(actual.slice(0, 4), ['rgb(12, 34, 56)', 'rgb(240, 241, 242)', '3px', 'none'], `${theme}: ${name}`);
    }
  }
  console.log('Floating surface inheritance passes across three themes.');
} finally { await browser.close(); }
