import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { languageRedirect } from '../worker/language-routing.js';

const directory = process.argv.includes('--dist') ? 'dist' : 'public';
const root = fileURLToPath(new URL(`../${directory}/`, import.meta.url));
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.mjs': 'text/javascript; charset=utf-8', '.wasm': 'application/wasm', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.ico': 'image/x-icon', '.zip': 'application/zip', '.dmg': 'application/x-apple-diskimage', '.exe': 'application/octet-stream', '.deb': 'application/vnd.debian.binary-package', '.AppImage': 'application/octet-stream' };
const server = http.createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
  try {
    if (directory === 'dist') {
      const redirect = languageRedirect(new Request(new URL(request.url, 'http://localhost'), { method: request.method, headers: request.headers }));
      if (redirect) { response.writeHead(redirect.status, Object.fromEntries(redirect.headers)).end(); return; }
    }
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let file = await realpath(path.join(root, pathname === '/' ? 'index.html' : pathname));
    // Match the static host's directory-index behavior so legal pages can be checked locally
    // using their public URLs (/privacy and /terms), not only with an index.html suffix.
    if ((await stat(file)).isDirectory()) file = await realpath(path.join(file, 'index.html'));
    if (!file.startsWith(root)) { response.writeHead(403).end('Forbidden'); return; }
    const info = await stat(file);
    if (!info.isFile()) { response.writeHead(404).end('Not found'); return; }
    // Byte ranges, as Cloudflare serves them, so the browser can seek the data-flow video.
    const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range || '');
    let start = 0, end = info.size - 1;
    if (range && (range[1] || range[2])) {
      start = range[1] ? Number(range[1]) : Math.max(0, info.size - Number(range[2]));
      end = range[1] && range[2] ? Math.min(Number(range[2]), info.size - 1) : info.size - 1;
      if (start > end) { response.writeHead(416, { 'Content-Range': `bytes */${info.size}` }).end(); return; }
    }
    const partial = !!range && (start > 0 || end < info.size - 1 || !!range[1]);
    response.writeHead(partial ? 206 : 200, {
      ...(partial ? { 'Content-Range': `bytes ${start}-${end}/${info.size}` } : {}),
      'Accept-Ranges': 'bytes',
      'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
      'Content-Length': end - start + 1,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': pathname.startsWith('/product/')
        ? "default-src 'self'; img-src 'self' data: blob:; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'"
        : "default-src 'self'; img-src 'self'; media-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
    });
    if (request.method === 'HEAD') { response.end(); return; }
    await pipeline(createReadStream(file, { start, end }), response);
  } catch (error) {
    if (!response.headersSent) response.writeHead(error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 400).end('Not found');
    else response.destroy();
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Pi Bot website → http://127.0.0.1:${port}`));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
