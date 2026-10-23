'use client';
import { useEffect, useState } from 'react';
import type { AcademicInfo, AcademicKind } from './academic-page-api';
import { requestPrograms } from './programs-api';
import { academicPathIdentity } from './academic-clean-routes';

const university = { logoSrc: '/nextjs/homev1/assets/dgu_logo_svg2.svg', logoAlt: 'DBS Global University' };
const business = { logoSrc: '/nextjs/homev1/assets/dgu_logo_svg3.svg', logoAlt: 'Doon Business School' };

/** Exact catalogue membership, never a name/prefix guess such as "MBA". */
export function isBusinessProgram(info: Pick<AcademicInfo, 'id' | 'slug'>, programs: readonly { id: string; href: string }[]) {
  return programs.some(program => program.id === info.id &&
    academicPathIdentity('program', new URL(program.href, 'https://dgu.ac.in').pathname)?.slug === info.slug);
}
export default function useAcademicBrand(kind: AcademicKind, slug: string, info: AcademicInfo | null) {
  const [membership, setMembership] = useState({ scope: '', business: false });
  const scope = `${kind}:${slug}:${info?.id || ''}`;
  const knownSchool = info?.schoolUrl || '';
  useEffect(() => {
    if (kind !== 'program' || !info || knownSchool) return;
    let active = true;
    requestPrograms('school-of-business', false).then(schools => {
      const own = schools.filter(school => school.url === 'school-of-business');
      if (active) setMembership({ scope, business: isBusinessProgram(info, own.flatMap(school => school.programs)) });
    }).catch(() => { if (active) setMembership({ scope, business: false }); });
    return () => { active = false; };
  }, [kind, scope, info, knownSchool]);
  const selected = kind === 'school' ? slug === 'school-of-business'
    : knownSchool ? knownSchool === 'school-of-business' : membership.scope === scope && membership.business;
  return selected ? business : university;
}
