'use client';

import { useEffect, useRef, useState } from 'react';

export default function PlacementVideoCard({ src, poster, title, paused = false, onOpen }: {
  src: string;
  poster: string;
  title: string;
  paused?: boolean;
  onOpen: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let inView = false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      if (paused || document.hidden || !inView || reduced.matches) video.pause();
      else void video.play().catch(() => { /* A browser may still defer muted playback. */ });
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    }, { threshold: 0.15 });
    observer.observe(video);
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', sync);
      video.pause();
    };
  }, [paused, src]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  return <article className="placement-video-card" aria-label={title}>
    <video ref={videoRef} src={src} poster={poster} muted={muted} loop playsInline preload="none" aria-label={`${title} preview`} />
    <button className="placement-video-open" type="button" onClick={onOpen} aria-label={`Open ${title} in large view`}>
      <span className="placement-video-play" aria-hidden="true"><i /></span>
    </button>
    <button className="placement-video-sound" type="button" aria-pressed={!muted}
      aria-label={muted ? `Unmute ${title}` : `Mute ${title}`}
      onClick={() => setMuted(value => !value)}>
      {muted
        ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="m17 9 4 6m0-6-4 6"/></svg>
        : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16 8a5 5 0 0 1 0 8M18.5 5.5a9 9 0 0 1 0 13"/></svg>}
    </button>
  </article>;
}
