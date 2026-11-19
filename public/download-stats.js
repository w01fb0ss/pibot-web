import { display } from './display.js';
import { downloadStatsCopy, downloadStatsMarkup } from './download-stats-view.js';

const sections = [...document.querySelectorAll('[data-download-stats]')];
const refreshInterval = 5000;
let data;
let failed = false;
let language;
let activeRequest;
let refreshTimer;
let suspended = false;
const platformNames = { darwin: 'macOS', win32: 'Windows', linux: 'Linux', android: 'Android' };
const products = ['desktop', 'mobile', 'runner'];

function valid(value) {
  const count = n => Number.isSafeInteger(n) && n >= 0;
  return value?.kind === 'download-clicks' && value.scope === 'all-versions' &&
    (value.from === null || /^\d{4}-\d{2}-\d{2}$/.test(value.from)) && /^\d{4}-\d{2}-\d{2}$/.test(value.through) &&
    count(value.total) && count(value.unclassified) && products.every(product => count(value.products?.[product])) &&
    value.total === products.reduce((sum, product) => sum + value.products[product], value.unclassified) &&
    Array.isArray(value.platforms) && value.platforms.length <= 8 &&
    value.platforms.every(row => products.includes(row.product) && Object.hasOwn(platformNames, row.platform) &&
      ['arm64', 'x64'].includes(row.arch) && count(row.count));
}

function render() {
  const lang = display.language === 'en' ? 'en' : 'zh';
  const copy = downloadStatsCopy[lang];
  const format = new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'zh-CN');
  for (const section of sections) {
    if (language !== lang || !section.querySelector('[data-stats-count]')) {
      const expanded = section.querySelector('details')?.open;
      section.innerHTML = downloadStatsMarkup(lang, section.dataset.downloadStats === 'detailed');
      if (expanded) section.querySelector('details').open = true;
    }
    section.setAttribute('aria-busy', String(!data && !failed));
    const state = section.querySelector('[data-stats-state]');
    state.textContent = failed ? copy.unavailable : data
      ? data.from ? `${copy.period} ${data.from} ${copy.until} ${data.through}${data.unclassified ? ` · ${copy.unclassified} ${format.format(data.unclassified)}` : ''}` : copy.empty : copy.loading;
    if (!data) continue;
    section.querySelectorAll('[data-stats-count]').forEach(node => {
      const key = node.dataset.statsCount;
      node.textContent = format.format(key === 'total' ? data.total : data.products[key]);
    });
    const body = section.querySelector('[data-stats-platforms]');
    if (body) {
      const rows = [];
      for (const row of data.platforms) {
        const tr = document.createElement('tr');
        for (const value of [copy[row.product], `${platformNames[row.platform]} · ${row.arch === 'arm64' ? 'ARM64' : 'x64'}`, format.format(row.count)]) {
          const td = document.createElement('td'); td.textContent = value; tr.append(td);
        }
        rows.push(tr);
      }
      body.replaceChildren(...rows);
    }
  }
  language = lang;
}

function scheduleRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = undefined;
  if (!suspended && document.visibilityState === 'visible')
    refreshTimer = setTimeout(refresh, refreshInterval);
}

async function refresh() {
  if (suspended || activeRequest || document.visibilityState !== 'visible') return;
  const controller = new AbortController();
  activeRequest = controller;
  try {
    // Each read must reach the live counter rather than a browser or edge-cache snapshot.
    const response = await fetch('/api/download-stats', {
      cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]),
    });
    if (!response.ok) throw new Error('download_stats_unavailable');
    const value = await response.json();
    if (!valid(value)) throw new Error('invalid_download_stats');
    data = value;
    failed = false;
  } catch {
    if (!controller.signal.aborted) failed = true;
  } finally {
    activeRequest = undefined;
    render();
    if (controller.signal.aborted && !suspended) refresh();
    else scheduleRefresh();
  }
}

if (sections.length) {
  render();
  document.addEventListener('pi-display-change', render);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refresh();
    else { clearTimeout(refreshTimer); refreshTimer = undefined; }
  });
  window.addEventListener('pagehide', () => {
    suspended = true;
    clearTimeout(refreshTimer);
    refreshTimer = undefined;
    activeRequest?.abort();
  });
  window.addEventListener('pageshow', () => { suspended = false; refresh(); });
  refresh();
}
