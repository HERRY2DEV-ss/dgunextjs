import { apiPlain } from './dgu-content-api';
import { splitAcademicContent } from './academic-page-api';

export type AcademicFeature = { title: string; description: string; html: string };

export function academicFeaturePresentation(pointCount: number, tabThreshold = 6): 'wave' | 'tab' {
  return pointCount >= tabThreshold ? 'tab' : 'wave';
}

/** Count feature records during layout as well as in the browser parser. */
export function academicFeaturePointCount(source: string): number {
  if (typeof DOMParser !== 'undefined') return academicFeatures(source).points.length;
  return (source.match(/<li\b/gi) || []).length;
}

export function academicFeatureAccordionSections(points: readonly AcademicFeature[]) {
  return points.map(point => ({ title: point.title, html: point.html }));
}

/** Keep each CMS feature's own detail, and retain copy outside its list. */
export function academicFeatures(source: string): { points: AcademicFeature[]; remaining: string } {
  if (typeof DOMParser === 'undefined') return { points: [], remaining: source };
  const document = new DOMParser().parseFromString(source, 'text/html');
  const items = Array.from(document.querySelectorAll('li')).filter(node => !node.parentElement?.closest('li') && !node.closest('table'));
  if (!items.length) {
    const parts = splitAcademicContent(source);
    return { points: parts.sections.map(part => ({ title: part.title, description: apiPlain(part.html), html: part.html })), remaining: parts.intro };
  }
  const points = items.flatMap(node => {
    const text = apiPlain(node.textContent);
    if (!text) return [];
    const bold = node.querySelector('strong,b'), strong = apiPlain(bold?.textContent);
    const colon = text.indexOf(':'), first = text.split(/\s+/).slice(0, 7).join(' ');
    const title = strong && text.startsWith(strong) && strong.length <= 160 ? strong : colon > 0 && colon <= 100 ? text.slice(0, colon) : first;
    const description = text.startsWith(title) ? text.slice(title.length).replace(/^\s*[:–—-]\s*/, '').trim() : text;
    const copy = node.cloneNode(true) as HTMLElement;
    const heading = copy.querySelector('strong,b');
    if (heading && apiPlain(heading.textContent) === title && text.startsWith(title)) {
      heading.remove();
      const firstText = document.createTreeWalker(copy, NodeFilter.SHOW_TEXT).nextNode();
      if (firstText) firstText.textContent = firstText.textContent?.replace(/^\s*[:–—-]\s*/, '') || '';
    }
    return [{ title: title.replace(/\s*[:–—-]\s*$/, ''), description, html: copy.innerHTML }];
  });
  items.forEach(node => node.remove());
  document.querySelectorAll('ul,ol').forEach(list => { if (!list.textContent?.trim() && !list.querySelector('img,table')) list.remove(); });
  // The old CMS uses ABOUT DGU as a wrapper label above this very same list.
  // A heading by itself is not a second introduction or another feature section.
  if (!document.querySelector('img,table') && /^(?:about\s+(?:dgu|dbs)|about)$/i.test(apiPlain(document.body.textContent))) document.body.innerHTML = '';
  return { points, remaining: document.body.innerHTML };
}
