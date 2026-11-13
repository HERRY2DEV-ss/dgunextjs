'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NewsItem, NewsTab } from './news-api';
import { newsItemHref } from './news-routes';

type Props = { items: NewsItem[]; tab: NewsTab; categoryLabel: string };

export default function TimedNewsCarousel({ items, tab, categoryLabel }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const active = items[activeIndex];

  const itemsKey = items.map(item => item.id).join('|');

  useEffect(() => {
    setActiveIndex(0);
    setFailedImages([]);
  }, [itemsKey, tab]);

  const goTo = useCallback((index: number) => {
    if (!items.length) return;
    setActiveIndex((index + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const timer = window.setTimeout(() => goTo(activeIndex + 1), 7200);
    return () => window.clearTimeout(timer);
  }, [activeIndex, goTo, items.length, paused]);

  const upcoming = useMemo(() => {
    if (items.length < 2) return [];
    const count = Math.min(3, items.length - 1);
    return Array.from({ length: count }, (_, offset) => {
      const index = (activeIndex + offset + 1) % items.length;
      return { item: items[index], index };
    });
  }, [activeIndex, items]);

  if (!active) return null;
  const image = active.image && !failedImages.includes(active.image) ? active.image : '';
  const href = newsItemHref(active.href, tab);

  return (
    <section
      className="timed-news-carousel"
      aria-label={`${categoryLabel} stories`}
      aria-roledescription="carousel"
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div className="timed-news-backdrop" key={active.id}>
        {image
          ? <img src={image} alt="" aria-hidden="true" onError={() => setFailedImages(previous => previous.includes(active.image) ? previous : [...previous, active.image])} />
          : <div className="timed-news-backdrop-placeholder" aria-hidden="true"><span>DGU</span></div>}
      </div>
      <div className="timed-news-shade" aria-hidden="true" />
      <div className="timed-news-content" key={`copy-${active.id}`}>
        <p className="timed-news-kicker"><span />{categoryLabel}{active.date && <><span className="timed-news-separator">/</span><time>{active.date}</time></>}</p>
        <h2>{active.title}</h2>
        {active.text && <p className="timed-news-description">{active.text}</p>}
        <a className="timed-news-cta" href={href}>Read story <span aria-hidden="true">↗</span></a>
      </div>
      {upcoming.length > 0 && <div className="timed-news-upcoming" aria-label="Upcoming stories">
        {upcoming.map(({ item, index }) => <button key={item.id} type="button" className="timed-news-thumb" onClick={() => goTo(index)} aria-label={`Show story: ${item.title}`}>
          {item.image && !failedImages.includes(item.image)
            ? <img src={item.image} alt="" loading="lazy" onError={() => setFailedImages(previous => previous.includes(item.image) ? previous : [...previous, item.image])} />
            : <span className="timed-news-thumb-placeholder">DGU</span>}
          <span className="timed-news-thumb-caption"><small>{item.date || categoryLabel}</small><strong>{item.title}</strong></span>
        </button>)}
      </div>}
      <div className="timed-news-controls">
        <button type="button" className="timed-news-arrow" onClick={() => goTo(activeIndex - 1)} aria-label="Previous story" disabled={items.length < 2}>‹</button>
        <button type="button" className="timed-news-arrow" onClick={() => goTo(activeIndex + 1)} aria-label="Next story" disabled={items.length < 2}>›</button>
        <span className="timed-news-progress" aria-hidden="true"><span key={`progress-${activeIndex}-${paused}`} className={paused ? 'is-paused' : ''} /></span>
        <span className="timed-news-count" aria-live="polite">{String(activeIndex + 1).padStart(2, '0')} <i>/</i> {String(items.length).padStart(2, '0')}</span>
      </div>
    </section>
  );
}
