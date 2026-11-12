import {display,t,setLabel} from './display.js';
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

// ---- Downloads: releases.json decides; an unavailable config never enables a download ----
const releaseDialog = document.querySelector('#release-dialog');
let releaseConfig;
const configReady = fetch('releases.json', { cache: 'no-store', signal: AbortSignal.timeout(5000) })
  .then(response => { if (!response.ok) throw new Error('Release configuration unavailable'); return response.json(); })
  .then(config => { releaseConfig = config; renderRelease(); })
  .catch(() => { /* Fail closed: unavailable config never enables a download. */ });
function renderRelease() {
  if (!releaseConfig) return;
  document.querySelectorAll('[data-platform]').forEach(button => {
    const platform=releaseConfig.platforms?.[button.dataset.platform];
    if (!downloadURL(platform?.url)) return;
    button.querySelector('small').textContent=t(platform.detail||'下载应用');
    button.querySelector('.platform-arrow').textContent='↓';
    setLabel(button,'下载 Pi Bot {platform}',{platform:t(platform.label)});
  });
  if (Object.values(releaseConfig.platforms||{}).some(platform=>downloadURL(platform.url))) {
    document.querySelector('#release-summary').textContent=t('Pi Bot {version} 已发布。选择你的平台，认识新队友。',{version:releaseConfig.version||''});
    document.querySelector('.download-status').replaceChildren(Object.assign(document.createElement('span'),{className:'status-dot'}),document.createTextNode(t('安装前请查看对应平台的系统要求')));
    document.querySelector('.download-note').textContent=t('点击下载，或查看对应平台的发布状态');
    const pill=document.querySelector('.release-pill');
    pill.replaceChildren(Object.assign(document.createElement('span'),{className:'status-dot'}),document.createTextNode(' '+t('你的 AI 新队友')+' '),Object.assign(document.createElement('span'),{className:'pill-divider'}),document.createTextNode(' '+t('现已登场')+' ↗'));
    document.querySelector('.platform-note').lastChild.textContent=t('现已发布');
    document.querySelector('.hero-actions .button').firstChild.textContent=t('获取 Pi Bot')+' ';
    document.querySelector('#faq details p').textContent=t('Pi Bot 已开放部分或全部平台下载。请在上方下载区选择操作系统，查看安装包和对应平台状态。');
  }
  if (releaseDialog.open) renderReleaseDialog();
}
let dialogPlatform='';
function renderReleaseDialog() {
  document.querySelector('#dialog-description').textContent=t('Pi Bot 的 {platform} 版本尚未开放下载。我们正在打磨体验，正式发布后，你可以直接在这里获取安装包。',{platform:t(dialogPlatform)});
}
function downloadURL(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value, document.baseURI);
    if (url.protocol === 'https:' || url.href.startsWith(new URL('downloads/', document.baseURI).href)) return url.href;
  } catch { return null; }
  return null;
}
document.querySelectorAll('[data-platform]').forEach(button => button.addEventListener('click', async () => {
  await configReady;
  const platform = releaseConfig?.platforms?.[button.dataset.platform];
  const url = downloadURL(platform?.url);
  if (url) { location.assign(url); return; }
  dialogPlatform = platform?.label || button.querySelector('b').textContent;
  renderReleaseDialog();
  releaseDialog.showModal();
}));
document.querySelector('.dialog-close').addEventListener('click', () => releaseDialog.close());
document.querySelector('#dialog-roadmap').addEventListener('click', () => releaseDialog.close());
releaseDialog.addEventListener('click', event => {
  const rect = releaseDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) releaseDialog.close();
});
document.addEventListener('pi-display-change',()=>{ syncShots(); showScene(flowScene); renderRelease(); });
