import { SITE_BASE } from './site-routes';
import { newsDetailHref } from './news-detail-api';
import { newsRouteSlugs } from './news-route-slugs';
import { newsSlug } from './news-urls';
import type { NewsTab } from './news-api';

export const PLACEMENTS_HREF = `${SITE_BASE}/placement-reports/`;
export function newsListingHref(tab: NewsTab): string {
  const pages = { campus: 'campus-news', placements: 'placement-news', admissions: 'admission-news' };
  return `${SITE_BASE}/${pages[tab]}/`;
}

// Only a URL supplied by the API can select an article. Missing URLs open
// the relevant local archive, never a guessed slug or the upstream website.
export function newsItemHref(value: string, tab: NewsTab): string {
  const slug = newsSlug(value);
  if (!slug) return newsListingHref(tab);
  if (newsRouteSlugs.includes(slug)) return newsDetailHref(slug);
  return `${SITE_BASE}/news/?url=${encodeURIComponent(slug)}`;
}
