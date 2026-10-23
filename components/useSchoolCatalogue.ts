'use client';
import { useEffect, useState } from 'react';
import { requestPrograms, type ApiSchool } from './programs-api';

/** Catalogue failures affect the programme list, never the school's other content. */
export default function useSchoolCatalogue(slug: string) {
  const [attempt, setAttempt] = useState(0), scope = `${slug}:${attempt}`;
  const [state, setState] = useState<{scope:string;schools:ApiSchool[];error:boolean}>({scope:'',schools:[],error:false});
  useEffect(() => {
    if (!slug) return;
    let active = true;
    requestPrograms(slug, false).then(schools => {
      const own = schools.filter(school => school.url.replace(/^https?:\/\/(?:www\.)?dgu\.ac\.in\//, '').replace(/\/$/, '') === slug);
      if (!own.length && schools.length) throw new Error('A different school catalogue was returned.');
      if (active) setState({scope,schools:own,error:false});
    }).catch(() => { if (active) setState({scope,schools:[],error:true}); });
    return () => { active = false; };
  }, [slug, scope]);
  const current = state.scope === scope;
  return {schools:current ? state.schools : [],loading:!!slug && !current,error:current && state.error,retry:()=>setAttempt(n=>n+1)};
}
