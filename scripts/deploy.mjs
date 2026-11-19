import { spawnSync } from 'node:child_process';
function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status ?? result.signal})`);
}
run(process.execPath, ['scripts/build.mjs']);
run('wrangler', ['deploy']);
try { run(process.execPath, ['scripts/indexnow.mjs', '--submit']); }
catch (error) { console.warn(`Website deployed; IndexNow notification was not completed: ${error.message}. Retry with pnpm search:notify.`); }
