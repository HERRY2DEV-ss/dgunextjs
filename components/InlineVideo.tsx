'use client';
import { useEffect, useRef, useState } from 'react';
/** Simultaneous muted inline playback; no single-active-video restriction. */
export default function InlineVideo({src, poster, title, paused = false, controls = false}: {
  src: string; poster: string; title: string; paused?: boolean; controls?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  useEffect(() => {
    const element = video.current;
    if (!element || !src || failed) return;
    if (controls) {
      // The expanded short is opened by a tap: start it immediately instead of
      // waiting for an IntersectionObserver callback after the dialog renders.
      const sync = () => {
        if (paused || document.hidden) element.pause();
        else void element.play().catch(() => { /* Keep the native play control available. */ });
      };
      // The parent opens the native dialog after rendering; retry on the next
      // frame so the first play request runs while the video is visible.
      const frame = requestAnimationFrame(sync);
      element.addEventListener('canplay', sync);
      document.addEventListener('visibilitychange', sync);
      return () => {
        cancelAnimationFrame(frame);
        element.removeEventListener('canplay', sync);
        document.removeEventListener('visibilitychange', sync);
        element.pause();
      };
    }
    let inView = false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      if (!inView || paused || document.hidden || (!controls && reduced.matches)) element.pause();
      else void element.play().catch(() => { /* Browser may require a user gesture. */ });
    };
    const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync(); }, {threshold: .05});
    observer.observe(element);
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); reduced.removeEventListener('change', sync); element.pause(); };
  }, [src, paused, controls, failed]);
  if (!src || failed) return <img src={poster} alt={title} width="335" height="500" />;
  return <video ref={video} src={src} poster={poster} muted loop playsInline autoPlay={controls}
    preload={controls ? 'auto' : 'none'} controls={controls}
    aria-label={title} onError={() => setFailed(true)} />;
}
