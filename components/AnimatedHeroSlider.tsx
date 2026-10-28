'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { gsap } from 'gsap';
import styles from './AnimatedHeroSlider.module.css';

export type HeroSlide = { image: string; mobile?: string; alt?: string; href?: string; caption?: string };
type HeroFlightStart = { left: number; top: number; width: number; height: number; borderRadius: string; objectFit: string; objectPosition: string };
type HeroTransition = { previous: string; source: string; start?: HeroFlightStart };
type HomeSliderLayout = { width: number; height: number; cardWidth: number; cardHeight: number; stackLeft: number; stackTop: number; step: number };

function getHomeSliderLayout(width: number, height: number, slideCount: number): HomeSliderLayout {
  const cardWidth = Math.min(200, Math.max(70, width * 0.19));
  const cardHeight = Math.min(300, cardWidth * 1.5);
  const gap = Math.min(40, Math.max(12, width * 0.0375));
  const stackWidth = Math.max(0, slideCount - 1) * cardWidth + Math.max(0, slideCount - 2) * gap;
  const rightMargin = Math.min(136, Math.max(12, width * 0.07));
  return {
    width,
    height,
    cardWidth,
    cardHeight,
    stackLeft: Math.max(12, width - stackWidth - rightMargin),
    stackTop: Math.max(72, height - cardHeight - (height < 600 ? 72 : 130)),
    step: cardWidth + gap,
  };
}

function getHomeCardTarget(rank: number, layout: HomeSliderLayout) {
  return rank === 0
    ? { x: 0, y: 0, width: layout.width, height: layout.height, borderRadius: 0, scale: 1, zIndex: 20 }
    : {
      x: layout.stackLeft + (rank - 1) * layout.step,
      y: layout.stackTop,
      width: layout.cardWidth,
      height: layout.cardHeight,
      borderRadius: 10,
      scale: 1,
      zIndex: 30,
    };
}

function setHomeCardPositions(slides: HeroSlide[], activeIndex: number, cards: Map<string, HTMLButtonElement>, layout: HomeSliderLayout) {
  const order = Array.from({ length: slides.length }, (_, offset) => (activeIndex + offset) % slides.length);
  order.forEach((slideIndex, rank) => {
    const card = cards.get(slides[slideIndex].image);
    if (card) gsap.set(card, getHomeCardTarget(rank, layout));
  });
}

export default function AnimatedHeroSlider({ slides, label, title, eyebrow, date, description, paused = false, interval = 5200, aspectRatio, variant, className = '', onImageUnavailable, onImageRatio, onActivateHero, onHeroButtonRef }: {
  slides: HeroSlide[];
  label: string;
  title?: string;
  eyebrow?: string;
  date?: string;
  description?: ReactNode;
  paused?: boolean;
  interval?: number;
  aspectRatio?: string;
  variant?: 'home' | 'school' | 'news';
  className?: string;
  onImageUnavailable?: (image: string) => void;
  onImageRatio?: (ratio: string) => void;
  onActivateHero?: (slide: HeroSlide) => void;
  onHeroButtonRef?: (node: HTMLButtonElement | null) => void;
}) {
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const [failedMobile, setFailedMobile] = useState<string[]>([]);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [visible, setVisible] = useState(false);
  const [held, setHeld] = useState(false);
  const [preloading, setPreloading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [flightReady, setFlightReady] = useState(false);
  const root = useRef<HTMLElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const outgoingImage = useRef<HTMLImageElement>(null);
  const homeCards = useRef(new Map<string, HTMLButtonElement>());
  const homeSlides = useRef<HeroSlide[]>([]);
  const homeIndex = useRef(0);
  const homeDetails = useRef<HTMLDivElement>(null);
  const homePagination = useRef<HTMLDivElement>(null);
  const homeIndicator = useRef<HTMLDivElement>(null);
  const homeActiveImage = useRef<string | null>(null);
  const homeSlideSignature = useRef('');
  const homeInitialized = useRef(false);
  const homeAnimation = useRef<gsap.core.Timeline | null>(null);
  const transitionLock = useRef(false);
  const ratioSource = useRef<string | null>(null);
  const [flight, setFlight] = useState<HeroTransition | null>(null);
  const flightRequest = useRef(0);
  const thumbnailPositions = useRef<Map<number, DOMRect> | null>(null);
  const flightImage = useRef<HTMLImageElement | null>(null);
  const available = useMemo(() => slides.filter(slide => slide.image && !failed.includes(slide.image)), [slides, failed]);
  const index = available.length ? active % available.length : 0;
  const current = available[index];
  const upcoming = useMemo(() => available.length > 1
    ? Array.from({ length: Math.min(4, available.length - 1) }, (_, offset) => (index + offset + 1) % available.length)
    : [], [available.length, index]);
  const hasCaption = !!(title || eyebrow || date || description);
  const thumbnailIndices = variant === 'home'
    ? Array.from({ length: Math.min(4, available.length) }, (_, offset) => (index + offset) % available.length)
    : upcoming;

  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(motion.matches);
    update();
    motion.addEventListener('change', update);
    return () => motion.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    let timers: number[] = [];
    const scheduleRatio = () => {
      timers.forEach(timer => window.clearTimeout(timer));
      timers = [0, 120, 480].map(delay => window.setTimeout(() => {
        const node = image.current;
        if (node?.naturalWidth && node.naturalHeight) {
          ratioSource.current = node.currentSrc || node.src;
          onImageRatio?.(`${node.naturalWidth} / ${node.naturalHeight}`);
        }
      }, delay));
    };
    window.addEventListener('resize', scheduleRatio);
    scheduleRatio();
    return () => {
      window.removeEventListener('resize', scheduleRatio);
      timers.forEach(timer => window.clearTimeout(timer));
    };
  }, [onImageRatio]);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.1 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    homeSlides.current = available;
    homeIndex.current = index;
  }, [available, index]);

  useLayoutEffect(() => {
    if (variant !== 'home') return;
    const node = root.current;
    if (!node || !homeSlides.current.length) return;
    const animationTargets = [...homeCards.current.values(), homeDetails.current, homePagination.current, homeIndicator.current].filter(Boolean);
    const slidesNow = homeSlides.current;
    const activeIndex = homeIndex.current;
    const layout = getHomeSliderLayout(node.clientWidth, node.clientHeight, slidesNow.length);
    if (!layout.width || !layout.height) return;
    const order = Array.from({ length: slidesNow.length }, (_, offset) => (activeIndex + offset) % slidesNow.length);

    order.forEach((slideIndex, rank) => {
      const card = homeCards.current.get(slidesNow[slideIndex].image);
      if (!card) return;
      const target = getHomeCardTarget(rank, layout);
      gsap.set(card, target);
    });

    if (homeDetails.current) gsap.set(homeDetails.current, { x: 0, opacity: 1 });
    if (homePagination.current) gsap.set(homePagination.current, { y: 0, opacity: 1 });
    if (homeIndicator.current) {
      gsap.set(homeIndicator.current, { x: -layout.width });
    }

    homeActiveImage.current = slidesNow[activeIndex]?.image || null;
    homeSlideSignature.current = slidesNow.map(slide => slide.image).join('\0');
    homeInitialized.current = true;
    const resizeObserver = new ResizeObserver(() => {
      const currentSlides = homeSlides.current;
      if (!currentSlides.length) return;
      const currentActive = currentSlides.findIndex(slide => slide.image === homeActiveImage.current);
      const nextLayout = getHomeSliderLayout(node.clientWidth, node.clientHeight, currentSlides.length);
      homeAnimation.current?.kill();
      homeAnimation.current = null;
      gsap.killTweensOf([...homeCards.current.values(), homeDetails.current, homePagination.current, homeIndicator.current].filter(Boolean));
      setHomeCardPositions(currentSlides, currentActive >= 0 ? currentActive : 0, homeCards.current, nextLayout);
      homeActiveImage.current = currentSlides[homeIndex.current]?.image || currentSlides[0].image;
      homeSlideSignature.current = currentSlides.map(slide => slide.image).join('\0');
      if (homeDetails.current) gsap.set(homeDetails.current, { x: 0, opacity: 1 });
      if (homePagination.current) gsap.set(homePagination.current, { y: 0, opacity: 1 });
      if (homeIndicator.current) gsap.set(homeIndicator.current, { x: -nextLayout.width });
      transitionLock.current = false;
      setTransitioning(false);
    });
    resizeObserver.observe(node);

    return () => {
      resizeObserver.disconnect();
      homeAnimation.current?.kill();
      homeAnimation.current = null;
      homeInitialized.current = false;
      homeActiveImage.current = null;
      homeSlideSignature.current = '';
      transitionLock.current = false;
      gsap.killTweensOf(animationTargets);
    };
  }, [variant]);

  useLayoutEffect(() => {
    if (variant !== 'home' || !homeInitialized.current || !current) return;
    const signature = available.map(slide => slide.image).join('\0');
    const previousIndex = available.findIndex(slide => slide.image === homeActiveImage.current);
    if (homeActiveImage.current === current.image) {
      if (signature !== homeSlideSignature.current) {
        const node = root.current;
        homeAnimation.current?.kill();
        homeAnimation.current = null;
        gsap.killTweensOf([...homeCards.current.values(), homeDetails.current, homePagination.current, homeIndicator.current].filter(Boolean));
        if (node) setHomeCardPositions(available, index, homeCards.current, getHomeSliderLayout(node.clientWidth, node.clientHeight, available.length));
        homeSlideSignature.current = signature;
      }
      return;
    }

    const node = root.current;
    if (!node || !available.length) return;
    const layout = getHomeSliderLayout(node.clientWidth, node.clientHeight, available.length);
    homeAnimation.current?.kill();
    homeAnimation.current = null;
    gsap.killTweensOf([...homeCards.current.values(), homeDetails.current, homePagination.current, homeIndicator.current].filter(Boolean));
    if (!layout.width || !layout.height || previousIndex < 0 || reducedMotion) {
      setHomeCardPositions(available, index, homeCards.current, layout);
      homeActiveImage.current = current.image;
      homeSlideSignature.current = signature;
      transitionLock.current = false;
      setTransitioning(false);
      if (homeDetails.current) gsap.set(homeDetails.current, { x: 0, opacity: 1 });
      return;
    }

    const timeline = gsap.timeline({
      defaults: { duration: 0.8, ease: 'sine.inOut' },
      onComplete: () => {
        transitionLock.current = false;
        setTransitioning(false);
      },
    });
    const order = Array.from({ length: available.length }, (_, offset) => (index + offset) % available.length);
    order.forEach((slideIndex, rank) => {
      const slide = available[slideIndex];
      const card = homeCards.current.get(slide.image);
      if (!card) return;
      const target = getHomeCardTarget(rank, layout);
      if (rank === 0) {
        timeline.set(card, { zIndex: 20 }, 0);
        timeline.to(card, target, 0);
      } else if (slide.image === homeActiveImage.current) {
        timeline.set(card, { zIndex: 10 }, 0);
        timeline.to(card, { scale: 1.5 }, 0);
        timeline.set(card, target, 0.8);
      } else {
        timeline.set(card, { zIndex: 30 }, 0);
        timeline.to(card, target, 0.1 * rank);
      }
    });
    if (homeDetails.current) timeline.fromTo(homeDetails.current, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, ease: 'sine.out' }, 0.35);
    if (homeIndicator.current) {
      timeline.set(homeIndicator.current, { x: -layout.width }, 0);
      timeline.to(homeIndicator.current, { x: 0, duration: 2, ease: 'none' }, 0);
      timeline.to(homeIndicator.current, { x: layout.width, duration: 0.8, ease: 'none' }, 2.3);
      timeline.set(homeIndicator.current, { x: -layout.width }, 3.1);
    }
    homeAnimation.current = timeline;
    homeActiveImage.current = current.image;
    homeSlideSignature.current = signature;
  }, [available, current, index, reducedMotion, variant]);

  const select = useCallback(async (next: number, source?: HTMLButtonElement) => {
    if (transitionLock.current || next === index || !available[next]) return;
    if (variant === 'home') {
      transitionLock.current = true;
      setTransitioning(true);
      setActive(next);
      return;
    }
    const sourceButton = source || root.current?.querySelector<HTMLButtonElement>(`[data-slide-index="${next}"]`);
    const thumbnail = sourceButton?.querySelector('img');
    const previous = image.current?.currentSrc || current?.image;
    const slide = available[next];
    const sourceUrl = thumbnail?.currentSrc || (window.matchMedia('(max-width: 700px)').matches && slide.mobile) || thumbnail?.src || slide.image;
    if (reducedMotion || !previous || !sourceUrl || !media.current) {
      setActive(next);
      return;
    }

    transitionLock.current = true;
    const request = ++flightRequest.current;
    setPreloading(true);
    let decodedSource = sourceUrl;
    try {
      await Promise.all([decodedSource, previous].map(async url => {
        const preload = new Image();
        preload.src = url;
        await preload.decode();
      }));
    } catch {
      if (request !== flightRequest.current) return;
      if (slide.mobile && decodedSource === slide.mobile) {
        setFailedMobile(old => old.includes(slide.mobile!) ? old : [...old, slide.mobile!]);
        decodedSource = slide.image;
        try {
          const fallback = new Image();
          fallback.src = decodedSource;
          await fallback.decode();
        } catch {
          transitionLock.current = false;
          setPreloading(false);
          setFailed(old => old.includes(slide.image) ? old : [...old, slide.image]);
          onImageUnavailable?.(slide.image);
          return;
        }
      } else {
        transitionLock.current = false;
        setPreloading(false);
        setFailed(old => old.includes(slide.image) ? old : [...old, slide.image]);
        onImageUnavailable?.(slide.image);
        return;
      }
    }

    if (request !== flightRequest.current || !root.current) return;
    const track = media.current.querySelector<HTMLDivElement>(`.${styles.thumbnails}`);
    const buttons = track ? Array.from(track.querySelectorAll<HTMLButtonElement>('[data-slide-index]')) : [];
    thumbnailPositions.current = new Map(buttons.map(button => [Number(button.dataset.slideIndex), button.getBoundingClientRect()]));
    const selectedButton = buttons.find(button => Number(button.dataset.slideIndex) === next);
    const selectedThumbnail = selectedButton?.querySelector('img');
    const mediaBounds = media.current.getBoundingClientRect();
    const thumbnailBounds = selectedThumbnail?.getBoundingClientRect();
    let start: HeroFlightStart | undefined;
    if (selectedButton && selectedThumbnail && thumbnailBounds && mediaBounds.width && mediaBounds.height) {
      const thumbnailStyle = getComputedStyle(selectedThumbnail);
      start = {
        left: thumbnailBounds.left - mediaBounds.left,
        top: thumbnailBounds.top - mediaBounds.top,
        width: thumbnailBounds.width,
        height: thumbnailBounds.height,
        borderRadius: getComputedStyle(selectedButton).borderRadius,
        objectFit: thumbnailStyle.objectFit,
        objectPosition: thumbnailStyle.objectPosition,
      };
    }
    setPreloading(false);
    setFlightReady(false);
    setFlight({ previous, source: decodedSource, start });
    setTransitioning(true);
    setActive(next);
  }, [available, current?.image, index, onImageUnavailable, reducedMotion, variant]);

  useEffect(() => {
    if (paused || held || reducedMotion || preloading || transitioning || !visible || available.length < 2) return;
    const timer = setTimeout(() => select((index + 1) % available.length), interval);
    return () => clearTimeout(timer);
  }, [available.length, held, index, interval, paused, preloading, reducedMotion, select, transitioning, visible]);

  useLayoutEffect(() => {
    if (!transitioning || !flight || !media.current) return;
    const targetImage = image.current;
    const previousImage = outgoingImage.current;
    if (!targetImage?.complete || !targetImage.naturalWidth || (targetImage.currentSrc || targetImage.src) !== flight.source
      || !previousImage?.complete || !previousImage.naturalWidth) {
      setFlight(null);
      setFlightReady(false);
      transitionLock.current = false;
      setTransitioning(false);
      thumbnailPositions.current = null;
      return;
    }
    if (flight.start && (!flightImage.current?.complete || !flightImage.current.naturalWidth)) return;
    const duration = 700;
    const options: KeyframeAnimationOptions = { duration, easing: 'cubic-bezier(.42,0,.58,1)', fill: 'both' };
    const animations: Animation[] = [
      previousImage.animate([{ opacity: 1 }, { opacity: 0 }], options),
      targetImage.animate([
        { opacity: 0, transform: 'scale(1.05)' },
        { opacity: 1, transform: 'scale(1)' },
      ], options),
    ];
    const expandingImage = flightImage.current;
    const start = flight.start;
    if (expandingImage && start) animations.push(expandingImage.animate([
      {
        left: `${start.left}px`,
        top: `${start.top}px`,
        width: `${start.width}px`,
        height: `${start.height}px`,
        borderRadius: start.borderRadius,
      },
      {
        left: '0px',
        top: '0px',
        width: `${media.current.clientWidth}px`,
        height: `${media.current.clientHeight}px`,
        borderRadius: '0px',
      },
    ], options));
    const oldPositions = thumbnailPositions.current;
    const track = media.current.querySelector<HTMLDivElement>(`.${styles.thumbnails}`);
    if (track && oldPositions) {
      const buttons = Array.from(track.querySelectorAll<HTMLButtonElement>('[data-slide-index]'));
      for (const button of buttons) {
        const before = oldPositions.get(Number(button.dataset.slideIndex));
        const after = button.getBoundingClientRect();
        const x = before ? before.left - after.left : after.width + (Number.parseFloat(getComputedStyle(track).columnGap) || 0);
        const y = before ? before.top - after.top : 0;
        if (x || y) animations.push(button.animate(
          [{ transform: `translate(${x}px, ${y}px)` }, { transform: 'translate(0, 0)' }],
          options,
        ));
      }
    }
    let finished = false;
    let cancelled = false;
    const finish = () => {
      if (cancelled) return;
      if (finished) return;
      finished = true;
      thumbnailPositions.current = null;
      transitionLock.current = false;
      setFlight(null);
      setFlightReady(false);
      setTransitioning(false);
    };
    const finishOnResize = () => {
      animations.forEach(animation => animation.finish());
      finish();
    };
    window.addEventListener('resize', finishOnResize);
    Promise.all(animations.map(animation => animation.finished.catch(() => undefined))).then(finish);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', finishOnResize);
      animations.forEach(animation => animation.cancel());
    };
  }, [flight, flightReady, transitioning]);

  if (!current) return null;
  const content = <picture className={styles.picture}>
    {current.mobile && !failedMobile.includes(current.mobile) && <source media="(max-width: 700px)" srcSet={current.mobile} />}
    <img ref={image} className={styles.heroImage} src={current.image} alt={current.alt || ''} fetchPriority={index === 0 ? 'high' : undefined}
      onLoad={event => {
        const node = event.currentTarget;
        const source = node.currentSrc || node.src;
        if (node.naturalWidth && node.naturalHeight && ratioSource.current !== source) {
          ratioSource.current = source;
          onImageRatio?.(`${node.naturalWidth} / ${node.naturalHeight}`);
        }
      }}
      onError={event => {
        const failedImage = event.currentTarget.currentSrc || current.image;
        if (current.mobile && failedImage === current.mobile) {
          ratioSource.current = null;
          setFailedMobile(previous => previous.includes(current.mobile!) ? previous : [...previous, current.mobile!]);
          if (transitionLock.current) {
            transitionLock.current = false;
            setPreloading(false);
            setFlight(null);
            setFlightReady(false);
            setTransitioning(false);
            thumbnailPositions.current = null;
          }
          return;
        }
        if (transitionLock.current) {
          setFlight(null);
          setFlightReady(false);
          transitionLock.current = false;
          setPreloading(false);
          setTransitioning(false);
          thumbnailPositions.current = null;
        }
        setFailed(previous => previous.includes(current.image) ? previous : [...previous, current.image]);
        onImageUnavailable?.(current.image);
      }} />
  </picture>;

  return <section ref={root} className={`${styles.hero}${variant === 'home' ? ` ${styles.homeVariant}` : ''}${variant === 'school' ? ` ${styles.schoolVariant}` : ''}${variant === 'news' ? ` ${styles.newsVariant}` : ''} ${className}`} style={{ '--hero-aspect': variant === 'home' ? aspectRatio || '1920 / 708' : aspectRatio || '1920 / 680' } as CSSProperties} aria-label={label} aria-roledescription={available.length > 1 ? 'carousel' : undefined}
    onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}
    onFocusCapture={() => setHeld(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeld(false); }}>
    <div className={`${styles.stage}${hasCaption ? ` ${styles.hasCaption}` : ''}${transitioning ? ` ${styles.transitioning}` : ''}`} aria-busy={preloading || transitioning}>
      <div ref={media} className={styles.media}>
        {variant === 'home' ? <>
          <div className={styles.homeCards} aria-label="Homepage slides">
            {available.map((slide, slideIndex) => <button key={slide.image} ref={node => {
              if (node) homeCards.current.set(slide.image, node);
              else homeCards.current.delete(slide.image);
            }} className={styles.homeCard} type="button" data-slide-index={slideIndex}
              disabled={preloading || transitioning || slideIndex === index}
              aria-label={`${slideIndex === index ? 'Current slide' : `Show slide ${slideIndex + 1}`}: ${slide.alt || label}`}
              aria-current={slideIndex === index ? 'true' : undefined} onClick={() => select(slideIndex)}>
              <picture>
                {slide.mobile && !failedMobile.includes(slide.mobile) && <source media="(max-width: 700px)" srcSet={slide.mobile} />}
                <img ref={slideIndex === index ? image : undefined} src={slide.image} alt="" loading={slideIndex === index ? 'eager' : 'lazy'}
                  onLoad={event => {
                    if (slideIndex === index && event.currentTarget.naturalWidth && event.currentTarget.naturalHeight) {
                      const source = event.currentTarget.currentSrc || event.currentTarget.src;
                      if (ratioSource.current !== source) {
                        ratioSource.current = source;
                        onImageRatio?.(`${event.currentTarget.naturalWidth} / ${event.currentTarget.naturalHeight}`);
                      }
                    }
                  }}
                  onError={event => {
                    const failedImage = event.currentTarget.currentSrc || slide.image;
                    if (slide.mobile && failedImage === slide.mobile) {
                      setFailedMobile(previous => previous.includes(slide.mobile!) ? previous : [...previous, slide.mobile!]);
                      return;
                    }
                    setFailed(previous => previous.includes(slide.image) ? previous : [...previous, slide.image]);
                    onImageUnavailable?.(slide.image);
                    transitionLock.current = false;
                  }} />
              </picture>
              {slideIndex !== index && slide.caption && <span className={styles.homeCardCaption} aria-hidden="true">{slide.caption}</span>}
            </button>)}
          </div>
          {(title || eyebrow || description || current.caption) && <div ref={homeDetails} className={styles.homeDetails} aria-live="polite">
            <span className={styles.homeDetailsRule} aria-hidden="true" />
            {eyebrow && <p className={styles.homeEyebrow}>{eyebrow}</p>}
            {title && <h1>{title}</h1>}
            {description ? <div className={styles.homeDescription}>{description}</div> : current.caption && <p className={styles.homeDescription}>{current.caption}</p>}
          </div>}
          {available.length > 1 && <div ref={homePagination} className={styles.homePagination}>
            <button type="button" disabled={preloading || transitioning} aria-label={`Previous ${label}`} onClick={() => select((index + available.length - 1) % available.length)}>‹</button>
            <button type="button" disabled={preloading || transitioning} aria-label={`Next ${label}`} onClick={() => select((index + 1) % available.length)}>›</button>
            <div className={styles.homeProgress} role="group" aria-label={`${label} slides`}>
              <span style={{ width: `${((index + 1) / available.length) * 100}%` }} />
              {available.map((slide, slideIndex) => <button key={`${slide.image}-progress`} type="button" aria-label={`Go to slide ${slideIndex + 1}`}
                aria-current={slideIndex === index ? 'true' : undefined} onClick={() => select(slideIndex)}
                style={{ left: `${(slideIndex / available.length) * 100}%`, width: `${100 / available.length}%` }} />)}
            </div>
            <span className={styles.homeCount} aria-label={`Slide ${index + 1} of ${available.length}`}>{index + 1}</span>
          </div>}
          <div ref={homeIndicator} className={styles.homeIndicator} aria-hidden="true" />
        </> : <>
          {flight && <img ref={outgoingImage} className={styles.outgoingImage} src={flight.previous} alt="" aria-hidden="true" />}
          {flight?.start && <img ref={flightImage} className={styles.flightImage} src={flight.source} alt="" aria-hidden="true" onLoad={() => setFlightReady(true)} onError={() => {
            setFlight(previous => previous ? { ...previous, start: undefined } : previous);
            setFlightReady(true);
          }} style={{
            left: `${flight.start.left}px`,
            top: `${flight.start.top}px`,
            width: `${flight.start.width}px`,
            height: `${flight.start.height}px`,
            borderRadius: flight.start.borderRadius,
            objectFit: flight.start.objectFit as CSSProperties['objectFit'],
            objectPosition: flight.start.objectPosition,
          }} />}
          {current.href ? <a className={styles.heroLink} href={current.href} aria-label={current.alt || label}>{content}</a>
            : onActivateHero ? <button ref={onHeroButtonRef} className={styles.heroButton} type="button" onClick={() => onActivateHero(current)} aria-label={`Enlarge image: ${title || label}`}>{content}</button>
              : content}
          {thumbnailIndices.length > 0 && <div className={styles.thumbnails} aria-label="Upcoming slides">
            {thumbnailIndices.map(slideIndex => {
              const slide = available[slideIndex];
              return <button key={`${slide.image}-${slideIndex}`} type="button" data-slide-index={slideIndex} disabled={preloading || transitioning} aria-label={`Show slide ${slideIndex + 1}: ${slide.alt || label}`}
                aria-current={slideIndex === index ? 'true' : undefined}
                onClick={event => select(slideIndex, event.currentTarget)}>
                <picture>
                  {slide.mobile && <source media="(max-width: 700px)" srcSet={slide.mobile} />}
                  <img src={slide.image} alt="" loading="lazy" />
                </picture>
              </button>;
            })}
          </div>}
          {available.length > 1 && <div className={styles.controls}>
            <button type="button" disabled={preloading || transitioning} aria-label={`Previous ${label}`} onClick={() => select((index + available.length - 1) % available.length)}>‹</button>
            <button type="button" disabled={preloading || transitioning} aria-label={`Next ${label}`} onClick={() => select((index + 1) % available.length)}>›</button>
            <span className={styles.progress} role="group" aria-label={`${label} slides`}>
              {available.map((slide, slideIndex) => <button key={`${slide.image}-progress`} type="button" disabled={preloading || transitioning} aria-label={`Go to slide ${slideIndex + 1}`}
                aria-current={slideIndex === index ? 'true' : undefined} onClick={() => select(slideIndex)}>
                <span className={slideIndex === index && !held && !paused && !preloading && !transitioning && !reducedMotion ? styles.progressActive : undefined} style={{ animationDuration: `${interval}ms` }} />
              </button>)}
            </span>
            <span className={styles.count} aria-live="polite">{String(index + 1).padStart(2, '0')} / {String(available.length).padStart(2, '0')}</span>
          </div>}
        </>}
      </div>
      {variant !== 'school' && variant !== 'home' && hasCaption && <div className={styles.caption}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        {date && <p className={styles.date}>{date}</p>}
        {title && <h1>{title}</h1>}
        {description && <div className={styles.description}>{description}</div>}
        {current.caption && <p className={styles.slideCaption}>{current.caption}</p>}
      </div>}
    </div>
  </section>;
}
