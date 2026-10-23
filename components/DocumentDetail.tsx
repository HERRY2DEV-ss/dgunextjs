'use client';
import { useEffect, useState } from 'react';
import LocalDocumentViewer from './LocalDocumentViewer';
import InternalPageHero from './InternalPageHero';
export default function DocumentDetail() {
  const [document, setDocument] = useState<{ title: string; url: string; html: boolean } | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    try {
      const url = new URL(params.get('file') || '', 'https://dgu.ac.in/');
      if (['https:', 'http:'].includes(url.protocol) && ['dgu.ac.in', 'www.dgu.ac.in'].includes(url.hostname) && (/\.pdf$/i.test(url.pathname) || (/^\/uploads\/documents\//.test(url.pathname) && /\.html$/i.test(url.pathname)))) {
        const title = params.get('title')?.trim() || decodeURIComponent(url.pathname.split('/').pop() || 'University document').replace(/[-_]/g, ' ').replace(/\.(pdf|html)$/i, '');
        setDocument({ title, url: url.href, html: /\.html$/i.test(url.pathname) }); window.document.title = `${title} | DBS Global University`;
      }
    } catch { /* Invalid document selections display a local error state. */ }
    setLoaded(true);
  }, []);
  return <main className="local-page-main" id="local-content">
    <InternalPageHero title={document?.title || 'University document'} eyebrow="University documents" /><div className="internal-body">
    {document ? <LocalDocumentViewer title={document.title} url={document.url} htmlDocument={document.html} /> : <p role="status">{loaded ? 'No valid document was selected.' : 'Loading document…'}</p>}
  </div></main>;
}
