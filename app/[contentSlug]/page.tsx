import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LocalContentPage from '../../components/LocalContentPage';
import { getLocalPage, localPages } from '../../components/local-pages';
import { localProgramSlug } from '../../components/local-program-data';
import AdmissionDetailPage from '../../components/AdmissionDetailPage';
import SuccessStoryDetailPage from '../../components/SuccessStoryDetailPage';
import { isAdmissionDetailSlug } from '../../components/admissions-routes';
import './local-content.css';

export const dynamicParams = false;
export function generateStaticParams() { return [...localPages.filter(page => !['hostel-life', 'office-of-international-affairs', 'dgu-at-glance'].includes(page.slug)).map(page => ({ contentSlug: page.slug })), { contentSlug: 'startup-entrepreneurial-success' }, { contentSlug: 'higher-education' }]; }
export async function generateMetadata({ params }: { params: Promise<{ contentSlug: string }> }): Promise<Metadata> {
  const { contentSlug } = await params;
  if (contentSlug === 'placement-reports') return { title: 'Placements | DBS Global University' };
  if (contentSlug === 'startup-entrepreneurial-success') return { title: 'Startup & Entrepreneurial Success | DBS Global University' };
  if (contentSlug === 'higher-education') return { title: 'Higher Education | DBS Global University' };
  if (isAdmissionDetailSlug(contentSlug)) return { title: 'Admissions | DBS Global University' };
  const page = getLocalPage(contentSlug);
  if (page && localProgramSlug(page)) return { title: 'Programme | DBS Global University' };
  if (page?.kind === 'profile' && page.group === 'Faculty') return { title: 'Faculty profile | DBS Global University' };
  return { title: page ? `${page.label} | DBS Global University` : 'Page not found | DBS Global University' };
}
export default async function NavigationContentRoute({ params }: { params: Promise<{ contentSlug: string }> }) {
  const { contentSlug } = await params;
  if (contentSlug === 'startup-entrepreneurial-success') return <SuccessStoryDetailPage kind="startup" />;
  if (contentSlug === 'higher-education') return <SuccessStoryDetailPage kind="higher" />;
  if (isAdmissionDetailSlug(contentSlug)) return <AdmissionDetailPage slug={contentSlug} />;
  const page = getLocalPage(contentSlug);
  if (!page) notFound();
  return <LocalContentPage page={page} />;
}
