import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = await realpath(fileURLToPath(new URL('../', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };

export async function resolvePublicPath(pathname) {
  try {
    pathname = decodeURIComponent(pathname);
    if (pathname === '/') pathname = '/docs/';
    if (pathname.endsWith('/')) pathname += 'index.html';
    const directory = /^\/(docs|dist)\//.exec(pathname)?.[1];
    if (!directory) return null;
    const publicRoot = resolve(root, directory) + sep;
    const candidate = resolve(root, `.${pathname}`);
    if (!candidate.startsWith(publicRoot)) return null;
    const path = await realpath(candidate);
    if (!path.startsWith(publicRoot) || !(await stat(path)).isFile()) return null;
    return path;
  } catch { return null; }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url, 'http://localhost').pathname;
      if (pathname === '/') { res.writeHead(302, { Location: '/docs/' }).end(); return; }
      const path = await resolvePublicPath(pathname);
      if (!path) { res.writeHead(404).end('Not found'); return; }
      const body = await readFile(path);
      res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(body);
    } catch { res.writeHead(404).end('Not found'); }
  });
  const args = process.argv.slice(2);
  let port = Number(process.env.PORT || 4173);
  let host = process.env.HOST || '127.0.0.1';
  for (let index = 0; index < args.length; index++) {
    const [flag, inlineValue] = args[index].split('=', 2);
    if (flag === '--port' || flag === '--host') {
      const value = inlineValue ?? args[++index];
      if (flag === '--port') port = Number(value);
      else host = value;
    }
  }
  server.listen(port, host, () => console.log(`Catalog: http://${host}:${server.address().port}/docs/`));
}
