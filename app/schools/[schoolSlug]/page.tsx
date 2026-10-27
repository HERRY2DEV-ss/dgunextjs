import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import AcademicQueryPage from '../../../components/AcademicQueryPage';
import { academicSchoolRoutes } from '../../../components/academic-route-identities';
import { academicSlug } from '../../../components/academic-page-api';
import { loadAcademicSeoMetadata } from '../../../components/academic-seo-metadata';
type Props={params:Promise<{schoolSlug:string}>};
export function generateStaticParams(){return Object.keys(academicSchoolRoutes).map(schoolSlug=>({schoolSlug}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {schoolSlug}=await params;
  const slug=academicSchoolRoutes[schoolSlug] || academicSlug(schoolSlug);
  if(!slug)return {};
  try{
    const seo=await loadAcademicSeoMetadata('school',slug);
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
    console.warn(`Unable to load API-provided school metadata for route "${schoolSlug}".`);
    return {title:'',description:''};
  }
}
export default async function SchoolRoute({params}:Props){
  const {schoolSlug}=await params,slug=academicSchoolRoutes[schoolSlug] || academicSlug(schoolSlug);if(!slug)notFound();
  return <Suspense fallback={<p role="status">Loading school information…</p>}><AcademicQueryPage kind="school" defaultUrl={slug}/></Suspense>;
}
