import { clientDguApiUrl, readDguApiJson } from './dgu-api-transport';
import { apiMedia, apiPlain } from './dgu-content-api';
import { mergeAcademicBody } from './academic-html';
export type NewsDetail = { id: string; title: string; category: string; date: string; details: string; image: string; slug: string };
import { newsSlug } from './news-urls';
export { newsSlug, newsDetailHref } from './news-urls';
const string = (v: unknown) => typeof v === 'string' ? v.trim() : '';
function articleHtml(value: unknown): string {
  const body = string(value);
  if (!body || /<[a-z][\s\S]*>/i.test(body)) return body;
  const escaped = body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return escaped.split(/\n\s*\n/).filter(Boolean).map(paragraph => `<p>${paragraph}</p>`).join('');
}
export function parseNewsDetail(payload: unknown, slug: string): NewsDetail {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid news response.');
  const result = payload as { error?: unknown; data?: unknown };
  if (String(result.error) !== '0' || !Array.isArray(result.data)) throw new Error('This article is unavailable.');
  const row = result.data.find(item => item && typeof item === 'object' && newsSlug(string(item.url)) === slug);
  if (!row || !apiPlain(row.newsTitle)) throw new Error('Article not found.');
  // details can be only a shortened introduction. otherDetails contains the
  // complete article and inline photos; retain both without repeating the intro.
  const details = mergeAcademicBody(articleHtml(row.details), articleHtml(row.otherDetails));
  return { id: String(row.id ?? slug), title: apiPlain(row.newsTitle), category: apiPlain(row.category ?? row.categoryName), date: apiPlain(row.newsDate), details, image: apiMedia(row.imageURL ?? row.image), slug };
}
export async function requestNewsDetail(slug: string, signal: AbortSignal): Promise<NewsDetail> {
  if (!slug || newsSlug(slug) !== slug) throw new Error('A valid news article URL is required.');
  const key = process.env.NEXT_PUBLIC_DGU_MENU_API_KEY?.trim();
  if (!key) throw new Error('News API key is not configured.');
  const endpoint = clientDguApiUrl('news');
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Apikey: key }, body: JSON.stringify({ URL: slug }), signal, cache: 'no-store' });
  if (!response.ok) throw new Error(`News API returned HTTP ${response.status}.`);
  return parseNewsDetail(await readDguApiJson(response, 'News API'), slug);
}
