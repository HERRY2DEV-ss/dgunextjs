import { apiPlain } from './dgu-content-api';
import type { AcademicSection } from './academic-page-api';

/** Named option cards in the CMS body are presentation data, not introductory prose. */
export function academicProgramOptions(source: string): { html: string; options: AcademicSection[] } {
  if (typeof DOMParser === 'undefined') return { html: source, options: [] };
  const document = new DOMParser().parseFromString(source, 'text/html');
  const options: AcademicSection[] = [];
  for (const heading of Array.from(document.querySelectorAll('.mba-business-text'))) {
    const card = heading.closest('[class*="col-"]');
    const title = apiPlain(heading.textContent);
    if (!card || !title) continue;
    const copy = card.cloneNode(true) as Element;
    copy.querySelector('.mba-business-text')?.remove();
    if (!apiPlain(copy.innerHTML) && !copy.querySelector('img,table')) continue;
    options.push({ title, html: copy.innerHTML });
    card.remove();
  }
  return { html: document.body.innerHTML, options };
}
