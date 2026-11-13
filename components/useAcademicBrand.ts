'use client';
import { sitePath } from './site-base';

import { useEffect, useState } from 'react';
import type { AcademicInfo, AcademicKind } from './academic-page-api';
import { requestPrograms } from './programs-api';
import { academicPathIdentity } from './academic-clean-routes';

const university = { logoSrc: sitePath('/assets/svg/logo_diwali_rocket_right.gif'), logoAlt: 'DBS Global University' };
const business = { logoSrc: sitePath('/assets/dgu_logo_svg3.svg'), logoAlt: 'Doon Business School' };

/** Exact catalogue membership, never a name/prefix guess such as "MBA". */
export function isBusinessProgram(info: Pick<AcademicInfo, 'id' | 'slug'>, programs: readonly { id: string; href: string }[]) {
  return programs.some(program => program.id === info.id &&
    academicPathIdentity('program', new URL(program.href, 'https://dgu.ac.in').pathname)?.slug === info.slug);
}
export default function useAcademicBrand(kind: AcademicKind, slug: string, info: AcademicInfo | null) {
  const [membership, setMembership] = useState({ scope: '', business: false });
  const programId = info?.id || '';
  const programSlug = info?.slug || '';
  const scope = `${kind}:${slug}:${programId}`;
  const knownSchool = info?.schoolUrl || '';
  useEffect(() => {
    if (kind !== 'program' || !programId || !programSlug || knownSchool) return;
    let active = true;
    requestPrograms('school-of-business', false).then(schools => {
      const own = schools.filter(school => school.url === 'school-of-business');
      if (active) setMembership({ scope, business: isBusinessProgram({ id: programId, slug: programSlug }, own.flatMap(school => school.programs)) });
    }).catch(() => { if (active) setMembership({ scope, business: false }); });
    return () => { active = false; };
  }, [kind, scope, programId, programSlug, knownSchool]);
  const selected = kind === 'school' ? slug === 'school-of-business'
    : knownSchool ? knownSchool === 'school-of-business' : membership.scope === scope && membership.business;
  return selected ? business : university;
}
