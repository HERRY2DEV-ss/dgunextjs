'use client';

import { useCallback, useEffect, useState } from 'react';
import LocalPageShell from './LocalPageShell';
import { requestHomepageData } from './homepage-api';
import { sitePath } from './site-base';
import QuickContactForm from './QuickContactForm';
import BatchSlider from './BatchSlider';
import AcademicAccordionGroup from './AcademicAccordionGroup';
import PageTitleStrip from './PageTitleStrip';
import '../app/programs/program.css';
import './academic-api.css';
import './success-story-detail.css';

type StoryKind = 'startup' | 'higher';
const copy = {
  startup: {
    title: 'Startup & Entrepreneurial Success',
    eyebrow: 'Innovation · Enterprise · Impact',
    intro: 'Explore the startup and entrepreneurial success stories shared by DBS Global University.',
    alt: 'DBS Global University startup and entrepreneurial success story',
    back: 'Higher Education',
    backHref: '/higher-education/',
  },
  higher: {
    title: 'Higher Education',
    eyebrow: 'Academic Progression · Global Opportunities',
    intro: 'At DBS Global University, the journey to a leading university begins well before the application process. Through structured profile-building support, research exposure, internships, leadership opportunities, and a vibrant ecosystem of clubs and co-curricular activities, our students graduate with experiences that leading institutions value.',
    introDetails: [
      'A distinctive part of the DBS experience is our annual social internship, where students engage with NGOs and community organisations, align their growth with the United Nations Sustainable Development Goals, and develop a strong sense of social responsibility.',
      'To support global aspirations, we provide guidance for examinations such as the GRE, GMAT, IELTS, and TOEFL, along with communication and language development initiatives for students aspiring to universities in India and abroad.',
      'By combining academic excellence with holistic development, industry exposure, and experiential learning, DBS Global University equips students with the confidence and capabilities to pursue higher education opportunities at reputed institutions across the world.',
    ],
    destinations: {
      title: 'Top destination institutions',
      description: 'Our graduates progress to leading universities across the UK, USA, Europe, and Canada, alongside India’s premier IIMs, XLRI, and NITs.',
    },
    alumni: {
      title: 'Meet our higher education alumni',
      description: 'Every card below represents a DGU graduate who earned their seat at a top institution through hard work, mentorship, and preparation.',
    },
    support: {
      title: 'How DGU prepares you for higher education',
      description: 'We don’t just teach—we actively support every student who wants to pursue postgraduate studies in India or abroad.',
      items: [
        {
          title: 'Career & Higher Education Counselling',
          description: 'Dedicated counsellors guide you through university selection, admission requirements, scholarship options, and application timelines for both Indian and foreign universities.',
        },
        {
          title: 'Test Preparation Support',
          description: 'Structured preparation guidance for IELTS, TOEFL, GRE, GMAT, and CAT, with workshops, mock tests, and faculty mentorship built into the academic calendar.',
        },
        {
          title: 'Alumni Mentorship Network',
          description: 'Connect directly with alumni currently studying at your target university. Get advice from students who have made the journey from DBS Global University to Liverpool, IIM, XLRI, and beyond.',
        },
        {
          title: 'International University Tie-ups',
          description: 'DGU has established academic relationships with universities in the UK, Germany, and other countries, including joint programmes, credit transfers, and direct entry pathways.',
        },
        {
          title: 'SOP & Application Assistance',
          description: 'Expert faculty support for crafting your Statement of Purpose, personal statements, and recommendation letters—the documents that help secure admission beyond just grades.',
        },
        {
          title: 'Scholarship & Financial Guidance',
          description: 'Our team helps students identify and apply for scholarships, education loans, and funding from Indian banks and international foundations.',
        },
      ],
    },
    closing: {
      title: 'Your higher education journey can start here',
      description: 'Whether you want to study at an IIM, a UK university, or a German institution, our team is ready to guide you from day one. Talk to a counsellor today.',
    },
    alt: 'DBS Global University higher education success story',
    back: 'Startup & Entrepreneurial Success',
    backHref: '/startup-entrepreneurial-success/',
  },
} as const;

export default function SuccessStoryDetailPage({ kind }: { kind: StoryKind }) {
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const content = copy[kind];

  const load = useCallback(() => {
    setStatus('loading');
    requestHomepageData().then(data => {
      setImages(kind === 'startup' ? data.startupSuccess : data.higherEducation);
      setStatus('ready');
    }).catch(error => {
      console.warn('Success story detail feed unavailable.', error);
      setImages([]);
      setStatus('error');
    });
  }, [kind]);

  useEffect(() => { load(); }, [load]);

  return <LocalPageShell className="local-page internal-page success-story-detail-page">
    <a className="local-skip" href="#local-content">Skip to page content</a>
    <main className="local-page-main" id="local-content" aria-busy={status === 'loading'}>
      <header className="success-story-banner" data-navigation-opening>
        <img
          src={sitePath(`/assets/placement/${kind === 'higher' ? 'higher education _web-banner _desktop.webp' : 'starup success _web-banner _desktop.webp'}`)}
          alt=""
          fetchPriority="high"
        />
      </header>
      <PageTitleStrip title={content.title} />
      <div className="internal-body">
        <section className="success-story-intro">
          <div className="success-story-intro-copy">
            <p>{content.intro}</p>
            {'introDetails' in content && content.introDetails.map(paragraph => <p className="success-story-intro-detail" key={paragraph}>{paragraph}</p>)}
            <span>{images.length ? `${images.length} stories` : 'Student success stories'}</span>
            {kind === 'startup' && (status === 'loading' ? <p className="success-story-status" role="status">Loading success stories…</p>
              : status === 'error' ? <div className="success-story-status" role="status"><p>These stories are temporarily unavailable.</p><button type="button" onClick={load}>Try again</button></div>
              : images.length ? <BatchSlider className="success-story-slider" size={2} label={`${content.title} student success stories`} controls>
                {images.map((image, index) => <figure className="success-story-card" key={`${image}-${index}`}>
                  <img
                    src={image.startsWith('/') || /^https?:/.test(image) ? image : sitePath(`/assets/${image}.webp`)}
                    alt={`${content.alt} ${index + 1}`}
                    loading={index < 2 ? 'eager' : 'lazy'}
                  />
                  <figcaption><span>Success story</span><strong>{String(index + 1).padStart(2, '0')}</strong></figcaption>
                </figure>)}
              </BatchSlider> : <p className="success-story-status" role="status">No stories are available at the moment.</p>)}
          </div>
          <aside className="success-story-enquiry" aria-label="Enquire about DBS Global University">
            <QuickContactForm />
          </aside>
        </section>
        {'destinations' in content && <div className="success-story-content">
          <section>
            <h2>{content.destinations.title}</h2>
            <p>{content.destinations.description}</p>
          </section>
          <section className="program-industry success-story-support">
            <h2>{content.support.title}</h2>
            <p>{content.support.description}</p>
            <AcademicAccordionGroup
              id="higher-education-support"
              items={content.support.items.map(item => ({
                title: item.title,
                content: <p>{item.description}</p>,
              }))}
            />
          </section>
          <section>
            <h2>{content.closing.title}</h2>
            <p>{content.closing.description}</p>
          </section>
        </div>}
        {kind === 'higher' && (status === 'loading' ? <p className="success-story-status" role="status">Loading success stories…</p>
          : status === 'error' ? <div className="success-story-status" role="status"><p>These stories are temporarily unavailable.</p><button type="button" onClick={load}>Try again</button></div>
          : images.length ? <>
            {'alumni' in content && <section className="success-story-alumni-heading"><h2>{content.alumni.title}</h2><p>{content.alumni.description}</p></section>}
            <BatchSlider
              className="success-story-slider"
              size={2}
              label={`${content.title} student success stories`}
              controls
            >
              {images.map((image, index) => <figure className="success-story-card" key={`${image}-${index}`}>
                <img
                  src={image.startsWith('/') || /^https?:/.test(image) ? image : sitePath(`/assets/${image}.webp`)}
                  alt={`${content.alt} ${index + 1}`}
                  loading={index < 2 ? 'eager' : 'lazy'}
                />
                <figcaption><span>Success story</span><strong>{String(index + 1).padStart(2, '0')}</strong></figcaption>
              </figure>)}
            </BatchSlider>
          </>
          : <p className="success-story-status" role="status">No stories are available at the moment.</p>)}
        <nav className="success-story-switch" aria-label="Other success stories"><a href={sitePath(content.backHref)}>Explore {content.back} <span aria-hidden="true">→</span></a><a href={sitePath('/placement-reports/')}>Back to Placements <span aria-hidden="true">→</span></a></nav>
      </div>
    </main>
  </LocalPageShell>;
}
