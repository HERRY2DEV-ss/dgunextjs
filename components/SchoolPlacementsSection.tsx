'use client';

import { useMemo, useState } from 'react';
import BatchSlider from './StepSlider';
import HomepagePlacementCopy from './HomepagePlacementCopy';
import type { SchoolPageData } from './school-page-data';
import ExpandableText from './ExpandableText';
import { apiPlain } from './dgu-content-api';
import { academicPlacementCopy } from './academic-placements';
import PlacementStudentCard from './PlacementStudentCard';
import PlacementsFeedback from './PlacementsFeedback';
import usePlacements from './usePlacements';
import { admissionDetailHref } from './admissions-routes';
import { usePageMenuOpen } from './LocalPageShell';

type PlacementStudent = SchoolPageData['placement']['students'][number] & {
  id?: string; designation?: string; batch?: string; description?: string;
};

const DEFAULT_STATIC_DESCRIPTION = `Placement is an independent activity managed by the career development cell & the students on their own through their nominated committee member, under the overall guidance of an experienced Placement Coordinator. Moreover, the activities calendar of DGU has incorporated a number of activities which have been designed to promote industry interaction. Relationship building with Corporates through rich knowledge exchange helps build a trust in DGU capabilities to nurture talent and impart necessary skills in its students.`;

const DEFAULT_STATIC_STATS: [string, string][] = [
  ['400+', 'Recruiters'],
  ['40+ LPA', 'Highest CTC'],
  ['1500+', 'Students Placed'],
  ['92%', 'Placement Rate'],
];

const DEFAULT_STATIC_TAGLINE = ['ENJOY EVERYDAY WHILE', 'ENSURING GREAT CAREER'];

export default function SchoolPlacementsSection({
  placement: suppliedPlacement,
  paused = false,
  contentHtml,
  detailHref,
  homepageCopy = false,
  apiSchoolUrl,
  apiProgramUrl,
}: {
  placement?: Omit<SchoolPageData['placement'], 'students'> & { students: PlacementStudent[] };
  paused?: boolean;
  contentHtml?: string;
  detailHref?: string;
  homepageCopy?: boolean;
  apiSchoolUrl?: string | null;
  apiProgramUrl?: string | null;
}) {
  const shellMenuOpen = usePageMenuOpen();

  const isProgram = apiProgramUrl !== undefined && apiProgramUrl !== null;
  const effectiveSchoolUrl = apiSchoolUrl === undefined && homepageCopy && !suppliedPlacement ? '' : apiSchoolUrl;
  const targetUrl = isProgram ? apiProgramUrl : effectiveSchoolUrl;
  const fromApi = targetUrl !== undefined && targetUrl !== null;

  const feed = usePlacements(fromApi ? targetUrl : null, isProgram);
  const section = feed.data?.sections[0];

  const rawApiDescription = feed.data?.sections.map(item => item.description).filter(Boolean).join('\n');
  const cleanDescription = (fromApi ? (rawApiDescription || contentHtml || '') : (contentHtml || suppliedPlacement?.description || DEFAULT_STATIC_DESCRIPTION))
    .replaceAll('&amp;', '&');

  const placement = fromApi ? {
    title: (section?.title || suppliedPlacement?.title || 'PLACEMENTS').toUpperCase(),
    tagline: section?.tagline || [],
    description: cleanDescription,
    students: feed.data?.students || [],
    stats: section?.stats || [],
  } : suppliedPlacement || {
    title: 'PLACEMENTS',
    tagline: DEFAULT_STATIC_TAGLINE,
    description: DEFAULT_STATIC_DESCRIPTION,
    students: [],
    stats: DEFAULT_STATIC_STATS,
  };

  const source = fromApi ? placement.description : contentHtml ?? placement.description;
  const target = fromApi ? (admissionDetailHref(section?.url || '') || detailHref) : detailHref;
  const [openProfile, setOpenProfile] = useState<string | null>(null);
  const copy = useMemo(() => academicPlacementCopy(source, target), [source, target]);
  const hasCopy = !!apiPlain(copy.html) || /<(img|table)\b/i.test(copy.html);
  const mediaOnly = !homepageCopy && placement.students.length > 0 && !hasCopy && placement.tagline.length === 0 && placement.stats.length === 0 && !copy.href;

  if (targetUrl === null) return null;

  return (
    <section 
      className={`placements-section content-width school-placements-section${placement.students.length === 0 ? ' school-placements-section--text-only' : ''}${mediaOnly ? ' school-placements-section--media-only' : ''}`} 
      id="school-placements" 
      aria-labelledby="school-placements-title" 
      aria-busy={fromApi && feed.status === 'loading'}
    >
      {mediaOnly && <h2 id="school-placements-title">{placement.title}</h2>}
      <div className="placement-overview">
        <div className={`outcome-panel-content outcome-placement${placement.students.length === 0 && !homepageCopy ? ' school-placement-copy-only' : ''}`}>
          {fromApi && !placement.students.length && <PlacementsFeedback state={feed} />}
          {placement.students.length > 0 && (
            <BatchSlider
              className="placement-media-slider"
              label={`${placement.title} student stories`}
              size={2}
              mobileSize={homepageCopy ? 2 : 1}
              loop={homepageCopy}
              horizontalOnMobile={homepageCopy}
              interval={homepageCopy ? 3600 : 4200}
              paused={paused || shellMenuOpen || openProfile !== null}
              vertical
              controls
              dots
              dotWindow={homepageCopy ? 7 : 0}
            >
              {placement.students.map((student, index) => {
                const key = `${targetUrl || ''}|${student.id || ''}|${index}`;
                return (
                  <PlacementStudentCard 
                    key={key} 
                    student={{
                      id: student.id || '',
                      name: student.name || '',
                      company: student.company || '',
                      image: student.image || '',
                      description: student.description || '',
                      designation: student.designation || '',
                      batch: student.batch || ''
                    }} 
                    open={openProfile === key} 
                    onToggle={() => setOpenProfile(value => value === key ? null : key)} 
                    onClose={() => setOpenProfile(null)} 
                  />
                );
              })}
            </BatchSlider>
          )}

          {homepageCopy ? (
            <HomepagePlacementCopy headingId="school-placements-title" />
          ) : (
            !mediaOnly && (
              <div className="placement-copy">
                <h2 id="school-placements-title">{placement.title}</h2>
                {!!placement.tagline.length && (
                  <p className="placement-tagline">
                    {placement.tagline.map(line => <span key={line}>{line}</span>)}
                  </p>
                )}
                {hasCopy && (
                  <ExpandableText 
                    className="placement-description admissions-rich-copy" 
                    text={apiPlain(copy.html)} 
                    html={copy.html} 
                    previewWords={90} 
                    href={copy.href || undefined} 
                  />
                )}
                {!hasCopy && copy.href && (
                  <a className="text-link placement-page-link" href={copy.href}>
                    Read More <span aria-hidden="true">→</span>
                  </a>
                )}
                {!!placement.stats.length && (
                  <div className="placement-stats" aria-label="Placement statistics">
                    {placement.stats.map(([value, label], index) => (
                      <div className={`stat stat-${index}`} key={`${value}-${label}`}>
                        <strong>{value}</strong>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
