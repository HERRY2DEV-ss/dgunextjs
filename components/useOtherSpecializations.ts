'use client';
import { useEffect, useState } from 'react';
import { readCachedAcademicInfo, requestAcademicInfo, type AcademicInfo } from './academic-page-api';
import type { SchoolProgram } from './programs-api';

/** MBA's live specialization array is the explicit parent/child relationship.
 * An unrelated course is never assigned this list by its title or school alone. */
export default function useOtherSpecializations(info: AcademicInfo | null) {
  const [attempt, setAttempt] = useState(0);
  const recordId = info?.id || '';
  const scope = `${info?.kind || ''}:${info?.slug || ''}:${info?.id || ''}:${attempt}`;
  const eligible = !!info && info.kind === 'program' && /^mba-/.test(info.slug) && !info.otherPrograms.length;
  const [state, setState] = useState<{ scope: string; items: SchoolProgram[]; error: boolean }>({ scope: '', items: [], error: false });
  useEffect(() => {
    if (!eligible || !recordId) return;
    let active = true;
    const relatedItems = (parent: AcademicInfo) => parent.relatedPrograms.some(program => program.id === recordId)
      ? parent.relatedPrograms.filter(program => program.id !== recordId)
      : [];
    const cachedParent = readCachedAcademicInfo('program', 'mba', '10');
    if (cachedParent) {
      Promise.resolve().then(() => {
        if (active) setState(previous => ({
          scope,
          items: previous.scope === scope && previous.items.length ? previous.items : relatedItems(cachedParent),
          error: false,
        }));
      });
    }
    requestAcademicInfo('program', 'mba', '10').then(parent => {
      if (active) setState({ scope, items: relatedItems(parent), error: false });
    }).catch(() => {
      if (active) setState(previous => previous.scope === scope && previous.items.length
        ? { ...previous, error: false }
        : { scope, items: [], error: true });
    });
    return () => { active = false; };
  }, [eligible, recordId, scope]);
  const current = state.scope === scope;
  return { items: eligible && current ? state.items : info?.otherPrograms || [], error: eligible && current && state.error, retry: () => setAttempt(value => value + 1) };
}
