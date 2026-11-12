// Static site from ASSETS; installers under /downloads/ come from the R2 bucket (owner
// 2026-10-22: packages live in R2, served on the website's own domain).
import { DurableObject } from 'cloudflare:workers';

const PREFIX = '/downloads/';

// A66 (owner 2026-11-12): update checks are counted per day × source × version × platform × arch,
// nothing else. No IP, no request log, no identifier; only these aggregate rows are stored.
const FEEDS = {
  '/updates/latest-mac.yml': { source: 'auto', platform: 'darwin' },
  '/updates/latest.yml': { source: 'auto', platform: 'win32' },
  '/updates/latest-linux.yml': { source: 'auto', platform: 'linux' },
  '/updates/stable.json': { source: 'manual', platform: 'unknown' },
};
const AGENT = /^PiBot\/(\d{1,4}\.\d{1,4}\.\d{1,4}|unknown) \((darwin|win32|linux|unknown); (x64|arm64|unknown)\)$/;
const KEEP_DAYS = 400;
const MAX_KEYS_PER_DAY = 300;

/** Only Pi Bot's own checks count: its User-Agent, or the agents older versions sent. */
export function updateKey(pathname, agent) {
  const feed = FEEDS[pathname];
  if (!feed) return undefined;
  const match = AGENT.exec(agent ?? '');
  if (match) {
    const platform = feed.platform === 'unknown' ? match[2] : feed.platform;
    return [feed.source, match[1], platform, match[3]].join('|');
  }
  // Before A66: electron-updater sent "electron-builder", the manual check Node's default.
  if ((feed.source === 'auto' && agent === 'electron-builder') || (feed.source === 'manual' && agent === 'node'))
    return [feed.source, 'unknown', feed.platform, 'unknown'].join('|');
  return undefined;
}

export class Counter extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS counts (day TEXT NOT NULL, key TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (day, key))');
    this.pruned = '';
  }
  add(day, key) {
    if (this.pruned !== day) {
      const cutoff = new Date(Date.parse(`${day}T00:00:00Z`) - KEEP_DAYS * 86400000).toISOString().slice(0, 10);
      this.sql.exec('DELETE FROM counts WHERE day < ?', cutoff);
      this.pruned = day;
    }
    if (this.sql.exec('UPDATE counts SET n = n + 1 WHERE day = ? AND key = ?', day, key).rowsWritten) return;
    // Bounded per day, so made-up versions cannot grow the table without limit.
    const known = this.sql.exec('SELECT COUNT(*) AS c FROM counts WHERE day = ?', day).one().c;
    const stored = known >= MAX_KEYS_PER_DAY ? 'other' : key;
    this.sql.exec('INSERT INTO counts (day, key, n) VALUES (?, ?, 1) ON CONFLICT (day, key) DO UPDATE SET n = n + 1', day, stored);
  }
  read(from) {
    return this.sql.exec('SELECT day, key, n FROM counts WHERE day >= ? ORDER BY day, key', from).toArray();
  }
}

function counter(env) {
  return env.COUNTER.get(env.COUNTER.idFromName('updates'));
}

async function sameSecret(given, expected) {
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all(
    [given, expected].map(value => crypto.subtle.digest('SHA-256', encoder.encode(value))),
  );
  return crypto.subtle.timingSafeEqual(a, b);
}

/** Aggregates only, behind a Worker secret; without the secret the endpoint does not exist. */
async function stats(request, env) {
  if (!env.STATS_TOKEN || request.method !== 'GET') return new Response('Not found', { status: 404 });
  const given = /^Bearer (.{16,200})$/.exec(request.headers.get('authorization') ?? '')?.[1] ?? '';
  if (!(await sameSecret(given, env.STATS_TOKEN))) return new Response('Not found', { status: 404 });
  const from = new URL(request.url).searchParams.get('from') ?? '';
  const day = /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const rows = (await counter(env).read(day)).map(({ day: d, key, n }) => {
    const [source, version, platform, arch] = key.split('|');
    return { day: d, source, version, platform, arch, count: n };
  });
  return Response.json({ kind: 'updates', from: day, rows }, { headers: { 'Cache-Control': 'no-store' } });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/_stats') return stats(request, env);
    if (url.pathname.startsWith('/updates/')) {
      const response = await env.ASSETS.fetch(request);
      const key = request.method === 'GET' && (response.ok || response.status === 304) ? updateKey(url.pathname, request.headers.get('user-agent')) : undefined;
      // Counting never delays or fails the update check itself.
      if (key && env.COUNTER) ctx.waitUntil(counter(env).add(new Date().toISOString().slice(0, 10), key).catch(() => {}));
      return response;
    }
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
