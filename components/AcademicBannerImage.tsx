'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function AcademicBannerImage({image,mobile,alt,active,onRatio,onUnavailable}:{image:string;mobile:string;alt:string;active:boolean;onRatio:(ratio:string)=>void;onUnavailable:()=>void}) {
  const [failed,setFailed]=useState<string[]>([]),img=useRef<HTMLImageElement>(null);
  const desktop=failed.includes(image)?'':image,small=failed.includes(mobile)?'':mobile;
  const report=useCallback(()=>{const node=img.current;if(active && node?.naturalWidth && node.naturalHeight)onRatio(`${node.naturalWidth} / ${node.naturalHeight}`);},[active,onRatio]);
  useEffect(()=>{
    let timers:number[]=[];
    const scheduleReport=()=>{
      timers.forEach(timer=>window.clearTimeout(timer));
      timers=[0,120,480].map(delay=>window.setTimeout(report,delay));
    };
    window.addEventListener('resize',scheduleReport);
    scheduleReport();
    return()=>{window.removeEventListener('resize',scheduleReport);timers.forEach(timer=>window.clearTimeout(timer));};
  },[desktop,report,small]);
  return <picture>
    {small && <source media="(max-width:700px)" srcSet={small}/>}
    <img ref={img} src={desktop || small} alt={alt} width="1710" height="570" draggable={false} onLoad={report}
      onError={event=>{
        const source=event.currentTarget.currentSrc || (window.innerWidth<=700 && small ? small : desktop || small);
        const next=Array.from(new Set([...failed,source]));setFailed(next);
        if((!image || next.includes(image)) && (!mobile || next.includes(mobile)))onUnavailable();
      }}/>
  </picture>;
}
