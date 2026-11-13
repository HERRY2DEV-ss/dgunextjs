'use client';
import { useEffect, useState } from 'react';
import { readCachedAcademicInfo, requestAcademicInfo, type AcademicInfo } from './academic-page-api';
import type { SchoolProgram } from './programs-api';
import { mergeOtherSpecializations, relatedSpecializations, specializationParent } from './academic-specializations';

/** Related links come only from the page API or its explicit parent programme. */
export default function useOtherSpecializations(info: AcademicInfo | null) {
  const [attempt, setAttempt] = useState(0);
  const programId = info?.id || '';
  const programSlug = info?.slug || '';
  const scope = `${info?.kind || ''}:${info?.slug || ''}:${info?.id || ''}:${attempt}`;
  const parent = info ? specializationParent(info) : null;
  const eligible = !!info && !!parent && !!programId;
  const [state, setState] = useState<{ scope: string; items: SchoolProgram[]; error: boolean }>({ scope: '', items: [], error: false });
  useEffect(() => {
    if (!eligible || !parent) return;
    let active = true;
    let hasCachedParent = false;
    const currentProgram = { id: programId, slug: programSlug };
    const cachedParent = readCachedAcademicInfo('program', parent.slug, parent.id);
    if (cachedParent) {
      hasCachedParent = true;
      setState({ scope, items: relatedSpecializations(cachedParent.relatedPrograms, currentProgram), error: false });
    }
    requestAcademicInfo('program', parent.slug, parent.id).then(parentInfo => {
      if (active) setState({ scope, items: relatedSpecializations(parentInfo.relatedPrograms, currentProgram), error: false });
    }).catch(() => {
      if (active) setState(previous => previous.scope === scope
        ? { ...previous, error: !hasCachedParent }
        : { scope, items: [], error: !hasCachedParent });
    });
    return () => { active = false; };
  }, [eligible, programId, programSlug, parent?.id, parent?.slug, scope]);
  const current = state.scope === scope;
  const direct = info ? info.otherPrograms : [];
  const siblings = eligible && current ? state.items : [];
  const items = info ? mergeOtherSpecializations(direct, siblings, info) : [];
  return {
    items,
    loading: eligible && !current,
    error: eligible && current && state.error && !items.length,
    retry: () => setAttempt(value => value + 1),
  };
}
