'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { refreshLayout } from './refreshLayout';
import { apiPlain } from './dgu-content-api';
import ApiRichText from './ApiRichText';

/** End an academic preview after a whole rendered line, including its descenders. */
function completeLineHeight(viewport: HTMLElement, limit: number): number {
  const top = viewport.getBoundingClientRect().top;
  const walker = document.createTreeWalker(viewport, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let last = 0, first = Infinity;
  const include = (rect: DOMRect) => {
    if (!rect.height) return;
    const bottom = Math.ceil(rect.bottom - top + 1);
    first = Math.min(first, bottom);
    if (bottom <= limit) last = Math.max(last, bottom);
  };
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim() || node.parentElement?.closest('table,figure')) continue;
    range.selectNodeContents(node);
    for (const rect of range.getClientRects()) include(rect);
  }
  for (const media of viewport.querySelectorAll('table,figure,img')) include(media.getBoundingClientRect());
  return last || (Number.isFinite(first) ? first : limit);
}

export default function ExpandableText({ text, html, className = '', collapseAll = false, previewWords = 72, previewHeight, href, trimPreviewToLines = false }: {
  text: string; html?: string; className?: string; collapseAll?: boolean; previewWords?: number; previewHeight?: number; href?: string;
  trimPreviewToLines?: boolean;
}) {
  const source = html || text;
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const open = expandedSource === source, id = useId();
  const copy = apiPlain(html || text), words = copy.split(/\s+/).filter(Boolean);
  const split = Math.min(words.length, Math.max(1, Math.floor(previewWords)));
  const shortened = split < words.length;
  const hasMedia = !!html && /<(img|table)\b/i.test(html);
  const viewport = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [safePreviewHeight, setSafePreviewHeight] = useState(previewHeight);
  useEffect(() => {
    const node = viewport.current;
    if (!node || previewHeight === undefined) return;
    let active = true;
    const measure = () => {
      if (!active) return;
      const overflow = node.scrollHeight > previewHeight + 1;
      setOverflows(overflow);
      setSafePreviewHeight(trimPreviewToLines && overflow ? completeLineHeight(node, previewHeight) : previewHeight);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(node); if (node.firstElementChild) observer.observe(node.firstElementChild);
    if (trimPreviewToLines) document.fonts?.ready.then(measure);
    measure(); return () => { active = false; observer.disconnect(); };
  }, [previewHeight, source, trimPreviewToLines]);
  useEffect(() => { refreshLayout(); }, [open, source]);
  if (!copy && !hasMedia) return null;
  if (href) return <div className={`expandable-text ${className}`}>
    {copy && <p>{words.slice(0, split).join(' ')}{shortened ? '…' : ''}</p>}
    <a className="expandable-toggle" href={href}>Read More <span aria-hidden="true">→</span></a>
  </div>;
  const toggle = <button type="button" className="expandable-toggle" aria-expanded={open} aria-controls={id}
    onClick={() => setExpandedSource(open ? null : source)}>{open ? 'Read less ↑' : 'Read more ↓'}</button>;
  if (previewHeight !== undefined) {
    const preview = <div ref={viewport} id={id} className={!open && overflows && !trimPreviewToLines ? 'expandable-height-preview' : ''}
      onFocusCapture={event => {
        if (!open && (event.target as HTMLElement).getBoundingClientRect().bottom > event.currentTarget.getBoundingClientRect().bottom) setExpandedSource(source);
      }}
      style={!open ? { maxHeight: trimPreviewToLines ? safePreviewHeight ?? previewHeight : previewHeight, overflow: 'hidden' } : undefined}>
      {html ? <ApiRichText html={html} scrollTables /> : <p>{copy}</p>}
    </div>;
    return <div className={`expandable-text expandable-text--height ${className}`}>
      {preview}
      {(overflows || open) && toggle}
    </div>;
  }
  if (html) return <div className={`expandable-text ${className}`}>
    <div id={id}>{open || !shortened ? <ApiRichText html={html} scrollTables /> : <p>{words.slice(0, split).join(' ')}…</p>}</div>
    {shortened && toggle}
  </div>;
  if (collapseAll) return <div className={`expandable-text ${className}`}><div id={id} hidden={!open}><p>{copy}</p></div>{toggle}</div>;
  if (!shortened) return <div className={`expandable-text ${className}`}><p>{copy}</p></div>;
  return <div className={`expandable-text ${className}`}>
    <p>{words.slice(0, split).join(' ')}{!open ? '…' : ''}</p>
    <div id={id} hidden={!open}><p>{words.slice(split).join(' ')}</p></div>{toggle}
  </div>;
}
