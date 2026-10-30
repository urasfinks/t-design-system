import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { verify } from '../scripts/verify-implementation.mjs';

const { specs } = JSON.parse(readFileSync('references/21st-dev-1000/implementation.json', 'utf8'));

test('the registry lists every spec heading of the 17 reference folders', () => {
  const folders = readdirSync('references/21st-dev-1000/images', {withFileTypes: true}).filter(entry => entry.isDirectory()).map(entry => entry.name);
  const ids = folders.flatMap(folder => [...readFileSync(`references/21st-dev-1000/images/${folder}/components.md`, 'utf8').matchAll(/^### ([A-Z]+\d+)\. /gm)].map(match => match[1]));
  assert.equal(ids.length, 192);
  assert.deepEqual(specs.map(spec => spec.id).sort(), ids.sort());
});

test('107 component specs are in scope; compositions and landing sections are documentation; owner removals are noted', () => {
  const inScope = specs.filter(spec => spec.scope === 'in');
  assert.equal(inScope.length, 107);
  for (const spec of inScope) {
    assert.ok(spec.type !== 'composition' || ['C16', 'M9', 'M10', 'S2'].includes(spec.id), `${spec.id} is a component`);
    assert.ok(spec.classes.length > 0, `${spec.id} names the classes that prove it`);
  }
  for (const spec of specs.filter(spec => spec.scope === 'out')) {
    assert.ok(spec.state === 'out-of-scope' || (spec.state === 'removed' && spec.note), `${spec.id} is out of scope or removed with a note`);
  }
});

test('every spec marked done is in the built CSS, the catalog and a test', () => {
  assert.deepEqual(verify().problems, []);
});
