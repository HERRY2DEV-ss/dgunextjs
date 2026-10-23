'use client';
import { useEffect, useState } from 'react';
import InternalPageHero from './InternalPageHero';
import { SITE_BASE } from './site-routes';

// A local destination for new API URLs that were not present when this static build was made.
export default function PendingPageDetail() {
  const [title, setTitle] = useState('Page details');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const label = params.get('title')?.trim() || params.get('path')?.split('/').filter(Boolean).pop()?.replace(/[-_]/g, ' ');
    if (label) { setTitle(label); document.title = `${label} | DBS Global University`; }
  }, []);
  return <main className="local-page-main" id="local-content">
    <InternalPageHero title={title} eyebrow="DBS Global University" /><div className="internal-body">
    <section className="local-empty-detail"><h2>Details are not available yet</h2><p>Please check back for updated information.</p><a href={`${SITE_BASE}/contacts/`}>Contact the university <span aria-hidden="true">→</span></a></section>
  </div></main>;
}
