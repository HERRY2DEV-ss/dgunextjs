'use client';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import SchoolPage from './SchoolPage';
import ProgramPage from './ProgramPage';
import { academicSlug, type AcademicKind } from './academic-page-api';
import { academicDefaultId, academicHref, academicPathIdentity, academicRecordMatches, type AcademicIdentity } from './academic-clean-routes';

/** The path owns the page identity. Old query links redirect to that clean path. */
export default function AcademicQueryPage({kind,defaultUrl='',defaultRecordId=''}:{kind:AcademicKind;defaultUrl?:string;defaultRecordId?:string}) {
  const pathname=usePathname(),query=useSearchParams();
  const [visiblePath,setVisiblePath]=useState('');
  const pathIdentity=academicPathIdentity(kind,visiblePath || pathname);
  const defaultSlug=academicSlug(defaultUrl);
  let identity:AcademicIdentity=defaultSlug
    ? {slug:defaultSlug,recordId:kind==='program' ? defaultRecordId || academicDefaultId(defaultSlug) : ''}
    : pathIdentity || {slug:academicSlug(query.get('slug') || ''),recordId:kind==='program' ? query.get('id') || '' : ''};
  const legacyId=query.get('id') || '',legacySlug=academicSlug(query.get('slug') || '');
  // Duplicate URLs historically used an ID; retain their identity in a separate path.
  if(defaultSlug && kind==='program' && legacyId && (!legacySlug || legacySlug===defaultSlug) && academicRecordMatches(defaultSlug,legacyId))identity={slug:defaultSlug,recordId:legacyId};
  const slug=identity.slug,recordId=identity.recordId;
  useEffect(()=>{
    const actual=new URL(window.location.href);
    setVisiblePath(actual.pathname);
    const selected=defaultSlug ? {slug,recordId} : academicPathIdentity(kind,actual.pathname) || {slug,recordId};
    const href=academicHref(kind,selected.slug,selected.recordId);if(!href)return;
    actual.searchParams.delete('slug');actual.searchParams.delete('id');
    const clean=href+actual.search+actual.hash;
    if(actual.pathname!==href)window.location.replace(clean);
    else if(window.location.pathname+window.location.search+window.location.hash!==clean)window.history.replaceState(null,'',clean);
  },[kind,slug,recordId,defaultSlug,pathname]);
  return kind==='school' ? <SchoolPage key={slug} slug={slug} /> : <ProgramPage key={`${slug}:${recordId}`} slug={slug} recordId={recordId} />;
}
