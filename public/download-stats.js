import { display } from './display.js';
import { downloadStatsCopy, downloadStatsMarkup } from './download-stats-view.js';

const sections = [...document.querySelectorAll('[data-download-stats]')];
let data;
let failed = false;
let language;
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
    if (body && !body.children.length) for (const row of data.platforms) {
      const tr = document.createElement('tr');
      for (const value of [copy[row.product], `${platformNames[row.platform]} · ${row.arch === 'arm64' ? 'ARM64' : 'x64'}`, format.format(row.count)]) {
        const td = document.createElement('td'); td.textContent = value; tr.append(td);
      }
      body.append(tr);
    }
  }
  language = lang;
}

if (sections.length) {
  render();
  document.addEventListener('pi-display-change', render);
  fetch('/api/download-stats', { signal: AbortSignal.timeout(5000) })
    .then(async response => {
      if (!response.ok) throw new Error('download_stats_unavailable');
      const value = await response.json();
      if (!valid(value)) throw new Error('invalid_download_stats');
      data = value;
    })
    .catch(() => { failed = true; })
    .finally(render);
}
