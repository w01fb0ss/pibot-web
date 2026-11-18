import { readFile } from 'node:fs/promises';
import { parse, parseFragment, serialize, serializeOuter } from 'parse5';
import { english } from '../public/translations.js';

const origin = 'https://pibot.space';
const englishUrl = origin + '/en/';
const textAttributes = new Set(['aria-label', 'title', 'alt']);
const assetAttributes = new Set(['src', 'poster', 'href']);

function translate(text) {
  return text.replace(/\S(?:[\s\S]*\S)?/, value => english[value] ?? value);
}

function localizeLink(value) {
  if (/^\/(?:download\/|guides\/)/.test(value)) return '/en' + value;
  if (/^\/(?:privacy|terms)\/?$/.test(value)) return value.replace(/\/?$/, '/') + '?lang=en';
  if (value === 'https://support.apple.com/zh-cn/102445') return 'https://support.apple.com/en-us/102445';
  return value;
}

function rootAsset(value) {
  if (!value || /^(?:[a-z][a-z0-9+.-]*:|[\/#?])/i.test(value)) return value;
  return '/' + value.replace(/^(assets\/shots\/[^ ]+)-zh-light\./, '$1-en-light.');
}

function localize(node, skipText = false) {
  if (node.nodeName === '#text') {
    if (!skipText) node.value = translate(node.value);
    return;
  }
  const attrs = node.attrs ?? [];
  const attribute = name => attrs.find(entry => entry.name === name);
  if (attribute('data-home-language-link')) {
    attribute('href').value = '/';
    attribute('lang').value = 'zh-CN';
    attribute('hreflang').value = 'zh-CN';
    node.childNodes[0].value = '中文官网';
  }
  if (node.tagName === 'html') {
    attribute('lang').value = 'en';
    attribute('data-default-language').value = 'en';
    attrs.push({ name: 'data-static-language', value: 'en' });
  }
  const pageUrl = node.tagName === 'link' && attribute('rel')?.value === 'canonical';
  const socialUrl = node.tagName === 'meta' && attribute('property')?.value === 'og:url';
  const language = attribute('data-site-language')?.value;
  for (const entry of attrs) {
    const { name, value } = entry;
    if ((pageUrl && name === 'href') || (socialUrl && name === 'content')) entry.value = englishUrl;
    else if (language && name === 'aria-pressed') entry.value = String(language === 'en');
    else if (textAttributes.has(name) || (node.tagName === 'meta' && name === 'content')) entry.value = translate(value);
    else if (assetAttributes.has(name)) entry.value = rootAsset(name === 'href' ? localizeLink(value) : value);
    else if (name === 'srcset') entry.value = value.split(',').map(part => rootAsset(part.trim())).join(', ');
  }

  const keepsSource = skipText || ['script', 'style'].includes(node.tagName) || Boolean(attribute('data-no-translate'));
  for (const child of node.childNodes ?? []) localize(child, keepsSource);
}

export async function englishHomepage(file) {
  const document = parse(await readFile(file, 'utf8'));
  localize(document);
  return serialize(document);
}

function bodyOf(document) {
  return document.childNodes.find(node => node.tagName === 'html')
    .childNodes.find(node => node.tagName === 'body');
}

export function sharedChrome(html, lang, route) {
  const home = lang === 'en' ? '/en/' : '/';
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
      value: language === 'en' ? '/en' + route : route,
    });
    for (const child of node.childNodes ?? []) rebase(child);
  }
  rebase(header);
  rebase(footer);
  return { header: serializeOuter(header), footer: serializeOuter(footer) };
}

export function applyLegalChrome(html, chrome) {
  const document = parse(html);
  const root = document.childNodes.find(node => node.tagName === 'html');
  root.attrs.push({ name: 'data-language-mode', value: 'inline' });
  root.attrs.push({ name: 'data-default-language', value: 'zh' });
  const head = root.childNodes.find(node => node.tagName === 'head');
  const siteScript = head.childNodes.find(node => node.tagName === 'script'
    && node.attrs.some(attribute => attribute.name === 'src' && attribute.value === '../app.js'));
  siteScript.attrs.find(attribute => attribute.name === 'src').value = '/site.js';
  const body = bodyOf(document);
  const main = body.childNodes.find(node => node.tagName === 'main');
  const card = main.childNodes.find(node => node.tagName === 'section');
  const contents = card.childNodes.filter(node => node.tagName === 'div').map((section, index) => {
    const lang = index === 0 ? 'zh' : 'en';
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
