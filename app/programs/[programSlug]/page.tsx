import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import AcademicQueryPage from '../../../components/AcademicQueryPage';
import { academicProgramRoutes, academicProgramRecordIds } from '../../../components/academic-route-identities';
import { academicSlug } from '../../../components/academic-page-api';
import { loadProgrammeSeoMetadata } from '../../../components/academic-seo-metadata';
type Props={params:Promise<{programSlug:string}>};
export function generateStaticParams(){return Object.keys(academicProgramRoutes).map(programSlug=>({programSlug}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {programSlug}=await params;
  const slug=academicProgramRoutes[programSlug] || academicSlug(programSlug);
  if(!slug)return {};
  try{
    const seo=await loadProgrammeSeoMetadata(slug,academicProgramRecordIds[programSlug] || '');
    const canonical=seo.canonical || undefined;
    const openGraph=seo.title || seo.description ? {
      ...(seo.title ? {title:seo.title} : {}),
      ...(seo.description ? {description:seo.description} : {}),
      ...(canonical ? {url:canonical} : {}),
    } : undefined;
    return {
      title:seo.title,
      description:seo.description,
      ...(seo.keywords ? {keywords:seo.keywords} : {}),
      ...(canonical ? {alternates:{canonical}} : {}),
      ...(openGraph ? {openGraph} : {}),
    };
  }catch{
    console.warn(`Unable to load API-provided programme metadata for route "${programSlug}".`);
    return {title:'',description:''};
  }
}
export default async function ProgramRoute({params}:Props){
  const {programSlug}=await params,slug=academicProgramRoutes[programSlug] || academicSlug(programSlug);if(!slug)notFound();
  return <Suspense fallback={<p role="status">Loading programme information…</p>}><AcademicQueryPage kind="program" defaultUrl={slug} defaultRecordId={academicProgramRecordIds[programSlug] || ''}/></Suspense>;
}
