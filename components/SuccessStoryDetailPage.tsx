'use client';

import { useCallback, useEffect, useState } from 'react';
import LocalPageShell from './LocalPageShell';
import InternalPageHero from './InternalPageHero';
import { requestHomepageData } from './homepage-api';
import { sitePath } from './site-base';
import './success-story-detail.css';

type StoryKind = 'startup' | 'higher';
const copy = {
  startup: {
    title: 'Startup & Entrepreneurial Success',
    eyebrow: 'Innovation · Enterprise · Impact',
    intro: 'Explore the startup and entrepreneurial success stories shared by DBS Global University.',
    alt: 'DBS Global University startup and entrepreneurial success story',
    back: 'Higher Education',
    backHref: '/higher-education/',
  },
  higher: {
    title: 'Higher Education',
    eyebrow: 'Academic Progression · Global Opportunities',
    intro: 'Explore the higher education journeys and achievements featured by DBS Global University.',
    alt: 'DBS Global University higher education success story',
    back: 'Startup & Entrepreneurial Success',
    backHref: '/startup-entrepreneurial-success/',
  },
} as const;

export default function SuccessStoryDetailPage({ kind }: { kind: StoryKind }) {
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const content = copy[kind];

  const load = useCallback(() => {
    setStatus('loading');
    requestHomepageData().then(data => {
      setImages(kind === 'startup' ? data.startupSuccess : data.higherEducation);
      setStatus('ready');
    }).catch(error => {
      console.warn('Success story detail feed unavailable.', error);
      setImages([]);
      setStatus('error');
    });
  }, [kind]);

  useEffect(() => { load(); }, [load]);

  return <LocalPageShell className="local-page internal-page success-story-detail-page">
    <a className="local-skip" href="#local-content">Skip to page content</a>
    <main className="local-page-main" id="local-content" aria-busy={status === 'loading'}>
      <InternalPageHero title={content.title} eyebrow={content.eyebrow} parent={{ label: 'Placements', href: sitePath('/placement-reports/') }} />
      <div className="internal-body">
        <section className="success-story-intro">
          <p>{content.intro}</p>
          <span>{images.length ? `${images.length} stories` : 'Student success stories'}</span>
        </section>
        {status === 'loading' ? <p className="success-story-status" role="status">Loading success stories…</p>
          : status === 'error' ? <div className="success-story-status" role="status"><p>These stories are temporarily unavailable.</p><button type="button" onClick={load}>Try again</button></div>
          : images.length ? <div className="success-story-grid">{images.map((image, index) => <figure className="success-story-card" key={`${image}-${index}`}><img src={image.startsWith('/') || /^https?:/.test(image) ? image : sitePath(`/assets/${image}.webp`)} alt={`${content.alt} ${index + 1}`} loading={index < 2 ? 'eager' : 'lazy'} /><figcaption><span>Success story</span><strong>{String(index + 1).padStart(2, '0')}</strong></figcaption></figure>)}</div>
          : <p className="success-story-status" role="status">No stories are available at the moment.</p>}
        <nav className="success-story-switch" aria-label="Other success stories"><a href={sitePath(content.backHref)}>Explore {content.back} <span aria-hidden="true">→</span></a><a href={sitePath('/placement-reports/')}>Back to Placements <span aria-hidden="true">→</span></a></nav>
      </div>
    </main>
  </LocalPageShell>;
}
