'use client';

import { useEffect, useState } from 'react';
import {
  academicSlug,
  readCachedAcademicInfo,
  requestAcademicInfo,
  type AcademicInfo,
  type AcademicKind,
} from './academic-page-api';
import { PROGRAM_DETAILS_ENABLED } from './program-detail-policy';

type AcademicState = {
  scope: string;
  info: AcademicInfo | null;
  loading: boolean;
  error: boolean;
  attempt: number;
};

export default function useAcademicInfo(
  kind: AcademicKind,
  slug: string,
  recordId = '',
) {
  const [attempt, setAttempt] = useState(0);
  const scope = `${kind}:${academicSlug(slug)}:${recordId}`;
  const pending = kind === 'program' && !PROGRAM_DETAILS_ENABLED;

  const [state, setState] = useState<AcademicState>({
    scope: '',
    info: null,
    loading: true,
    error: false,
    attempt: -1,
  });

  useEffect(() => {
    if (pending) return;

    let active = true;
    const cached = readCachedAcademicInfo(kind, slug, recordId);

    setState(previous => ({
      scope,
      info: previous.scope === scope && previous.info ? previous.info : cached,
      loading: true,
      error: false,
      attempt,
    }));

    requestAcademicInfo(kind, slug, recordId)
      .then(info => {
        if (!active) return;
        setState({ scope, info, loading: false, error: false, attempt });
      })
      .catch(() => {
        if (!active) return;
        setState(previous => {
          const retained = previous.scope === scope ? previous.info : null;
          const info = cached || retained;
          return {
            scope,
            info,
            loading: false,
            error: !info,
            attempt,
          };
        });
      });

    return () => {
      active = false;
    };
  }, [kind, slug, recordId, scope, attempt, pending]);

  const current = state.scope === scope;
  const info = current && !pending ? state.info : null;
  const failed = current && state.attempt === attempt && state.error && !info;

  return {
    info,
    loading: !pending && (!current || state.loading),
    error: !pending && failed,
    pending,
    retry: () => setAttempt(value => value + 1),
  };
}
