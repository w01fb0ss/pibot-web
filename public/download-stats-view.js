export const downloadStatsCopy = {
  zh: {
    title: '官网下载点击', total: '全部版本累计点击', desktop: '桌面版', mobile: 'Android', runner: '执行端',
    version: '全部版本', loading: '正在读取统计…', unavailable: '统计暂不可用，下载不受影响。',
    note: '按官网下载按钮操作计数，下载器重试不会重复计入。累计含旧版的请求计数，页面在前台时每 5 秒同步。',
    details: '查看平台明细', product: '产品', platform: '平台与架构', count: '点击次数',
    more: '查看平台明细 ↗', period: '统计区间（UTC）', until: '至', empty: '暂无下载点击', unclassified: '未分类点击',
  },
  en: {
    title: 'Website download clicks', total: 'All-version clicks', desktop: 'Desktop', mobile: 'Android', runner: 'Runner',
    version: 'All versions', loading: 'Loading statistics…', unavailable: 'Statistics unavailable. Downloads still work.',
    note: 'Counts website download-button clicks and excludes retries by download tools. The total includes historical request counts and refreshes every 5 seconds while this page is visible.',
    details: 'View platform breakdown', product: 'Product', platform: 'Platform and architecture', count: 'Clicks',
    more: 'View platform breakdown ↗', period: 'Reporting period (UTC)', until: 'to', empty: 'No download clicks yet', unclassified: 'Unclassified clicks',
  },
};

export function downloadStatsMarkup(language, detailed = false) {
  const lang = language === 'en' ? 'en' : 'zh';
  const copy = downloadStatsCopy[lang];
  return `<header class="download-stats-heading"><h2>${copy.title}</h2><span class="download-stats-version" data-stats-version>${copy.version}</span></header>
    <dl class="download-stats-grid">
      <div class="download-stats-total"><dt>${copy.total}</dt><dd data-stats-count="total">—</dd></div>
      ${['desktop', 'mobile', 'runner'].map(product => `<div><dt>${copy[product]}</dt><dd data-stats-count="${product}">—</dd></div>`).join('')}
    </dl>
    <p class="download-stats-state" data-stats-state role="status">${copy.loading}</p>
    <p class="download-stats-note">${copy.note}</p>
    ${detailed ? `<details class="download-stats-details"><summary>${copy.details}</summary><div class="download-stats-table-wrap"><table><thead><tr><th scope="col">${copy.product}</th><th scope="col">${copy.platform}</th><th scope="col">${copy.count}</th></tr></thead><tbody data-stats-platforms></tbody></table></div></details>`
      : `<a class="download-stats-link" href="${lang === 'en' ? '/en' : ''}/download/#download-statistics">${copy.more}</a>`}`;
}
