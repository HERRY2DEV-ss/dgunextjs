'use client';
import SlidingTabList from './SlidingTabList';

import { useRef, useState, type KeyboardEvent, type CSSProperties } from 'react';
import LocalPageShell, { usePageMenuOpen } from './LocalPageShell';
import StepSlider from './StepSlider';
import NewsUpdatesSection from './NewsUpdatesSection';
import AdmissionsVideo from './AdmissionsVideo';
import { PlacementCounter, usePlacementMotion } from './placement-motion';
import ExpandableText from './ExpandableText';
import data from './placement-page-data.json';
import type { LocalPage } from './local-pages';
import { SITE_BASE, sitePath } from './site-base';
import './placement-reports.css';

const sectorYears = ['2026', '2025', '2024'] as const;
const categoryLabels = ['Consulting companies', 'IT companies', 'FMCG companies', 'Cement companies', 'Home construction'];
const companyCategories = [data.categories[1], data.categories[2], data.categories[3], data.categories[4], data.categories[5]];
const placementStats = data.design.stats.map(stat => [`${stat.value}${stat.suffix}`, stat.label] as const);

// Retain every original report row without rendering the removed career-path panel.
export function placementReportTables(source: string) {
  return (source.match(/<table>[\s\S]*?<\/table>/gi) || []).filter(table => /Company Name/.test(table));
}

function PlacementImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? <span className={`placement-image-fallback ${className}`}>{alt}</span> : <img className={className} src={sitePath(src)} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}
function StudentCard({ student }: { student: { name: string; company: string; image: string; logo?: string; artwork?: boolean } }) {
  return <article className={`placement-student${student.artwork ? ' placement-student--artwork' : ''}`}><div className="placement-student-photo"><PlacementImage src={student.image} alt={`${student.name} · ${student.company}`} /></div>{student.logo && <div className="placement-student-logo"><PlacementImage src={student.logo} alt={student.company} /></div>}<div className="placement-student-copy"><h3>{student.name}</h3><p>{student.company}</p></div></article>;
}
function tabKeys(event: KeyboardEvent<HTMLButtonElement>, index: number, count: number, select: (index: number) => void) {
  const next = event.key === 'ArrowRight' ? (index + 1) % count : event.key === 'ArrowLeft' ? (index + count - 1) % count : event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : null;
  if (next === null) return;
  event.preventDefault(); select(next);
  (event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next])?.focus();
}


const preparation = [
  { title: <>Hiring simulations<br />before the real thing</>, lines: ['Students go through multiple', 'hiring simulations before facing', 'actual recruiters - mock GDs,', 'panel interviews, CV workshops,', 'and direct sessions with industry', 'leaders. Every round brings', 'correction, feedback, and', 'growth.'] },
  { title: <>Personalised,<br />not generic</>, lines: ['The Career Development Cell', 'works with each student', 'individually, building on their', 'strengths and preparing', 'them for the roles they are', 'targeting — not a generic', 'placement process, but a', 'personalised one.'] },
];
const reportLabels = ['Placement Data 2025-26', 'Placement Data 2023-25', 'Placement Data 2022-24'];
const regions = ['Delhi-NCR', 'Mumbai', 'Hyderabad', 'Bangalore'];

function PlacementReportsPageContent({ page, reportHtml, reportStatus }: {
  page: LocalPage;
  reportHtml?: string | null;
  reportStatus?: 'loading' | 'ready' | 'error' | 'unavailable';
}) {
  const menuOpen = usePageMenuOpen();
  const [logosPaused, setLogosPaused] = useState(false);
  const [company, setCompany] = useState(0);
  const [internationalTab, setInternationalTab] = useState(0);
  const [directoryTab, setDirectoryTab] = useState(0);
  const [teamTab, setTeamTab] = useState(0);
  const [yearIndex, setYearIndex] = useState(0);
  const main = useRef<HTMLElement>(null);
  const stopped = menuOpen;
  usePlacementMotion(main, stopped);

  const year = sectorYears[yearIndex];
  const sectors = [...data.sectors[year]].sort((a, b) => a.label.startsWith('Other') ? 1 : b.label.startsWith('Other') ? -1 : b.value - a.value);
  const largest = Math.max(...sectors.map(item => item.value));
  const topFive = sectors.slice(0, 5).reduce((total, item) => total + item.value, 0);
  const logoGroups = Array.from({ length: Math.ceil(data.recruiters.length / 32) }, (_, index) => data.recruiters.slice(index * 32, (index + 1) * 32));
  const directory = data.directory[directoryTab];
  const reports = reportStatus === undefined || reportStatus === 'ready'
    ? placementReportTables(reportHtml ?? page.html)
    : [];

  return <div className="local-page local-page--placements">
    <a className="local-skip" href="#local-content">Skip to placements</a>
    <main ref={main} id="local-content" className="placement-main">
      <div className="placement-content">
      <header className="placement-hero" id="placement" data-navigation-opening>
        <div className="placement-hero-image"><img src={sitePath('/assets/placement/placements_banner.webp')} alt="DBS Global University placement banner" width="5133" height="1635" fetchPriority="high" decoding="async" /></div>
        <div className="placement-intro" data-reveal><p>“{data.quote}”</p>{data.quoteMore && <ExpandableText className="placement-intro-more" text={data.quoteMore} collapseAll />}</div>
      </header>

      <section className="placement-section placement-recruiters" id="panel-0" aria-labelledby="placement-recruiters-title" data-reveal>
        <h2 id="placement-recruiters-title">Placements &amp; recruiters</h2>
        <div className="placement-metrics">{data.design.stats.map(stat => <div key={stat.label}><strong><PlacementCounter value={stat.value} suffix={stat.suffix} animate={!stopped} /></strong><span>{stat.label}</span></div>)}</div>
        <StepSlider horizontalOnMobile className="placement-logo-slider" label="Recruiter logo groups" interval={6000} paused={stopped || logosPaused} controls>{logoGroups.map((group, index) => <div className="placement-logo-grid" key={index}>{group.map(item => <div className="placement-logo" key={item.name}><PlacementImage src={item.image} alt={item.name} /></div>)}</div>)}</StepSlider>
        <div className="placement-slider-tools"><button type="button" onClick={() => setLogosPaused(value => !value)} aria-pressed={logosPaused}>{logosPaused ? 'Resume' : 'Pause'} logo slider</button></div>
      </section>
      </div>

      <div data-reveal><AdmissionsVideo variant="placements" paused={stopped} stats={placementStats} /></div>

      <div className="placement-content">
      <section className="placement-preparation" aria-labelledby="placement-preparation-title" data-reveal>
        <h2 id="placement-preparation-title"><strong>Built</strong> for the real <strong>world</strong></h2>
        <div className="placement-preparation-grid"><div className="placement-preparation-side placement-preparation-side--first"><img src={`${SITE_BASE}/assets/svg/icon-a.svg`} alt="" aria-hidden="true" /></div><div className="placement-preparation-side placement-preparation-side--last"><img src={`${SITE_BASE}/assets/svg/icon-b.svg`} alt="" aria-hidden="true" /></div>{preparation.map((item, index) => <article key={index}><h3>{item.title}</h3><p>{item.lines.join(' ')}</p><span className="placement-preparation-line" aria-hidden="true" /></article>)}</div>
      </section>

      <section className="placement-sector-stories" aria-labelledby="placement-stories-title">
        <div className="placement-sector-statement" data-reveal><h2 id="placement-stories-title">Top placements across diverse sectors and<br />over 90% placements across all courses of university<br />since 2008 is our biggest strength and assurance</h2></div>
        <div className="placement-section" data-reveal><SlidingTabList activeKey={company} className="placement-tabs placement-company-tabs" role="tablist" aria-label="Placement company sectors">{categoryLabels.map((label, index) => <button key={label} id={`placement-company-tab-${index}`} type="button" role="tab" aria-selected={company === index} aria-controls="placement-company-panel" tabIndex={company === index ? 0 : -1} onClick={() => setCompany(index)} onKeyDown={event => tabKeys(event, index, companyCategories.length, setCompany)}>{label}</button>)}</SlidingTabList><div role="tabpanel" id="placement-company-panel" aria-labelledby={`placement-company-tab-${company}`} tabIndex={0}><StepSlider key={company} horizontalOnMobile className="placement-student-slider placement-line-slider" label={categoryLabels[company]} size={4} paused={stopped} controls>{companyCategories[company].students.map(student => <StudentCard key={student.name} student={student} />)}</StepSlider></div></div>
      </section>

      <section className="placement-section placement-international" data-reveal><SlidingTabList activeKey={internationalTab} className="placement-tabs placement-tabs--international" role="tablist" aria-label="International placements and banking">{['International companies', 'National & international bank'].map((label, index) => <button key={label} type="button" id={`placement-global-tab-${index}`} role="tab" aria-selected={internationalTab === index} aria-controls="placement-global-panel" tabIndex={internationalTab === index ? 0 : -1} onClick={() => setInternationalTab(index)} onKeyDown={event => tabKeys(event, index, 2, setInternationalTab)}>{label}</button>)}</SlidingTabList><div id="placement-global-panel" role="tabpanel" tabIndex={0} aria-labelledby={`placement-global-tab-${internationalTab}`}><StepSlider key={internationalTab} horizontalOnMobile className="placement-student-slider placement-line-slider" label={internationalTab ? 'Banking placements' : 'International placement students'} size={4} paused={stopped} controls>{internationalTab ? data.categories[0].students.map(student => <StudentCard key={student.name} student={student} />) : data.international.map(student => <StudentCard key={student.name} student={student} />)}</StepSlider></div></section>

      <div data-reveal><NewsUpdatesSection id="placement-updates" paused={stopped} /></div>

      <section className="placement-breakup" aria-labelledby="placement-breakup-title" data-reveal><div className="placement-chart-title"><h2 id="placement-breakup-title">Sector wise breakup of placements</h2><SlidingTabList activeKey={yearIndex} className="placement-tabs placement-year-tabs" role="tablist" aria-label="Sector breakup year">{sectorYears.map((label, index) => <button key={label} type="button" id={`placement-year-tab-${label}`} role="tab" aria-selected={yearIndex === index} aria-controls="placement-sector-panel" tabIndex={yearIndex === index ? 0 : -1} onClick={() => setYearIndex(index)} onKeyDown={event => tabKeys(event, index, 3, setYearIndex)}>{label}</button>)}</SlidingTabList></div><div id="placement-sector-panel" className="placement-chart-panel" role="tabpanel" aria-labelledby={`placement-year-tab-${year}`} tabIndex={0}><div className="placement-chart-heading"><h3>{year}</h3><p><strong>{topFive.toFixed(1)}%</strong> in the top 5</p></div><div key={year} className="placement-sector-bars" aria-label={`${year} placement sector percentages`}>{sectors.map((item, index) => <div key={item.label} className={`placement-sector-row${index < 5 ? ' is-top-five' : ''}${item.label.startsWith('Other') ? ' is-other' : ''}`} style={{ '--placement-delay': `${index * 24}ms` } as CSSProperties}><span>{item.label}</span><div aria-hidden="true"><i style={{ width: `${item.value / largest * 100}%` }} /></div><strong>{item.value.toFixed(1)}%</strong></div>)}</div></div></section>

      <section className="placement-directory" id="secGrid" aria-labelledby="placement-directory-title" data-reveal><div className="placement-directory-title"><h2 id="placement-directory-title">Sector wise leading recruiters</h2><SlidingTabList activeKey={directoryTab} className="placement-tabs placement-directory-tabs" role="tablist" aria-label="Leading recruiter sectors">{data.directory.map((sector, index) => <button key={sector.label} id={`placement-directory-tab-${index}`} type="button" role="tab" aria-selected={directoryTab === index} aria-controls="placement-directory-panel" tabIndex={directoryTab === index ? 0 : -1} onClick={() => setDirectoryTab(index)} onKeyDown={event => tabKeys(event, index, data.directory.length, setDirectoryTab)}>{sector.label}</button>)}</SlidingTabList></div><div id="placement-directory-panel" className="placement-directory-panel" role="tabpanel" aria-labelledby={`placement-directory-tab-${directoryTab}`} tabIndex={0}><h3>{directory.label}</h3><p>Leading companies by year</p><div className="placement-directory-table" role="region" tabIndex={0} aria-label={`${directory.label} recruiters by year`}><table><thead><tr><th scope="col">#</th>{sectorYears.map(item => <th key={item} scope="col">{item}</th>)}</tr></thead><tbody>{directory.rows.map((row, index) => <tr key={index}><th scope="row">{index + 1}</th>{row.map((name, col) => <td key={col}>{name || '—'}</td>)}</tr>)}</tbody></table></div></div></section>

      <section className="placement-records" aria-labelledby="placement-records" data-reveal><h2 id="placement-records">Placement reports</h2><div className="placement-report-list">{reportStatus === 'loading' ? <p role="status">Loading placement reports…</p> : reportStatus === 'error' ? <p role="status">Placement reports are temporarily unavailable.</p> : reports.length ? reports.map((table, index) => <details className="placement-report" key={index}><summary>{reportLabels[index]}<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 7 6-7" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg></summary><div className="placement-report-table local-article" tabIndex={0} role="region" aria-label={`${reportLabels[index]} table`} dangerouslySetInnerHTML={{ __html: table }} /></details>) : <p role="status">Placement reports are currently unavailable.</p>}</div></section>

      <section className="placement-team placement-section" aria-labelledby="placement-team" data-reveal><p className="placement-team-eyebrow">Meet the team</p><h2 id="placement-team">Corporate engagement team</h2><SlidingTabList activeKey={teamTab} className="placement-tabs placement-team-tabs" role="tablist" aria-label="Corporate engagement team city">{regions.map((label, index) => <button key={label} id={`placement-team-tab-${index}`} type="button" role="tab" aria-selected={teamTab === index} aria-controls={`placement-team-panel-${index}`} tabIndex={teamTab === index ? 0 : -1} onClick={() => setTeamTab(index)} onKeyDown={event => tabKeys(event, index, regions.length, setTeamTab)}>{label}</button>)}</SlidingTabList>{regions.map((label, index) => <div className="placement-team-panel" key={label} id={`placement-team-panel-${index}`} role="tabpanel" aria-labelledby={`placement-team-tab-${index}`} hidden={teamTab !== index} tabIndex={0}><StepSlider horizontalOnMobile className="placement-team-slider placement-line-slider" label={`${label} corporate engagement team`} size={2} paused={stopped || teamTab !== index} controls>{data.team.filter(member => member.region === index).map(member => <article className="placement-team-card" key={member.name}><div className="placement-team-copy"><h3>{member.name}</h3><p>{member.role}</p>{member.email ? <a href={`mailto:${member.email}`}>Email: {member.email}</a> : <a href={`${SITE_BASE}/contacts/`}>Contact directory ↗</a>}</div><PlacementImage className="placement-team-photo" src={member.image} alt={member.name} /></article>)}</StepSlider></div>)}</section>

      </div>
    </main>
  </div>;
}

export default function PlacementReportsPage({ page, reportHtml, reportStatus }: {
  page: LocalPage;
  reportHtml?: string | null;
  reportStatus?: 'loading' | 'ready' | 'error' | 'unavailable';
}) {
  return <LocalPageShell className="local-page local-page--placements"><PlacementReportsPageContent page={page} reportHtml={reportHtml} reportStatus={reportStatus} /></LocalPageShell>;
}
