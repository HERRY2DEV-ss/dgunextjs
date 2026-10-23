'use client';
import { useEffect, useState } from 'react';
import { requestFaculty, type ApiFaculty, type FacultyScope } from './faculty-api';

export default function useFaculty({ URL = '', SCHOOL_URL = '' }: FacultyScope = {}, enabled = true) {
  const [data, setData] = useState<ApiFaculty[] | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const scopeKey = `${URL}|${SCHOOL_URL}|${attempt}`;
  const [loadedScope, setLoadedScope] = useState('');
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    requestFaculty(URL ? { URL } : SCHOOL_URL ? { SCHOOL_URL } : {}).then(members => {
      if (active) { setData(members); setError(''); setLoadedScope(scopeKey); }
    }).catch(() => {
      if (active) { setData(null); setError('Faculty information could not be loaded. Please try again.'); setLoadedScope(scopeKey); }
    });
    return () => { active = false; };
  }, [URL, SCHOOL_URL, scopeKey, enabled]);
  const current = loadedScope === scopeKey;
  return { data: enabled && current ? data : null, error: enabled && current ? error : '', loading: enabled && !current, retry: () => setAttempt(n => n + 1) };
}
