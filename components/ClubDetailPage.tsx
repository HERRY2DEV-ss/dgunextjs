'use client';
import SlidingTabList from './SlidingTabList';
/* eslint-disable @next/next/no-img-element -- Static-export page; uses API image URLs and the original PDF assets. */
import { useEffect, useId, useRef, useState } from 'react';
import type { ClubPageData, ClubPerson } from './club-detail-types';
import styles from './ClubDetailPage.module.css';

const tabs = [
  { key: 'leaders', label: 'OUR LEADERS' }, { key: 'patrons', label: 'CLUB PATRONS' },
  { key: 'rules', label: 'RULES & REGULATIONS' }, { key: 'contacts', label: 'CONTACT US' },
  { key: 'testimonials', label: 'TESTIMONIALS' },
] as const;
type Tab = typeof tabs[number]['key'];
type Modal = { kind: 'person'; person: ClubPerson } | { kind: 'video' } | null;

function videoSource(raw: string) {
  try {
    const url = new URL(raw);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    const host = url.hostname.replace(/^www\./, '');
    const id = host === 'youtu.be' ? url.pathname.slice(1).split('/')[0] : ['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host) ? url.searchParams.get('v') || url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1] : null;
    if (id && /^[\w-]{11}$/.test(id)) return { kind: 'embed' as const, src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1` };
    if (['vimeo.com', 'player.vimeo.com'].includes(host)) {
      const id = url.pathname.split('/').filter(Boolean).at(-1);
      if (id && /^\d+$/.test(id)) return { kind: 'embed' as const, src: `https://player.vimeo.com/video/${id}?autoplay=1` };
    }
    return { kind: 'file' as const, src: url.href };
  } catch { return null; }
}

function BenefitDiagram({ benefits }: { benefits: NonNullable<ClubPageData['benefits']> }) {
  const radial = benefits.items.length === 6 && Boolean(benefits.emblem);
  return <section className={styles.benefits} aria-labelledby="club-benefits-heading">
    <h2 id="club-benefits-heading">{benefits.title}</h2>
    {benefits.intro && <p className={styles.benefitsIntro}>{benefits.intro}</p>}
    <div className={`${styles.diagram} ${radial ? '' : styles.diagramList}`}>
      {radial ? <div className={styles.diagramShape}>
        <svg className={styles.diagramLines} viewBox="0 0 100 115.47" preserveAspectRatio="none" fill="none" aria-hidden="true">
          <path stroke="#661769" strokeWidth="2" vectorEffect="non-scaling-stroke" d="M50 0L100 28.87V86.6L50 115.47L0 86.6V28.87Z" />
          <path stroke="#661769" strokeWidth="2" vectorEffect="non-scaling-stroke" d="M50 0V8M0 28.87L8 33.49M100 28.87L92 33.49M100 86.6L92 81.98M0 86.6L8 81.98M50 107.47V115.47" />
        </svg>
        <span className={`${styles.diagramConnector} ${styles.connectorTop}`} aria-hidden="true" />
        <span className={`${styles.diagramConnector} ${styles.connectorTopRight}`} aria-hidden="true" />
        <span className={`${styles.diagramConnector} ${styles.connectorBottomRight}`} aria-hidden="true" />
        <span className={`${styles.diagramConnector} ${styles.connectorBottom}`} aria-hidden="true" />
        <span className={`${styles.diagramConnector} ${styles.connectorBottomLeft}`} aria-hidden="true" />
        <span className={`${styles.diagramConnector} ${styles.connectorTopLeft}`} aria-hidden="true" />
        <img className={styles.emblem} src={benefits.emblem} alt="Club emblem" loading="lazy" decoding="async" />
      </div> : benefits.emblem && <img className={styles.emblem} src={benefits.emblem} alt="Club emblem" loading="lazy" decoding="async" />}
      <ol className={styles.benefitItems}>{benefits.items.map((item, index) => <li key={index}>{item}</li>)}</ol>
    </div>
  </section>;
}

function People({ people, onOpen }: { people: ClubPerson[]; onOpen: (person: ClubPerson) => void }) {
  return <div className={styles.peopleGrid}>{people.map(person => <article className={styles.person} key={person.id}>
    <div className={styles.personCard}>
      <span className={styles.goldWedge} aria-hidden="true" />
      <div className={styles.personCopy}><h3>{person.name}</h3><p>{person.role}</p></div>
      {person.image && <img className={styles.portrait} src={person.image} alt={person.name} loading="lazy" decoding="async" />}
    </div>
    {person.profileUrl ? <a className={styles.readMore} href={person.profileUrl}>Read More <span aria-hidden="true">›</span></a>
      : person.bio ? <button type="button" className={styles.readMore} onClick={() => onOpen(person)} aria-label={`Read more about ${person.name}`}>Read More <span aria-hidden="true">›</span></button> : null}
  </article>)}</div>;
}

export default function ClubDetailPage({ data }: { data: ClubPageData }) {
  const [activeTab, setActiveTab] = useState<Tab>('leaders');
  const [modal, setModal] = useState<Modal>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const uid = useId().replace(/:/g, '');
  const panelId = `${uid}-club-panel`;
  const video = data.video?.url ? videoSource(data.video.url) : null;
  useEffect(() => {
    if (modal && !dialog.current?.open) dialog.current?.showModal();
    if (!modal && dialog.current?.open) dialog.current.close();
  }, [modal]);
  const empty = <p className={styles.empty}>Details will be updated soon.</p>;

  return <main className={styles.page}>
    <section className={styles.titleBand} data-navigation-opening={!data.hero || undefined}><h1>{data.name}</h1></section>
    {data.hero && <section className={`${styles.hero} ${data.hero.fullImage ? styles.fullHero : ''}`} aria-label={`${data.name} banner`} data-navigation-opening>
      {data.hero.image && <img className={styles.heroImage} src={data.hero.image} alt={data.hero.imageAlt || data.name} fetchPriority="high" decoding="async" />}
      <div className={styles.heroCopy}>
        {data.hero.titleLines.length > 0 && <p className={styles.tagline}>{data.hero.titleLines.map((line, index) => <span key={index}>{line}</span>)}</p>}
        {data.hero.subtitle && <p className={styles.heroSubtitle}>{data.hero.subtitle}</p>}
      </div>
    </section>}
    {data.description.length > 0 && <section className={styles.introduction} aria-label="About the club">{data.description.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</section>}
    {data.benefits && data.benefits.items.length > 0 && <BenefitDiagram benefits={data.benefits} />}
    {data.video?.poster && <section className={styles.videoSection} aria-label={data.video.title || 'Club video'}>
      <img src={data.video.poster} alt={data.video.title || `${data.name} video`} loading="lazy" decoding="async" />
      {video ? <button className={styles.playButton} type="button" onClick={() => setModal({ kind: 'video' })} aria-label={`Play ${data.video.title || 'club video'}`}><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="36" /><path d="M32 23L59 40L32 57Z" /></svg></button>
        : <span className={styles.playButton} aria-hidden="true"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="36" /><path d="M32 23L59 40L32 57Z" /></svg></span>}
    </section>}
    {data.achievements && data.achievements.items.length > 0 && <section className={styles.achievements} aria-labelledby="club-achievements-heading"><h2 id="club-achievements-heading">{data.achievements.title}</h2>{data.achievements.intro && <p className={styles.achievementsIntro}>{data.achievements.intro}</p>}<ol>{data.achievements.items.map((item, index) => <li key={index}>{item}</li>)}</ol></section>}
    {data.otherDetails && data.otherDetails.length > 0 && <section className={styles.additionalDetails} aria-label="More club information">{data.otherDetails.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</section>}
    <section className={styles.tabsSection} aria-label="Club information">
      <SlidingTabList activeKey={activeTab} role="tablist" aria-label="Club information" className={styles.tabList}>{tabs.map((tab, index) => <button
        key={tab.key} id={`${uid}-${tab.key}`} role="tab" type="button" aria-selected={activeTab === tab.key} aria-controls={panelId}
        tabIndex={activeTab === tab.key ? 0 : -1} className={styles.tab} onClick={() => setActiveTab(tab.key)}
        onKeyDown={event => {
          const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
          if (next < 0) return;
          event.preventDefault(); setActiveTab(tabs[next].key);
          document.getElementById(`${uid}-${tabs[next].key}`)?.focus();
        }}>{tab.label}</button>)}</SlidingTabList>
      <div id={panelId} role="tabpanel" aria-labelledby={`${uid}-${activeTab}`} className={styles.tabPanel} tabIndex={0} key={activeTab}>
        {activeTab === 'leaders' && <>{data.leadersTitle && <h2 className={styles.peopleHeading}>{data.leadersTitle}</h2>}{data.leaders.length ? <People people={data.leaders} onOpen={person => setModal({ kind: 'person', person })} /> : empty}</>}
        {activeTab === 'patrons' && (data.patrons.length ? <People people={data.patrons} onOpen={person => setModal({ kind: 'person', person })} /> : empty)}
        {activeTab === 'rules' && (data.rules.length ? <ol className={styles.rules}>{data.rules.map((rule, index) => <li key={index}>{rule}</li>)}</ol> : empty)}
        {activeTab === 'contacts' && (data.contacts.length ? <div className={styles.contactGrid}>{data.contacts.map((contact, index) => <article className={styles.contact} key={index}><h3>{contact.name}</h3>{contact.role && <p>{contact.role}</p>}{contact.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) && <a href={`mailto:${contact.email}`}>{contact.email}</a>}{contact.phone && <a href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}>{contact.phone}</a>}{contact.address && <p>{contact.address}</p>}</article>)}</div> : empty)}
        {activeTab === 'testimonials' && (data.testimonials.length ? <div className={styles.testimonialGrid}>{data.testimonials.map((entry, index) => <figure className={styles.testimonial} key={index}><blockquote>{entry.quote}</blockquote><figcaption>{entry.image && <img src={entry.image} alt="" loading="lazy" />}<div><strong>{entry.name}</strong>{entry.role && <span>{entry.role}</span>}</div></figcaption></figure>)}</div> : empty)}
      </div>
    </section>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={`${uid}-dialog-title`} onCancel={() => setModal(null)} onClose={() => setModal(null)} onClick={event => { if (event.target === dialog.current) setModal(null); }}>
      <button type="button" className={styles.closeButton} onClick={() => setModal(null)} aria-label="Close">×</button>
      {modal?.kind === 'person' && <article className={styles.personDetails}><h2 id={`${uid}-dialog-title`}>{modal.person.name}</h2><p className={styles.detailRole}>{modal.person.role}</p>{modal.person.image && <img src={modal.person.image} alt={modal.person.name} />}<p>{modal.person.bio}</p></article>}
      {modal?.kind === 'video' && video && <div className={styles.videoModal}><h2 id={`${uid}-dialog-title`}>{data.video?.title || 'Club video'}</h2>{video.kind === 'embed' ? <iframe src={video.src} title={data.video?.title || 'Club video'} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : <video src={video.src} poster={data.video?.poster} controls autoPlay playsInline />}</div>}
    </dialog>
  </main>;
}
