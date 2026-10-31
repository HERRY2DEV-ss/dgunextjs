import { clientDguApiUrl, readDguApiJson } from './dgu-api-transport';
import { apiMedia, apiPlain } from './dgu-content-api';
import { mergeAcademicBody } from './academic-html';
export type NewsDetail = { id: string; title: string; subtitle: string; category: string; date: string; details: string; image: string; slug: string };
import { newsSlug } from './news-urls';
export { newsSlug, newsDetailHref } from './news-urls';
const string = (v: unknown) => typeof v === 'string' ? v.trim() : '';
function articleHtml(value: unknown): string {
  const body = string(value);
  if (!body) return '';
  // Keep CMS HTML exactly as supplied so headings, paragraphs, lists and emphasis
  // remain semantic elements in the individual news detail view.
  if (/<[a-z][\s\S]*>/i.test(body)) return body;

  const decodeLine = (line: string) => line
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'");
  const escapeHtml = (text: string) => text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const lines = decodeLine(body.replace(/\r\n?/g, '\n'))
    .split(/\n+/)
    .map(line => line.replace(/[\t\u00a0 ]+/g, ' ').trim())
    .filter(Boolean);
  if (!lines.length) return '';

  const blocks: string[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) {
      blocks.push('<p>' + escapeHtml(paragraph.join(' ')) + '</p>');
      paragraph = [];
    }
  };
  const sentencePattern = /(?<=[.!?])\s+(?=(?:[“"'(]*[A-Z0-9]))/g;
  for (const line of lines) {
    const listMatch = /^(?:[•●▪◦*-]|\d+[.)]|[a-z][.)])\s+/.test(line);
    const headingLike = line.length <= 90 && !/[.!?]$/.test(line) && /:$/.test(line);
    if (listMatch || headingLike) {
      flush();
      if (listMatch) {
        const item = line.replace(/^(?:[•●▪◦*-]|\d+[.)]|[a-z][.)])\s+/, '');
        blocks.push('<p class="news-api-list-item">' + escapeHtml(item) + '</p>');
      } else {
        blocks.push('<h3>' + escapeHtml(line.replace(/:$/, '')) + '</h3>');
      }
      continue;
    }
    // API plain-text descriptions sometimes arrive as one continuous string.
    // Group a few complete sentences per paragraph instead of one enormous <p>.
    const sentences = line.split(sentencePattern).map(part => part.trim()).filter(Boolean);
    if (sentences.length >= 5) {
      flush();
      for (let index = 0; index < sentences.length; index += 3) {
        blocks.push('<p>' + escapeHtml(sentences.slice(index, index + 3).join(' ')) + '</p>');
      }
    } else {
      paragraph.push(line);
      if (paragraph.join(' ').length > 650) flush();
    }
  }
  flush();
  return blocks.join('');
}
export function parseNewsDetail(payload: unknown, slug: string): NewsDetail {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid news response.');
  const result = payload as { error?: unknown; data?: unknown };
  if (String(result.error) !== '0' || !Array.isArray(result.data)) throw new Error('This article is unavailable.');
  const row = result.data.find((item): item is Record<string, unknown> => !!item && typeof item === 'object' && newsSlug(string((item as Record<string, unknown>).url)) === slug);
  if (!row || !apiPlain(row.newsTitle)) throw new Error('Article not found.');
  // API subtitle names have varied; accept known variants and leave it empty when absent.
  const subtitleValue = row.newsSubtitle ?? row.newsSubTitle ?? row.subtitle ?? row.subTitle ?? row.sub_title ?? row.newsDescription;
  // details can be only a shortened introduction. otherDetails contains the
  // complete article and inline photos; retain both without repeating the intro.
  const details = mergeAcademicBody(articleHtml(row.details), articleHtml(row.otherDetails));
  return { id: String(row.id ?? slug), title: apiPlain(row.newsTitle), subtitle: apiPlain(subtitleValue), category: apiPlain(row.category ?? row.categoryName), date: apiPlain(row.newsDate), details, image: apiMedia(row.imageURL ?? row.image), slug };
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
