'use client';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import StepSlider from './StepSlider';
import ExpandableText from './ExpandableText';
import { requestReviews, type Review } from './reviews-api';

export function ReviewCard({ review }: { review: Review }) {
  const [failed, setFailed] = useState(false);
  const long = review.text.length > 420;
  useEffect(() => setFailed(false), [review.image]);
  const initials = review.name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('') || 'DGU';
  return <figure className="dgu-review-card">
    {review.rating !== null && <div className="dgu-review-rating" aria-label={review.rating + ' out of 5 stars'}><span aria-hidden="true">{'★'.repeat(Math.floor(review.rating))}</span> <span aria-hidden="true">{review.rating}/5</span></div>}
    <blockquote className="dgu-review-copy">{long ? <ExpandableText text={review.text} /> : <p>{review.text}</p>}</blockquote>
    <figcaption>
      {review.image && !failed ? <img src={review.image} alt="" width="52" height="52" loading="lazy" onError={() => setFailed(true)} /> : <span className="dgu-review-initials" aria-hidden="true">{initials}</span>}
      <div>{review.name && <strong>{review.name}</strong>}{review.designation && <span>{review.designation}</span>}{review.program && <span>{review.program}</span>}</div>
    </figcaption>
  </figure>;
}

export default function ReviewsSection({ paused = false, id }: { paused?: boolean; id?: string }) {
  const uniqueId = useId();
  const sectionId = id || `reviews-${uniqueId}`;
  const root = useRef<HTMLElement>(null);
  const mounted = useRef(false);
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'error'; items: Review[] }>({ status: 'loading', items: [] });
  const load = useCallback(() => {
    setState({ status: 'loading', items: [] });
    requestReviews().then(items => { if (mounted.current) setState({ status: 'ready', items }); })
      .catch(() => { if (mounted.current) setState({ status: 'error', items: [] }); });
  }, []);
  useEffect(() => {
    mounted.current = true;
    let started = false;
    let observer: IntersectionObserver | undefined;
    const start = () => { if (started) return; started = true; observer?.disconnect(); load(); };
    if (root.current && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) start(); }, { rootMargin: '600px 0px' });
      observer.observe(root.current);
    } else start();
    return () => { mounted.current = false; observer?.disconnect(); };
  }, [load]);
  return <section className="dgu-reviews content-width" id={sectionId} ref={root} aria-labelledby={sectionId + '-title'}>
    <div className="section-heading"><h2 id={sectionId + '-title'}>Reviews</h2></div>
    <div aria-busy={state.status === 'loading'}>
      {state.status === 'loading' ? <p role="status">Loading reviews…</p>
        : state.status === 'error' ? <div role="status"><p>Reviews are temporarily unavailable.</p><button className="text-link" type="button" onClick={load}>Try again</button></div>
        : !state.items.length ? <p role="status">No reviews available yet.</p>
        : <StepSlider className="dgu-reviews-slider" label="University reviews" size={3} interval={6500} horizontalOnMobile controls dots paused={paused}>
          {state.items.map(review => <ReviewCard key={review.id} review={review} />)}
        </StepSlider>}
    </div>
  </section>;
}
