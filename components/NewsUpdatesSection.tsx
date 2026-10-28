'use client';
import SlidingTabList from './SlidingTabList';
import imageStyles from './news-images.module.css';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { newsItemHref, newsListingHref, PLACEMENTS_HREF } from './news-routes';
import StepSlider from './StepSlider';
import { requestNews, type NewsItem, type NewsTab } from './news-api';
export type { NewsItem } from './news-api';
export type NewsUpdatesData = Record<NewsTab, NewsItem[]>;

type NewsState = { items: NewsItem[]; status: 'loading' | 'ready' | 'error' };
const initialState = (): Record<NewsTab, NewsState> => ({
  campus: { items: [], status: 'loading' },
  placements: { items: [], status: 'loading' },
  admissions: { items: [], status: 'loading' },
});
const tabs: readonly NewsTab[] = ['campus', 'placements', 'admissions'];
const labels: Record<NewsTab, string> = { campus: 'Campus News', placements: 'Placement Updates', admissions: 'Admission News' };
const cardHref = (item: NewsItem, tab: NewsTab) => newsItemHref(item.href || item.sourceHref || '', tab);

function NewsImage({ item, tab, placement = false }: { item: NewsItem; tab: NewsTab; placement?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [item.image]);
  const image = !item.image || failed
    ? <span className="news-image-placeholder" aria-hidden="true">DGU <span>↗</span></span>
    : <img className={imageStyles.image} src={item.image} onError={() => setFailed(true)} alt={item.title} loading="lazy" width={placement ? 502 : 380} height={placement ? 312 : 232} />;
  return <a className={`${placement ? '' : 'news-image '}${imageStyles.media}`} href={cardHref(item, tab)} aria-label={item.title}>{image}</a>;
}
function ReadMore({ item, tab }: { item: NewsItem; tab: NewsTab }) {
  return <a className="text-link" href={cardHref(item, tab)} aria-label={`Read more: ${item.title}`}>Read More <span aria-hidden="true">→</span></a>;
}

export default function NewsUpdatesSection({ paused = false, id = 'news', schoolUrl }: {
  paused?: boolean; id?: string; schoolUrl?: string;
}) {
  const [tab, setTab] = useState<NewsTab>('campus');
  const [news, setNews] = useState(initialState);
  const mounted = useRef(false);
  const generation = useRef(0);
  const section = useRef<HTMLElement>(null);
  const load = useCallback((category: NewsTab) => {
    const version = generation.current;
    setNews(previous => ({ ...previous, [category]: { items: [], status: 'loading' } }));
    requestNews(category, schoolUrl === undefined ? {} : { SCHOOL_URL: schoolUrl }).then(items => {
      if (mounted.current && version === generation.current) setNews(previous => ({ ...previous, [category]: { items, status: 'ready' } }));
    }).catch(error => {
      if (!mounted.current || version !== generation.current) return;
      console.warn(`Unable to load ${labels[category]}:`, error instanceof Error ? error.message : 'Request failed');
      if (mounted.current && version === generation.current) setNews(previous => ({ ...previous, [category]: { items: [], status: 'error' } }));
    });
  }, [schoolUrl]);
  useEffect(() => {
    mounted.current = true;
    let observer: IntersectionObserver | undefined;
    const start = () => { tabs.forEach(load); observer?.disconnect(); };
    if (section.current && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) start();
      }, { rootMargin: '1000px 0px' });
      observer.observe(section.current);
    } else start();
    return () => { mounted.current = false; generation.current++; observer?.disconnect(); };
  }, [load]);
  const current = news[tab];
  const switchTab = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); setTab(tabs[next]); document.getElementById(`${id}-${tabs[next]}-tab`)?.focus();
  };

  return <section ref={section} className="post-recruiter-tabs content-width" id={id} aria-label="University updates and news">
    <SlidingTabList activeKey={tab} className={`outcomes-tabs secondary-tabs tab-${tab}`} role="tablist" aria-label="University updates">
      {tabs.map((category, index) => <button key={category} className={`outcomes-tab ${tab === category ? 'is-active' : ''}`} id={`${id}-${category}-tab`} type="button" role="tab" tabIndex={tab === category ? 0 : -1} aria-selected={tab === category} aria-controls={`${id}-panel`} onKeyDown={event => switchTab(event, index)} onClick={() => setTab(category)}><span>{labels[category]}</span></button>)}
    </SlidingTabList>
    <div className="post-recruiter-panel" id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${tab}-tab`} aria-busy={current.status === 'loading'}>
      {current.status === 'loading' ? <p role="status">Loading updates…</p>
        : current.status === 'error' ? <div role="status"><p>Updates are temporarily unavailable.</p><button type="button" className="text-link" onClick={() => load(tab)}>Try again</button></div>
        : current.items.length === 0 ? <p role="status">No updates available.</p>
        : tab === 'campus' ? <div className="tab-news-content campus-news" key="campus">
          <div className="section-heading"><h2>Campus News</h2><p>Discover vibrant life &amp; events</p></div>
          <StepSlider className="compact-news-slider campus-news-slider" label="Campus news" size={Math.min(3, current.items.length)} interval={5600} paused={paused} horizontalOnMobile controls dots>
            {current.items.map(item => <article className="simple-news-card campus-news-card" key={item.id}>
              <NewsImage item={item} tab={tab} />
              <div>{item.date && <time>{item.date}</time>}<h3><a href={cardHref(item, tab)}>{item.title}</a></h3>{item.text && <p className="news-excerpt">{item.text}</p>}<ReadMore item={item} tab={tab} /></div>
            </article>)}
          </StepSlider>
        </div> : tab === 'placements' ? <div className="tab-news-content tab-placement-updates" key="placements">
          <div className="section-heading"><h2>Placement Updates</h2><p>Career milestones from our university community</p></div>
          <StepSlider className="updates-track" label={labels[tab]} size={Math.min(3, current.items.length)} interval={6500} paused={paused} horizontalOnMobile controls>
            {current.items.map(item => <article className="update-card" key={item.id}>
              <NewsImage item={item} tab={tab} placement />
              {item.date && <time className="update-date">{item.date}</time>}<div className="update-copy"><h3><a href={cardHref(item, tab)}>{item.title}</a></h3>{item.text && <p className="news-excerpt">{item.text}</p>}<ReadMore item={item} tab={tab} /></div>
            </article>)}
          </StepSlider>
        </div> : <div className="tab-news-content admission-news" key="admissions">
          <div className="section-heading"><h2>Admission News</h2><p>Important updates &amp; deadlines</p></div>
          <StepSlider className="compact-news-slider admission-news-slider" label="Admission news" size={Math.min(3, current.items.length)} interval={5600} paused={paused} vertical horizontalOnMobile controls dots>
            {current.items.map(item => <article className="simple-news-card admission-news-card" key={item.id}>
              {item.date && <time>{item.date}</time>}<h3><a href={cardHref(item, tab)}>{item.title}</a></h3>{item.text && <p className="news-excerpt">{item.text}</p>}<ReadMore item={item} tab={tab} />
            </article>)}
          </StepSlider>
        </div>}
    </div>
    <div className="news-section-actions"><a className="text-link" href={tab === 'placements' ? PLACEMENTS_HREF : newsListingHref(tab)}>{tab === 'placements' ? 'View Placements' : `View all ${labels[tab]}`} <span aria-hidden="true">→</span></a></div>
  </section>;
}
