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
      ? 'Pi Bot at pibot.space is a multi-agent desktop app for macOS, Windows, and Linux, with optional Android and Runner connections. Check the official links and public release.'
      : 'Pi Bot（pibot.space）是在自己电脑上运行的多 Bot 协作桌面应用，支持 macOS、Windows 和 Linux，可按需配对 Android 手机与执行端。这里列出产品身份、官方入口和公开版本。',
    body: en ? [
      section('Which Pi Bot is this?', '<p>This site describes Pi Bot, the desktop app at <strong>pibot.space</strong>. You create named Bots, give them work in private or group chats, and review permissions, task progress, file changes, and activity logs.</p><p>The desktop app works on its own after you configure a model. An Android phone and a Runner on another computer are optional connections.</p>'),
      section('Official product links', `<ul><li>${link('/', 'Official website')}</li><li>${link('/download/', 'Installers and platform test status')}</li><li>${link('/guides/', 'User manual with screenshots')}</li><li>${link('/releases/', 'Public releases')}</li><li>${link('/guides/updates-and-data/', 'Updates, data, and issue reports')}</li></ul><p>Products and projects may share the name Pi Bot or PiBot. Use the domain, download links, and app screenshots above to identify this product.</p>`),
      section('Public release and source links', `<p>The current public release is <strong>v${version}</strong>. The download page lists the available desktop, Android, and Runner installers and their test status.</p><p>This page does not currently list a desktop app source repository. Source publication information will use an explicit official repository link; a website feedback repository is not the desktop app source repository.</p>`),
      section('Where the work and data live', `<p>Chat history, settings, memory, and activity records are stored on your computer. Online model providers receive the content needed for your selected model; using a local model and connecting external services have different data boundaries.</p><p>${link('/guides/privacy-and-security/', 'Read the data flow and security guide')} and ${link('/guides/approvals-and-permissions/', 'learn how permissions and approvals work')}.</p>`),
    ].join('') : [
      section('这是哪个 Pi Bot？', '<p>本站介绍的是官方域名为 <strong>pibot.space</strong> 的 Pi Bot 桌面应用。你可以创建有名字的 Bot，在私聊或群聊中派活，并查看权限、任务进度、文件改动和操作记录。</p><p>桌面应用配置模型后即可独立使用。Android 手机和另一台电脑上的执行端都是按需连接的设备。</p>'),
      section('官方产品入口', `<ul><li>${link('/', '官方网站')}</li><li>${link('/download/', '安装包与各平台测试状态')}</li><li>${link('/guides/', '带截图的使用手册')}</li><li>${link('/releases/', '公开版本与发布说明')}</li><li>${link('/guides/updates-and-data/', '更新、数据与问题反馈')}</li></ul><p>网络上可能存在同样叫 Pi Bot 或 PiBot 的产品、项目。请结合这里列出的域名、下载链接和应用界面辨认本站产品。</p>`),
      section('公开版本与源码入口', `<p>当前公开版本为 <strong>v${version}</strong>。下载页列出桌面版、Android 手机版和执行端的安装包及对应测试状态。</p><p>本页目前没有列出桌面应用源码仓库地址。源码发布信息会使用明确的官方仓库链接；网站反馈仓库不等同于桌面应用源码仓库。</p>`),
      section('任务和数据在哪里运行？', `<p>聊天记录、设置、记忆和操作记录保存在你的电脑上。使用在线模型时，完成任务所需的内容会发给你选定的模型服务商；使用本地模型、连接外部应用时的数据边界各不相同。</p><p>${link('/guides/privacy-and-security/', '查看数据流转与隐私说明')}，以及${link('/guides/approvals-and-permissions/', '了解权限与审批如何工作')}。</p>`),
    ].join(''),
    schema: { '@type': 'SoftwareApplication', '@id': 'https://pibot.space/#desktop-app', name: 'Pi Bot', alternateName: 'PiBot', url: `https://pibot.space${prefix}/`, operatingSystem: 'macOS, Windows, Linux', applicationCategory: 'ProductivityApplication', softwareVersion: config.version, installUrl: `https://pibot.space${prefix}/download/` },
  };
  const releases = {
    route: '/releases/', title: en ? 'Pi Bot public releases | Current version and platform status' : 'Pi Bot 公开版本｜当前版本与平台状态',
    heading: en ? 'Pi Bot public releases' : 'Pi Bot 公开版本',
    description: en ? `The current public Pi Bot release is v${version}. Check desktop, Android, and Runner download links and platform test status.` : `Pi Bot 当前公开版本为 v${version}。核对桌面版、Android 手机版和执行端的下载入口、平台测试状态与功能说明。`,
    body: en ? [
      section(`Current public release: v${version}`, `<p>This page shows the release currently offered on the official website. Installers and platform-specific test status are maintained on the ${link('/download/', 'download page')}.</p>`),
      section('What you can use', `<ul><li>Desktop: named Bots, private and group chats, model configuration, permissions, approvals, routines, and app connections.</li><li>Android: pair with the desktop app to view conversations, start tasks, and handle supported approvals.</li><li>Runner: connect another computer or server to run commands in its chosen working folder.</li></ul><p>${link('/guides/', 'Read the user manual')} for steps, screenshots, and limitations.</p>`),
      section('Before installing or updating', `<p>Choose the installer matching your operating system and processor. “Tested” applies to the platform and version shown on the download page. Read the macOS first-launch notice and keep your existing data before changing installations.</p><p>${link('/guides/getting-started/', 'Installation guide')} · ${link('/guides/updates-and-data/', 'Update and local data guide')}</p>`),
    ].join('') : [
      section(`当前公开版本：v${version}`, `<p>本页展示官网当前提供的公开版本。安装包和各平台的测试状态统一维护在${link('/download/', '下载页')}。</p>`),
      section('可以使用哪些内容？', `<ul><li>桌面版：创建有名字的 Bot，私聊与群聊、模型配置、权限与审批、例行任务和应用连接。</li><li>Android 手机版：与桌面应用配对，查看对话、发起任务、处理支持在手机上完成的审批。</li><li>执行端：连接另一台电脑或服务器，在选定的工作目录中运行命令。</li></ul><p>${link('/guides/', '查看使用手册')}，核对各功能的步骤、截图和使用限制。</p>`),
      section('安装或更新前', `<p>请选择与操作系统、处理器匹配的安装包。「已测试」只针对下载页标注的平台和版本。macOS 用户请先阅读首次打开提示，更换安装前请保留已有数据。</p><p>${link('/guides/getting-started/', '安装与首次使用')} · ${link('/guides/updates-and-data/', '更新与本地数据说明')}</p>`),
    ].join(''),
  };
  return [about, releases];
}
