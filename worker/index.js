// Static site from ASSETS; installers under /downloads/ come from the R2 bucket (owner
// 2026-10-22: packages live in R2, served on the website's own domain).
const PREFIX = '/downloads/';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith(PREFIX)) return env.ASSETS.fetch(request);
    if (request.method !== 'GET' && request.method !== 'HEAD')
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    const key = decodeURIComponent(url.pathname.slice(PREFIX.length));
    // Release files only: version folder + file name, no traversal or hidden names.
    if (!/^[0-9]+\.[0-9]+\.[0-9]+\/[A-Za-z0-9._-]+$/.test(key) || key.includes('..'))
      return new Response('Not found', { status: 404 });
    const object =
      request.method === 'HEAD'
        ? await env.RELEASES.head(key)
        : await env.RELEASES.get(key, { range: request.headers, onlyIf: request.headers });
    if (!object) return new Response('Not found', { status: 404 });
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('ETag', object.httpEtag);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=86400, immutable');
    headers.set('X-Content-Type-Options', 'nosniff');
    if (request.method === 'HEAD' || !('body' in object) || !object.body) {
      headers.set('Content-Length', String(object.size));
      return new Response(null, { status: 'body' in object || request.method === 'HEAD' ? 200 : 304, headers });
    }
    const range = object.range;
    if (range && request.headers.has('range')) {
      const start = 'offset' in range ? range.offset ?? 0 : object.size - (range.suffix ?? 0);
      const length = 'length' in range && range.length !== undefined ? range.length : object.size - start;
      headers.set('Content-Range', `bytes ${start}-${start + length - 1}/${object.size}`);
      headers.set('Content-Length', String(length));
      return new Response(object.body, { status: 206, headers });
    }
    headers.set('Content-Length', String(object.size));
    return new Response(object.body, { status: 200, headers });
  },
};
