import { SITE_BASE } from './site-base';

const slugPattern = /^[a-zA-Z0-9_-]+$/;
/** Accept published slugs, DGU article URLs, clean local paths and old links.
 * External hosts, traversal, assets and nested paths cannot select an article. */
export function newsSlug(value: string): string {
  const input = value.trim();
  if (!input || /(?:^|\/)(?:\.|%2e){1,2}(?:\/|%2f|$)/i.test(input)) return '';
  try {
    const url = new URL(input, 'https://dgu.ac.in/');
    if (!['dgu.ac.in', 'www.dgu.ac.in'].includes(url.hostname) ||
      !['https:', 'http:'].includes(url.protocol) || url.username || url.password) return '';
    const pathname = decodeURIComponent(url.pathname).replace(/\/$/, '');
    if (pathname === `${SITE_BASE}/news` || pathname === '/news') {
      const selected = url.searchParams.get('url') || '';
      return slugPattern.test(selected) ? selected : '';
    }
    const path = pathname.replace(/^\/+|\/+$/g, '');
    const localPrefix = `${SITE_BASE.replace(/^\//, '')}/news/`;
    const slug = path.startsWith(localPrefix) ? path.slice(localPrefix.length) : path.replace(/^news\//, '');
    return slugPattern.test(slug) ? slug : '';
  } catch { return ''; }
}
export function newsDetailHref(value: string): string {
  const slug = newsSlug(value);
  return slug ? `${SITE_BASE}/news/${encodeURIComponent(slug)}/` : '';
}
