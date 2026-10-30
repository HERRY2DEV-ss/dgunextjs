import LocalPageShell from './LocalPageShell';
import NavigationNewsList from './NavigationNewsList';
import LocalDocumentViewer from './LocalDocumentViewer';
import LocalGallery from './LocalGallery';
import ClubsCommitteesPage from './ClubsCommitteesPage';
import IndividualClubPage from './IndividualClubPage';
import { SITE_BASE } from './site-routes';
import type { LocalPage } from './local-pages';
import type { NewsTab } from './news-api';
import FacultyProfilePage from './FacultyProfilePage';
import ProgramPage from './ProgramPage';
import { localProgramSlug } from './local-program-data';
import InternalPageHero from './InternalPageHero';
import InternalContent from './InternalContent';
import { internalHeroContent } from './internal-page-presentation';
import PlacementsLandingPage from './PlacementsLandingPage';

export default function LocalContentPage({ page }: { page: LocalPage }) {
  if (page.kind === 'profile' && page.group === 'Faculty') return <FacultyProfilePage slug={page.slug} />;
  if (page.slug === 'placement-reports') return <PlacementsLandingPage />;
  if (page.slug === 'students-clubs-and-committees') return <ClubsCommitteesPage />;
  if (page.slug.endsWith('-club')) return <IndividualClubPage slug={page.slug} />;
  const program = localProgramSlug(page);
  if (program) return <ProgramPage slug={program} />;
  const admissionChild = page.group === 'ADMISSION';
  const presentation = internalHeroContent(page);
  return <LocalPageShell className={`local-page internal-page local-page--${page.kind}`}>
    <a className="local-skip" href="#local-content">Skip to page content</a>
    <main className="local-page-main" id="local-content">
      <InternalPageHero title={page.label} eyebrow={page.group === 'OVERVIEW' ? 'DBS Global University' : page.group} image={presentation.image} parent={admissionChild ? {label:'Admissions',href:`${SITE_BASE}/admissions/`} : undefined} />
      <div className="internal-body">
      {admissionChild && <nav className="admissions-child-links" aria-label="Admissions resources">
        <a href={`${SITE_BASE}/admissions/`}>Admissions overview</a>
        <a href={`${SITE_BASE}/admission-requirements/`} aria-current={page.slug === 'admission-requirements' ? 'page' : undefined}>Eligibility &amp; requirements</a>
        <a href={`${SITE_BASE}/admissions/#programs-fee-structures`}>Programme fees</a>
        <a href={`${SITE_BASE}/education-loan/`} aria-current={page.slug === 'education-loan' ? 'page' : undefined}>Education loan</a>
      </nav>}
      {page.kind === 'document' || page.kind === 'document-html' ? <LocalDocumentViewer title={page.label} url={page.documentUrl} htmlDocument={page.kind === 'document-html'} />
        : page.kind === 'news' ? <NavigationNewsList tab={page.newsTab as NewsTab} />
        : page.kind === 'gallery' ? <><InternalContent html={presentation.html} slug={page.slug} /><LocalGallery title={page.label} photos={page.photos || []} /></>
        : presentation.portrait ? <div className="internal-profile-layout"><aside><img src={presentation.portrait.src} alt={presentation.portrait.alt} fetchPriority="high" /></aside><InternalContent html={presentation.html} slug={page.slug} /></div>
        : <InternalContent html={presentation.html} slug={page.slug} />}
      </div>
    </main>
  </LocalPageShell>;
}
