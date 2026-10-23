'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import DifferentiatorSection from './DifferentiatorSection';
import { requestDifferentiators, type DifferentiatorsData } from './differentiators-api';
import { SITE_BASE } from './site-routes';

// Existing visual order and manual icons are attached to database block IDs.
// Editing a heading or returning fewer blocks cannot attach the wrong icon.
const order = [1, 4, 2, 5, 3, 6];
const iconNumber: Record<number, number> = { 1: 1, 4: 2, 2: 3, 5: 4, 3: 5, 6: 6 };

export default function HomeDifferentiators() {
  const mounted = useRef(false), version = useRef(0);
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'error'; data: DifferentiatorsData | null }>({ status: 'loading', data: null });
  const load = useCallback(() => {
    const current = ++version.current;
    setState({ status: 'loading', data: null });
    requestDifferentiators().then(data => {
      if (mounted.current && current === version.current) setState({ status: 'ready', data });
    }).catch(() => {
      if (mounted.current && current === version.current) setState({ status: 'error', data: null });
    });
  }, []);
  useEffect(() => { mounted.current = true; load(); return () => { mounted.current = false; }; }, [load]);
  if (!state.data) return <section id="different" className="different-section difference-wave-section" aria-busy={state.status === 'loading'}>
    <div className="difference-wave-inner" role="status">
      <p>{state.status === 'loading' ? 'Loading information…' : 'Information is temporarily unavailable.'}</p>
      {state.status === 'error' && <button className="text-link" type="button" onClick={load}>Try again</button>}
    </div>
  </section>;
  if (!state.data.points.length) return null;
  const points = [...state.data.points].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)).map(point => ({
    title: point.title, description: point.description, href: point.href,
    icon: `${SITE_BASE}/assets/svg/${iconNumber[point.id]}.svg`,
  }));
  const title = state.data.title.replace(/\bDGU\b/g, 'DBS Global University').replace(/\s+\?/g, '?');
  return <DifferentiatorSection title={title} points={points} readMore directLinks />;
}
