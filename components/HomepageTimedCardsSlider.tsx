'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './HomepageTimedCardsSlider.module.css';

export type HomepageCardSlide = { image: string; alt?: string; caption?: string };

export default function HomepageTimedCardsSlider({ slides, label, paused = false, interval = 5200 }: {
  slides: HomepageCardSlide[];
  label: string;
  paused?: boolean;
  interval?: number;
}) {
  const safeSlides = slides.filter(slide => slide.image);
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  const activeIndex = useRef(0);
  activeIndex.current = active;

  const goTo = useCallback((target: number) => {
    if (safeSlides.length < 2) return;
    setActive((target + safeSlides.length) % safeSlides.length);
  }, [safeSlides.length]);

  useEffect(() => {
    if (paused || held || safeSlides.length < 2) return;
    const timer = window.setInterval(() => goTo(activeIndex.current + 1), interval);
    return () => window.clearInterval(timer);
  }, [goTo, held, interval, paused, safeSlides.length]);

  useEffect(() => {
    if (active >= safeSlides.length) setActive(0);
  }, [active, safeSlides.length]);

  if (!safeSlides.length) return null;

  return <section className={styles.slider} aria-label={label} aria-roledescription="carousel"
    onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}
    onFocusCapture={() => setHeld(true)}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeld(false); }}>
    <div className={styles.stage}>
      {safeSlides.map((slide, index) => <div key={slide.image}
        className={`${styles.card} ${index === active ? styles.activeCard : styles.hiddenCard}`}
        aria-hidden={index !== active}
        style={{ backgroundImage: `url("${slide.image}")` }}>
        {index === active && slide.caption && <p className={styles.caption}>{slide.caption}</p>}
      </div>)}
      {safeSlides.length > 1 && <div className={styles.pagination}>
        <button type="button" aria-label="Previous slide" onClick={() => goTo(activeIndex.current - 1)}>‹</button>
        <button type="button" aria-label="Next slide" onClick={() => goTo(activeIndex.current + 1)}>›</button>
        <div className={styles.progress} role="group" aria-label="Choose slide">
          {safeSlides.map((slide, index) => <button key={slide.image} type="button"
            aria-label={`Go to slide ${index + 1}`} aria-current={index === active ? 'true' : undefined}
            onClick={() => goTo(index)}>
            <span className={index === active && !paused && !held ? styles.progressActive : undefined}
              style={{ animationDuration: `${interval}ms` }} />
          </button>)}
        </div>
        <span className={styles.count} aria-live="polite">{String(active + 1).padStart(2, '0')} / {String(safeSlides.length).padStart(2, '0')}</span>
      </div>}
    </div>
  </section>;
}
