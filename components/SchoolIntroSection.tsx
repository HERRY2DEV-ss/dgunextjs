'use client';
import { sitePath } from './site-base';

import QuickContactForm from './QuickContactForm';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import ExpandableText from './ExpandableText';
import type { SchoolPageData } from './school-page-data';
import { facultySchoolUrls } from './faculty-api';
import { apiPlain } from './dgu-content-api';

const accreditations = [
  ['accreditation-aacsb', 'AACSB Member'],
  ['accreditation-business-graduates', 'Business Graduates Association Member'],
  ['accreditation-ioh', 'IOH Certified 2025-26'],
  ['accreditation-iscea', 'ISCEA'],
];

type IntroData = Pick<SchoolPageData, 'name' | 'slug' | 'intro' | 'introMore' | 'vision' | 'partners' | 'showBusinessAccreditations'>;
export default function SchoolIntroSection({ data, reference = false, contentHtml, recognitions, recognitionTitle, form, children, previewWords = 72, previewHeightOverride, introContent }: {
  data: IntroData; reference?: boolean; contentHtml?: string;
  recognitions?: ReadonlyArray<{ image: string; alt: string }>; recognitionTitle?: string;
  form?: ReactNode; children?: ReactNode; previewWords?: number; previewHeightOverride?: { desktop: number; mobile: number }; introContent?: ReactNode;
}) {
  const enquiry = useRef<HTMLElement>(null), extras = useRef<HTMLDivElement>(null);
  const [previewHeight, setPreviewHeight] = useState(220);
  useEffect(() => {
    if (!reference || !enquiry.current || !extras.current) return;
    const media = window.matchMedia('(min-width:701px)');
    const measure = () => {
      const height = enquiry.current!.offsetHeight;
      enquiry.current!.style.setProperty('--enquiry-height', `${height}px`);
      setPreviewHeight(media.matches ? Math.max(120, height - extras.current!.offsetHeight - 38, previewHeightOverride?.desktop || 0) : previewHeightOverride?.mobile || 260);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(enquiry.current); observer.observe(extras.current);
    media.addEventListener('change', measure); measure();
    return () => { observer.disconnect(); media.removeEventListener('change', measure); };
  }, [reference, previewHeightOverride?.desktop, previewHeightOverride?.mobile]);

  return (
    <section className="school-intro is-visible" aria-label={`About ${data.name}`}>
      <div className="school-intro-main">
        {introContent ?? (reference ? <ExpandableText key={contentHtml || data.intro} text={contentHtml ? apiPlain(contentHtml) : [data.intro, data.introMore].filter(Boolean).join(' ')} html={contentHtml} previewWords={previewWords} previewHeight={previewHeight} trimPreviewToLines className="academic-intro-text" /> : <>
          <p className="school-intro-description">{data.intro}</p>
          {data.introMore && <ExpandableText text={data.introMore} collapseAll className="school-intro-extra" />}
        </>)}
        <div ref={extras} className="academic-intro-extras">{children}

        {data.partners && <div className="school-technology-partners" aria-label="Delivery, technology and certification partners">
          <h2>DELIVERY | TECHNOLOGY | CERTIFICATION PARTNERS</h2>
          <div className="school-technology-partners-grid">
            {data.partners.map(partner => <div className="school-technology-partner" key={partner.name}>
              <img src={partner.image} alt={partner.name} loading="lazy" />
            </div>)}
          </div>
        </div>}

        {!reference && data.vision && <div className="school-vision">
          <h2>OUR VISION</h2>
          <p>{data.vision}</p>
        </div>}

        {!!recognitions?.length ? <div className="academic-recognitions">
          <h2>{recognitionTitle || 'Global Membership | Recognition'}</h2>
          <div className="school-accreditations" aria-label="Accreditations and memberships">
            {recognitions.map(item => <div className="school-accreditation" key={item.image}><img src={item.image} alt={item.alt} loading="lazy" /></div>)}
          </div>
        </div> : data.showBusinessAccreditations && <div className="academic-recognitions">
          {reference && <h2>Global Membership | Recognition</h2>}
          <div className="school-accreditations" aria-label="Accreditations and memberships">
          {accreditations.map(([image, label], index) => (
            <div className="school-accreditation" style={{ '--logo-delay': `${.45 + index * .12}s` } as CSSProperties} key={image}>
              <img src={sitePath(`/media/schools/${image}.webp`)} alt={label} loading="lazy" decoding="async" />
            </div>
          ))}
          </div>
        </div>}
        </div>
      </div>

      <aside className="school-enquiry" ref={enquiry}>
        {form || <QuickContactForm schoolUrl={facultySchoolUrls[data.slug]} />}
      </aside>
    </section>
  );
}
