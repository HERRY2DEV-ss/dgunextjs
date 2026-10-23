'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, type HTMLAttributes } from 'react';

/** Scroll only this row; never add end padding or move the page vertically. */
export default function SlidingTabList({activeKey,className='',children,...props}:HTMLAttributes<HTMLDivElement>&{activeKey:string|number|undefined}) {
  const row=useRef<HTMLDivElement>(null),initialized=useRef(false);
  const align=useCallback((smooth:boolean)=>{
    const node=row.current,active=node?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');if(!node || !active)return;
    const position=node.scrollLeft+active.getBoundingClientRect().left-node.getBoundingClientRect().left-node.clientLeft;
    const left=Math.max(0,Math.min(node.scrollWidth-node.clientWidth,position));
    if(Math.abs(node.scrollLeft-left)>.5)node.scrollTo({left,behavior:smooth && !window.matchMedia('(prefers-reduced-motion:reduce)').matches?'smooth':'auto'});
  },[]);
  useLayoutEffect(()=>{align(initialized.current);initialized.current=true;},[activeKey,align]);
  useEffect(()=>{
    const node=row.current;if(!node)return;
    let width=node.clientWidth;
    const observer=new ResizeObserver(()=>{if(node.clientWidth!==width){width=node.clientWidth;align(false);}});
    observer.observe(node);return()=>observer.disconnect();
  },[activeKey,align]);
  return <div {...props} ref={row} role="tablist" className={`${className} dgu-sliding-tablist`} onClickCapture={event=>{
    props.onClickCapture?.(event);
    const tab=(event.target as HTMLElement).closest('[role="tab"]');
    if(tab?.getAttribute('aria-selected')==='true')align(true);
  }}>{children}</div>;
}
