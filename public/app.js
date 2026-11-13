import {display,t} from './display.js';
import {renderRelease} from './downloads.js';
import './site.js';

// ---- Real app screenshots: one file per language and theme ----
function syncShots() {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  const variant = `${display.language === 'en' ? 'en' : 'zh'}-${theme}`;
  document.querySelectorAll('picture[data-shot]').forEach(picture => {
    const base = `assets/shots/${picture.dataset.shot}-${variant}`;
    picture.querySelector('source').srcset = `${base}.webp`;
    const img = picture.querySelector('img');
    if (!img.src.endsWith(`${base}.jpg`)) img.src = `${base}.jpg`;
  });
}
syncShots();

// ---- Data flow: video scenes 0/7/14/21 s (a logo plays 28–32 s), synced with the tabs ----
const video = document.querySelector('#flow-video');
const still = document.querySelector('#flow-still');
const play = document.querySelector('#flow-play');
const flowTabs = [...document.querySelectorAll('.flow-tabs [data-flow]')];
const flowPanel = document.querySelector('#flow-panel');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let flowScene = 'runner';
let videoFailed = false;
let inView = false;
let userPaused = false;
const sceneAt = time => [...flowTabs].reverse().find(tab => time >= Number(tab.dataset.start))?.dataset.flow || 'phone';
function showScene(key, focus = false) {
  flowScene = key;
  flowTabs.forEach(tab => {
    const active = tab.dataset.flow === key;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && focus) tab.focus();
  });
  flowPanel.setAttribute('aria-labelledby', `flow-tab-${key}`);
  flowPanel.querySelectorAll('[data-flow-text]').forEach(p => { p.hidden = p.dataset.flowText !== key; });
  const active = flowTabs.find(tab => tab.dataset.flow === key);
  active?.parentElement.scrollTo({ left: active.offsetLeft - 16, behavior: 'instant' });
  still.querySelector('source').srcset = `assets/flow/${key}.webp`;
  const img = still.querySelector('img');
  img.src = `assets/flow/${key}.jpg`;
  img.alt = t('{scene}的数据流转图', { scene: t(active.querySelector('span').textContent) });
}
// Reduced motion or a video that cannot play: the scene's still image is the visual; the video
// stays one click away.
function useStill(on) {
  still.hidden = !on;
  play.hidden = !on || videoFailed;
  video.hidden = on;
}
function maybePlay() {
  if (videoFailed || reducedMotion.matches || userPaused || !inView) return;
  video.play().catch(() => {});
}
function selectFlow(key, focus = false) {
  showScene(key, focus);
  if (videoFailed) return;
  const start = Number(flowTabs.find(tab => tab.dataset.flow === key).dataset.start);
  try { video.currentTime = start; } catch { /* metadata not loaded yet; playback starts at 0 */ }
  if (!reducedMotion.matches || !video.hidden) { userPaused = false; inView = true; video.play().catch(() => {}); }
}
video.addEventListener('timeupdate', () => { if (video.paused) return; const key = sceneAt(video.currentTime); if (key !== flowScene) showScene(key); });
video.addEventListener('pause', () => { if (inView && !document.hidden) userPaused = true; });
video.addEventListener('play', () => { userPaused = false; });
video.addEventListener('error', () => { videoFailed = true; useStill(true); }, true);
video.querySelector('source').addEventListener('error', () => { videoFailed = true; useStill(true); });
play.addEventListener('click', () => { useStill(false); userPaused = false; inView = true; video.play().catch(() => {}); video.focus(); });
flowTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectFlow(tab.dataset.flow));
  tab.addEventListener('keydown', event => {
    const next = event.key === 'ArrowRight' ? (index + 1) % flowTabs.length : event.key === 'ArrowLeft' ? (index + flowTabs.length - 1) % flowTabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? flowTabs.length - 1 : undefined;
    if (next === undefined) return;
    event.preventDefault(); selectFlow(flowTabs[next].dataset.flow, true);
  });
});
useStill(reducedMotion.matches);
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) { video.pause(); useStill(true); } else { useStill(false); maybePlay(); } });
new IntersectionObserver(entries => {
  for (const entry of entries) {
    inView = entry.isIntersecting;
    // Pausing because it scrolled away is not the viewer's choice; keep autoplay allowed.
    if (inView) maybePlay(); else if (!video.paused) { video.pause(); userPaused = false; }
  }
}, { threshold: 0.5 }).observe(video.parentElement);

// ---- Downloads: releases.json decides (downloads.js); re-render text that scripts own ----
document.addEventListener('pi-display-change',()=>{ syncShots(); showScene(flowScene); renderRelease(); });
