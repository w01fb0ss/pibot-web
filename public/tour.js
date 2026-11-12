import {display,t,setDisplay} from './display.js';
import './site.js';
const tabs = [...document.querySelectorAll('.demo-tabs [data-scene]')];
const tabStrip = document.querySelector('.demo-tabs');
const tabWrap = document.querySelector('.demo-tabs-wrap');
const panel = document.querySelector('#demo-panel');
const frame = document.querySelector('#product-frame');
const firstScene = new URLSearchParams(location.search).get('scene');
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
  connectors: ['接上你常用的应用。', '本机日历和通讯录在「应用」里连接；MCP、技能和知识库各有分页，授权都在本机完成。'],
  memory: ['每个 Bot，各有所长。', '每个 Bot 的技能、常用计划和能用的连接，都在它的资料里。'],
  devices: ['手机和执行端，一页看清。', '已配对的手机和执行端：在线状态、连接方式、手机开放了哪些数据，以及哪些 Bot 能在电脑离线时用手机直接回复。'],
  inbox: ['轮到你决定时，集中看。', '审批、记忆提议和错过的任务，处理后可到记录中回看。'],
  routine: ['一次约定，按时执行。', '查看后台状态、今天的时间轴、触发规则与最近运行结果。'],
  audit: ['少一点猜测，多一份记录。', '按 Bot 和类型筛选，展开核对授权来源、执行过程与结果。'],
  yolo: ['什么时候放手，由你决定。', '从对话菜单开启 YOLO；自动放行也会留下操作记录。'],
};
let currentScene = descriptions[firstScene] ? firstScene : 'welcome';
let frameReady = false;
function selectScene(key, send = true) {
  if (!descriptions[key]) return;
  currentScene = key;
  panel.dataset.mode = key;
  panel.setAttribute('aria-labelledby', `tab-${key}`);
  const index = tabs.findIndex(tab => tab.dataset.scene === key);
  tabs.forEach(tab => { const active = tab.dataset.scene === key; tab.setAttribute('aria-selected', String(active));tab.tabIndex = active ? 0 : -1; });
  revealTab(tabs[index]);
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
function syncDisplay() {
  if(frameReady) frame.contentWindow.postMessage({type:'pi-product-display',display:{language:display.language,theme:display.theme}},location.origin);
}
document.addEventListener('pi-display-change',()=>{ selectScene(currentScene,false); syncDisplay(); });

// Tabs scroll in one row: arrows step through, and the chosen scene is kept in view.
function syncTabEdges() {
  const max = tabStrip.scrollWidth - tabStrip.clientWidth;
  tabWrap.classList.toggle('can-start', tabStrip.scrollLeft > 2);
  tabWrap.classList.toggle('can-end', tabStrip.scrollLeft < max - 2);
}
function revealTab(tab) {
  if (!tab) return;
  const left = tab.offsetLeft - (tabStrip.clientWidth - tab.offsetWidth) / 2;
  tabStrip.scrollTo({ left, behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth' });
}
tabStrip.addEventListener('scroll', syncTabEdges, { passive: true });
addEventListener('resize', syncTabEdges);
document.querySelectorAll('[data-tabs-step]').forEach(button => button.addEventListener('click', () => {
  tabStrip.scrollBy({ left: Number(button.dataset.tabsStep) * tabStrip.clientWidth * 0.7, behavior: 'smooth' });
}));
selectScene(currentScene);
syncTabEdges();
