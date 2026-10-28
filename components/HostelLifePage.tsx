'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import ApiRichText from './ApiRichText';
import SmoothFrameCarousel from './SmoothFrameCarousel';
import { usePageMenuOpen } from './LocalPageShell';
import StepSlider from './StepSlider';
import { SITE_BASE } from './site-base';
import { hostelVideo, requestHostelContent, type HostelContent, type HostelDetail, type HostelPhoto, type HostelVideo } from './hostel-page-data';
import styles from './HostelLifePage.module.css';

const asset = (name: string) => `${SITE_BASE}/assets/hostel-page/${name}`;
const facilityLabels = ['Wi-Fi enabled residences', 'Hot water facility', 'Laundry Facility', 'Mess', 'ATM counter at campus', 'Sports Arena', 'Electrical Backup'];
const reasonPositions = [[28.5, 8], [18, 23], [8, 53], [22.5, 72], [74, 35.5], [84, 69], [91, 82], [76, 93], [61, 98], [40, 86]];
const referencePhotos: HostelPhoto[] = [
  { src: asset('gallery-dance.webp'), alt: 'A student performing on stage' },
  { src: asset('gallery-fest.webp'), alt: 'Students at a campus festival' },
  { src: asset('gallery-dining.webp'), alt: 'Students in the hostel dining hall' },
  { src: asset('gallery-room.webp'), alt: 'Students in their hostel room' },
  { src: asset('gallery-sports.webp'), alt: 'Students playing football' },
  { src: asset('gallery-evening.webp'), alt: 'An evening gathering on campus' },
  { src: asset('gallery-bonfire.webp'), alt: 'Students around a campus bonfire' },
];
type Modal = { kind: 'photo'; photos: HostelPhoto[]; index: number } | { kind: 'video'; video: HostelVideo } | { kind: 'text'; title: string; text: string };

function MediaDialog({ value, close, change }: { value: Modal; close: () => void; change: (index: number) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current, previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    element?.showModal(); document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = oldOverflow; previous?.focus({ preventScroll: true }); };
  }, []);
  const title = value.kind === 'photo' ? value.photos[value.index].alt || 'Hostel photo' : value.kind === 'video' ? value.video.title || 'Video Gallery' : value.title;
  return <dialog ref={dialog} className={styles.dialog} aria-label={title} data-lenis-prevent="true"
    onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}
    onKeyDown={event => {
      if (value.kind !== 'photo' || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault(); change((value.index + (event.key === 'ArrowRight' ? 1 : -1) + value.photos.length) % value.photos.length);
    }}>
    <div className={styles.dialogInner}>
      <button type="button" className={styles.dialogClose} aria-label="Close preview" onClick={close} autoFocus>×</button>
      {value.kind === 'photo' ? <>
        <img className={styles.previewPhoto} src={value.photos[value.index].src} alt={title} />
        <div className={styles.previewBar}>
          <button type="button" aria-label="Previous enlarged photo" onClick={() => change((value.index - 1 + value.photos.length) % value.photos.length)}>‹</button>
          <span>{title}<small>{value.index + 1} / {value.photos.length}</small></span>
          <button type="button" aria-label="Next enlarged photo" onClick={() => change((value.index + 1) % value.photos.length)}>›</button>
        </div>
      </> : value.kind === 'video' ? <>
        {/\.(mp4|webm)(?:$|[?#])/i.test(value.video.src)
          ? <video className={styles.videoPlayer} src={value.video.src} poster={value.video.poster} controls autoPlay playsInline />
          : <iframe className={styles.videoPlayer} src={`${value.video.src}?autoplay=1&rel=0`} title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />}
        <p className={styles.videoCaption}>{title}</p>
      </> : <div className={styles.textPreview}><h2>{value.title}</h2><p>{value.text}</p></div>}
    </div>
  </dialog>;
}

function ResidenceContent({ detail, paused, preview }: { detail: HostelDetail; paused: boolean; preview: (photos: HostelPhoto[], index: number) => void }) {
  return <div className={styles.residenceBody}>
    <div className={styles.detailGrid}>{detail.blocks.map((block, index) => <section key={index} className={!block.title ? styles.detailIntro : styles.detailBlock}>
      {block.title && <h3>{block.title}</h3>}<ApiRichText html={block.html} scrollTables />
    </section>)}</div>
    {!!detail.photos.length && <div className={styles.roomPhotos}>
      <StepSlider label={`${detail.title} photographs`} size={Math.min(3, detail.photos.length)} mobileSize={1} loop horizontalOnMobile controls interval={4200} paused={paused} mouseDrag>
        {detail.photos.map((photo, index) => <button key={index} type="button" className={styles.roomPhoto} onClick={() => preview(detail.photos, index)} aria-label={`Enlarge ${photo.alt}`}>
          <img src={photo.src} alt={photo.alt} loading="lazy" /><span aria-hidden="true">↗</span>
        </button>)}
      </StepSlider>
    </div>}
  </div>;
}

export default function HostelLifePage() {
  const menuOpen = usePageMenuOpen();
  const root = useRef<HTMLElement>(null), canvas = useRef<HTMLDivElement>(null), reasonPopup = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState<HostelContent | null>(null), [state, setState] = useState<'loading' | 'ready' | 'error'>('loading'), [request, setRequest] = useState(0);
  const [reason, setReason] = useState(4), [reasonHeld, holdReasons] = useState(false), [visible, setVisible] = useState(false), [reduced, setReduced] = useState(false);
  const [facility, setFacility] = useState(3), [residence, setResidence] = useState<number | null>(null), [gallery, setGallery] = useState<'photos' | 'videos'>('photos');
  const [modal, setModal] = useState<Modal | null>(null);
  const [reasonOpen, setReasonOpen] = useState(true);
  const animated = useRef(new WeakSet<Element>());

  useEffect(() => {
    const controller = new AbortController(), timeout = window.setTimeout(() => controller.abort(), 20000);
    let mounted = true;
    setState('loading'); setContent(null);
    requestHostelContent(controller.signal).then(value => { if (mounted) { setContent(value); setState('ready'); setReason(Math.min(4, Math.max(0, value.reasons.length - 1))); } })
      .catch(() => { if (mounted) setState('error'); }).finally(() => clearTimeout(timeout));
    return () => { mounted = false; clearTimeout(timeout); controller.abort(); };
  }, [request]);

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)'), sync = () => setReduced(media.matches);
    sync(); media.addEventListener('change', sync);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .15 });
    if (canvas.current) observer.observe(canvas.current);
    return () => { media.removeEventListener('change', sync); observer.disconnect(); };
  }, []);

  useEffect(() => {
    if (reduced || !visible || reasonHeld || modal || menuOpen || !content || content.reasons.length < 2) return;
    const timer = window.setInterval(() => { if (!document.hidden) { setReason(index => (index + 1) % content.reasons.length); setReasonOpen(true); } }, 5600);
    return () => clearInterval(timer);
  }, [content, reduced, visible, reasonHeld, modal, menuOpen]);

  useLayoutEffect(() => {
    const parent = canvas.current, popup = reasonPopup.current, dot = parent?.querySelector<HTMLElement>(`[data-reason="${reason}"]`);
    if (!parent || !popup || !dot || !reasonOpen) return;
    const position = () => {
      const box = parent.getBoundingClientRect(), point = dot.getBoundingClientRect();
      const x = point.left + point.width / 2 - box.left, y = point.top + point.height / 2 - box.top;
      const width = popup.offsetWidth, height = popup.offsetHeight, gap = point.width / 2 + 14, edge = 8;
      const right = x + gap + width <= box.width - edge, leftRoom = x - gap - width >= edge;
      const beside = right || leftRoom, below = y + gap + height <= box.height - edge;
      const side = beside ? right ? 'right' : 'left' : below ? 'below' : 'above';
      const left = Math.max(edge, Math.min(box.width - width - edge, beside ? right ? x + gap : x - gap - width : x - width / 2));
      const top = Math.max(edge, Math.min(box.height - height - edge, beside ? y - height / 2 : below ? y + gap : y - gap - height));
      popup.style.left = `${left}px`; popup.style.top = `${top}px`; popup.style.setProperty('--arrow-y', `${Math.max(16, Math.min(height - 16, y - top))}px`);
      popup.dataset.side = side; popup.dataset.positioned = 'true';
    };
    position(); const observer = new ResizeObserver(position); observer.observe(parent); observer.observe(popup);
    return () => observer.disconnect();
  }, [reason, reasonOpen, content]);

  useEffect(() => {
    if (reduced || !root.current) return;
    const animations: Animation[] = [];
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      if (animated.current.has(entry.target)) return;
      animated.current.add(entry.target);
      const delay = Number((entry.target as HTMLElement).dataset.hostelDelay || '0');
      animations.push(entry.target.animate([{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 720, easing: 'cubic-bezier(.22,1,.36,1)', delay, fill: 'backwards' }));
    }), { threshold: .08 });
    root.current.querySelectorAll('[data-hostel-reveal]').forEach(element => observer.observe(element));
    return () => { observer.disconnect(); animations.forEach(animation => animation.cancel()); };
  }, [state, reduced]);

  const showPhotos = useCallback((photos: HostelPhoto[], index: number) => setModal({ kind: 'photo', photos, index }), []);
  const photos = [...referencePhotos, ...(content?.photos || [])];
  const videos = content?.videos || [];
  const railImages: readonly (readonly [string, string])[] = gallery === 'photos' ? photos.map(photo => [photo.src, photo.alt]) : videos.map(video => [video.poster, video.title || 'Video Gallery']);
  const selectedReason = content?.reasons[reason];
  const configuredTour = hostelVideo(process.env.NEXT_PUBLIC_DGU_HOSTEL_TOUR_URL || '', 'Hostel Tour of DBS Global University', asset('tour-poster.webp'));
  const tour = content?.tour || configuredTour;
  const facilitiesCopy = facility === 3 ? content?.mess : content?.facilities[facility]?.join('\n');

  return <main className={styles.page} ref={root} id="hostel-content">
    <a className={styles.skip} href="#hostel-facilities">Skip to hostel facilities</a>
    <section className={styles.hero} aria-labelledby="hostel-title" data-navigation-opening>
      <div className={styles.heroImage}>
        <img src={asset('hero.webp')} width={1711} height={546} alt="Students enjoying campus life together on the lawn" fetchPriority="high" />
        <div className={styles.heroCopy}><p>MORE THAN A ROOM</p><h2>IT’S WHERE YOUR<br />COLLEGE STORY<br /><span>BEGINS.</span></h2></div>
      </div>
      <h1 id="hostel-title">HOSTEL LIFE</h1>
    </section>

    <section className={styles.introduction} aria-labelledby="hostel-reasons-heading" data-hostel-reveal>
      <h2 id="hostel-reasons-heading">TOP REASONS TO LIVE ON CAMPUS</h2>
      {state === 'ready' ? <p>{content?.intro}</p> : <div className={styles.status} role="status">
        <p>{state === 'loading' ? 'Loading hostel information…' : 'Hostel information is temporarily unavailable.'}</p>
        {state === 'error' && <button type="button" onClick={() => setRequest(value => value + 1)}>Try again</button>}
      </div>}
    </section>

    <section className={styles.campusReasons} aria-label="Reasons to live on campus" data-hostel-reveal>
      <div className={styles.campusReasonsInner} onKeyDown={event => { if (event.key === 'Escape') setReasonOpen(false); }}>
      <div ref={canvas} className={styles.collage} onMouseEnter={() => holdReasons(true)} onMouseLeave={() => holdReasons(false)}
        onFocusCapture={() => holdReasons(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) holdReasons(false); }}>
        <div className={styles.campusHeading}><h2>LIVING ON CAMPUS<br />PROVIDES STUDENTS WITH<br />A UNIQUE LIVING EXPERIENCE.</h2><p>HERE ARE OUR TOP TEN REASONS TO LIVE ON CAMPUS!</p></div>
        <span className={`${styles.colourBlock} ${styles.yellowOne}`} aria-hidden="true" /><span className={`${styles.colourBlock} ${styles.yellowTwo}`} aria-hidden="true" />
        <span className={`${styles.colourBlock} ${styles.yellowThree}`} aria-hidden="true" /><span className={`${styles.colourBlock} ${styles.pinkOne}`} aria-hidden="true" />
        {['room', 'dining', 'pool', 'building', 'football', 'students', 'pink'].map((name, index) => <button key={name} type="button" className={`${styles.collagePhoto} ${styles['photo_' + name]}`}
          onClick={() => showPhotos([{ src: asset(`collage-${name}.webp`), alt: ['A furnished hostel room', 'Students in the dining hall', 'Students playing pool', 'A campus residency building', 'Students playing football', 'Students learning together', 'Campus activities'][index] }], 0)} aria-label={`Enlarge campus ${name} photo`}>
          <img src={asset(`collage-${name}.webp`)} alt="" loading="lazy" /><span className={styles.collageZoom} aria-hidden="true">↗</span>
        </button>)}
        {content?.reasons.map((item, index) => {
          const [x, y] = reasonPositions[index] || [8 + (index % 8) * 12, 105 + Math.floor(index / 8) * 12];
          return <button key={index} type="button" className={`${styles.reasonDot} ${index === reason ? styles.activeDot : ''}`} style={{ '--dot-x': `${x}%`, '--dot-y': `${y}%` } as CSSProperties}
            aria-label={item.title} aria-expanded={index === reason && reasonOpen} aria-controls="hostel-reason-copy" aria-describedby={index === reason && reasonOpen ? 'hostel-reason-copy' : undefined} data-reason={index}
            onMouseEnter={() => { setReason(index); setReasonOpen(true); }} onFocus={() => { setReason(index); setReasonOpen(true); }} onClick={() => { setReason(index); setReasonOpen(true); }} />;
        })}
        {selectedReason && reasonOpen && <div ref={reasonPopup} className={styles.reasonCopy} key={reason} id="hostel-reason-copy" role="note" aria-label={selectedReason.title} data-lenis-prevent="true">
          <button type="button" className={styles.reasonClose} aria-label="Close campus reason" onClick={() => setReasonOpen(false)}>×</button>
          <h3>{selectedReason.title}</h3><p>{selectedReason.text}</p>
        </div>}
      </div>
      </div>
    </section>

    <section className={styles.facilities} id="hostel-facilities" aria-labelledby="hostel-facilities-title" data-hostel-reveal>
      <h2 id="hostel-facilities-title">HOSTEL FACILITIES</h2>
      <SmoothFrameCarousel label="Hostel facilities" layout="facilities" initialIndex={3} interval={3300} paused={!!modal || menuOpen} onChange={setFacility}
        tabPrefix="hostel-facility" panelId="hostel-facility-panel" frameClassName={styles.facilityCard}
        items={facilityLabels.map((label, index) => ({ label, content: <>
          <span className={styles.facilityIcon} style={{ '--facility-colour': ['#f7c317', '#ec702e', '#ef4432', '#de186f', '#a82081', '#4678ba', '#13abb4'][index] } as CSSProperties}><img src={asset(`facility-${index}.png`)} alt="" width={88} height={80} /></span>
          <span className={styles.facilityLabel}>{label}</span>
        </> }))} />
      <div className={styles.facilityDescription} role="tabpanel" id="hostel-facility-panel" aria-labelledby={`hostel-facility-${facility}`} key={facility}>
        {facilitiesCopy && <p>{facilitiesCopy}</p>}
      </div>
    </section>

    <section className={styles.tour} aria-label="Hostel tour" data-hostel-reveal>
      <button type="button" onClick={() => tour ? setModal({ kind: 'video', video: { ...tour, title: tour.title || 'Hostel Tour of DBS Global University' } }) : setModal({ kind: 'text', title: 'Hostel Tour', text: 'The hostel tour video is currently unavailable.' })} aria-label="Play hostel tour">
        <img src={asset('tour-poster.webp')} alt="Hostel Tour of DBS Global University" width={1880} height={487} loading="lazy" />
        <span className={styles.play} aria-hidden="true"><svg viewBox="0 0 60 60"><path d="m23 15 23 15-23 15Z" /></svg></span>
      </button>
    </section>

    <section className={styles.hostels} aria-labelledby="hostels-heading" data-hostel-reveal>
      <div className={styles.hostelsHeading}><h2 id="hostels-heading">HOSTELS</h2>{content?.campusIntro && <button type="button" className={styles.hostelInformation} aria-label="About hostel accommodation" onClick={() => setModal({ kind: 'text', title: 'Living on Campus', text: content.campusIntro })}>i</button>}</div>
      <div className={styles.residences}>{content?.residences.map((item, index) => {
        const parts = item.title.match(/^(.*?)(\s*\(Formerly.*\))$/i), open = residence === index;
        return <article key={index} className={`${styles.residence} ${open ? styles.openResidence : ''}`} data-residence={index}>
          <button className={styles.residenceToggle} type="button" aria-expanded={open} aria-controls={`hostel-residence-panel-${index}`} id={`hostel-residence-toggle-${index}`} onClick={() => setResidence(open ? null : index)}
            style={{ '--residence-colour': ['#68176b', '#84178b', '#a323ab', '#b52bbd', '#cd45d2', '#df62e2'][index % 6] } as CSSProperties}>
            <span>{parts ? <>{parts[1]}<small>{parts[2].trim()}</small></> : item.title}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 9 5 6 5-6" /></svg>
          </button>
          <div className={styles.accordionPanel} id={`hostel-residence-panel-${index}`} role="region" aria-labelledby={`hostel-residence-toggle-${index}`} aria-hidden={!open} inert={!open}>
            <div className={styles.accordionInner}><ResidenceContent detail={item} paused={!open || !!modal || menuOpen} preview={showPhotos} /></div>
          </div>
        </article>;
      })}</div>
      {content?.common && <article className={`${styles.commonFacilities} ${residence === -1 ? styles.openResidence : ''}`}>
        <button type="button" className={styles.commonToggle} id="hostel-common-toggle" aria-expanded={residence === -1} aria-controls="hostel-common-panel" onClick={() => setResidence(value => value === -1 ? null : -1)}>{content.common.title}<span aria-hidden="true">{residence === -1 ? '−' : '+'}</span></button>
        <div className={styles.accordionPanel} id="hostel-common-panel" role="region" aria-labelledby="hostel-common-toggle" aria-hidden={residence !== -1} inert={residence !== -1}><div className={styles.accordionInner}><ResidenceContent detail={content.common} paused={residence !== -1 || !!modal || menuOpen} preview={showPhotos} /></div></div>
      </article>}
    </section>

    <section className={styles.gallery} aria-label="Hostel photo and video galleries" data-hostel-reveal>
      <div className={styles.galleryTabs} role="tablist" aria-label="Gallery type">
        {(['photos', 'videos'] as const).map((type, index) => <button key={type} type="button" role="tab" id={`hostel-gallery-${type}`} aria-controls="hostel-gallery-panel" aria-selected={gallery === type} tabIndex={gallery === type ? 0 : -1}
          onClick={() => setGallery(type)} onKeyDown={event => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); const next = event.key === 'Home' ? 'photos' : event.key === 'End' ? 'videos' : index ? 'photos' : 'videos'; setGallery(next); document.getElementById(`hostel-gallery-${next}`)?.focus(); }}>
          {type === 'photos' ? 'Photo Gallery' : 'Video Gallery'}
        </button>)}
      </div>
      <div className={`${styles.galleryRail} ${gallery === 'videos' ? styles.videoRail : ''}`} id="hostel-gallery-panel" role="tabpanel" aria-labelledby={`hostel-gallery-${gallery}`}>
        {railImages.length ? <SmoothFrameCarousel key={gallery} layout="ribbon" items={railImages.map(([src, alt]) => ({ label: gallery === 'photos' ? `Enlarge ${alt}` : `Play ${alt}`, content: <><img src={src} alt={alt} loading="eager" decoding="async" draggable={false} /><span className={styles.galleryZoom} aria-hidden="true">↗</span></> }))}
          label={gallery === 'photos' ? 'Hostel photo gallery' : 'Campus video gallery'} interval={2600} paused={!!modal || menuOpen}
          onActivate={index => { if (gallery === 'photos') showPhotos(photos, index); else setModal({ kind: 'video', video: videos[index] }); }} />
          : <p className={styles.emptyGallery}>{state === 'loading' ? 'Loading videos…' : 'Videos are currently unavailable.'}</p>}
      </div>
    </section>
    {modal && <MediaDialog value={modal} close={() => setModal(null)} change={index => setModal(value => value?.kind === 'photo' ? { ...value, index } : value)} />}
  </main>;
}
