import { readFileSync } from 'node:fs';

const sourceRepository = 'https://github.com/w01fb0ss/PiBot';

export function productIdentity(config, lang, escape) {
  if (!/^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(config.version)) throw new Error('Invalid public release version');
  const version = escape(config.version);
  const en = lang === 'en';
  const prefix = en ? '/en' : '/cn';
  const link = (route, label) => `<a href="${prefix}${route}">${label}</a>`;
  const section = (title, body) => `<section class="reading-section"><h2>${title}</h2>${body}</section>`;
  const about = {
    route: '/about/',
    title: en ? 'About Pi Bot | Official product identity and links' : '关于 Pi Bot｜产品介绍与官方入口',
    heading: en ? 'About Pi Bot' : '关于 Pi Bot',
    description: en
      ? 'Pi Bot is an open-source multi-agent desktop app for macOS, Windows, and Linux. Find its GitHub source, official downloads, and user guides.'
      : 'Pi Bot 是在自己电脑上运行的开源多 Bot 协作桌面应用，支持 macOS、Windows 和 Linux。这里提供 GitHub 源码、官方下载和使用指南。',
    body: en ? [
      section('Which Pi Bot is this?', '<p>This site describes Pi Bot, the desktop app at <strong>pibot.space</strong>. You create named Bots, give them work in private or group chats, and review permissions, task progress, file changes, and activity logs.</p><p>The desktop app works on its own after you configure a model. An Android phone and a Runner on another computer are optional connections.</p>'),
      section('Official product links', `<ul><li>${link('/', 'Official website')}</li><li>${link('/download/', 'Download installers')}</li><li>${link('/guides/', 'User manual with screenshots')}</li><li>${link('/releases/', 'Public releases')}</li><li>${link('/guides/updates-and-data/', 'Updates, data, and issue reports')}</li></ul><p>Products and projects may share the name Pi Bot or PiBot. Use the domain, download links, and app screenshots above to identify this product.</p>`),
      section('Public release and source links', `<p>The current public release is <strong>v${version}</strong>. The download page lists the available desktop, Android, and Runner installers.</p><p>Pi Bot is open source under the <a href="${sourceRepository}/blob/main/LICENSE">Apache 2.0 license</a>. View the <a href="${sourceRepository}">official Pi Bot source code on GitHub</a>.</p>`),
      section('Where the work and data live', `<p>Chat history, settings, memory, and activity records are stored on your computer. Online model providers receive the content needed for your selected model; using a local model and connecting external services have different data boundaries.</p><p>${link('/guides/privacy-and-security/', 'Read the data flow and security guide')} and ${link('/guides/approvals-and-permissions/', 'learn how permissions and approvals work')}.</p>`),
    ].join('') : [
      section('这是哪个 Pi Bot？', '<p>本站介绍的是官方域名为 <strong>pibot.space</strong> 的 Pi Bot 桌面应用。你可以创建有名字的 Bot，在私聊或群聊中派活，并查看权限、任务进度、文件改动和操作记录。</p><p>桌面应用配置模型后即可独立使用。Android 手机和另一台电脑上的执行端都是按需连接的设备。</p>'),
      section('官方产品入口', `<ul><li>${link('/', '官方网站')}</li><li>${link('/download/', '下载安装包')}</li><li>${link('/guides/', '带截图的使用手册')}</li><li>${link('/releases/', '公开版本与发布说明')}</li><li>${link('/guides/updates-and-data/', '更新、数据与问题反馈')}</li></ul><p>网络上可能存在同样叫 Pi Bot 或 PiBot 的产品、项目。请结合这里列出的域名、下载链接和应用界面辨认本站产品。</p>`),
      section('公开版本与源码入口', `<p>当前公开版本为 <strong>v${version}</strong>。下载页列出桌面版、Android 手机版和执行端的安装包。</p><p>Pi Bot 采用 <a href="${sourceRepository}/blob/main/LICENSE">Apache 2.0 许可证</a>开源。你可以在 GitHub 查看 <a href="${sourceRepository}">Pi Bot 官方源码</a>。</p>`),
      section('任务和数据在哪里运行？', `<p>聊天记录、设置、记忆和操作记录保存在你的电脑上。使用在线模型时，完成任务所需的内容会发给你选定的模型服务商；使用本地模型、连接外部应用时的数据边界各不相同。</p><p>${link('/guides/privacy-and-security/', '查看数据流转与隐私说明')}，以及${link('/guides/approvals-and-permissions/', '了解权限与审批如何工作')}。</p>`),
    ].join(''),
    schema: { '@type': 'SoftwareApplication', '@id': 'https://pibot.space/#desktop-app', name: 'Pi Bot', alternateName: 'PiBot', url: `https://pibot.space${prefix}/`, operatingSystem: 'macOS, Windows, Linux', applicationCategory: 'ProductivityApplication', softwareVersion: config.version, installUrl: `https://pibot.space${prefix}/download/` },
  };
  const releases = releaseHistoryPage(config, lang, escape, link);
  return [about, releases];
}

const history = JSON.parse(readFileSync(new URL('../public/release-history.json', import.meta.url), 'utf8')).releases;

export function publicReleaseHistory(config) {
  // History is newest-first. A prepared release stays out of the site until it is current.
  const current = history.findIndex(release => release.version === config.version);
  const hasReleaseDate = release => /^\d{4}-\d{2}-\d{2}$/.test(release.date);
  if (current < 0 || !hasReleaseDate(history[current])) {
    throw new Error('The current public release needs a dated history entry');
  }
  return history.slice(current).filter(release =>
    /^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(release.version) && hasReleaseDate(release));
}


/** /releases/: the current version, the update path between versions and every version's notes. */
function releaseHistoryPage(config, lang, escape, link) {
  const en = lang === 'en';
  const t = en ? {
    title: 'Pi Bot releases | Update path and what changed', heading: 'Pi Bot releases',
    description: 'What each Pi Bot version changed and how to update from the one before. Includes highlights from the app’s release notes.',
    released: 'released', kinds: { fix: 'Urgent fix', feature: 'Feature release', beta: 'Public beta', first: 'First public release' },
    parts: { desktop: 'Desktop', android: 'Android', runner: 'Runner' },
    platforms: 'macOS / Windows / Linux', updatedHere: 'Updated in this version', unchanged: (v) => `Unchanged · works with desktop ${v}`,
    installed: 'Already installed: <b>menu › Check for updates</b> updates in the app', fresh: 'First install:', download: 'Go to downloads',
    manualInstall: 'To install or upgrade, download the installer for your platform.',
    manualEdge: (version) => `<b>From v${version}: download and run the installer for your platform.</b>`,
    notesLink: 'What changed ↓', path: 'Update path', updates: 'Updated: ', unchangedRest: (xs) => `${xs} unchanged.`, firstOf: (xs) => `First public release: ${xs}.`,
    edge: (r) => `<b>From v${r.from.version}: in-app update, one step.</b> ${r.from.downloadMB?.windows ? `Windows downloads only the changed parts (about ${r.from.downloadMB.windows} MB of ${r.from.fullMB.windows} MB); ` : ''}macOS downloads the full update once (about ${r.from.downloadMB?.mac ?? '—'} MB) and only changed parts after that. Your data stays.`,
    footnote: 'This history is updated with every release.',
  } : {
    title: 'Pi Bot 版本记录｜更新路径与每个版本的更新内容', heading: 'Pi Bot 版本记录',
    description: '每个版本更新了什么、从哪个版本怎么升级上来。收录应用发布说明中的主要改动。',
    released: '发布', kinds: { fix: '紧急修复', feature: '功能版本', beta: '公开测试版', first: '首个公开版本' },
    parts: { desktop: '桌面版', android: 'Android 手机版', runner: '执行端' },
    platforms: 'macOS / Windows / Linux', updatedHere: '本次更新', unchanged: (v) => `未变 · 与桌面 ${v} 兼容`,
    installed: '已安装 Pi Bot：<b>菜单 › 检查更新</b>，应用内直接升级', fresh: '第一次安装：', download: '前往下载页',
    manualInstall: '安装或升级时，从下载页选择对应平台的安装包。',
    manualEdge: (version) => `<b>从 v${version} 升级：下载对应平台的安装包并运行。</b>`,
    notesLink: '查看本次更新内容 ↓', path: '更新路径', updates: '更新：', unchangedRest: (xs) => `${xs}不变。`, firstOf: (xs) => `首次公开：${xs}。`,
    edge: (r) => `<b>从 v${r.from.version} 升级：应用内更新，一步到达。</b>${r.from.downloadMB?.windows ? `Windows 只下载变化的部分（约 ${r.from.downloadMB.windows} MB / 完整 ${r.from.fullMB.windows} MB）；` : ''}macOS 首次应用内更新下载完整包（约 ${r.from.downloadMB?.mac ?? '—'} MB），之后只下载变化部分。数据保留。`,
    footnote: '版本记录会随每次发布更新。',
  };
  const list = publicReleaseHistory(config);
  const current = list[0];
  const sep = en ? ', ' : '、';
  const badge = (r) => `<span class="rh-badge rh-${escape(r.kind === 'beta' ? 'feature' : r.kind)}">${escape(t.kinds[r.kind] ?? r.kind)}</span>`;
  const partNames = (keys) => keys.map((k) => t.parts[k]).join(sep);
  const parts = Object.entries(current.components).map(([key, version]) => {
    const updated = current.updated.includes(key);
    return `<div class="rh-part${updated ? ' rh-new' : ''}"><b>${t.parts[key]} ${escape(version)}</b><span>${updated ? `${t.updatedHere}${key === 'desktop' ? ` · ${t.platforms}` : ''}` : escape(t.unchanged(current.components.desktop))}</span></div>`;
  }).join('');
  const upgradeRoute = current.from?.inApp === false
    ? `<span>${t.manualInstall}</span><span>${link('/download/', t.download)}</span>`
    : `<span>${t.installed}</span><span>${t.fresh} ${link('/download/', t.download)}</span>`;
  const nodes = list.map((r, index) => `<li class="rh-node${index ? ' rh-old' : ''}"><a href="#v${escape(r.version)}">v${escape(r.version)}</a> ${badge(r)} <span class="rh-meta">${escape(r.date)} · ${escape(partNames(r.updated))}</span>${r.from ? `<p class="rh-edge">${r.from.inApp ? t.edge(r) : t.manualEdge(escape(r.from.version))}</p>` : ''}</li>`).join('');
  const notesLanguage = en ? 'en' : 'zh';
  const noteList = (items) => `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
  const notes = ({ version, notes }) => {
    if (!notes.sections) return noteList((notes[notesLanguage] ?? []).map(escape));
    const groups = notes.sections.map(({ title, items }, index) => ({
      id: `v${escape(version)}-category-${index + 1}`,
      title: escape(title[notesLanguage]),
      items,
    }));
    const label = en ? 'Browse by feature' : '按功能浏览';
    const links = groups.map(({ id, title }) => `<a href="#${id}">${title}</a>`).join('');
    const categories = `<nav class="rh-categories" aria-label="${label}"><p>${label}</p><div>${links}</div></nav>`;
    const sections = groups.map(({ id, title, items }) => {
      const lines = items.map((item) => {
        const body = escape(item[notesLanguage]);
        if (!item.pullRequest) return body;
        const { number, author } = item.pullRequest;
        return `${body} <a href="${sourceRepository}/pull/${escape(String(number))}">#${escape(String(number))} · @${escape(author)}</a>`;
      });
      return `<section class="rh-note-section" id="${id}"><h3>${title}</h3>${noteList(lines)}</section>`;
    });
    return `<p class="rh-intro">${escape(notes.introduction[notesLanguage])}</p>${categories}${sections.join('')}`;
  };
  const scope = (r) => {
    const rest = Object.keys(r.components).filter((k) => !r.updated.includes(k));
    return r.kind === 'first' ? t.firstOf(partNames(r.updated)) : `${t.updates}${partNames(r.updated)}${rest.length ? (en ? '. ' : '。') + t.unchangedRest(partNames(rest)) : ''}`;
  };
  const versions = list.map((r, index) => {
    const head = `<h2>v${escape(r.version)} ${badge(r)} <span class="rh-meta">${escape(r.date)}</span></h2>`;
    const body = `<p class="rh-updated">${escape(scope(r))}</p>${notes(r)}`;
    return index === 0
      ? `<section class="rh-version" id="v${escape(r.version)}">${head}${body}</section>`
      : `<details class="rh-version" id="v${escape(r.version)}"><summary>${head}</summary>${body}</details>`;
  }).join('');
  return {
    route: '/releases/', title: t.title, heading: t.heading, description: t.description,
    body: `<section class="rh-current" aria-label="${escape(t.heading)}">
      <div class="rh-top"><span class="rh-ver">v${escape(current.version)}</span>${badge(current)}<span class="rh-meta">${escape(current.date)} ${t.released}</span></div>
      <div class="rh-parts">${parts}</div>
      <div class="rh-get">${upgradeRoute}<a href="#v${escape(current.version)}">${t.notesLink}</a></div>
    </section>
    <section class="reading-section"><h2>${t.path}</h2><ol class="rh-path">${nodes}</ol></section>
    ${versions}
    <p class="rh-note">${t.footnote}</p>`,
  };
}
