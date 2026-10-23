'use client';

import { useEffect, useRef, type RefObject } from 'react';

export function usePlacementMotion(root: RefObject<HTMLElement | null>, stopped: boolean) {
  useEffect(() => {
    const node = root.current;
    if (!node || !('IntersectionObserver' in window)) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { node.setAttribute('data-motion', stopped || preference.matches ? 'off' : 'on'); };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: .08 });
    node.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));
    update();
    preference.addEventListener('change', update);
    return () => { observer.disconnect(); preference.removeEventListener('change', update); node.removeAttribute('data-motion'); };
  }, [root, stopped]);
}

/** Keep the complete value in server HTML and for assistive technology. */
export function PlacementCounter({ value, suffix, animate }: { value: number; suffix: string; animate: boolean }) {
  const element = useRef<HTMLSpanElement>(null);
  const completed = useRef(false);
  useEffect(() => {
    const node = element.current;
    if (!node) return;
    const final = `${value}${suffix}`;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const finish = () => { window.cancelAnimationFrame(frame); node.textContent = final; };
    if (!animate || preference.matches || completed.current || !('IntersectionObserver' in window)) { finish(); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || completed.current) return;
      completed.current = true;
      observer.disconnect();
      const started = Date.now();
      const tick = () => {
        const progress = Math.min(1, (Date.now() - started) / 1100);
        node.textContent = `${Math.round(value * (1 - Math.pow(1 - progress, 3)))}${suffix}`;
        if (progress < 1) frame = window.requestAnimationFrame(tick);
        else finish();
      };
      frame = window.requestAnimationFrame(tick);
    }, { threshold: .5 });
    const changed = () => { if (preference.matches) { completed.current = true; observer.disconnect(); finish(); } };
    observer.observe(node);
    preference.addEventListener('change', changed);
    return () => { observer.disconnect(); preference.removeEventListener('change', changed); finish(); };
  }, [value, suffix, animate]);
  return <><span ref={element} aria-hidden="true">{value}{suffix}</span><span className="placement-visually-hidden">{value}{suffix}</span></>;
}
