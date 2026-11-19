// Download cards (桌面 / 手机 / 执行端): one button per device opens a small platform menu.
// releases.json decides every link and status chip; an unavailable config never enables a download.
import {display, t} from './display.js';
import {recordDownloadClick} from './download-click.js';

const releaseDialog = document.querySelector('#release-dialog');
const macFirstOpen = document.querySelector('.mac-first-open');
const picks = [...document.querySelectorAll('.download-pick')];
const STATUS_TEXT = { tested: '已测试', testing: '测试中', untested: '未实机测试' };
let releaseConfig;
const downloadBase = new URL('/', location.origin);
const configReady = fetch('/releases.json', { cache: 'no-store', signal: AbortSignal.timeout(5000) })
  .then(response => { if (!response.ok) throw new Error('Release configuration unavailable'); return response.json(); })
  .then(config => { releaseConfig = config; renderRelease(); })
  .catch(() => { /* Fail closed: no config, no links and no status claims. */ });

function downloadURL(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value, downloadBase);
    if (url.protocol === 'https:' || url.href.startsWith(new URL('downloads/', downloadBase).href)) return url.href;
  } catch { return null; }
  return null;
}

// 「已测试」 belongs to the version it was run through on; once the site lists another version it
// reads 测试中 until someone re-tests and updates the entry's version.
function platformStatus(platform) {
  const status = Object.hasOwn(STATUS_TEXT, platform?.status) ? platform.status : 'untested';
  return status;
}

export function renderRelease() {
  if (!releaseConfig) return;
  macFirstOpen.hidden = releaseConfig.version !== macFirstOpen.dataset.releaseVersion ||
    !['mac-x64', 'mac-arm64'].some(key => downloadURL(releaseConfig.platforms?.[key]?.url));
  const appleSupportLocale = display.language === 'en' ? 'en-us' : 'zh-cn';
  macFirstOpen.querySelector('a').href = `https://support.apple.com/${appleSupportLocale}/102445`;
  document.querySelectorAll('.download-option').forEach(option => {
    const platform = releaseConfig.platforms?.[option.dataset.platform];
    const status = platformStatus(platform);
    const chip = option.querySelector('.option-status');
    chip.className = `option-status status-${status}`;
    chip.textContent = t(STATUS_TEXT[status]);
    if (downloadURL(platform?.url)) option.querySelector('[data-platform-detail]').textContent = t(platform.detail || '下载应用');
  });
  if (Object.values(releaseConfig.platforms || {}).some(platform => downloadURL(platform.url))) {
    document.querySelector('#release-summary').textContent = t('Pi Bot {version} 已发布。选择你的平台，认识新队友。', { version: releaseConfig.version || '' });
    document.querySelector('.download-status').replaceChildren(Object.assign(document.createElement('span'), { className: 'status-dot' }), document.createTextNode(t('安装前请查看对应平台的系统要求')));
    const pill = document.querySelector('.release-pill');
    // The pill opens this version's notes on the release history page.
    if (releaseConfig.version) pill.hash = 'v' + releaseConfig.version;
    pill.replaceChildren(Object.assign(document.createElement('span'), { className: 'status-dot' }), document.createTextNode(' ' + t('Pi Bot {version} 正式上线', {version: releaseConfig.version ? 'v' + releaseConfig.version : ''})), Object.assign(document.createElement('span'), { ariaHidden: 'true', textContent: '↗' }));
    document.querySelector('.platform-note').lastChild.textContent = t('现已发布');
  }
  if (releaseDialog.open) renderReleaseDialog();
}

let dialogPlatform = '';
function renderReleaseDialog() {
  document.querySelector('#dialog-description').textContent = t('Pi Bot 的 {platform} 版本尚未开放下载。我们正在打磨体验，正式发布后，你可以直接在这里获取安装包。', { platform: t(dialogPlatform) });
}

// ---- The visitor's system: highlighted in each menu and focused first when it opens ----
function visitorSystem() {
  const ua = navigator.userAgent;
  const platform = navigator.userAgentData?.platform || '';
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/.test(ua)) return '';
  if (/Win/i.test(platform) || /Windows/.test(ua)) return 'windows';
  if (/mac/i.test(platform) || /Macintosh|Mac OS X/.test(ua)) return 'mac';
  if (/Linux|X11|CrOS/i.test(platform + ua)) return 'linux';
  return '';
}
function markVisitor(system, arch = '') {
  document.querySelectorAll('.download-option').forEach(option => {
    // Without a known architecture both Mac builds stay marked; the visitor knows their chip.
    const yours = !!system && option.dataset.os === system && (!arch || !option.dataset.arch || option.dataset.arch === arch);
    option.toggleAttribute('data-yours', yours);
    option.querySelector('.option-yours').hidden = !yours;
  });
}
const system = visitorSystem();
markVisitor(system);
if (system === 'mac') navigator.userAgentData?.getHighEntropyValues?.(['architecture'])
  .then(values => { if (values.architecture === 'arm' || values.architecture === 'x86') markVisitor('mac', values.architecture === 'arm' ? 'arm' : 'x64'); })
  .catch(() => { /* Architecture is a hint only; both Mac builds stay marked. */ });

// ---- Menu: button toggles, arrows move, Esc / Tab / outside click close ----
const parts = pick => ({ button: pick.querySelector('.download-button'), menu: pick.querySelector('.download-menu'), options: [...pick.querySelectorAll('.download-option')] });
function closeMenu(pick, returnFocus = false) {
  const { button, menu } = parts(pick);
  if (menu.hidden) return;
  menu.hidden = true;
  button.setAttribute('aria-expanded', 'false');
  if (returnFocus) button.focus();
}
function openMenu(pick, focusLast = false) {
  picks.forEach(other => { if (other !== pick) closeMenu(other); });
  const { button, menu, options } = parts(pick);
  menu.hidden = false;
  button.setAttribute('aria-expanded', 'true');
  (focusLast ? options.at(-1) : options.find(option => option.hasAttribute('data-yours')) || options[0]).focus();
}
picks.forEach(pick => {
  const { button, menu, options } = parts(pick);
  button.addEventListener('click', () => { if (menu.hidden) openMenu(pick); else closeMenu(pick); });
  button.addEventListener('keydown', event => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    openMenu(pick, event.key === 'ArrowUp');
  });
  menu.addEventListener('keydown', event => {
    const index = options.indexOf(document.activeElement);
    const next = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: options.length - 1 }[event.key];
    if (next !== undefined) { event.preventDefault(); options[(next + options.length) % options.length].focus(); return; }
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeMenu(pick, true); }
    else if (event.key === 'Tab') closeMenu(pick);
  });
  pick.addEventListener('focusout', event => { if (!pick.contains(event.relatedTarget)) closeMenu(pick); });
  options.forEach(option => option.addEventListener('click', async event => {
    // Focus goes back to the button first, so closing the dialog lands there and not on a hidden item.
    closeMenu(pick, true);
    await configReady;
    const platform = releaseConfig?.platforms?.[option.dataset.platform];
    const url = downloadURL(platform?.url);
    if (url) {
      if (event.isTrusted) recordDownloadClick(url);
      location.assign(url);
      return;
    }
    dialogPlatform = platform?.label || option.querySelector('b').textContent;
    renderReleaseDialog();
    releaseDialog.showModal();
  }));
});
document.addEventListener('click', event => { picks.forEach(pick => { if (!pick.contains(event.target)) closeMenu(pick); }); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') picks.forEach(pick => closeMenu(pick, pick.contains(document.activeElement))); });

document.querySelector('.dialog-close').addEventListener('click', () => releaseDialog.close());
document.querySelector('#dialog-roadmap').addEventListener('click', () => releaseDialog.close());
releaseDialog.addEventListener('click', event => {
  const rect = releaseDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) releaseDialog.close();
});
