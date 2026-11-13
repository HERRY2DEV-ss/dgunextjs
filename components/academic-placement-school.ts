import { academicProgramRoutes, academicSchoolRoutes } from './academic-route-identities';
import { specializationParent } from './academic-specializations';
import type { AcademicInfo } from './academic-page-api';
import { programPages } from './program-page-data';

export function placementSchoolUrl(info: AcademicInfo): string | undefined {
  if (info.kind !== 'program') return undefined;
  if (info.schoolUrl) return academicSchoolRoutes[info.schoolUrl] || info.schoolUrl;

  const routeSlug = Object.keys(academicProgramRoutes).find(slug => academicProgramRoutes[slug] === info.slug);
  const schoolAlias = programPages[info.slug]?.schoolSlug
    || (routeSlug ? programPages[routeSlug]?.schoolSlug : undefined)
    || (routeSlug === 'integrated-btech-mba' || routeSlug === 'integrated-btech-mtech' ? 'advanced-computing' : undefined);
  if (schoolAlias) return academicSchoolRoutes[schoolAlias] || schoolAlias;

  const parent = specializationParent(info);
  const parentSchool = parent?.slug === 'btech' ? 'advanced-computing'
    : parent && ['mba', 'bba', 'bcom'].includes(parent.slug) ? 'business' : '';
  return parentSchool ? academicSchoolRoutes[parentSchool] : undefined;
}
