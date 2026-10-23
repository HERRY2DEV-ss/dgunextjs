'use client';

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import styles from './SmoothFrameCarousel.module.css';

type Item = { label: string; content: ReactNode };
type Layout = 'facilities' | 'ribbon';
const wrap = (value: number, count: number) => ((value % count) + count) % count;

/** Keep neighbouring frames mounted while they move, including at the loop boundary. */
export default function SmoothFrameCarousel({ items, label, layout, initialIndex = 0, paused = false, interval = 3400, frameClassName = '', tabPrefix, panelId, onChange, onActivate }: {
  items: Item[]; label: string; layout: Layout; initialIndex?: number; paused?: boolean; interval?: number;
  frameClassName?: string; tabPrefix?: string; panelId?: string;
  onChange?: (index: number) => void; onActivate?: (index: number) => void;
}) {
  const root = useRef<HTMLDivElement>(null), stage = useRef<HTMLDivElement>(null), id = useId();
  const [active, setActive] = useState(initialIndex), [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false), [hidden, setHidden] = useState(false), [reduced, setReduced] = useState(true), [mobile, setMobile] = useState(false);
  const [held, setHeld] = useState(false), [keyboardHeld, setKeyboardHeld] = useState(false);
  const [moving, setMoving] = useState(false);
  const pointer = useRef<{ x: number; y: number; id: number } | null>(null), blockClick = useRef(0), queued = useRef(0), settling = useRef<ReturnType<typeof setTimeout> | null>(null);
  const count = items.length, index = count ? wrap(active, count) : 0, radius = Math.min(mobile ? 1 : 3, Math.floor(count / 2));
  const move = useCallback((delta: number) => {
    if (count < 2 || !delta || settling.current !== null) return;
    if (reduced) { setActive(value => value + delta); return; }
    queued.current = delta; setMoving(true);
    const step = () => {
      const direction = Math.sign(queued.current); queued.current -= direction; setActive(value => value + direction);
      settling.current = setTimeout(() => {
        settling.current = null;
        if (queued.current) step(); else setMoving(false);
      }, 980);
    };
    step();
  }, [count, reduced]);

  useEffect(() => () => { if (settling.current !== null) clearTimeout(settling.current); }, []);

  useEffect(() => { onChange?.(index); }, [index, onChange]);
  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)'), width = matchMedia('(max-width: 600px)');
    const sync = () => { setReduced(motion.matches); setMobile(width.matches); setHidden(document.hidden); };
    sync(); motion.addEventListener('change', sync); width.addEventListener('change', sync); document.addEventListener('visibilitychange', sync);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .15 });
    if (root.current) observer.observe(root.current);
    return () => { observer.disconnect(); motion.removeEventListener('change', sync); width.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); };
  }, []);
  useEffect(() => {
    if (!visible || hidden || reduced || !playing || held || keyboardHeld || paused || moving || count < 2) return;
    const timer = setTimeout(() => move(1), interval);
    return () => clearTimeout(timer);
  }, [active, visible, hidden, reduced, playing, held, keyboardHeld, paused, moving, count, interval, move]);

  if (!count) return null;
  function pose(offset: number) {
    if (layout === 'facilities') {
      return { left: 50 + offset * (mobile ? 33 : 14.2), width: (mobile ? 30 : 12.8) * (offset === 0 ? 1.1 : 1), height: offset === 0 ? 96 : 84, taper: 0 };
    }
    if (mobile) return { left: 50 + offset * 36, width: offset === 0 ? 28 : 35, height: offset === 0 ? 65 : 100, taper: offset < 0 ? 14.7 : offset > 0 ? -14.7 : 0 };
    const positions = [8.7, 24.9, 37.7, 50, 62.3, 75.1, 91.3], widths = [17.4, 12.8, 11.3, 11.3, 11.3, 12.8, 17.4], heights = [100, 64.6, 56.7, 52.3, 56.7, 64.6, 100], tapers = [14.7, 7.2, 3.8, 0, -3.8, -7.2, -14.7];
    const slot = Math.max(0, Math.min(6, offset + 3));
    return { left: offset < -3 ? -12 : offset > 3 ? 112 : positions[slot], width: widths[slot], height: heights[slot], taper: tapers[slot] };
  }
  const focusCentre = () => requestAnimationFrame(() => stage.current?.querySelector<HTMLButtonElement>('[data-offset="0"]')?.focus({ preventScroll: true }));
  return <div ref={root} className={`${styles.carousel} ${styles[layout]}`} role="region" aria-roledescription="carousel" aria-label={label} aria-describedby={`${id}-help`} data-carousel={layout} data-index={index} data-moving={moving} data-playing={playing && !paused && !reduced && !hidden && visible && !held && !keyboardHeld}
    onFocusCapture={event => { if ((event.target as HTMLElement).matches(':focus-visible')) setKeyboardHeld(true); }}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setKeyboardHeld(false); }}
    onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); move(event.key === 'Home' ? -index : event.key === 'End' ? count - 1 - index : event.key === 'ArrowRight' ? 1 : -1);
      if (layout === 'facilities') focusCentre();
    }}>
    <span id={`${id}-help`} className={styles.srOnly}>Swipe or use the arrow keys to move one item at a time. Use the pause button to stop automatic movement.</span>
    <div ref={stage} className={styles.stage} role={tabPrefix ? 'tablist' : undefined} aria-label={tabPrefix ? label : undefined}
      onPointerDown={event => {
        if (event.button !== 0 && event.pointerType === 'mouse') return;
        pointer.current = { x: event.clientX, y: event.clientY, id: event.pointerId }; setHeld(true);
      }}
      onPointerMove={event => {
        const start = pointer.current; if (!start || start.id !== event.pointerId) return;
        const dx = event.clientX - start.x, dy = event.clientY - start.y;
        if (Math.abs(dx) < 35 || Math.abs(dx) <= Math.abs(dy) * 1.2) return;
        event.currentTarget.setPointerCapture(event.pointerId); pointer.current = null; blockClick.current = Date.now() + 500; move(dx < 0 ? 1 : -1);
      }}
      onPointerUp={() => { pointer.current = null; setHeld(false); }} onPointerCancel={() => { pointer.current = null; setHeld(false); }}
      onDragStart={event => event.preventDefault()}
      onClickCapture={event => { if (Date.now() < blockClick.current) { event.preventDefault(); event.stopPropagation(); } }}>
      {Array.from({ length: radius * 2 + 3 }, (_, position) => {
        const offset = position - radius - 1, absolute = active + offset, itemIndex = wrap(absolute, count), item = items[itemIndex], outside = Math.abs(offset) > radius;
        const frame = pose(offset), taper = frame.taper;
        const style = { '--frame-left': `${frame.left}%`, '--frame-width': `${frame.width}%`, '--frame-height': `${frame.height}%`, zIndex: layout === 'facilities' ? 6 - Math.abs(offset) : 1,
          clipPath: layout === 'ribbon' ? taper >= 0 ? `polygon(0 0,100% ${taper}%,100% ${100 - taper}%,0 100%)` : `polygon(0 ${-taper}%,100% 0,100% 100%,0 ${100 + taper}%)` : undefined } as CSSProperties;
        return <button type="button" key={absolute} className={`${styles.frame} ${frameClassName}`} style={style} data-offset={offset} data-source-index={itemIndex} data-outside={outside}
          role={tabPrefix ? 'tab' : undefined} id={tabPrefix ? `${tabPrefix}-${itemIndex}${outside ? `-buffer-${absolute}` : ''}` : undefined} aria-controls={panelId}
          aria-selected={tabPrefix ? offset === 0 : undefined} aria-current={!tabPrefix && offset === 0 ? 'true' : undefined}
          aria-label={item.label} aria-hidden={outside || undefined} inert={outside} tabIndex={outside || (tabPrefix && offset !== 0) ? -1 : 0}
          onClick={() => { if (tabPrefix) move(offset); else onActivate?.(itemIndex); }}>
          {item.content}
        </button>;
      })}
    </div>
    {count > 1 && <div className={styles.controls}>
      <button type="button" aria-label={`Previous item: ${label}`} onClick={() => move(-1)}>‹</button>
      <button type="button" aria-label={`${playing ? 'Pause' : 'Resume'} automatic slider: ${label}`} aria-pressed={!playing} onClick={() => setPlaying(value => !value)}>{playing ? 'Ⅱ' : '▶'}</button>
      <button type="button" aria-label={`Next item: ${label}`} onClick={() => move(1)}>›</button>
    </div>}
  </div>;
}
