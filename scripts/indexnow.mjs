import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://pibot.space';
const stateFile = path.join(root, '.review', 'indexnow-state.json');
const mode = process.argv[2] ?? '--dry-run';
if (!['--initialize', '--dry-run', '--submit'].includes(mode) || process.argv.length > 3) throw new Error('Use --initialize, --dry-run, or --submit');
const key = (await readFile(path.join(root, 'scripts/indexnow-key.txt'), 'utf8')).trim();
if (!/^[a-zA-Z0-9-]{8,128}$/.test(key)) throw new Error('Invalid IndexNow verification key');
const sitemap = await readFile(path.join(root, 'dist/sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
if (!urls.length || urls.length > 10000) throw new Error('Invalid sitemap size');
const current = {};
for (const value of urls) {
  const url = new URL(value);
  if (url.origin !== origin || url.search || url.hash || !/^\/(?:[a-z0-9-]+\/)*$/.test(url.pathname)) throw new Error('Noncanonical URL in sitemap');
  const html = await readFile(path.join(root, 'dist', url.pathname, 'index.html'));
  current[value] = createHash('sha256').update(html).digest('hex');
}
async function save() {
  await mkdir(path.dirname(stateFile), { recursive: true });
  await writeFile(stateFile + '.tmp', JSON.stringify({ origin, pages: current }, null, 2));
  await rename(stateFile + '.tmp', stateFile);
}
if (mode === '--initialize') {
  // A fresh checkout starts with a baseline instead of repeatedly notifying old URLs.
  try { await readFile(stateFile); console.log('IndexNow baseline already exists; retained.'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; await save(); console.log(`Initialized IndexNow baseline: ${urls.length} pages; nothing submitted.`); }
} else {
  let previous;
  try { previous = JSON.parse(await readFile(stateFile, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; throw new Error('Missing IndexNow baseline. Run the build, then node scripts/indexnow.mjs --initialize before the next site change.'); }
  if (previous.origin !== origin || !previous.pages || typeof previous.pages !== 'object' || Array.isArray(previous.pages)) throw new Error('Invalid IndexNow baseline');
  const changed = [...new Set([...Object.keys(current), ...Object.keys(previous.pages)])].filter(url => current[url] !== previous.pages[url]);
  for (const value of changed) {
    const url = new URL(value);
    if (url.origin !== origin || url.search || url.hash || !/^\/(?:[a-z0-9-]+\/)*$/.test(url.pathname)) throw new Error('Invalid URL in IndexNow baseline');
  }
  if (!changed.length) console.log('IndexNow: no changed URLs; nothing submitted.');
  else if (mode === '--dry-run') console.log(JSON.stringify({ changedUrls: changed }, null, 2));
  else {
    if (changed.length > 10000) throw new Error('Too many changed URLs');
    const keyLocation = `${origin}/${key}.txt`;
    const proof = await fetch(keyLocation, { redirect: 'error', signal: AbortSignal.timeout(15000) });
    if (!proof.ok || (await proof.text()).trim() !== key) throw new Error('IndexNow verification file is not deployed correctly');
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, redirect: 'error',
      body: JSON.stringify({ host: new URL(origin).host, key, keyLocation, urlList: changed }),
      signal: AbortSignal.timeout(20000),
    });
    if (![200, 202].includes(response.status)) throw new Error(`IndexNow HTTP ${response.status}; baseline retained for retry`);
    await save();
    console.log(`IndexNow HTTP ${response.status}: ${changed.length} changed URLs received${response.status === 202 ? '; key validation pending' : ''}. This is not confirmation of indexing.`);
  }
}
