// Static site from ASSETS; installers under /downloads/ come from the R2 bucket (owner
// 2026-10-22: packages live in R2, served on the website's own domain).
import { DurableObject } from 'cloudflare:workers';
import { downloadBucket, downloadSummary } from './download-stats.js';
import { languageRedirect } from './language-routing.js';

const PREFIX = '/downloads/';
const CLICK_PREFIX = '/download-click/';
const RETIRED_VERSION = '0.0.2';
// The withdrawn 2026-11-16 v0.0.2 stays gone. The 2026-11-19 urgent 0.0.2 reuses the number, so
// exactly its desktop files are served (installers, update zips, blockmaps); the withdrawn APK and
// runner builds of that number stay 404.
const RELEASED_0_0_2 = /^PiBot-0\.0\.2-(mac-(arm64|x64)\.(zip|dmg)|win-x64\.exe|linux-x86_64\.AppImage)(\.blockmap)?$/;
const RELEASE_FILE = /^(\d{1,4}\.\d{1,4}\.\d{1,4})\/([A-Za-z0-9._-]+)$/;
const DOWNLOAD_TARGETS = [
  ['desktop', 'mac-arm64.dmg', 'darwin', 'arm64'],
  ['desktop', 'mac-x64.dmg', 'darwin', 'x64'],
  ['desktop', 'win-x64.exe', 'win32', 'x64'],
  ['desktop', 'linux-x86_64.AppImage', 'linux', 'x64'],
  ['mobile', 'android.apk', 'android', 'arm64'],
  ['runner', 'mac-x64.zip', 'darwin', 'x64'],
  ['runner', 'win-x64.exe', 'win32', 'x64'],
  ['runner', 'linux-x64.deb', 'linux', 'x64'],
];

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
const DOWNLOAD_CLICK_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const DOWNLOAD_CLICK_RETRY_MS = 60 * 60 * 1000;
const GMAIL_CALLBACK = 'https://auth.pibot.space/gmail/callback';
const GMAIL_SCOPES = new Set([
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels',
]);

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
    this.sql.exec('CREATE TABLE IF NOT EXISTS download_click_ids (id TEXT PRIMARY KEY, seen_at INTEGER NOT NULL)');
    this.sql.exec('CREATE INDEX IF NOT EXISTS download_click_ids_seen_at ON download_click_ids (seen_at)');
    this.pruned = '';
  }
  add(day, key) {
    if (this.pruned !== day) {
      const cutoff = new Date(Date.parse(`${day}T00:00:00Z`) - KEEP_DAYS * 86400000).toISOString().slice(0, 10);
      this.sql.exec('DELETE FROM counts WHERE day < ?', cutoff);
      this.pruned = day;
    }
    if (this.sql.exec('UPDATE counts SET n = n + 1 WHERE day = ? AND key = ?', day, key).rowsWritten) return key;
    // Bounded per day, so made-up versions cannot grow the table without limit.
    const known = this.sql.exec('SELECT COUNT(*) AS c FROM counts WHERE day = ?', day).one().c;
    const stored = known >= MAX_KEYS_PER_DAY ? 'other' : key;
    this.sql.exec('INSERT INTO counts (day, key, n) VALUES (?, ?, 1) ON CONFLICT (day, key) DO UPDATE SET n = n + 1', day, stored);
    return stored;
  }
  read(from) {
    return this.sql.exec('SELECT day, key, n FROM counts WHERE day >= ? ORDER BY day, key', from).toArray();
  }
  initializeDownloadTotals() {
    this.sql.exec('CREATE TABLE IF NOT EXISTS download_totals (key TEXT PRIMARY KEY, n INTEGER NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS download_totals_meta (id INTEGER PRIMARY KEY, first_day TEXT)');
    if (this.sql.exec('SELECT id FROM download_totals_meta WHERE id = 1').toArray().length) return;
    // Seed before daily retention can remove history; later releases share these nine buckets.
    const rows = this.sql.exec('SELECT key, SUM(n) AS n FROM counts GROUP BY key').toArray();
    for (const { key, n } of rows) this.sql.exec('INSERT INTO download_totals (key, n) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET n = n + excluded.n', downloadBucket(key, DOWNLOAD_TARGETS), n);
    const first = this.sql.exec('SELECT MIN(day) AS day FROM counts').one().day;
    this.sql.exec('INSERT INTO download_totals_meta (id, first_day) VALUES (1, ?)', first);
  }
  addDownload(key, clickId) {
    const now = Date.now();
    const day = new Date(now).toISOString().slice(0, 10);
    const pruned = this.pruned;
    try {
      this.ctx.storage.transactionSync(() => {
        this.sql.exec('DELETE FROM download_click_ids WHERE seen_at <= ?', now - DOWNLOAD_CLICK_RETRY_MS);
        const click = this.sql.exec('INSERT OR IGNORE INTO download_click_ids (id, seen_at) VALUES (?, ?)', clickId, now);
        if (!click.rowsWritten) return;
        this.initializeDownloadTotals();
        const stored = downloadBucket(this.add(day, key), DOWNLOAD_TARGETS);
        this.sql.exec('INSERT INTO download_totals (key, n) VALUES (?, 1) ON CONFLICT (key) DO UPDATE SET n = n + 1', stored);
        this.sql.exec('UPDATE download_totals_meta SET first_day = ? WHERE id = 1 AND (first_day IS NULL OR first_day > ?)', day, day);
      });
    } catch (error) { this.pruned = pruned; throw error; }
  }
  downloadTotals() {
    return this.ctx.storage.transactionSync(() => {
      this.initializeDownloadTotals();
      return {
        from: this.sql.exec('SELECT first_day FROM download_totals_meta WHERE id = 1').one().first_day,
        rows: this.sql.exec('SELECT key, n FROM download_totals ORDER BY key').toArray(),
      };
    });
  }
}

// Gmail OAuth state contains no Gmail token. The code verifier and local callback
// are kept for at most five minutes so the callback can complete the confidential
// Google exchange; the resulting refresh token is encrypted and returned directly
// to the loopback browser form, never written to Durable Object storage.
export class GmailAuth extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.sql = ctx.storage.sql; this.sql.exec('CREATE TABLE IF NOT EXISTS states (id TEXT PRIMARY KEY, value TEXT NOT NULL, expires INTEGER NOT NULL)'); }
  async put(id, value) { const expires = Date.now() + 5 * 60 * 1000; this.sql.exec('DELETE FROM states WHERE expires < ?', Date.now()); const existing = this.sql.exec('SELECT id FROM states WHERE id = ?', id).toArray()[0]; if (existing) throw new Error('gmail_state_exists'); this.sql.exec('INSERT INTO states (id, value, expires) VALUES (?, ?, ?)', id, JSON.stringify(value), expires); await this.ctx.storage.setAlarm(expires); }
  async take(id) { this.sql.exec('DELETE FROM states WHERE expires < ?', Date.now()); const row = this.sql.exec('SELECT value FROM states WHERE id = ?', id).toArray()[0]; if (!row) return undefined; this.sql.exec('DELETE FROM states WHERE id = ?', id); return JSON.parse(row.value); }
  async alarm() {
    const now = Date.now();
    this.sql.exec('DELETE FROM states WHERE expires < ?', now);
    const next = this.sql.exec('SELECT MIN(expires) AS expires FROM states').toArray()[0]?.expires;
    if (typeof next === 'number') await this.ctx.storage.setAlarm(next);
  }
}

function counter(env, kind = 'updates') {
  return env.COUNTER.get(env.COUNTER.idFromName(kind));
}

function downloadClickKey(version, file) {
  for (const [product, suffix, platform, arch] of DOWNLOAD_TARGETS) {
    const brand = product === 'runner' ? 'PiBot-Runner' : 'PiBot';
    if (file === brand + '-' + version + '-' + suffix) return [product, version, platform, arch].join('|');
  }
}

async function downloadClick(request, url, env, ctx) {
  const { method } = request;
  if (method !== 'GET' && method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, POST' } });
  const headers = { 'Cache-Control': 'no-store' };
  const clickId = request.headers.get('X-PiBot-Download-Click');
  if (method === 'POST' && (request.headers.get('Origin') !== url.origin || !DOWNLOAD_CLICK_ID.test(clickId ?? '')))
    return new Response('Invalid download click', { status: 400, headers });
  const key = url.pathname.slice(CLICK_PREFIX.length);
  const match = RELEASE_FILE.exec(key);
  const countKey = match && downloadClickKey(match[1], match[2]);
  if (!countKey) return new Response('Not found', { status: 404 });
  if (match[1] === RETIRED_VERSION && !RELEASED_0_0_2.test(match[2])) return retiredDownload();
  if (!await env.RELEASES.head(key)) return new Response('Not found', { status: 404 });
  // Old links continue to redirect, including download managers that retry this URL.
  if (method === 'GET') return new Response(null, { status: 302, headers: { ...headers, Location: PREFIX + key } });
  if (env.COUNTER) ctx.waitUntil(counter(env, 'downloads').addDownload(countKey, clickId).catch(() => { /* Measurement is best-effort. */ }));
  return new Response(null, { status: 204, headers });
}

const MAX_RANGES = 400;
/** `bytes=a-b,c-d,...` with two or more closed ranges; anything else is left to R2. */
function multipleRanges(header) {
  const match = /^bytes=(.+)$/.exec(header ?? '');
  if (!match) return undefined;
  const parts = match[1].split(',').map((part) => part.trim());
  if (parts.length < 2 || parts.length > MAX_RANGES) return undefined;
  const ranges = [];
  for (const part of parts) {
    const range = /^(\d+)-(\d+)$/.exec(part);
    if (!range || Number(range[2]) < Number(range[1])) return undefined;
    ranges.push([Number(range[1]), Number(range[2])]);
  }
  return ranges;
}

async function multipartRanges(env, key, ranges) {
  const head = await env.RELEASES.head(key);
  if (!head) return new Response('Not found', { status: 404 });
  const size = head.size;
  const valid = ranges.filter(([start]) => start < size).map(([start, end]) => [start, Math.min(end, size - 1)]);
  if (!valid.length) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  const boundary = 'pibot' + crypto.randomUUID().replaceAll('-', '');
  const type = head.httpMetadata?.contentType ?? 'application/octet-stream';
  const encoder = new TextEncoder();
  const partHead = ([start, end], first) =>
    encoder.encode(`${first ? '' : '\r\n'}--${boundary}\r\nContent-Type: ${type}\r\nContent-Range: bytes ${start}-${end}/${size}\r\n\r\n`);
  const tail = encoder.encode(`\r\n--${boundary}--\r\n`);
  let length = tail.byteLength;
  valid.forEach((range, index) => { length += partHead(range, index === 0).byteLength + range[1] - range[0] + 1; });
  const { readable, writable } = new FixedLengthStream(length);
  (async () => {
    const writer = writable.getWriter();
    try {
      for (const [index, range] of valid.entries()) {
        await writer.write(partHead(range, index === 0));
        const part = await env.RELEASES.get(key, { range: { offset: range[0], length: range[1] - range[0] + 1 } });
        if (!part?.body) throw new Error('range_unavailable');
        const reader = part.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }
      }
      await writer.write(tail);
      await writer.close();
    } catch (error) {
      await writer.abort(error);
    }
  })();
  return new Response(readable, {
    status: 206,
    headers: {
      'Content-Type': `multipart/byteranges; boundary=${boundary}`,
      'Content-Length': String(length),
      'Accept-Ranges': 'bytes',
      'ETag': head.httpEtag,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function retiredDownload() {
  return new Response('Not found', {
    status: 404,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function gmailAuth(env, state) { return env.GMAIL_AUTH.get(env.GMAIL_AUTH.idFromName(state)); }
function b64(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, ''); }
function jsonError(message, status = 400) { return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } }); }
function validRedirect(value) { const match = typeof value === 'string' && /^http:\/\/127\.0\.0\.1:(\d{1,5})\/oauth\/callback$/.exec(value); return !!match && Number(match[1]) >= 1024 && Number(match[1]) <= 65535; }
function validToken(value) { return typeof value === 'string' && /^\S{20,4096}$/.test(value); }
async function gmailInput(request) {
  if (!request.body || !request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('invalid_request');
  const reader = request.body.getReader(); const chunks = []; let size = 0;
  try {
    for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 16384) { await reader.cancel(); throw new Error('invalid_request'); } chunks.push(value); }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const value = JSON.parse(new TextDecoder().decode(bytes));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_request');
  return value;
}
function googleFetch(url, options) {
  // Workers rejects the 'error' mode before sending the request. Leave redirects unfollowed so
  // callers can reject non-success responses without forwarding OAuth credentials elsewhere.
  return fetch(url, { ...options, signal: AbortSignal.timeout(20000), redirect: 'manual' });
}
async function gmailStart(request, env) {
  if (request.method !== 'POST' || !env.GMAIL_OAUTH_CLIENT_ID || !env.GMAIL_OAUTH_CLIENT_SECRET) return jsonError('gmail_oauth_not_configured', 503);
  let input; try { input = await gmailInput(request); } catch { return jsonError('invalid_request'); }
  const { redirect_uri: redirectUri, state, code_challenge: challenge, code_verifier: verifier, scope } = input ?? {};
  const scopes = typeof scope === 'string' ? [...new Set(scope.split(/\s+/).filter(Boolean))] : [];
  if (!validRedirect(redirectUri) || !/^[A-Za-z0-9_-]{32,128}$/.test(state ?? '') || !/^[A-Za-z0-9_-]{32,128}$/.test(challenge ?? '') || !/^[A-Za-z0-9_-]{32,128}$/.test(verifier ?? '') || !scopes.length || scopes.length > 5 || scopes.some((item) => !GMAIL_SCOPES.has(item))) return jsonError('invalid_request');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  if (b64(digest) !== challenge) return jsonError('invalid_pkce');
  try { await gmailAuth(env, state).put(state, { redirectUri, challenge, verifier, scope: scopes.join(' ') }); } catch (error) { if (error instanceof Error && error.message === 'gmail_state_exists') return jsonError('state_exists', 409); throw error; }
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({ client_id: env.GMAIL_OAUTH_CLIENT_ID, redirect_uri: GMAIL_CALLBACK, response_type: 'code', access_type: 'offline', prompt: 'consent select_account', state, code_challenge: challenge, code_challenge_method: 'S256', scope: [...scopes, 'openid', 'email'].join(' ') }).toString();
  return Response.json({ authorizationUrl: url.toString(), clientId: env.GMAIL_OAUTH_CLIENT_ID }, { headers: { 'Cache-Control': 'no-store' } });
}
async function gmailRefresh(request, env) {
  if (request.method !== 'POST' || !env.GMAIL_OAUTH_CLIENT_ID || !env.GMAIL_OAUTH_CLIENT_SECRET) return jsonError('gmail_oauth_not_configured', 503);
  let input; try { input = await gmailInput(request); } catch { return jsonError('invalid_request'); }
  const refresh = input?.refresh_token; const clientId = input?.client_id;
  if (!validToken(refresh) || clientId !== env.GMAIL_OAUTH_CLIENT_ID) return jsonError('invalid_request');
  const response = await googleFetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.GMAIL_OAUTH_CLIENT_ID, client_secret: env.GMAIL_OAUTH_CLIENT_SECRET, refresh_token: refresh, grant_type: 'refresh_token' }) });
  if (!response.ok) return new Response('Google token refresh failed.', { status: 502, headers: { 'cache-control': 'no-store' } });
  const token = await response.json();
  if (!validToken(token?.access_token)) return new Response('Google did not return an access token.', { status: 502, headers: { 'cache-control': 'no-store' } });
  return Response.json({ access_token: token.access_token, expires_in: Number(token.expires_in ?? 3600) }, { headers: { 'cache-control': 'no-store' } });
}
function htmlForm(redirectUri, state, ticket) {
  const safe = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!doctype html><meta charset="utf-8"><title>Pi Bot Gmail</title><p>授权完成，正在返回 Pi Bot… / Authorization complete, returning to Pi Bot…</p><form id="f" method="post" action="${safe(redirectUri)}"><input name="state" value="${safe(state)}"><input name="code" value="${safe(ticket)}"></form><script>document.getElementById('f').submit()</script>`;
}
async function gmailCallback(request, env) {
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  const url = new URL(request.url); const state = url.searchParams.get('state') ?? ''; const code = url.searchParams.get('code') ?? '';
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(state) || (!code && !url.searchParams.has('error')) || code.length > 4096) return new Response('Invalid callback.', { status: 400 });
  const session = await gmailAuth(env, state).take(state);
  if (!session) return new Response('Authorization expired. Return to Pi Bot and try again.', { status: 400 });
  if (url.searchParams.has('error')) return new Response('Authorization cancelled. Return to Pi Bot to try again. / 授权已取消，请返回 Pi Bot 重试。', { status: 400 });
  const tokenResponse = await googleFetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: env.GMAIL_OAUTH_CLIENT_ID ?? '', client_secret: env.GMAIL_OAUTH_CLIENT_SECRET ?? '', redirect_uri: GMAIL_CALLBACK, grant_type: 'authorization_code', code_verifier: session.verifier }) });
  if (!tokenResponse.ok) return new Response('Google authorization failed.', { status: 502 });
  const token = await tokenResponse.json(); const refresh = token?.refresh_token;
  if (!validToken(refresh)) return new Response('Google did not return a refresh token. Try again.', { status: 502 });
  if (!validToken(token?.access_token)) return new Response('Google did not return an access token.', { status: 502 });
  // Identity scopes avoid requesting mailbox read access for send-only / labels-only connections.
  const profileResponse = await googleFetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { authorization: `Bearer ${token.access_token}` } });
  if (!profileResponse.ok) return new Response('Unable to read the authorized Gmail account.', { status: 502 });
  const profile = await profileResponse.json(); const email = profile?.email;
  if (profile?.email_verified !== true || typeof email !== 'string' || email.length > 320 || !/^[^\s@]+@[^\s@]+$/.test(email)) return new Response('Google did not return a Gmail address.', { status: 502 });
  const keyBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`Pi Bot Gmail ticket v1\0${session.verifier}`)); const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']); const iv = crypto.getRandomValues(new Uint8Array(12)); const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify({ refresh, email })));
  const ticket = `v1.${b64(iv)}.${b64(cipher)}`;
  const callbackPort = new URL(session.redirectUri).port;
  return new Response(htmlForm(session.redirectUri, state, ticket), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer', 'content-security-policy': `default-src 'none'; script-src 'unsafe-inline'; form-action http://127.0.0.1:${callbackPort}` } });
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
  const params = new URL(request.url).searchParams;
  const from = params.get('from') ?? '';
  const downloads = params.get('kind') === 'downloads';
  const day = /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : new Date(Date.now() - (downloads ? KEEP_DAYS : 30) * 86400000).toISOString().slice(0, 10);
  if (downloads) {
    const totals = new Map();
    const rows = (await counter(env, 'downloads').read(day)).map(({ day, key, n }) => {
      const [product, version, platform, arch] = key.split('|');
      const bucket = version ?? 'other';
      totals.set(bucket, (totals.get(bucket) ?? 0) + n);
      return { day, product, version, platform, arch, count: n };
    });
    return Response.json({ kind: 'downloads', from: day, byVersion: Object.fromEntries(totals), rows }, { headers: { 'Cache-Control': 'no-store' } });
  }
  const rows = (await counter(env).read(day)).map(({ day: d, key, n }) => {
    const [source, version, platform, arch] = key.split('|');
    return { day: d, source, version, platform, arch, count: n };
  });
  return Response.json({ kind: 'updates', from: day, rows }, { headers: { 'Cache-Control': 'no-store' } });
}

async function publicDownloadStats(request, env) {
  if (!['GET', 'HEAD'].includes(request.method))
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  const unavailable = () => Response.json({ error: 'download_stats_unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  if (!env.COUNTER) return unavailable();
  try {
    const through = new Date().toISOString().slice(0, 10);
    const { from, rows } = await counter(env, 'downloads').downloadTotals();
    const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
    const summary = downloadSummary(rows, DOWNLOAD_TARGETS, from, through);
    return request.method === 'HEAD' ? new Response(null, { headers }) : Response.json(summary, { headers });
  } catch { return unavailable(); }
}

// A per-colo edge copy for 30 s: every page polls this, and each miss reads the counter object.
async function cachedDownloadStats(request, env, ctx) {
  if (request.method !== 'GET') return publicDownloadStats(request, env);
  const cache = caches.default;
  const key = new Request(new URL('/__cache/download-stats', request.url), { method: 'GET' });
  const hit = await cache.match(key);
  if (hit) return hit;
  const fresh = await publicDownloadStats(request, env);
  if (!fresh.ok) return fresh;
  const response = new Response(fresh.body, fresh);
  response.headers.set('Cache-Control', 'public, max-age=30');
  ctx.waitUntil(cache.put(key, response.clone()));
  return response;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const redirect = languageRedirect(request);
    if (redirect) return redirect;
    if (url.pathname.startsWith(CLICK_PREFIX)) return downloadClick(request, url, env, ctx);
    if (url.pathname.startsWith('/gmail/')) {
      let response;
      try {
        if (url.pathname === '/gmail/start') response = await gmailStart(request, env);
        else if (url.pathname === '/gmail/refresh') response = await gmailRefresh(request, env);
        else if (url.pathname === '/gmail/callback') response = await gmailCallback(request, env);
        else response = jsonError('not_found', 404);
      } catch { response = jsonError('gmail_oauth_service_unavailable', 502); }
      const headers = new Headers(response.headers);
      headers.set('cache-control', 'no-store'); headers.set('referrer-policy', 'no-referrer'); headers.set('x-content-type-options', 'nosniff');
      return new Response(response.body, { status: response.status, headers });
    }
    if (url.pathname === '/_stats') return stats(request, env);
    if (url.pathname === '/api/download-stats') return cachedDownloadStats(request, env, ctx);
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
    const key = url.pathname.slice(PREFIX.length);
    // Release files only: version folder + file name, no traversal or hidden names.
    const release = RELEASE_FILE.exec(key);
    if (!release || key.includes('..'))
      return new Response('Not found', { status: 404 });
    if (release[1] === RETIRED_VERSION && !RELEASED_0_0_2.test(release[2])) return retiredDownload();
    // electron-updater's differential download asks for many ranges at once and needs a
    // multipart/byteranges answer; R2 serves one range per read (2026-11-19: Windows updates fell
    // back to the full 216 MB download and failed on a slow line).
    const ranges = request.method === 'GET' ? multipleRanges(request.headers.get('range')) : undefined;
    if (ranges) return multipartRanges(env, key, ranges);
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
