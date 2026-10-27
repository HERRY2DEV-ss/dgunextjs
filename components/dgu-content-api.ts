/** Shared transport for the Reviews and Program Info feeds. */
import { clientDguApiUrl, readDguApiJson } from './dgu-api-transport';
import { PROGRAM_DETAILS_ENABLED, ProgramDetailsPausedError } from './program-detail-policy';
import { sitePath } from './site-base';
export type ApiRecord = Record<string, unknown>;
export const apiRecord = (value: unknown): ApiRecord | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as ApiRecord : null;
export const apiField = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
export function apiFields(value: ApiRecord): ApiRecord {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [apiField(key), item]));
}
export function apiValue(value: ApiRecord, ...names: string[]): unknown {
  for (const name of names) {
    const item = value[apiField(name)];
    if (item !== undefined && item !== null && item !== '') return item;
  }
  return undefined;
}
export function apiText(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}
export function apiPlain(value: unknown): string {
  const entities: Record<string, string> = {
    ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’',
    ndash: '–', mdash: '—', hellip: '…', middot: '·', bull: '•',
    laquo: '«', raquo: '»', copy: '©', reg: '®', trade: '™',
    lt: '<', gt: '>', ensp: ' ', emsp: ' ', thinsp: ' ', shy: '',
  };
  return apiText(value).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"').replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&([a-z]+);/gi, (entity, name: string) => entities[name.toLowerCase()] ?? entity)
    .replace(/&#(x[0-9a-f]+|[0-9]+);/gi, (entity, code: string) => {
      const point = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code);
      return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
    }).replace(/\s+/g, ' ').trim();
}
export function apiLayoutClasses(value: string): string[] {
  const layoutClasses: Record<string, string> = {
    'badge-row': 'dgu-api-badges', badge: 'dgu-api-badge', tags: 'dgu-api-badges', tag: 'dgu-api-badge',
    actions: 'dgu-api-actions', metrics: 'dgu-api-metrics', met: 'dgu-api-metric',
    'met-n': 'dgu-api-metric-value', 'met-l': 'dgu-api-metric-label',
    'industry-collab-main': 'dgu-api-logo-groups', 'industry-collab': 'dgu-api-logo-group',
    'industry-collab-img-box-main': 'dgu-api-logo-row', 'industry-collab-img-box': 'dgu-api-logo',
    row: 'dgu-api-row', 'text-center': 'dgu-api-text-center', 'text-justify': 'dgu-api-text-justify',
  };
  const classes = value.split(/\s+/).flatMap(name => {
    if (layoutClasses[name]) return [layoutClasses[name]];
    const column = /^col-(sm|md|lg)-(3|4|5|6|7|12)$/.exec(name);
    return column ? [`dgu-api-col-${column[1]}-${column[2]}`] : [];
  });
  return [...new Set(classes)];
}
export function apiMedia(value: unknown): string {
  const raw = apiText(value);
  if (!raw) return '';
  try {
    const url = new URL(raw, 'https://dgu.ac.in/');
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return '';
    if (['dgu.ac.in', 'www.dgu.ac.in'].includes(url.hostname)) url.pathname = url.pathname.replace(/\/{2,}/g, '/');
    return sitePath(url.href);
  } catch { return ''; }
}
export function apiData(payload: unknown, aliases: string[]): unknown {
  if (Array.isArray(payload)) return payload;
  const record = apiRecord(payload);
  if (!record) throw new Error('The API returned an invalid response.');
  const fields = apiFields(record);
  if (fields.error !== undefined && fields.error !== null && fields.error !== false && String(fields.error) !== '0') throw new Error('The API reported an error.');
  if (fields.success === false || fields.success === 0 || fields.success === '0' || fields.status === false) {
    throw new Error('The API request was unsuccessful.');
  }
  const data = apiValue(fields, 'data', ...aliases);
  if (data !== undefined) return data;
  // Some PHP endpoints return a single record rather than a data envelope.
  if (fields.error === undefined && fields.success === undefined) return record;
  throw new Error('The API response does not contain data.');
}

type Feed = 'reviews' | 'program';
export async function postContent(feed: Feed, body: ApiRecord): Promise<unknown> {
  if (feed === 'program' && !PROGRAM_DETAILS_ENABLED) throw new ProgramDetailsPausedError();
  const key = (feed === 'reviews' ? process.env.NEXT_PUBLIC_DGU_REVIEWS_API_KEY : process.env.NEXT_PUBLIC_DGU_PROGRAM_INFO_API_KEY)?.trim()
    || process.env.NEXT_PUBLIC_DGU_MENU_API_KEY?.trim();
  if (!key || /^(PASTE_YOUR_API_KEY_HERE|YOUR_ACTUAL_API_KEY|apikey)$/i.test(key)) {
    throw new Error('Set the existing NEXT_PUBLIC_DGU_MENU_API_KEY and restart or rebuild.');
  }
  const upstream = (feed === 'reviews' ? process.env.NEXT_PUBLIC_DGU_REVIEWS_API_URL : process.env.NEXT_PUBLIC_DGU_PROGRAM_INFO_API_URL)?.trim()
    || ('https://dgu.ac.in/api/' + (feed === 'reviews' ? 'get-reviews.php' : 'get-program-info.php'));
  const endpoint = clientDguApiUrl(feed === 'reviews' ? 'reviews' : 'program-info', upstream);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Apikey: key },
      body: JSON.stringify(body), cache: 'no-store', signal: controller.signal,
    });
    if (!response.ok) throw new Error('DGU API returned HTTP ' + response.status + '.');
    return await readDguApiJson(response);
  } catch (error) {
    if (controller.signal.aborted) throw new Error('The DGU API request timed out.');
    throw error;
  } finally { clearTimeout(timeout); }
}

/** Only successfully parsed data is cached; simultaneous requests share one POST. */
export function contentCache<T>() {
  const pending = new Map<string, Promise<T>>();
  const cached = new Map<string, { value: T; expires: number }>();
  return (key: string, load: () => Promise<T>): Promise<T> => {
    const saved = cached.get(key);
    if (saved && saved.expires > Date.now()) return Promise.resolve(saved.value);
    const active = pending.get(key);
    if (active) return active;
    const request = load().then(value => {
      cached.set(key, { value, expires: Date.now() + 60000 });
      return value;
    }).finally(() => pending.delete(key));
    pending.set(key, request);
    return request;
  };
}
