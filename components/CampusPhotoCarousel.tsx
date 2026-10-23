'use client';

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';

type Photo = readonly [image: string, alt: string];
type Variant = 'celeb' | 'fest' | 'clubs' | 'hostel' | 'tour' | 'logos';
type Pose = { left: number; width: number; height: number; depth: number; taper: number };
const ASSETS = '/nextjs/homev1/assets/campus/';
const wrap = (index: number, count: number) => ((index % count) + count) % count;

function frames(variant: Variant, mobile: boolean): Pose[] {
  const pose = (left: number, width: number, height: number, depth = 1, taper = 0): Pose => ({ left, width, height, depth, taper });
  if (variant === 'logos') return Array.from({ length: mobile ? 3 : 8 }, (_, i) => pose(i * (mobile ? 34 : 12.6), mobile ? 32 : 11.8, 100));
  if (variant === 'clubs') return [pose(0, 100, 100)];
  if (variant === 'tour') return [pose(0, 34, 84), pose(30.4, 39.2, 100, 3), pose(66.2, 33.8, 84)];
  if (variant === 'hostel') return mobile
    ? [pose(0, 58, 100, 4), pose(54, 46, 78, 3)]
    : [pose(0, 35.61, 100, 4), pose(32.46, 26.53, 74.17, 3), pose(55.85, 24.63, 68.44, 2), pose(78.86, 21.14, 63.8)];
  if (variant === 'celeb') return mobile
    ? [pose(0, 34, 80), pose(30, 40, 100, 3), pose(66, 34, 80)]
    : [pose(0, 19.97, 72.93), pose(15.91, 23.107, 84.37, 2), pose(36.53, 26.877, 100, 3), pose(60.97, 23.137, 84.32, 2), pose(80.08, 19.92, 72.32)];
  if (mobile) return [pose(0, 35, 100, 1, 14.7), pose(36, 28, 65), pose(65, 35, 100, 1, -14.7)];
  const widths = [17.47107, 12.86644, 11.31184, 11.31183, 11.31183, 12.86644, 17.47107];
  const heights = [100, 64.598, 56.683, 52.323, 56.683, 64.598, 100];
  const tapers = [14.7, 7.2, 3.8, 0, -3.8, -7.2, -14.7];
  let left = 0;
  return widths.map((width, index) => {
    const result = pose(left / 1.006354, width / 1.006354, heights[index], 1, tapers[index]);
    left += width + 1.00415;
    return result;
  });
}

function clipping(taper: number) {
  return taper >= 0
    ? `polygon(0 0,100% ${taper}%,100% ${100 - taper}%,0 100%)`
    : `polygon(0 ${-taper}%,100% 0,100% 100%,0 ${100 + taper}%)`;
}

/** Each photograph belongs to its moving frame. Neighbours advance one position. */
export default function CampusPhotoCarousel({ images, variant, label, paused, onPreview, assetBase = ASSETS, animationNames = ['campus-frame-step-odd', 'campus-frame-step-even'] }: {
  images: readonly Photo[];
  variant: Variant;
  label: string;
  paused: boolean;
  onPreview: (image: string, alt: string) => void;
  assetBase?: string;
  animationNames?: readonly [string, string];
}) {
  const root = useRef<HTMLDivElement>(null);
  const instructions = useId();
  const [index, setIndex] = useState(0);
  const [move, setMove] = useState<{ direction: number; manual: boolean; sequence: number } | null>(null);
  const sequence = useRef(0);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [mobile, setMobile] = useState(false);
  const gesture = useRef<{ x: number; y: number; id: number } | null>(null);
  const dragged = useRef(false);
  const lastWheel = useRef(0);
  const count = images.length;
  const continuous = variant === 'fest' || variant === 'logos';
  const poses = frames(variant, mobile);
  const stopped = paused || hidden || !visible;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const viewport = window.matchMedia('(max-width: 700px)');
    const motion = () => { setReduced(media.matches); setMove(null); };
    const resize = () => { setMobile(viewport.matches); setMove(null); };
    const visibility = () => setHidden(document.hidden);
    motion(); resize(); visibility();
    media.addEventListener('change', motion);
    viewport.addEventListener('change', resize);
    document.addEventListener('visibilitychange', visibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .05 });
    if (root.current) observer.observe(root.current);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', motion);
      viewport.removeEventListener('change', resize);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  useEffect(() => {
    if (reduced || stopped || move || count < 2) return;
    const timer = window.setTimeout(() => setMove({ direction: 1, manual: false, sequence: ++sequence.current }), continuous ? 40 : 6500);
    return () => window.clearTimeout(timer);
  }, [continuous, reduced, stopped, move, count, index]);

  function navigate(direction: number) {
    if (paused || count < 2 || (move && !continuous)) return;
    if (reduced) { setIndex(current => current + direction); return; }
    if (continuous && move) setIndex(current => current + move.direction);
    setMove({ direction, manual: true, sequence: ++sequence.current });
  }

  function finish() {
    if (!move) return;
    setIndex(current => current + move.direction);
    setMove(continuous && !reduced ? { direction: 1, manual: false, sequence: ++sequence.current } : null);
  }

  function getPose(offset: number): Pose {
    if (offset < 0) return { ...poses[0], left: offset * (poses[0].width + 2), depth: 0 };
    if (offset >= poses.length) return { ...poses[poses.length - 1], left: 102 + (offset - poses.length) * (poses[poses.length - 1].width + 2), depth: 0 };
    return poses[offset];
  }

  if (!count) return null;
  return <div className={`campus-gallery campus-gallery--${variant}`}>
    <div ref={root} className={`campus-slider campus-slider--${variant} campus-card-slider`}
      role="region" aria-roledescription="carousel" aria-label={label} aria-describedby={instructions}
      tabIndex={0} data-index={wrap(index, count)} data-moving={!!move} data-paused={stopped}
      onKeyDown={event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault(); navigate(event.key === 'ArrowRight' ? 1 : -1);
      }}>
      <span id={instructions} className="campus-carousel-sr">Drag horizontally or use the left and right arrow keys. Each framed photograph moves together. Automatic movement continues on hover.</span>
      <div className="campus-slider-images"
        onPointerDown={event => {
          if (event.button !== 0 && event.pointerType === 'mouse') return;
          gesture.current = { x: event.clientX, y: event.clientY, id: event.pointerId }; dragged.current = false;
        }}
        onPointerMove={event => {
          const start = gesture.current;
          if (!start || start.id !== event.pointerId) return;
          const dx = event.clientX - start.x, dy = event.clientY - start.y;
          if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.2) {
            event.currentTarget.setPointerCapture?.(event.pointerId);
            dragged.current = true; gesture.current = null; navigate(dx < 0 ? 1 : -1);
          }
        }}
        onPointerUp={() => { gesture.current = null; }}
        onPointerCancel={() => { gesture.current = null; dragged.current = false; }}
        onWheel={event => {
          if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 24) return;
          event.preventDefault();
          if (Date.now() - lastWheel.current < 700) return;
          lastWheel.current = Date.now(); navigate(event.deltaX > 0 ? 1 : -1);
        }}
        onClickCapture={event => {
          if (dragged.current) { event.preventDefault(); event.stopPropagation(); dragged.current = false; }
        }}>
        {Array.from({ length: poses.length + 2 }, (_, position) => {
          const offset = position - 1;
          const from = getPose(offset), to = getPose(offset - (move?.direction ?? 0));
          const absolute = index + offset;
          const [image, alt] = images[wrap(absolute, count)];
          const outside = offset < 0 || offset >= poses.length;
          const style = {
            left: `${from.left}%`, width: `${from.width}%`, height: `${from.height}%`, zIndex: from.depth,
            '--frame-from-left': `${from.left}%`, '--frame-to-left': `${to.left}%`,
            '--frame-from-width': `${from.width}%`, '--frame-to-width': `${to.width}%`,
            '--frame-from-height': `${from.height}%`, '--frame-to-height': `${to.height}%`,
            '--frame-from-depth': from.depth, '--frame-to-depth': to.depth,
            '--frame-from-clip': variant === 'fest' ? clipping(from.taper) : 'inset(0 round var(--campus-frame-radius))',
            '--frame-to-clip': variant === 'fest' ? clipping(to.taper) : 'inset(0 round var(--campus-frame-radius))',
            animationName: move ? animationNames[move.sequence % 2 ? 0 : 1] : 'none',
            animationDuration: continuous && move && !move.manual ? '5s' : '650ms',
            animationTimingFunction: continuous && move && !move.manual ? 'linear' : 'ease-in-out',
            animationPlayState: stopped ? 'paused' : 'running',
            clipPath: variant === 'fest' ? clipping(from.taper) : undefined,
          } as CSSProperties;
          return <button className="campus-slide campus-photo" type="button" key={`frame-${absolute}`} style={style}
            data-photo={image} data-frame-position={offset} aria-label={`Enlarge: ${alt}`}
            tabIndex={outside ? -1 : 0} aria-hidden={outside || undefined}
            onClick={() => onPreview(image, alt)}
            onAnimationEnd={event => {
              // Other frames can finish in the same browser tick. Ignore an old
              // generation after the leader has already started the next step.
              if (offset === 0 && event.target === event.currentTarget && event.animationName === event.currentTarget.style.animationName) finish();
            }}>
            <img src={assetBase + image} alt={alt} loading="lazy" draggable={false} />
            <span className="campus-slide-zoom" aria-hidden="true">↗</span>
          </button>;
        })}
      </div>
      {!continuous && count > 1 && <div className="campus-gallery-controls">
        <button type="button" onClick={() => navigate(-1)} disabled={paused || !!move} aria-label={`Previous photo: ${label}`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={variant === 'celeb' ? 'm13 5-7 7 7 7m7-14-7 7 7 7' : 'm15 5-7 7 7 7'} /></svg></button>
        <button type="button" onClick={() => navigate(1)} disabled={paused || !!move} aria-label={`Next photo: ${label}`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={variant === 'celeb' ? 'm4 5 7 7-7 7m7-14 7 7-7 7' : 'm9 5 7 7-7 7'} /></svg></button>
      </div>}
    </div>
  </div>;
}
