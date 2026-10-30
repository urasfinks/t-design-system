// Wave 8 — decorative effects: SH1 background layer, B19 button effects, C18 card effects, G2 3D carousels, SH4 ripple.
// Runs with motion allowed and a fine pointer; a second page checks reduced motion.
import { openCatalog } from './helpers/catalog-page.mjs';
import { measureContrast } from './helpers/contrast.mjs';

const { page, browser, check, css, px, box, theme, rtl, close } = await openCatalog({ port: 4208, reducedMotion: 'no-preference' });
const ex = id => `.example-body[data-spec~="${id}"]`;
const contrast = async (selector, label) => {
  for (const name of ['light', 'dark', 'ios-dark']) {
    await theme(name);
    const { ratio } = await page.evaluate(measureContrast, { selector });
    check(`${label} ${name}: contrast ${ratio.toFixed(2)} ≥ 4.5`, ratio >= 4.5);
  }
  await theme(null);
};
const opacity = (selector, pseudo = '::before') => css(selector, 'opacity', pseudo).then(Number);
try {
  // SH1 — background layer
  const field = `${ex('SH1')} canvas[data-tg-effect="field"]`;
  check('SH1 the layer is hidden from assistive tech and sits behind the content', await page.locator(field).getAttribute('aria-hidden') === 'true' && await css(field, 'z-index') === '-1' && await css(field, 'pointer-events') === 'none');
  await page.locator(field).scrollIntoViewIfNeeded();
  await page.waitForFunction(s => document.querySelector(s).dataset.state === 'running', field, { timeout: 3000 }).catch(() => {});
  check('SH1 the module runs the program on screen', await page.locator(field).getAttribute('data-state') === 'running');
  check('SH1 the layer draws pixels in the accent', await page.locator(field).evaluate(c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4) if (d[i]) return true; return false; }));
  await page.locator('#start').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  check('SH1 off screen the layer pauses', await page.locator(field).getAttribute('data-state') === 'paused');
  check('SH1 without the module the fill is the background role', (await css(field, 'background-color')) !== 'rgba(0, 0, 0, 0)');
  await contrast(`${ex('SH1')} .effect-stage--accent p`, 'SH1 text over the waveform section');

  // B19 — button effects
  check('B19 a disabled button has no effect layer', await css(`${ex('B19')} button.tg-effect-sheen`, 'display', '::after') === 'none');
  const sheen = `${ex('B19')} a.tg-effect-sheen`;
  check('B19 the sheen rests outside the button', (await css(sheen, 'transform', '::after')).includes('matrix(1, 0, 0, 1, -'));
  await page.locator(sheen).hover();
  await page.waitForTimeout(800);
  check('B19 hover sweeps the sheen across', !(await css(sheen, 'transform', '::after')).includes(', -'));
  const beam = `${ex('B19')} .tg-effect-border-beam`;
  check('B19 the border beam draws only a frame', (await css(beam, 'mask-composite', '::before')).includes('exclude') && await css(beam, 'animation-name', '::before') === 'tg-effect-turn');
  const magnet = page.locator(`${ex('B19')} .tg-effect-magnetic`);
  await magnet.scrollIntoViewIfNeeded();
  const mb = await magnet.boundingBox();
  await page.mouse.move(mb.x + mb.width * .75, mb.y + mb.height * .75, { steps: 4 });
  await page.waitForTimeout(80);
  const offset = await magnet.evaluate(el => [parseFloat(el.style.getPropertyValue('--magnet-x')), parseFloat(el.style.getPropertyValue('--magnet-y'))]);
  check('B19 the magnet pulls at most 4px towards the pointer', offset[0] > 0 && offset[0] <= 4 && offset[1] > 0 && offset[1] <= 4, String(offset) + ' ' + await magnet.getAttribute('style') + ' ' + JSON.stringify(mb) + ' ' + await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches));
  await page.mouse.move(5, 5);
  await page.waitForTimeout(80);
  check('B19 leaving resets the magnet', await magnet.evaluate(el => el.style.getPropertyValue('--magnet-x')) === '');

  // C18 — card effects
  const tilt = page.locator(`${ex('C18')} .tg-effect-tilt`);
  await tilt.scrollIntoViewIfNeeded();
  const tb = await tilt.boundingBox();
  await page.mouse.move(tb.x + tb.width * .9, tb.y + tb.height * .5, { steps: 4 });
  await page.waitForTimeout(80);
  const ty = await tilt.evaluate(el => parseFloat(el.style.getPropertyValue('--tilt-y')));
  check('C18 tilt leans towards the pointer at most 6°', ty > 0 && ty <= 6, String(ty));
  const spot = `${ex('C18')} .tg-effect-spotlight`;
  const sb = await box(spot);
  await page.mouse.move(sb.x + 40, sb.y + 30, { steps: 4 });
  await page.waitForTimeout(300);
  check('C18 the spotlight follows the pointer', await page.locator(spot).evaluate(el => el.style.getPropertyValue('--pointer-x')) === '40px' && await opacity(spot) > 0);
  check('C18 the spotlight layer is under the text', await css(spot, 'z-index', '::before') === '-1');
  await page.mouse.move(5, 5);
  await contrast(`${ex('C18')} .tg-effect-spotlight p`, 'C18 card text');

  // G2 — 3D carousels: the slide stays flat (it is the snap target); its picture turns.
  const g2 = '#demo-g2 .tg-carousel__slide > img';
  const slide = '#demo-g2 .tg-carousel__slide';
  check('G2 pictures are driven by their slide\'s view timeline', (await css(g2, 'animation-timeline')).includes('--tg-carousel-slide') && await css(g2, 'animation-name') === 'tg-carousel-coverflow');
  check('G2 the slide itself is not transformed', ['none', ''].includes(await css(slide, 'transform')));
  const centreOffset = i => page.locator('#demo-g2 .tg-carousel__viewport').evaluate((vp, i) => { const s = vp.children[i], r = vp.getBoundingClientRect(), b = s.getBoundingClientRect(); return b.left + b.width / 2 - (r.left + r.width / 2); }, i);
  check('G2 the first slide starts exactly in the centre', Math.abs(await centreOffset(0)) < 1);
  const flatness = i => page.locator(g2).nth(i).evaluate(el => el.getBoundingClientRect().width / el.offsetWidth);
  check('G2 the centred picture is flat', await flatness(0) > .97);
  check('G2 a neighbour picture is turned', await flatness(1) < .9);
  check('G2 only the centred slide shows its caption', Number(await css('#demo-g2 .tg-carousel__slide:nth-child(1) > figcaption', 'opacity')) > .9 && Number(await css('#demo-g2 .tg-carousel__slide:nth-child(2) > figcaption', 'opacity')) < .1);
  await page.locator(`${ex('G2')} input[value="fan"]`).check();
  check('G2 the variant switch swaps the timeline animation', await css(g2, 'animation-name') === 'tg-carousel-fan');
  await page.locator('#demo-g2 [data-carousel-next]').click();
  await page.waitForTimeout(900);
  check('G2 arrows work as in G1', await page.locator('#demo-g2 .tg-dot').nth(1).getAttribute('aria-current') === 'true');
  check('G2 the next slide lands exactly in the centre', Math.abs(await centreOffset(1)) < 1);
  check('G2 focus order is the DOM order', await page.locator('#demo-g2 .tg-carousel__viewport').getAttribute('tabindex') === '0');
  await page.setViewportSize({ width: 390, height: 900 });
  check('G2 on phones it is the flat G1', await css(g2, 'animation-name') === 'none');
  await page.setViewportSize({ width: 1440, height: 900 });

  // SH4 — ripple
  const ripple = `${ex('SH4')} .tg-carousel`;
  const layer = page.locator(`${ripple} > canvas.tg-effect-layer`);
  check('SH4 the canvas covers the viewport only', Math.abs((await box(`${ripple} > canvas`)).height - (await box(`${ripple} .tg-carousel__viewport`)).height) < 1);
  await page.locator(`${ripple} [data-carousel-next]`).click();
  await page.waitForTimeout(60);
  check('SH4 a slide change plays the ripple', await layer.getAttribute('data-state') === 'transitioning');
  check('SH4 the accessible slide changes at once', await page.locator(`${ripple} .tg-dot`).nth(1).getAttribute('aria-current') === 'true');
  await page.waitForTimeout(800);
  check('SH4 the ripple ends within three durations', await layer.getAttribute('data-state') === 'idle');

  // RTL
  await rtl(true);
  check('RTL: the 3D carousel turns the other way', await page.locator('#demo-g2').evaluate(el => getComputedStyle(el).getPropertyValue('--carousel-flow').trim()) === '-1');
  await rtl(false);

  // Reduced motion and touch
  const still = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await still.goto(page.url());
  await still.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  const stillCss = (s, p, ps = null) => still.locator(s).first().evaluate((el, [p, ps]) => getComputedStyle(el, ps).getPropertyValue(p), [p, ps]);
  await still.locator(field).scrollIntoViewIfNeeded();
  await still.waitForTimeout(200);
  check('reduced motion: the background layer is a still frame', await still.locator(field).getAttribute('data-state') === 'static');
  check('reduced motion: the border beam stands still', await stillCss(beam, 'animation-name', '::before') === 'none');
  check('reduced motion: the 3D carousel is flat', await stillCss(g2, 'animation-name') === 'none');
  await still.locator(`${ripple} [data-carousel-next]`).click();
  await still.waitForTimeout(60);
  check('reduced motion: no ripple', await still.locator(`${ripple} > canvas`).getAttribute('data-state') === 'idle');
  await still.close();

  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const id of ['SH1', 'B19', 'C18', 'G2', 'SH4']) {
      const over = await page.locator(ex(id)).evaluate(el => el.scrollWidth - el.clientWidth);
      check(`${id} at ${width}px has no horizontal overflow`, over <= 1, String(over));
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
} finally {
  console.log(`${await close()} wave 8 checks passed`);
}
