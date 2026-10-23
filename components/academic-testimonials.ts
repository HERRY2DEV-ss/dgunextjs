import { apiMedia, apiPlain } from './dgu-content-api';
import { parseReviews, type Review } from './reviews-api';

/** Read supplied testimonial data only; never run the CMS carousel scripts. */
export function academicTestimonialRecords(value: unknown): Review[] {
  if (!value || typeof value !== 'object') return [];
  try { return parseReviews({ error: '0', data: value }); } catch { return []; }
}

/** Keep complete testimonial cards together before generic heading splitting. */
export function academicTestimonials(source: string): { html: string; items: Review[] } {
  if (typeof DOMParser === 'undefined' || !/testimonial/i.test(source)) return { html: source, items: [] };
  const document = new DOMParser().parseFromString(source, 'text/html');
  const items: Review[] = [];
  const sections = Array.from(document.querySelectorAll('.testimonial-section'));
  if (!sections.length) return { html: source, items };
  for (const section of sections) {
    if (section.parentElement?.closest('.testimonial-section')) continue;
    for (const card of section.querySelectorAll('.testimonial-card')) {
      const text = apiPlain(card.querySelector('.student-message')?.textContent);
      if (!text) continue;
      const name = apiPlain(card.querySelector('[id="studentName"],.student-left h3,.student-left h4')?.textContent);
      const image = card.querySelector('.student-photo img');
      items.push({
        id: name + '|' + text, name, text,
        image: apiMedia(image?.getAttribute('data-src') || image?.getAttribute('src')),
        program: apiPlain(card.querySelector('.student-course')?.innerHTML),
        designation: '', rating: null,
      });
    }
    section.remove();
  }
  return { html: document.body.innerHTML, items };
}
