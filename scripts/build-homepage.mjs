import { readFile } from 'node:fs/promises';
import { parse, parseFragment, serialize, serializeOuter } from 'parse5';
import { english } from '../public/translations.js';
import { origin, sitePath, siteLink, languageTags, alternateLinks } from './site-locales.mjs';

const textAttributes = new Set(['aria-label', 'title', 'alt']);
const assetAttributes = new Set(['src', 'poster', 'href']);

function translate(text) {
  return text.replace(/\S(?:[\s\S]*\S)?/, value => english[value] ?? value);
}

function localizeLink(value, lang) {
  if (lang === 'en' && value === 'https://support.apple.com/zh-cn/102445') return 'https://support.apple.com/en-us/102445';
  return siteLink(value, lang);
}

function rootAsset(value, lang) {
  if (!value || /^(?:[a-z][a-z0-9+.-]*:|[\/#?])/i.test(value)) return value;
  return '/' + (lang === 'en' ? value.replace(/^(assets\/shots\/[^ ]+)-zh-light\./, '$1-en-light.') : value);
}

function localize(node, lang, skipText = false) {
  if (node.nodeName === '#text') {
    if (lang === 'en' && !skipText) node.value = translate(node.value);
    return;
  }
  const attrs = node.attrs ?? [];
  const attribute = name => attrs.find(entry => entry.name === name);
  if (attribute('data-home-language-link')) {
    const other = lang === 'en' ? 'zh' : 'en';
    attribute('href').value = sitePath('/', other);
    attribute('lang').value = languageTags[other];
    attribute('hreflang').value = languageTags[other];
    node.childNodes[0].value = lang === 'en' ? '中文官网' : 'English website';
  }
  if (node.tagName === 'html') {
    attribute('lang').value = languageTags[lang];
    attribute('data-default-language').value = lang;
    attrs.push({ name: 'data-static-language', value: lang });
  }
  const pageUrl = node.tagName === 'link' && attribute('rel')?.value === 'canonical';
  const socialUrl = node.tagName === 'meta' && attribute('property')?.value === 'og:url';
  const language = attribute('data-site-language')?.value;
  for (const entry of attrs) {
    const { name, value } = entry;
    if ((pageUrl && name === 'href') || (socialUrl && name === 'content')) entry.value = origin + sitePath('/', lang);
    else if (node.tagName === 'link' && attribute('hreflang') && name === 'href') entry.value = origin + sitePath('/', attribute('hreflang').value === 'zh-CN' ? 'zh' : 'en');
    else if (language && name === 'aria-pressed') entry.value = String(language === lang);
    else if (lang === 'en' && (textAttributes.has(name) || (node.tagName === 'meta' && name === 'content'))) entry.value = translate(value);
    else if (assetAttributes.has(name)) entry.value = rootAsset(name === 'href' ? localizeLink(value, lang) : value, lang);
    else if (name === 'srcset') entry.value = value.split(',').map(part => rootAsset(part.trim(), lang)).join(', ');
  }

  if (node.tagName === 'script' && attribute('type')?.value === 'application/ld+json') {
    const rewrite = value => {
      if (Array.isArray(value)) return value.map(rewrite);
      if (!value || typeof value !== 'object') return value;
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key,
        ['url', 'installUrl'].includes(key) && typeof item === 'string' ? siteLink(item, lang) : rewrite(item)]));
    };
    node.childNodes[0].value = JSON.stringify(rewrite(JSON.parse(node.childNodes[0].value))).replaceAll('<', '\\u003c');
  }

  const keepsSource = skipText || ['script', 'style'].includes(node.tagName) || Boolean(attribute('data-no-translate'));
  for (const child of node.childNodes ?? []) localize(child, lang, keepsSource);
}

export async function localizedHomepage(file, lang) {
  const document = parse(await readFile(file, 'utf8'));
  localize(document, lang);
  return serialize(document);
}

function bodyOf(document) {
  return document.childNodes.find(node => node.tagName === 'html')
    .childNodes.find(node => node.tagName === 'body');
}

export function sharedChrome(html, lang, route) {
  const home = sitePath('/', lang);
  const body = bodyOf(parse(html));
  const header = body.childNodes.find(node => node.tagName === 'header');
  const footer = body.childNodes.find(node => node.tagName === 'footer');
  function rebase(node) {
    for (const attribute of node.attrs ?? []) {
      if (attribute.name === 'href' && attribute.value.startsWith('#')) {
        attribute.value = home + (attribute.value === '#' ? '' : attribute.value);
      } else if (attribute.name === 'src' && attribute.value.startsWith('assets/')) {
        attribute.value = '/' + attribute.value;
      }
    }
    const language = node.attrs?.find(attribute => attribute.name === 'data-site-language')?.value;
    if (language && route) node.attrs.push({
      name: 'data-language-url',
      value: sitePath(route, language),
    });
    for (const child of node.childNodes ?? []) rebase(child);
  }
  rebase(header);
  rebase(footer);
  return { header: serializeOuter(header), footer: serializeOuter(footer) };
}

export function applyLegalChrome(html, chrome, lang, route) {
  const document = parse(html);
  const root = document.childNodes.find(node => node.tagName === 'html');
  root.attrs.find(attr => attr.name === 'lang').value = languageTags[lang];
  root.attrs.push({ name: 'data-static-language', value: lang });
  const head = root.childNodes.find(node => node.tagName === 'head');
  const attr = (node, name) => node.attrs?.find(entry => entry.name === name);
  const canonical = origin + sitePath(route, lang);
  head.childNodes.find(node => node.tagName === 'title').childNodes[0].value =
    `${route === '/privacy/' ? (lang === 'en' ? 'Privacy Policy' : '隐私政策') : (lang === 'en' ? 'Terms of Service' : '服务条款')} | Pi Bot`;
  for (const node of head.childNodes) {
    if (attr(node, 'rel')?.value === 'canonical') attr(node, 'href').value = canonical;
    if (attr(node, 'name')?.value === 'description' && lang === 'en') attr(node, 'content').value =
      route === '/privacy/' ? 'How Pi Bot handles local data, model providers, connected services, and website statistics.' : 'Terms for using Pi Bot applications, the website, and connected services.';
  }
  for (const node of parseFragment(alternateLinks(route)).childNodes) { node.parentNode = head; head.childNodes.push(node); }
  const siteScript = head.childNodes.find(node => node.tagName === 'script'
    && node.attrs.some(attribute => attribute.name === 'src' && attribute.value === '../app.js'));
  siteScript.attrs.find(attribute => attribute.name === 'src').value = '/site.js';
  const body = bodyOf(document);
  function selectLanguage(node) {
    if (!node.childNodes) return;
    node.childNodes = node.childNodes.filter(child => !child.attrs?.some(attr =>
      attr.name === 'class' && attr.value.split(' ').includes(`legal-lang-${lang === 'en' ? 'zh' : 'en'}`)));
    for (const child of node.childNodes) selectLanguage(child);
  }
  selectLanguage(body);
  function rootResources(node) {
    for (const attribute of node.attrs ?? []) {
      if (['href', 'src'].includes(attribute.name) && attribute.value.startsWith('../')) attribute.value = '/' + attribute.value.slice(3);
    }
    for (const child of node.childNodes ?? []) rootResources(child);
  }
  rootResources(document);
  const main = body.childNodes.find(node => node.tagName === 'main');
  const back = main.childNodes.find(node => node.attrs?.some(attr => attr.name === 'class' && attr.value === 'legal-back'));
  back.childNodes[0].value = route === '/privacy/' ? (lang === 'en' ? 'Terms of Service ↗' : '服务条款 ↗') : (lang === 'en' ? 'Privacy Policy ↗' : '隐私政策 ↗');
  const card = main.childNodes.find(node => node.tagName === 'section');
  const contents = card.childNodes.filter(node => node.tagName === 'div').map(section => {
    const label = lang === 'zh' ? '本页目录' : 'On this page';
    const links = section.childNodes.filter(node => node.tagName === 'h2').map((heading, position) => {
      const id = `legal-${lang}-${position + 1}`;
      heading.attrs.push({ name: 'id', value: id });
      return `<li><a href="#${id}">${serialize(heading)}</a></li>`;
    }).join('');
    return `<nav class="legal-index legal-lang legal-lang-${lang}" aria-label="${label}" data-no-translate><p>${label}</p><ul>${links}</ul></nav>`;
  });
  const sections = parseFragment(contents.join('')).childNodes;
  for (const section of sections) section.parentNode = main;
  main.childNodes.splice(main.childNodes.indexOf(card), 0, ...sections);
  const header = body.childNodes.find(node => node.tagName === 'header');
  const footer = body.childNodes.find(node => node.tagName === 'footer');
  const originalHeader = serializeOuter(header);
  const originalFooter = serializeOuter(footer);
  return serialize(document).replace(originalHeader, () => chrome.header).replace(originalFooter, () => chrome.footer);
}
