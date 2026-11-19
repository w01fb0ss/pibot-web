import { english, chinese } from './translations.js';
const root = document.documentElement;
const originals = new WeakMap();
const attributes = new WeakMap();
const media = matchMedia('(prefers-color-scheme: dark)');
export const display = {language:root.dataset.language,theme:root.dataset.themePreference};
export function t(source, vars = {}) {
  const template = (display.language === 'en' ? english[source] : chinese[source]) ?? source;
  return template.replace(/\{(\w+)\}/g, (match,key) => Object.hasOwn(vars,key) ? String(vars[key]) : match);
}
export function translatePage(scope = document.documentElement) {
  const walker = document.createTreeWalker(scope,NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement?.closest('script,style,[data-no-translate]')) continue;
    const source = originals.get(node) ?? node.textContent;
    originals.set(node,source);
    const value = source.replace(/\S(?:[\s\S]*\S)?/,text => t(text));
    if (node.textContent !== value) node.textContent = value;
  }
  const elements = [scope,...scope.querySelectorAll('[aria-label],[title],[alt],meta[content]')];
  for (const element of elements) {
    const source = attributes.get(element) ?? {};
    for (const name of ['aria-label','title','alt',...(element.tagName === 'META' ? ['content'] : [])]) {
      if (!element.hasAttribute(name)) continue;
      source[name] ??= element.getAttribute(name);
      element.setAttribute(name,t(source[name]));
    }
    attributes.set(element,source);
  }
}
export function setLabel(element, source, vars={}) {
  const label=t(source,vars);element.setAttribute('aria-label',label);
  const saved=attributes.get(element)||{};saved['aria-label']=source.replace(/\{(\w+)\}/g,(match,key)=>vars[key]??match);attributes.set(element,saved);
}
export function setDisplay(patch, persist = true) {
  if (['zh','en'].includes(patch.language)) display.language=patch.language;
  if (['light','dark','system'].includes(patch.theme)) display.theme=patch.theme;
  root.lang=display.language==='zh'?'zh-CN':'en';
  root.dataset.language=display.language;root.dataset.themePreference=display.theme;
  root.dataset.theme=display.theme==='system'?(media.matches?'dark':'light'):display.theme;
  if (persist) try {localStorage.setItem('pibot.website.display',JSON.stringify(display));} catch {}
  if (persist) {
    const url=new URL(location.href);url.searchParams.set('lang',display.language);url.searchParams.set('theme',display.theme);
    if(root.dataset.languageMode==='inline')url.hash=url.hash.replace(/-\w{2}-(\d+)$/, `-${display.language}-$1`);
    history.replaceState(null,'',url);
  }
  translatePage();
  if(root.dataset.languageMode==='inline') {
    for(const link of document.querySelectorAll('.site-header a, .site-footer a, .legal-back')) {
      const url=new URL(link.href);
      const path=url.pathname.replace(/^\/en(?=\/)/,'');
      if(url.origin!==location.origin)continue;
      if(/^\/(?:privacy|terms)\/?$/.test(path)) {
        if(display.language==='en')url.searchParams.set('lang','en');
        else url.searchParams.delete('lang');
      } else {
        url.pathname=display.language==='en'?'/en'+path:path;
      }
      link.setAttribute('href',url.pathname+url.search+url.hash);
    }
  }
  document.querySelectorAll('[data-site-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.siteLanguage===display.language)));
  document.querySelector('#theme-select').value=display.theme;
  document.querySelector('meta[name="theme-color"]').content=root.dataset.theme==='dark'?'#141414':'#fcfcfc';
  document.dispatchEvent(new CustomEvent('pi-display-change',{detail:{...display,resolvedTheme:root.dataset.theme}}));
}
document.querySelectorAll('[data-site-language]').forEach(button=>button.addEventListener('click',()=>{
  const language=button.dataset.siteLanguage;
  if(root.dataset.languageMode==='inline'){
    setDisplay({language});
    return;
  }
  const url=new URL(location.href);
  url.pathname=button.dataset.languageUrl || (language==='en'?'/en/':'/cn/');
  url.searchParams.delete('lang');
  if(url.href!==location.href)location.assign(url.href);
}));
document.querySelector('#theme-select').addEventListener('change',event=>setDisplay({theme:event.target.value}));
media.addEventListener('change',()=>{if(display.theme==='system')setDisplay({},false);});
setDisplay({},false);
