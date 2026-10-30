import {styleSourceFingerprint} from '../scripts/lib/style-source-fingerprint.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root = new URL('../', import.meta.url);
const read = file => readFile(new URL(file,root),'utf8');

test('style SSOT is up to date with source and semantic contracts', () => {
  execFileSync(process.execPath,['scripts/style-graph.mjs','--check'],{cwd:root,stdio:'pipe'});
});

test('semantic pyramid flows strictly downward and covers every component module', async () => {
  const graph=JSON.parse(await read('architecture/style-graph.json'));
  const nodes=new Map(graph.nodes.map(n=>[n.id,n]));
  assert.equal(nodes.size,graph.nodes.length,'unique semantic nodes');
  const reached=new Set(['system']);
  for(let i=0;i<graph.nodes.length;i++) for(const e of graph.edges) {
    assert.ok(nodes.get(e.from).level < nodes.get(e.to).level, `${e.from} -> ${e.to}`);
    if(reached.has(e.from)) reached.add(e.to);
  }
  assert.equal(reached.size,nodes.size,'every node descends from the root');
  for(const n of graph.evidence.nodes.filter(n=>n.kind==='module' && n.classes.length)) {
    assert.ok(nodes.has(`component:${n.id}`),`family missing for ${n.id}`);
  }
  // Dependency evidence can have a different direction; it never enters the pyramid.
  assert.ok(graph.evidence.edges.some(e=>e.kind==='includes'));
  assert.ok(graph.edges.every(e=>!['uses','includes','reads-token','defines-token'].includes(e.kind)));
});


test('observations and causal examples refer to the current interface sources', async () => {
  const graph=JSON.parse(await read('architecture/style-graph.json'));
  const fingerprint=await styleSourceFingerprint();
  assert.equal(graph.reality.fingerprint,fingerprint,'refresh graph:reality after interface changes');
  for(const example of graph.explanations){
    assert.equal(example.fingerprint,fingerprint,'refresh causal example after interface changes');
    assert.ok(example.graph.edges.length>0);
    for(const explanation of example.explanations) {
      assert.equal(explanation.status,'browser-confirmed-source-block');
      assert.ok(explanation.controlling.every(c=>c.source&&c.line));
    }
  }
});
