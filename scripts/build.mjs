import { cp, mkdir, rm, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(await readFile(path.join(root, 'public/releases.json'), 'utf8'));
await stat(path.join(root, 'public/product/index.html'));
await stat(path.join(root, 'public/product/source-manifest.json'));
for (const platform of Object.values(config.platforms)) {
  if (!platform.url) continue;
  if (platform.url.startsWith('downloads/')) {
    const target = path.resolve(root, 'public', platform.url);
    if (!target.startsWith(path.join(root, 'public/downloads/')) || !(await stat(target)).isFile()) throw new Error('Invalid local download');
  } else if (!platform.url.startsWith('https://')) throw new Error('External downloads require HTTPS');
}
const output = path.join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, 'public'), output, { recursive: true, filter: source => !source.endsWith('.gitkeep') });
console.log('Built static website → dist/');
