'use client';

import { useEffect, useRef, useState } from 'react';
import LocalPageShell from './LocalPageShell';
import InternalPageHero from './InternalPageHero';
import { newsSlug, newsDetailHref, requestNewsDetail, type NewsDetail } from './news-detail-api';
import { newsRouteSlugs } from './news-route-slugs';
import { newsListingHref } from './news-routes';
import NavigationNewsList from './NavigationNewsList';
import type { NewsTab } from './news-api';
import AnimatedHeroSlider from './AnimatedHeroSlider';
import type { HeroSlide } from './AnimatedHeroSlider';
import ExpandableText from './ExpandableText';
import { academicImageSource } from './academic-media';
import '../app/[contentSlug]/local-content.css';

type NewsArticle = NewsDetail & { heroImages: HeroSlide[]; heroTitle: string; heroTitleEmphasis: string; heroDescription: string };

function newsHeroCopy(title: string, subtitle = '') {
  // Keep the headline hierarchy used by the DGU news design:
  // first word as the large lead, the next two words as the smaller bold line,
  // and the API subtitle as the supporting description.
  const words = title.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  return {
    heroTitle: words.slice(0, 1).join(' '),
    heroTitleEmphasis: words.slice(1, 3).join(' '),
    heroDescription: subtitle.trim() || words.slice(3).join(' '),
  };
}

function splitLongArticleParagraphs(document: Document) {
  for (const paragraph of Array.from(document.body.querySelectorAll('p'))) {
    const text = paragraph.textContent?.replace(/\\s+/g, ' ').trim() || '';
    if (text.length < 520 || paragraph.querySelector('p, ul, ol, table, figure, img, h2, h3, h4')) continue;
    const sentences = text.split(/(?<=[.!?])\\s+(?=[“"'(]*[A-Z0-9])/).filter(Boolean);
    if (sentences.length < 5) continue;
    const original = paragraph.cloneNode(true) as HTMLElement;
    const walker = document.createTreeWalker(original, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) nodes.push(node as Text);
    const fullText = nodes.map(item => item.textContent || '').join('');
    const groups: string[] = [];
    for (let index = 0; index < sentences.length; index += 3) groups.push(sentences.slice(index, index + 3).join(' '));
    const offsets: Array<{start:number;end:number}> = [];
    let cursor = 0;
    for (const group of groups) {
      const start = fullText.indexOf(group, cursor);
      if (start < 0) continue;
      offsets.push({start, end:start + group.length});
      cursor = start + group.length;
    }
    if (offsets.length < 2) continue;
    const locate = (offset: number, end = false) => {
      let consumed = 0;
      for (const item of nodes) {
        const length = item.textContent?.length || 0;
        if (offset <= consumed + length && (!end || offset > consumed)) return {node:item, offset:Math.max(0, Math.min(length, offset - consumed))};
        consumed += length;
      }
      const last = nodes[nodes.length - 1];
      return last ? {node:last, offset:last.textContent?.length || 0} : null;
    };
    const fragments = offsets.map(({start,end}) => {
      const a = locate(start), b = locate(end, true);
      if (!a || !b) return null;
      const range = document.createRange();
      range.setStart(a.node, a.offset);
      range.setEnd(b.node, b.offset);
      return range.cloneContents();
    }).filter((fragment): fragment is DocumentFragment => !!fragment);
    if (fragments.length < 2) continue;
    const replacement = fragments.map(fragment => {
      const next = document.createElement('p');
      next.className = paragraph.className;
      next.append(fragment);
      return next;
    });
    paragraph.replaceWith(...replacement);
  }
}

function moveArticleImagesToHero(details: string, primary: string, title: string) {
  if (typeof DOMParser === 'undefined') return { details, images: primary ? [{ image: primary, alt: title }] : [] };
  const document = new DOMParser().parseFromString(details, 'text/html');
  const images: HeroSlide[] = primary ? [{ image: primary, alt: title }] : [];
  const seen = new Set(images.map(image => image.image));
  for (const element of Array.from(document.body.querySelectorAll('img'))) {
    const image = academicImageSource(element);
    const figure = element.closest('figure');
    const captionElement = figure?.querySelector('figcaption');
    const caption = captionElement?.textContent?.trim() || '';
    if (image && !seen.has(image)) {
      seen.add(image);
      images.push({ image, alt: element.getAttribute('alt') || title, caption });
      captionElement?.remove();
    }
    element.remove();
    if (figure && !figure.textContent?.trim() && !figure.querySelector('*')) figure.remove();
  }
  // CMS descriptions sometimes contain empty paragraphs/columns that become a large
  // blank block after Read More expands. Remove only truly empty content wrappers.
  for (const element of Array.from(document.body.querySelectorAll('p, div, section, li'))) {
    const hasContent = !!element.textContent?.replace(/[\u00a0\u200b\s]/g, '') ||
      !!element.querySelector('img, table, video, iframe, hr, a, strong, em');
    if (!hasContent) element.remove();
  }
  for (const element of Array.from(document.body.querySelectorAll('br + br'))) element.remove();

  // Preserve the CMS block structure. ApiRichText renders paragraphs, headings,
  // lists, tables and inline emphasis separately; flattening them into one <p>
  // caused the entire article to appear as a single oversized paragraph.
  return { details: document.body.innerHTML, images };
}

export default function NewsDetailPage({ defaultSlug = '' }: { defaultSlug?: string }) {
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [error, setError] = useState('');
  const [archiveTab, setArchiveTab] = useState<NewsTab | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [dialogImage, setDialogImage] = useState('');
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
    setArticle(null); setError(''); setArchiveTab(null); setFailedImages([]); setDialogImage('');
    if (!selected) {
      const filter = (params.get('filter') || '').toLowerCase();
      setArchiveTab(filter.includes('placement') ? 'placements' : filter.includes('admission') ? 'admissions' : 'campus');
      document.title = 'News & Updates | DBS Global University';
      return;
    }
    if (!slug) { setError('This article link is invalid. Please choose a story from the news archive.'); return; }
    // Keep old shared links working, but present the clean article URL.
    const canonical = newsDetailHref(slug);
    if (newsRouteSlugs.includes(slug) && (window.location.pathname !== canonical || params.has('url'))) {
      window.history.replaceState(window.history.state, '', canonical + window.location.hash);
    }
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 20000);
    requestNewsDetail(slug, controller.signal).then(data => {
      if (!active) return;
      const moved = moveArticleImagesToHero(data.details, data.image, data.title);
      setArticle({ ...data, ...newsHeroCopy(data.title, data.subtitle), details: moved.details, heroImages: moved.images });
      document.title = `${data.title} | DBS Global University`;
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
    <main id="news-main" className={`news-detail-main${article?.heroImages.some(image => !failedImages.includes(image.image)) ? ' news-detail-main--hero' : ''}`}>
      {archiveTab ? <><InternalPageHero title="News & updates." eyebrow="The DGU journal"><p className="internal-hero-intro">Ideas, achievements and everyday moments from DBS Global University.</p></InternalPageHero><div className="internal-width"><NavigationNewsList tab={archiveTab} /></div></> : error ? <div className="news-feedback" role="alert"><h1>Article unavailable</h1><p>{error}</p><button type="button" onClick={() => setAttempt(n => n + 1)}>Try again</button><a href={archiveHref}>Back to news</a></div> : !article ? <><h1 className="visually-hidden">University news</h1><p className="news-feedback" role="status">Loading article…</p></> : <article>
        {article.heroImages.some(image => !failedImages.includes(image.image))
          ? <AnimatedHeroSlider className="news-hero" variant="news" aspectRatio="3.14 / 1"
              slides={article.heroImages.filter(image => !failedImages.includes(image.image))} label={`${article.title} images`} title={article.heroTitle} titleEmphasis={article.heroTitleEmphasis}
              date={article.date || undefined} description={article.heroDescription || undefined}
              onHeroButtonRef={node => { opener.current = node; }}
              onActivateHero={slide => { setDialogImage(slide.image); dialog.current?.showModal(); setImageOpen(true); }}
              onImageUnavailable={image => setFailedImages(previous => previous.includes(image) ? previous : [...previous, image])} />
          : <InternalPageHero title={article.heroTitle} titleEmphasis={article.heroTitleEmphasis} eyebrow={article.category || 'University news'} parent={{label:'News & Updates',href:archiveHref}}>{article.date && <p className="internal-hero-date">{article.date}</p>}{article.heroDescription && <p className="internal-hero-intro">{article.heroDescription}</p>}</InternalPageHero>}
        <div className="news-reading-layout"><aside className="news-reading-label"><p>The DGU journal</p><h2>Explore updates</h2><nav aria-label="More university news"><a href={newsListingHref("campus")}>Campus &amp; events <span aria-hidden="true">↗</span></a><a href={newsListingHref("placements")}>Placement updates <span aria-hidden="true">↗</span></a><a href={newsListingHref("admissions")}>Admission notices <span aria-hidden="true">↗</span></a></nav></aside><div className="news-article-body">{article.details
          ? <ExpandableText text="" html={article.details} previewHeight={210} trimPreviewToLines className="news-article-expandable" />
          : <p role="status">Article details are not available.</p>}<a className="news-back" href={archiveHref}>← Back to news & updates</a></div></div>
      </article>}
    </main>
    <dialog ref={dialog} className="news-image-dialog" aria-label="Full-size article image" onCancel={event => { event.preventDefault(); closeImage(); }} onClose={() => { setImageOpen(false); opener.current?.focus(); }} onClick={event => { if (event.target === event.currentTarget) closeImage(); }}><button autoFocus type="button" className="news-image-close" aria-label="Close full-size image" onClick={closeImage}>Close ×</button>{imageOpen && article && dialogImage && <img src={dialogImage} alt={article.title} />}</dialog>
  </LocalPageShell>;
}
