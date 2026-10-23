'use client';
import { Children, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import StepSlider from './StepSlider';

/** Two equal groups form a seamless loop. Only the first group enters the tab order. */
export default function AutoSlider({ children, className, label, duration = 35, vertical = false, paused = false, continuousOnMobile = false }: {
  children: ReactNode; className: string; label: string; duration?: number; vertical?: boolean; paused?: boolean; continuousOnMobile?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
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
    role="region" aria-label={label} style={{ '--slider-duration': `${duration}s` } as CSSProperties}>
    <div className="auto-slider-track">
      <div className="auto-slider-group">{items}</div>
      <div className="auto-slider-group" data-slider-copy aria-hidden="true">{items}</div>
    </div>
  </div>;
}
