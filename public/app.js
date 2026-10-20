import {display,t,translatePage,setDisplay,setLabel} from './display.js';
const tabs = [...document.querySelectorAll('.demo-tabs [data-scene]')];
const panel = document.querySelector('#demo-panel');
const frame = document.querySelector('#product-frame');
frame.src = `product/index.html?lang=${display.language}&theme=${display.theme}`;
const descriptions = {
  welcome: ['从第一次见面开始。', '认识 Pi Bot，了解它怎样在你的电脑上工作。'],
  presets: ['先选职业，再见队友。', '按职业选择内置 Bot 和群聊，预览后创建你的团队。'],
  main: ['从一句话开始。', '和 Pi 私聊，也可以从侧栏找到其他 Bot 与群聊。'],
  team: ['有专长，也有协作。', '私聊深入，拉群分工；任务有独立线程，结果回到同一个地方。'],
  plan: ['先想清楚，再动手。', '只规划模式下 Bot 只看和分析；计划、子任务和用量都在右侧「任务」里。'],
  browser: ['看得见，也接得住。', '查看 Bot 的独立浏览器；需要登录或手动操作时接管，再交还继续。'],
  teach: ['照做一遍，它就学会了。', '在 Bot 浏览器里操作一次，检查记下的步骤，再整理成可以反复使用的技能。'],
  changes: ['每一处改动，都由你把关。', '查看 Git 改动、diff 与提交记录，批注后交给 Bot 审查。'],
  preview: ['文件，就地打开。', 'Bot 交付的表格、文档和提纲，在侧栏多标签预览，不用切换应用。'],
  connectors: ['接上你常用的应用。', 'GitHub、Notion、Figma、本机日历与通讯录，授权在本机完成；也能导入自定义 MCP。'],
  memory: ['越用，越懂你。', '每个 Bot 的技能和记忆都能查看；记下什么、要不要先问你，由你决定。'],
  inbox: ['轮到你决定时，集中看。', '审批、记忆提议和错过的任务，处理后可到记录中回看。'],
  routine: ['一次约定，按时执行。', '查看后台状态、今天的时间轴、触发规则与最近运行结果。'],
  audit: ['少一点猜测，多一份记录。', '按 Bot 和类型筛选，展开核对授权来源、执行过程与结果。'],
  yolo: ['什么时候放手，由你决定。', '从对话菜单开启 YOLO；自动放行也会留下操作记录。'],
};
let currentScene = 'welcome';
let frameReady = false;
function selectScene(key, send = true) {
  if (!descriptions[key]) return;
  currentScene = key;
  panel.dataset.mode = key;
  panel.setAttribute('aria-labelledby', `tab-${key}`);
  const index = tabs.findIndex(tab => tab.dataset.scene === key);
  tabs.forEach(tab => { const active = tab.dataset.scene === key; tab.setAttribute('aria-selected', String(active));tab.tabIndex = active ? 0 : -1; });
  document.querySelector('#tour-position').textContent = `${String(index + 1).padStart(2, '0')} / ${tabs.length}`;
  document.querySelector('#tour-previous').disabled = index === 0;
  document.querySelector('#tour-next').disabled = index === tabs.length - 1;
  document.querySelector('#tour-open').href = `product/index.html?scene=${key}&lang=${display.language}&theme=${display.theme}`;
  const caption = document.querySelector('#scene-explainer');
  caption.replaceChildren();
  const heading = document.createElement('strong'); heading.textContent = t(descriptions[key][0]);
  const copy = document.createElement('span'); copy.textContent = t(descriptions[key][1]);
  caption.append(heading, copy);
  if (send && frameReady) frame.contentWindow.postMessage({type:'pi-product-scene',scene:key},location.origin);
}
window.addEventListener('message', event => {
  if (event.source !== frame.contentWindow || event.origin !== location.origin) return;
  if (event.data?.type === 'pi-product-ready') {frameReady = true; syncDisplay(); selectScene(currentScene);}
  if (event.data?.type === 'pi-product-selected') selectScene(event.data.scene, false);
  if (event.data?.type === 'pi-product-display-changed') setDisplay(event.data.display);
});
new ResizeObserver(() => {
  const width = panel.clientWidth;
  const logicalWidth = Math.max(960, width);
  const scale = width / logicalWidth;
  frame.style.width = `${logicalWidth}px`;
  frame.style.transform = `scale(${scale})`;
  panel.style.height = `${680 * scale}px`;
}).observe(panel);
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectScene(tab.dataset.scene));
  tab.addEventListener('keydown', event => {
    const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : undefined;
    if (next === undefined) return;
    event.preventDefault();tabs[next].focus();selectScene(tabs[next].dataset.scene);
  });
});
for (const [id, direction] of [['tour-previous',-1],['tour-next',1]]) document.querySelector(`#${id}`).addEventListener('click', () => {
  const index = tabs.findIndex(tab => tab.dataset.scene === currentScene);
  const next = tabs[index + direction];if (next) selectScene(next.dataset.scene);
});
document.addEventListener('click', event => {
  const jump = event.target.closest('[data-demo-target]');
  if (jump) {selectScene(jump.dataset.demoTarget);document.querySelector('#playground').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});}
});
selectScene('welcome');

const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  setLabel(menuToggle,'打开导航');
  mobileNav.hidden = true;
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!open));
  setLabel(menuToggle,open ? '打开导航' : '关闭导航');
  mobileNav.hidden = open;
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });

const releaseDialog = document.querySelector('#release-dialog');
let releaseConfig;
const configReady = fetch('releases.json', { cache: 'no-store', signal: AbortSignal.timeout(5000) })
  .then(response => { if (!response.ok) throw new Error('Release configuration unavailable'); return response.json(); })
  .then(config => {
    releaseConfig = config;
    renderRelease();
  }).catch(() => { /* Fail closed: unavailable config never enables a download. */ });

function renderRelease() {
  if (!releaseConfig) return;
  document.querySelectorAll('[data-platform]').forEach(button => {
    const platform=releaseConfig.platforms?.[button.dataset.platform];
    if (!downloadURL(platform?.url)) return;
    button.querySelector('small').textContent=t(platform.detail||'下载应用');
    button.querySelector('.platform-arrow').textContent='↓';
    setLabel(button,'下载 Pi Bot {platform}',{platform:platform.label});
  });
  if (Object.values(releaseConfig.platforms||{}).some(platform=>downloadURL(platform.url))) {
    document.querySelector('#release-summary').textContent=t('Pi Bot {version} 已发布。选择你的平台，认识新队友。',{version:releaseConfig.version||''});
    document.querySelector('.download-status').replaceChildren(Object.assign(document.createElement('span'),{className:'status-dot'}),document.createTextNode(t('安装前请查看对应平台的系统要求')));
    document.querySelector('.download-note').textContent=t('点击下载，或查看对应平台的发布状态');
    const pill=document.querySelector('.release-pill');
    pill.replaceChildren(Object.assign(document.createElement('span'),{className:'status-dot'}),document.createTextNode(' '+t('你的 AI 新队友')+' '),Object.assign(document.createElement('span'),{className:'pill-divider'}),document.createTextNode(' '+t('现已登场')+' ↗'));
    document.querySelector('.platform-note').lastChild.textContent=t('桌面应用 · 现已发布');
    document.querySelector('#faq details p').textContent=t('Pi Bot 已开放部分或全部平台下载。请在上方下载区选择操作系统，查看安装包和对应平台状态。');
  }
  if (releaseDialog.open) renderReleaseDialog();
}
let dialogPlatform='';
function renderReleaseDialog() {
  document.querySelector('#dialog-description').textContent=t('Pi Bot 的 {platform} 版本尚未开放下载。我们正在打磨桌面体验，正式发布后，你可以直接在这里获取安装包。',{platform:dialogPlatform});
}
function syncDisplay() {
  if(frameReady) frame.contentWindow.postMessage({type:'pi-product-display',display:{language:display.language,theme:display.theme}},location.origin);
}
document.addEventListener('pi-display-change',()=>{
  selectScene(currentScene,false); renderRelease();syncDisplay();
  setLabel(menuToggle,menuToggle.getAttribute('aria-expanded')==='true'?'关闭导航':'打开导航');
});

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
document.querySelector('#year').textContent = new Date().getFullYear();
