'use client';
import { useEffect, useRef, useState } from 'react';

export default function HeroVideo({ src, poster, paused = false }: { src: string; poster: string; paused?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  useEffect(() => {
    const element = video.current;
    if (!element || failed) return;
    let visible = false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      if (!visible || document.hidden || paused || reduced.matches) element.pause();
      else if (element.paused) void element.play().catch(() => {});
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(element);
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', sync);
      element.pause();
    };
  }, [src, paused, failed]);
  return failed
    ? <img className="hero-image hero-video" src={poster} alt="DBS Global University campus preview" width="1921" height="953" fetchPriority="high" />
    : <video ref={video} className="hero-image hero-video" src={src} poster={poster} width="1921" height="953" muted loop playsInline preload="none" onError={() => setFailed(true)} aria-label="DBS Global University campus preview" />;
}
