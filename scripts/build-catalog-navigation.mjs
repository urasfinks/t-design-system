import { readFile, writeFile } from 'node:fs/promises';
import { catalogEntries, renderCatalogNavigation } from '../docs/catalog-structure.js';

export async function buildCatalogNavigation() {
  const path = new URL('../docs/index.html', import.meta.url);
  const html = await readFile(path, 'utf8');
  const navigation = renderCatalogNavigation(catalogEntries(html));
  let result = html;
  for (const [name, markup] of Object.entries(navigation)) {
    result = result.replace(new RegExp(`<!-- catalog-${name}:start -->[\\s\\S]*?<!-- catalog-${name}:end -->`), `<!-- catalog-${name}:start -->\n${markup}\n<!-- catalog-${name}:end -->`);
  }
  if (result !== html) await writeFile(path, result);
}
