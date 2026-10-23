'use client';

import { useEffect, useRef, useState } from 'react';
import { admissionsPlacement } from './admissions-data';

const VIDEO_SRC = '/nextjs/homev1/assets/mba.mp4';

export default function AdmissionsVideo({ paused = false, src = VIDEO_SRC, poster = '/nextjs/homev1/assets/mba.webp', stats = admissionsPlacement.stats, variant = 'admissions', heading, title, description }: {
  paused?: boolean; src?: string; poster?: string; stats?: ReadonlyArray<readonly [string, string]>;
  variant?: 'admissions' | 'program' | 'placements'; heading?: string; title?: string; description?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [playBlocked, setPlayBlocked] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || unavailable) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let active = true;
    const sync = () => {
      if (!active) return;
      if (paused || !visible || document.hidden || (!playing && reducedMotion.matches)) {
        video.pause();
      } else {
        video.muted = !playing;
        video.play().catch(() => { /* The central play control remains available. */ });
      }
    };
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, { threshold: 0.15 }) : null;
    if (observer) observer.observe(video);
    else { visible = true; sync(); }
    document.addEventListener('visibilitychange', sync);
    reducedMotion.addEventListener('change', sync);
    return () => {
      active = false;
      observer?.disconnect();
      document.removeEventListener('visibilitychange', sync);
      reducedMotion.removeEventListener('change', sync);
    };
  }, [paused, playing, unavailable, src]);

  useEffect(() => {
    const video = videoRef.current;
    return () => video?.pause();
  }, []);

  const play = () => {
    const video = videoRef.current;
    if (!video) return;
    setPlayBlocked(false);
    video.currentTime = 0;
    video.muted = false;
    setPlaying(true);
    video.play().catch(() => { setPlaying(false); setPlayBlocked(true); });
  };

  return (
    <section className={`program-video-highlights${variant === 'admissions' ? ' admissions-video-highlights' : variant === 'placements' ? ' placement-video' : ''}${playing ? ' is-playing' : ''}`} aria-label={stats.length ? 'DGU campus video and placement highlights' : 'DGU campus video'}>
      <div className="program-video-media">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={!playing}
        loop={!playing}
        controls={playing}
        playsInline
        autoPlay
        preload="metadata"
        aria-label="DBS Global University campus video"
        onEnded={() => setPlaying(false)}
        onError={() => { setUnavailable(true); setPlaying(false); }}
      >
        <a href={src}>Watch the DGU campus video</a>
      </video>
      <div className="program-video-shade" aria-hidden="true" />
      {(heading || title || description) && !playing && <div className="program-video-heading">
        {heading && <span>{heading}</span>}{title && <h2>{title}</h2>}{description && <p>{description}</p>}
      </div>}
      {!playing && !unavailable && <button className="program-video-play" type="button" aria-label="Play DGU campus video with sound" onClick={play}>
        <span aria-hidden="true">▶</span>
      </button>}
      {(unavailable || playBlocked) && <p className="admissions-video-error" role="status">
        {unavailable ? 'The campus video is temporarily unavailable.' : 'Video playback could not start.'}{' '}
        <a href={src}>Open the video</a>
      </p>}
      {stats.length > 0 && <dl className="program-video-stats">
        {stats.map(([value, label]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>}
      </div>
    </section>
  );
}
