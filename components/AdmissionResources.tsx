'use client';
import SlidingTabList from './SlidingTabList';

import { useState, type KeyboardEvent } from 'react';
import { resolveSiteHref } from './site-routes';
import { apiPlain } from './dgu-content-api';
import ExpandableText from './ExpandableText';
import ApiRichText from './ApiRichText';
import type { AdmissionResource } from './admissions-api';
import { admissionDetailHref } from './admissions-routes';

export default function AdmissionResources({ resources, international, refund, commencement, viewBookUrl }: {
  resources: AdmissionResource[]; international: AdmissionResource | null; refund: AdmissionResource | null;
  commencement: AdmissionResource | null; viewBookUrl: string;
}) {
  const [selectedResource, setSelectedResource] = useState(0);
  const resource = resources[selectedResource] ?? resources[0];
  const switchResource = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const count = resources.length;
    const next = event.key === 'ArrowRight' ? (index + 1) % count : event.key === 'ArrowLeft' ? (index - 1 + count) % count : event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : null;
    if (next === null) return;
    event.preventDefault(); setSelectedResource(next);
    document.getElementById(`admissions-resource-tab-${next}`)?.focus();
  };
  if (!resource && !international && !refund && !commencement && !viewBookUrl) return null;
  return <section id="admissions-support" className="admissions-resources" aria-label="Additional admissions information">
    <div className="admissions-resources-inner">
      {resource && <>
        <SlidingTabList activeKey={selectedResource} className="admissions-resource-tabs" role="tablist" aria-label="Admissions support topics">
          {resources.map((item, index) => <button key={`${index}-${item.title}`} type="button" id={`admissions-resource-tab-${index}`}
            role="tab" aria-controls="admissions-resource-panel" aria-selected={selectedResource === index}
            tabIndex={selectedResource === index ? 0 : -1} onKeyDown={event => switchResource(event, index)}
            className={selectedResource === index ? 'is-active' : ''} onClick={() => setSelectedResource(index)}>{item.title}</button>)}
        </SlidingTabList>
        <div id="admissions-resource-panel" className="admissions-resource-panel" role="tabpanel" key={selectedResource}
          aria-labelledby={`admissions-resource-tab-${selectedResource}`}>
          <ExpandableText className="admissions-rich-copy" text={apiPlain(resource.html)} html={resource.html} previewWords={90} href={admissionDetailHref(resource.href)} />
        </div>
      </>}
      {(refund || viewBookUrl) && <div className="admissions-resource-links">
        {refund && <details className="admissions-policy admissions-rich-copy">
          <summary>{refund.title}</summary>
          {refund.html ? <ApiRichText html={refund.html} /> : refund.href && <a href={resolveSiteHref(refund.href)}>{refund.title}</a>}
        </details>}
        {viewBookUrl && <a href={viewBookUrl} target="_blank" rel="noopener noreferrer" download>DOWNLOAD VIEW BOOK</a>}
      </div>}
      {commencement && <details id="admissions-commencement" className="admissions-policy admissions-commencement admissions-rich-copy">
        <summary>{commencement.title}</summary>
        {commencement.html ? <ApiRichText html={commencement.html} /> : commencement.href && <a href={resolveSiteHref(commencement.href)}>{commencement.title}</a>}
      </details>}
      {international && <div className="admissions-international">
        <h2 id="international-student-admission">{international.title}</h2>
        {international.html ? <ExpandableText className="admissions-rich-copy" text={apiPlain(international.html)} html={international.html} previewWords={70} href={admissionDetailHref(international.href)} />
          : international.href && <a href={resolveSiteHref(international.href)}>{international.title}</a>}
      </div>}
    </div>
  </section>;
}
