import path from 'node:path';
import { readFile, writeFile, readdir, cp } from 'node:fs/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { syncTheme } from './sync-theme.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const app = path.resolve(process.argv[2] || '../PiBot');
await syncTheme(app);
const require = createRequire(path.join(app, 'apps/desktop/package.json'));
const { build } = await import(pathToFileURL(require.resolve('vite')));
const records = new Map();
const builtin = path.join(app, 'packages/brain/builtin');
for (const language of ['zh','en']) {
const zh = value => typeof value === 'string' ? value : value?.[language] || '';
const roles = [];
for (const directory of await readdir(path.join(builtin, 'roles'))) {
  if (!directory.endsWith('.pibot')) continue;
  const { bots: [bot] } = JSON.parse(await readFile(path.join(builtin, 'roles', directory, 'team.json'), 'utf8'));
  roles.push({id:bot.ref,version:bot.role.version,category:bot.role.category,name:zh(bot.role.name),defaultBotName:zh(bot.name),summary:zh(bot.description),persona:'',norms:'',avatar:{shape:bot.avatarShape,color:bot.avatarColor,eyes:bot.avatarEyes},botCategory:bot.category,permissionOverrides:bot.permissionOverrides||{},skills:[],quickPrompts:(bot.quickPrompts||[]).map(zh),needs:bot.needs,autoCheck:bot.autoCheck});
}
const groups = [];
for (const directory of await readdir(path.join(builtin, 'groups'))) {
  if (!directory.endsWith('.pibot')) continue;
  const { groups: [group] } = JSON.parse(await readFile(path.join(builtin, 'groups', directory, 'team.json'), 'utf8'));
  groups.push({id:group.template.id,version:group.template.version,name:zh(group.name),summary:zh(group.summary),coordinator:group.coordinator,members:group.members,announcement:zh(group.announcement),welcome:zh(group.welcome),quickStarts:(group.quickStarts||[]).map(zh),autoRoundLimit:group.autoRoundLimit});
}
const professions = JSON.parse(await readFile(path.join(builtin, 'professions.json'), 'utf8')).map(item=>({...item,name:zh(item.name),blurb:zh(item.blurb),quickStart:zh(item.quickStart)}));
await writeFile(path.join(root, language === 'zh' ? 'demo/catalog.json' : 'demo/catalog.en.json'), JSON.stringify({language,roles,groups,professions}));
}
await build({
  configFile: false, root: path.join(root, 'demo'), base: './',
  cacheDir: path.join(root, 'node_modules/.cache/product'),
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@pibot/ui/tokens.css?raw': path.join(app, 'packages/ui/src/tokens.css') + '?raw',
      '@pibot/ui/tokens.css': path.join(app, 'packages/ui/src/tokens.css'),
      '@app': path.join(app, 'apps/desktop/src/renderer'),
      '@pibot/ui': path.join(app, 'packages/ui/src/index.ts'),
      '@pibot/protocol': path.join(app, 'packages/protocol/src/index.ts'),
      '@pibot/i18n': path.join(app, 'packages/i18n/src/index.ts'),
      '@pibot/connectors-builtins': path.join(app, 'packages/connectors/src/builtins.ts'),
      'react-dom/client': require.resolve('react-dom/client'),
      'react-dom': require.resolve('react-dom'),
      'react/jsx-runtime': require.resolve('react/jsx-runtime'),
      'react': require.resolve('react'),
    },
  },
  assetsInclude: ['**/*.xlsx'],
  esbuild: { jsx: 'automatic' },
  plugins: [{
    name: 'product-demo-port', enforce: 'pre',
    resolveId(id, importer) {
      if (id.endsWith('/rpc.tsx') && importer?.startsWith(app)) return path.join(root, 'demo/rpc.tsx');
      if (id === '@pibot/ui/tokens.css') return path.join(app, 'packages/ui/src/tokens.css');
    },
    async load(id) {
      const file = id.split('?')[0];
      if (file.startsWith(app + '/') && !file.includes('/node_modules/')) {
        const source = await readFile(file);
        records.set(path.relative(app, file), createHash('sha256').update(source).digest('hex'));
      }
    },
  }],
  build: { outDir: path.join(root, 'public/product'), emptyOutDir: true, target: 'es2022', chunkSizeWarningLimit: 2000 },
});
// The Office viewer loads its parser runtime from ./ooxml at view time, as the desktop build does.
const ooxml = path.dirname(require.resolve('@silurus/ooxml/docx'));
await cp(ooxml, path.join(root, 'public/product/ooxml'), { recursive: true, filter: source => !source.includes(`${path.sep}types`) });
await writeFile(path.join(root, 'public/product/source-manifest.json'), JSON.stringify({
  source: 'PiBot real frontend components, styles and translations; demo replaces only the RPC adapter',
  files: [...records].sort(([a], [b]) => a.localeCompare(b)).map(([file, sha256]) => ({file, sha256})),
}, null, 2) + '\n');
console.log(`Bundled ${records.size} actual PiBot source files.`);
