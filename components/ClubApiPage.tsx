'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ClubDetailPage from './ClubDetailPage';
import { fetchClubPage } from './club-detail-api';
import type { ClubPageData } from './club-detail-types';
import styles from './ClubDetailPage.module.css';

export function ClubLoading() { return <main className={styles.status} aria-busy="true"><span className={styles.spinner} aria-hidden="true" /><p>Loading club details…</p></main>; }

export default function ClubApiPage({ slug: suppliedSlug }: { slug?: string }) {
  const search = useSearchParams();
  const slug = (suppliedSlug || search.get('slug') || '').trim();
  const [result, setResult] = useState<{ slug: string; data?: ClubPageData; failed?: boolean }>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!slug || !/^[a-z0-9][a-z0-9-]*$/i.test(slug)) return;
    const controller = new AbortController();
    fetchClubPage(slug, controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ slug, data });
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ slug, failed: true });
    });
    return () => controller.abort();
  }, [slug, attempt]);
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/i.test(slug)) return <main className={styles.status}><p>Please select a club.</p></main>;
  if (result?.slug === slug && result.data) return <ClubDetailPage key={slug} data={result.data} />;
  if (result?.slug === slug && result.failed) return <main className={styles.status} role="status"><p>Club details are temporarily unavailable.</p><button type="button" onClick={() => { setResult(undefined); setAttempt(value => value + 1); }}>Try again</button></main>;
  return <ClubLoading />;
}
