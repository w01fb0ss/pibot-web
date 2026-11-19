export function recordDownloadClick(value) {
  const url = new URL(value, location.href);
  if (url.origin !== location.origin || !url.pathname.startsWith('/downloads/')) return;
  if (!globalThis.crypto?.randomUUID) return;

  // The downloader receives the file URL only. Browser retries of this separate
  // request carry the same ID, while each new activation gets its own ID.
  const endpoint = url.pathname.replace('/downloads/', '/download-click/');
  void fetch(endpoint, {
    method: 'POST',
    headers: { 'X-PiBot-Download-Click': crypto.randomUUID() },
    keepalive: true,
    credentials: 'omit',
    mode: 'same-origin',
  }).catch(() => { /* Statistics must never interrupt a download. */ });
}

function recordLinkClick(event) {
  if (!event.isTrusted || (event.type === 'auxclick' && event.button !== 1)) return;
  const link = event.target?.closest?.('a[data-download-link]');
  if (link) recordDownloadClick(link.href);
}

document.addEventListener('click', recordLinkClick);
document.addEventListener('auxclick', recordLinkClick);
