import { parse, serialize } from 'parse5';

export const origin = 'https://pibot.space';
export const prefixes = { zh: '/cn', en: '/en' };
export const languageTags = { zh: 'zh-CN', en: 'en' };
export const sitePath = (route, lang) => prefixes[lang] + route;

export function siteLink(value, lang) {
  if (!value || value.startsWith('#')) return value;
  let url;
  try { url = new URL(value, origin); } catch { return value; }
  if (url.origin !== origin || /^\/(?:cn|en)(?:\/|$)/.test(url.pathname)) return value;
  if (url.pathname !== '/' && !/^\/(?:guides|download|about|releases|roles|privacy|terms)(?:\/|$)/.test(url.pathname)) return value;
  const selected = url.searchParams.get('lang') === 'en' ? 'en' : lang;
  url.pathname = sitePath(url.pathname, selected);
  if (!url.pathname.endsWith('/') && !/\.[^/]+$/.test(url.pathname)) url.pathname += '/';
  url.searchParams.delete('lang');
  return (value.startsWith('https://') ? origin : '') + url.pathname + url.search + url.hash;
}

export function alternateLinks(route) {
  return Object.entries(languageTags).map(([lang, tag]) =>
    `<link rel="alternate" hreflang="${tag}" href="${origin}${sitePath(route, lang)}">`
  ).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${origin}${sitePath(route, 'en')}">`;
}

export function localizePageLinks(html, lang) {
  const document = parse(html);
  function visit(node) {
    for (const attr of node.attrs ?? []) {
      if (attr.name === 'href' && node.tagName === 'a') attr.value = siteLink(attr.value, lang);
    }
    for (const child of node.childNodes ?? []) visit(child);
  }
  visit(document);
  return serialize(document);
}
