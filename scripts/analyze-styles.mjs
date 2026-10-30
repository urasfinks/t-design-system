import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';

// Analyze actual catalog markup, not synthetic elements stripped of their context.
// No scripts run: hover/focus transitions are outside this static-state report.
const pages = ['docs/index.html', 'docs/bottom-panel.html', 'docs/compositions.html', 'docs/workspace.html', 'docs/icon-browser.html'];
const output = 'artifacts/style-analysis';
const groups = {
  paint: ['background-color', 'background-image', 'color', 'border-top-color', 'border-top-style', 'border-top-width', 'box-shadow'],
  geometry: ['display', 'position', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'gap', 'border-top-left-radius', 'border-top-right-radius', 'min-height', 'min-width', 'max-width', 'max-height', 'flex-direction', 'align-items', 'justify-content'],
  typography: ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-align'],
};
const numericDistance = (a, b) => {
  if (a === b) return 0;
  // Only compare matching units and syntax; auto/none and layout modes stay categorical.
  const number = /-?(?:\d*\.)?\d+/g;
  if (a.replace(number, '#') !== b.replace(number, '#')) return 1;
  const x = a.match(number)?.map(Number), y = b.match(number)?.map(Number);
  if (!x?.length || x.length !== y?.length) return 1;
  return Math.max(...x.map((v, i) => {
    const delta = Math.abs(v - y[i]);
    if (delta <= 2 && a.includes('px')) return delta / 12;
    return Math.min(1, delta / Math.max(4, Math.abs(v), Math.abs(y[i])));
  }));
};
const properties = [...new Set(Object.values(groups).flat())];
const strip = html => html.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<link\b[^>]*>/gi, '').replace(/<iframe\b[\s\S]*?<\/iframe>/gi, '');
const old = path => execFileSync('git', ['show', `HEAD:${path}`], {encoding: 'utf8', maxBuffer: 20 * 1024 * 1024});
const browser = await chromium.launch();
await mkdir(output, {recursive: true});
try {
  const runs = {};
  for (const revision of ['before', 'after']) {
    const read = revision === 'before' ? async path => old(path) : async path => readFile(path, 'utf8');
    const [css, catalog] = await Promise.all(['dist/t-design-system.css', 'docs/catalog.css'].map(read));
    const page = await browser.newPage({reducedMotion: 'reduce'});
    const samples = [];
    const allDeclared = new Set(), allRepresented = new Set();
    for (const sourcePage of pages) {
    const html = await read(sourcePage);
    const localStyles = [...html.matchAll(/<link\b[^>]*href=["']([^"']+\.css)["'][^>]*>/g)].map(m => m[1]).filter(path => !path.includes('/') && path !== 'catalog.css');
    const extra = (await Promise.all(localStyles.map(path => read('docs/'+path)))).join('\n');
    await page.setContent(`<style>${css}\n${catalog}\n${extra}\n*,*::before,*::after{animation:none;transition:none}</style>${strip(html)}`);
    for (const width of [390, 1440]) {
      await page.setViewportSize({width, height: 1000});
      for (const theme of ['light', 'dark', 'ios-dark']) {
        await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
        samples.push(...await page.evaluate(({properties, theme, width, sourcePage}) => {
          return [...document.querySelectorAll('[class]')].filter(el => [...el.classList].some(c => c.startsWith('tg-'))).map((el, index) => {
            const style = getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return {
              index, theme, width, sourcePage, tag: el.tagName.toLowerCase(), classes: [...el.classList].filter(c => c.startsWith('tg-')).sort(),
              section: el.closest('section[id]')?.id ?? null, id: el.id || null,
              state: {disabled: el.matches(':disabled,[aria-disabled="true"]') || !!el.closest('[aria-disabled="true"],[inert]'), selected: el.matches('[aria-selected="true"],[aria-pressed="true"],[aria-checked="true"],:checked'), readonly: el.matches('[readonly]'), invalid: el.matches('[aria-invalid="true"]'), current: el.getAttribute('aria-current'), expanded: el.getAttribute('aria-expanded'), busy: el.getAttribute('aria-busy'), open: el.matches('[open],:popover-open'), hidden: !el.getClientRects().length},
              box: {width: rect.width, height: rect.height},
              styles: Object.fromEntries(properties.map(p => [p, style.getPropertyValue(p).trim()])),
            };
          });
        }, {properties, theme, width, sourcePage}));
      }
    }
    // Report selectors with no catalog element rather than claiming complete coverage.
    const pageCoverage = await page.evaluate(() => {
      const declared = new Set();
      const visit = rules => { for (const rule of rules) { if (rule.selectorText) for (const match of rule.selectorText.matchAll(/\.(tg-[\w-]+)/g)) declared.add(match[1]); if (rule.cssRules) visit(rule.cssRules); } };
      for (const sheet of document.styleSheets) visit(sheet.cssRules);
      const represented = new Set([...document.querySelectorAll('[class]')].flatMap(el => [...el.classList]));
      return {declared: [...declared], represented: [...represented]};
    });
    pageCoverage.declared.forEach(c => allDeclared.add(c));
    pageCoverage.represented.forEach(c => allRepresented.add(c));
    }
    const coverage = {declaredClasses: allDeclared.size, representedClasses: [...allDeclared].filter(c => allRepresented.has(c)).length, missing: [...allDeclared].filter(c => !allRepresented.has(c)).sort()};
    // Cluster class signatures by their whole six-context style vector. Separate
    // states: a disabled button must not define the normal-state family.
    const profiles = new Map();
    for (const sample of samples) {
      const key = JSON.stringify([sample.tag, sample.classes, sample.state.disabled, sample.state.selected, sample.state.readonly, sample.state.invalid, sample.state.current, sample.state.expanded, sample.state.busy, sample.state.open]);
      if (!profiles.has(key)) profiles.set(key, {key, label: sample.classes.join('.'), samples: new Map(), variants: new Map()});
      const profile = profiles.get(key);
      const context = `${sample.theme}/${sample.width}`;
      if (!profile.variants.has(context)) profile.variants.set(context, new Set());
      profile.variants.get(context).add(JSON.stringify(sample.styles));
      if (!profile.samples.has(context)) profile.samples.set(context, sample);
    }
    const clusters = {};
    const dimensions = {...groups, combined: properties};
    for (const [family, props] of Object.entries(dimensions)) {
      const distance = (a, b) => {
        if (JSON.stringify(JSON.parse(a.key).slice(2)) !== JSON.stringify(JSON.parse(b.key).slice(2))) return 1;
        let unequal = 0, total = 0;
        for (const [context, x] of a.samples) {
          const y = b.samples.get(context); if (!y) continue;
          if (['geometry', 'combined'].includes(family) && ['display', 'position', 'flex-direction'].some(p => x.styles[p] !== y.styles[p])) return 1;
          for (const p of props) { total++; unequal += numericDistance(x.styles[p], y.styles[p]); }
        }
        return total ? unequal / total : 1;
      };
      const buckets = [];
      // Complete-link clustering prevents chains of only loosely related styles.
      for (const profile of [...profiles.values()].sort((a,b) => a.label.localeCompare(b.label))) {
        const bucket = buckets.find(items => items.every(other => distance(profile, other) <= .16));
        if (bucket) bucket.push(profile); else buckets.push([profile]);
      }
      clusters[family] = buckets.filter(items => items.length > 1).sort((a,b) => b.length-a.length).map(items => ({members: items.map(p => ({classes: p.label, disabled: JSON.parse(p.key)[2], selected: JSON.parse(p.key)[3]})), maxDistance: Math.max(...items.flatMap((a,i) => items.slice(i+1).map(b => distance(a,b))))}));
    }
    const contextConflicts = [...profiles.values()].filter(p => [...p.variants.values()].some(v => v.size > 1)).map(p => ({classes:p.label, maxVariants:Math.max(...[...p.variants.values()].map(v => v.size))})).sort((a,b) => b.maxVariants-a.maxVariants);
    runs[revision] = {contextConflicts, coverage, sampleCount: samples.length, profileCount: profiles.size, clusters};
    await writeFile(`${output}/${revision}-computed.json`, JSON.stringify({revision, commit: execFileSync('git', ['rev-parse', 'HEAD'], {encoding:'utf8'}).trim(), pages, properties, samples}, null, 2));
    await page.close();
  }
  await writeFile(`${output}/clusters.json`, JSON.stringify({method: 'complete-link; numeric approximation + categorical mismatch <= 16%; disabled, selected, readonly, invalid, current, expanded, busy and open states separated; six theme/viewport contexts; first instance per class/state/context; <=2px differences have small cost', groups, runs}, null, 2));
  let report = '# Computed component style analysis\n\nBefore: Git HEAD. After: current build. All five documentation pages. Browser: Chromium. Themes: light, dark, ios-dark. Widths: 390, 1440.\n\n';
  report += 'Clustering uses complete-link distance <=16%, separates interactive states (disabled, selected, readonly, invalid, current, expanded, busy, open), and discounts numeric differences up to 2px. Categorical layout differences remain full mismatches. This is an approximation, not automatic source rewriting.\n\nOnly markup already represented in the catalog is measured. Hidden elements retain computed CSS but their box sizes are not meaningful. Hover, focus, pseudo-elements, dynamically generated content and interaction transitions require separate tests. Class signatures may occur in different contexts; raw samples preserve every instance, clustering uses the first per context. Similarity is evidence for review, not permission to merge unrelated semantic roles.\n\n';
  for (const [revision, run] of Object.entries(runs)) {
    report += `## ${revision}\n\n${run.sampleCount} samples; ${run.profileCount} class/state profiles; ${run.coverage.representedClasses}/${run.coverage.declaredClasses} declared classes represented.\n\n`;
    for (const [family, clusters] of Object.entries(run.clusters)) {
      report += `### ${family}\n\n`;
      for (const cluster of clusters.slice(0, 15)) report += `- ${cluster.members.length} profiles, max mismatch ${(cluster.maxDistance*100).toFixed(1)}%: ${cluster.members.map(m => '`.'+m.classes+'`'+(m.disabled ? ' [disabled]' : '')+(m.selected ? ' [selected]' : '')).join(', ')}\n`;
      report += '\n';
    }
    report += `Profiles with multiple styles in the same theme/viewport context: ${run.contextConflicts.length}. Inspect raw samples before consolidating these; their first sample is not their complete contract.\n\n`;
    report += `Missing classes: ${run.coverage.missing.map(c => '`.'+c+'`').join(', ')}\n\n`;
  }
  await writeFile(`${output}/report.md`, report);
  console.log(JSON.stringify(Object.fromEntries(Object.entries(runs).map(([k,v]) => [k,{samples:v.sampleCount,profiles:v.profileCount,coverage:v.coverage.representedClasses+'/'+v.coverage.declaredClasses,clusters:Object.fromEntries(Object.entries(v.clusters).map(([k,v])=>[k,v.length]))}]))));
} finally { await browser.close(); }
