'use client';

import { resolveSiteHref } from './site-routes';
import { createElement, useEffect, useRef, useState, type ReactNode } from 'react';
import LocalPageShell from './LocalPageShell';
import InternalPageHero from './InternalPageHero';
import { newsSlug, newsDetailHref, requestNewsDetail, type NewsDetail } from './news-detail-api';
import { newsListingHref } from './news-routes';
import NavigationNewsList from './NavigationNewsList';
import type { NewsTab } from './news-api';
import '../app/[contentSlug]/local-content.css';

// Render formatting as React nodes; remote scripts, styles and event handlers never enter the DOM.
function articleContent(source: string): ReactNode {
  if (!/<[a-z][\s\S]*>/i.test(source)) return source.split(/\n\s*\n/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>);
  const document = new DOMParser().parseFromString(source, 'text/html');
  const allowed = new Set(['p', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'br', 'hr', 'blockquote', 'a', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td']);
  const blocked = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'svg', 'math']);
  const render = (node: Node, key: string): ReactNode => {
    if (node.nodeType === 3) return node.textContent;
    if (node.nodeType !== 1) return null;
    const el = node as Element; const tag = el.tagName.toLowerCase();
    if (blocked.has(tag)) return null;
    if (tag === 'img') {
      try {
        const src = new URL(el.getAttribute('src') || '', 'https://dgu.ac.in/');
        if (el.getAttribute('src') && ['https:', 'http:'].includes(src.protocol)) return <img key={key} src={src.href} alt={el.getAttribute('alt') || 'Article photograph'} loading="lazy" decoding="async" />;
      } catch { /* Invalid image URLs are omitted. */ }
      return null;
    }
    const children = Array.from(el.childNodes).map((child, i) => render(child, `${key}-${i}`));
    if (!allowed.has(tag)) return ['div', 'section', 'article'].includes(tag) ? <div key={key}>{children}</div> : <span key={key}>{children}</span>;
    if (tag === 'a') {
      try {
        const href = new URL(el.getAttribute('href') || '', 'https://dgu.ac.in/');
        if (['https:', 'http:', 'mailto:', 'tel:'].includes(href.protocol)) return <a key={key} href={resolveSiteHref(href.href)}>{children}</a>;
      } catch { /* Invalid links become text. */ }
      return <span key={key}>{children}</span>;
    }
    const props: Record<string, unknown> = { key };
    if (tag === 'td' || tag === 'th') {
      for (const [source, target] of [['colspan', 'colSpan'], ['rowspan', 'rowSpan']]) {
        const value = Number(el.getAttribute(source));
        if (Number.isInteger(value) && value > 0 && value <= 100) props[target] = value;
      }
      if (tag === 'th') props.scope = el.getAttribute('scope') === 'row' ? 'row' : 'col';
    }
    return createElement(tag, props, tag === 'br' || tag === 'hr' ? undefined : children);
  };
  return Array.from(document.body.childNodes).map((node, i) => render(node, String(i)));
}
export default function NewsDetailPage({ defaultSlug = '' }: { defaultSlug?: string }) {
  const [article, setArticle] = useState<NewsDetail | null>(null);
  const [content, setContent] = useState<ReactNode>(null);
  const [error, setError] = useState('');
  const [archiveTab, setArchiveTab] = useState<NewsTab | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const category = article?.category.toLowerCase() || '';
  const archiveHref = newsListingHref(category.includes('placement') ? 'placements' : category.includes('admission') ? 'admissions' : 'campus');
  useEffect(() => {
    const controller = new AbortController(); let active = true; let timedOut = false;
    const params = new URLSearchParams(window.location.search);
    const articlePath = /^\/nextjs\/homev1\/news\/[^/]+\/?$/.test(window.location.pathname) ? window.location.pathname : '';
    const selected = articlePath || defaultSlug || params.get('url') || '';
    const slug = newsSlug(selected);
    setArticle(null); setContent(null); setError(''); setArchiveTab(null); setImageLoaded(false); setImageFailed(false);
    if (!selected) {
      const filter = (params.get('filter') || '').toLowerCase();
      setArchiveTab(filter.includes('placement') ? 'placements' : filter.includes('admission') ? 'admissions' : 'campus');
      document.title = 'News & Updates | DBS Global University';
      return;
    }
    if (!slug) { setError('This article link is invalid. Please choose a story from the news archive.'); return; }
    // Keep old shared links working, but present the clean article URL.
    const canonical = newsDetailHref(slug);
    if (window.location.pathname !== canonical || params.has('url')) {
      window.history.replaceState(window.history.state, '', canonical + window.location.hash);
    }
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 20000);
    requestNewsDetail(slug, controller.signal).then(data => {
      if (!active) return;
      setArticle(data); setContent(articleContent(data.details)); document.title = `${data.title} | DBS Global University`;
    }).catch(() => {
      if (active) setError(timedOut ? 'The article took too long to load. Please try again.' : 'We could not load this article. Please try again or choose another story.');
    }).finally(() => clearTimeout(timeout));
    return () => { active = false; controller.abort(); clearTimeout(timeout); };
  }, [attempt, defaultSlug]);
  useEffect(() => {
    if (!imageOpen) return;
    const previous = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [imageOpen]);
  const closeImage = () => { dialog.current?.close(); setImageOpen(false); opener.current?.focus(); };
  return <LocalPageShell className="news-detail-page internal-page">
    <a className="news-skip" href="#news-main">Skip to news content</a>
    <main id="news-main" className="news-detail-main">
      {archiveTab ? <><InternalPageHero title="News & updates." eyebrow="The DGU journal"><p className="internal-hero-intro">Ideas, achievements and everyday moments from DBS Global University.</p></InternalPageHero><div className="internal-width"><NavigationNewsList tab={archiveTab} /></div></> : error ? <div className="news-feedback" role="alert"><h1>Article unavailable</h1><p>{error}</p><button type="button" onClick={() => setAttempt(n => n + 1)}>Try again</button><a href={archiveHref}>Back to news</a></div> : !article ? <><h1 className="visually-hidden">University news</h1><p className="news-feedback" role="status">Loading article…</p></> : <article>
        <InternalPageHero title={article.title} eyebrow={article.category || 'University news'} parent={{label:'News & Updates',href:archiveHref}}>{article.date && <p className="internal-hero-date">{article.date}</p>}</InternalPageHero>
        {article.image && !imageFailed && <figure className={`news-hero${imageLoaded ? ' is-loaded' : ''}`}><button ref={opener} type="button" className="news-image-open" aria-label={`Enlarge image: ${article.title}`} aria-haspopup="dialog" onClick={() => { dialog.current?.showModal(); setImageOpen(true); }}><img src={article.image} alt={article.title} onLoad={() => setImageLoaded(true)} onError={() => setImageFailed(true)} fetchPriority="high" /><span className="news-enlarge">View full image ↗</span></button></figure>}
        <div className="news-reading-layout"><aside className="news-reading-label"><p>The DGU journal</p><h2>Explore updates</h2><nav aria-label="More university news"><a href={newsListingHref("campus")}>Campus &amp; events <span aria-hidden="true">↗</span></a><a href={newsListingHref("placements")}>Placement updates <span aria-hidden="true">↗</span></a><a href={newsListingHref("admissions")}>Admission notices <span aria-hidden="true">↗</span></a></nav></aside><div className="news-article-body">{article.details ? content : <p>Full article details are not available yet.</p>}<a className="news-back" href={archiveHref}>← Back to news & updates</a></div></div>
      </article>}
    </main>
    <dialog ref={dialog} className="news-image-dialog" aria-label="Full-size article image" onCancel={event => { event.preventDefault(); closeImage(); }} onClose={() => { setImageOpen(false); opener.current?.focus(); }} onClick={event => { if (event.target === event.currentTarget) closeImage(); }}><button autoFocus type="button" className="news-image-close" aria-label="Close full-size image" onClick={closeImage}>Close ×</button>{imageOpen && article?.image && <img src={article.image} alt={article.title} />}</dialog>
  </LocalPageShell>;
}
