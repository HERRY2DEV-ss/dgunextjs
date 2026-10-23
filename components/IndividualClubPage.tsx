import { Suspense } from 'react';
import LocalPageShell from './LocalPageShell';
import ClubApiPage, { ClubLoading } from './ClubApiPage';
import styles from './ClubDetailPage.module.css';

export default function IndividualClubPage({ slug }: { slug: string }) {
  return <LocalPageShell className={`local-page ${styles.clubShell}`}>
    <Suspense fallback={<ClubLoading />}><ClubApiPage slug={slug} /></Suspense>
  </LocalPageShell>;
}
