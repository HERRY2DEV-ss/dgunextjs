'use client';
import { useEffect, useState } from 'react';
import { requestProgramInfo, type ProgramInfo } from './program-info-api';

export default function useProgramInfo(slug: string) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ scope: string; info: ProgramInfo | null; error: string }>({ scope: '', info: null, error: '' });
  const scope = slug + '|' + attempt;
  useEffect(() => {
    let active = true;
    requestProgramInfo(slug).then(info => {
      if (active) setState({ scope, info, error: '' });
    }).catch(() => {
      if (active) setState({ scope, info: null, error: 'Live programme information is temporarily unavailable.' });
    });
    return () => { active = false; };
  }, [slug, scope]);
  const current = state.scope === scope;
  return { info: current ? state.info : null, error: current ? state.error : '', loading: !current, retry: () => setAttempt(value => value + 1) };
}
