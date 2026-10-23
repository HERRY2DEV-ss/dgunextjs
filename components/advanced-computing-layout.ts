import type { AcademicInfo, AcademicSection } from './academic-page-api';
import type { AcademicBlock } from './academic-layout';
import { academicSectionKey } from './academic-section-key';

/** This mapping belongs exclusively to the Advanced Computing school. */
export function isAdvancedComputing(info: AcademicInfo) {
  return info.kind === 'school' && info.slug === 'school-of-technology';
}

export function advancedComputingContent(info: AcademicInfo) {
  if (typeof DOMParser === 'undefined') return { intro: info.intro, highlights: '' };
  const doc = new DOMParser().parseFromString(info.intro, 'text/html');
  const list = doc.body.querySelector('ul');
  if (!list) return { intro: info.intro, highlights: '' };
  const range = doc.createRange();
  range.setStartBefore(list); range.setEnd(doc.body, doc.body.childNodes.length);
  const container = doc.createElement('div'); container.append(range.extractContents());
  return { intro: doc.body.innerHTML, highlights: container.innerHTML };
}

export function advancedComputingLayout(info: AcademicInfo): AcademicBlock[] {
  const sections = [...info.pathways, ...info.tabs, ...info.sections, ...info.accordions];
  const used = new Set<AcademicSection>();
  const take = (keys: string[]) => sections.filter(section => {
    if (used.has(section) || !keys.includes(academicSectionKey(section.title))) return false;
    used.add(section); return true;
  });
  const copy = advancedComputingContent(info);
  const highlights = copy.highlights ? [{ title: 'Key Highlights & Experiential Learning', html: copy.highlights }] : [];
  const options = take(['options']);
  const difference = take(['difference']).map(section => {
    if (typeof DOMParser === 'undefined') return section;
    const doc = new DOMParser().parseFromString(section.html, 'text/html');
    doc.querySelectorAll('h2,h3').forEach(node => {
      if (node.textContent?.trim().toLowerCase() === 'what makes us different') node.remove();
    });
    return { ...section, html: doc.body.innerHTML };
  });
  const placements = take(['placements']);
  const labs = take(['laboratories']);
  const industry = take(['industry', 'co-designed', 'co-delivered', 'co-certified', 'industry-benefits']);
  const international = take(['international']);
  const reserved = take(['faculty', 'news', 'faqs']);
  const join = (parts: AcademicSection[]) => parts.map(section => `<h3>${section.title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</h3>${section.html}`).join('');
  const blocks: AcademicBlock[] = [
    { kind: 'tabs', title: '', sections: [...highlights, ...options] },
    { kind: 'programs', title: 'OUR PROGRAMS', sections: [] },
    { kind: 'section', title: '', sections: difference.map(section => ({ ...section, title: 'What Makes Us Different' })) },
    { kind: 'placements', title: 'Placements', sections: placements },
    { kind: 'tabs', title: '', sections: [
      ...(labs.length ? [{ title: 'State-of-the-Art Infrastructure & Labs', html: join(labs) }] : []),
      ...(industry.length ? [{ title: 'Curriculum and Industry Integration', html: join(industry) }] : []),
    ] },
  ];
  // Keep additional published content without changing any other school's guide.
  const remaining = sections.filter(section => !used.has(section));
  if (remaining.length) blocks.push({ kind: 'section', title: '', sections: remaining });
  if (international.length) blocks.push({ kind: 'international', title: international[0].title, sections: international });
  blocks.push({ kind: 'faculty', title: 'Faculty', sections: reserved.filter(s => academicSectionKey(s.title) === 'faculty') });
  blocks.push({ kind: 'news', title: 'News', sections: [] });
  if (info.faqs.length) blocks.push({ kind: 'faqs', title: 'FAQs', sections: [] });
  return blocks.filter(block => !['tabs', 'section'].includes(block.kind) || block.sections.length);
}
