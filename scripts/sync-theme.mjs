import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export async function syncTheme(app) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const file = 'packages/ui/src/tokens.css';
  const source = await readFile(path.join(app, file), 'utf8');
  const iconFile = 'packages/ui/src/Icon.tsx';
  const iconSource = await readFile(path.join(app, iconFile), 'utf8');
  const icons = new Map([...iconSource.matchAll(/^\s+(\w+):\s*"([^"]+)"/gm)].map(match => [match[1], match[2]]));
  const htmlPath = path.join(root, 'public/index.html');
  const html = await readFile(htmlPath, 'utf8');
  await writeFile(htmlPath, html.replace(/(<span\b[^>]*data-pibot-icon="(\w+)"[^>]*>)[\s\S]*?<\/span>/g, (_, open, name) => {
    const d = icons.get(name);
    if (!d) throw new Error(`Missing PiBot icon: ${name}`);
    return `${open}<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${d}"/></svg></span>`;
  }));
  await writeFile(path.join(root, 'public/product-tokens.css'), source);
  await writeFile(path.join(root, 'public/theme-source.json'), JSON.stringify({
    file, sha256: createHash('sha256').update(source).digest('hex'),
    iconFile, iconSha256: createHash('sha256').update(iconSource).digest('hex'),
  }, null, 2) + '\n');
  console.log('Synced PiBot fonts, colors and radii.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await syncTheme(path.resolve(process.argv[2] || '../PiBot'));
}
