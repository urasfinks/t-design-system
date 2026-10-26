import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
const original = path => execFileSync('git', ['show', `678b61e:${path}`], { encoding: 'utf8' });
const baseline = original('dist/t-design-system.css') + original('docs/catalog.css');
const restored = await readFile('dist/t-design-system.css', 'utf8') + await readFile('docs/catalog.css', 'utf8');
// Exercise the entire original catalog against both stylesheets, without scripts/network.
const html = original('docs/index.html').replace(/<script\b[\s\S]*?<\/script>/g, '').replace(/<link\b[^>]*>/g, '').replace(/<iframe\b[\s\S]*?<\/iframe>/g, '').replace(/<use\b[^>]*><\/use>/g, '');
const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await page.setContent(html);
  await page.addStyleTag({ content: baseline });
  const sheet = page.locator('style').last();
  const properties = ['display','color','backgroundColor','border','borderRadius','padding','margin','width','height','font','gap','boxShadow','transform','opacity'];
  const snapshot = () => page.locator('[data-ui], [data-ui] *').evaluateAll((nodes, properties) => nodes.map(node => {
    const s = getComputedStyle(node);
    return Object.fromEntries(properties.map(property => [property, s[property]]));
  }), properties);
  await mkdir('artifacts/baseline', { recursive: true });
  let checks = 0;
  for (const theme of ['light', 'dark', 'ios-dark']) {
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const accent of ['', '#18745b', '#7151c7']) {
        await page.evaluate(({ theme, accent }) => {
          document.documentElement.dataset.theme = theme;
          if (accent) document.documentElement.style.setProperty('--button-color', accent);
          else document.documentElement.style.removeProperty('--button-color');
        }, { theme, accent });
        await sheet.evaluate((el, css) => el.textContent = css, baseline);
        const expected = await snapshot();
        const before = await page.locator('.hero').screenshot();
        await sheet.evaluate((el, css) => el.textContent = css, restored);
        assert.deepEqual(await snapshot(), expected, `${theme}/${width}/${accent}: original component styles`);
        assert.deepEqual(await page.locator('.hero').screenshot(), before, `${theme}/${width}/${accent}: original hero pixels`);
        checks++;
        if (!accent) await page.screenshot({ path: `artifacts/baseline/${theme}-${width}.png` });
      }
    }
  }
  console.log(`${checks} baseline comparisons passed: original component styles and hero pixels, 3 themes × 3 widths × 3 accents.`);
} finally { await browser.close(); }
