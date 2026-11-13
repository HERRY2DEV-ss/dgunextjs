'use client';
import { useEffect, useState } from 'react';
import LocalPageShell from './LocalPageShell';
import ExpandableText from './ExpandableText';
import LocalGallery from './LocalGallery';
import AdmissionsVideo from './AdmissionsVideo';
import PageTitleStrip from './PageTitleStrip';
import { SITE_BASE } from './site-routes';
import { fetchClubs, type ClubSummary } from './club-detail-api';
import './clubs-committees.css';

const assets = `${SITE_BASE}/assets/clubs`;
const sportsVideo = process.env.NEXT_PUBLIC_CLUBS_VIDEO_URL?.trim();
const introduction = 'Learning experience in a business school can and should never be restricted to academic classroom learning but rather focus on all round development of students. Every year students join DBS from all parts of the country and abroad, hence, bringing in values and interests from several different cultures.';
const introductionMore = 'Enrolling for a club of their choice and organizing interesting activities throughout the year provides them an opportunity to know their peers better, learn to work in a team, under time and budget constraints. In myriad ways, it provides them a flavour of executing/organizing events and eventually, learning management lessons while having fun. More than 20 plus active clubs across diverse areas of stock markets, sports, cultural and communications help students learn new skills by organizing activities themselves under the guidance of faculty mentors. Active participation keeps the campus buzzing with activities throughout the year.';

// Approved frame colours only. Names, logos, links and ordering come from the API.
const clubColours: Record<string, string> = {
  'robotics-and-automation-club': '#21accb', 'the-marketing-club': '#712cc5',
  'bulls-and-bears-club': '#2a2450', 'badminton-club': '#edc355',
  'basketball-club': '#ee7620', '8-ball-pool-club': '#813a80',
  'music-club': '#fda31b', 'dance-club': '#ee5f8b', 'drama-club': '#de211f',
  'bagpackers-club': '#ffa001', 'the-social-welfare-club': '#1196bf',
  'rotaract-club': '#df1507', 'the-spectrum-club': '#f7256c',
  'football-club': '#3b3853', 'stargazers-club': '#7e49e2',
  'innoventures-entrepreneurship-club': '#2498d3', 'phoenix-media-club': '#f9ad1b',
  'fit-dont-quit-club': '#fc9d27', 'empirical-minds-club': '#007900',
};

function ClubFrame({ colour }: { colour: string }) {
  return <svg className="clubs-card-frame" viewBox="36.216 448.612 174.807 68.759" fill="none" aria-hidden="true" focusable="false">
    <path d="M81.727 469.545H187.886C200.611 469.545 211.022 479.956 211.022 492.681C211.022 505.407 200.611 515.818 187.886 515.818H81.727" stroke="#d2d3d5" strokeWidth="0.5" />
    <path d="M53.095 467.98C45.255 465.257 39.819 458.485 36.216 448.612V485.572C36.216 508.073 54.091 517.371 68.647 515.173C95.154 511.171 93.472 473.949 67.001 470.396C62.574 469.801 58.003 469.685 53.095 467.98Z" fill={colour} />
    <circle cx="65.097" cy="492.873" r="18.15" fill="white" />
  </svg>;
}

export default function ClubsCommitteesPage() {
  const [clubs, setClubs] = useState<ClubSummary[]>();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    fetchClubs().then(data => { if (current) setClubs(data); })
      .catch(() => { if (current) setFailed(true); });
    return () => { current = false; };
  }, [attempt]);
  return <LocalPageShell className="local-page clubs-page">
    <a className="local-skip" href="#clubs-content">Skip to clubs and committees</a>
    <main className="clubs-main" id="clubs-content">
      <header className="clubs-hero" data-navigation-opening>
        <div className="clubs-banner-band"><img className="clubs-banner" src={`${assets}/basketball-banner.webp`} alt="Students playing basketball. Teamwork makes dreamwork." width="1643" height="523" fetchPriority="high" /></div>
      </header>
      <PageTitleStrip title="STUDENTS CLUBS & COMMITTEES" />

      <section className="clubs-introduction" aria-label="Student clubs at DBS Global University">
        <ExpandableText text={`${introduction} ${introductionMore}`} previewWords={introduction.split(/\s+/).length} className="clubs-intro-copy" />
      </section>

      <div className={`clubs-sports${sportsVideo ? ' clubs-sports--video' : ''}`}>
        {sportsVideo
          ? <AdmissionsVideo src={sportsVideo} poster={`${assets}/sports-poster.webp`} stats={[]} variant="program" />
          : <LocalGallery title="Campus sports" photos={[{ src: `${assets}/sports-poster.webp`, alt: 'Football and sporting activities at DBS Global University' }]} />}
      </div>

      <section className="clubs-directory" aria-labelledby="clubs-directory-title">
        <h2 id="clubs-directory-title">CLUBS &amp;<br />COMMITTEES</h2>
        {failed ? <div className="clubs-status" role="status"><p>Clubs are temporarily unavailable.</p><button type="button" onClick={() => { setFailed(false); setAttempt(value => value + 1); }}>Try again</button></div>
          : !clubs ? <p className="clubs-status" role="status" aria-busy="true">Loading clubs…</p>
            : !clubs.length ? <p className="clubs-status">No clubs are currently available.</p>
              : <ul className="clubs-grid">{clubs.map((club, index) => {
                const content = <><ClubFrame colour={clubColours[club.slug] || '#68176b'} />
                  {club.image && <span className="clubs-card-logo" aria-hidden="true"><img src={club.image} alt="" width="150" height="150" loading="lazy" decoding="async" /></span>}
                  <span className="clubs-card-label">{club.name}</span></>;
                return <li key={club.id} className={`clubs-card${index % 2 ? ' clubs-card--right' : ''}`}>
                  {club.href ? <a className="clubs-card-content" href={club.href}>{content}</a> : <div className="clubs-card-content">{content}</div>}
                </li>;
              })}</ul>}
      </section>
    </main>
  </LocalPageShell>;
}
