'use client';
import { Children, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import StepSlider from './StepSlider';

/** Two equal groups form a seamless loop. Only the first group enters the tab order. */
export default function AutoSlider({ children, className, label, duration = 35, vertical = false, paused = false, continuousOnMobile = false }: {
  children: ReactNode; className: string; label: string; duration?: number; vertical?: boolean; paused?: boolean; continuousOnMobile?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ id: number; x: number; y: number; startTime: number; travel: number; duration: number; animation: Animation; wasRunning: boolean } | null>(null);
  const dragged = useRef(false);
  const [visible, setVisible] = useState(false);
  const [mobile,setMobile]=useState(false);
  useEffect(()=>{const m=matchMedia('(max-width:700px)');const sync=()=>setMobile(m.matches);sync();m.addEventListener('change',sync);return()=>m.removeEventListener('change',sync);},[]);
  const [pageVisible, setPageVisible] = useState(true);
  const items = Children.toArray(children);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = new IntersectionObserver(entries => setVisible(entries[0].isIntersecting));
    observer.observe(node);
    const visibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', visibility);
    visibility();
    // Clones remain pointer-interactive, while keyboard users traverse each item once.
    node.querySelectorAll<HTMLElement>('[data-slider-copy] a, [data-slider-copy] button, [data-slider-copy] input, [data-slider-copy] [tabindex]').forEach(item => item.tabIndex = -1);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, [children,mobile]);
  if(mobile && !continuousOnMobile)return <StepSlider className={className} label={label} interval={5000} vertical controls paused={paused}>{children}</StepSlider>;
  return <div ref={root} className={`auto-slider ${className} ${vertical ? 'auto-vertical' : ''} ${paused || !visible || !pageVisible ? 'auto-paused' : ''}`}
    role="region" aria-label={label} style={{ '--slider-duration': `${duration}s` } as CSSProperties}
    onPointerDown={event => {
      if(event.button!==0)return;
      const track=root.current?.querySelector<HTMLElement>('.auto-slider-track');
      const animation=track?.getAnimations()[0];
      const group=track?.querySelector<HTMLElement>('.auto-slider-group');
      if(!animation || !group)return;
      const startTime=Number(animation.currentTime)||0;
      pointer.current={id:event.pointerId,x:event.clientX,y:event.clientY,startTime,travel:vertical?group.scrollHeight:group.scrollWidth,duration:duration*1000,animation,wasRunning:animation.playState==='running'};
      dragged.current=false;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      animation.pause();
    }}
    onPointerMove={event => {
      const start=pointer.current;
      if(!start || start.id!==event.pointerId)return;
      const delta=vertical?event.clientY-start.y:event.clientX-start.x;
      const cross=vertical?event.clientX-start.x:event.clientY-start.y;
      if(Math.abs(delta)>6&&Math.abs(delta)>Math.abs(cross)*1.2)dragged.current=true;
      if(dragged.current&&start.travel>0)start.animation.currentTime=Math.max(0,start.startTime-delta/start.travel*start.duration);
    }}
    onPointerUp={event => {
      const start=pointer.current;
      if(!start || start.id!==event.pointerId)return;
      pointer.current=null;
      if(start.wasRunning)start.animation.play();
    }}
    onPointerCancel={() => {
      const start=pointer.current;
      pointer.current=null;
      dragged.current=false;
      if(start?.wasRunning)start.animation.play();
    }}
    onDragStart={event=>event.preventDefault()}
    onClickCapture={event=>{
      if(dragged.current){event.preventDefault();event.stopPropagation();dragged.current=false;}
    }}>
    <div className="auto-slider-track">
      <div className="auto-slider-group">{items}</div>
      <div className="auto-slider-group" data-slider-copy aria-hidden="true">{items}</div>
    </div>
  </div>;
}
