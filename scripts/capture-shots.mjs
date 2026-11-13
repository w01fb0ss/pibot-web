// Regenerates public/assets/shots from the App's real front end in public/product (README).
// Drives the installed Chrome headless over the DevTools protocol (Node's built-in WebSocket),
// so no npm dependency is needed and Chrome itself encodes webp + jpg.
//
//   node scripts/capture-shots.mjs [--base http://127.0.0.1:4173] [--scenes team,plan] [--chrome <path>]
//
// Needs the local preview (npm run dev) on --base; it is started here when nothing answers.
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(`--${name}`); return index >= 0 ? args[index + 1] : fallback; };
const base = option('base', 'http://127.0.0.1:4173');
const chrome = option('chrome', process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
// One full App window per scene. The page shows the hero whole and crops the cards with
// object-fit/object-position, so a single size serves every slot; 1.5x keeps text sharp when a
// card zooms into part of the window on a 2x screen.
const window = { width: 1280, height: 800, scale: 1.5 };
const allScenes = ['team', 'plan', 'browser', 'preview', 'connectors', 'routine', 'computer', 'audit', 'memory'];
const scenes = option('scenes', allScenes.join(',')).split(',').filter(Boolean);
const output = path.join(root, 'public/assets/shots');
// A visitor's own step before the shot: the memory section sits below skills in the Bot panel.
const prepare = {
  memory: "document.querySelector('[data-memory-panel]')?.scrollIntoView({block:'start'})",
};

async function reachable(url) {
  try { return (await fetch(url, { signal: AbortSignal.timeout(2000) })).ok; } catch { return false; }
}

// Minimal DevTools client: one page target, request/response by id, events by method.
async function openPage(port) {
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let next = 0;
  const pending = new Map();
  const listeners = new Map();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
    } else if (message.method) listeners.get(message.method)?.forEach(listener => listener(message.params));
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++next;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const once = method => new Promise(resolve => {
    const list = listeners.get(method) || [];
    const listener = params => { list.splice(list.indexOf(listener), 1); resolve(params); };
    list.push(listener);
    listeners.set(method, list);
  });
  return { send, once, close: () => socket.close() };
}

async function main() {
  let server;
  if (!(await reachable(`${base}/product/index.html`))) {
    server = spawn(process.execPath, [path.join(root, 'scripts/serve.mjs')], { stdio: 'ignore' });
    for (let i = 0; i < 50 && !(await reachable(`${base}/product/index.html`)); i++) await sleep(100);
  }
  const profile = await mkdtemp(path.join(tmpdir(), 'pibot-shots-'));
  const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'], { stdio: 'ignore' });
  try {
    let port;
    for (let i = 0; i < 100 && !port; i++) {
      try { port = (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; } catch { await sleep(100); }
    }
    if (!port) throw new Error('Chrome did not start');
    const page = await openPage(port);
    await page.send('Page.enable');
    await page.send('Emulation.setDeviceMetricsOverride', { width: window.width, height: window.height, deviceScaleFactor: window.scale, mobile: false });
    // Settled frames: the App's own transitions honour reduced motion.
    await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await mkdir(output, { recursive: true });
    for (const scene of scenes) for (const lang of ['zh', 'en']) for (const theme of ['light', 'dark']) {
      await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }, { name: 'prefers-color-scheme', value: theme }] });
      const loaded = page.once('Page.loadEventFired');
      await page.send('Page.navigate', { url: `${base}/product/index.html?scene=${scene}&lang=${lang}&theme=${theme}` });
      await loaded;
      // The demo opens side panes and previews the way a visitor would (timers up to ~5 s).
      await sleep(scene === 'preview' ? 4500 : 2500);
      if (prepare[scene]) { await page.send('Runtime.evaluate', { expression: prepare[scene] }); await sleep(400); }
      await page.send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });
      const name = `${scene}-${lang}-${theme}`;
      for (const [format, extension] of [['webp', 'webp'], ['jpeg', 'jpg']]) {
        const { data } = await page.send('Page.captureScreenshot', { format, quality: 82, captureBeyondViewport: false });
        await writeFile(path.join(output, `${name}.${extension}`), Buffer.from(data, 'base64'));
      }
      console.log(`shot ${name}`);
    }
    page.close();
  } finally {
    browser.kill();
    server?.kill();
    await sleep(300);
    await rm(profile, { recursive: true, force: true });
  }
}

await main();
