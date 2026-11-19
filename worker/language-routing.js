/** Only an explicitly Simplified Chinese primary preference selects Chinese. */
export function preferredLanguage(header = '') {
  const preferences = header.split(',').map((entry, order) => {
    const [tag, ...parameters] = entry.trim().split(';');
    const quality = parameters.find(value => value.trim().startsWith('q='));
    const q = quality ? Number(quality.trim().slice(2)) : 1;
    return { tag: tag.toLowerCase(), q, order };
  }).filter(({ tag, q }) => /^[a-z]{1,8}(?:-[a-z0-9]{1,8})*$/.test(tag) && q > 0 && q <= 1)
    .sort((a, b) => b.q - a.q || a.order - b.order);
  const tag = preferences[0]?.tag ?? '';
  const parts = tag.split('-');
  return parts[0] === 'zh' && !parts.includes('hant')
    && (parts.includes('hans') || parts.includes('cn') || parts.includes('sg')) ? 'cn' : 'en';
}

export function languageRedirect(request) {
  if (!['GET', 'HEAD'].includes(request.method)) return;
  const url = new URL(request.url);
  if (url.pathname === '/' || url.pathname === '/index.html') {
    url.pathname = `/${preferredLanguage(request.headers.get('accept-language') ?? '')}/`;
    url.searchParams.delete('lang');
    // A preference-dependent redirect must never be reused for another visitor.
    return new Response(null, { status: 302, headers: {
      Location: url.pathname + url.search, 'Cache-Control': 'private, no-store', Vary: 'Accept-Language',
    } });
  }
  if (/^\/(?:cn|en)$/.test(url.pathname)) {
    return new Response(null, { status: 301, headers: { Location: url.pathname + '/' + url.search } });
  }
  if (/^\/(?:guides|download|about|releases|privacy|terms)(?:\/|$)/.test(url.pathname)) {
    const language = url.searchParams.get('lang') === 'en' ? 'en' : 'cn';
    url.pathname = `/${language}${url.pathname.replace(/\/index\.html$/, '/')}`;
    if (!url.pathname.endsWith('/') && !/\.[^/]+$/.test(url.pathname)) url.pathname += '/';
    url.searchParams.delete('lang');
    return new Response(null, { status: 301, headers: { Location: url.pathname + url.search } });
  }
}
