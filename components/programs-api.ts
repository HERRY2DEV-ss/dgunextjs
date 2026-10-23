import { resolveSiteHref, SITE_BASE } from './site-routes';
import { clientDguApiUrl, readDguApiJson } from './dgu-api-transport';
import { cleanAcademicLink } from './academic-clean-routes';
export type SchoolProgram = { id: string; name: string; href: string; level?: string };
export type ApiSchool = { id: string; title: string; href: string; url: string; programs: SchoolProgram[] };
type RawProgram = { id?: string | number; programName?: string; url?: string; levelName?: string; programLevel?: string; level?: string };
type RawLevel = { id?: string | number; levelName?: string; programs?: RawProgram[] };
type RawSchool = { id?: string | number; schoolName?: string; url?: string; programs?: (RawProgram | RawLevel)[]; childMenu?: (RawProgram | RawLevel)[]; level?: RawLevel[]; levels?: RawLevel[] };
// Restored catalogue rows omit school URLs. These are route identities from
// the supplied masterSchool records, never replacement names or page content.
const schoolUrlsById: Record<string, string> = {
  '1': 'school-of-business', '2': 'school-of-liberal-studies',
  '3': 'school-of-technology', '4': 'school-of-pharmacy',
  '5': 'school-of-modern-media', '6': 'school-of-agriculture-science',
  '7': 'school-of-future-skills', '8': 'school-of-law',
};
const endpoint = clientDguApiUrl('programs');
export function apiProgramHref(value: unknown, recordId?: string | number, kind?: 'school' | 'program'): string {
  if (typeof value !== 'string' || !value.trim() || value.trim() === '#') return '';
  try {
    const url = new URL(value.trim(), 'https://dgu.ac.in/');
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return '';
    if (!['dgu.ac.in', 'www.dgu.ac.in', 'doonbusinessschool.com', 'www.doonbusinessschool.com'].includes(url.hostname)) return resolveSiteHref(url.href);
    const slug = url.pathname.replace(/^\/+|\/+$/g, '');
    const known = resolveSiteHref(url.href);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)) return cleanAcademicLink(url.href,recordId,kind) || known;
    const school = kind ? kind === 'school' : slug.startsWith('school-of-') || known.startsWith(`${SITE_BASE}/schools/`);
    return cleanAcademicLink(url.href,recordId,school ? 'school' : 'program');
  } catch { return ''; }
}
const same = (a: RawProgram, b: RawProgram) => !!a && !!b && String(a.id ?? '') === String(b.id ?? '') && a.programName === b.programName && a.url === b.url;
export function parsePrograms(payload: unknown, schoolUrl = ''): ApiSchool[] {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid programs response.');
  const response = payload as { error?: unknown; data?: unknown };
  if (String(response.error) !== '0' || !Array.isArray(response.data)) throw new Error('Programs API did not return a successful data array.');
  // With SCHOOL_URL the restored endpoint returns level groups directly,
  // rather than a school envelope. Keep the requested school as the scope.
  const scopedLevels = schoolUrl && response.data.length > 0 && response.data.every(row => row && typeof row === 'object' && typeof row.levelName === 'string' && Array.isArray(row.programs) && !('schoolName' in row));
  const records: RawSchool[] = scopedLevels ? [{ url: schoolUrl, schoolName: '', childMenu: response.data as RawLevel[] }] : response.data;
  let previous: RawProgram[] = [];
  const schools = records.filter(school => school && typeof school.schoolName === 'string').map(school => {
    // The home feed's flat childMenu preserves the original programme order.
    // School feeds still use the updated, independent level groups.
    const catalogue = Array.isArray(school.programs) ? school.programs : school.childMenu;
    const flatHome = Array.isArray(catalogue) && catalogue.length > 0 && catalogue.every(item => item && typeof item === 'object' && 'programName' in item && !('programs' in item));
    const children = flatHome ? catalogue! : Array.isArray(school.level) ? school.level : Array.isArray(school.levels) ? school.levels : Array.isArray(catalogue) ? catalogue : [];
    let previousLevel: RawProgram[] = [];
    const raw: RawProgram[] = children.flatMap(child => {
      if (!child || typeof child !== 'object') return [];
      if (!('programs' in child)) return [child as RawProgram];
      const level = child as RawLevel, records = Array.isArray(level.programs) ? level.programs : [];
      const cumulativeLevel = !Array.isArray(school.level) && !Array.isArray(school.levels) && previousLevel.length > 0 && records.length >= previousLevel.length && previousLevel.every((item, index) => same(item, records[index]));
      const own = cumulativeLevel ? records.slice(previousLevel.length) : records;
      previousLevel = records;
      return own.map(item => ({ ...item, levelName: item.levelName || level.levelName }));
    });
    // The current feed appends earlier schools' programs to each next school.
    // Remove only an exact cumulative prefix; independent lists pass unchanged.
    const cumulative = !Array.isArray(school.level) && !Array.isArray(school.levels) && previous.length > 0 && raw.length >= previous.length && previous.every((item, index) => same(item, raw[index]));
    const own = cumulative ? raw.slice(previous.length) : raw;
    previous = raw;
    const seen = new Set<string>();
    const programs = own.filter(item => item && typeof item.programName === 'string' && item.programName.trim()).flatMap(item => {
      const id = String(item.id ?? `${item.programName}|${item.url}`);
      if (seen.has(id)) return [];
      seen.add(id);
      const level = item.levelName || item.programLevel || (typeof item.level === 'string' ? item.level : '');
      return [{ id, name: item.programName!.trim(), href: apiProgramHref(item.url, item.id), ...(level ? { level } : {}) }];
    });
    const url = school.url?.trim() || schoolUrlsById[String(school.id ?? '')] || '';
    return { id: String(school.id ?? (url || school.schoolName)), title: school.schoolName!.trim(), url, href: apiProgramHref(url, undefined, 'school'), programs };
  });
  return schools;
}
const pending = new Map<string, Promise<ApiSchool[]>>();
const cached = new Map<string, { expires: number; data: ApiSchool[] }>();
export function requestPrograms(schoolUrl = '', homeOnly = true): Promise<ApiSchool[]> {
  const scope = `${schoolUrl}|${homeOnly ? 'home' : 'all'}`;
  const saved = cached.get(scope);
  if (saved && saved.expires > Date.now()) return Promise.resolve(saved.data);
  const active = pending.get(scope);
  if (active) return active;
  const request = loadPrograms(schoolUrl, homeOnly).then(data => { cached.set(scope, { data, expires: Date.now() + 60000 }); return data; }).finally(() => pending.delete(scope));
  pending.set(scope, request);
  return request;
}
async function loadPrograms(schoolUrl: string, homeOnly: boolean): Promise<ApiSchool[]> {
  const key = process.env.NEXT_PUBLIC_DGU_MENU_API_KEY?.trim();
  if (!key) throw new Error('Programs API key is not configured.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Apikey: key },
      body: JSON.stringify(schoolUrl ? { SCHOOL_URL: schoolUrl } : homeOnly ? { IS_HOME: 1 } : {}), signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new Error(`Programs API returned HTTP ${response.status}.`);
    const schools=parsePrograms(await readDguApiJson(response, 'Programs API'), schoolUrl);
    // The scoped endpoint returns levels without the school's name or ID.
    // Its unscoped catalogue supplies that metadata; keep the scoped programs.
    if(schoolUrl && schools.some(school=>!school.title)){
      try{
        const catalogue=await requestPrograms('',false);
        return schools.map(school=>{
          const identity=catalogue.find(row=>row.url===school.url);
          return identity ? {...identity,programs:school.programs} : school;
        });
      }catch{return schools;}
    }
    return schools;
  } finally { clearTimeout(timeout); }
}
