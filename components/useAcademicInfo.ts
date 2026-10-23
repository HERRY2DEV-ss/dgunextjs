'use client';
import { useEffect, useState } from 'react';
import { requestAcademicInfo, type AcademicInfo, type AcademicKind } from './academic-page-api';
import { PROGRAM_DETAILS_ENABLED } from './program-detail-policy';

export default function useAcademicInfo(kind:AcademicKind,slug:string,recordId='') {
  const [attempt,setAttempt]=useState(0),scope=`${kind}:${slug}:${recordId}:${attempt}`;
  const [state,setState]=useState<{scope:string;info:AcademicInfo|null;error:boolean}>({scope:'',info:null,error:false});
  const pending=kind==='program' && !PROGRAM_DETAILS_ENABLED;
  useEffect(()=>{
    if(pending)return;
    let active=true;
    requestAcademicInfo(kind,slug,recordId).then(info=>{if(active)setState({scope,info,error:false});})
      .catch(()=>{if(active)setState({scope,info:null,error:true});});
    return()=>{active=false;};
  },[kind,slug,recordId,scope,pending]);
  const current=state.scope===scope;
  return {info:current && !pending ? state.info : null,loading:!current && !pending,error:current&&state.error&&!pending,pending,retry:()=>setAttempt(n=>n+1)};
}
