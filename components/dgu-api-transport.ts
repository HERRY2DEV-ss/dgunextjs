/** Original developer endpoints. The optional base lets local/restored PHP APIs
 * use the same contracts without depending on a CMS folder or a data snapshot. */
export type DguFeed = 'menus' | 'programs' | 'program-info' | 'school-info' | 'admissions' | 'differentiators' | 'faculty' | 'reviews' | 'news' | 'footer' | 'homepage' | 'club' | 'recruiters' | 'placements' | 'hostel-life' | 'international' | 'glance' | 'sliders';
const filenames: Record<DguFeed, string> = {
  menus: 'get-menus.php', programs: 'get-programs.php', 'program-info': 'get-program-info.php',
  'school-info': 'get-school-info.php',
  admissions: 'get-admissions.php',
  placements: 'get-placements.php',
  'hostel-life': 'get-hostel-life.php',
  international: 'get-international.php',
  glance: 'get-glance.php', sliders: 'get-sliders.php',
  differentiators: 'get-differentiators.php',
  faculty: 'get-faculty.php', reviews: 'get-reviews.php', news: 'get-news.php',
  footer: 'get-footer.php', homepage: 'next-homepage-data.php', club: 'get-club.php', recruiters: 'get-recruiters.php',
};
const originalBase = 'https://dgu.ac.in/api';

export function liveDguApiUrl(feed: DguFeed, override = ''): string {
  const original = `${originalBase}/${filenames[feed]}`;
  const configuredBase = process.env.NEXT_PUBLIC_DGU_API_BASE_URL?.trim().replace(/\/+$/, '');
  const selected = override.trim();
  const raw = selected && selected !== original ? selected : configuredBase ? `${configuredBase}/${filenames[feed]}` : original;
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error('DGU API URL must be an absolute URL.'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.hash) {
    throw new Error('DGU API URL must use HTTPS, or HTTP on localhost, without credentials or a fragment.');
  }
  return url.href;
}

export function clientDguApiUrl(feed: DguFeed, override = ''): string {
  return process.env.NODE_ENV === 'development'
    ? `/api/dgu-${feed}/`
    : liveDguApiUrl(feed, override);
}

export class DguApiResponseError extends Error {
  constructor(message: string, public readonly reason: 'http' | 'endpoint-missing' | 'invalid-json', public readonly httpStatus: number) {
    super(message); this.name = 'DguApiResponseError';
  }
}

/** PHP previously returned valid JSON with text/html, so inspect the body.
 * A website's 404 HTML with HTTP 200 must never be accepted as API data. */
export async function readDguApiJson(response: Response, label = 'DGU API'): Promise<unknown> {
  if (!response.ok) throw new DguApiResponseError(`${label} returned HTTP ${response.status}.`, 'http', response.status);
  // The second branch supports existing response adapters as well as native fetch.
  if (typeof response.text !== 'function') {
    try { return await response.json() as unknown; }
    catch { throw new DguApiResponseError(`${label} returned invalid JSON.`, 'invalid-json', response.status); }
  }
  const body = await response.text();
  const normalized = body.replace(/^\uFEFF/, '');
  if (!normalized.trim()) throw new DguApiResponseError(`${label} returned an empty response.`, 'invalid-json', response.status);
  try { return JSON.parse(normalized) as unknown; }
  catch {
    const missing = /(?:<title[^>]*>[^<]*(?:404|page not found)|<h[1-6][^>]*>\s*404)/i.test(body);
    throw new DguApiResponseError(missing
      ? `${label} returned the website's 404 HTML page instead of JSON. Restore the original API endpoint on the server.`
      : `${label} returned invalid JSON.`, missing ? 'endpoint-missing' : 'invalid-json', response.status);
  }
}
