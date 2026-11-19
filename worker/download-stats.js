// Historical versions contribute to the same bounded product/platform buckets.
export function downloadBucket(key, targets) {
  const parts = key.split('|');
  const [product, platform, arch] = parts.length === 4 ? [parts[0], parts[2], parts[3]] : parts;
  return targets.some(([p, , os, cpu]) => p === product && os === platform && cpu === arch)
    ? [product, platform, arch].join('|') : 'other';
}

export function downloadSummary(rows, targets, from, through) {
  const products = { desktop: 0, mobile: 0, runner: 0 };
  const platforms = targets.map(([product, , platform, arch]) => ({ product, platform, arch, count: 0 }));
  const buckets = new Map(platforms.map(row => [[row.product, row.platform, row.arch].join('|'), row]));
  let total = 0;
  let unclassified = 0;
  for (const { key, n } of rows) {
    if (!Number.isSafeInteger(n) || n < 0 || !Number.isSafeInteger(total + n)) throw new Error('invalid_download_count');
    const bucket = buckets.get(downloadBucket(key, targets));
    if (bucket) {
      bucket.count += n;
      products[bucket.product] += n;
    } else unclassified += n;
    total += n;
  }
  return { kind: 'download-clicks', scope: 'all-versions', from, through, total, products, platforms, unclassified };
}
