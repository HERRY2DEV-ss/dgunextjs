import { sitePath } from './site-base';
import type { FacultyMember } from './faculty-data';
import { clientDguApiUrl, readDguApiJson } from './dgu-api-transport';

export type ApiFaculty = FacultyMember & {
  id: string; slug: string; qualification: string; experience: string;
  department: string; school: string; details: string;
};
export type FacultyScope = { URL?: string; SCHOOL_URL?: string };
const endpoint = clientDguApiUrl('faculty');

// Frontend route names differ from the school's original DGU URL names.
export const facultySchoolUrls: Record<string, string> = {
  business: 'school-of-business', 'advanced-computing': 'school-of-technology',
  law: 'school-of-law', 'liberal-studies': 'school-of-liberal-studies',
  'modern-media': 'school-of-modern-media', pharmacy: 'school-of-pharmacy',
  'agriculture-forestry': 'school-of-agriculture-science', 'future-skills': 'school-of-future-skills',
};

type Row = Record<string, unknown>;
function row(value: unknown): Row | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : null;
}
function fields(value: Row): Row {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key.toLowerCase().replace(/[_\s-]/g, ''), item]));
}
function text(source: Row, ...keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if ((typeof value === 'string' || typeof value === 'number') && String(value).trim()) return String(value).trim();
  }
  return '';
}
function plain(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"').replace(/&#0?39;|&apos;/gi, "'").replace(/\s+/g, ' ').trim();
}
export function facultySlug(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim(), 'https://dgu.ac.in/');
    if (!['http:', 'https:'].includes(url.protocol) || !['dgu.ac.in', 'www.dgu.ac.in'].includes(url.hostname)) return '';
    const slug = url.pathname.replace(/^\/+|\/+$/g, '');
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug) ? slug.toLowerCase() : '';
  } catch { return ''; }
}
export function facultyProfileHref(value: unknown): string {
  const slug = facultySlug(value);
  return slug ? sitePath(`/faculties/profile/?url=${encodeURIComponent(slug)}`) : '';
}
function imageUrl(value: string): string {
  if (!value) return '';
  // The School endpoint currently puts course slugs such as "mca" here.
  // They are page URLs, not photographs. A bare photo filename uses the
  // upload directory returned by the actual Faculty API.
  const filename = !/[/:]/.test(value) && /\.(?:avif|webp|png|jpe?g|gif)(?:[?#]|$)/i.test(value);
  if (!/[/:]/.test(value) && !filename) return '';
  try {
    const url = new URL(filename ? '/uploads/images/faculty/' + value : value, 'https://dgu.ac.in/');
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return '';
    if (['dgu.ac.in', 'www.dgu.ac.in'].includes(url.hostname)) url.pathname = url.pathname.replace(/\/{2,}/g, '/');
    return url.href;
  } catch { return ''; }
}

/** Accepts named PHP fields with snake_case/camelCase without depending on their casing. */
export function parseFaculty(payload: unknown, scope: FacultyScope = {}): ApiFaculty[] {
  const response = row(payload);
  if (!response) throw new Error('Invalid faculty response.');
  const header = fields(response);
  if (header.error !== undefined && String(header.error) !== '0') throw new Error('Faculty API did not return a successful response.');
  if (String(header.result ?? '').toLowerCase() === 'error') throw new Error('Faculty API request failed.');
  if (header.success === false || header.status === false) throw new Error('Faculty API request failed.');
  const source = header.data ?? header.faculty ?? header.faculties;
  const entries = Array.isArray(source) ? source : row(source) ? [source] : null;
  if (!entries) throw new Error('Faculty data is missing.');
  const seen = new Set<string>();
  const members: ApiFaculty[] = [];
  for (const entry of entries) {
    const original = row(entry);
    if (!original) continue;
    const f = fields(original);
    const name = plain(text(f, 'facultyname', 'name', 'fullname', 'title'));
    if (!name) continue;
    const rawUrl = text(f, 'url', 'facultyurl', 'slug', 'profileurl');
    const suppliedSlug = facultySlug(rawUrl), requestedSlug = facultySlug(scope.URL);
    if (requestedSlug && (suppliedSlug ? suppliedSlug !== requestedSlug : entries.length !== 1)) continue;
    const slug = suppliedSlug || (entries.length === 1 ? requestedSlug : '');
    const id = text(f, 'id', 'facultyid', 'sno') || slug || name;
    if (seen.has(id)) continue;
    seen.add(id);
    const role = plain(text(f, 'designation', 'facultydesignation', 'role', 'position'));
    const qualification = plain(text(f, 'qualification', 'qualifications', 'facultyqualification'));
    const experience = plain(text(f, 'experience', 'totalexperience', 'facultyexperience'));
    const department = plain(text(f, 'department', 'departmentname', 'facultydepartment'));
    const school = plain(text(f, 'schoolname', 'school'));
    const note = plain(text(f, 'shortinfo', 'shortdescription', 'subtitle', 'tagline', 'note'));
    const tabs = f.tabs;
    const tabRows = Array.isArray(tabs) ? tabs : row(tabs) ? [tabs] : [];
    const tabDetails = tabRows.flatMap(item => { const original = row(item); if (!original) return []; const t = fields(original); const title = plain(text(t, 'tabname', 'title', 'name')); const copy = text(t, 'details', 'tabdetails', 'content', 'description'); const alreadyTitled = plain(copy.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i)?.[1] || '') === title; return copy ? [`${title && !alreadyTitled ? `<h2>${title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h2>` : ''}${copy}`] : []; }).join('\n');
    members.push({ id, slug, name, role, qualification, experience, department, school,
      image: imageUrl(text(f, 'image', 'imageurl', 'facultyimage', 'facultyimageurl', 'photo', 'profileimage', 'photograph')),
      href: facultyProfileHref(slug), vidwan: plain(text(f, 'vidwan', 'vidwanid')),
      notes: [note, qualification, experience, department].filter(Boolean),
      category: role || 'Faculty',
      details: [text(f, 'details', 'description', 'about', 'biography', 'profile', 'content'), tabDetails].filter(Boolean).join('\n'),
    });
  }
  if (entries.length && !members.length) throw new Error('Faculty response did not contain readable faculty records.');
  return members;
}

const cached = new Map<string, { expires: number; data: ApiFaculty[] }>();
const pending = new Map<string, Promise<ApiFaculty[]>>();
export function requestFaculty(scope: FacultyScope = {}): Promise<ApiFaculty[]> {
  if (scope.URL && scope.SCHOOL_URL) return Promise.reject(new Error('Choose a faculty profile or a school.'));
  const slug = scope.URL ? facultySlug(scope.URL) : scope.SCHOOL_URL ? facultySlug(scope.SCHOOL_URL) : '';
  if ((scope.URL || scope.SCHOOL_URL) && !slug) return Promise.reject(new Error('Invalid faculty URL.'));
  const body: FacultyScope = scope.URL ? { URL: slug } : scope.SCHOOL_URL ? { SCHOOL_URL: slug } : {};
  const cacheKey = JSON.stringify(body);
  const saved = cached.get(cacheKey);
  if (saved && saved.expires > Date.now()) return Promise.resolve(saved.data);
  const active = pending.get(cacheKey);
  if (active) return active;
  const promise = loadFaculty(body).then(data => {
    cached.set(cacheKey, { expires: Date.now() + 60000, data });
    return data;
  }).finally(() => pending.delete(cacheKey));
  pending.set(cacheKey, promise);
  return promise;
}
async function loadFaculty(scope: FacultyScope): Promise<ApiFaculty[]> {
  const key = process.env.NEXT_PUBLIC_DGU_FACULTY_API_KEY?.trim() || process.env.NEXT_PUBLIC_DGU_MENU_API_KEY?.trim();
  if (!key) throw new Error('Faculty API key is not configured.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Apikey: key },
      body: JSON.stringify(scope), signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new Error(`Faculty API returned HTTP ${response.status}.`);
    return parseFaculty(await readDguApiJson(response, 'Faculty API'), scope);
  } finally { clearTimeout(timeout); }
}
