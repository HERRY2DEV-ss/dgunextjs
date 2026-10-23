import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import AcademicQueryPage from '../../../components/AcademicQueryPage';
import { academicSchoolRoutes } from '../../../components/academic-route-identities';
import { academicSlug } from '../../../components/academic-page-api';
type Props={params:Promise<{schoolSlug:string}>};
export function generateStaticParams(){return Object.keys(academicSchoolRoutes).map(schoolSlug=>({schoolSlug}));}
export const metadata:Metadata={title:'School | DBS Global University'};
export default async function SchoolRoute({params}:Props){
  const {schoolSlug}=await params,slug=academicSchoolRoutes[schoolSlug] || academicSlug(schoolSlug);if(!slug)notFound();
  return <Suspense fallback={<p role="status">Loading school information…</p>}><AcademicQueryPage kind="school" defaultUrl={slug}/></Suspense>;
}
