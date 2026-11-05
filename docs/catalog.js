import '../dist/ui.js';
import { initCatalogEffects } from './catalog-effects.js';
import './icon-browser.js';
import { initDemoNavigation } from './demo-navigation.js';
import { initCatalogNavigation } from './catalog-navigation.js';
import { initCatalogDemos } from './catalog-demos.js';
import { initDemoCode } from './demo-code.js';
import { initCatalogSearch } from './catalog-search.js';
import { initCatalogComponents } from './catalog-components.js';

initDemoNavigation();
// Freeze copyable source before demo behavior enhances native fallbacks and ARIA.
initDemoCode();
initCatalogDemos();
initCatalogComponents();
initCatalogEffects();
const navigation = initCatalogNavigation();
initCatalogSearch({ navigate: navigation.navigate });
