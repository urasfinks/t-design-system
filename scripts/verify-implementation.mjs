// Shows how far the component implementation plan has got and where to resume.
// For every in-scope spec marked done it checks: its public classes are in the built CSS,
// the catalog has an example with data-spec naming it, and a test mentions its ID.
// Exit code 0 only when every in-scope spec is done and verified.
import { readFileSync, readdirSync } from 'node:fs';

export function verify({ root = '.' } = {}) {
  const read = path => readFileSync(`${root}/${path}`, 'utf8');
  const { specs } = JSON.parse(read('references/21st-dev-1000/implementation.json'));
  const css = read('dist/t-design-system.css');
  const catalog = read('docs/index.html');
  const tests = readdirSync(`${root}/tests`).filter(file => file.endsWith('.mjs')).map(file => read(`tests/${file}`)).join('\n');
  const examples = new Set([...catalog.matchAll(/data-spec="([^"]+)"/g)].flatMap(match => match[1].split(/\s+/)));
  const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hasSelector = selector => selector.startsWith('[') || selector.includes('[')
    ? css.includes(selector)
    : new RegExp(`${escape(selector)}(?![\\w-])`).test(css);
  const mentioned = id => new RegExp(`(?<![\\w])${id}(?![\\w])`).test(tests);

  const inScope = specs.filter(spec => spec.scope === 'in');
  const problems = [];
  for (const spec of inScope.filter(spec => spec.state === 'done')) {
    const missing = spec.classes.filter(selector => !hasSelector(selector));
    if (missing.length) problems.push(`${spec.id}: classes missing in dist CSS: ${missing.join(' ')}`);
    if (!examples.has(spec.id)) problems.push(`${spec.id}: no catalog example with data-spec`);
    if (!mentioned(spec.id)) problems.push(`${spec.id}: no test mentions the spec ID`);
  }
  const order = ['P0', 0, 1, 2, 3, 4, 5, 6, 7, 8];
  const waves = order.map(wave => {
    const list = inScope.filter(spec => spec.wave === wave);
    return { wave, done: list.filter(spec => spec.state === 'done').length, total: list.length, todo: list.filter(spec => spec.state !== 'done').map(spec => spec.id) };
  });
  const next = order.flatMap(wave => inScope.filter(spec => spec.wave === wave && spec.state !== 'done'))[0];
  const done = inScope.filter(spec => spec.state === 'done').length;
  return { total: inScope.length, done, waves, next, problems, outOfScope: specs.length - inScope.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = verify();
  console.log(`In scope: ${result.done}/${result.total} done (${result.outOfScope} compositions and landing sections are documentation only)`);
  for (const { wave, done, total, todo } of result.waves) {
    console.log(`  wave ${String(wave).padEnd(2)} ${done}/${total}${todo.length ? `  todo: ${todo.join(' ')}` : ''}`);
  }
  if (result.next) console.log(`Next: ${result.next.id} ${result.next.name} (wave ${result.next.wave}, ${result.next.folder})`);
  for (const problem of result.problems) console.log(`PROBLEM ${problem}`);
  process.exit(result.problems.length || result.done < result.total ? 1 : 0);
}
