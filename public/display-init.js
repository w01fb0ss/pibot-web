// Apply the saved appearance before the first paint; storage may be disabled.
(() => {
  let saved = {};
  try { const value=JSON.parse(localStorage.getItem('pibot.website.display')||'{}');if(value&&typeof value==='object')saved=value; } catch {}
  const query = new URLSearchParams(location.search);
  const root = document.documentElement;
  const language = root.dataset.staticLanguage || query.get('lang') || root.dataset.defaultLanguage || saved.language || (/^zh-(?:cn|sg|hans)(?:-|$)/i.test(navigator.language) ? 'zh' : 'en');
  const theme = query.get('theme') || saved.theme || 'system';
  root.lang = language === 'en' ? 'en' : 'zh-CN';
  root.dataset.language = language === 'en' ? 'en' : 'zh';
  root.dataset.themePreference = ['light','dark','system'].includes(theme) ? theme : 'system';
  root.dataset.theme = root.dataset.themePreference === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : root.dataset.themePreference;
})();
