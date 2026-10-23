'use client';
import { useEffect, useState } from 'react';
import ProgramCard from './ProgramCard';
import { requestPrograms, type ApiSchool, type SchoolProgram } from './programs-api';
import type { SchoolPageData } from './school-page-data';

export function groupSchoolPrograms(items: SchoolProgram[]): SchoolPageData['programs'] {
  const groups = new Map<string, SchoolPageData['programs'][number]['items']>();
  for (const item of items) {
    const title = item.level || 'Programs';
    const entries = groups.get(title) || [];
    entries.push({ name: item.name, href: item.href }); groups.set(title, entries);
  }
  return Array.from(groups, ([title, items]) => ({ title, items }));
}

/** Shared ProgramCard layout, populated by the school's own API response. */
export default function SchoolProgramsSection({ schoolUrl, previewGroups }: { schoolUrl?: string; previewGroups?: SchoolPageData['programs'] }) {
  const [attempt, setAttempt] = useState(0);
  const scope = `${schoolUrl || ''}|${attempt}`;
  const [state, setState] = useState<{ scope: string; school: ApiSchool | null; error: boolean }>({ scope: '', school: null, error: false });
  useEffect(() => {
    if (!schoolUrl) return;
    let active = true;
    requestPrograms(schoolUrl).then(schools => {
      const school = schools.find(item => item.url.replace(/^https?:\/\/(www\.)?dgu\.ac\.in\//, '').replace(/\/$/, '') === schoolUrl);
      if (!school && schools.length) throw new Error('A different school was returned.');
      if (active) setState({ scope, school: school || null, error: false });
    }).catch(() => { if (active) setState({ scope, school: null, error: true }); });
    return () => { active = false; };
  }, [schoolUrl, scope]);
  const current = state.scope === scope;
  const apiGroups = current && state.school ? groupSchoolPrograms(state.school.programs) : [];
  const groups = apiGroups;
  const loading = !!schoolUrl && !current;
  const unavailable = !schoolUrl || current && state.error;
  return <section className="schools-section school-programs-section" aria-labelledby="school-programs-title" aria-busy={!!schoolUrl && !current}>
    <h2 id="school-programs-title">OUR PROGRAMS</h2>
    {groups.length ? <><div className="schools-grid school-programs-grid">{groups.map((group, index) => <ProgramCard key={group.title} title={group.title} items={group.items} animationIndex={index} expandableItems={!previewGroups} />)}</div>{unavailable && <button type="button" className="text-link" onClick={() => setAttempt(value => value + 1)}>Retry live programs</button>}</>
      : loading ? <p className="dgu-api-status" role="status">Loading school programs…</p>
      : unavailable ? <div className="dgu-api-status" role="status"><p>Programs are temporarily unavailable.</p>{schoolUrl && <button type="button" className="text-link" onClick={() => setAttempt(value => value + 1)}>Try again</button>}</div>
      : <p role="status">No programs available yet.</p>}
  </section>;
}
