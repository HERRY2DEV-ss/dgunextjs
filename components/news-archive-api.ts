import { parseHomepageNews, parseNews, requestHomepageData, type NewsItem, type NewsTab } from './news-api';
import { clientDguApiUrl, DguApiResponseError, readDguApiJson } from './dgu-api-transport';
const categoryIds: Record<NewsTab, string> = { placements: '1', admissions: '2', campus: '3' };
const endpoint = clientDguApiUrl('news');
const pending = new Map<NewsTab, Promise<NewsItem[]>>();
const cache = new Map<NewsTab, { expires: number; items: NewsItem[] }>();
export function requestArchiveNews(tab: NewsTab): Promise<NewsItem[]> {
  const saved = cache.get(tab);
  if (saved && saved.expires > Date.now()) return Promise.resolve(saved.items);
  const active = pending.get(tab);
  if (active) return active;
  const request = load(tab).then(items => { cache.set(tab, { expires: Date.now() + 60000, items }); return items; }).finally(() => pending.delete(tab));
  pending.set(tab, request);
  return request;
}
async function load(tab: NewsTab): Promise<NewsItem[]> {
  const key = process.env.NEXT_PUBLIC_DGU_MENU_API_KEY?.trim();
  if (!key) throw new Error('News API key is not configured.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Apikey: key }, body: JSON.stringify({ CATEGORY_ID: categoryIds[tab] }), signal: controller.signal, cache: 'no-store' });
    // Admission category endpoint can return an empty body even with HTTP 200.
    // Match the homepage's verified live-source fallback for the global archive only.
    if (tab === 'admissions' && response.ok && typeof response.clone === 'function' &&
      !(await response.clone().text()).replace(/^\\uFEFF/, '').trim()) {
      return parseHomepageNews(await requestHomepageData(), tab);
    }
    try {
      return parseNews(await readDguApiJson(response, 'News API'), tab);
    } catch (error) {
      // A missing global admission endpoint may use the supplied homepage bucket.
      // Do not mask authentication, server, malformed JSON, or any other category failure.
      if (tab === 'admissions' && error instanceof DguApiResponseError &&
        (error.reason === 'endpoint-missing' || error.reason === 'http' && error.httpStatus === 404)) {
        return parseHomepageNews(await requestHomepageData(), tab);
      }
      throw error;
    }
  } finally { clearTimeout(timeout); }
}
