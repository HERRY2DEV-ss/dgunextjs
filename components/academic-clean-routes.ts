import { academicProgramRoutes, academicSchoolRoutes, academicProgramRecordIds, academicCanonicalPrograms } from './academic-route-identities';
import { SITE_BASE } from './site-base';

export type AcademicIdentity = { slug: string; recordId: string };
type Kind = 'school' | 'program';
const validSlug = (slug: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug);
const validId = (id: string) => /^[1-9][0-9]*$/.test(id) && Number.isSafeInteger(Number(id));
const primaryRoute = (slug: string) => academicProgramRoutes[slug]===slug ? slug : Object.keys(academicProgramRoutes).find(key=>academicProgramRoutes[key]===slug);
export function academicRecordMatches(slug: string, id: string): boolean {
  if (!validId(id)) return false;
  const route=academicCanonicalPrograms[id];
  return !route || academicProgramRoutes[route]===slug;
}
export function academicDefaultId(slug: string): string {
  const route = primaryRoute(slug); return route ? academicProgramRecordIds[route] || '' : '';
}
export function academicHref(kind: Kind, slug: string, rawId: string | number = ''): string {
  if (!validSlug(slug)) return '';
  const id=String(rawId || ''); if (id && !validId(id)) return '';
  if (kind==='school') {
    const route=Object.keys(academicSchoolRoutes).find(key=>academicSchoolRoutes[key]===slug) || slug;
    return `${SITE_BASE}/schools/${route}/`;
  }
  const route=id ? academicCanonicalPrograms[id] : primaryRoute(slug);
  if (route && academicProgramRoutes[route]===slug) return `${SITE_BASE}/programs/${route}/`;
  if (id) return `${SITE_BASE}/programs/${slug}/${id}/`;
  // Future CMS records use the same shell via the scoped static-host rewrite.
  return `${SITE_BASE}/programs/${slug}/`;
}
export function academicPathIdentity(kind: Kind, pathname: string): AcademicIdentity | null {
  let path=pathname.replace(/^\/+|\/+$/g,'');
  for (const prefix of ['nextjs/homev1','nextjs/home-new','nextjs/home']) if(path.startsWith(prefix+'/')) {path=path.slice(prefix.length+1);break;}
  const parts=path.split('/');
  if(parts[0] !== (kind==='school'?'schools':'programs') || !parts[1] || parts.length>3) return null;
  if(kind==='school') return parts.length===2 && validSlug(parts[1]) ? {slug:academicSchoolRoutes[parts[1]] || parts[1],recordId:''} : null;
  if(parts.length===3) return validSlug(parts[1]) && validId(parts[2]) ? {slug:parts[1],recordId:parts[2]} : null;
  return validSlug(parts[1]) ? {slug:academicProgramRoutes[parts[1]] || parts[1],recordId:academicProgramRecordIds[parts[1]] || ''} : null;
}
/** Shared by every API's internal school/programme link normalizer. */
export function cleanAcademicLink(value: string, recordId?: string | number, kind?: Kind): string {
  let url: URL;try{url=new URL(value,'https://dgu.ac.in/');}catch{return '';}
  if(!['http:','https:'].includes(url.protocol) || url.username || url.password || !['dgu.ac.in','www.dgu.ac.in','dgu.ac','www.dgu.ac','doonbusinessschool.com','www.doonbusinessschool.com'].includes(url.hostname)) return '';
  let selectedKind=kind;
  const schoolPath=academicPathIdentity('school',url.pathname),programPath=academicPathIdentity('program',url.pathname);
  const plain=url.pathname.replace(/^\/+|\/+$/g,'');
  const schoolSlug=Object.values(academicSchoolRoutes).find(slug=>slug===plain);
  const programSlug=Object.values(academicProgramRoutes).find(slug=>slug===plain) || academicProgramRoutes[plain];
  selectedKind ||= schoolPath || schoolSlug || plain.startsWith('school-of-') || /\/school-detail\/?$/.test(url.pathname) ? 'school' : 'program';
  const identity=selectedKind==='school' ? schoolPath : programPath;
  const legacyDetail=/\/(?:program|school)-detail\/?$/.test(url.pathname);
  const slug=identity?.slug || (legacyDetail ? url.searchParams.get('slug') || '' : selectedKind==='school' ? schoolSlug || (kind || plain.startsWith('school-of-') ? plain : '') : programSlug || (kind ? plain : ''));
  if(!validSlug(slug))return '';
  let id=recordId===undefined ? identity?.recordId || url.searchParams.get('id') || '' : String(recordId);
  // Valid older duplicate-record links get their own permanent clean route.
  if(recordId===undefined && url.searchParams.has('id') && (!url.searchParams.has('slug') || url.searchParams.get('slug')===slug)) {
    const candidate=url.searchParams.get('id') || '';
    if(academicRecordMatches(slug,candidate))id=candidate;
  }
  if(recordId===undefined && id && !academicRecordMatches(slug,id))id=identity?.recordId || academicDefaultId(slug);
  const href=academicHref(selectedKind,slug,id);if(!href)return '';
  url.searchParams.delete('slug');url.searchParams.delete('id');
  const search=url.searchParams.toString();return href+(search?'?'+search:'')+url.hash;
}
