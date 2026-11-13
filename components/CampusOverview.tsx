'use client';
import { sitePath } from './site-base';


import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import LocalPageShell, { usePageMenuOpen } from './LocalPageShell';
import QuickContactForm from './QuickContactForm';
import CampusPhotoCarousel from './CampusPhotoCarousel';
import StepSlider from './StepSlider';
import PageTitleStrip from './PageTitleStrip';
import ExpandableText from './ExpandableText';
import DehradunReveal from './DehradunReveal';
import '../app/programs/program.css';

const A = sitePath('/assets/campus/');
type Photo = readonly [image: string, alt: string];
const celebrity: readonly Photo[] = [
  ['celebrity-moment-1.webp', 'Students with a visiting artist'],
  ['celebrity-moment-2.webp', 'A guest meeting the campus community'],
  ['celebrity-moment-3.webp', 'Welcoming a guest artist at DGU'],
  ['celebrity-moment-4.webp', 'A performer greeting the audience'],
  ['celebrity-moment-5.webp', 'An artist visiting DBS Global University'],
];
const fest: readonly Photo[] = [
  ['fest-dance.webp', 'Cultural dance performance'],
  ['fest-performance-red.webp', 'Live performance at Genesis'],
  ['fest-group.webp', 'Students celebrating at the fest'],
  ['fest-stage-blue.webp', 'Guest artist on a blue stage'],
  ['fest-stage.webp', 'Genesis stage performance'],
  ['fest-artist.webp', 'Festival artist performing on stage'],
  ['fest-performer.webp', 'A singer performing at the university fest'],
];
const eventCards = [
  { label: 'MANFEST', photos: [['event-manfest.webp', 'Students at Manfest'], ['fest-group.webp', 'Students celebrating Genesis']] as readonly Photo[], title: 'Brand Aid:', description: 'A flagship event where student teams build, brand, and pitch their own live startup concepts and products.' },
  { label: 'CULTURAL', photos: [['event-cultural.webp', 'Voice of Genesis performance'], ['fest-dance.webp', 'Students performing a cultural dance'], ['fest-performance-red.webp', 'A live festival performance']] as readonly Photo[], title: 'Voice of Genesis:', description: '(Singing Competitions): Solo and duet vocal performances.' },
  { label: 'TECH-FEST', photos: [['event-techfest.webp', 'Students collaborating at the technology event'], ['event-manfest.webp', 'Student-led activities at Genesis']] as readonly Photo[], title: 'Hackathons & Coding Battles:', description: 'Real-world problem solving through rapid software development.' },
];
const clubPhotos: readonly Photo[] = [
  ['clubs-basketball.webp', 'Students playing basketball on campus'],
  ['event-techfest.webp', 'Students taking part in a technology event'],
  ['fest-group.webp', 'Students participating in campus activities'],
];
const clubLogos: readonly Photo[] = [
  ['club-backpackers.webp', 'Backpackers Club'],
  ['club-bulls-bear.webp', 'DBS Bulls & Bear Club'],
  ['club-dance.webp', 'Dance Club'],
  ['club-dramatics.webp', 'DBS Dramatics Club'],
  ['club-marketing.webp', 'Marketing Club'],
  ['club-social-welfare.webp', 'DBS Social Welfare Club'],
  ['club-table-tennis.webp', 'Table Tennis Club'],
  ['club-music.webp', 'Music Club'],
];
const hostel: readonly Photo[] = [
  ['hostel-dining.webp', 'Students in the cafeteria'],
  ['hostel-room.webp', 'A student hostel room'],
  ['hostel-cafeteria.webp', 'Students dining together'],
  ['hostel-campus.webp', 'Hostel building and campus'],
];
const tours: readonly Photo[] = [
  ['tour-landmark.webp', 'Students exploring a landmark'],
  
];

type Preview = (image: string, alt: string) => void;

function SectionTitle({ id, icon, children, description }: {
  id: string;
  icon: string;
  children: ReactNode;
  description?: ReactNode;
}) {
  return <div className="campus-section-title">
    <img className="campus-section-icon" src={A + icon} alt="" aria-hidden="true" />
    <div><h2 id={id}>{children}</h2>{description && <p>{description}</p>}</div>
  </div>;
}

/** Preserve reference copy while allowing justified paragraphs to reflow. */
function ReferenceLines({ children }: { children: string }) {
  return children.replace(/\|/g, ' ');
}

function FeaturedArtist({ paused }: { paused: boolean }) {
  const artists = [
    ['Aastha-Gill.webp', 'Aastha Gill performing at the university fest', 'artist-aastha-name.svg'],
    ['celebrity-moment-4.webp', 'A guest artist visiting DBS Global University', ''],
    ['fest-performer.webp', 'A performer at the university fest', ''],
  ];
  return <div className="campus-celebrity-feature">
    <img className="campus-star" src={A + 'celebrity-star.svg'} alt="" aria-hidden="true" />
    <StepSlider className="campus-feature-slider" label="Featured campus artists" size={1} interval={5500} paused={paused} horizontalOnMobile pauseOnHover={false} mouseDrag>
      {artists.map(([image, alt, lettering], index) => <div className="campus-feature-slide" key={image}>
        <div className={`campus-feature-photo${index === 0 ? ' is-cutout' : ''}`}><img src={A + image} alt={alt} loading="lazy" draggable={false} /></div>
        {lettering ? <img className="campus-artist-lettering" src={A + lettering} alt="Aastha Gill" /> : <span className="campus-artist-name">Live at<em>DGU</em></span>}
      </div>)}
    </StepSlider>
  </div>;
}

function CampusOverviewContent() {
  const menuOpen = usePageMenuOpen();
  const [preview, setPreview] = useState<Photo | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const showPhoto = useCallback<Preview>((image, alt) => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setPreview([image, alt]);
  }, []);
  const closePhoto = useCallback(() => setPreview(null), []);
  useEffect(() => {
    const modal = dialog.current;
    if (!preview || !modal) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (!modal.open) modal.showModal();
    return () => {
      if (modal.open) modal.close();
      document.body.style.overflow = oldOverflow;
      opener.current?.focus({ preventScroll: true });
    };
  }, [preview]);
  const paused = menuOpen || !!preview;

  return <div className={`campus-overview${paused ? ' campus-motion-paused' : ''}`}>
    <a className="campus-skip-link" href="#campus-main">Skip to campus life</a>
    <main id="campus-main">

      <section className="campus-opening" aria-label="Campus life banner and enquiry form">
      <div id="home" className="campus-hero program-hero">
        <img className="campus-hero-image" src={A + 'hero-stage.webp'}
          alt="Student performing on stage at DBS Global University" width={1266} height={668} fetchPriority="high" />
        <div className="campus-hero-shade" />
        <img className="campus-hero-mark" src={A + 'life-wordmark.webp'} alt="Life at DGU" width={595} height={415} />
      </div>
        <div className="campus-contact"><QuickContactForm /></div>
      </section>
      <PageTitleStrip id="campus-title" title="BEYOND THE CLASSROOM"><p>Every Day, a New Story.</p></PageTitleStrip>

      <section className="campus-intro" aria-label="Life at DGU"><div className="campus-inner campus-intro-grid">
        <img className="campus-quote-mark" src={A + 'quote-mark.svg'} alt="" aria-hidden="true" />
        <p className="campus-intro-lead campus-reveal"><ReferenceLines>It provides a remarkable|threshold to the students|to groom themselves in all|aspects and present their|unique talent.</ReferenceLines></p>
        <p className="campus-reveal"><ReferenceLines>{'The students participate with full zeal and vigour|while keeping the competitive spirits high. The|best part is that all activities are organized and|managed by the students themselves as DBS|strongly believes in the ideology of "Empowering|by Learning".'}</ReferenceLines></p>
      </div></section>

      <div className="campus-culture campus-paper">
      <section className="campus-celebrity" aria-labelledby="campus-celebrity-title">
        <div className="campus-inner campus-celebrity-inner">
          <div className="campus-celebrity-info campus-reveal">
            <SectionTitle id="campus-celebrity-title" icon="icon-celebrity.svg"
              description={<ReferenceLines>{"DBS Global University's annual fest lights up the|stage with celebrated artists and performers,|bringing star-studded energy straight to campus."}</ReferenceLines>}>CELEBRITY ACT</SectionTitle>
            <CampusPhotoCarousel images={celebrity} variant="celeb" label="Celebrity visits" paused={paused} onPreview={showPhoto} />
          </div>
        </div>
        <FeaturedArtist paused={paused} />
      </section>

      <section className="campus-fest" aria-labelledby="campus-fest-title">
        <div className="campus-inner campus-fest-heading campus-reveal">
          <SectionTitle id="campus-fest-title" icon="icon-fest.svg">FEST</SectionTitle>
        </div>
        <CampusPhotoCarousel images={fest} variant="fest" label="Genesis festival" paused={paused} onPreview={showPhoto} />
        <div className="campus-inner campus-fest-copy campus-reveal">
          <p><ReferenceLines>At DBS Global University, education extends far beyond textbooks and lecture halls.|Vibrant campus life comes alive at Genesis—DGU’s flagship annual mega-fest.</ReferenceLines></p>
          <p><ReferenceLines>Evolving from the legacy of Manfest into a multidisciplinary national phenomenon, Genesis brings together|thousands of students from top universities across India. Spanning multiple days amidst the scenic backdrop|of Dehradun, Genesis is a high-octane blend of management grit, cultural artistry, technical brilliance, and|athletic excellence.</ReferenceLines></p>
          <p><ReferenceLines>{'Driven by DGU\'s core philosophy “Empowering by Learning”, the festival is entirely conceptualized, planned,|and managed by student committees, fostering leadership, teamwork, and event management skills.'}</ReferenceLines></p>
        </div>
      </section>
      </div>

      <section className="campus-events" aria-label="Events at Genesis">
        <div className="campus-inner campus-events-grid">{eventCards.map(card => <article key={card.label} className="campus-event campus-reveal">
          <h2>{card.label}</h2>
          <StepSlider className="campus-event-slider" label={`${card.label} events`} controls horizontalOnMobile pauseOnHover={false} mouseDrag paused={paused} interval={6000}>
          {card.photos.map(([image, alt]) => <div className="campus-event-slide" key={image}>
          <button className="campus-event-photo" type="button" onClick={() => showPhoto(image, alt)} aria-label={`Enlarge: ${alt}`}>
            <img src={A + image} alt={alt} loading="lazy" width={257} height={176} draggable={false} /><span aria-hidden="true">↗</span>
          </button>
          <h3>{card.label === 'TECH-FEST' ? <>Hackathons &amp;<br />Coding Battles:</> : card.title}</h3><p>{card.description}</p>
          </div>)}
          </StepSlider>
        </article>)}</div>
      </section>

      <div className="campus-residence campus-paper">
      <img className="campus-residence-building" src={A + 'hostel-building.webp'} alt="" aria-hidden="true" loading="lazy" />
      <section className="campus-clubs" aria-labelledby="campus-clubs-title"><div className="campus-inner">
        <div className="campus-split">
          <div className="campus-reveal">
            <SectionTitle id="campus-clubs-title" icon="icon-clubs.svg">STUDENTS<br />CLUBS &amp; COMMITTEES</SectionTitle>
            <CampusPhotoCarousel images={clubPhotos} variant="clubs" label="Student clubs" paused={paused} onPreview={showPhoto} />
          </div>
          <div className="campus-copy campus-reveal">
            <ExpandableText className="campus-clubs-description" previewWords={58} text={'Learning experience in a business school can and should never be restricted to academic classroom learning but rather focus on all round development of students. Every year students join DBS from all parts of the country and abroad, hence, bringing in values and interests from several different cultures. Enrolling for a club of their choice and organizing interesting activities throughout the year provides them an opportunity to know their peers better, learn to work in a team, under time and budget constraints. In myriad ways, it provides them a flavour of executing/organizing events and eventually, learning management lessons while having fun. More than 20 plus active clubs across diverse areas of stock markets, sports, cultural and communications help students learn new skills by organizing activities themselves under the guidance of faculty mentors. Active participation keeps the campus buzzing with activities throughout the year.'} />
          </div>
        </div>
        <CampusPhotoCarousel images={clubLogos} variant="logos" label="Student club logos" paused={paused} onPreview={showPhoto} />
      </div></section>

      <section className="campus-hostel" aria-labelledby="campus-hostel-title"><div className="campus-inner">
        <div className="campus-split campus-split--heading">
          <div className="campus-reveal"><SectionTitle id="campus-hostel-title" icon="icon-hostel.svg">HOSTEL &amp;<br />CAFETERIA</SectionTitle></div>
          <div className="campus-copy campus-reveal"><h3>Top reasons to live on campus</h3>
            <p><ReferenceLines>Choosing to live on campus can ease the transition to college life. Living on|campus means you will be more plugged-in to the campus community|and have more opportunities to join clubs, attend campus events, meet|new people and develop friendships.</ReferenceLines></p>
          </div>
        </div>
        <CampusPhotoCarousel images={hostel} variant="hostel" label="Hostel and cafeteria" paused={paused} onPreview={showPhoto} />
      </div></section>
      </div>

      <div className="campus-destination">
        <section className="campus-tour" aria-labelledby="campus-tour-title"><div className="campus-inner campus-tour-inner">
          <div className="campus-tour-copy campus-reveal">
            <SectionTitle id="campus-tour-title" icon="icon-tour.svg">International &amp;<br />Domestic Tour</SectionTitle>
            <p><ReferenceLines>{'Our International & Domestic Tour|program offers students immersive|learning experiences beyond the|classroom, exploring diverse cultures,|historical landmarks, and industry hubs|across India and abroad.'}</ReferenceLines></p>
            <p><ReferenceLines>These curated educational trips foster|global exposure, practical knowledge,|and holistic personal development.</ReferenceLines></p>
          </div>
          <div className="campus-tour-photos campus-reveal"><CampusPhotoCarousel images={tours} variant="tour" label="International and domestic tours" paused={paused} onPreview={showPhoto} /></div>
        </div></section>
      </div>
      <DehradunReveal />
    </main>
    <dialog ref={dialog} className="campus-lightbox" aria-label="Campus photograph" aria-describedby="campus-photo-caption"
      onCancel={event => { event.preventDefault(); closePhoto(); }} onClose={closePhoto}
      onClick={event => { if (event.target === event.currentTarget) closePhoto(); }}>
      <button type="button" className="campus-lightbox-close" autoFocus onClick={closePhoto} aria-label="Close photograph">×</button>
      {preview && <><img src={A + preview[0]} alt={preview[1]} /><p id="campus-photo-caption">{preview[1]}</p></>}
    </dialog>
  </div>;
}

export default function CampusOverview() { return <LocalPageShell className="campus-page-shell"><CampusOverviewContent/></LocalPageShell>; }
