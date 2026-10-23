import { SITE_BASE } from './site-routes';
import type { AdmissionData, AdmissionResource } from './admissions-api';

// Keep the theme's existing detail URLs; match their content by the API source URL.
const sources: Record<string, string> = {
  'admission-requirements': 'admission-process',
  'programs-fee-structures': 'programs-fee-structures',
  'education-loan': 'education-loan',
  scholarships: 'scholarships',
  'hostel-life': 'hostel-types',
  'refund-policy': 'refund-policy',
  'international-student-admission': 'international-student-admission',
  'program-commencement-2026': 'program-commencement-2026',
  'placement-reports': 'placement-reports',
};

function sourceSlug(href: string): string {
  try {
    const url = new URL(href, 'https://dgu.ac.in/');
    if (!['dgu.ac.in', 'www.dgu.ac.in'].includes(url.hostname) || !['http:', 'https:'].includes(url.protocol)) return '';
    const slug = url.pathname.replace(/^\/+|\/+$/g, '').replace(/^nextjs\/(?:homev1|home-new|home)\//, '');
    if (slug.includes('/')) return '';
    return slug === 'program-commencement-date' ? 'program-commencement-2026' : slug;
  } catch { return ''; }
}

export function isAdmissionDetailSlug(slug: string): boolean {
  return Object.hasOwn(sources, slug);
}

export function admissionDetailHref(sourceHref: string): string {
  if (!sourceHref) return '';
  const source = sourceSlug(sourceHref);
  const route = Object.keys(sources).find(slug => sources[slug] === source);
  return route ? `${SITE_BASE}/${route}/` : '';
}

export function admissionDetail(data: AdmissionData, slug: string): AdmissionResource | null {
  if (!isAdmissionDetailSlug(slug)) return null;
  return data.details.find(item => sourceSlug(item.href) === sources[slug] && !!item.html.trim()) || null;
}
