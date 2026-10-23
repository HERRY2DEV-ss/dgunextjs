'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ApiRichText from './ApiRichText';
import type { AcademicFeature } from './academic-features';

export default function AcademicFeatureHover({point,anchor,id,onEnter,onLeave,onDismiss}:{point:AcademicFeature;anchor:HTMLElement;id:string;onEnter:()=>void;onLeave:()=>void;onDismiss:()=>void}) {
  const box=useRef<HTMLDivElement>(null),[position,setPosition]=useState({left:16,top:16});
  useLayoutEffect(()=>{
    const measure=()=>{
      const card=anchor.getBoundingClientRect(),node=box.current;if(!node)return;
      if(card.bottom<0 || card.top>innerHeight){onDismiss();return;}
      const left=Math.max(16,Math.min(innerWidth-node.offsetWidth-16,card.left+(card.width-node.offsetWidth)/2));
      const above=card.top-node.offsetHeight-12;
      const top=Math.max(16,Math.min(innerHeight-node.offsetHeight-16,above>=16?above:card.bottom+12));
      setPosition({left,top});
    };
    const key=(event:KeyboardEvent)=>{if(event.key==='Escape')onDismiss();};
    measure();window.addEventListener('scroll',measure,true);window.addEventListener('resize',measure);window.addEventListener('keydown',key);
    return()=>{window.removeEventListener('scroll',measure,true);window.removeEventListener('resize',measure);window.removeEventListener('keydown',key);};
  },[anchor,point,onDismiss]);
  return createPortal(<div ref={box} className="academic-feature-hover" id={id} role="tooltip" style={position} onPointerEnter={onEnter} onPointerLeave={onLeave}>
    <h3>{point.title}</h3><ApiRichText html={point.html || point.description} scrollTables />
  </div>,document.body);
}
