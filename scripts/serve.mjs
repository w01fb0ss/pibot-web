import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';

const directory = process.argv.includes('--dist') ? 'dist' : 'public';
const root = fileURLToPath(new URL(`../${directory}/`, import.meta.url));
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.mjs': 'text/javascript; charset=utf-8', '.wasm': 'application/wasm', '.png': 'image/png', '.zip': 'application/zip', '.dmg': 'application/x-apple-diskimage', '.exe': 'application/octet-stream', '.deb': 'application/vnd.debian.binary-package', '.AppImage': 'application/octet-stream' };
const server = http.createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = await realpath(path.join(root, pathname === '/' ? 'index.html' : pathname));
    if (!file.startsWith(root)) { response.writeHead(403).end('Forbidden'); return; }
    const info = await stat(file);
    if (!info.isFile()) { response.writeHead(404).end('Not found'); return; }
    response.writeHead(200, {
      'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': pathname.startsWith('/product/')
        ? "default-src 'self'; img-src 'self' data: blob:; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'"
        : "default-src 'self'; img-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
    });
    if (request.method === 'HEAD') { response.end(); return; }
    await pipeline(createReadStream(file), response);
  } catch (error) {
    if (!response.headersSent) response.writeHead(error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 400).end('Not found');
    else response.destroy();
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Pi Bot website → http://127.0.0.1:${port}`));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
