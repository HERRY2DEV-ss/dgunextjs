'use client';

import { useCallback, useEffect, useState, type SyntheticEvent } from 'react';
import styles from './HomepageTimedCardsSlider.module.css';

export type HomepageCardSlide = { image: string; mobile?: string; alt?: string; caption?: string };

export default function HomepageTimedCardsSlider({ slides, label, paused = false, interval = 5200, className = '' }: {
  slides: HomepageCardSlide[];
  label: string;
  paused?: boolean;
  interval?: number;
  className?: string;
}) {
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [imageRatios, setImageRatios] = useState<Record<string, string>>({});
  const safeSlides = slides.filter(slide => slide.image && !failedImages.includes(slide.image));
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  const activeIndex = safeSlides.length ? active % safeSlides.length : 0;
  const nextIndex = safeSlides.length ? (activeIndex + 1) % safeSlides.length : 0;
  const activeSlide = safeSlides[activeIndex];
  const aspectRatio = activeSlide ? imageRatios[activeSlide.image] || '1920 / 708' : '1920 / 708';
  const goTo = useCallback((target: number) => {
    if (safeSlides.length < 2) return;
    setActive((target + safeSlides.length) % safeSlides.length);
  }, [safeSlides.length]);
  const recordImageRatio = (event: SyntheticEvent<HTMLImageElement>, imageUrl: string) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (naturalWidth && naturalHeight) {
      const ratio = `${naturalWidth} / ${naturalHeight}`;
      setImageRatios(current => current[imageUrl] === ratio ? current : { ...current, [imageUrl]: ratio });
    }
  };

  useEffect(() => {
    if (paused || held || safeSlides.length < 2) return;
    const timer = window.setInterval(() => goTo(active + 1), interval);
    return () => window.clearInterval(timer);
  }, [active, goTo, held, interval, paused, safeSlides.length]);

  if (!safeSlides.length) return null;

  return <section className={`${styles.slider} ${className}`} style={{ aspectRatio }} aria-label={label} aria-roledescription="carousel"
    onFocusCapture={() => setHeld(true)}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeld(false); }}>
    <div className={styles.stage}>
      {safeSlides.map((slide, index) => <div key={slide.image}
        className={`${styles.card} ${index === activeIndex ? styles.activeCard : styles.hiddenCard}`}
        aria-hidden={index !== activeIndex}
        >
        {(index === activeIndex || index === nextIndex) && <picture className={styles.slidePicture}>
            {slide.mobile && <source media="(max-width: 700px)" srcSet={slide.mobile} />}
            <img className={styles.slideImage} src={slide.image} alt={slide.alt ?? ''} fetchPriority={index === activeIndex ? 'high' : 'auto'} decoding="async" onLoad={event => recordImageRatio(event, slide.image)} onError={() => setFailedImages(current => current.includes(slide.image) ? current : [...current, slide.image])} />
          </picture>}
        {index === activeIndex && slide.caption && <p className={styles.caption}>{slide.caption}</p>}
      </div>)}
    </div>
  </section>;
}
