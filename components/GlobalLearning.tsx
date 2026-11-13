'use client';
import ExpandableText from './ExpandableText';
import { apiPlain } from './dgu-content-api';
import { academicBody } from './academic-html';

import { resolveSiteHref } from './site-routes';

import { useEffect, useId, useRef, useState } from 'react';
import AutoSlider from './AutoSlider';
import InternationalCountryMap from './InternationalCountryMap';
import { requestInternationalContent, type InternationalPartner } from './international-page-data';

const styles = {
  section: 'global-learning-section', top: 'global-learning-top', copy: 'global-learning-copy',
  heading: 'global-learning-heading', tagline: 'global-learning-tagline',
  description: 'global-learning-description', extraDescription: 'global-learning-extra-description',
  map: 'global-learning-map',
  continents: 'global-learning-continents', pin: 'global-learning-pin',
  pinOne: 'global-learning-pin-one', pinTwo: 'global-learning-pin-two',
  pinThree: 'global-learning-pin-three', pinFour: 'global-learning-pin-four',
  pinFive: 'global-learning-pin-five', gallery: 'global-learning-gallery',
  photo: 'global-learning-photo', controls: 'global-learning-controls',
  partners: 'global-learning-partners', partner: 'global-learning-partner',
  bottomRule: 'global-learning-bottom-rule',
};

export type GlobalLearningPhoto = { src: string; alt: string };
export type GlobalLearningPartner = { name: string; logo?: string; href?: string };

export type GlobalLearningProps = {
  heading?: string;
  subtitle?: string;
  description?: string;
  expandedDescription?: string;
  photos?: GlobalLearningPhoto[];
  partners?: GlobalLearningPartner[];
  className?: string;
  paused?: boolean;
  contentHtml?: string;
  apiOnly?: boolean;
};

// The image folder is at the domain root, outside /.
const INTERNATIONAL_IMAGE_FOLDER = 'https://dgu.ac.in/images/university-logo/';

const defaultPhotos: GlobalLearningPhoto[] = Array.from({ length: 14 }, (_, index) => ({
  src: `${INTERNATIONAL_IMAGE_FOLDER}abroad-pathways${index + 1}.webp`,
  alt: `International learning experience ${index + 1}`,
}));

const defaultPartners: GlobalLearningPartner[] = Array.from({ length: 40 }, (_, index) => ({
  name: `International partner ${index + 1}`,
  logo: `${INTERNATIONAL_IMAGE_FOLDER}logo${index + 1}.${index === 39 ? 'jpg' : 'webp'}`,
}));

/** Direct image URLs: no PHP/API request is needed for this section. */
export default function GlobalLearning({
  heading = 'Global Learning',
  subtitle: suppliedSubtitle,
  description: suppliedDescription,
  expandedDescription: suppliedExpandedDescription,
  photos: suppliedPhotos,
  partners: suppliedPartners,
  className = '',
  paused: pagePaused = false,
  contentHtml,
  apiOnly = false,
}: GlobalLearningProps) {
  const subtitle = suppliedSubtitle ?? (apiOnly ? '' : '& Study Abroad Pathways');
  const description = suppliedDescription ?? (apiOnly ? '' : 'DBS Global University provides students with a wide range of opportunities to gain international exposure.');
  const expandedDescription = suppliedExpandedDescription ?? (apiOnly ? '' : 'Global immersion, semester abroad and international academic partnerships help students connect classroom learning with the wider world.');
  const photos = suppliedPhotos ?? (apiOnly ? [] : defaultPhotos);
  const partners = suppliedPartners ?? (apiOnly ? [] : defaultPartners);
  const instanceId = useId();
  const [active, setActive] = useState(Math.floor(photos.length / 2));
  const mapRef = useRef<HTMLElement>(null);
  const [sectionVisible, setSectionVisible] = useState(false);
  const [mapPartners, setMapPartners] = useState<InternationalPartner[]>([]);

  // Use the same country-tagged partner records as Office of International Affairs,
  // so the shared map's hover popup displays the same logos on the homepage.
  useEffect(() => {
    // The homepage's gallery partner list is not country-tagged. The map needs
    // the International page's parsed records (country + exact logo URL), so
    // fetch that shared source independently even when gallery props are supplied.
    const controller = new AbortController();
    requestInternationalContent(controller.signal)
      .then(content => {
        if (!controller.signal.aborted) setMapPartners(content.partners);
      })
      .catch(() => {
        if (!controller.signal.aborted) setMapPartners([]);
      });
    return () => controller.abort();
  }, []);
  const count = photos.length;
  const activeIndex = count ? active % count : 0;
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const pointerStart = useRef<{ id: number; x: number; y: number } | null>(null);
  const suppressClickUntil = useRef(0);
  const move = (direction: number) => {
    if (count > 1) setActive(previous => (previous + direction + count) % count);
  };

  const finishDrag = (id: number, x: number, y: number) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || start.id !== id) return;
    const dx = x - start.x;
    const dy = y - start.y;
    if (Math.abs(dx) < 35 || Math.abs(dx) < Math.abs(dy) * 1.15) return;
    suppressClickUntil.current = Date.now() + 500;
    move(dx < 0 ? 1 : -1);
  };

  useEffect(() => {
    if (count < 2 || pagePaused || paused || focused || !sectionVisible) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer: ReturnType<typeof setInterval> | undefined;
    const restart = () => {
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
      if (document.hidden || motion.matches) return;
      timer = setInterval(() => setActive(previous => (previous + 1) % count), 3500);
    };
    restart();
    document.addEventListener('visibilitychange', restart);
    motion.addEventListener('change', restart);
    return () => {
      if (timer !== undefined) clearInterval(timer);
      document.removeEventListener('visibilitychange', restart);
      motion.removeEventListener('change', restart);
    };
  }, [count, pagePaused, paused, focused, sectionVisible]);

  useEffect(() => {
    const section = mapRef.current;
    if (!section) return;
    if (!('IntersectionObserver' in window)) {
      setSectionVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      setSectionVisible(entry.isIntersecting);
    }, { threshold: 0.2, rootMargin: '0px 0px -5% 0px' });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);



  return (
    <section ref={mapRef} className={`${styles.section} ${className}`} aria-labelledby={`${instanceId}-heading`}>
      <div className={styles.top}>
        <div className={styles.copy}>
          <h2 id={`${instanceId}-heading`} className={styles.heading}>
            <strong>{heading}</strong><span>{subtitle}</span>
          </h2>
          {!apiOnly && <p className={styles.tagline}>International Opportunities for Global Career Readiness</p>}
          {contentHtml ? <ExpandableText key={contentHtml} text={apiPlain(academicBody(contentHtml,heading))} html={academicBody(contentHtml,heading)} className={styles.description} previewWords={65} /> : <ExpandableText key={description+expandedDescription} text={[description,expandedDescription].filter(Boolean).join(' ')} className={styles.description} previewWords={65} />}
        </div>
        <div className={styles.map}>
          <InternationalCountryMap partners={mapPartners} />
        </div>
      </div>

      {count > 0 && <div className={styles.gallery} role="region" aria-roledescription="carousel" aria-label="International learning photo gallery"
        onPointerDown={event => {
          if (event.button !== 0 || (event.target as HTMLElement).closest(`.${styles.controls}`)) return;
          pointerStart.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        }}
        onPointerUp={event => finishDrag(event.pointerId, event.clientX, event.clientY)}
        onPointerCancel={() => { pointerStart.current = null; }}
        onDragStart={event => event.preventDefault()}
        onClickCapture={event => {
          if (Date.now() < suppressClickUntil.current) {
            event.preventDefault();
            event.stopPropagation();
            suppressClickUntil.current = 0;
          }
        }}
        onFocusCapture={event => { if ((event.target as HTMLElement).matches(':focus-visible')) setFocused(true); }}
        onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}
      >
        {photos.map((photo, index) => {
          const offset = (index - activeIndex + count) % count;
          const position = offset > Math.floor(count / 2) ? offset - count : offset;
          return <button
            className={styles.photo}
            type="button"
            key={`${photo.src}-${index}`}
            data-position={Math.max(-2, Math.min(2, position))}
            data-hidden={Math.abs(position) > 2}
            onClick={() => setActive(index)}
            aria-label={`Show photo ${index + 1}: ${photo.alt}`}
            aria-current={index === activeIndex ? 'true' : undefined}
            tabIndex={Math.abs(position) > 2 ? -1 : 0}
          ><img src={photo.src} alt={photo.alt} loading="lazy" draggable={false} /></button>;
        })}
        {count > 1 && <div className={styles.controls}>
          <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Resume automatic slideshow' : 'Pause automatic slideshow'} aria-pressed={paused}>{paused ? '▶' : 'Ⅱ'}</button>
        </div>}
      </div>}

      {partners.length > 0 && <AutoSlider className={`${styles.partners} global-learning-partners-marquee`} label="International partner universities" duration={Math.max(30, partners.length * 3.6)} continuousOnMobile>
        {partners.map((partner, index) => {
          const content = partner.logo
            ? <img src={partner.logo} alt={partner.name} loading="lazy" onError={event => {
                const image = event.currentTarget;
                if (apiOnly) { image.hidden = true; return; }
                if (image.dataset.extensionRetried === 'true') return;
                image.dataset.extensionRetried = 'true';
                image.src = /\.webp(?:\?.*)?$/i.test(partner.logo || '')
                  ? (partner.logo || '').replace(/\.webp(?=\?|$)/i, '.jpg')
                  : (partner.logo || '').replace(/\.jpe?g(?=\?|$)/i, '.webp');
              }} />
            : <span>{partner.name}</span>;
          return partner.href
            ? <a key={`${partner.name}-${index}`} href={resolveSiteHref(partner.href, partner.name)} className={styles.partner}>{content}</a>
            : <div key={`${partner.name}-${index}`} className={styles.partner}>{content}</div>;
        })}
      </AutoSlider>}
      <div className={styles.bottomRule} aria-hidden="true" />
      <style jsx global>{`
        .global-learning-section .global-learning-tagline,
        .global-learning-section .global-learning-description,
        .global-learning-section .global-learning-extra-description {
          font-family: inherit;
          font-size: clamp(16px, 1.1vw, 19px);
          font-weight: 400;
          line-height: 1.55;
          color: #625e68;
          letter-spacing: 0 !important;
          text-align: justify;
          text-align-last: left;
          margin: 0 0 18px;
        }
        .global-learning-section .global-learning-map {
          pointer-events: auto;
          left: 35%;
          right: 0;
          width: 65%;
        }
        @media (min-width: 901px) {
          .global-learning-section .global-learning-top { grid-template-columns: 35% 65%; }
          .global-learning-section .global-learning-pin { width: clamp(30px, 3.6vw, 64px); }
        }
        .global-learning-section .global-learning-continents { display: block; width: 100%; height: 100%; }
        .global-learning-section .global-learning-photo {
          transition: transform .7s ease, width .7s ease, height .7s ease,
            bottom .7s ease, opacity .5s ease;
        }
        .global-learning-section .global-learning-photo[data-position='0'] {
          --photo-lift: clamp(24px, 2.1vw, 34px);
          bottom: var(--photo-lift);
          height: calc(100% - var(--photo-lift));
        }
        .global-learning-section .global-learning-photo[data-position='-1'],
        .global-learning-section .global-learning-photo[data-position='1'] {
          bottom: 8px;
        }
        @media (max-width: 600px) {
          .global-learning-section .global-learning-photo[data-position='0'] {
            --photo-lift: 16px;
          }
          .global-learning-section .global-learning-photo[data-position='-1'],
          .global-learning-section .global-learning-photo[data-position='1'] {
            bottom: 4px;
          }
        }
        .global-learning-section .global-learning-pin { color: var(--pin-color); background: currentColor; }
        .global-learning-section .global-learning-pin-one { --pin-color: #ffafc1; --hop-delay: 0s; }
        .global-learning-section .global-learning-pin-two { --pin-color: #ffdbab; --hop-delay: .35s; }
        .global-learning-section .global-learning-pin-three { --pin-color: #c5b9ee; --hop-delay: .7s; }
        .global-learning-section .global-learning-pin-four { --pin-color: #dfb3f5; --hop-delay: 1.05s; }
        .global-learning-section .global-learning-pin-five { --pin-color: #83a7ef; --hop-delay: 1.4s; }
        .global-learning-section .global-learning-pin::before {
          content: '';
          position: absolute;
          left: -13%;
          bottom: -15%;
          width: 80%;
          height: 80%;
          border: 2px solid currentColor;
          border-radius: 50%;
          opacity: 0;
          transform: rotate(45deg) scale(.3, .15);
          pointer-events: none;
        }
        .global-learning-section:not(.is-map-visible) .global-learning-pin { opacity: 0; }
        .global-learning-section.is-map-visible .global-learning-pin {
          animation: global-pin-enter .45s ease-out both,
            global-pin-hop 2.6s ease-in-out calc(6.8s + var(--hop-delay)) infinite;
          animation-delay: var(--entrance-delay), calc(6.8s + var(--hop-delay));
        }
        .global-learning-section.is-map-visible .global-learning-pin::before {
          animation: global-pin-ring 2.6s ease-out calc(6.8s + var(--hop-delay)) infinite;
        }
        .global-learning-section .global-learning-pin-one { --entrance-delay: .5s; }
        .global-learning-section .global-learning-pin-two { --entrance-delay: 1s; }
        .global-learning-section .global-learning-pin-three { --entrance-delay: 1.4s; }
        .global-learning-section .global-learning-pin-four { --entrance-delay: 2s; }
        .global-learning-section .global-learning-pin-five { --entrance-delay: 2.4s; }
        @keyframes global-pin-enter { from { opacity: 0; scale: .65; } to { opacity: 1; scale: 1; } }
        @keyframes global-pin-hop {
          0%, 12%, 75%, 100% { transform: translate(-50%, -100%) rotate(-45deg); }
          38% { transform: translate(-50%, -145%) rotate(-45deg); }
        }
        @keyframes global-pin-ring {
          0%, 65%, 100% { opacity: 0; transform: rotate(45deg) scale(.3, .15); }
          75% { opacity: .8; transform: rotate(45deg) scale(.8, .32); }
          95% { opacity: 0; transform: rotate(45deg) scale(1.8, .65); }
        }
        @media (max-width: 900px) and (min-width: 601px) {
          .global-learning-section .global-learning-map { left: 47%; width: 53%; }
        }
        @media (max-width: 600px) {
          .global-learning-section .global-learning-map {
            position: relative;
            top: auto;
            left: auto;
            right: auto;
            width: 100%;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .global-learning-section.is-map-visible .global-learning-pin,
          .global-learning-section.is-map-visible .global-learning-pin::before { animation: none; }
          .global-learning-section .global-learning-pin { opacity: 1; }
        }
      `}</style>
    </section>
  );
}
