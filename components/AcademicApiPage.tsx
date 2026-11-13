'use client';
import { sitePath } from './site-base';

import '../app/schools/school.css';
import '../app/programs/program.css';
import '../app/academic-reference.css';
import './academic-api.css';
import './advanced-computing.css';
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import Navigation from './Navigation';
import useAcademicBrand from './useAcademicBrand';
import SiteFooter from './SiteFooter';
import SchoolIntroSection from './SchoolIntroSection';
import { isAdvancedComputing, isAdvancedComputingAcademicPage, isBtechProgramPage } from './advanced-computing-layout';
import QuickContactForm from './QuickContactForm';
import AcademicContent from './AcademicContent';
import ApiRichText from './ApiRichText';
import DifferentiatorSection from './DifferentiatorSection';
import ProgramCard from './ProgramCard';
import SchoolPlacementsSection from './SchoolPlacementsSection';
import RecruitersSection from './RecruitersSection';
import SchoolFaculty from './SchoolFaculty';
import GlobalLearning from './GlobalLearning';
import NewsUpdatesSection from './NewsUpdatesSection';
import FaqSection from './FaqSection';
import AdmissionsVideo from './AdmissionsVideo';
import StepSlider from './StepSlider';
import { apiPlain } from './dgu-content-api';
import { splitAcademicContent, type AcademicInfo, type AcademicKind, type AcademicSection } from './academic-page-api';
import useAcademicInfo from './useAcademicInfo';
import { academicSectionKey } from './academic-section-key';
import { academicLayout, type AcademicBlock } from './academic-layout';
import { placementSchoolUrl } from './academic-placement-school';
import { groupSchoolPrograms } from './SchoolProgramsSection';
import type { SchoolProgram } from './programs-api';
import { academicGallery } from './academic-media';
import useSchoolCatalogue from './useSchoolCatalogue';
import { advancedComputingPartners } from './advanced-computing-partners';
import { academicFeatureAccordionSections, academicFeaturePresentation, academicFeatures } from './academic-features';
import AcademicFeatureDialog from './AcademicFeatureDialog';
import AcademicFeatureHover from './AcademicFeatureHover';
import AcademicBannerImage from './AcademicBannerImage';
import { trackAccordions } from './academic-tracks';
import { academicCareerAccordionSections, academicColumnSections, academicLearningEnvironmentSection, academicSemesterContent, academicSingleAccordionSection, academicSpecializationAccordionContent, academicTabContent } from './academic-tab-content';
import AcademicAccordionGroup, { AcademicAccordionCopy } from './AcademicAccordionGroup';
import { academicLaboratories } from './academic-laboratories';
import useOtherSpecializations from './useOtherSpecializations';
import AcademicTestimonials from './AcademicTestimonials';
import AnimatedHeroSlider from './AnimatedHeroSlider';
import GnmCareerProspects from './GnmCareerProspects';

const subscribeHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerSnapshot = () => false;

function GalleryCopy({section,paused,combinePoweredByLogos=false}:{section:AcademicSection;paused:boolean;combinePoweredByLogos?:boolean}) {
  const [failed,setFailed]=useState<string[]>([]),gallery=useMemo(()=>academicGallery(section.html),[section.html]);
  const photos=gallery.photos.filter(photo=>!failed.includes(photo.src));
  return <><ApiRichText html={gallery.html} scrollTables combinePoweredByLogos={combinePoweredByLogos} />
    {photos.length>0 && <StepSlider className="academic-api-gallery" size={4} loop horizontalOnMobile interval={3900} label={section.title} controls paused={paused}>
      {photos.map(photo=><figure key={photo.src}><img src={photo.src} alt={photo.alt} loading="lazy" onError={()=>setFailed(old=>[...old,photo.src])}/></figure>)}
    </StepSlider>}
  </>;
}

function AcademicAccordions({sections,title='',id,lead=[]}:{sections:AcademicSection[];title?:string;id:string;lead?:AcademicSection[]}) {
  if(!sections.length)return null;
  return <section className="program-industry" data-content-kind="accordion" aria-label={title || 'More information'}>
    {title && <h2>{title}</h2>}
    {lead.map((section,index)=><ApiRichText key={index} html={section.html} scrollTables />)}
    <AcademicAccordionGroup id={id} items={sections.map(section=>({title:section.title,content:academicSectionKey(section.title)==='state of the art learning environment'
      ? <div className="academic-learning-environment-links"><AcademicAccordionCopy html={section.html} /></div>
      : <AcademicAccordionCopy html={section.html} />}))} />
  </section>;
}

function LegalProgrammeExperiencePoints({sections}:{sections:AcademicSection[]}) {
  if(!sections.length)return null;
  return <section className="program-industry academic-legal-experiences" data-content-kind="points" aria-label="Legal Programme Experiences">
    <h2>Legal Programme Experiences</h2>
    <ul className="academic-legal-experience-points">
      {sections.map((section,index)=><li key={`${section.title}-${index}`}>
        <h3>{section.title}</h3>
        <AcademicAccordionCopy html={section.html} />
      </li>)}
    </ul>
  </section>;
}

function CareerAccordionContent({ html, id }: { html: string; id: string }) {
  const sections=useMemo(()=>academicCareerAccordionSections(html),[html]);
  return sections.length
    ? <AcademicAccordions sections={sections} id={id} />
    : <ApiRichText html={html} scrollTables />;
}

function BcaCareerAccordionContent({section,id}:{section:AcademicSection;id:string}) {
  const hydrated=useSyncExternalStore(subscribeHydration,getHydratedSnapshot,getServerSnapshot);
  const parts=useMemo(()=>hydrated ? academicTabContent(section.html,true,true) : {intro:section.html,sections:[]},[hydrated,section.html]);
  if(parts.sections.length<2)return <TabRichCopy section={section} />;
  return <div className="academic-tab-content academic-tab-accordions" data-tab-kind="careers">
    {(apiPlain(parts.intro) || /<(img|table)\b/i.test(parts.intro)) && <TabRichCopy section={{title:section.title,html:parts.intro}} />}
    <AcademicAccordions sections={parts.sections} id={id} />
  </div>;
}

function BcaSpecializationOptions({section,id,paused}:{section:AcademicSection;id:string;paused:boolean}) {
  const ready=useSyncExternalStore(subscribeHydration,getHydratedSnapshot,getServerSnapshot);
  const content=useMemo(()=>ready ? academicSpecializationAccordionContent(section.html) : null,[ready,section.html]);
  return <section className="academic-api-section" data-content-kind="section">
    <h2>{section.title}</h2>
    {!content
      ? <GalleryCopy section={section} paused={paused} />
      : <>
          {content.intro && <ApiRichText html={content.intro} scrollTables />}
          <AcademicAccordionGroup id={id} items={content.sections.map(item=>({title:item.title,content:<AcademicAccordionCopy html={item.html} />}))} />
        </>}
  </section>;
}

function BtechCollaborationAccordion({ section, paused }: { section: AcademicSection; paused: boolean }) {
  const { content, heading, poweredBy } = btechCollaborationContent(section);
  return <details className="academic-btech-accordion academic-api-btech-collaboration" data-content-kind="accordion">
    <summary>{heading}</summary>
    <div className="academic-btech-accordion-content"><GalleryCopy section={content} paused={paused} combinePoweredByLogos={poweredBy} /></div>
  </details>;
}

function btechCollaborationContent(section: AcademicSection) {
  const poweredByHeading = Array.from(section.html.matchAll(/<h([1-6])\b[^>]*>[\s\S]*?<\/h\1>/gi))
    .find(match => apiPlain(match[0]).toLowerCase() === 'powered by');
  const content = poweredByHeading ? { ...section, html: section.html.replace(poweredByHeading[0], '') } : section;
  const heading = poweredByHeading ? `${section.title} & ${apiPlain(poweredByHeading[0])}` : section.title;
  return { content, heading, poweredBy: !!poweredByHeading };
}

function BtechCollaborationSection({ section, paused }: { section: AcademicSection; paused: boolean }) {
  const { content, heading, poweredBy } = btechCollaborationContent(section);
  return <section className="academic-api-btech-collaboration academic-feature-collaboration">
    <h3>{heading}</h3>
    <GalleryCopy section={content} paused={paused} combinePoweredByLogos={poweredBy} />
  </section>;
}

function btechIntroAccordionContent(source: string, program: 'ai-ml' | 'quantum-computing' | 'cse-minor' | 'lateral-entry'): { intro: string; sections: AcademicSection[] } | null {
  if (typeof DOMParser === 'undefined') return null;
  const document = new DOMParser().parseFromString(source, 'text/html');
  const headings = Array.from(document.body.querySelectorAll('h1,h2,h3,h4,h5,h6'));
  const wanted = new Map<string, string>([
    [program === 'cse-minor' || program === 'lateral-entry' ? 'program highlights' : 'program benefits',
      program === 'cse-minor' || program === 'lateral-entry' ? 'Program Highlights' : 'Program Benefits'],
    [program === 'ai-ml' ? 'b tech cse ai ml minor' : program === 'quantum-computing'
      ? 'b tech cse in quantum computing with minor'
      : 'b tech cse minor',
    program === 'ai-ml' ? 'B. Tech CSE AI&ML - Minor' : program === 'quantum-computing'
      ? 'B.Tech CSE in Quantum Computing with Minor'
      : 'B. Tech CSE - Minor'],
  ]);
  const matches = headings.filter(heading => wanted.has(apiPlain(heading.textContent).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()));
  if (matches.length !== wanted.size) return null;
  const sections: AcademicSection[] = [];
  for (const heading of matches) {
    const headingKey = apiPlain(heading.textContent).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const nextHeading = headings.find(candidate => candidate !== heading &&
      !!(heading.compareDocumentPosition(candidate) & 4));
    const contentRange = document.createRange();
    contentRange.setStartAfter(heading);
    if (nextHeading) contentRange.setEndBefore(nextHeading);
    else contentRange.setEnd(document.body, document.body.childNodes.length);
    const content = document.createElement('div');
    content.append(contentRange.cloneContents());
    sections.push({ title: wanted.get(headingKey) || apiPlain(heading.textContent), html: content.innerHTML });

    const removalRange = document.createRange();
    removalRange.setStartBefore(heading);
    if (nextHeading) removalRange.setEndBefore(nextHeading);
    else removalRange.setEnd(document.body, document.body.childNodes.length);
    removalRange.deleteContents();
  }
  return { intro: document.body.innerHTML, sections };
}

function academicFeatureReadMore(source: string): { before: string; title: string; after: string } | null {
  if (typeof DOMParser === 'undefined') return null;
  const document = new DOMParser().parseFromString(source, 'text/html');
  const heading = Array.from(document.body.querySelectorAll('h1,h2,h3,h4,h5,h6'))
    .find(node => apiPlain(node.textContent).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() === 'lifelong learning and problem solving abilities');
  if (!heading) return null;
  const before = document.createElement('div');
  const beforeRange = document.createRange();
  beforeRange.selectNodeContents(document.body);
  beforeRange.setEndBefore(heading);
  before.append(beforeRange.cloneContents());
  const after = document.createElement('div');
  const afterRange = document.createRange();
  afterRange.selectNodeContents(document.body);
  afterRange.setStartAfter(heading);
  after.append(afterRange.cloneContents());
  return { before: before.innerHTML, title: apiPlain(heading.textContent), after: after.innerHTML };
}

function AcademicFeatureReadMore({ section }: { section: ReturnType<typeof academicFeatureReadMore> }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  if (!section) return null;
  return <div className="academic-feature-read-more">
    {(apiPlain(section.before) || /<(img|table)\b/i.test(section.before)) && <ApiRichText html={section.before} scrollTables />}
    <h5>{section.title}</h5>
    <button className="expandable-toggle" type="button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(open => !open)}>
      {expanded ? 'Read less ↑' : 'Read more ↓'}
    </button>
    {expanded && <div id={id}><ApiRichText html={section.after} scrollTables /></div>}
  </div>;
}

function FeatureTabContent({ section, id, collaborations = [], paused = false }: {
  section: AcademicSection; id: string; collaborations?: AcademicSection[]; paused?: boolean;
}) {
  const content = useMemo(() => academicFeatures(section.html), [section.html]);
  const plainTextFeatures = academicSectionKey(section.title) === 'features';
  const readMore = useMemo(() => plainTextFeatures ? academicFeatureReadMore(section.html) : null, [plainTextFeatures, section.html]);
  return <div className={`academic-tab-content${plainTextFeatures ? ' academic-feature-text-content' : ' academic-tab-accordions'}`}>
    {(apiPlain(content.remaining) || /<(img|table)\b/i.test(content.remaining)) && (plainTextFeatures && readMore
      ? <AcademicFeatureReadMore section={readMore} />
      : <ApiRichText html={content.remaining} scrollTables />)}
    {plainTextFeatures && !readMore
      ? <div className="academic-feature-text-list">
          {content.points.map((point, index) => <article className="academic-feature-text-item" key={`${point.title}-${index}`}>
            <h3>{point.title}</h3><ApiRichText html={point.html || point.description} scrollTables />
          </article>)}
        </div>
      : !plainTextFeatures && <AcademicAccordions sections={academicFeatureAccordionSections(content.points)} id={`${id}-features`} />}
    {collaborations.map((item, index) => <BtechCollaborationSection key={`${item.title}-${index}`} section={item} paused={paused} />)}
  </div>;
}

function GnmGlobalCareerPathways({ section }: { section: AcademicSection }) {
  const content = useMemo(() => academicFeatures(section.html), [section.html]);
  return <section className="gnm-global-pathways" aria-label={section.title}>
    <div className="gnm-global-pathways-overview">
      <div className="gnm-global-pathways-copy">
        <h2>Global Learning <span>&amp; Study Abroad Pathways</span></h2>
        {(apiPlain(content.remaining) || /<(img|table)\b/i.test(content.remaining)) && <ApiRichText html={content.remaining} scrollTables />}
      </div>
      <div className="gnm-global-pathways-map" aria-hidden="true" />
    </div>
    <div className="gnm-global-pathways-collage" aria-hidden="true">
      <i /><i /><i /><i /><i />
    </div>
    {content.points.length > 0 && <div className="gnm-global-pathways-points">
      {content.points.map((point, index) => <article className="gnm-global-pathway-point" key={`${point.title}-${index}`}>
        <h3>{point.title}</h3>
        <ApiRichText html={point.html || point.description} scrollTables />
      </article>)}
    </div>}
  </section>;
}

function advancedComputingCurriculumSections(source: string): AcademicSection[] {
  if (typeof DOMParser === 'undefined') return [];
  const document = new DOMParser().parseFromString(source, 'text/html');
  const headings = Array.from(document.body.querySelectorAll('h1,h2,h3,h4,h5,h6'))
    .filter(node => !node.closest('table,ul,ol'));
  const headingKey = (node: Element) => apiPlain(node.textContent).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const designed = headings.find(node => headingKey(node) === 'co designed curriculum');
  const integration = headings.find(node => headingKey(node) === 'curriculum and industry integration');
  if (!designed || !integration || headings.indexOf(designed) >= headings.indexOf(integration)) return [];
  const extract = (start: Element | null, end: Element | null) => {
    const range = document.createRange();
    range.selectNodeContents(document.body);
    if (start) range.setStartAfter(start);
    if (end) range.setEndBefore(end);
    const content = document.createElement('div');
    content.append(range.cloneContents());
    return content.innerHTML;
  };
  return [
    { title: apiPlain(designed.textContent), html: extract(null, designed) + extract(designed, integration) },
    { title: apiPlain(integration.textContent), html: extract(integration, null) },
  ];
}

function AdvancedComputingCurriculumContent({ section, id }: { section: AcademicSection; id: string }) {
  const sections = useMemo(() => advancedComputingCurriculumSections(section.html), [section.html]);
  return sections.length === 2
    ? <AcademicAccordions sections={sections} id={id} />
    : <TabRichCopy section={section} />;
}

function isAcademicFeatureSection(section: AcademicSection, info: AcademicInfo) {
  const key = academicSectionKey(section.title);
  return ['difference','features','pillars','global-difference'].includes(key) ||
    isAdvancedComputingAcademicPage(info) && key === 'industry-aligned-curriculum';
}

function advancedComputingOptionAccordions(source: string): { intro: string; trailing: string; sections: AcademicSection[] } | null {
  if (typeof DOMParser === 'undefined') return null;
  const document = new DOMParser().parseFromString(source, 'text/html');
  const table = document.querySelector('table');
  if (!table) return null;
  const headerRow = table.querySelector('thead tr') || Array.from(table.querySelectorAll('tr')).find(row =>
    Array.from(row.children).some(cell => cell.tagName === 'TH'));
  if (!headerRow) return null;
  const headers = Array.from(headerRow.children).filter(cell => /^(TH|TD)$/.test(cell.tagName));
  if (headers.length !== 4) return null;
  const rows = Array.from(table.querySelectorAll('tr')).filter(row => row !== headerRow);
  const dataRows = rows.map(row => Array.from(row.children).filter(cell => /^(TH|TD)$/.test(cell.tagName)))
    .filter(cells => cells.length >= 4);
  if (!dataRows.length) return null;

  const extract = (before: boolean) => {
    const range = document.createRange();
    range.selectNodeContents(document.body);
    if (before) range.setEndBefore(table);
    else range.setStartAfter(table);
    const holder = document.createElement('div');
    holder.append(range.cloneContents());
    return holder.innerHTML;
  };

  const sections = headers.map((header, column): AcademicSection => {
    const title = apiPlain(header.textContent);
    const entries = dataRows.map(cells => {
      const pathway = apiPlain(cells[0].textContent);
      const value = cells[column].innerHTML.trim();
      if (!value) return '';
      const entry = document.createElement('div');
      entry.className = 'advanced-computing-option-entry';
      if (column > 0 && pathway) {
        const heading = document.createElement('h4');
        heading.textContent = pathway;
        entry.append(heading);
      }
      const copy = document.createElement('div');
      copy.innerHTML = value;
      // CMS table cells can contain Bootstrap/grid classes and inline typography
      // that do not belong inside the compact accordion layout. Keep semantic
      // content and functional links/images, but discard presentation attributes.
      copy.querySelectorAll('*').forEach(node => {
        const keep = new Set(
          node.tagName === 'A'
            ? ['href', 'title']
            : node.tagName === 'IMG'
              ? ['src', 'data-src', 'data-lazy-src', 'alt', 'title']
              : ['colspan', 'rowspan', 'scope']
        );
        Array.from(node.attributes).forEach(attribute => {
          if (!keep.has(attribute.name.toLowerCase())) node.removeAttribute(attribute.name);
        });
      });
      entry.append(copy);
      return entry.outerHTML;
    }).filter(Boolean);
    return { title, html: entries.join('') };
  }).filter(section => !!section.title && !!section.html);

  if (sections.length !== 4) return null;
  return { intro: extract(true), trailing: extract(false), sections };
}

function AdvancedComputingOptionsContent({ section, id }: { section: AcademicSection; id: string }) {
  const parsed = useMemo(() => advancedComputingOptionAccordions(section.html), [section.html]);
  if (!parsed) return <section className="academic-api-section" data-content-kind="options">
    <h2>{section.title}</h2><ApiRichText html={section.html} scrollTables />
  </section>;
  return <section className="academic-api-section academic-program-options-accordion" data-content-kind="options">
    <h2>{section.title}</h2>
    {parsed.intro && <ApiRichText html={parsed.intro} scrollTables />}
    <AcademicAccordions sections={parsed.sections} id={id} />
    {parsed.trailing && <ApiRichText html={parsed.trailing} scrollTables />}
  </section>;
}

function ProgramOptionsCards({ sections }: { sections: AcademicSection[] }) {
  if (!sections.length) return null;
  return <section className="program-options-cards" aria-labelledby="academic-program-options-title">
    <h2 id="academic-program-options-title">Program Options</h2>
    <div className="program-options-grid">
      {sections.map((section, index) => <article className="program-options-card" key={`${section.title}-${index}`}>
        <h3>{section.title}</h3>
        <ApiRichText html={section.html} scrollTables />
      </article>)}
    </div>
  </section>;
}

function ProgramFocusCards({ section }: { section: AcademicSection }) {
  const cards=useMemo(()=>academicColumnSections(section.html),[section.html]);
  if(!cards.length)return <section className="program-options-cards academic-core-program-focus" data-content-kind="core-focus">
    <h2>{section.title}</h2><ApiRichText html={section.html} scrollTables />
  </section>;
  return <section className="program-options-cards academic-core-program-focus" data-content-kind="core-focus">
    <h2>{section.title}</h2>
    <div className="program-options-grid">{cards.map((card,index)=><article className="program-options-card academic-core-focus-card" key={`${card.title}-${index}`}>
      <h3>{card.title}</h3><ApiRichText html={card.html} scrollTables />
    </article>)}</div>
  </section>;
}

/** Retain each CMS slider card's image, name and caption together. */
function TabRichCopy({section}:{section:AcademicSection}) {
  const accordionId=useId();
  return <ApiRichText html={section.html} scrollTables renderElement={(element,key)=>{
    // CMS toggles carry real content but their old jQuery is intentionally not
    // executed. Reuse the project's accessible, single-open accordion instead.
    if(element.matches('.accordion') && element.querySelector('.toggle')){
      const remaining=element.cloneNode(true) as Element;
      const sections=Array.from(remaining.querySelectorAll('.toggle')).flatMap(toggle=>{
        if(toggle.closest('.accordion')!==remaining)return [];
        const title=apiPlain(toggle.querySelector('.toggle-title')?.textContent);
        const content=toggle.querySelector('.toggle-content');
        if(!title || !content || !apiPlain(content.innerHTML) && !content.querySelector('img,table'))return [];
        const html=content.innerHTML;toggle.remove();return [{title,html}];
      });
      if(sections.length)return <div key={key}>
        {(apiPlain(remaining.innerHTML) || remaining.querySelector('img,table')) && <ApiRichText html={remaining.innerHTML} scrollTables />}
        <AcademicAccordions sections={sections} id={`${accordionId}-${key}`} />
      </div>;
    }
    if(!element.classList.contains('slick_slider'))return undefined;
    const cards=Array.from(element.children);
    if(!cards.some(card=>card.querySelector('img')))return undefined;
    return <StepSlider key={key} className="academic-api-gallery academic-api-card-gallery" size={4} loop horizontalOnMobile interval={3900} label={section.title} controls>
      {cards.map((card,index)=><div className="academic-api-gallery-card" key={index}><ApiRichText html={card.outerHTML} scrollTables /></div>)}
    </StepSlider>;
  }} />;
}

function BtechQuantumOpportunities({html}:{html:string}) {
  return <div className="academic-btech-quantum-news">
    <ApiRichText html={html} renderElement={(element,key)=>{
      if(element.tagName!=='DIV')return undefined;
      const children=Array.from(element.children);
      if(children.length!==2)return undefined;
      const imageContainer=children.find(child=>child.querySelectorAll('img').length===1&&!child.querySelector('h5'));
      const copyContainer=children.find(child=>child.querySelectorAll('h5').length===1&&!child.querySelector('img'));
      const image=imageContainer?.querySelector('img');
      const title=copyContainer?.querySelector('h5');
      if(!imageContainer || !copyContainer || !image || !title)return undefined;
      const date=apiPlain(imageContainer.querySelector('span')?.textContent);
      return <article className="academic-btech-quantum-story" key={key}>
        <div className="academic-btech-quantum-image"><ApiRichText html={image.outerHTML} /></div>
        <div className="academic-btech-quantum-copy">
          {date&&<p className="academic-btech-quantum-date">{date}</p>}
          <ApiRichText html={title.outerHTML} />
        </div>
      </article>;
    }} />
  </div>;
}

function TabBody({section,nested,id,hr=false,singleAccordion=false,semesterAccordion=false}:{section:AcademicSection;nested:AcademicBlock['nested'];id:string;hr?:boolean;singleAccordion?:boolean;semesterAccordion?:boolean}) {
  const courseHighlightSections = useMemo(() => {
    if (academicSectionKey(section.title) !== 'course highlights') return [];
    const wanted = new Set(['streamlined cpa qualification', 'progression and coursework']);
    const parsed = splitAcademicContent(section.html, wanted);
    const matched = parsed.sections.filter(part => wanted.has(academicSectionKey(part.title)));
    return matched.length ? matched : [];
  }, [section.title, section.html]);
  const learningEnvironment=useMemo(()=>academicSectionKey(section.title)==='laboratories' ? academicLearningEnvironmentSection(section.html) : null,[section.title,section.html]);
  if (academicSectionKey(section.title) === 'course highlights') {
    const intro = splitAcademicContent(section.html, new Set(['streamlined cpa qualification', 'progression and coursework'])).intro;
    return <div className="academic-tab-content academic-tab-accordions" data-tab-kind="course highlights">
      {(apiPlain(intro) || /<(img|table)\b/i.test(intro)) && <TabRichCopy section={{title:section.title,html:intro}} />}
      <AcademicAccordions sections={courseHighlightSections} id={id} />
      {!courseHighlightSections.length && <TabRichCopy section={section} />}
    </div>;
  }
  const kind=academicSectionKey(section.title);
  if(kind==='laboratories' && learningEnvironment)return <div className="academic-tab-content academic-tab-accordions" data-tab-kind={kind}>
    {(apiPlain(learningEnvironment.before) || /<(img|table)\b/i.test(learningEnvironment.before)) && <TabRichCopy section={{title:section.title,html:learningEnvironment.before}} />}
    <AcademicAccordions sections={[learningEnvironment.section]} id={`${id}-learning-environment`} />
    {(apiPlain(learningEnvironment.after) || /<(img|table)\b/i.test(learningEnvironment.after)) && <TabRichCopy section={{title:section.title,html:learningEnvironment.after}} />}
  </div>;
  if(semesterAccordion && kind==='structure'){
    const semesterParts=academicSemesterContent(section.html);
    if(semesterParts.handled){
      return <div className="academic-tab-content academic-tab-accordions" data-tab-kind="course structure">
        {(apiPlain(semesterParts.intro) || /<(img|table)\b/i.test(semesterParts.intro)) && <TabRichCopy section={{title:section.title,html:semesterParts.intro}} />}
        <AcademicAccordions sections={semesterParts.sections} id={`${id}-semesters`} />
      </div>;
    }
  }
  const rules=nested?.find(rule=>academicSectionKey(rule.parent)===academicSectionKey(section.title));
  if(!rules){
    const parts=academicTabContent(section.html,hr || ['structure','scholarship','course highlights'].includes(kind),singleAccordion || kind==='course highlights');
    const combined=singleAccordion ? academicSingleAccordionSection(parts) : null;
    return <div className={`academic-tab-content${hr?' academic-hr-tab-content':''}${parts.sections.length?' academic-tab-accordions':''}`} data-tab-kind={academicSectionKey(section.title)}>
      {parts.sections.length ? singleAccordion && combined
        ? <AcademicAccordions sections={[combined]} id={id} />
        : <>{(apiPlain(parts.intro) || /<(img|table)\b/i.test(parts.intro)) && <TabRichCopy section={{title:section.title,html:parts.intro}} />}<AcademicAccordions sections={parts.sections} id={id} /></>
        : kind==='scholarship' ? <AcademicAccordions sections={[section]} id={id} /> : <TabRichCopy section={section} />}
    </div>;
  }
  const wanted=new Set(rules.titles.map(academicSectionKey)),parts=splitAcademicContent(section.html,wanted);
  const matched=parts.sections.filter(part=>wanted.has(academicSectionKey(part.title)));
  const folded=rules.titles.flatMap(title=>{
    const children=matched.filter(part=>academicSectionKey(part.title)===academicSectionKey(title));
    return children.length ? [{title:children[0].title,html:children.map((part,index)=>`${index ? `<h3>${part.title.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</h3>` : ''}${part.html}`).join('')}] : [];
  });
  return <>{parts.intro&&<ApiRichText html={parts.intro} scrollTables />}
    {parts.sections.filter(part=>!matched.includes(part)).map((part,i)=><div key={i}><h3>{part.title}</h3><ApiRichText html={part.html} scrollTables /></div>)}
    <AcademicAccordions sections={folded} id={id} />
  </>;
}

function BaLlbDegreeContent({ id }: { id: string }) {
  const sections = [
    {
      title: 'Five-Year Integrated Program',
      html: '<p><strong>It is a time-efficient course.</strong> The B.A. LL.B. (Hons.) is an integrated five-year course, saving a year compared to pursuing a separate BA and LLB. Students can begin their legal education immediately after completing high school (12th grade), entering the professional world sooner.</p>',
    },
    {
      title: 'Interdisciplinary Learning',
      html: '<p><strong>B.A. LL.B. (Hons.) is a blend of Law and Arts.</strong> The course integrates law with subjects like Political Science, History, English Literature, Economics, Geography, Philosophy, Sociology, Journalism and Mass Communication, Public Administration, Psychology and Management offering a comprehensive understanding of the legal system in its social and political context.</p>',
    },
    {
      title: 'Strong Foundation in Law',
      html: '<p><strong>This course gives core legal knowledge.</strong> Students study foundational legal subjects like Constitutional Law, Criminal Law, Contract Law, and International Law. Moot courts, internships, legal aid clinics, and workshops provide hands-on experience in real-world legal scenarios. The specialisation in law is offered from the very first semester.</p>',
    },
    {
      title: 'Holistic Career Preparation',
      html: '<p><strong>B.A. LL.B. (Hons.) provides diverse career options.</strong> The course prepares students for careers in legal practice, judiciary, civil services, public policy, corporate law, academics, journalism, and more.</p>',
    },
    {
      title: 'Industry-Ready Skills',
      html: '<p><strong>DBS Global University offers soft skills training, communication workshops, personality development and future skill courses</strong> to prepare students for interviews and professional settings. Exposure to internships, legal luminaries, and seminars ensures students build strong professional connections.</p>',
    },
    {
      title: 'Experiential Learning',
      html: '<p><strong>The B.A. LL.B. (Hons.) program emphasizes hands-on learning</strong> through moot court competitions, mock trials, and trial advocacy exercises that help students develop courtroom skills and legal reasoning. Students engage in live projects, case studies, and legal research assignments, gaining practical insights into contemporary legal issues.</p>',
    },
  ];
  return <div className="academic-tab-content academic-tab-accordions" data-tab-kind="ba-llb-degree">
    <ApiRichText html={'<p><strong>B.A. LL.B. (Hons.) (Bachelor of Arts and Bachelor of Laws)</strong> course lies in its combination of <strong>legal education</strong> with an <strong>understanding</strong> of <strong>social sciences</strong>. This interdisciplinary approach prepares students to excel not just in law but also in fields like public policy, governance, and international relations.</p>'} scrollTables />
    <AcademicAccordionGroup id={id} items={sections.map(section => ({
      title: section.title,
      content: <AcademicAccordionCopy html={section.html} />,
    }))} />
  </div>;
}

function ProgramLinks({items,title,school=false}:{items:SchoolProgram[];title:string;school?:boolean}) {
  if(!items.length)return null;
  const groups=school ? groupSchoolPrograms(items) : Array.from({length:Math.min(3,Math.ceil(items.length/4))},(_,i)=>({title:'',items:items.filter((_,index)=>index%Math.min(3,Math.ceil(items.length/4))===i)}));
  return <section className={school ? 'schools-section school-programs-section' : 'program-specializations'} data-content-kind="program-links" aria-label={title || 'Related program specializations'}>
    {title && <h2>{title}</h2>}<div className={school ? 'schools-grid school-programs-grid' : 'program-specialization-grid'}>{groups.map((group,i)=><ProgramCard key={i} title={group.title} items={group.items} variant={school ? 'default' : 'specialization'} animationIndex={i} expandableItems={school} />)}</div>
  </section>;
}

const bbaLlbFeatureDescriptions = [
  ['Dual Expertise', 'It equips students with in-depth knowledge of law and business management, making them versatile professionals who can navigate both corporate and legal landscapes.'],
  ['Corporate Law Focus', 'Tailored for those interested in corporate law, mergers and acquisitions, compliance, and intellectual property rights, it bridges the gap between business operations and legal frameworks.'],
  ['Enhanced Career Opportunities', 'Graduates can explore careers in law firms, corporate houses, financial institutions, consulting firms, and entrepreneurial ventures, offering a wide range of opportunities.'],
  ['Global Relevance', 'With globalization, there is an increasing demand for professionals who understand international business laws, regulatory frameworks, and the legal implications of global trade.'],
  ['Critical Skills Development', 'The program hones analytical, negotiation, communication, and decision-making skills, essential for leadership roles in business and law.'],
] as const;

const bbaLlbFeatureContent = {
  points: bbaLlbFeatureDescriptions.map(([title, description]) => ({
    title,
    description,
    html: `<p>${description}</p>`,
  })),
  remaining: '',
};

const llmFeatureDescriptions = [
  ['Specialized Legal Expertise and Higher Skills', 'Gain advanced knowledge and skills in niche areas like international law, corporate law, constitutional law, criminal law, and intellectual property, making you a sought-after expert in your chosen field.'],
  ['Global Career Opportunities', 'The LL.M. program provides international exposure, familiarizes you with cross-border legal systems, and qualifies you for practice in jurisdictions like the U.S. or U.K., significantly expanding your career horizons.'],
  ['Career Advancement and Higher Earning Potential', 'An LL.M. enhances your professional credentials, positioning you for senior roles in law firms, multinational corporations, academia, and policy-making bodies with better earning potential.'],
  ['Networking and Professional Connections', 'Build a global network of peers, professors, and industry professionals, opening doors to collaborations, mentorship, and career growth.'],
  ['Pathway to Academic and Research Excellence', 'Develop critical research, writing, and analytical skills, paving the way for roles in academia, policy research, or a Ph.D. in Law.'],
] as const;

const llmFeatureContent = {
  points: llmFeatureDescriptions.map(([title, description]) => ({
    title,
    description,
    html: `<p>${description}</p>`,
  })),
  remaining: '',
};

function FeatureSection({section,id,info,collaborations=[],paused=false}:{section:AcademicSection;id:string;info:AcademicInfo;collaborations?:AcademicSection[];paused?:boolean}) {
  const content=useMemo(()=>{if(academicSectionKey(section.title)==='features'){if(info.slug==='bba-llb')return bbaLlbFeatureContent;if(info.slug==='llm')return llmFeatureContent;}const parsed=academicFeatures(section.html);return parsed.points.length ? parsed : {points:[{title:section.title,description:apiPlain(section.html),html:section.html}],remaining:''};},[info.slug,section.html,section.title]);
  const [selected,setSelected]=useState('');
  const points=useMemo(()=>content.points.map((point,index)=>{const description=point.description.replace(/\s+/g,' ').trim();return {...point,description:description.length>150 ? description.slice(0,150).replace(/\s+\S*$/,'')+'…' : description,icon:sitePath(`/assets/svg/${index%6+1}.svg`)};}),[content]);
  const active=points.find(point=>point.title===selected);
  const [hovered,setHovered]=useState<{title:string;anchor:HTMLElement}|null>(null),hoverId=useId();
  const closing=useRef<ReturnType<typeof setTimeout>|null>(null);
  const cancelClose=()=>{if(closing.current)clearTimeout(closing.current);};
  const closeHover=()=>{cancelClose();setHovered(null);};
  const scheduleClose=()=>{cancelClose();closing.current=setTimeout(()=>setHovered(null),180);};
  useEffect(()=>()=>{if(closing.current)clearTimeout(closing.current);},[]);
  const hoverPoint=points.find(point=>point.title===hovered?.title);
  if(!points.length)return <section className="academic-api-section" data-content-kind="features"><h2>{section.title}</h2><ApiRichText html={section.html} scrollTables />{collaborations.map((item,index)=><BtechCollaborationSection key={`${item.title}-${index}`} section={item} paused={paused} />)}</section>;
  if(academicSectionKey(section.title)==='features' && info.slug!=='bba-mba-integrated' && info.slug!=='bba-llb' && info.slug!=='llm')
    return <FeatureTabContent section={section} id={id} collaborations={collaborations} paused={paused} />;
  if(isAdvancedComputingAcademicPage(info) && academicFeaturePresentation(points.length,7)==='tab')return <FeatureTabContent section={section} id={id} collaborations={collaborations} paused={paused} />;
  return <div className="academic-api-features academic-interactive-features" data-content-kind="features">
    <DifferentiatorSection id={id} title={section.title} points={points.slice(0,6)} variant={points.length<=4 ? 'school' : 'default'}
      introduction={apiPlain(content.remaining) || /<(img|table)\b/i.test(content.remaining) ? <ApiRichText html={content.remaining} scrollTables /> : undefined}
      detailsInDialog pointInteraction fitPoints hoveredPoint={hovered?.title} tooltipId={hoverId}
      onPointHover={(point,anchor)=>{cancelClose();setHovered({title:point.title,anchor});}} onPointHoverEnd={scheduleClose}
      onPointReadMore={point=>{closeHover();setSelected(point.title);}} />
    <AcademicFeatureDialog point={active} onClose={()=>setSelected('')} />
    {hovered && hoverPoint && <AcademicFeatureHover point={hoverPoint} anchor={hovered.anchor} id={hoverId} onEnter={cancelClose} onLeave={scheduleClose} onDismiss={closeHover} />}
    {!isAdvancedComputingAcademicPage(info) && points.length>6 && <AcademicAccordions sections={points.slice(6).map(point=>({title:point.title,html:point.html}))} id={`${id}-additional`} />}
    {collaborations.map((item,index)=><BtechCollaborationSection key={`${item.title}-${index}`} section={item} paused={paused} />)}
  </div>;
}

/** Reuse the project's film-and-counters design with this school's API values. */
function SchoolVideoHighlights({info,paused}:{info:AcademicInfo;paused:boolean}) {
  const stats=info.facts.length ? info.facts.map(fact=>[fact.value,fact.label] as const) : info.videoStats;
  if(!stats.length && !info.video)return null;
  return <AdmissionsVideo src={info.video || undefined} poster={info.videoPoster || sitePath('/assets/hero-campus.webp')} stats={stats} variant="program" paused={paused} />;
}

function Block({block,info,paused,index,catalogue,other}:{block:AcademicBlock;info:AcademicInfo;paused:boolean;index:number;catalogue:ReturnType<typeof useSchoolCatalogue>;other:{loading:boolean;error:boolean;retry:()=>void}}) {
  const id=`academic-${info.kind}-${index}`,title=block.sections[0]?.title || block.title;
  if(block.kind==='tracks')return info.tracks.length ? <AcademicContent id={`${id}-tracks`} heading={info.tracksHeading} label={info.tracksHeading} className="program-pathways academic-track-tabs"
    tabs={info.tracks.map((track,i)=>({key:String(i),title:track.title,content:<AcademicAccordions sections={trackAccordions(track.html)} id={`${id}-track-${i}`} />}))}/> : null;
  if(block.kind==='tabs' && block.title==='Program Options' && info.programOptions?.length) return <ProgramOptionsCards sections={block.sections} />;
  if(block.kind==='tabs' && info.kind==='school' && isAdvancedComputing(info) && block.sections.some(section=>academicSectionKey(section.title)==='options')) {
    const options=block.sections.filter(section=>academicSectionKey(section.title)==='options');
    const remaining=block.sections.filter(section=>academicSectionKey(section.title)!=='options');
    return <>{options.map((section,i)=><AdvancedComputingOptionsContent key={`${id}-options-${i}`} section={section} id={`${id}-options-${i}`} />)}
      {remaining.length>0 && <AcademicContent id={id} heading={block.title || undefined} label={`${info.name} information`} className="program-pathways" tabsClassName="program-details-tabs"
        tabs={remaining.map((section,i)=>({key:String(i),title:section.title,content:<TabBody section={section} nested={block.nested} id={`${id}-${i}`} />}))} />}
    </>;
  }
  if(block.kind==='tabs') {
    const tabs=block.sections.map((section,i)=>({key:String(i),title:section.title,content:academicSectionKey(section.title)==='other-programs'
      ? <><ApiRichText html={section.html} scrollTables /><ProgramLinks items={info.otherPrograms} title="" />
        {!info.otherPrograms.length&&other.loading&&<p role="status">Loading related specializations…</p>}
        {!info.otherPrograms.length&&other.error&&<div role="alert"><p>Related specializations are temporarily unavailable.</p><button className="text-link" type="button" onClick={other.retry}>Try again</button></div>}
        {!info.otherPrograms.length&&!other.loading&&!other.error&&<p>No other related specializations are currently listed.</p>}
      </>
      : info.slug==='general-nursing-and-midwifery' && academicSectionKey(section.title)==='global-pathway'
        ? <GnmGlobalCareerPathways section={section} />
      : info.slug==='mba-international-business' && academicSectionKey(section.title)==='careers'
        ? <ApiRichText html={section.html} scrollTables />
      : info.slug==='mba-agri-business' && academicSectionKey(section.title)==='careers'
        ? <CareerAccordionContent html={section.html} id={`${id}-${i}-career`} />
      : info.slug==='bca-with-specialization' && academicSectionKey(section.title)==='careers'
        ? <BcaCareerAccordionContent section={section} id={`${id}-${i}-career`} />
      : isAdvancedComputingAcademicPage(info) && academicSectionKey(section.title)==='industry'
        ? <AdvancedComputingCurriculumContent section={section} id={`${id}-${i}-curriculum`} />
      : info.slug==='btech' && academicSectionKey(section.title)==='higher-education'
        ? <div className="academic-btech-higher-education"><GalleryCopy section={section} paused={paused} /></div>
      : info.slug==='btech' && section.title.trim().toLowerCase()==='quantum computing opens new career opportunities in india'
        ? <BtechQuantumOpportunities html={section.html} />
      : info.slug==='bba-mba-integrated' && academicSectionKey(section.title)==='features'
        ? <FeatureSection section={section} id={`${id}-${i}`} info={info} paused={paused} />
      : info.slug==='bba-llb' && academicSectionKey(section.title)==='features'
        ? <FeatureSection section={section} id={`${id}-${i}`} info={info} paused={paused} />
      : info.slug==='llm' && academicSectionKey(section.title)==='features'
        ? <FeatureSection section={section} id={`${id}-${i}`} info={info} paused={paused} />
      : academicSectionKey(section.title)==='features'
        ? <FeatureTabContent section={section} id={`${id}-${i}`} collaborations={block.featureCollaborations} paused={paused} />
      : isAdvancedComputingAcademicPage(info) && isAcademicFeatureSection(section,info) && academicFeaturePresentation(academicFeatures(section.html).points.length,7)==='tab'
        ? <FeatureTabContent section={section} id={`${id}-${i}`}
            paused={paused} />
      : info.slug==='btech' && academicSectionKey(section.title)==='advantage' && block.featureCollaborations?.length
        ? <><TabBody section={section} nested={block.nested} id={`${id}-${i}`} />
          {block.featureCollaborations.map((item,index)=><BtechCollaborationSection key={`${item.title}-${index}`} section={item} paused={paused} />)}
        </>
        : <TabBody section={section} nested={block.nested} id={`${id}-${i}`} hr={info.slug==='mba-human-resource'} singleAccordion={info.slug==='mba-agri-business' && academicSectionKey(section.title)==='structure'} semesterAccordion={info.kind==='program' && ['bcom-cpa','bcom-uscpa'].includes(info.slug)} />}));
    if(info.kind==='program' && info.slug==='ba-llb') {
      const degreeSections=block.sections.filter(section=>['humanities','law','baskets'].includes(academicSectionKey(section.title)));
      if(degreeSections.length) {
        const insertAt=block.sections.reduce((last,section,index)=>degreeSections.includes(section) ? index+1 : last,0);
        tabs.splice(insertAt,0,{
          key:'ba-llb-degree-content',
          title:'B.A. LL.B. (Hons.) (Bachelor of Arts and Bachelor of Laws)',
          content:<BaLlbDegreeContent id={`${id}-ba-llb-degree`} />,
        });
      }
    }
    return <AcademicContent id={id} heading={block.title || undefined} label={`${info.name} information`} className="program-pathways" tabsClassName="program-details-tabs" tabs={tabs} />;
  }
  if(block.kind==='accordion')return info.kind==='program' && info.slug==='bba-llb'
    ? <LegalProgrammeExperiencePoints sections={block.sections} />
    : <AcademicAccordions sections={block.sections} id={id} title={info.kind==='program' && info.slug==='ba-llb' ? 'Legal Programme Experiences' : info.slug==='mba' ? 'INDUSTRY COLLABORATION' : ''}/>;
  if(block.kind==='industry')return <AcademicAccordions sections={block.sections} lead={block.lead} id={id} title={block.title} />;
  if(block.kind==='laboratories')return <>{block.sections.map((section,sectionIndex)=>{
    const labs=academicLaboratories(section,info.linkedPages);
    return <section className="academic-api-section" data-content-kind="laboratories" key={sectionIndex}><h2>{section.title}</h2><ApiRichText html={labs.intro} scrollTables />
      {labs.tabs.length>0 && <AcademicContent id={`${id}-labs-${sectionIndex}`} label={section.title} className="program-pathways academic-laboratory-tabs" tabs={labs.tabs.map((tab,tabIndex)=>({key:String(tabIndex),title:tab.title,content:tab.html ? <GalleryCopy section={tab} paused={paused} /> : <a className="text-link" href={tab.href}>{tab.title}</a>}))} />}
    </section>;
  })}</>;
  if(block.kind==='programs')return catalogue.loading || catalogue.error
    ? <section className="schools-section school-programs-section"><h2>OUR PROGRAMS</h2>{catalogue.loading ? <p role="status">Loading school programmes…</p> : <div role="status"><p>Programmes are temporarily unavailable.</p><button className="text-link" type="button" onClick={catalogue.retry}>Try again</button></div>}</section>
    : <ProgramLinks items={info.programs.flatMap(s=>s.programs)} title="OUR PROGRAMS" school />;
  if(block.kind==='specializations' || block.kind==='other-programs')return <><ProgramLinks items={block.kind==='specializations' ? info.relatedPrograms : info.otherPrograms} title={block.title} />
    {block.sections.map((s,i)=><section className="academic-api-section" key={i}><h2>{s.title}</h2><ApiRichText html={s.html} scrollTables /></section>)}</>;
  if(block.kind==='news')return <NewsUpdatesSection paused={paused} id={`${id}-news`} />;
  if(block.kind==='career-prospects')return <GnmCareerProspects />;
  if(block.kind==='faculty')return info.schoolUrl ? <SchoolFaculty key={info.schoolUrl} schoolUrl={info.schoolUrl} schoolName={info.schoolName || info.name} facultyIds={info.facultyIds} members={info.faculty} paused={paused} variant="reference" /> : null;
  if(block.kind==='testimonials')return <AcademicTestimonials items={info.testimonials || []} id={id} paused={paused} />;
  if(block.kind==='faqs')return <FaqSection items={info.faqs} />;
  if(block.kind==='section' && info.slug==='ba-llb' && block.sections.some(section=>academicSectionKey(section.title)==='features'))return null;
  // School video/counters have one fixed position immediately above recruiters.
  if(block.kind==='video'){
    if(info.kind==='school')return <SchoolVideoHighlights info={info} paused={paused} />;
    const gnm=info.slug==='general-nursing-and-midwifery';
    const src=info.video || (gnm ? sitePath('/assets/mba.mp4') : '');
    const poster=info.videoPoster || (gnm ? sitePath('/assets/building.webp') : '');
    return src ? <AdmissionsVideo src={src} poster={poster || undefined} stats={info.videoStats} variant="program" paused={paused} /> : null;
  }
  if(block.kind==='international'){
    if(!block.sections.length)return info.slug==='general-nursing-and-midwifery' ? <GlobalLearning paused={paused} /> : null;
    const gallery=academicGallery(block.sections.map(s=>s.html).join(''),true);
    return <GlobalLearning heading={title} subtitle="" apiOnly contentHtml={gallery.html} photos={gallery.photos} partners={gallery.partners} paused={paused} />;
  }
  if(block.kind==='placements')return <>
    <SchoolPlacementsSection apiSchoolUrl={info.kind==='school' ? (info.slug==='school-of-law' || info.slug==='school-of-liberal-studies' ? info.slug : info.students.length || info.placementScopeVerified ? undefined : info.schoolUrl || null) : undefined} apiProgramUrl={info.kind==='program' ? info.slug : undefined} apiFallbackSchoolUrl={placementSchoolUrl(info)} homepageCopy={info.kind!=='school' || info.slug==='school-of-law'} paused={paused} contentHtml={block.sections.map(s=>s.html).join('')} detailHref={info.placementHref}
      placement={{title:block.sections[0]?.title || 'PLACEMENTS',tagline:info.placementTagline,description:'',videoTitle:'',videoPoster:'',stats:info.placementStats,students:info.students}} />
    {info.kind==='school' && info.slug!=='school-of-law' && <SchoolVideoHighlights info={info} paused={paused} />}
    <RecruitersSection paused={paused} items={info.recruiters.length>0 ? info.recruiters : undefined} title="Top Recruiters" />
  </>;
  if(block.kind==='section' && info.slug==='mba-international-business' && academicSectionKey(title)==='core program focus') return <ProgramFocusCards section={block.sections[0]} />;
  return <>{block.sections.map((section,i)=>{
    if(isAcademicFeatureSection(section,info) || info.kind==='program' && academicSectionKey(section.title)==='specification')
      return <FeatureSection section={section} id={`${id}-${i}`} info={info} key={i} collaborations={block.featureCollaborations} paused={paused} />;
    if(info.kind==='program' && info.slug==='bca-with-specialization' && academicSectionKey(section.title)==='specialization-options')
      return <BcaSpecializationOptions key={i} section={section} id={`${id}-${i}-specializations`} paused={paused} />;
    const btechCollaboration=isBtechProgramPage(info) && academicSectionKey(section.title)==='industry';
    if(btechCollaboration && info.slug==='btech-cse-in-quantum-computing-with-minor') return null;
    return btechCollaboration
      ? <BtechCollaborationAccordion key={i} section={section} paused={paused} />
      : <section className="academic-api-section" data-content-kind="section" key={i}>
          <h2>{section.title}</h2><GalleryCopy section={section} paused={paused}/>
        </section>;
  })}</>;
}

/** The single DBS/MBA design renderer. API content and guide placement are separate. */
export default function AcademicApiPage({kind,slug,recordId=''}:{kind:AcademicKind;slug:string;recordId?:string}) {
  const [menuOpen,setMenuOpen]=useState(false),[failedImages,setFailedImages]=useState<string[]>([]);
  const [bannerRatio,setBannerRatio]=useState('');
  const {info:pageInfo,loading,error,pending,retry}=useAcademicInfo(kind,slug,recordId);
  const catalogue=useSchoolCatalogue(kind==='school' ? slug : '');
  const other=useOtherSpecializations(pageInfo);
  const schoolPrograms=kind==='school' ? catalogue.schools : undefined;
  // Use the list API as the authority for school programmes and form choices.
  // Legacy detail responses may contain every specialization and extra levels.
  const info=useMemo(()=>{
    if(pending || !pageInfo)return null;
    const current=schoolPrograms ? {...pageInfo,programs:schoolPrograms} : other.items===pageInfo.otherPrograms ? pageInfo : {...pageInfo,otherPrograms:other.items};
    if(current.kind!=='school' || current.slug!=='school-of-law')return current;
    const isIntroSection=(section:AcademicSection)=>['vision','mission'].includes(academicSectionKey(section.title));
    const introTabs=[...current.tabs,...current.sections,...current.accordions,...current.pathways].filter(isIntroSection);
    if(!introTabs.length)return current;
    const addedContent=introTabs.map(section=>`<h2>${academicSectionKey(section.title)==='vision' ? 'Vision' : 'Mission'}</h2>${section.html}`).join('');
    return {...current,intro:`${current.intro}${addedContent}`,
      tabs:current.tabs.filter(section=>!isIntroSection(section)),
      sections:current.sections.filter(section=>!isIntroSection(section)),
      accordions:current.accordions.filter(section=>!isIntroSection(section)),
      pathways:current.pathways.filter(section=>!isIntroSection(section))};
  },[pending,pageInfo,schoolPrograms,other.items]);
  const introAccordions=useMemo(()=>{
    if(info?.slug==='btech-cse-with-spe-in-ai-and-ml-with-minor') return btechIntroAccordionContent(info.intro,'ai-ml');
    if(info?.slug==='btech-cse-in-quantum-computing-with-minor') return btechIntroAccordionContent(info.intro,'quantum-computing');
    if(info?.slug==='btech-cse-with-minor') return btechIntroAccordionContent(info.intro,'cse-minor');
    if(info?.slug==='btech-cse-lateral-entry') return btechIntroAccordionContent(info.intro,'lateral-entry');
    return null;
  },[info]);
  useEffect(()=>{
    if(!info)return;
    if(info.metaTitle)document.title=info.metaTitle;
    // Next/React owns the existing head nodes. Never detach its description
    // while API data is loading: route updates/Fast Refresh still reference it.
    if(info.metaDescription){
      let meta=document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if(!meta){meta=document.createElement('meta');meta.name='description';document.head.appendChild(meta);}
      meta.content=info.metaDescription;
    }
    if(info.metaKeywords){
      let meta=document.querySelector<HTMLMetaElement>('meta[name="keywords"]');
      if(!meta){meta=document.createElement('meta');meta.name='keywords';document.head.appendChild(meta);}
      meta.content=info.metaKeywords;
    }
  },[info]);
  const headerBrand=useAcademicBrand(kind,slug,info);
  const slides=info?.banners.filter(item=>!failedImages.includes(item.image)) || [];
  const hero=info?.banner || info?.mobileBanner || '';
  const media=slides.length ? slides : hero && !failedImages.includes(hero) ? [{image:hero,mobile:info?.mobileBanner || '',alt:info?.name || '',href:''}] : [];
  return <div className={`${kind==='school' ? 'school-page' : 'program-page'} academic-reference academic-api-page${menuOpen ? ' dgu-motion-paused' : ''}`} data-academic-kind={kind} data-api-slug={slug}>
    <header className="school-navigation" id="home"><Navigation onOpenChange={setMenuOpen} {...headerBrand} /></header>
    <main id="main" aria-busy={loading}>
      {pending && <div className="academic-api-feedback" role="status">Programme information will be available soon.</div>}
      {loading && <div className="academic-api-feedback" role="status">Loading current {kind==='school' ? 'school' : 'programme'} information…</div>}
      {error && <div className={`academic-api-feedback${kind==='school' && catalogue.schools.length ? ' academic-api-feedback--inline' : ''}`} role="alert"><p>Page information is temporarily unavailable.</p><button type="button" className="text-link" onClick={retry}>Try again</button></div>}
      {!info && !loading && kind==='school' && catalogue.schools.length>0 && <>
        {catalogue.schools[0].title && <section className="academic-title-strip"><h1 className="academic-page-title">{catalogue.schools[0].title}</h1></section>}
        <ProgramLinks items={catalogue.schools.flatMap(school=>school.programs)} title="OUR PROGRAMS" school />
      </>}
      {info && <>
        <section className={kind==='school' ? 'school-opening' : 'program-opening'} aria-label={`${info.name} banner`}>
          {kind==='school' && media.length>0 && <AnimatedHeroSlider key={`${info.kind}-${info.id}`} className="school-opening-media"
            slides={media} label={`${info.name} banners`} paused={menuOpen} interval={4200} variant="school" aspectRatio={bannerRatio}
            onImageRatio={setBannerRatio} onImageUnavailable={image=>setFailedImages(old=>old.includes(image)?old:[...old,image])} />}
          {kind==='program' && media[0] && <div className="program-hero" style={bannerRatio?{'--academic-banner-ratio':bannerRatio} as CSSProperties:undefined}>
            <AcademicBannerImage {...media[0]} active onRatio={setBannerRatio} onUnavailable={()=>setFailedImages(old=>old.includes(media[0].image)?old:[...old,media[0].image])}/>
          </div>}
        </section>
        <section className="academic-title-strip" aria-label={`${info.name} title`}>
          <h1 className="academic-page-title">{info.name}</h1>
        </section>
        <SchoolIntroSection reference contentHtml={introAccordions ? introAccordions.intro : info.intro} recognitions={info.recognitions} previewWords={kind==='school' ? 42 : 56} previewHeightOverride={info.slug==='dgu-global-mba' ? {desktop:760,mobile:360} : undefined}
          introAfter={introAccordions && <div className="academic-intro-program-accordions">
            <AcademicAccordionGroup id={`academic-intro-${info.id}`} items={introAccordions.sections.map(section=>({title:section.title,content:<AcademicAccordionCopy html={section.html} />}))} />
          </div>}
          data={{name:info.name,slug:info.schoolUrl,intro:'',partners:isAdvancedComputingAcademicPage(info)?advancedComputingPartners:undefined,showBusinessAccreditations:headerBrand.logoAlt==='Doon Business School'}}
          form={<><QuickContactForm key={info.id} apiOnly applyUrl={info.registrationLink} courses={kind==='program' ? [info.name] : info.programs.flatMap(s=>s.programs.map(p=>p.name))} selectedCourse={kind==='program' ? info.name : ''} />
            {(info.registrationLink || info.prospectusUrl) && <div className="program-api-actions">{info.registrationLink&&<a href={info.registrationLink}>Apply now</a>}{info.prospectusUrl&&<a href={info.prospectusUrl}>Download prospectus</a>}</div>}
          </>}>
          {kind==='program' && info.facts.length>0 && <dl className="dgu-program-facts">{info.facts.map(fact=><div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>}
        </SchoolIntroSection>
        {academicLayout(info).map((block,index)=><Block key={`${info.id}-${index}`} block={block} info={info} paused={menuOpen} index={index} catalogue={catalogue} other={other} />)}
      </>}
    </main>
    <SiteFooter />
  </div>;
}
