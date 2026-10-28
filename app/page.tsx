'use client';
import { sitePath } from '../components/site-base';

import SlidingTabList from '../components/SlidingTabList';

import { useEffect, useRef, useState } from 'react';
import Navigation from '../components/Navigation';
import SiteFooter from '../components/SiteFooter';
import SmoothScrolling from '../components/SmoothScrolling';
import SchoolsProgramsSection from '../components/SchoolsProgramsSection';
import BatchSlider from '../components/StepSlider';
import HomepagePlacementCopy from '../components/HomepagePlacementCopy';
import LifeScroll from '../components/LifeScroll';
import GlobalLearning from '../components/GlobalLearning';
import DehradunReveal from '../components/DehradunReveal';
import InlineVideo from '../components/InlineVideo';
import AboutSection from '../components/AboutSection';
import HomeDifferentiators from '../components/HomeDifferentiators';
import RecruitersSection from '../components/RecruitersSection';
import PlacementVideoCard from '../components/PlacementVideoCard';
import PlacementRelatedVideos from '../components/PlacementRelatedVideos';
import NewsUpdatesSection from '../components/NewsUpdatesSection';
import { requestHomepageData, type HomepageData } from '../components/homepage-api';
import usePlacements from '../components/usePlacements';
import PlacementStudentCard from '../components/PlacementStudentCard';
import PlacementsFeedback from '../components/PlacementsFeedback';
import AnimatedHeroSlider from '../components/AnimatedHeroSlider';
import type { HeroSlide } from '../components/AnimatedHeroSlider';

const asset = (name: string) => name.startsWith('/') || /^https?:/.test(name) ? name : sitePath(`/assets/${name}.webp`);
const homepageHeroSlides: HeroSlide[] = [
  { image: 'https://dgu.ac.in/oldv1/images/slides/banner1.jpg', alt: 'DBS Global University banner 1' },
  { image: 'https://dgu.ac.in/oldv1/images/slides/banner4.jpg', alt: 'DBS Global University banner 4' },
  { image: 'https://dgu.ac.in/oldv1/images/slides/banner7.jpg', alt: 'DBS Global University banner 7' },
  { image: 'https://dgu.ac.in/oldv1/images/slides/banner8.jpg', alt: 'DBS Global University banner 8' },
];
type Viewer = { title: string; image?: string; text?: string; video?: string; related?: boolean };
type OutcomeTab = 'placements' | 'startup' | 'higher';

/* Add future placement videos here. Every item automatically shares the same
   vertical slider, dots, swipe and keyboard controls. */
const placementVideos = [
  { image:sitePath('/placement-assets/video-poster.webp'), title:'Placement Short 1', text:'Student placement success story from DBS Global University.', video:sitePath('/assets/short1.mp4') },
  { image:sitePath('/placement-assets/video-poster.webp'), title:'Placement Short 2', text:'Student placement success story from DBS Global University.', video:sitePath('/assets/short2.mp4') },
  { image:sitePath('/placement-assets/video-poster.webp'), title:'Placement Short 3', text:'Student placement success story from DBS Global University.', video:sitePath('/assets/short3.mp4') },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [outcomeTab, setOutcomeTab] = useState<OutcomeTab>('placements');
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [homepageData, setHomepageData] = useState<HomepageData | null>(null);
  const [homepageAttempt, setHomepageAttempt] = useState(0);
  const [homepageStatus, setHomepageStatus] = useState<{ attempt: number; status: 'ready' | 'error' }>({ attempt: -1, status: 'ready' });
  const motionStopped = menuOpen || Boolean(viewer);
  const placements=usePlacements('', false);
  const placementStudents=placements.data?.students || [];
  const [openPlacement,setOpenPlacement]=useState<string | null>(null);

  const homepageLoading = homepageStatus.attempt !== homepageAttempt;
  const startupImages = !homepageLoading ? homepageData?.startupSuccess || [] : [];
  const higherEducationImages = !homepageLoading ? homepageData?.higherEducation || [] : [];
  const homepageFeedback = (hasImages: boolean) => homepageLoading ? <p role="status">Loading success stories…</p>
    : homepageStatus.status === 'error' ? <div role="status"><p>Success stories are temporarily unavailable.</p><button type="button" className="text-link" onClick={() => setHomepageAttempt(value => value + 1)}>Try again</button></div>
    : !hasImages ? <p role="status">No success stories are available yet.</p> : null;

  useEffect(() => {
    let active = true;
    let started = false;
    let observer: IntersectionObserver | undefined;
    const load = () => {
      if (started) return;
      started = true;
      observer?.disconnect();
      requestHomepageData()
        .then(data => {
          if (!active) return;
          setHomepageData(data);
          setHomepageStatus({ attempt: homepageAttempt, status: 'ready' });
        })
        .catch(error => {
          console.warn('Startup/higher education feed unavailable.', error);
          if (active) { setHomepageData(null); setHomepageStatus({ attempt: homepageAttempt, status: 'error' }); }
        });
    };
    const section = document.getElementById('placements');
    if (section && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) load(); }, { rootMargin: '800px 0px' });
      observer.observe(section);
    } else load();
    return () => {
      active = false;
      observer?.disconnect();
    };
  }, [homepageAttempt]);

  useEffect(() => {
    if (viewer && !dialog.current?.open) dialog.current?.showModal();
    if (!viewer && dialog.current?.open) dialog.current?.close();
  }, [viewer]);

  useEffect(() => {
    if (!viewer) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [viewer]);

  const show = (title: string, image?: string, text?: string, video?: string, related = false) => setViewer({ title, image, text, video, related });
  return <>
    <SmoothScrolling disabled={motionStopped} />
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="hero" id="home">
      <h1 className="visually-hidden">DBS Global University Dehradun</h1>
      <link rel="preload" as="image" href={homepageHeroSlides[0].image} fetchPriority="high" />
      <AnimatedHeroSlider className="homepageHeroSlider" variant="home" aspectRatio="1920 / 708"
        slides={homepageHeroSlides} label="DBS Global University highlights" paused={motionStopped} interval={5200} />
      <Navigation onOpenChange={setMenuOpen} />
    </header>


    <main id="main">
      <AboutSection />
      <SchoolsProgramsSection />

      <HomeDifferentiators />

      <section className="placements-section content-width" id="placements" aria-label="Student outcomes">
        {/* <h2 className="outcomes-title" id="outcomes-title">What you get with us by your side</h2> */}
        <SlidingTabList activeKey={outcomeTab} className={`outcomes-tabs tab-${outcomeTab}`} role="tablist" aria-label="Student outcomes">
          <button className={`outcomes-tab ${outcomeTab==='placements'?'is-active':''}`} id="placements-tab" type="button" role="tab" aria-selected={outcomeTab==='placements'} aria-controls="outcomes-panel" onClick={()=>setOutcomeTab('placements')}><span>Placements</span></button>
          <button className={`outcomes-tab ${outcomeTab==='startup'?'is-active':''}`} id="startup-tab" type="button" role="tab" aria-selected={outcomeTab==='startup'} aria-controls="outcomes-panel" onClick={()=>setOutcomeTab('startup')}><span>Startup &amp; Entrepreneurial Success</span></button>
          <button className={`outcomes-tab ${outcomeTab==='higher'?'is-active':''}`} id="higher-tab" type="button" role="tab" aria-selected={outcomeTab==='higher'} aria-controls="outcomes-panel" onClick={()=>setOutcomeTab('higher')}><span>Higher Education</span></button>
        </SlidingTabList>
        <div className="placement-overview" id="outcomes-panel" role="tabpanel" aria-labelledby={`${outcomeTab}-tab`}>
          {outcomeTab==='placements' ? <div className="outcome-panel-content outcome-placement" key="placements">
            <div className="homepage-placement-media">
              <div className="homepage-placement-column">
              {placementVideos.length > 0 && <BatchSlider className="placement-media-slider" label="Placement success videos" size={1} interval={5200} paused={motionStopped} vertical controls dots>
                {placementVideos.map(video => <div className="placement-media-pair" key={video.title}>
                  <PlacementVideoCard src={video.video} poster={asset(video.image)} title={video.title} paused={motionStopped}
                    onOpen={()=>show(video.title,video.image,video.text,video.video,true)} />
                </div>)}
              </BatchSlider>}
              </div>
              <div className="homepage-placement-column">
              {placementStudents.length > 0 ? <BatchSlider className="placement-media-slider" label="Placed students" size={1} interval={5200} paused={motionStopped || openPlacement!==null} vertical controls dots>
                {placementStudents.map((student, index) => <div className="placement-media-pair" key={`${student.id}|${index}`}>
                  <PlacementStudentCard student={student} open={openPlacement===`${student.id}|${index}`} onToggle={()=>setOpenPlacement(value=>value===`${student.id}|${index}` ? null : `${student.id}|${index}`)} onClose={()=>setOpenPlacement(null)} />
                </div>)}
              </BatchSlider> : <PlacementsFeedback state={placements} />}
              </div>
            </div>
            <HomepagePlacementCopy />
          </div> : outcomeTab==='startup' ? <div className="outcome-panel-content outcome-story" key="startup">
            {homepageFeedback(startupImages.length > 0)}
            {startupImages.length > 0 && <BatchSlider className="outcome-story-slider" label="Startup and entrepreneurial success stories" size={2} interval={5500} paused={motionStopped} vertical controls>
              {startupImages.map((image,index)=><article className="outcome-story-card" key={`${image}-${index}`}><img src={asset(image)} alt="DBS Global Startup and Entrepreneurial Success" loading="lazy" /></article>)}
            </BatchSlider>}
            <div className="outcome-story-copy"><h2 className="outcome-tiered-heading"><span className="outcome-bold-line">STARTUP &amp;</span><span className="outcome-light-lines"><span>ENTREPRENEURIAL</span><span>SUCCESS</span></span></h2></div>
          </div> : <div className="outcome-panel-content outcome-story" key="higher">
            {homepageFeedback(higherEducationImages.length > 0)}
            {higherEducationImages.length > 0 && <BatchSlider className="outcome-story-slider" label="Higher education success stories" size={2} interval={5500} paused={motionStopped} vertical controls>
              {higherEducationImages.map((image,index)=><article className="outcome-story-card" key={`${image}-${index}`}><img src={asset(image)} alt="DBS Global University student success" loading="lazy" /></article>)}
            </BatchSlider>}
            <div className="outcome-story-copy"><h2 className="outcome-tiered-heading"><span className="outcome-bold-line">CAREER SUCCESS IN</span><span className="outcome-light-lines"><span>HIGHER EDUCATION</span></span></h2></div>
          </div>}
        </div>
        <RecruitersSection paused={motionStopped} />
      </section>

      <NewsUpdatesSection paused={motionStopped} id="news" />

      <GlobalLearning paused={motionStopped} />

      <LifeScroll onImage={(title,image)=>show(title,image)} />
      <DehradunReveal />
    </main>

    <SiteFooter />

    <dialog className="media-dialog" ref={dialog} onCancel={() => setViewer(null)} onClose={() => setViewer(null)} onClick={event => { if (event.target === event.currentTarget) setViewer(null); }}>
      {viewer && <div className={`dialog-content${viewer.related ? ' dialog-content--related' : ''}`}><button className="dialog-close" onClick={() => setViewer(null)} aria-label="Close viewer" autoFocus>×</button><h2>{viewer.title}</h2>{viewer.related ? <div className="placement-video-dialog-layout"><div className="placement-video-dialog-main">{viewer.video ? <InlineVideo key={viewer.video} controls src={viewer.video} poster={asset(viewer.image || "hero-campus")} title={viewer.title} /> : viewer.image ? <img src={asset(viewer.image)} alt={viewer.title} /> : null}{viewer.text && <p>{viewer.text}</p>}</div><PlacementRelatedVideos /></div> : <>{viewer.video ? <InlineVideo key={viewer.video} controls src={viewer.video} poster={asset(viewer.image || "hero-campus")} title={viewer.title} /> : viewer.image ? <img src={asset(viewer.image)} alt={viewer.title} /> : null}{viewer.text && <p>{viewer.text}</p>}</>}</div>}
    </dialog>
  </>;
}
