import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
async function files(dir) {
  return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?files(`${dir}/${e.name}`):[`${dir}/${e.name}`]))).flat().filter(f=>/\.(scss|css|html|mjs|js)$/.test(f)).sort();
}
export async function styleSourceFingerprint() {
  const paths=[...await files('src'),...await files('docs'),'architecture/style-contracts.json'];
  return createHash('sha256').update((await Promise.all(paths.map(async file=>`${file}\0${await readFile(file,'utf8')}`))).join('\0')).digest('hex');
}
