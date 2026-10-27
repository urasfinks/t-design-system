import '../dist/ui.js';
import './icon-browser.js';
import { initCatalogNavigation } from './catalog-navigation.js';
import { initCatalogDemos } from './catalog-demos.js';
import { initDemoCode } from './demo-code.js';
import { initCatalogSearch } from './catalog-search.js';

initCatalogDemos();
initDemoCode();
const navigation = initCatalogNavigation();
initCatalogSearch({ navigate: navigation.navigate });
