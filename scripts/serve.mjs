import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = await realpath(fileURLToPath(new URL('../', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };

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
      const path = await resolvePublicPath(new URL(req.url, 'http://localhost').pathname);
      if (!path) { res.writeHead(404).end('Not found'); return; }
      const body = await readFile(path);
      res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(body);
    } catch { res.writeHead(404).end('Not found'); }
  });
  const port = Number(process.env.PORT || 4173);
  server.listen(port, '127.0.0.1', () => console.log(`Catalog: http://127.0.0.1:${port}/docs/`));
}
