'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import StepSlider from './StepSlider';
import './internal-pages.css';
import './internal-pages-responsive.css';
import { usePageMenuOpen } from './LocalPageShell';
export type GalleryPhoto = { src: string; alt: string };

export default function LocalGallery({ title, photos }: { title: string; photos: GalleryPhoto[] }) {
  const menuOpen = usePageMenuOpen();
  const [paused, setPaused] = useState(false);
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => { if (!open) return; const previous = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = previous; }; }, [open]);
  const close = () => { dialog.current?.close(); setOpen(false); trigger.current?.focus(); };
  const move = (step: number) => setSelected(index => (index + step + photos.length) % photos.length);
  const keys = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); }
  };
  const cards = photos.map((photo, index) => <button type="button" key={`${photo.src}-${index}`} className="local-gallery-photo" aria-haspopup="dialog" aria-label={`Enlarge ${photo.alt || title}, photograph ${index + 1}`} onClick={event => { trigger.current = event.currentTarget; setSelected(index); setOpen(true); dialog.current?.showModal(); }}>
      <img src={photo.src} alt={photo.alt || `${title} photograph ${index + 1}`} loading={index < 3 ? 'eager' : 'lazy'} decoding="async" /><span aria-hidden="true">View photograph <span>↗</span></span>
    </button>);
  return <section className="local-gallery" aria-label={`${title} photographs`}>
    <p className="local-gallery-count">{photos.length} {photos.length === 1 ? 'photograph' : 'photographs'} · Select a photograph to enlarge it</p>
    {photos.length > 1 ? <StepSlider className="internal-gallery-slider" label={`${title} photographs`} size={3} mobileSize={1} loop controls horizontalOnMobile mouseDrag interval={3600} paused={open || menuOpen || paused}>{cards}</StepSlider> : <div className="local-gallery-grid">{cards}</div>}
    {photos.length > 1 && <button type="button" className="internal-pause" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? 'Play' : 'Pause'} gallery</button>}
    <dialog ref={dialog} className="local-gallery-dialog" aria-label={`${title} image viewer`} onKeyDown={keys} onCancel={event => { event.preventDefault(); close(); }} onClose={() => { setOpen(false); trigger.current?.focus(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <button autoFocus type="button" className="local-gallery-close" onClick={close} aria-label="Close photograph">Close ×</button>
      {open && <figure><img key={photos[selected].src} src={photos[selected].src} alt={photos[selected].alt || title} /><figcaption aria-live="polite">{selected + 1} / {photos.length}{photos[selected].alt && ` · ${photos[selected].alt}`}</figcaption></figure>}
      {photos.length > 1 && <div className="local-gallery-controls"><button type="button" onClick={() => move(-1)} aria-label="Previous photograph">←</button><button type="button" onClick={() => move(1)} aria-label="Next photograph">→</button></div>}
    </dialog>
  </section>;
}
