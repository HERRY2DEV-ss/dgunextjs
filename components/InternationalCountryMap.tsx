'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import DottedWorldMap from './DottedWorldMap';
import type { InternationalPartner } from './international-page-data';
import styles from './InternationalCountryMap.module.css';

// Positions on the existing 510 × 225 dot geometry, not a new map projection.
const positions: Record<string, readonly [number, number]> = {
  'United States': [18, 40], Norway: [50.5, 23], Turkey: [55.5, 40], Georgia: [58.5, 35],
  Kazakhstan: [66.5, 33], Uzbekistan: [64, 43], Russia: [72, 22], Thailand: [79, 43], Malaysia: [81, 57],
  Indonesia: [86, 65], Australia: [91, 80],
};

export default function InternationalCountryMap({ partners, showAllCountries = false }: { partners: InternationalPartner[]; showAllCountries?: boolean }) {
  const countries = showAllCountries ? Object.keys(positions) : Object.keys(positions).filter(country => partners.some(partner => partner.country === country));
  const [active, setActive] = useState<string | null>(null), [popupStyle, setPopupStyle] = useState<CSSProperties>({});
  const map = useRef<HTMLDivElement>(null), popup = useRef<HTMLElement>(null), closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  const cancelClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); closeTimer.current = null; };
  const show = (country: string) => { cancelClose(); setActive(country); };
  const closeSoon = () => { cancelClose(); closeTimer.current = setTimeout(() => setActive(null), 240); };
  useEffect(() => () => cancelClose(), []);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (map.current && !map.current.contains(event.target as Node)) { cancelClose(); setActive(null); } };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { cancelClose(); setActive(null); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, []);

  useLayoutEffect(() => {
    if (!active || !map.current || !popup.current) return;
    const position = () => {
      const container = map.current!, card = popup.current!, [x, y] = positions[active];
      if (matchMedia('(max-width:600px)').matches) { setPopupStyle({}); return; }
      const width = container.clientWidth, height = container.querySelector<HTMLDivElement>('[data-map-surface]')?.clientHeight || container.clientHeight;
      const dotX = width * x / 100, dotY = height * y / 100;
      let left = Math.max(8, Math.min(width - card.offsetWidth - 8, dotX - card.offsetWidth / 2));
      let top: number;
      if (height - dotY - 20 >= card.offsetHeight) top = dotY + 20;
      else if (dotY - 20 >= card.offsetHeight) top = dotY - card.offsetHeight - 20;
      else {
        // A long logo list must not cover its own hovered dot and flicker closed.
        left = dotX >= width / 2 ? dotX - card.offsetWidth - 22 : dotX + 22;
        left = Math.max(8, Math.min(width - card.offsetWidth - 8, left));
        top = Math.max(0, Math.min(height - card.offsetHeight, dotY - card.offsetHeight / 2));
      }
      setPopupStyle({ left, top });
    };
    position(); const observer = new ResizeObserver(position); observer.observe(map.current); observer.observe(popup.current);
    return () => observer.disconnect();
  }, [active]);

  return <div ref={map} className={styles.root} aria-label="Partner universities by country"
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) closeSoon(); }}>
    <div className={styles.surface} data-map-surface>
      <DottedWorldMap className={styles.earth} color="#c5d3da" />
      {countries.map(country => {
        const [x, y] = positions[country], selected = active === country;
        return <button type="button" key={country} className={`${styles.dot} ${selected ? styles.selected : ''}`}
          style={{ left: `${x}%`, top: `${y}%` }} data-country={country} title={country} aria-label={`Show partner logos in ${country}`} aria-expanded={selected} aria-controls={selected ? `${id}-partners` : undefined}
          onMouseEnter={() => show(country)} onMouseLeave={closeSoon}
          onFocus={event => { if (event.currentTarget.matches(':focus-visible')) show(country); }} onClick={() => { cancelClose(); setActive(previous => previous === country ? null : country); }}>
          <span aria-hidden="true" />
        </button>;
      })}
    </div>
    <div className={styles.countries} aria-label="Select a partner country">
      {countries.map(country => <button key={country} type="button" aria-pressed={active === country} onClick={() => { cancelClose(); setActive(previous => previous === country ? null : country); }}>{country}</button>)}
    </div>
    {active && <aside ref={popup} className={styles.popup} style={popupStyle} id={`${id}-partners`} aria-label={`${active} partner universities`}
      onPointerEnter={cancelClose} onPointerLeave={event => { if (event.pointerType === 'mouse') closeSoon(); }} onFocus={cancelClose}>
      <div className={styles.popupHeader}><strong>{active}</strong><button type="button" aria-label="Close country logos" onClick={() => { cancelClose(); setActive(null); }}>×</button></div>
      <div className={styles.logoGrid} data-lenis-prevent="true">{partners.filter(partner => partner.country === active).map((partner, index) => <figure key={`${partner.src}-${index}`}>
        <img src={partner.src} alt={partner.name} loading="eager" onError={event => { event.currentTarget.hidden = true; }} />
        {partner.name && <figcaption>{partner.name}</figcaption>}
      </figure>)}</div>
    </aside>}
    <p className={styles.hint}>Hover over a red dot to explore our partner universities.<span>Tap a dot or select a country to explore its partners.</span></p>
  </div>;
}
