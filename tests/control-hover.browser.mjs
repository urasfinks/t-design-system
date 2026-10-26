import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
const css = await readFile('dist/t-design-system.css', 'utf8');
const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, reducedMotion: 'reduce' });
  const variants = [
    ['primary', '<button class="tg-btn tg-btn--primary">Primary</button>'],
    ['secondary', '<button class="tg-btn tg-btn--secondary">Secondary</button>'],
    ['ghost', '<button class="tg-btn tg-btn--ghost">Ghost</button>'],
    ['destructive', '<button class="tg-btn tg-btn--destructive">Delete</button>'],
    ['button-link', '<a class="tg-btn tg-btn--primary" href="#test">Button link</a>'],
    ['icon-link', '<a class="tg-icon-btn" href="#test" aria-label="Link">+</a>'],
    ['icon', '<button class="tg-icon-btn">+</button>'],
    ['icon-ghost', '<button class="tg-icon-btn tg-icon-btn--ghost">×</button>'],
    ['clear', '<button class="tg-icon-btn tg-search__clear">×</button>'],
    ['chip', '<button class="tg-chip" aria-checked="false">Chip</button>'],
    ['chip-selected', '<button class="tg-chip" aria-checked="true">Selected chip</button>'],
    ['tab', '<button class="tg-tab" aria-selected="false">Tab</button>'],
    ['tab-selected', '<button class="tg-tab" aria-selected="true">Selected tab</button>'],
    ['navigation', '<a class="tg-tabbar__item" href="#test">Navigation</a>'],
    ['navigation-selected', '<a class="tg-tabbar__item" aria-current="page" href="#test">Current page</a>'],
    ['pagination', '<button class="tg-dot" aria-current="page" aria-label="Page"></button>'],
    ['avatar', '<button class="tg-avatar"><span class="tg-avatar__initials">AB</span></button>'],
    ['badge', '<button class="tg-badge tg-badge--primary">Badge</button>'],
    ['switch', '<button class="tg-switch" role="switch" aria-checked="false"><span class="tg-switch__knob"></span></button>'],
    ['disclosure', '<details><summary class="tg-disclosure__trigger">Disclosure</summary></details>'],
    ['orders', '<details class="tg-list"><summary class="tg-list-item tg-row tg-bottom-panel__trigger">Orders</summary></details>'],
    ['stacked', '<button class="tg-btn tg-btn--stacked" aria-pressed="true">Stacked</button>'],
  ];
  const inspect = el => { const s = getComputedStyle(el); return { background: s.backgroundColor, color: s.color, filter: s.filter, border: s.borderTopWidth, width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height }; };
  let checks = 0;
  await mkdir('artifacts/hover', { recursive: true });
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.setContent(`<html data-theme="${theme}"><style>${css}</style><main style="padding:32px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:24px">${variants.map(([id, html]) => `<div id="${id}">${html}</div>`).join('')}<span class="tg-avatar" id="static-avatar"><span class="tg-avatar__initials">AB</span></span></main>`);
    for (const [id] of variants) {
      const control = page.locator(`#${id} > :first-child`).filter({ visible: true });
      const target = await control.evaluate(el => el.matches('details') ? 'summary' : null);
      const button = target ? control.locator(target) : control;
      await page.mouse.move(0, 0);
      const idle = await button.evaluate(inspect);
      await button.hover();
      const hover = await button.evaluate(inspect);
      if (id === 'switch') {
        assert.deepEqual(hover, idle, `${theme}: switch has no button hover effect`);
        checks++;
        continue;
      }
      assert.notDeepEqual([hover.background, hover.color, hover.filter], [idle.background, idle.color, idle.filter], `${theme}/${id}: visible hover response`);
      if (['primary', 'secondary', 'destructive', 'icon', 'chip', 'chip-selected', 'tab-selected', 'navigation-selected', 'badge', 'stacked'].includes(id)) {
        assert.equal(hover.background, idle.background, `${theme}/${id}: semantic fill and selected state remain intact`);
      }
      assert.equal(hover.filter, id === 'clear' ? 'none' : `brightness(${theme === 'light' ? '0.92' : '1.15'})`, `${theme}/${id}: shared hover mechanism`);
      assert.deepEqual([hover.width, hover.height, hover.border], [idle.width, idle.height, idle.border], `${id}: stable geometry`);
      if (id === 'clear') {
        assert.equal(idle.border, '0px');
        assert.equal(idle.background, 'rgba(0, 0, 0, 0)');
        assert.equal(hover.background, idle.background, 'clear hover changes icon only');
        assert.notEqual(idle.color, hover.color, 'clear icon becomes more readable on hover');
      }
      checks++;
    }
    await page.locator('#clear > button').hover();
    await page.screenshot({ path: `artifacts/hover/${theme}.png` });
    for (const [id, html] of variants.filter(([, html]) => html.startsWith('<button'))) {
      for (const disabled of ['disabled', 'aria-disabled="true"', 'ancestor']) {
        const markup = disabled === 'ancestor' ? `<div aria-disabled="true">${html}</div>` : html.replace('<button ', `<button ${disabled} `);
        await page.setContent(`<html data-theme="${theme}"><style>${css}</style><div style="padding:32px">${markup}</div>`);
        const button = page.locator('button');
        await page.mouse.move(0, 0);
        const idle = await button.evaluate(inspect);
        await button.hover({ force: true });
        assert.deepEqual(await button.evaluate(inspect), idle, `${theme}/${id}/${disabled}: no hover response`);
        checks++;
      }
    }
  }
  console.log(`${checks} hover checks passed: 22 control variants, 3 themes, native/ARIA/ancestor disabled, clear button and geometry.`);
} finally { await browser.close(); }
