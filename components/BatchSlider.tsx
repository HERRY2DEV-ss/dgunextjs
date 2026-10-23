'use client';
import { Children, useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';

/** Advances a complete page, then rests. No duplicated marquee track or endless motion. */
export default function BatchSlider({children, size = 1, interval = 5500, paused = false, label, className = '', controls = false}: {
  children: ReactNode; size?: number; interval?: number; paused?: boolean; label: string; className?: string; controls?: boolean;
}) {
  const items = Children.toArray(children);
  const count = Math.ceil(items.length / size);
  const root = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const touchX = useRef<number | null>(null);
  const wheelLock = useRef(0);
  const move = (delta: number) => setPage(value => (value + delta + count) % Math.max(1,count));
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = new IntersectionObserver(entries => setVisible(entries[0].isIntersecting), {threshold:.1});
    observer.observe(node);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const preference = () => setReduced(media.matches);
    const visibility = () => setDocumentVisible(!document.hidden);
    preference(); visibility();
    media.addEventListener('change',preference); document.addEventListener('visibilitychange',visibility);
    return () => { observer.disconnect(); media.removeEventListener('change',preference); document.removeEventListener('visibilitychange',visibility); };
  }, []);
  useEffect(() => {
    if (count < 2 || paused || focused || !visible || reduced || !documentVisible) return;
    const timer = window.setTimeout(() => setPage(value => (value + 1) % count), interval);
    return () => window.clearTimeout(timer);
  }, [page,count,interval,paused,focused,visible,reduced,documentVisible]);
  useEffect(() => { if (page >= count) setPage(0); }, [count,page]);
  return <div ref={root} className={`batch-slider ${className}`} role="region" aria-roledescription="carousel" aria-label={label} tabIndex={0}
    onFocus={event => {
      // Pointer clicks must not disable autoplay for the lifetime of button focus.
      const target = event.target as HTMLElement;
      setFocused(target.matches(':focus-visible') && !target.closest('.batch-controls'));
    }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {event.preventDefault();move(event.key === 'ArrowRight' ? 1 : -1);} }}
    onTouchStart={event => {touchX.current=event.touches[0].clientX;}}
    onTouchEnd={event => {if (touchX.current!==null) {const delta=touchX.current-event.changedTouches[0].clientX;if(Math.abs(delta)>45)move(delta>0?1:-1);}touchX.current=null;}}
    onWheel={event => { if(Math.abs(event.deltaX)>Math.abs(event.deltaY) && Math.abs(event.deltaX)>15 && Date.now()-wheelLock.current>700) {wheelLock.current=Date.now();move(event.deltaX>0?1:-1);} }}>
    <div className="batch-window"><div className="batch-track" style={{transform:`translateX(-${page*100}%)`}}>
      {Array.from({length:count},(_,index) => <div className="batch-page" key={index} inert={index!==page} aria-hidden={index!==page}
        role="group" aria-label={`${index+1} of ${count}`} style={{'--batch-size':size} as CSSProperties}>
        {items.slice(index*size,(index+1)*size)}
      </div>)}
    </div></div>
    {controls && count>1 && <div className="batch-controls"><button type="button" aria-label={`Previous ${label}`} onClick={()=>move(-1)}>‹</button><span>{page+1} / {count}</span><button type="button" aria-label={`Next ${label}`} onClick={()=>move(1)}>›</button></div>}
  </div>;
}
