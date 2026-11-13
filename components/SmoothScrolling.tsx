'use client';
import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { hasScrollableAncestor } from './ManualScrollInteractions';

/** Desktop wheel smoothing shares GSAP's clock. Touch keeps native momentum. */
export default function SmoothScrolling({ disabled = false }: { disabled?: boolean }) {
  useEffect(() => {
    if (disabled) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference) and (pointer: fine)', () => {
      const lenis = new Lenis({ duration: .85, smoothWheel: true, syncTouch: false,
        anchors: { offset: -24, duration: 1.1 },
        prevent: node => Boolean(node.closest('dialog, .news-scroller, .mega-menu-overlay')) || hasScrollableAncestor(node),
      });
      const tick = (time: number) => lenis.raf(time * 1000);
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(tick);
      document.documentElement.classList.add('dgu-smooth-scroll');
      return () => {
        gsap.ticker.remove(tick); lenis.destroy();
        document.documentElement.classList.remove('dgu-smooth-scroll');
      };
    });
    return () => media.revert();
  }, [disabled]);
  return null;
}
