import {readFile, readdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => readFile(path.join(root, file), 'utf8');
const contracts = JSON.parse(await read('architecture/style-contracts.json'));
async function files(dir) {
  const entries = await readdir(path.join(root, dir), {withFileTypes:true});
  return (await Promise.all(entries.map(e => e.isDirectory() ? files(`${dir}/${e.name}`) : [`${dir}/${e.name}`]))).flat().filter(f => f.endsWith('.scss')).sort();
}
const moduleId = file => file.replace(/^src\//, '').replace(/(^|\/)_(?=[^/]+$)/, '$1').replace(/\.scss$/, '').replace(/\/index$/, '');
// Source dependencies, not a Sass selector/cascade interpreter. Strip comments so
// examples and retired declarations cannot become normative relationships.
const sources = new Map();
for (const file of await files('src')) sources.set(moduleId(file), {file, source:(await read(file)).replace(/\/\*[\s\S]*?\*\//g, comment => comment.replace(/[^\n]/g,' ')).replace(/\/\/[^\n]*/g,'')});
const nodes = [], edges = [];
const link = (from, to, kind, file, line) => edges.push({from,to,kind,file,line});
for (const [id, {file,source}] of sources) {
  const mixins = [...source.matchAll(/@mixin\s+([\w-]+)/g)].map(m => m[1]);
  const classes = [...new Set([...source.matchAll(/\.tg-[\w-]+/g)].map(m => m[0]))].sort();
  nodes.push({id,kind:'module',file,mixins,classes});
  const aliases = new Map();
  const line = index => source.slice(0,index).split('\n').length;
  for (const m of source.matchAll(/@use\s+['"]([^'"]+)['"](?:\s+as\s+([\w*-]+))?/g)) {
    if (m[1].startsWith('sass:')) continue;
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(file.replace(/^src\//, '')),m[1])).replace(/\/index$/,'');
    if (!sources.has(target)) throw Error(`Unresolved @use ${file}: ${m[1]} -> ${target}`);
    aliases.set(m[2] || path.posix.basename(m[1]),target);
    link(id,target,'uses',file,line(m.index));
  }
  for (const m of source.matchAll(/@include\s+([\w-]+)(?:\.([\w-]+))?/g)) {
    const target = m[2] ? aliases.get(m[1]) : id;
    const symbol = m[2] || m[1];
    if (!target || !sources.get(target).source.match(new RegExp(`@mixin\\s+${symbol}\\b`))) throw Error(`Unresolved mixin ${file}: ${m[0]}`);
    link(id,`${target}#${symbol}`,'includes',file,line(m.index));
  }
  for (const m of source.matchAll(/var\(\s*--([\w-]+)/g)) link(id,`token:${m[1]}`,'reads-token',file,line(m.index));
  for (const m of source.matchAll(/--([\w-]+)\s*:/g)) link(id,`token:${m[1]}`,'defines-token',file,line(m.index));
}
const tokenIds = [...new Set(edges.filter(e => e.to.startsWith('token:')).map(e => e.to))].sort();
for (const id of tokenIds) nodes.push({id,kind:'token'});
for (const [id, {file}] of sources) for (const symbol of nodes.find(n=>n.id===id).mixins) nodes.push({id:`${id}#${symbol}`,kind:'mixin',file});
const familyIds = new Set();
for (const family of contracts.families) {
  if(familyIds.has(family.id)) throw Error(`Duplicate family ${family.id}`);
  familyIds.add(family.id);
  const target = family.owner + (family.symbol ? `#${family.symbol}` : '');
  if (!nodes.some(n=>n.id===target)) throw Error(`Missing owner ${target}`);
  nodes.push({...family,id:`family:${family.id}`,kind:'family'});
  link(`family:${family.id}`,target,'owned-by','architecture/style-contracts.json',null);
  for (const token of family.tokens || []) {
    if (!tokenIds.includes(`token:${token}`)) throw Error(`Unknown family token ${token}`);
    link(`family:${family.id}`,`token:${token}`,'configured-by','architecture/style-contracts.json',null);
  }
}
// The normative graph has one direction: foundation -> owner -> family -> component.
// Source dependencies remain separate: importing Sass is not CSS inheritance.
const pyramidNodes = [{id:'system',kind:'system',level:0,label:'Каноническая система стилей'},
  {id:'foundation',kind:'foundation',level:1,label:'Токены, темы и базовые состояния',sources:['src/tokens/_index.scss','src/themes/_index.scss','src/themes/_colors.scss','src/base/_index.scss','src/_layers.scss']}];
const pyramidEdges = [{from:'system',to:'foundation',kind:'specializes'}];
const addNode = node => { if (!pyramidNodes.some(n=>n.id===node.id)) pyramidNodes.push(node); };
const addEdge = (from,to,kind) => { if (!pyramidEdges.some(e=>e.from===from&&e.to===to)) pyramidEdges.push({from,to,kind}); };
for (const family of contracts.families) {
  const owner = family.owner + (family.symbol ? `#${family.symbol}` : '');
  const primitive = `primitive:${owner}`;
  addNode({id:primitive,kind:'primitive',level:2,source:owner});
  addNode({...family,id:`family:${family.id}`,kind:'family',level:3});
  addEdge('foundation',primitive,'provides');
  addEdge(primitive,`family:${family.id}`,'owns');
  for (const member of family.members || []) {
    if (!sources.has(member)) throw Error(`Unknown family member ${member}`);
    addNode({id:`component:${member}`,kind:'component-module',level:4,source:member});
    addEdge(`family:${family.id}`,`component:${member}`,'governs');
  }
}
const interaction = contracts.interaction;
if (interaction) {
  if (!sources.has(interaction.owner)) throw Error('Missing interaction owner');
  const owner = `primitive:${interaction.owner}`;
  addNode({id:owner,kind:'primitive',level:2,source:interaction.owner});
  addEdge('foundation',owner,'provides');
  for (const role of interaction.roles) {
    const id = `role:${role.id}`;
    addNode({...role,id,kind:'semantic-role',level:3,token:interaction.token});
    addEdge(owner,id,'defines-contract');
    const recipe = `recipe:${role.id}`;
    addNode({id:recipe,kind:'component-recipe',level:4,selector:role.selector,source:role.implementation,outline:role.outline});
    addEdge(id,recipe,'governs');
  }
}
for (const edge of pyramidEdges) {
  const from = pyramidNodes.find(n=>n.id===edge.from);
  const to = pyramidNodes.find(n=>n.id===edge.to);
  if (!from || !to || from.level >= to.level) throw Error(`Non-cascading edge ${edge.from} -> ${edge.to}`);
}
for (const node of nodes.filter(n=>n.kind==='module' && n.classes.length)) {
  if (!pyramidNodes.some(n=>n.id===`component:${node.id}`)) throw Error(`Unclassified component module ${node.id}: add a family member`);
}
const reality=JSON.parse(await read('architecture/style-reality.json'));
const examples=await Promise.all(['badge-counter-explanation.json','badge-information-explanation.json'].map(async file=>JSON.parse(await read('architecture/'+file))));
const graph = {version:1,policy:contracts.policy,interaction:contracts.interaction,nodes:pyramidNodes,edges:pyramidEdges,evidence:{nodes,edges},reality,explanations:examples};
const graphText = JSON.stringify(graph,null,2)+'\n';
const diagram = ['flowchart TB', '  root["Токены → темы → базовые правила"]'];
contracts.families.forEach((f,i)=>{
  diagram.push(`  root --> o${i}["${f.owner}${f.symbol ? '.'+f.symbol : ''}"]`);
  diagram.push(`  o${i} --> f${i}["${f.label}"]`);
  (f.members || []).forEach(c=>diagram.push(`  f${i} --> c_${c.replace(/[^a-z0-9]/g,'_')}["${c}"]`));
});
if (interaction) {
  diagram.push('  root --> boundary["Общий контракт интерактивности"]');
  interaction.roles.forEach((r,i)=>{
    diagram.push(`  boundary --> role${i}["${r.label}"]`);
    diagram.push(`  role${i} --> rule${i}["Рамка: ${r.outline === 'required' ? 'обязательна' : 'отсутствует'}"]`);
  });
}
const markdown = `# Семантический граф стилей (SSOT)\n\n<!-- Generated by npm run graph:styles; do not edit. -->\n\nКак объяснить конкретное свойство: [причинный граф и команды](style-explanations.md).\n\nФактические CSS-правила, экземпляры и computed-стили: [снимок интерфейсов и покрытие](style-reality.md). Граф не считается полным, пока есть непроверенные состояния.\n\nНормативные семейства и владельцы: [style-contracts.json](../architecture/style-contracts.json).\nПолный граф с исходными файлами и строками: [style-graph.json](../architecture/style-graph.json).\n\nПирамида направлена сверху вниз: токены и темы → примитивы-владельцы → семейства → модули компонентов. Каждый уровень специализирует предыдущий. У компонента могут быть несколько родителей по разным обязанностям: например поверхность, выбор и обрезка медиа. Обратные связи и циклы запрещены проверкой уровней. Технические зависимости сохранены отдельно в evidence; они не являются связями наследования.\n\n\`\`\`mermaid\n${diagram.join('\n')}\n\`\`\`\n\n## Контракт интерактивности\n\n${interaction ? interaction.invariant : ""}\n\n${interaction ? interaction.variants : ""}\n\n| Роль | Рамка | Владелец реализации |\n| --- | --- | --- |\n${interaction ? interaction.roles.map(r=>`| ${r.label} | ${r.outline} | ${r.implementation} |`).join("\n") : ""}\n\nВсе роли используют один токен action-border-color; рамка не исчезает у ghost, selected или disabled. Переключатель рисует её на ::before. Структурные рамки поверхностей — отдельная роль.\n\n## Контракты\n\n| Семейство | Владелец | Ответственность |\n| --- | --- | --- |\n${contracts.families.map(f=>`| ${f.label} | [${f.owner}${f.symbol ? '.'+f.symbol : ''}](../${sources.get(f.owner).file}) | ${f.responsibility} |`).join('\n')}\n\n## Все модули\n\n| Модуль | Общие миксины, которые он подключает |\n| --- | --- |\n${[...sources].map(([id,{file}])=>`| [${id}](../${file}) | ${[...new Set(edges.filter(e=>e.from===id&&e.kind==='includes').map(e=>e.to))].join(', ') || '—'} |`).join('\n')}\n\n## Правила использования\n\n${Object.values(contracts.policy).map(p=>'- '+p).join('\n')}\n\n1. Перед изменением найдите семейство и владельца; фактические потребители доступны по includes и uses.\n2. Меняйте общую реализацию у владельца. Новое семейство или смену ответственности фиксируйте в style-contracts.json.\n3. Выполните npm run graph:styles и включите обновлённые графы в изменение. npm test проверяет, что они соответствуют исходникам.\n4. Визуальное наследование подтверждайте браузерными тестами. Этот граф фиксирует исходные зависимости, а не вычисляет CSS-каскад.\n\nГраф охватывает все Sass-модули src, их @use, @include, чтения и объявления CSS-переменных, а также буквальные .tg-* селекторы. Вложенные &__* селекторы не разворачиваются. Интерполированные переменные, JS, inline-стили и внешние host-переопределения требуют отдельной проверки. Токены могут иметь несколько определений в темах и состояниях; defines-token не назначает единственного владельца токена.\n`;
for (const [file,content] of [['architecture/style-graph.json',graphText],['docs/style-graph.md',markdown]]) {
  if (process.argv.includes('--check')) {
    if (await read(file) !== content) throw Error(`${file} устарел: npm run graph:styles`);
  } else await writeFile(path.join(root,file),content);
}
console.log(`Style graph: ${pyramidNodes.length} semantic nodes, ${pyramidEdges.length} cascading edges; ${nodes.length} source nodes, ${edges.length} evidence edges; ${contracts.families.length} families.`);
