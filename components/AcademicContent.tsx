'use client';
import SlidingTabList from './SlidingTabList';

import { useRef, useState, type ReactNode } from 'react';
import ApiRichText from './ApiRichText';
import type { ProgramInfo } from './program-info-api';
import type { ProgramPageData } from './program-page-data';
import ProgramCard from './ProgramCard';
import AcademicAccordionGroup from './AcademicAccordionGroup';

type ContentTab = { key: string; title: string; content: ReactNode };

/** School and programme content use the same tabs as the MBA reference. */
export default function AcademicContent({ tabs, label, id, heading, className = 'program-admission-details', tabsClassName = 'program-details-tabs' }: {
  tabs: readonly ContentTab[]; label: string; id: string; heading?: string; className?: string; tabsClassName?: string;
}) {
  const [selected, setSelected] = useState('');
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const active = tabs.some(tab => tab.key === selected) ? selected : tabs[0]?.key;
  if (!tabs.length) return null;
  return <section className={`${className} dgu-academic-tabs`} aria-label={label}>
    {heading && <h2>{heading}</h2>}
    <SlidingTabList activeKey={active} className={`program-pathway-tabs ${tabsClassName}`} role="tablist" aria-label={label}>
      {tabs.map((tab, index) => <button key={tab.key} ref={element => { buttons.current[index] = element; }}
        type="button" role="tab" id={`${id}-${tab.key}-tab`} aria-controls={`${id}-${tab.key}-panel`}
        aria-selected={active === tab.key} tabIndex={active === tab.key ? 0 : -1}
        className={active === tab.key ? 'is-active' : ''} onClick={() => setSelected(tab.key)}
        onKeyDown={event => {
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
            : event.key === 'ArrowRight' ? (index + 1) % tabs.length
            : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : null;
          if (next === null) return;
          event.preventDefault(); setSelected(tabs[next].key); buttons.current[next]?.focus();
        }}>{tab.title}</button>)}
    </SlidingTabList>
    {tabs.map(tab => <div key={tab.key} id={`${id}-${tab.key}-panel`} role="tabpanel"
      aria-labelledby={`${id}-${tab.key}-tab`} hidden={active !== tab.key} tabIndex={0}>
      {tab.content}
    </div>)}
  </section>;
}

export function AdmissionContent({ info, details, label, id = 'program-details' }: {
  info: ProgramInfo | null; details?: ProgramPageData['admissionDetails']; label: string; id?: string;
}) {
  const tabs: ContentTab[] = [];
  if (info?.advantagesHtml || details?.advantages.some(column => column.length)) tabs.push({
    key: 'advantages', title: 'Advantage @DGU', content: info?.advantagesHtml
      ? <ApiRichText html={info.advantagesHtml} className="dgu-api-advantages" />
      : <div className="program-advantages-grid">{details?.advantages.map((column, index) => <ul key={index}>{column.map(item => <li key={item}>{item}</li>)}</ul>)}</div>,
  });
  if (info?.eligibilityHtml || details?.eligibility) tabs.push({
    key: 'eligibility', title: 'Eligibility Criteria', content: info?.eligibilityHtml
      ? <ApiRichText html={info.eligibilityHtml} /> : <p className="program-details-copy">{details?.eligibility}</p>,
  });
  if (info?.feesHtml || details?.feeRows.length || details?.feeNote) tabs.push({
    key: 'fees', title: info?.feeTitle || 'Fee Structure', content: info?.feesHtml
      ? <ApiRichText html={info.feesHtml} />
      : <>{!!details?.feeRows.length && <div className="program-pathway-table-scroll" role="region" aria-label={`${label} fees`} tabIndex={0}>
        <table className="program-pathway-table program-fees-table">
          <thead><tr><th scope="col">Programme</th><th scope="col">Academic Fee</th></tr></thead>
          <tbody>{details.feeRows.map(row => <tr key={row.course}><th scope="row">{row.course}</th><td>{row.fee}</td></tr>)}</tbody>
        </table>
      </div>}{details?.feeNote && <p className="program-fee-note">{details.feeNote}</p>}</>,
  });
  for (const [index, section] of (info?.sections || []).entries()) {
    if (section.kind !== 'academic') continue;
    tabs.push({ key: `academic-${index}`, title: section.title, content: <ApiRichText html={section.html} /> });
  }
  return <AcademicContent tabs={tabs} label={label} id={id} />;
}

export function ApiContentTabs({ info, kind, label, id }: {
  info: ProgramInfo | null; kind: ProgramInfo['sections'][number]['kind']; label: string; id: string;
}) {
  const tabs = (info?.sections || []).filter(section => section.kind === kind)
    .map((section, index) => ({ key: String(index), title: section.title, content: <ApiRichText html={section.html} /> }));
  return <AcademicContent tabs={tabs} label={label} id={id} className="program-pathways" />;
}

export function PathwayContent({ data, name, id = 'pathway' }: { data?: ProgramPageData['pathwayOptions']; name: string; id?: string }) {
  if (!data) return null;
  const tabs: ContentTab[] = [{ key: 'options', title: data.tabLabels?.[0] || 'Program Options at a Glance', content: <>
    {data.introduction && <p className="program-pathway-lead">{data.introduction}</p>}
    <div className="program-pathway-table-scroll" role="region" aria-label={`${name} pathway comparison`} tabIndex={0}>
      <table className="program-pathway-table"><thead><tr>{(data.columnLabels || ['Pathway', 'Academic Focus', 'Structure', 'Ideal For']).map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
        <tbody>{data.rows.map(row => <tr key={row.pathway}><th scope="row">{row.pathway}</th><td>{row.focus}</td><td>{row.structure}</td><td>{row.idealFor}</td></tr>)}</tbody>
      </table>
    </div>
  </> }];
  if (data.globalIntroduction.length || data.globalHighlights.length) tabs.push({ key: 'global', title: data.tabLabels?.[1] || `${name} Global Pathway`, content: <>
    <div className="program-pathway-intro">{data.globalIntroduction.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
    {!!data.globalHighlights.length && <div className="program-pathway-table-scroll" role="region" aria-label={`${name} highlights`} tabIndex={0}>
      <table className="program-pathway-table program-pathway-highlights"><thead><tr>{(data.highlightsLabels || [`${name} Global Highlights`, 'Features']).map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
        <tbody>{data.globalHighlights.map(row => <tr key={row.highlight}><th scope="row">{row.highlight}</th><td>{row.description}</td></tr>)}</tbody>
      </table>
    </div>}
  </> });
  return <AcademicContent tabs={tabs} label={`${name} pathway information`} id={id} className="program-pathways" tabsClassName="" />;
}

export function SpecializationContent({ groups, id = 'program-specializations' }: { groups?: ProgramPageData['specializationGroups']; id?: string }) {
  if (!groups?.length) return null;
  return <section className="program-specializations" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>PROGRAM SPECIALIZATION</h2>
    <div className="program-specialization-grid">{groups.map((group, column) => <ProgramCard key={column} title="" variant="specialization" animationIndex={column}
      items={group.map(item => ({ name: item.title, eyebrow: item.eyebrow, note: item.note, href: item.href }))} />)}</div>
  </section>;
}

export function IndustryContent({ items, info, id = 'program-industry', includePartners = false }: {
  items?: ProgramPageData['industryCollaborations']; info: ProgramInfo | null; id?: string; includePartners?: boolean;
}) {
  const sections = info?.sections.filter(section => section.kind === 'industry' || (includePartners && section.kind === 'partners')) || [];
  if (!items?.length && !sections.length) return null;
  return <section className="program-industry" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>INDUSTRY COLLABORATION</h2>
    {sections.map((section, index) => <ApiRichText key={index} html={section.html} />)}
    {!!items?.length && <AcademicAccordionGroup id={id} items={items.map(item=>({
      title:<>{item.title}{item.subtitle && <><br />{item.subtitle}</>}</>,
      content:<>{item.paragraphs.map(paragraph=><p key={paragraph}>{paragraph}</p>)}</>,
    }))} />}
  </section>;
}

export function QuestionContent({ items, id = 'program-faq' }: { items?: ProgramPageData['faqs']; id?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!items?.length) return null;
  return <section className="program-faqs" aria-labelledby={`${id}s-title`}>
    <h2 id={`${id}s-title`}>Frequently Asked Questions</h2>
    <div className="program-faq-list">{items.map((faq, index) => {
      const isOpen = open === index;
      return <div className={`program-faq${isOpen ? ' is-open' : ''}`} key={faq.question}>
        <h3><button type="button" id={`${id}-question-${index}`} aria-expanded={isOpen} aria-controls={`${id}-answer-${index}`} onClick={() => setOpen(current => current === index ? null : index)}>
          <span>{faq.question}</span><span className="program-faq-icon" aria-hidden="true">+</span>
        </button></h3>
        <div className="program-faq-answer" id={`${id}-answer-${index}`} role="region" aria-labelledby={`${id}-question-${index}`} aria-hidden={!isOpen}>
          <div><p>{faq.answer}</p></div>
        </div>
      </div>;
    })}</div>
  </section>;
}
