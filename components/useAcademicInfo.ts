'use client';
import { useEffect, useState } from 'react';
import { requestAcademicInfo, type AcademicInfo, type AcademicKind } from './academic-page-api';
import { PROGRAM_DETAILS_ENABLED } from './program-detail-policy';

const CACHE_VERSION = 1;
const cacheKey = (kind: AcademicKind, slug: string, recordId: string) =>
  `dgu:academic:v${CACHE_VERSION}:${kind}:${slug}:${recordId}`;

function readCachedInfo(key: string, kind: AcademicKind, slug: string, recordId: string): AcademicInfo | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as { savedAt?: number; info?: AcademicInfo };
    const info = entry?.info;
    if (!info || info.kind !== kind || info.slug !== slug || typeof info.name !== 'string' || !info.name.trim()) return null;
    if (recordId && String(info.id) !== recordId) return null;
    return info;
  } catch {
    return null;
  }
}

function writeCachedInfo(key: string, info: AcademicInfo) {
  try {
    window.localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), info }));
  } catch {
    // Storage can be disabled or full. The live API response must still render.
  }
}

export default function useAcademicInfo(kind: AcademicKind, slug: string, recordId = '') {
  const [attempt, setAttempt] = useState(0);
  const key = cacheKey(kind, slug, recordId);
  const pending = kind === 'program' && !PROGRAM_DETAILS_ENABLED;
  const [state, setState] = useState<{ key: string; info: AcademicInfo | null; loading: boolean; error: boolean }>({
    key: '', info: null, loading: true, error: false,
  });

  useEffect(() => {
    if (pending) return;
    let active = true;
    const cachedInfo = readCachedInfo(key, kind, slug, recordId);
    setState(previous => ({
      key,
      info: cachedInfo || (previous.key === key ? previous.info : null),
      loading: true,
      error: false,
    }));

    requestAcademicInfo(kind, slug, recordId).then(info => {
      if (!active) return;
      writeCachedInfo(key, info);
      setState({ key, info, loading: false, error: false });
    }).catch(() => {
      if (!active) return;
      setState(previous => {
        const retained = previous.key === key ? previous.info : null;
        const info = cachedInfo || retained;
        return { key, info, loading: false, error: !info };
      });
    });

    return () => { active = false; };
  }, [kind, slug, recordId, key, attempt, pending]);

  const current = state.key === key;
  return {
    info: current && !pending ? state.info : null,
    loading: !pending && (!current || state.loading),
    error: !pending && current && state.error,
    pending,
    retry: () => setAttempt(value => value + 1),
  };
}
