import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,access} from 'node:fs/promises';
import feather from 'feather-icons';

test('every Feather icon is available as a separate SVG without a combined sprite', async () => {
  const names=Object.keys(feather.icons).sort();
  const files=(await readdir('dist/icons')).filter(name=>name.endsWith('.svg')).sort();
  assert.deepEqual(files,names.map(name=>`${name}.svg`).sort());
  await assert.rejects(access('dist/icons.svg'),{code:'ENOENT'});
  for(const name of names) {
    const svg=await readFile(`dist/icons/${name}.svg`,'utf8');
    assert.match(svg,new RegExp(`<svg\\b[^>]*id="${name}"`));
    assert.doesNotMatch(svg,/<symbol|<script/);
    const upstream=await readFile(`node_modules/feather-icons/dist/icons/${name}.svg`,'utf8');
    assert.equal(svg.replace(` id="${name}"`,''),upstream);
  }
  assert.equal(await readFile('dist/icons-LICENSE.txt','utf8'),await readFile('node_modules/feather-icons/LICENSE','utf8'));
});
