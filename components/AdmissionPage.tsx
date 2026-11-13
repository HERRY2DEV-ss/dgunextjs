'use client';
import SlidingTabList from './SlidingTabList';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import LocalPageShell, { usePageMenuOpen } from './LocalPageShell';
import RecruitersSection from './RecruitersSection';
import SchoolPlacementsSection from './SchoolPlacementsSection';
import AdmissionResources from './AdmissionResources';
import AdmissionsVideo from './AdmissionsVideo';
import ApiRichText from './ApiRichText';
import ExpandableText from './ExpandableText';
import { apiPlain } from './dgu-content-api';
import { requestAdmissions, type AdmissionData, type AdmissionSchool, type FeeSchool } from './admissions-api';
import { admissionDetail, admissionDetailHref } from './admissions-routes';
import PageTitleStrip from './PageTitleStrip';

function AdmissionPageContent() {
  const menuOpen = usePageMenuOpen();
  const mounted = useRef(false);
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'error'; data: AdmissionData | null }>({ status: 'loading', data: null });
  const [selectedSchool, setSelectedSchool] = useState(0);
  const [openMobileSchool, setOpenMobileSchool] = useState<number | null>(null);
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [selectedFeeSchool, setSelectedFeeSchool] = useState(0);
  const [openMobileFeeSchool, setOpenMobileFeeSchool] = useState<number | null>(null);
  const [selectedFeeGroup, setSelectedFeeGroup] = useState(0);
  const [selectedFeeProgram, setSelectedFeeProgram] = useState<string | null>(null);
  const [compiledOpen, setCompiledOpen] = useState(false);
  const load = useCallback(() => {
    setState({ status: 'loading', data: null });
    requestAdmissions().then(data => { if (mounted.current) setState({ status: 'ready', data }); })
      .catch(() => { if (mounted.current) setState({ status: 'error', data: null }); });
  }, []);
  useEffect(() => { mounted.current = true; load(); return () => { mounted.current = false; }; }, [load]);
  const data = state.data;
  const processHref = data ? admissionDetailHref(admissionDetail(data, 'admission-requirements')?.href || '') : '';
  const placementHref = data ? admissionDetailHref(admissionDetail(data, 'placement-reports')?.href || '') : '';
  useEffect(() => {
    if (!data) return;
    document.title = data.metaTitle || data.title;
    if (data.metaDescription) {
      let description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!description) { description = document.createElement('meta'); description.name = 'description'; document.head.append(description); }
      description.content = data.metaDescription;
    }
  }, [data]);

  const switchTab = (event: KeyboardEvent<HTMLButtonElement>, count: number, index: number, select: (next: number) => void, prefix: string) => {
    const next = event.key === 'ArrowRight' ? (index + 1) % count : event.key === 'ArrowLeft' ? (index - 1 + count) % count : event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : null;
    if (next === null) return;
    event.preventDefault(); select(next);
    document.getElementById(`${prefix}-tab-${next}`)?.focus();
  };

  const admissionContent = (item: AdmissionSchool, schoolIndex: number, prefix: string) => {
    const currentTrack = item.tracks[schoolIndex === selectedSchool ? selectedTrack : 0] ?? item.tracks[0];
    if (!currentTrack) return null;
    return <div className="admissions-process-card">
      {item.tracks.some(track => track.label) && <SlidingTabList activeKey={currentTrack.label} className="admissions-level-tabs" role="tablist" aria-label={`${item.name} admission levels`}>
        {item.tracks.map((entry, index) => (
          <button key={`${index}-${entry.label}`} id={`${prefix}-tab-${index}`} type="button" role="tab"
            aria-label={entry.label} aria-selected={currentTrack === entry} aria-controls={`${prefix}-panel`}
            tabIndex={currentTrack === entry ? 0 : -1}
            onKeyDown={event => switchTab(event, item.tracks.length, index, next => { setSelectedSchool(schoolIndex); setSelectedTrack(next); }, prefix)}
            className={currentTrack === entry ? 'is-active' : ''}
            onClick={() => { setSelectedSchool(schoolIndex); setSelectedTrack(index); }}>
            <span className="admissions-level-full" aria-hidden="true">{entry.label}</span>
            <span className="admissions-level-short" aria-hidden="true">{entry.label === 'Undergraduate' ? 'UG' : entry.label === 'Postgraduate' ? 'PG' : entry.label}</span>
          </button>
        ))}
      </SlidingTabList>}
      <div id={`${prefix}-panel`} role="tabpanel" aria-labelledby={currentTrack.label ? `${prefix}-tab-${item.tracks.indexOf(currentTrack)}` : undefined}
        key={`${prefix}-${item.tracks.indexOf(currentTrack)}`} className="admissions-tab-content">
        {currentTrack.title && <h3>{currentTrack.title}</h3>}
        {currentTrack.html && <ExpandableText className="admissions-rich-copy" text={apiPlain(currentTrack.html)} html={currentTrack.html} previewWords={75} href={processHref} />}
      </div>
    </div>;
  };

  const feeContent = (item: FeeSchool, schoolIndex: number, prefix: string) => {
    const currentGroup = item.groups[schoolIndex === selectedFeeSchool ? selectedFeeGroup : 0] ?? item.groups[0];
    if (!currentGroup) return null;
    return <div className="admissions-process-card admissions-fees-panel">
      {item.groups.some(group => group.label) && <SlidingTabList activeKey={currentGroup.label} className="admissions-level-tabs" role="tablist" aria-label={`${item.name} program levels`}>
        {item.groups.map((group, index) => (
          <button key={`${index}-${group.label}`} id={`${prefix}-tab-${index}`} type="button" role="tab"
            aria-label={group.label} aria-selected={currentGroup === group} aria-controls={`${prefix}-panel`}
            tabIndex={currentGroup === group ? 0 : -1}
            onKeyDown={event => switchTab(event, item.groups.length, index, next => { setSelectedFeeSchool(schoolIndex); setSelectedFeeGroup(next); setSelectedFeeProgram(null); }, prefix)}
            className={currentGroup === group ? 'is-active' : ''}
            onClick={() => { setSelectedFeeSchool(schoolIndex); setSelectedFeeGroup(index); setSelectedFeeProgram(null); }}>
            <span className="admissions-level-full" aria-hidden="true">{group.label}</span>
            <span className="admissions-level-short" aria-hidden="true">{group.label === 'Undergraduate' ? 'UG' : group.label === 'Postgraduate' ? 'PG' : group.label}</span>
          </button>
        ))}
      </SlidingTabList>}
      <div id={`${prefix}-panel`} role="tabpanel" aria-labelledby={currentGroup.label ? `${prefix}-tab-${item.groups.indexOf(currentGroup)}` : undefined}
        key={`${prefix}-${item.groups.indexOf(currentGroup)}`} className="admissions-tab-content">
        {currentGroup.programs.map((program, index) => {
          const key = `${schoolIndex}-${selectedFeeGroup}-${program.key}`;
          const open = selectedFeeProgram === key && schoolIndex === selectedFeeSchool;
          return <div className="admissions-fee-item" key={program.key}>
            <button type="button" aria-expanded={open} aria-controls={`${prefix}-fee-${index}`} onClick={() => setSelectedFeeProgram(open ? null : key)}>
              <span>{program.title}</span><span aria-hidden="true">{open ? '⌄' : '›'}</span>
            </button>
            <div id={`${prefix}-fee-${index}`} className="admissions-fee-detail admissions-rich-copy" hidden={!open}>
              {open && <ApiRichText html={program.html} />}
            </div>
          </div>;
        })}
        {currentGroup.html && <ApiRichText html={currentGroup.html} className="admissions-rich-copy admissions-fee-notes" />}
      </div>
    </div>;
  };

  return (
    <div className="admissions-content">
      <main id="main" aria-busy={state.status === 'loading'}>
        {!data ? <div className="admissions-api-status" role="status">
          <p>{state.status === 'loading' ? 'Loading admissions information…' : 'Admissions information is temporarily unavailable.'}</p>
          {state.status === 'error' && <button type="button" className="text-link" onClick={load}>Try again</button>}
        </div> : <>
          <section className={`admissions-opening${data.banner ? '' : ' admissions-opening--no-banner'}`} id="home" aria-labelledby="admissions-title">
            {data.banner && <div className="admissions-banner"><img src={data.banner} width="1105" height="352" alt={data.title} /></div>}
            {data.banner ? <PageTitleStrip id="admissions-title" title={data.title} /> : <h1 id="admissions-title">{data.title}</h1>}
            {data.intro && <ApiRichText className="admissions-intro admissions-rich-copy" html={data.intro} />}
          </section>
          {(data.processTitle || data.feeTitle || data.resources.length || data.commencement) && <nav className="admissions-section-links" aria-label="Admissions resources">
            {data.processTitle && <a className="is-current" href="#admission-process-title">{data.processTitle}</a>}
            {data.feeTitle && <a href="#programs-fee-structures">{data.feeTitle}</a>}
            {!!data.resources.length && <a href="#admissions-support">{data.resources[0].title}</a>}
            {data.commencement && <a href="#admissions-commencement">{data.commencement.title}</a>}
          </nav>}
          {(data.schools.length > 0 || data.processExtra) && <section className="admissions-process" aria-labelledby={data.processTitle ? 'admission-process-title' : undefined}>
            <div className="admissions-process-inner">
              {data.processTitle && <h2 id="admission-process-title">{data.processTitle}</h2>}
              {!!data.schools.length && <>
                <div className="admissions-process-grid admissions-desktop-grid">
                  <div className="admissions-school-list" aria-label="Choose a school">
                    {data.schools.map((item, index) => <button key={item.name} type="button" className={selectedSchool === index ? 'is-active' : ''}
                      aria-pressed={selectedSchool === index} onClick={() => { setSelectedSchool(index); setSelectedTrack(0); }}>
                      <span>{item.name}</span><span aria-hidden="true">›</span>
                    </button>)}
                  </div>
                  {admissionContent(data.schools[selectedSchool] ?? data.schools[0], selectedSchool, 'admission-desktop')}
                </div>
                <div className="admissions-mobile-accordion" aria-label="Admission process by school">
                  {data.schools.map((item, index) => {
                    const open = openMobileSchool === index;
                    return <div className={`admissions-accordion-item${open ? ' is-open' : ''}`} key={item.name}>
                      <button className="admissions-accordion-trigger" type="button" id={`admission-school-${index}`}
                        aria-expanded={open} aria-controls={`admission-school-panel-${index}`}
                        onClick={() => { setOpenMobileSchool(open ? null : index); setSelectedSchool(index); setSelectedTrack(0); }}>
                        <span>{item.name}</span><span className="admissions-accordion-chevron" aria-hidden="true">›</span>
                      </button>
                      <div className="admissions-accordion-panel" id={`admission-school-panel-${index}`}
                        role="region" aria-labelledby={`admission-school-${index}`} aria-hidden={!open} inert={!open}>
                        <div className="admissions-accordion-panel-inner">{open && admissionContent(item, index, `admission-mobile-${index}`)}</div>
                      </div>
                    </div>;
                  })}
                </div>
              </>}
              {data.processExtra && <ApiRichText html={data.processExtra} className="admissions-rich-copy admissions-process-extra" />}
            </div>
          </section>}
          {data.media.src && <AdmissionsVideo paused={menuOpen} src={data.media.src} poster={data.media.poster} stats={[]} />}
          {(data.feeSchools.length > 0 || data.feesExtra) && <section className="admissions-fees" id="programs-fee-structures" aria-labelledby={data.feeTitle ? 'admissions-fees-title' : undefined}>
            {data.feeTitle && <h2 id="admissions-fees-title">{data.feeTitle}</h2>}
            {!!data.feeSchools.length && <>
              <div className="admissions-process-grid admissions-fees-grid admissions-desktop-grid">
                <div className="admissions-school-list" aria-label="Choose a school for fee structures">
                  {data.feeSchools.map((item, index) => <button key={item.name} type="button" className={selectedFeeSchool === index ? 'is-active' : ''}
                    aria-pressed={selectedFeeSchool === index} onClick={() => { setSelectedFeeSchool(index); setSelectedFeeGroup(0); setSelectedFeeProgram(null); }}>
                    <span>{item.name}</span><span aria-hidden="true">›</span>
                  </button>)}
                </div>
                {feeContent(data.feeSchools[selectedFeeSchool] ?? data.feeSchools[0], selectedFeeSchool, 'fee-desktop')}
              </div>
              <div className="admissions-mobile-accordion admissions-fees-accordion" aria-label="Programme fees by school">
                {data.feeSchools.map((item, index) => {
                  const open = openMobileFeeSchool === index;
                  return <div className={`admissions-accordion-item${open ? ' is-open' : ''}`} key={item.name}>
                    <button className="admissions-accordion-trigger" type="button" id={`fee-school-${index}`}
                      aria-expanded={open} aria-controls={`fee-school-panel-${index}`}
                      onClick={() => { setOpenMobileFeeSchool(open ? null : index); setSelectedFeeSchool(index); setSelectedFeeGroup(0); setSelectedFeeProgram(null); }}>
                      <span>{item.name}</span><span className="admissions-accordion-chevron" aria-hidden="true">›</span>
                    </button>
                    <div className="admissions-accordion-panel" id={`fee-school-panel-${index}`}
                      role="region" aria-labelledby={`fee-school-${index}`} aria-hidden={!open} inert={!open}>
                      <div className="admissions-accordion-panel-inner">{open && feeContent(item, index, `fee-mobile-${index}`)}</div>
                    </div>
                  </div>;
                })}
              </div>
            </>}
            {data.feesExtra && <div className="admissions-compiled-fees admissions-fee-item">
              {data.feesExtra.title && <button type="button" aria-expanded={compiledOpen} aria-controls="admissions-compiled-panel" onClick={() => setCompiledOpen(value => !value)}>
                <span>{data.feesExtra.title}</span><span aria-hidden="true">{compiledOpen ? '⌄' : '›'}</span>
              </button>}
              <div id="admissions-compiled-panel" className="admissions-fee-detail admissions-rich-copy" hidden={!!data.feesExtra.title && !compiledOpen}>
                {(!data.feesExtra.title || compiledOpen) && <ApiRichText html={data.feesExtra.html} />}
              </div>
            </div>}
          </section>}
          <AdmissionResources resources={data.resources} international={data.international} refund={data.refund} commencement={data.commencement} viewBookUrl={data.viewBookUrl} />
          <SchoolPlacementsSection apiSchoolUrl="" paused={menuOpen} detailHref={placementHref} />
          <RecruitersSection paused={menuOpen} items={data.recruiters} title={data.recruiterTitle} />
        </>}
      </main>
    </div>
  );
}

export default function AdmissionPage() { return <LocalPageShell className="admissions-page"><AdmissionPageContent/></LocalPageShell>; }
