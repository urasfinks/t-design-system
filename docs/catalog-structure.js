// Explicit section metadata is the single source for both generated navigation surfaces.
// Read only marked section/heading start tags: example HTML and code samples are excluded.
const decode = value => value.replace(/&(?:amp|quot|lt|gt|#39);/g, entity => ({ '&amp;': '&', '&quot;': '"', '&lt;': '<', '&gt;': '>', '&#39;': "'" }[entity]));
const escape = value => String(value).replace(/[&"<>']/g, char => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;', "'": '&#39;' }[char]));

export function catalogEntries(html) {
  return [...html.matchAll(/<(?:section|h3)\b[^>]*\bdata-catalog-title="[^"]*"[^>]*>/g)].map(([tag]) => {
    const attributes = Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key, decode(value)]));
    return { id: attributes.id, title: attributes['data-catalog-title'], group: attributes['data-catalog-group'], parent: attributes['data-catalog-parent'] || '' };
  });
}

export function renderCatalogNavigation(entries) {
  const groups = [...new Set(entries.map(entry => entry.group))];
  const link = entry => `<a href="#${escape(entry.id)}" class="nav-link"><span>${escape(entry.title)}</span></a>`;
  const sidebar = '<nav aria-label="Разделы компонентов">\n' + groups.map((group, index) => {
    const families = entries.filter(entry => entry.group === group && !entry.parent);
    return `  <div class="nav-group" role="group" aria-labelledby="nav-group-${index + 1}"><span class="nav-group-label" id="nav-group-${index + 1}">${escape(group)}</span>\n` + families.map(family => {
      const children = entries.filter(entry => entry.parent === family.id);
      return children.length ? `    <div class="catalog-nav-family">${link(family)}<details><summary>Варианты</summary>\n${children.map(child => `      ${link(child)}`).join('\n')}\n    </details></div>` : `    ${link(family)}`;
    }).join('\n') + '\n  </div>';
  }).join('\n') + '\n</nav>';
  const mobile = '<select class="tg-select" id="section-select" aria-label="Раздел каталога">\n' + groups.map(group =>
    `  <optgroup label="${escape(group)}">\n` + entries.filter(entry => entry.group === group).map(entry => {
      const parent = entries.find(candidate => candidate.id === entry.parent);
      return `    <option value="${escape(entry.id)}">${escape(parent ? `${parent.title} / ${entry.title}` : entry.title)}</option>`;
    }).join('\n') + '\n  </optgroup>'
  ).join('\n') + '\n</select>';
  return { sidebar, mobile };
}
