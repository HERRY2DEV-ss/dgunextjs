import type { ClubPageData, ClubPerson } from './club-detail-types';
import { clientDguApiUrl, liveDguApiUrl, readDguApiJson } from './dgu-api-transport';
import { resolveSiteHref } from './site-routes';
import { clubMedia } from './club-detail-media';
import { apiPlain } from './dgu-content-api';
export type ClubSummary = { id: string; name: string; slug: string; href: string; image: string };

type RecordValue = Record<string, unknown>;
const object = (value: unknown): RecordValue => value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : {};
const array = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const cleanHtml = (value: string) => value.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|noscript|template)\b[^>]*>[\s\S]*?<\/\1>/gi, '');

/** Extract content only; CMS comments, scripts, styles and layout stay out. */
function text(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  const plain = cleanHtml(String(value)).replace(/<[^>]*>/g, ' ');
  return apiPlain(plain);
}
function blocks(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  if (typeof value !== 'string') return [];
  return cleanHtml(value).replace(/<br\s*\/?\s*>|<\/(?:p|li|h[1-6]|blockquote)>/gi, '\n').split(/\r?\n/).map(text).filter(Boolean);
}
function list(value: unknown): string[] {
  if (Array.isArray(value)) return blocks(value);
  if (typeof value !== 'string') return [];
  const html = cleanHtml(value);
  const items = [...html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map(match => text(match[1])).filter(Boolean);
  return items.length ? items : blocks(html);
}
function listIntro(value: unknown): string {
  return typeof value === 'string' ? text(cleanHtml(value).replace(/<[uo]l\b[^>]*>[\s\S]*?<\/[uo]l>/gi, '')) : '';
}
function url(value: unknown, origin: string): string {
  if (typeof value !== 'string' || !value.trim() || value.trim() === '#') return '';
  try {
    const parsed = new URL(value.trim(), origin);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) return '';
    parsed.pathname = parsed.pathname.replace(/\/{2,}/g, '/');
    return parsed.href;
  } catch { return ''; }
}
export function canonicalClubSlug(slug: string): string {
  const aliases: Record<string, string> = { 'bulls-bears-club': 'bulls-and-bears-club', 'fit-dot-quit-club': 'fit-dont-quit-club' };
  return aliases[slug] || slug;
}

/** Verified get-club.php fields, including HTML content and faculty records. */
export function normalizeClubResponse(payload: unknown, requestedSlug: string, origin = 'https://dgu.ac.in/'): ClubPageData {
  const expectedSlug = canonicalClubSlug(requestedSlug);
  const envelope = object(payload);
  if (envelope.error !== undefined && ![0, '0', false, null].includes(envelope.error as 0 | '0' | false | null)) throw new Error('The club API reported an error.');
  if ([false, 0, '0'].includes(envelope.success as false | 0 | '0')) throw new Error('The club API request failed.');
  let candidate: unknown = envelope.data ?? payload;
  if (Array.isArray(candidate)) candidate = candidate.find(item => text(object(item).url ?? object(item).slug) === expectedSlug);
  const data = object(candidate);
  const slug = text(data.url ?? data.slug);
  const name = text(data.clubName ?? data.name);
  if (!name || slug !== expectedSlug) throw new Error('The requested club was not returned by the API.');
  const hero = object(data.hero), benefits = object(data.benefits), video = object(data.video), achievements = object(data.achievements);
  const objectiveItems = list(data.objectives ?? benefits.items);
  const achievementItems = list(typeof data.achievements === 'string' ? data.achievements : achievements.items);
  const people = (value: unknown): ClubPerson[] => array(value).map((item, index) => {
    const person = object(item);
    const profile = text(person.url ?? person.profileUrl);
    return { id: text(person.id) || String(index), name: text(person.name), role: text(person.designation ?? person.role), image: url(person.imageURL ?? person.image, origin), bio: text(person.otherDetails ?? person.bio), profileUrl: profile && profile !== '#' ? resolveSiteHref(profile) : '' };
  }).filter(person => Boolean(person.name));
  const media = clubMedia(slug);
  return {
    slug, name,
    hero: data.hero ? { image: url(hero.image, origin), imageAlt: text(hero.imageAlt), titleLines: blocks(hero.titleLines), subtitle: text(hero.subtitle), fullImage: Boolean(hero.fullImage) } : media.hero,
    description: blocks(data.details ?? data.description),
    benefits: objectiveItems.length ? { title: text(benefits.title) || 'WHAT STUDENTS CAN GAIN', intro: data.objectives ? listIntro(data.objectives) : text(benefits.intro), emblem: url(data.imageURL ?? benefits.emblem, origin) || media.emblem || '', items: slug === 'robotics-and-automation-club' && objectiveItems.length === 6 ? [0, 3, 4, 2, 5, 1].map(index => objectiveItems[index]) : objectiveItems } : undefined,
    video: data.video ? { poster: url(video.poster, origin), url: url(video.url, origin), title: text(video.title) } : media.video,
    achievements: achievementItems.length ? { title: text(achievements.title) || 'ACHIEVEMENTS', intro: typeof data.achievements === 'string' ? listIntro(data.achievements) : text(achievements.intro), items: achievementItems } : undefined,
    otherDetails: blocks(data.otherDetails),
    leadersTitle: text(data.leadersTitle), leaders: people(data.leaders), patrons: people(data.patrons), rules: list(data.rules),
    contacts: array(data.contacts).map(item => { const entry = object(item); return { name: text(entry.name), role: text(entry.role), email: text(entry.email), phone: text(entry.phone), address: text(entry.address) }; }).filter(entry => Boolean(entry.name || entry.email || entry.phone || entry.address)),
    testimonials: array(data.testimonials).map(item => { const entry = object(item); return { name: text(entry.name), role: text(entry.role), quote: text(entry.quote), image: url(entry.image, origin) }; }).filter(entry => Boolean(entry.quote)),
  };
}

const endpointOverride = () => process.env.NEXT_PUBLIC_DGU_CLUB_API_URL?.trim() || '';
async function requestClub(body: Record<string, string>, signal?: AbortSignal): Promise<unknown> {
  const key = process.env.NEXT_PUBLIC_DGU_CLUB_API_KEY?.trim() || process.env.NEXT_PUBLIC_DGU_MENU_API_KEY?.trim();
  if (!key) throw new Error('The club API key is not configured.');
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 20000);
  try {
    const response = await fetch(clientDguApiUrl('club', endpointOverride()), {
      method: 'POST', headers: { 'Content-Type': 'application/json', Apikey: key },
      body: JSON.stringify(body), cache: 'no-store', signal: controller.signal,
    });
    return await readDguApiJson(response, 'Club API');
  } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
}
let clubsPending: Promise<RecordValue[]> | undefined;
function fetchClubRecords(): Promise<RecordValue[]> {
  if (clubsPending) return clubsPending;
  clubsPending = requestClub({}).then(payload => {
    const response = object(payload);
    if (String(response.error) !== '0' || !Array.isArray(response.data)) throw new Error('Club list unavailable.');
    return response.data.map(object);
  }).finally(() => { clubsPending = undefined; });
  return clubsPending;
}
export function parseClubs(payload: unknown): ClubSummary[] {
  const response = object(payload);
  if (String(response.error) !== '0' || !Array.isArray(response.data)) throw new Error('Club list unavailable.');
  const seen = new Set<string>();
  return response.data.flatMap(entry => {
    const row = object(entry), name = text(row.clubName), rawSlug = text(row.url);
    if (!name) return [];
    const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(rawSlug) ? canonicalClubSlug(rawSlug) : '';
    const id = text(row.id) || `${name}|${rawSlug}`;
    if (seen.has(id)) return [];
    seen.add(id);
    return [{ id, name, slug, href: slug ? resolveSiteHref(`https://dgu.ac.in/${slug}`) : '', image: url(row.imageURL, 'https://dgu.ac.in/') }];
  });
}
/** Listing and detail pages share the exact same authenticated list response. */
export async function fetchClubs(): Promise<ClubSummary[]> {
  return parseClubs({ error: '0', data: await fetchClubRecords() });
}
export async function fetchClubPage(requestedSlug: string, signal?: AbortSignal): Promise<ClubPageData> {
  const slug = canonicalClubSlug(requestedSlug);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)) throw new Error('Invalid club URL.');
  const [detail, logos] = await Promise.allSettled([requestClub({ URL: slug }, signal), fetchClubRecords()]);
  if (detail.status === 'rejected') throw detail.reason;
  const origin = new URL('/', liveDguApiUrl('club', endpointOverride())).href;
  const data = normalizeClubResponse(detail.value, slug, origin);
  if (data.benefits && slug !== 'robotics-and-automation-club' && logos.status === 'fulfilled') {
    const club = logos.value.find(row => text(row.url) === slug);
    if (club) data.benefits.emblem = url(club.imageURL, origin);
  }
  return data;
}
