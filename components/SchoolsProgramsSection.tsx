'use client';
import { useEffect, useRef, useState } from 'react';
import ProgramCard from './ProgramCard';
import { requestPrograms, type ApiSchool } from './programs-api';

export default function SchoolsProgramsSection() {
  const root = useRef<HTMLElement>(null);
  const mounted = useRef(false);
  const [schools, setSchools] = useState<ApiSchool[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const load = () => {
    setStatus('loading');
    // IS_HOME selects featured records on older API deployments, leaving
    // other schools empty. The school grid needs the complete school list.
    requestPrograms('', false).then(data => {
      if (mounted.current) { setSchools(data); setStatus('ready'); }
    }).catch(error => {
      console.warn('Programs API:', error instanceof Error ? error.message : 'Request failed');
      if (mounted.current) { setSchools([]); setStatus('error'); }
    });
  };
  useEffect(() => {
    mounted.current = true;
    let observer: IntersectionObserver | undefined;
    if (root.current && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { observer?.disconnect(); load(); }
      }, { rootMargin: '900px 0px' });
      observer.observe(root.current);
    } else load();
    return () => { mounted.current = false; observer?.disconnect(); };
  }, []);
  return <section ref={root} className="schools-section" id="schools" aria-labelledby="schools-title" aria-busy={status === 'loading'}>
    <h2 id="schools-title">Schools @ DBS Global University</h2>
    {status === 'loading' ? <p role="status">Loading programs…</p>
      : status === 'error' ? <div role="status"><p>Programs are temporarily unavailable.</p><button className="text-link" type="button" onClick={load}>Try again</button></div>
      : !schools.length ? <p role="status">No programs available.</p>
      : <div className="schools-grid">{schools.map((school, index) => <ProgramCard key={school.id} title={school.title} items={school.programs} viewMoreHref={school.href || undefined} animationIndex={index} expandableItems />)}</div>}
  </section>;
}
