import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildSearchPages } from './build-search-pages.mjs';
import { publicReleaseHistory } from './product-identity.mjs';
import { versionRootAssets } from './version-assets.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(await readFile(path.join(root, 'public/releases.json'), 'utf8'));
for (const platform of Object.values(config.platforms)) {
  if (!platform.url) continue;
  if (platform.url.startsWith('downloads/')) {
    const target = path.resolve(root, 'public', platform.url);
    if (!target.startsWith(path.join(root, 'public/downloads/')) || !(await stat(target)).isFile()) throw new Error('Invalid local download');
  } else if (!platform.url.startsWith('https://')) throw new Error('External downloads require HTTPS');
}
const releases = publicReleaseHistory(config);
const output = path.join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, 'public'), output, { recursive: true, filter: source => source !== path.join(root, 'public/release-history.json') && !source.endsWith('.gitkeep') && path.relative(path.join(root, 'public', 'product'), source).startsWith('..') });
const feedReleases = releases.map((release) => {
  const { notes } = release;
  if (!notes.sections) return release;
  const items = [notes.introduction, ...notes.sections.flatMap(({ items }) => items)];
  const flatNotes = Object.fromEntries(['zh', 'en'].map((lang) => [lang, items.map((item) => item[lang])]));
  return { ...release, notes: flatNotes };
});
await writeFile(path.join(output, 'release-history.json'), JSON.stringify({ releases: feedReleases }, null, 2) + '\n');
await buildSearchPages(output, config);
const versioned = await versionRootAssets(output);
console.log(`Versioned ${versioned.files} CSS/JS files as /v/${versioned.version}/ in ${versioned.pages} pages`);
// public/product is the screenshot source (README), not a page: the owner removed the tour (2026-11-12).
console.log('Built static website → dist/');
