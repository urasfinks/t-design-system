import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read = path => readFile(new URL('../'+path, import.meta.url), 'utf8');

test('the main entry has no late patch module and base owns common control states', async () => {
  const entry = await read('src/index.scss');
  assert.doesNotMatch(entry, /@use 'components\/(?:extensions|control-hover)'/);
  assert.match(await read('src/base/_index.scss'), /@use '\.\.\/components\/control-states'/);
  const extensions = await read('src/components/_extensions.scss');
  assert.doesNotMatch(extensions, /@layer|\.(?:tg-)|--[\w-]+\s*:/);
});
test('buttons declare shared state parameters instead of repeated hover paint and transitions', async () => {
  const buttons = await read('src/components/_buttons.scss');
  assert.doesNotMatch(buttons, /:hover|transition\s*:/);
  assert.match(buttons, /background:\s*var\(--control-idle-bg\)/);
  assert.match(buttons, /--control-idle-bg:\s*var\(--action-bg\)/);
  assert.match(buttons, /--control-idle-bg:\s*var\(--action-danger-bg\)/);
});

test('the legacy control-hover entry retains reset, focus and visibility foundations', async () => {
  const {compileString} = await import('sass');
  const {css} = compileString('@use "components/control-hover";', {loadPaths:['src']});
  assert.match(css, /:where\(body\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /\[hidden\]/);
  assert.match(css, /aria-disabled/);
});

test('new components plug into shared tokens and the state engine instead of local paint', async () => {
  const menu = await read('src/components/_menu.scss');
  assert.match(menu, /@include option\.dropdown-row/);
  assert.match(await read('src/components/_option.scss'), /--control-paint-duration:\s*0s/);
  assert.match(menu, /@include option\.mark/);
  assert.match(await read('src/components/_option.scss'), /var\(--icon-mask-check\)/);
  assert.doesNotMatch(menu, /#[0-9a-f]{3,8}\b|rgba?\(/i);
  const patterns = await read('src/components/_patterns.scss');
  const forms = await read('src/components/_forms.scss');
  // Search and input group share one field surface definition.
  assert.match(patterns, /field-surface\.surface\('\.tg-search__input'\)/);
  assert.match(forms, /field-surface\.surface\('\.tg-input-group__control'\)/);
  const states = await read('src/components/_control-states.scss');
  for (const link of ['a.tg-menu__item[href]', 'a.tg-pager__link[href]', 'a.tg-site-nav__link[href]']) assert.ok(states.includes(link), link);
  const base = await read('src/base/_index.scss');
  for (const name of ['.tg-pager__link', '.tg-site-nav__link', '.tg-table__sort']) assert.ok(base.includes(name), name);
});

test('shared engines own surfaces, rows, selection and steps; owners only include them', async () => {
  const engines = ['floating', 'option', 'selected', 'steps', 'track'];
  for (const name of engines) {
    const source = await read(`src/components/_${name}.scss`);
    // Engines are mixin libraries: they never emit rules or layers on their own.
    assert.doesNotMatch(source, /@layer/, `${name} emits no layer`);
    assert.doesNotMatch(source, /#[0-9a-f]{3,8}\b|rgba?\(|color-mix/i, `${name} uses palette roles only`);
  }
  const menu = await read('src/components/_menu.scss');
  assert.match(menu, /@include floating\.popover/);
  // Every dropdown is one look: the list, its rows and the chosen row come from the option engine.
  const option = await read('src/components/_option.scss');
  assert.match(option, /@mixin list[\s\S]*@include floating\.surface/);
  assert.match(option, /@mixin chosen \{\s*@include selected\.segment-current/);
  const owners = { menu, pickers: await read('src/components/_pickers.scss'), 'app-nav': await read('src/components/_app-nav.scss') };
  for (const [name, source] of Object.entries(owners)) {
    assert.match(source, /@include option\.list/, `${name} uses the dropdown list`);
    assert.match(source, /@include option\.dropdown-row/, `${name} uses the dropdown row`);
    assert.match(source, /@include option\.chosen/, `${name} uses the chosen row`);
    assert.doesNotMatch(source, /--control-paint-duration|@include floating\.surface/, `${name} does not repeat the dropdown look`);
  }
  const overlays = await read('src/components/_overlays.scss');
  assert.match(overlays, /\.tg-tooltip\[popover\] \{\s*@include floating\.popover/);
  const navigation = await read('src/components/_navigation.scss');
  // Tabs and the segmented control share one trough, segment and current-segment rule.
  assert.ok((navigation.match(/@include selected\.track/g) || []).length >= 2);
  assert.ok((navigation.match(/@include selected\.segment-current/g) || []).length >= 2);
  const buttons = await read('src/components/_buttons.scss');
  assert.match(buttons, /@include selected\.soft/);
  assert.match(buttons, /@include selected\.filled/);
});


test('floating paint has one owner and no component replaces its global roles', async () => {
  const {readdir} = await import('node:fs/promises');
  for (const file of await readdir(new URL('../src/components/', import.meta.url))) {
    const source = await read(`src/components/${file}`);
    assert.doesNotMatch(source, /--floating-(?:bg|color|border|shadow)\s*:/, file);
    assert.doesNotMatch(source, /!important/, file);
  }
  const option = await read('src/components/_option.scss');
  assert.doesNotMatch(option, /--surface-bg\s*:/);
  const catalog = await read('docs/catalog.css');
  const search = catalog.match(/dialog\.catalog-search \{([^}]+)\}/)[1];
  assert.doesNotMatch(search, /(?:background|box-shadow|border|color)\s*:/);
  assert.match(await read('docs/index.html'), /class="tg-modal catalog-search"/);
});


test('approximate metadata footer cluster has a canonical owner', async () => {
  for (const name of ['editor', 'overlays']) {
    assert.match(await read(`src/components/_${name}.scss`), /@include panel-parts\.meta-footer/);
  }
  const parts = await read('src/components/_panel-parts.scss');
  assert.match(parts, /border-block-start: var\(--border-transparent\)/);
  assert.doesNotMatch(parts, /@layer|!important/);
});

test('menu, navigation and command section labels share one canonical label', async () => {
  for (const name of ['menu', 'app-nav', 'overlays']) {
    assert.match(await read(`src/components/_${name}.scss`), /@include option\.group-label/);
  }
});
