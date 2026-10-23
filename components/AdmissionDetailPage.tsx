'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import LocalPageShell from './LocalPageShell';
import InternalContent from './InternalContent';
import InternalPageHero from './InternalPageHero';
import { requestAdmissions, type AdmissionData } from './admissions-api';
import { admissionDetail, admissionDetailHref } from './admissions-routes';
import { SITE_BASE } from './site-routes';
import SchoolPlacementsSection from './SchoolPlacementsSection';

export default function AdmissionDetailPage({ slug }: { slug: string }) {
  const mounted = useRef(false), version = useRef(0);
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'error'; data: AdmissionData | null }>({ status: 'loading', data: null });
  const load = useCallback(() => {
    const current = ++version.current;
    setState({ status: 'loading', data: null });
    requestAdmissions().then(data => {
      if (mounted.current && current === version.current) setState({ status: 'ready', data });
    }).catch(() => {
      if (mounted.current && current === version.current) setState({ status: 'error', data: null });
    });
  }, []);
  useEffect(() => { mounted.current = true; load(); return () => { mounted.current = false; }; }, [load, slug]);
  const detail = state.data ? admissionDetail(state.data, slug) : null;
  useEffect(() => {
    document.title = detail ? `${detail.title} | DBS Global University` : 'Admissions | DBS Global University';
  }, [detail]);

  return <LocalPageShell className="local-page internal-page local-page--content admission-detail-page">
    <a className="local-skip" href="#local-content">Skip to page content</a>
    <main className="local-page-main" id="local-content" aria-busy={state.status === 'loading'}>
      <InternalPageHero title={detail?.title || (slug==='placement-reports' ? 'Placements' : 'Admissions')} eyebrow={state.data?.title || 'DBS Global University'} parent={{label:'Admissions',href:`${SITE_BASE}/admissions/`}} />
      <div className="internal-body">
      {!detail ? <div className="local-empty-detail" role="status">
        <p>{state.status === 'loading' ? 'Loading information…' : state.status === 'error' ? 'Information is temporarily unavailable.' : 'This information is currently unavailable.'}</p>
        {state.status === 'error' && <button className="local-retry" type="button" onClick={load}>Try again</button>}
        <a className="admission-detail-back" href={`${SITE_BASE}/admissions/`}>Back to Admissions</a>
      </div> : <>
        <nav className="admissions-child-links" aria-label="Admissions resources">
          <a href={`${SITE_BASE}/admissions/`}>Admissions overview</a>
          {state.data!.details.map(item => {
            const href = admissionDetailHref(item.href);
            const existingNavigation = ['admission-requirements', 'programs-fee-structures', 'education-loan'].some(route => href === `${SITE_BASE}/${route}/`);
            return existingNavigation ? <a key={href} href={href} aria-current={item === detail ? 'page' : undefined}>{item.title}</a> : null;
          })}
        </nav>
        <article className="local-article" id="admission-detail-content">
          <InternalContent html={detail.html} slug={slug} api />
        </article>
      </>}
      {slug==='placement-reports' && <SchoolPlacementsSection apiSchoolUrl="" />}
      </div>
    </main>
  </LocalPageShell>;
}
