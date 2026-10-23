'use client';

import { useEffect, useId, useState } from 'react';
import { type NewsTab, type NewsItem } from './news-api';
import { requestArchiveNews } from './news-archive-api';
import { newsItemHref, newsListingHref } from './news-routes';

const categories: { tab: NewsTab; label: string }[] = [
  { tab: 'campus', label: 'Campus & Events' },
  { tab: 'placements', label: 'Placement Updates' },
  { tab: 'admissions', label: 'Admission Notices' },
];

export default function NavigationNewsList({ tab }: { tab: NewsTab }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(9);
  const searchId = useId();
  const category = categories.find(item => item.tab === tab)!;
  const term = query.trim().toLowerCase();
  const filtered = items.filter(item => `${item.title} ${item.text} ${item.date}`.toLowerCase().includes(term));

  useEffect(() => {
    let active = true;
    setStatus('loading');
    requestArchiveNews(tab).then(next => {
      if (active) { setItems(next); setStatus('ready'); setVisibleCount(9); }
    }).catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [tab, attempt]);

  return <section className="local-news-archive" aria-label={category.label} aria-busy={status === 'loading'}>
    <div className="local-news-toolbar">
      <nav className="local-category-links" aria-label="News categories">{categories.map(item => <a key={item.tab} href={newsListingHref(item.tab)} aria-current={item.tab === tab ? 'page' : undefined}>{item.label}</a>)}</nav>
      <div className="local-news-search"><label htmlFor={searchId}>Search {category.label.toLowerCase()}</label><div><input id={searchId} type="search" placeholder="Search stories…" value={query} onChange={event => { setQuery(event.target.value); setVisibleCount(9); }} />{query && <button type="button" aria-label="Clear news search" onClick={() => { setQuery(''); setVisibleCount(9); }}>×</button>}</div></div>
    </div>
    {status === 'loading' ? <div className="local-news-loading"><p role="status">Loading the latest updates…</p><div className="local-news-skeletons" aria-hidden="true">{[0, 1, 2].map(key => <div key={key}><span /><i /><i /></div>)}</div></div>
      : status === 'error' ? <div className="local-news-empty" role="alert"><h2>Updates are temporarily unavailable</h2><p>Please try loading this category again.</p><button type="button" className="local-retry" onClick={() => setAttempt(value => value + 1)}>Try again <span aria-hidden="true">↗</span></button></div>
      : <>
        <p className="local-news-result-count" role="status">{filtered.length} {filtered.length === 1 ? 'story' : 'stories'}{term ? ` matching “${query.trim()}”` : ` · ${category.label}`}</p>
        {filtered.length ? <div className="local-news-grid">{filtered.slice(0, visibleCount).map(item => <article key={item.id} className="local-news-card">
          <a className="local-news-photo" href={newsItemHref(item.href, tab)} tabIndex={-1} aria-hidden="true">{item.image ? <img src={item.image} alt="" width="420" height="280" loading="lazy" decoding="async" /> : <div className="local-news-photo-placeholder"><span>DGU</span><i aria-hidden="true">↗</i></div>}</a>
          <div className="local-news-card-copy"><p className="local-news-date"><span>{category.label}</span>{item.date && <span>{item.date}</span>}</p><h2><a href={newsItemHref(item.href, tab)}>{item.title}</a></h2>{item.text && <p className="local-news-excerpt">{item.text}</p>}<a className="local-news-more" href={newsItemHref(item.href, tab)} aria-label={`Read more: ${item.title}`}>Read story <span aria-hidden="true">↗</span></a></div>
        </article>)}</div> : <div className="local-news-empty"><h2>{term ? 'No matching stories' : 'More stories are on the way'}</h2><p>{term ? 'Try a different keyword or clear the search to see all updates.' : 'Check back for the latest announcements in this category.'}</p>{term && <button type="button" className="local-retry" onClick={() => { setQuery(''); setVisibleCount(9); }}>Clear search</button>}</div>}
        {filtered.length > visibleCount && <div className="local-news-load-more"><button type="button" className="local-button" onClick={() => setVisibleCount(count => count + 9)}>Show more stories <span aria-hidden="true">↓</span></button><span>Showing {Math.min(visibleCount, filtered.length)} of {filtered.length}</span></div>}
      </>}
  </section>;
}
