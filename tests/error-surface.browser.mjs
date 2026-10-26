import assert from 'node:assert/strict';
import { compile } from 'sass';
import { chromium, webkit } from 'playwright';
const css = compile('src/index.scss').css;
const browser = await (process.argv.includes('--webkit') ? webkit : chromium).launch();
try {
  const page = await browser.newPage();
  for (const theme of ['light', 'dark', 'ios-dark']) {
    await page.setContent(`<html data-theme="${theme}"><style>${css}</style>
      <div class="tg-notice tg-notice--destructive tg-notice--with-icon" id="notice"><svg class="tg-notice__icon" aria-hidden="true"></svg><div class="tg-notice__content"><strong class="tg-notice__title">Upload failed</strong><div class="tg-text-sm tg-text-muted">Try again.</div></div></div>
      <section class="tg-error-summary" tabindex="-1" id="errors" aria-labelledby="errors-title"><svg class="tg-error-summary__icon" aria-hidden="true"></svg><div class="tg-error-summary__content"><h2 class="tg-error-summary__title" id="errors-title">Check your details</h2><ul><li><a href="#email">Enter your email</a></li></ul></div></section>
      <section class="tg-error-summary" id="plain"><h2 class="tg-error-summary__title">Check details</h2><ul><li><a href="#email">Email</a></li></ul></section>
      <label for="email">Email</label><input class="tg-input" id="email">`);
    const styles = await page.evaluate(() => {
      const properties = ['paddingTop','paddingRight','paddingBottom','paddingLeft','borderRadius','borderTopWidth','borderTopColor','backgroundColor','color'];
      const titleProperties = ['fontSize','fontWeight','lineHeight','marginTop','marginBottom','color'];
      const pick = (selector, props) => { const style = getComputedStyle(document.querySelector(selector)); return Object.fromEntries(props.map(key=>[key,style[key]])); };
      return { notice: pick('#notice', properties), error: pick('#errors', properties), noticeTitle: pick('.tg-notice__title',titleProperties), errorTitle: pick('#errors .tg-error-summary__title',titleProperties),
        noticeIcon:pick('.tg-notice__icon',['width','height','marginTop','color']),errorIcon:pick('.tg-error-summary__icon',['width','height','marginTop','color']), noticeDetail:pick('.tg-notice__content > :last-child',['fontSize','lineHeight','color']),errorDetail:pick('#errors a',['fontSize','lineHeight','color']), noticeLayout:pick('#notice',['display','gap','alignItems']),errorLayout:pick('#errors',['display','gap','alignItems']), plainDisplay:getComputedStyle(document.querySelector('#plain')).display };
    });
    assert.deepEqual(styles.errorDetail, styles.noticeDetail, `${theme}: detail typography parity`);
    assert.deepEqual(styles.error, styles.notice, `${theme}: shared surface`);
    assert.deepEqual(styles.errorTitle, styles.noticeTitle, `${theme}: title parity`);
    assert.deepEqual(styles.errorIcon, styles.noticeIcon, `${theme}: icon parity`);
    assert.deepEqual(styles.errorLayout, styles.noticeLayout, `${theme}: layout parity`);
    assert.equal(styles.plainDisplay, 'block');
    await page.locator('#errors').focus();
    // macOS WebKit follows the system preference that can omit links from Tab order.
    await page.locator('#errors a').focus();
    assert.equal(await page.locator('#errors a').evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#email').evaluate(el=>el===document.activeElement),true);
  }
  console.log('Shared error surface: notice/summary computed parity, optional icon, title, native keyboard error links across themes passed.');
} finally { await browser.close(); }
