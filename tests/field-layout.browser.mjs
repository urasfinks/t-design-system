import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
try {
  const page = await browser.newPage();
  const css = await readFile('dist/t-design-system.css', 'utf8');
  await page.setContent(`<style>${css} .fixture { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;width:560px; }</style><div class="fixture"><div class="tg-field"><label class="tg-label" for="name">Имя</label><input class="tg-input" id="name" placeholder="Как к вам обращаться?"><p class="tg-help">Будет видно участникам.</p></div><div class="tg-field"><label class="tg-label" for="email">Электронная почта</label><input class="tg-input" id="email" type="email" aria-invalid="true" value="mail@"><p class="tg-help tg-help--error">Укажите адрес целиком, например name@mail.ru. Адрес нужен для отправки письма.</p></div></div>`);
  for (const theme of ['light','dark','ios-dark']) for (const size of [16,32]) {
    await page.evaluate(({theme,size}) => { document.documentElement.dataset.theme=theme;document.documentElement.style.fontSize=`${size}px`; },{theme,size});
    const measure = () => page.locator('input').evaluateAll(els => els.map(el=>({top:el.getBoundingClientRect().top,height:el.getBoundingClientRect().height})));
    const before = await measure();
    assert.ok(Math.abs(before[0].top-before[1].top)<.5,`${theme}/${size}: controls align at their top ${JSON.stringify(before)}`);
    assert.ok(Math.abs(before[0].height-before[1].height)<.5,`${theme}/${size}: help does not stretch controls ${JSON.stringify(before)}`);
    await page.locator('.tg-help--error').evaluate(el=>el.textContent+=' Ещё одна длинная подсказка, которая переносится на несколько строк.');
    const after = await measure();
    assert.deepEqual(after,before,`${theme}/${size}: changing help never moves or resizes fields`);
  }
  console.log('Field layout: aligned controls, equal height and stable geometry with changing multiline help, three themes and 200% text passed.');
} finally { await browser.close(); }
