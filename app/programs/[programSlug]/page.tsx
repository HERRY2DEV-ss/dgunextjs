import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import AcademicQueryPage from '../../../components/AcademicQueryPage';
import { academicProgramRoutes, academicProgramRecordIds } from '../../../components/academic-route-identities';
import { academicSlug } from '../../../components/academic-page-api';
type Props={params:Promise<{programSlug:string}>};
export function generateStaticParams(){return Object.keys(academicProgramRoutes).map(programSlug=>({programSlug}));}
export const metadata:Metadata={title:'Programme | DBS Global University'};
export default async function ProgramRoute({params}:Props){
  const {programSlug}=await params,slug=academicProgramRoutes[programSlug] || academicSlug(programSlug);if(!slug)notFound();
  return <Suspense fallback={<p role="status">Loading programme information…</p>}><AcademicQueryPage kind="program" defaultUrl={slug} defaultRecordId={academicProgramRecordIds[programSlug] || ''}/></Suspense>;
}
