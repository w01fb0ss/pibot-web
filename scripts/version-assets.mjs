import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Root CSS/JS files have no hash in their names. Copies under /v/<hash>/ are referenced from every
// page and cached for a year; any change to any of them yields a new folder, so a deploy is seen at
// once and a page never mixes old and new files. ES module imports stay relative inside the folder.
export async function versionRootAssets(output) {
  const names = (await readdir(output, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && /\.(css|js)$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  const hash = createHash('sha256');
  for (const name of names) hash.update(name).update('\0').update(await readFile(path.join(output, name)));
  const version = hash.digest('hex').slice(0, 12);
  const folder = path.join(output, 'v', version);
  await mkdir(folder, { recursive: true });
  for (const name of names) await cp(path.join(output, name), path.join(folder, name));
  const rooted = new Set(names);
  let pages = 0;
  for (const file of await htmlFiles(output)) {
    if (file.startsWith(path.join(output, 'v') + path.sep)) continue;
    const page = '/' + path.relative(output, file).split(path.sep).join('/');
    const before = await readFile(file, 'utf8');
    const after = before.replace(/\b(href|src)="([^"#?]+\.(?:css|js))"/g, (match, attribute, ref) => {
      if (/^[a-z]+:/i.test(ref) || ref.startsWith('//')) return match;
      const resolved = path.posix.resolve(path.posix.dirname(page), ref);
      const name = resolved.slice(1);
      return rooted.has(name) && !name.includes('/') ? `${attribute}="/v/${version}/${name}"` : match;
    });
    if (after !== before) {
      await writeFile(file, after);
      pages += 1;
    }
  }
  return { version, files: names.length, pages };
}

async function htmlFiles(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...(await htmlFiles(target)));
    else if (entry.name.endsWith('.html')) found.push(target);
  }
  return found;
}
