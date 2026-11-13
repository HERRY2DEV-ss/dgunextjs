'use client';
import { useEffect, useRef, useState } from 'react';
import ApiRichText from './ApiRichText';
import BatchSlider from './BatchSlider';
import { SITE_BASE } from './site-base';
import { hostelVideo, type HostelVideo } from './hostel-page-data';
import { requestGlanceContent, type GlanceContent } from './glance-page-data';
import styles from './GlancePage.module.css';

const asset = (name: string) => `${SITE_BASE}/assets/glance-page/${name}`;
const rankingLogo = (name: string) => `${SITE_BASE}/assets/ranking/${name}`;
const rankingLogos = Array.from({ length: 36 }, (_, index) => `${index + 1}.webp`);

function VideoPreview({ video, close }: { video: HostelVideo; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current, previous = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow;
    element?.showModal(); document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = overflow; previous?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={dialog} className={styles.dialog} aria-label={video.title} data-lenis-prevent="true"
    onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <button type="button" className={styles.close} aria-label="Close university video" onClick={close} autoFocus>×</button>
    {/\.(mp4|webm)(?:$|[?#])/i.test(video.src)
      ? <video src={video.src} controls autoPlay playsInline poster={asset('video-poster.jpeg')} />
      : <iframe src={`${video.src}${video.src.includes('?') ? '&' : '?'}autoplay=1&rel=0`} title={video.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
  </dialog>;
}

export default function GlancePage() {
  const root = useRef<HTMLElement>(null), revealed = useRef(new WeakSet<Element>());
  const [content, setContent] = useState<GlanceContent | null>(null), [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [request, setRequest] = useState(0), [expanded, setExpanded] = useState(false), [playing, setPlaying] = useState(false);
  const [rankingsPaused, setRankingsPaused] = useState(false);
  const [rankingsPerSlide, setRankingsPerSlide] = useState(32);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 600px)');
    const update = () => setRankingsPerSlide(media.matches ? 6 : 32);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 20000); let mounted = true;
    requestGlanceContent(controller.signal).then(value => { if (mounted) { setContent(value); setStatus('ready'); } })
      .catch(error => { if (mounted) { console.warn('Glance API request failed.', error); setStatus('error'); } }).finally(() => clearTimeout(timeout));
    return () => { mounted = false; clearTimeout(timeout); controller.abort(); };
  }, [request]);
  useEffect(() => {
    if (!root.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animations: Animation[] = [], observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting || revealed.current.has(entry.target)) return;
      observer.unobserve(entry.target); revealed.current.add(entry.target);
      animations.push(entry.target.animate([{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'translateY(0)' }], {
        duration: 650, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards', delay: Number((entry.target as HTMLElement).dataset.glanceDelay || 0),
      }));
    }), { threshold: .08 });
    root.current.querySelectorAll('[data-glance-reveal]').forEach(node => observer.observe(node));
    return () => { observer.disconnect(); animations.forEach(animation => animation.cancel()); };
  }, [status]);
  const video = content?.video || hostelVideo(process.env.NEXT_PUBLIC_DGU_GLANCE_VIDEO_URL || '', 'DBS Global University');
  const poster = <img src={asset('video-poster.jpeg')} width={1279} height={332} alt="The Doon Business School campus entrance" loading="lazy" />;
  return <main ref={root} className={styles.page} id="glance-content" aria-busy={status === 'loading'}>
    <section className={styles.hero} aria-labelledby="glance-title" data-navigation-opening>
      <div className={styles.heroImage}><img src={asset('hero.jpeg')} width={1185} height={393} alt="DBS Global University campus with the Himalayan foothills beyond" fetchPriority="high" />
        <div className={styles.heroCopy}><h2>A GLANCE AT<br />DBS GLOBAL UNIVERSITY</h2><p>World-class education, a vibrant campus,<br />and endless opportunities—all in one place.</p></div>
      </div>
      <header className={styles.titleStrip}>
        <h1 id="glance-title">DGU AT A GLANCE</h1>
      </header>
    </section>
    {status !== 'ready' && <div className={styles.status} role={status === 'error' ? 'alert' : 'status'}>
      <p>{status === 'loading' ? 'Loading university information…' : 'University information is temporarily unavailable.'}</p>
      {status === 'error' && <button type="button" onClick={() => { setContent(null); setStatus('loading'); setRequest(value => value + 1); }}>Try again</button>}
    </div>}
    {content && <>
      <section className={styles.overview} aria-label="About DBS Global University" data-glance-reveal>
        {(content.established || content.location) && <div className={styles.established}><p>{content.established}</p><span>{content.location}</span></div>}
        {content.name && <h2>{content.name}</h2>}{content.formerName && <p className={styles.formerName}>{content.formerName}</p>}{content.legacy && <p className={styles.legacy}>{content.legacy}</p>}
        {content.introduction && <div className={styles.about}><ApiRichText html={content.introduction} />
          <div className={styles.more} id="glance-more" hidden={!expanded}>{expanded && <ApiRichText html={content.more} />}</div>
          {content.more.trim() && <button type="button" className={styles.readMore} aria-expanded={expanded} aria-controls="glance-more" onClick={() => setExpanded(value => !value)}>{expanded ? 'Read less' : 'Read more'} <span aria-hidden="true">›</span></button>}
        </div>}
      </section>
      <section className={styles.video} aria-label="University campus video" data-glance-reveal>{video ? <button type="button" onClick={() => setPlaying(true)} aria-label="Play DBS Global University video">{poster}<span className={styles.play} aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 4v16l13-8Z" /></svg></span></button> : poster}</section>
      {(content.mission.items.length > 0 || content.vision.html) && <section className={styles.missionVision} aria-label="Mission and Vision">
        {content.mission.items.length > 0 && <div className={styles.mission} data-glance-reveal><h2 className={styles.underlined}>{content.mission.title}</h2>
          <ul>{content.mission.items.map((html, index) => <li key={index} data-glance-reveal data-glance-delay={index * 75}><img src={asset(`mission-${index % 4}.png`)} alt="" width={130} height={142} loading="lazy" /><div><ApiRichText html={html} /></div></li>)}</ul>
        </div>}
        {content.vision.html && <div className={styles.vision} data-glance-reveal data-glance-delay="100"><h2 className={styles.underlined}>{content.vision.title}</h2><ApiRichText html={content.vision.html} />
          {content.values.length > 0 && <ul className={styles.values} aria-label="University values">{content.values.map(value => <li key={value}>{value}</li>)}</ul>}
        </div>}
      </section>}
      {content.approvals.logos.length > 0 && <section className={styles.recognition} id="approvals-accreditation" data-glance-reveal><p>{content.approvals.caption}</p><h2>{content.approvals.title}</h2>
        <div className={styles.approvals}>{content.approvals.logos.map((logo, index) => <figure key={`${logo.src}-${index}`} data-glance-reveal data-glance-delay={index * 80}><div><img src={logo.artwork ? asset(logo.artwork) : logo.src} alt={logo.title} loading="lazy" /></div>{logo.caption && <figcaption>{logo.caption}</figcaption>}</figure>)}</div>
      </section>}
      <section className={`${styles.recognition} ${styles.rankings}`} id="rankings-recognition" data-glance-reveal>
        {content.rankings.caption && <p>{content.rankings.caption}</p>}
        <h2>{content.rankings.title || 'Rankings & Recognition'}</h2>
        <div className={styles.rankingsCarousel}>
          <BatchSlider className={styles.rankingsSlider} size={rankingsPerSlide} interval={5500} paused={rankingsPaused}
            label="DBS Global University rankings and recognition" controls>
            {rankingLogos.map((file, index) => <figure className={styles.rankingLogo} key={file}>
              <img src={rankingLogo(file)} alt={`Ranking and recognition logo ${index + 1}`} loading="lazy" />
            </figure>)}
          </BatchSlider>
          <button className={styles.rankingsPause} type="button" aria-pressed={rankingsPaused}
            onClick={() => setRankingsPaused(value => !value)}>
            {rankingsPaused ? 'Resume logo slider' : 'Pause logo slider'}
          </button>
        </div>
      </section>
    </>}
    {playing && video && <VideoPreview video={video} close={() => setPlaying(false)} />}
  </main>;
}
