'use client';
import { resolveSiteHref } from './site-routes';

import { useEffect, useId, useRef, useState } from 'react';

export type ProgramCardItem = {
  name: string;
  href?: string;
  note?: string;
  eyebrow?: string;
};

type ProgramCardProps = {
  title: string;
  items: ProgramCardItem[];
  animationIndex?: number;
  viewMoreHref?: string;
  variant?: 'default' | 'specialization';
  expandableItems?: boolean;
};

/** Shared by homepage School cards and every dynamic School page. */
export default function ProgramCard({
  title,
  items,
  animationIndex = 0,
  viewMoreHref,
  variant = 'default',
  expandableItems = false,

}: ProgramCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const panelId = useId();
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(max-width:600px)');
    const sync = () => setMobile(media.matches);
    sync(); media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
    ) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <article ref={cardRef} className={`program-card${variant === 'specialization' ? ' program-card--specialization' : ''}${open ? ' is-open' : ''}`}>
      <div
        className={`program-card-inner program-enter-${animationIndex % 2 === 0 ? 'left' : 'right'}${visible ? ' is-visible' : ''}`}
        style={{ transitionDelay: `${(animationIndex % 4) * 90}ms` }}
      >
        {variant !== 'specialization' && <h2>
          {viewMoreHref ? (
            <>
              <a className="program-school-heading-link" href={resolveSiteHref(viewMoreHref, title)}>
                <span>{title}</span>
                <span className="program-school-heading-arrow" aria-hidden="true">↗</span>
              </a>
              <button
                className="program-school-accordion-toggle"
                type="button"
                aria-label={`${open ? 'Hide' : 'Show'} ${title} programs`}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpen(value => !value)}
              >
                <span className="program-accordion-icon" aria-hidden="true">↗</span>
              </button>
            </>
          ) : (
            <button
              className="program-accordion-button"
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen(value => !value)}
            >
              <span>{title}</span>
              <span className="program-accordion-icon" aria-hidden="true">↗</span>
            </button>
          )}
        </h2>}

        <div className="program-accordion-content" id={panelId} inert={mobile && !open && variant !== 'specialization'}>
          <div className="program-list">
            {(expandableItems && !showAll ? items.slice(0, 4) : items).map((item, index) => {
              const content = <>
                <span className="program-name">
                  {item.eyebrow && <span className="program-item-eyebrow">{item.eyebrow}</span>}
                  <strong>{item.name}{item.note && <small>{item.note}</small>}</strong>
                </span>
                <span className="program-arrow" aria-hidden="true">›</span>
              </>;
              return item.href
                ? <a className="program-item" href={resolveSiteHref(item.href, item.name)} key={`${item.name}-${index}`}>{content}</a>
                : <div className="program-item" key={`${item.name}-${index}`}>{content}</div>;
            })}
          </div>

          {expandableItems && items.length > 4 && <button className="text-link" type="button" aria-expanded={showAll} onClick={() => setShowAll(value => !value)}>{showAll ? 'Show fewer programs' : `Show all ${items.length} programs`}</button>}
          {expandableItems && items.length === 0 && <p>No programs available.</p>}
          {viewMoreHref && (
            <a className="program-more" href={resolveSiteHref(viewMoreHref, title)}>View More <span aria-hidden="true">↗</span></a>
          )}
        </div>
      </div>
    </article>
  );
}
