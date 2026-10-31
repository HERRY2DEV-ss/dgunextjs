import { SITE_BASE } from './site-routes';
import { newsDetailHref } from './news-detail-api';
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
  // Every valid API article slug uses the same clean URL, whether it was
  // present in the build-time static route list or published later.
  return newsDetailHref(slug);
}
