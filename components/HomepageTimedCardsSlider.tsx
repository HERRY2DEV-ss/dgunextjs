'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import styles from './HomepageTimedCardsSlider.module.css';

export type HomepageCardSlide = { image: string; alt?: string; caption?: string };

export default function HomepageTimedCardsSlider({ slides, label, paused = false, interval = 5200 }: {
  slides: HomepageCardSlide[];
  label: string;
  paused?: boolean;
  interval?: number;
}) {
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  const root = useRef<HTMLElement>(null);
  const timer = useRef<number | null>(null);
  const busy = useRef(false);
  const activeIndex = useRef(0);
  activeIndex.current = active;
  const safeSlides = slides.filter(slide => slide.image);

  const goTo = useCallback((target: number) => {
    if (busy.current || safeSlides.length < 2) return;
    const next = (target + safeSlides.length) % safeSlides.length;
    const current = activeIndex.current;
    if (next === current) return;
    const node = root.current;
    if (!node) { setActive(next); return; }
    busy.current = true;
    const cards = Array.from(node.querySelectorAll<HTMLElement>('[data-home-card]'));
    const oldCard = cards.find(card => Number(card.dataset.homeCard) === current);
    const newCard = cards.find(card => Number(card.dataset.homeCard) === next);
    const previewCards = cards.filter(card => Number(card.dataset.homeCard) !== next);
    if (!oldCard || !newCard) {
      setActive(next);
      busy.current = false;
      return;
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setActive(next);
    if (reduce) { busy.current = false; return; }
    gsap.set(newCard, { zIndex: 3, scale: 0.82, x: 0, y: 28, borderRadius: 12 });
    gsap.to(oldCard, { scale: 1.04, duration: 0.65, ease: 'power2.inOut', onComplete: () => gsap.set(oldCard, { zIndex: 0 }) });
    gsap.to(newCard, { scale: 1, x: 0, y: 0, borderRadius: 0, duration: 0.8, ease: 'power3.inOut' });
    previewCards.forEach((card, order) => {
      const idx = Number(card.dataset.homeCard);
      const distance = (idx - next + safeSlides.length) % safeSlides.length;
      if (distance === 0) return;
      gsap.to(card, { duration: 0.65, ease: 'power2.inOut', delay: order * 0.025, onComplete: () => {
        if (Number(card.dataset.homeCard) === current) gsap.set(card, { zIndex: 0 });
      }});
    });
    window.setTimeout(() => { busy.current = false; }, 850);
  }, [safeSlides]);

  useEffect(() => {
    if (paused || held || safeSlides.length < 2) return;
    timer.current = window.setInterval(() => goTo(activeIndex.current + 1), interval);
    return () => { if (timer.current !== null) window.clearInterval(timer.current); };
  }, [goTo, held, interval, paused, safeSlides.length]);

  if (!safeSlides.length) return null;
  const ordered = safeSlides.map((slide, index) => ({ slide, index }));
  return <section ref={root} className={styles.slider} aria-label={label} aria-roledescription="carousel"
    onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}
    onFocusCapture={() => setHeld(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeld(false); }}>
    <div className={styles.stage}>
      {ordered.map(({ slide, index }) => {
        const distance = (index - active + safeSlides.length) % safeSlides.length;
        const isActive = index === active;
        const preview = !isActive && distance > 0;
        return <div key={slide.image} className={`${styles.card} ${isActive ? styles.activeCard : preview ? styles.previewCard : styles.hiddenCard}`}
          data-home-card={index} aria-hidden={!isActive} style={{
            backgroundImage: `url("${slide.image}")`,
            zIndex: isActive ? 2 : preview ? 10 - distance : 0,
            '--card-order': distance,
          } as React.CSSProperties}>
          {isActive && slide.caption && <p className={styles.caption}>{slide.caption}</p>}
        </div>;
      })}
      <div className={styles.pagination}>
        <button type="button" aria-label="Previous slide" onClick={() => goTo(activeIndex.current - 1)}>‹</button>
        <button type="button" aria-label="Next slide" onClick={() => goTo(activeIndex.current + 1)}>›</button>
        <div className={styles.progress} aria-hidden="true"><span style={{ width: `${((active + 1) / safeSlides.length) * 100}%` }} /></div>
        <span className={styles.count} aria-live="polite">{String(active + 1).padStart(2, '0')} / {String(safeSlides.length).padStart(2, '0')}</span>
      </div>
    </div>
  </section>;
}
