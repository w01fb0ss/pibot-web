import {display} from './display.js';
import {renderRelease} from './downloads.js';
import './site.js';

// ---- Real app screenshots: one file per language and theme ----
function syncShots() {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  const variant = `${display.language === 'en' ? 'en' : 'zh'}-${theme}`;
  document.querySelectorAll('picture[data-shot]').forEach(picture => {
    const base = `/assets/shots/${picture.dataset.shot}-${variant}`;
    picture.querySelector('source').srcset = `${base}.webp`;
    const img = picture.querySelector('img');
    if (!img.src.endsWith(`${base}.jpg`)) img.src = `${base}.jpg`;
  });
}
syncShots();

// ---- Data flow: one diagram per scenario, switched by the tabs ----
const flowTabs = [...document.querySelectorAll('.flow-tabs [data-flow]')];
const flowPanel = document.querySelector('#flow-panel');
function showScene(key, focus = false) {
  flowTabs.forEach(tab => {
    const active = tab.dataset.flow === key;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && focus) tab.focus();
  });
  flowPanel.setAttribute('aria-labelledby', `flow-tab-${key}`);
  flowPanel.querySelectorAll('[data-flow-text]').forEach(p => { p.hidden = p.dataset.flowText !== key; });
  // Unhiding restarts the step reveal (CSS, only when motion is allowed).
  flowPanel.querySelectorAll('[data-flow-diagram]').forEach(diagram => { diagram.hidden = diagram.dataset.flowDiagram !== key; });
  const active = flowTabs.find(tab => tab.dataset.flow === key);
  active?.parentElement.scrollTo({ left: active.offsetLeft - 16, behavior: 'instant' });
}
flowTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => showScene(tab.dataset.flow));
  tab.addEventListener('keydown', event => {
    const next = event.key === 'ArrowRight' ? (index + 1) % flowTabs.length : event.key === 'ArrowLeft' ? (index + flowTabs.length - 1) % flowTabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? flowTabs.length - 1 : undefined;
    if (next === undefined) return;
    event.preventDefault(); showScene(flowTabs[next].dataset.flow, true);
  });
});
// The first reveal waits until the diagram is on screen; without this class nothing animates.
const revealObserver = new IntersectionObserver(entries => {
  if (!entries.some(entry => entry.isIntersecting)) return;
  flowPanel.classList.add('in-view');
  revealObserver.disconnect();
}, { threshold: 0.25 });
revealObserver.observe(flowPanel);

// ---- Downloads: releases.json decides (downloads.js); re-render text that scripts own ----
document.addEventListener('pi-display-change',()=>{ syncShots(); renderRelease(); });
