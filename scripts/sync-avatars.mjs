import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Read the app's actual component geometry and tokens; do not approximate the mascot.
const sourceRoot = process.argv[2];
if (!sourceRoot) throw new Error('Usage: node scripts/sync-avatars.mjs /absolute/path/to/PiBot');
const component = await readFile(path.join(sourceRoot, 'packages/ui/src/components/Avatar.tsx'), 'utf8');
const tokens = await readFile(path.join(sourceRoot, 'packages/ui/src/theme/tokens.css'), 'utf8');
const output = fileURLToPath(new URL('../public/assets/avatars/', import.meta.url));
await mkdir(output, { recursive: true });
const choices = [
  ['pi', 'blob', 'violet', 'marks'],
  ['researcher', 'pebble', 'blue', 'marks'],
  ['writer', 'flower', 'pink', 'marks'],
  ['steward', 'bean', 'teal', 'marks'],
];
const builtin = path.join(sourceRoot, 'packages/teams/builtin');
const roles = new Map();
for (const file of await readdir(path.join(builtin, 'roles'))) {
  if (!file.endsWith('.json') && !file.endsWith('.pibot')) continue;
  const source = JSON.parse(await readFile(path.join(builtin, 'roles', file, ...(file.endsWith('.pibot') ? ['team.json'] : [])), 'utf8'));
  const bot = source.bots?.[0];
  const role = bot ? { id: bot.ref, name: bot.name, roleName: bot.role.name, avatar: { shape: bot.avatarShape, color: bot.avatarColor, eyes: bot.avatarEyes } } : source;
  roles.set(role.id, role);
  choices.push([`role-${role.id}`, role.avatar.shape, role.avatar.color, role.avatar.eyes]);
}
if (!roles.size) throw new Error('No builtin roles found; refusing to create an empty catalog');
for (const [name, shape, color, eyeKind] of choices) {
  const shapeBlock = component.match(new RegExp(`\\b${shape}: \\{([\\s\\S]*?)\\}`))?.[1];
  const geometry = shapeBlock?.match(/d: "([^"]+)"/)?.[1];
  const ey = Number(shapeBlock?.match(/ey: (\d+)/)?.[1]);
  const ex = Number(shapeBlock?.match(/ex: (\d+)/)?.[1]);
  const token = color === 'violet' ? 'brand' : `avatar-${color}`;
  const fill = tokens.match(new RegExp(`--${token}: (#[0-9a-f]+);`, 'i'))?.[1];
  if (!geometry || !ey || !ex || !fill) throw new Error(`Avatar source contract changed: ${name}`);
  const eyes = [50 - ex, 50 + ex].map((x, i) => {
    const tilt = i === 0 ? -2 : 2;
    return `M${x + tilt} ${ey - 7} L${x - tilt} ${ey + 5}`;
  }).join(' ');
  const eyeInk = color === 'gray' ? '#141414' : '#ffffff';
  const eyeShape = eyeKind === 'marks' || eyeKind === 'sleepy'
    ? `<path d="${eyeKind === 'marks' ? eyes : [50 - ex, 50 + ex].map(x => `M${x - 6} ${ey} Q${x} ${ey + 5} ${x + 6} ${ey}`).join(' ')}" fill="none" stroke="${eyeInk}" stroke-width="${eyeKind === 'marks' ? 7 : 5}" stroke-linecap="round" stroke-linejoin="round"/>`
    : [50 - ex, 50 + ex].map(x => eyeKind === 'pixel'
      ? `<rect x="${x - 4.5}" y="${ey - 4.5}" width="9" height="9" fill="${eyeInk}"/>`
      : `<ellipse cx="${x}" cy="${ey}" rx="${eyeKind === 'oval' ? 4.5 : 5.5}" ry="${eyeKind === 'oval' ? 7 : 5.5}" fill="${eyeInk}"/>`).join('');
  await writeFile(path.join(output, `${name}.svg`), `<!-- Geometry and eyes from PiBot packages/ui/src/components/Avatar.tsx; colors from tokens.css. -->\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="${geometry}" fill="${fill}" stroke="${fill}" stroke-width="6" stroke-linejoin="round"/>${eyeShape}</svg>\n`);
}
console.log(`Synced ${choices.length} avatars from PiBot source.`);
