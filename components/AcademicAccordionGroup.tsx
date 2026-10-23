'use client';

import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import ApiRichText from './ApiRichText';
import AutoSlider from './AutoSlider';
import { academicImageSource } from './academic-media';
import { apiPlain } from './dgu-content-api';
import { refreshLayout } from './refreshLayout';

const trackSelector = '[class*="track"],[class*="slider"],.swiper-wrapper,.owl-stage,.dgu-gx__media';
const cardSelector = '.slide,.swiper-slide,.slick-slide,.owl-item,figure,[class*="profile-card"],[class*="student-card"],a';

/** Replace CMS carousel markup in place; surrounding copy and links keep their order. */
function renderCarousel(element: Element, key: string): ReactNode | undefined {
  if (!element.matches(trackSelector) || !element.querySelector('img')) return undefined;
  // Leave outer wrappers intact when a more specific track handles the cards.
  if (Array.from(element.querySelectorAll(trackSelector)).some(node => node.querySelector('img'))) return undefined;
  const remaining = element.cloneNode(true) as Element;
  const candidates = new Set<Element>();
  for (const image of remaining.querySelectorAll('img')) {
    const card = image.closest(cardSelector);
    candidates.add(card && card !== remaining && remaining.contains(card) ? card : image);
  }
  const cards: { key: string; html: string }[] = [], seen = new Set<string>();
  for (const card of candidates) {
    const images = card.matches('img') ? [card] : Array.from(card.querySelectorAll('img'));
    const sources = images.map(academicImageSource).filter(Boolean);
    if (!sources.length) continue;
    const links = card.matches('a') ? [card] : Array.from(card.querySelectorAll('a'));
    const signature = JSON.stringify([sources, apiPlain(card.outerHTML), links.map(link => link.getAttribute('href'))]);
    if (!seen.has(signature)) { seen.add(signature); cards.push({ key: signature, html: card.outerHTML }); }
    card.remove();
  }
  if (!cards.length) return undefined;
  const profiles = cards.map(card => <figure className="academic-accordion-profile" key={card.key}><ApiRichText html={card.html} /></figure>);
  return <Fragment key={key}>
    {(apiPlain(remaining.innerHTML) || remaining.querySelector('img,table')) && <ApiRichText html={remaining.innerHTML} scrollTables />}
    {cards.length > 1
      ? <AutoSlider className="academic-accordion-profiles" label="Programme profiles" duration={30} continuousOnMobile>{profiles}</AutoSlider>
      : <div className="academic-accordion-profiles academic-accordion-profiles--single">{profiles}</div>}
  </Fragment>;
}

export function AcademicAccordionCopy({ html }: { html: string }) {
  return <ApiRichText html={html} scrollTables renderElement={renderCarousel} />;
}

/** Two headings per desktop row; one selected panel spans the whole row. */
export default function AcademicAccordionGroup({ items, id }: {
  items: readonly { title: ReactNode; content: ReactNode }[]; id: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = new ResizeObserver(refreshLayout);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  if (!items.length) return null;
  return <div className="program-industry-grid academic-accordion-grid" ref={root}>
    {items.map((item, index) => {
      const active = open === index;
      const style = { '--accordion-row': Math.floor(index / 2) } as CSSProperties;
      return <Fragment key={index}>
        <h3 className="program-industry-card academic-accordion-heading" style={style}>
          <button type="button" id={`${id}-${index}`} aria-expanded={active} aria-controls={`${id}-${index}-panel`} onClick={() => setOpen(current => current === index ? null : index)}>
            <span>{item.title}</span><span className="program-industry-arrow" aria-hidden="true">›</span>
          </button>
        </h3>
        <div className="program-industry-card program-industry-copy academic-accordion-panel" id={`${id}-${index}-panel`} role="region" aria-labelledby={`${id}-${index}`} hidden={!active} style={style}>
          {item.content}
        </div>
      </Fragment>;
    })}
  </div>;
}
