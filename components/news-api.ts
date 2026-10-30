import { newsDetailHref } from './news-detail-api';
import { clientDguApiUrl, DguApiResponseError, readDguApiJson } from './dgu-api-transport';
import { requestHomepageData } from './homepage-api';
export type NewsTab = 'campus' | 'placements' | 'admissions';
export type NewsScope = { SCHOOL_URL?: string };
export type NewsItem = {
  id: string;
  image: string;
  date: string;
  title: string;
  text: string;
  href: string;
  // The homepage feed supplies the live article URL, but no full article body.
  sourceHref?: string;
  target?: '_blank';
};

const categories: Record<NewsTab, { id: string; name: string }> = {
  placements: { id: '1', name: 'Placement Updates' },
  admissions: { id: '2', name: 'Admission News' },
  campus: { id: '3', name: 'Campus & Event Updates' },
};
const NEWS_API = clientDguApiUrl('news');

// Keep API text as text. Never inject remote HTML into the page.
function text(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/<[^>]*>/g, '').replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (match, entity: string) => {
    const names: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };
    const token = entity.toLowerCase();
    if (names[token]) return names[token];
    const code = token.startsWith('#x') ? parseInt(token.slice(2), 16) : parseInt(token.slice(1), 10);
    return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
  }).trim();
}
function apiUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  const raw = value.trim().replace(/&amp;/g, '&');
  if (/^(?:javascript|data|vbscript):/i.test(raw)) return '';
  try {
    const url = new URL(raw, 'https://dgu.ac.in/');
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return '';
    if (['dgu.ac.in', 'www.dgu.ac.in'].includes(url.hostname)) url.pathname = url.pathname.replace(/\/{2,}/g, '/');
    return url.href;
  } catch { return ''; }
}

export function parseNews(payload: unknown, tab: NewsTab): NewsItem[] {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid news API response.');
  const response = payload as { error?: unknown; data?: unknown };
  if (String(response.error) !== '0' || !Array.isArray(response.data)) {
    throw new Error('News API did not return a successful data array.');
  }
  const seen = new Set<string>();
  const items: NewsItem[] = [];
  for (const entry of response.data) {
    if (!entry || typeof entry !== 'object') continue;
    const row = entry as Record<string, unknown>;
    // Do not put another category into this tab even if the server ignores a filter.
    const categoryId = typeof row.categoryID === 'number' || typeof row.categoryID === 'string'
      ? String(row.categoryID) : typeof row.categoryId === 'number' || typeof row.categoryId === 'string'
      ? String(row.categoryId) : typeof row.CATEGORY_ID === 'number' || typeof row.CATEGORY_ID === 'string'
      ? String(row.CATEGORY_ID) : '';
    const categoryName = text(row.category ?? row.categoryName);
    if (categoryId ? categoryId !== categories[tab].id : categoryName && categoryName.toLowerCase() !== categories[tab].name.toLowerCase()) continue;
    const title = text(row.newsTitle);
    if (!title) continue;
    const sourceHref = apiUrl(row.url);
    const href = sourceHref ? newsDetailHref(sourceHref) : '';
    const date = text(row.newsDate);
    const id = typeof row.id === 'number' || typeof row.id === 'string' ? String(row.id) : `${href}|${title}|${date}`;
    if (seen.has(id)) continue;
    seen.add(id);
    items.push({ id, title, date, text: text(row.shortDesc ?? row.shortDescription), image: apiUrl(row.imageURL ?? row.image), href,
      target: undefined });
  }
  return items;
}

/** Category buckets are part of the supplied next-homepage-data.php contract.
 * This feed has no school filter or full-article support. Never use it for those. */
export function parseHomepageNews(payload: unknown, tab: NewsTab): NewsItem[] {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid homepage news response.');
  const response = payload as { success?: unknown; news?: unknown };
  const news = response.news && typeof response.news === 'object' && !Array.isArray(response.news)
    ? response.news as Record<string, unknown> : null;
  const bucket = { campus: 'campus', placements: 'placement', admissions: 'admission' }[tab];
  const records = news?.[bucket];
  if (response.success !== true || !Array.isArray(records)) throw new Error('Homepage API did not return this news category.');
  const seen = new Set<string>();
  return records.flatMap(entry => {
    if (!entry || typeof entry !== 'object') return [];
    const row = entry as Record<string, unknown>;
    const title = text(row.title);
    if (!title) return [];
    const href = apiUrl(row.href), date = text(row.date);
    const id = typeof row.id === 'number' || typeof row.id === 'string' ? String(row.id) : `${href}|${title}|${date}`;
    if (seen.has(id)) return [];
    seen.add(id);
    return [{ id, title, date, text: text(row.text), image: apiUrl(row.image), href: newsDetailHref(href) || href }];
  });
}

const pending = new Map<string, Promise<NewsItem[]>>();
const cache = new Map<string, { items: NewsItem[]; expires: number }>();
export function requestNews(tab: NewsTab, scope: NewsScope = {}): Promise<NewsItem[]> {
  const value = scope.SCHOOL_URL;
  if (value !== undefined && (typeof value !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value.trim()))) {
    return Promise.reject(new Error('Invalid news SCHOOL_URL.'));
  }
  const schoolUrl = value === undefined ? '' : value.trim().toLowerCase();
  const scopeKey = `${tab}|${schoolUrl}`;
  const saved = cache.get(scopeKey);
  if (saved && saved.expires > Date.now()) return Promise.resolve(saved.items);
  const active = pending.get(scopeKey);
  if (active) return active;
  const request = loadNews(tab, schoolUrl).then(items => {
    cache.set(scopeKey, { items, expires: Date.now() + 60000 });
    return items;
  }).finally(() => { pending.delete(scopeKey); });
  pending.set(scopeKey, request);
  return request;
}
async function loadNews(tab: NewsTab, schoolUrl: string): Promise<NewsItem[]> {
  const key = process.env.NEXT_PUBLIC_DGU_MENU_API_KEY?.trim();
  if (!key) throw new Error('News API key is not configured.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(NEWS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Apikey: key },
      body: JSON.stringify({ CATEGORY_ID: categories[tab].id, ...(schoolUrl ? { SCHOOL_URL: schoolUrl } : {}) }),
      signal: controller.signal,
      cache: 'no-store',
    });
    // The redeveloped admissions endpoint currently returns only whitespace.
    // Use the verified live homepage admission bucket for global lists only;
    // keep malformed HTML, auth failures and school-scoped errors visible.
    if (tab === 'admissions' && !schoolUrl && response.ok && typeof response.clone === 'function' &&
      !(await response.clone().text()).replace(/^\uFEFF/, '').trim()) {
      return parseHomepageNews(await requestHomepageData(), tab);
    }
    const payload = await readDguApiJson(response, 'News API');
    return parseNews(payload, tab);
  } catch (error) {
    // Only the verified missing-endpoint case can use the other supplied API.
    // Auth, database, malformed JSON and scoped requests retain their errors.
    if (!schoolUrl && error instanceof DguApiResponseError &&
      (error.reason === 'endpoint-missing' || error.reason === 'http' && error.httpStatus === 404)) {
      return parseHomepageNews(await requestHomepageData(), tab);
    }
    if (controller.signal.aborted) throw new Error('News request timed out.');
    throw error;
  } finally { clearTimeout(timeout); }
}
