import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { searchContent } from './search-content.mjs';
import { englishHomepage, sharedChrome, applyLegalChrome } from './build-homepage.mjs';
import { buildManual } from './build-manual.mjs';

const origin = 'https://pibot.space';
const home = { zh: '/', en: '/en/' };
const bases = { zh: '', en: '/en' };
const languages = { zh: 'zh-CN', en: 'en' };
const downloads = [
  ['mac-arm64', 'mac-x64', 'windows', 'linux'],
  ['android'],
  ['runner-windows', 'runner-mac', 'runner-linux'],
];
const guideGroups = [
  { id: 'setup', tone: 'violet', slugs: ['getting-started', 'models-and-keys', 'bots-and-roles', 'chatting'] },
  { id: 'workflows', tone: 'teal', slugs: ['group-context', 'review-code-changes', 'approvals-and-permissions', 'routines'] },
  { id: 'devices', tone: 'pink', slugs: ['connections', 'phone-and-runner', 'runners', 'editor-acp'] },
  { id: 'support', tone: 'orange', slugs: ['faq', 'updates-and-data', 'privacy-and-security', 'self-hosting-relay'] },
];

function escape(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function localized(route, lang) {
  return route === '/' ? home[lang] : bases[lang] + route;
}

function alternates(route) {
  return Object.entries(languages)
    .map(([key, lang]) => `<link rel="alternate" hreflang="${lang}" href="${origin}${localized(route, key)}">`)
    .join('\n  ');
}

function frame({ route, lang, title, description, heading, body, homepage, schema, showLead = true }) {
  const copy = searchContent[lang];
  const canonical = origin + localized(route, lang);
  const chrome = sharedChrome(homepage, lang, route);
  const chapter = route.startsWith('/guides/') && route !== '/guides/';
  const faq = route === '/guides/faq/';
  const trail = [[copy.home, home[lang]]];
  if (chapter) trail.push([copy.guides, localized('/guides/', lang)]);
  trail.push([heading, localized(route, lang)]);
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, url], index) => ({
      '@type': 'ListItem', position: index + 1, name, item: origin + url,
    })),
  };
  const graph = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': schema ? [breadcrumb, schema] : [breadcrumb],
  }).replaceAll('<', '\\u003c');
  return `<!doctype html>
<html lang="${languages[lang]}" data-static-language="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#fcfcfc">
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}">
  <meta name="robots" content="max-image-preview:large">
  <link rel="canonical" href="${canonical}">
  ${alternates(route)}
  <meta property="og:type" content="${chapter ? 'article' : 'website'}">
  <meta property="og:site_name" content="Pi Bot">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${origin}/assets/og.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">${graph}</script>
  <link rel="icon" href="/assets/logo.svg" type="image/svg+xml">
  <script src="/display-init.js"></script>
  <link rel="stylesheet" href="/product-tokens.css">
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/display.css">
  <link rel="stylesheet" href="/reading.css">
  <script type="module" src="/site.js"></script>
  ${faq ? '<script type="module" src="/faq-page.js"></script>' : ''}
</head>
<body>
  <a class="skip-link" href="#main">${copy.skip}</a>
  ${chrome.header}
  <main id="main" class="reading-main${route === '/guides/' ? ' guide-directory' : chapter ? ' guide-article' : ''}">
    <nav class="reading-breadcrumb" aria-label="${escape(copy.breadcrumb)}"><ol>
      ${trail.map(([name, url], index) => index === trail.length - 1
        ? `<li aria-current="page">${escape(name)}</li>`
        : `<li><a href="${url}">${escape(name)}</a></li>`).join('')}
    </ol></nav>
    <h1>${escape(heading)}</h1>
    ${showLead ? `<p class="reading-lead">${escape(description)}</p>` : ''}
    ${body}
  </main>
  ${chrome.footer}
</body>
</html>
`;
}

async function workflowFigure(output, lang, [source, name, caption]) {
  const file = source === 'guides' ? `${name}-${lang}.png` : `${name}-${lang}-light.webp`;
  const relativePath = `assets/${source}/${file}`;
  const bytes = await readFile(path.join(output, relativePath));
  const [width, height] = source === 'guides' ? [bytes.readUInt32BE(16), bytes.readUInt32BE(20)] : [1920, 1200];
  const url = `/${relativePath}`;
  return `<figure class="reading-figure">
    <a href="${url}"><img src="${url}" width="${width}" height="${height}" alt="${escape(caption)}" loading="lazy" decoding="async"></a>
    <figcaption>${escape(caption)}</figcaption>
  </figure>`;
}

async function workflowSections(output, lang, items) {
  const sections = await Promise.all(items.map(async ([heading, body, screenshots]) => {
    if (!screenshots?.length) throw new Error(`Missing screenshot for ${lang}: ${heading}`);
    const figures = await Promise.all(screenshots.map(shot => workflowFigure(output, lang, shot)));
    return `<section class="reading-section walkthrough-step"><h3>${escape(heading)}</h3><p>${escape(body)}</p>${figures.join('\n')}</section>`;
  }));
  return sections.join('\n');
}

function guideIndex(articles, lang) {
  const copy = searchContent[lang];
  const shortcuts = guideGroups.map(({ id }) =>
    `<a href="#${id}">${escape(copy.guideGroups[id])}</a>`).join('');
  const groups = guideGroups.map(({ id, tone, slugs }) => {
    const cards = slugs.map(slug => {
      const { heading, description } = articles.find(article => article.slug === slug);
      return `<li><a class="guide-card" href="${localized(`/guides/${slug}/`, lang)}">
        <h3>${escape(heading)}<span aria-hidden="true">↗</span></h3><p>${escape(description)}</p>
      </a></li>`;
    }).join('\n');
    return `<section class="guide-collection tone-${tone}" id="${id}"><h2>${escape(copy.guideGroups[id])}</h2><ul class="guide-list">${cards}</ul></section>`;
  }).join('\n');
  return `<nav class="reading-links" aria-label="${escape(copy.contents)}">${shortcuts}</nav>${groups}`;
}

function chapterLayout(article, example, lang) {
  const copy = searchContent[lang];
  const isFaq = article.slug === 'faq';
  const links = article.sections.map(({ id, label }) =>
    `<li><a href="#${escape(id)}">${escape(label)}</a></li>`).join('');
  const search = isFaq ? `<div class="faq-filter" hidden>
    <label for="faq-query">${escape(copy.findQuestion)}</label>
    <input type="search" id="faq-query" placeholder="${escape(copy.searchExample)}">
    <p id="faq-no-results" role="status" hidden>${escape(copy.noResults)}</p>
  </div>` : '';
  return `<div class="guide-layout">
    <aside><nav class="guide-toc" aria-label="${escape(copy.contents)}"><p>${escape(copy.contents)}</p><ul>${links}</ul></nav></aside>
    <article class="guide-content">${search}${article.html}${example}</article>
  </div>`;
}

function downloadHref(value) {
  const url = new URL(value, origin + '/');
  if (url.origin === origin && url.pathname.startsWith('/downloads/')) {
    return url.pathname.replace('/downloads/', '/download-click/') + url.search;
  }
  return url.href;
}

function downloadSections(config, lang) {
  const copy = searchContent[lang];
  const page = copy.downloadPage;
  const availablePlatforms = config.platforms ?? {};
  const groups = downloads.map((keys, index) => {
    const rows = keys.filter(key => availablePlatforms[key]?.url).map(key => {
      const item = availablePlatforms[key];
      const status = Object.hasOwn(copy.status, item.status) ? item.status : 'untested';
      const currentStatus = status === 'tested' && item.version && config.version && item.version !== config.version ? 'testing' : status;
      const platform = escape(copy.platformNames[key]);
      return `<li><div><strong>${platform}</strong><span class="option-status status-${currentStatus}">${copy.status[currentStatus]}</span></div><a class="button" href="${escape(downloadHref(item.url))}" rel="nofollow" aria-label="${escape(copy.downloadButtons + ' · ' + copy.groups[index] + ' · ' + copy.platformNames[key])}">${copy.downloadButtons}</a></li>`;
    });
    return rows.length ? `<section class="reading-section"><h2>${copy.groups[index]}</h2><ul class="installer-list">${rows.join('\n')}</ul></section>` : '';
  }).filter(Boolean);
  if (!groups.length) return `<p class="reading-section">${copy.unavailable}</p>`;
  const current = config.version ? `<p><strong>${copy.available} · v${escape(config.version)}</strong></p>` : '';
  const mac = config.version === '0.0.1' && (availablePlatforms['mac-x64']?.url || availablePlatforms['mac-arm64']?.url)
    ? `<p>${escape(page.mac)} <a href="https://support.apple.com/${lang === 'en' ? 'en-us' : 'zh-cn'}/102445">${page.apple}</a></p>` : '';
  return `<div class="reading-section">${current}<p>${escape(page.versions)}</p></div>
  ${groups.join('\n')}
  <section class="reading-section"><h2>${page.installation}</h2>${mac}<p>${escape(page.other)}</p></section>`;
}

export async function buildSearchPages(output, config) {
  const routes = ['/'];
  const write = async (url, html) => {
    const directory = path.join(output, url.slice(1));
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, 'index.html'), html);
    routes.push(url);
  };

  const sourceHomepage = path.join(output, 'index.html');
  const homepage = { zh: await readFile(sourceHomepage, 'utf8'), en: await englishHomepage(sourceHomepage) };
  await write(home.en, homepage.en);
  for (const page of ['privacy', 'terms']) {
    const file = path.join(output, page, 'index.html');
    const html = applyLegalChrome(await readFile(file, 'utf8'), sharedChrome(homepage.zh, 'zh'));
    await writeFile(file, html);
    routes.push(`/${page}/`);
  }

  for (const [lang, copy] of Object.entries(searchContent)) {
    const render = options => frame({ ...options, lang, homepage: homepage[lang] });
    const articles = await buildManual(output, lang);
    const guides = copy.guidesPage;
    await write(localized('/guides/', lang), render({
      route: '/guides/', title: guides.title, description: guides.intro, heading: guides.heading,
      body: guideIndex(articles, lang),
    }));
    const download = copy.downloadPage;
    await write(localized('/download/', lang), render({
      route: '/download/', title: download.title, description: download.intro, heading: download.heading,
      body: downloadSections(config, lang),
      schema: config.version && {
        '@type': 'SoftwareApplication', '@id': origin + '/#desktop-app', name: 'Pi Bot',
        operatingSystem: 'macOS, Windows, Linux', softwareVersion: config.version,
      },
    }));
    for (const article of articles) {
      const route = `/guides/${article.slug}/`;
      const walkthrough = copy.articles.find(({ slug }) => slug === article.slug);
      const example = walkthrough
        ? `<h2 class="guide-example-title">${escape(copy.workflowExample)}</h2>${await workflowSections(output, lang, walkthrough.sections)}`
        : '';
      await write(localized(route, lang), render({
        route, title: `${article.heading} | Pi Bot`, description: walkthrough?.intro ?? article.description,
        heading: article.heading, showLead: article.slug === 'faq',
        body: chapterLayout(article, example, lang),
      }));
    }
  }

  const entries = routes.map(route => `  <url><loc>${origin}${route}</loc></url>`).join('\n');
  await writeFile(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`);
}
