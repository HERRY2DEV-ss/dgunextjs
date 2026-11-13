'use client';
import { createElement, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { apiLayoutClasses, apiPlain } from './dgu-content-api';
import { resolveSiteHref } from './site-routes';
import { academicImageSource } from './academic-media';

const subscribeHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerSnapshot = () => false;

/** Remote formatting is rendered as React nodes with an explicit tag/attribute allowlist. */
type RichElementRenderer = (element: Element, key: string) => ReactNode | undefined;

export function richTextNodes(source: string, scrollTables = false, renderElement?: RichElementRenderer, combinePoweredByLogos = false): ReactNode {
  if (!/<[a-z][\s\S]*>/i.test(source) || typeof DOMParser === 'undefined') {
    const text = typeof DOMParser === 'undefined' ? apiPlain(source) : source;
    return text.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>);
  }
  const document = new DOMParser().parseFromString(source, 'text/html');
  const poweredByHeading = Array.from(document.body.querySelectorAll('h1,h2,h3,h4,h5,h6'))
    .some(heading => apiPlain(heading.textContent).toLowerCase() === 'powered by');
  if (poweredByHeading || combinePoweredByLogos) {
    const logos = Array.from(document.body.querySelectorAll('.dgu-api-logo,.industry-collab-img-box')).filter(logo => logo.querySelector('img'));
    if (logos.length > 1) {
      const row = document.createElement('div');
      row.className = 'industry-powered-logo-row';
      logos.forEach(logo => row.append(logo));
      Array.from(document.body.querySelectorAll('.dgu-api-logo-row,.dgu-api-logo-group,.dgu-api-logo-groups,.industry-collab-img-box-main,.industry-collab,.industry-collab-main')).reverse().forEach(group => {
        if (!group.querySelector('img') && !apiPlain(group.innerHTML) && !group.querySelector('a,table,video,iframe')) group.remove();
      });
      document.body.append(row);
    }
  }
  const blocked = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'svg', 'math', 'link', 'meta', 'template']);
  const allowed = new Set(['p', 'div', 'section', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'br', 'hr', 'blockquote', 'figure', 'figcaption', 'dl', 'dt', 'dd', 'table', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col']);
  const render = (node: Node, key: string): ReactNode => {
    if (node.nodeType === 3) return node.textContent;
    if (node.nodeType !== 1) return null;
    const element = node as Element;
    const tag = element.tagName.toLowerCase();
    if (blocked.has(tag)) return null;
    const replacement = renderElement?.(element, key);
    if (replacement !== undefined) return replacement;
    if (tag === 'img') {
      const raw = element.getAttribute('data-src') || element.getAttribute('data-lazy-src') || element.getAttribute('src') || '';
      const src = /^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(raw) && raw.length < 15000000 ? raw : academicImageSource(element);
      return src ? <img key={key} src={src} alt={element.getAttribute('alt') || ''} loading="lazy" decoding="async" onError={event => { if (event.currentTarget.closest('.academic-api-page')) event.currentTarget.hidden = true; }} /> : null;
    }
    const tableStructure = ['table', 'thead', 'tbody', 'tfoot', 'tr', 'colgroup'].includes(tag);
    const children = Array.from(element.childNodes).filter(child => !(tableStructure && child.nodeType === 3 && !child.textContent?.trim())).map((child, index) => render(child, key + '-' + index));
    if (tag === 'a') {
      const raw = element.getAttribute('href') || '';
      const href = raw ? resolveSiteHref(raw) : '';
      return href ? <a key={key} href={href}>{children}</a> : <span key={key}>{children}</span>;
    }
    const classes = new Set((element.getAttribute('class') || '').split(/\s+/));
    const safeTag = tag === 'h1' || classes.has('hero-h1') ? 'h2' : allowed.has(tag) || tag === 'span' ? tag : 'span';
    const props: Record<string, unknown> = { key };
    const mapped = apiLayoutClasses(element.getAttribute('class') || '');
    if (mapped.length) props.className = mapped.join(' ');
    const target = element.getAttribute('data-target');
    if (target !== null && /^\d+(?:\.\d+)?$/.test(target) && Number(target) <= 100000000) return createElement(safeTag, props, target + apiPlain(element.getAttribute('data-suffix') || '').slice(0, 40));
    if (tag === 'th' || tag === 'td') {
      for (const [attribute, property] of [['colspan', 'colSpan'], ['rowspan', 'rowSpan']]) {
        const value = Number(element.getAttribute(attribute));
        if (Number.isInteger(value) && value > 0 && value <= 100) props[property] = value;
      }
      if (tag === 'th') props.scope = element.getAttribute('scope') === 'row' ? 'row' : 'col';
    }
    const rendered = createElement(safeTag, props, tag === 'br' || tag === 'hr' || tag === 'col' ? undefined : children);
    return tag === 'table' && scrollTables ? <div key={key} className="local-table-scroll" role="region" aria-label="Scrollable information table" tabIndex={0}>{rendered}</div> : rendered;
  };
  return Array.from(document.body.childNodes).map((node, index) => render(node, String(index)));
}
export default function ApiRichText({ html, className = '', scrollTables = false, renderElement, combinePoweredByLogos = false }: { html: string; className?: string; scrollTables?: boolean; renderElement?: RichElementRenderer; combinePoweredByLogos?: boolean }) {
  const ready = useSyncExternalStore(subscribeHydration, getHydratedSnapshot, getServerSnapshot);
  const content = useMemo(() => richTextNodes(!ready && /<[a-z][\s\S]*>/i.test(html) ? apiPlain(html) : html, scrollTables, renderElement, combinePoweredByLogos), [html, ready, scrollTables, renderElement, combinePoweredByLogos]);
  return <div className={'dgu-api-copy ' + className}>{content}</div>;
}
