'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AutoSlider from './AutoSlider';
import { requestRecruiters, type Recruiter } from './recruiters-api';

export default function RecruitersSection({ paused = false, items, title = 'Top Recruiters 2025-26' }: { paused?: boolean; items?: Recruiter[]; title?: string }) {
  const root = useRef<HTMLElement>(null);
  const mounted = useRef(false);
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'error'; items: Recruiter[] }>({ status: 'loading', items: [] });
  const load = useCallback(() => {
    setState({ status: 'loading', items: [] });
    requestRecruiters().then(items => { if (mounted.current) setState({ status: 'ready', items }); })
      .catch(() => { if (mounted.current) setState({ status: 'error', items: [] }); });
  }, []);
  useEffect(() => {
    if (items !== undefined) return;
    mounted.current = true;
    let observer: IntersectionObserver | undefined;
    if (root.current && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { observer?.disconnect(); load(); } }, { rootMargin: '600px 0px' });
      observer.observe(root.current);
    } else load();
    return () => { mounted.current = false; observer?.disconnect(); };
  }, [load, items]);
  const status = items === undefined ? state.status : 'ready';
  const records = items ?? state.items;
  if (items !== undefined && !items.length) return null;
  return (
    <section ref={root} className="recruiters" aria-labelledby={title ? 'recruiters-title' : undefined} aria-busy={status === 'loading'}>
      {title && <h2 id="recruiters-title">{title}</h2>}
      {status === 'loading' ? <p role="status">Loading recruiters…</p>
        : status === 'error' ? <div role="status"><p>Recruiters are temporarily unavailable.</p><button type="button" className="text-link" onClick={load}>Try again</button></div>
        : !records.length ? <p role="status">No recruiters available yet.</p>
        : <AutoSlider className="recruiter-track" label="Top recruiters" duration={30} paused={paused} continuousOnMobile>
        {records.map(item => (
          <div className="recruiter" key={item.id}>
            <img src={item.image} alt={item.name} width="196" height="80" loading="lazy" />
          </div>
        ))}
      </AutoSlider>}
    </section>
  );
}
