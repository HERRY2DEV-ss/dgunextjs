import { apiData, apiFields, apiMedia, apiPlain, apiRecord, apiText, apiValue, contentCache } from './dgu-content-api';
import { clientDguApiUrl, readDguApiJson } from './dgu-api-transport';
import { apiProgramHref, parsePrograms, type ApiSchool, type SchoolProgram } from './programs-api';

import { academicFlow } from './academic-content-flow';
import { academicSectionKey } from './academic-section-key';
import type { Recruiter } from './recruiters-api';
import { facultySlug, parseFaculty, type ApiFaculty } from './faculty-api';
import { academicBody, academicContentSignature, academicHeadingText, academicRecords, mergeAcademicBody, withoutRepeatedFeatures } from './academic-html';
import { academicStudentImage } from './academic-media';
import { academicPathIdentity } from './academic-clean-routes';
import { academicTracks, type AcademicTrack } from './academic-tracks';
import { academicProgramOptions } from './academic-program-options';
import { placementStudentMatches } from './academic-placements';
import { PROGRAM_DETAILS_ENABLED, ProgramDetailsPausedError } from './program-detail-policy';
import { academicTestimonials, academicTestimonialRecords } from './academic-testimonials';
import type { Review } from './reviews-api';

export type AcademicKind = 'program' | 'school';
export type AcademicSection = { title: string; html: string };
export type AcademicInfo = {
  kind: AcademicKind; id: string; slug: string; name: string; intro: string; banner: string; mobileBanner: string; tracks: AcademicTrack[]; tracksHeading:string;
  linkedPages: {title:string;url:string;html:string}[];
  programOptions?: AcademicSection[];
  pathways: AcademicSection[]; tabs: AcademicSection[]; sections: AcademicSection[]; accordions: AcademicSection[];
  faqs: { question: string; answer: string }[]; facts: { label: string; value: string }[];
  programs: ApiSchool[]; recruiters: Recruiter[]; relatedPrograms: SchoolProgram[]; otherPrograms: SchoolProgram[];
  students: { id?: string; name: string; company: string; image: string; designation?: string; batch?: string; description?: string }[];
  placementScopeVerified?: boolean;
  placementStats: [string, string][]; placementTagline: string[]; placementHref: string;
  banners: { image: string; mobile: string; alt: string; href: string }[];
  recognitions: { image: string; alt: string }[]; video: string; videoPoster: string; videoStats: (readonly [string, string])[]; schoolUrl: string; schoolName: string;
  facultyIds: string[] | null;
  faculty?: ApiFaculty[];
  testimonials?: Review[];
  registrationLink: string; prospectusUrl: string; metaTitle: string; metaDescription: string; metaKeywords: string; metaCanonical: string;
};
const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clean = (value: unknown) => apiText(value).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<!--[\s\S]*?-->/g, '').replace(/<div\b[^>]*class\s*=\s*(["'])[^"']*global-program-title[^"']*\1[^>]*>([\s\S]*?)<\/div>/gi, '<h3>$2</h3>');
function html(value: unknown): string {
  const text = clean(value);
  return !text ? '' : /<[a-z][\s\S]*>/i.test(text) ? text : `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`;
}
function hasContent(value: string): boolean { return !!apiPlain(value) || /<(img|table)\b/i.test(value); }
export function academicSlug(value: string): string {
  try {
    const raw = value.trim();
    if (!/^https?:\/\//i.test(raw) && !/^\/?[a-z0-9]+(?:-[a-z0-9]+)*\/?$/i.test(raw)) return '';
    const url = new URL(raw, 'https://dgu.ac.in/');
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return '';
    if (!['dgu.ac.in', 'www.dgu.ac.in', 'doonbusinessschool.com', 'www.doonbusinessschool.com'].includes(url.hostname)) return '';
    const slug = url.pathname.replace(/^\/+|\/+$/g, '');
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug) ? slug.toLowerCase() : '';
  } catch { return ''; }
}

/** Complete DOM ranges retain text and tables inside nested CMS wrappers. */
export function splitAcademicContent(source: string, wanted: Set<string> = new Set()): { intro: string; sections: AcademicSection[] } {
  if (!hasContent(source) || typeof DOMParser === 'undefined') return { intro: source, sections: [] };
  const document = new DOMParser().parseFromString(source, 'text/html');
  document.querySelectorAll('script,style,link,meta,.nav-tabs,.tab-buttons').forEach(node => node.remove());
  // Guide headings may be plain paragraphs or bold CMS blocks rather than h2/h3.
  for (const node of Array.from(document.body.querySelectorAll('p,div'))) {
    if (node.closest('table,li,a,blockquote') || node.querySelector('h1,h2,h3,h4,h5,h6,table,ul,ol,img,video,iframe')) continue;
    const title = apiPlain(node.textContent), bold = node.querySelector('strong,b');
    if (!title || title.length > 160 || /[.!?]$/.test(title) || !(wanted.has(academicHeadingText(title)) || (bold && apiPlain(bold.textContent) === title && wanted.has(academicSectionKey(title))))) continue;
    const heading = document.createElement('h3'); heading.textContent = title; node.replaceWith(heading);
  }
  const all = Array.from(document.body.querySelectorAll('h1,h2,h3,h4,h5,h6')).filter(node => !node.closest('table,ul,ol'));
  const outer = all.some(node => /H[12]/.test(node.tagName)) ? new Set(['H1','H2']) : new Set(['H3']);
  const headings = all.filter(node => wanted.has(academicSectionKey(node.textContent || '')) || outer.has(node.tagName));
  if (!headings.length) return { intro: source, sections: [] };
  const fragment = (start: Element | null, end: Element | null) => {
    const range = document.createRange(); range.selectNodeContents(document.body);
    if (start) range.setStartAfter(start);
    if (end) range.setEndBefore(end);
    const holder = document.createElement('div'); holder.append(range.cloneContents()); return holder.innerHTML;
  };
  return { intro: fragment(null, headings[0]), sections: headings.map((node, index) => ({ title: apiPlain(node.textContent), html: fragment(node, headings[index + 1] || null) })) };
}

export function parseAcademicInfo(payload: unknown, kind: AcademicKind, slug: string, recordId = ''): AcademicInfo {
  const source = apiData(payload, [kind, `${kind}Info`]);
  const records = (Array.isArray(source) ? source : [source]).map(apiRecord).filter(record => record !== null);
  const record = records.find(row => academicSlug(apiText(apiValue(apiFields(row), 'url', `${kind}Url`, 'friendly_url'))) === slug && (!recordId || String(apiValue(apiFields(row), 'id', 'programID') ?? '') === recordId))
    || (records.length === 1 ? records[0] : undefined);
  if (!record) throw new Error('No information was returned for this page.');
  const fields = apiFields(record);
  if (recordId && String(apiValue(fields, 'id', 'programID') ?? '') !== recordId) throw new Error('The API returned a different program record.');
  const suppliedSlug = academicSlug(apiText(apiValue(fields, 'url', `${kind}Url`, 'friendly_url')));
  if (suppliedSlug && suppliedSlug !== slug) throw new Error('The API returned a different page.');
  const take = (...names: string[]) => apiValue(fields, ...names);
  const name = apiPlain(take(`${kind}Name`, 'name', 'title'));
  if (!name) throw new Error('The API did not return the page name.');
  const info: AcademicInfo = { kind, id: apiText(take('id', 'programID')), slug, name, intro: '', banner: apiMedia(take('bannerImage', 'heroImage', 'banner')), mobileBanner: apiMedia(take('mobileBannerImage','mobileBanner','featureImage')), tracks: [],
    tracksHeading:'', linkedPages:[], pathways: [], tabs: [], sections: [], accordions: [], faqs: [], facts: [], programs: [], recruiters: [], relatedPrograms: [], otherPrograms: [], students: [], placementStats: [], placementTagline: [], placementHref: '', banners: [], recognitions: [], video: apiMedia(take('videoSrc', 'videoURL')), videoPoster: apiMedia(take('videoPoster')), videoStats: [],
    schoolUrl: academicSlug(apiText(take('schoolUrl', 'schoolURL'))), schoolName: apiPlain(take('schoolName')), facultyIds: null,
    registrationLink: apiMedia(take('registrationLink')), prospectusUrl: apiMedia(take('prospectusURL', 'prospectus')),
    metaTitle: apiPlain(take('meta_title', 'metaTitle')), metaDescription: apiPlain(take('meta_desc', 'metaDescription')),
    metaKeywords: apiPlain(take('meta_keywords', 'metaKeywords')), metaCanonical: apiPlain(take('meta_canonical', 'metaCanonical')) };
  if (kind === 'program') info.testimonials = academicTestimonialRecords(take('studentTestimonials', 'testimonials'));
  const readHtml = (value: unknown) => {
    const source = html(value);
    if (kind !== 'program') return source;
    const extracted = academicTestimonials(source);
    const items = [...(info.testimonials || []), ...extracted.items];
    info.testimonials = Array.from(new Map(items.map(item => [item.name + '|' + item.text, item])).values());
    return extracted.html;
  };
  const wanted = new Set(academicFlow(slug, kind, info.id).flatMap(step => step.headings.flatMap(title => [academicSectionKey(title), academicHeadingText(title)])));
  ['international','industry','careers','higher-education','features','difference','options','global-pathway','sap-pathway','fees','eligibility','scholarship','advantage','structure','specification','specializations','placements'].forEach(key => wanted.add(key));
  const seen = new Set<string>();
  const add = (title: string, content: string, explicitTab = false, accordion = false) => {
    content = academicBody(content, title);
    if (!hasContent(content)) return;
    const key = `${academicSectionKey(title)}|${academicContentSignature(content).key}`;
    if (seen.has(key)) return; seen.add(key);
    const section = { title: apiPlain(title), html: content };
    const placement = academicSectionKey(title);
    if (['features','difference','pillars','global-difference','industry','laboratories'].includes(placement)) info.sections.push(section);
    else if (['careers','global-careers','structure','scholarship'].includes(placement)) info.tabs.push(section);
    else if (accordion || /^(a learning experience|build a truly global)/i.test(title)) info.accordions.push(section);
    else if (/options at a glance|pathway|learn across borders/i.test(title)) info.pathways.push(section);
    else if ((explicitTab && !/salient features/i.test(title)) || /advantage|eligib|fee structure|scholarship|program(me)? (structure|specification)|curriculum/i.test(title)) info.tabs.push(section);
    else info.sections.push(section);
  };
  let bodyHtml=html(take(kind === 'program' ? 'programDetails' : 'details', 'description', 'content'));
  const published=apiRecord(take('publishedPage'));
  const publishedBody=kind==='program' && published && academicSlug(apiText(published.url))===slug && hasContent(html(published.html));
  if(publishedBody && published) {
    // This is the current CMS page at this exact URL, returned by the API.
    bodyHtml=html(published.html);
    const publishedTitle=apiPlain(published.title);
    if(publishedTitle)info.name=publishedTitle;
  }
  bodyHtml=readHtml(bodyHtml);
  if(kind==='program'){
    const extracted=academicTracks(bodyHtml);bodyHtml=extracted.html;info.tracks=extracted.tracks;info.tracksHeading=extracted.heading;
    const options=academicProgramOptions(bodyHtml);bodyHtml=options.html;info.programOptions=options.options;
  }
  const body = splitAcademicContent(bodyHtml, wanted);
  const introParts = publishedBody ? [body.intro] : [kind === 'program' ? html(take('introText')) : '', kind === 'program' ? html(take('shortDescription')) : '', body.intro];
  info.intro = introParts.filter(hasContent).reduce((combined, part) => mergeAcademicBody(combined, part), '');
  body.sections.forEach(section => {
    if (/^(introduction|about)$/i.test(section.title) || section.title.toLowerCase() === name.toLowerCase()) info.intro += section.html;
    else if (!info.intro && section === body.sections[0] && !wanted.has(academicSectionKey(section.title))) info.intro += `<h2>${escapeHtml(section.title)}</h2>${section.html}`;
    else add(section.title, section.html);
  });
  // BCA's CMS body supplies its introduction under Program Overview. Move that
  // complete block beside the form when introText is empty; do not copy it twice.
  if (!hasContent(info.intro)) {
    const overview = info.sections.find(section => academicSectionKey(section.title) === 'overview');
    if (overview) {
      info.intro = `<h2>${escapeHtml(overview.title)}</h2>${overview.html}`;
      info.sections = info.sections.filter(section => section !== overview);
    }
  }
  for (const [heading, content] of publishedBody ? [] : kind === 'program'
    ? [['programMoreInfoHeading', 'programMoreInfo'], ['programOtherInfoHeading', 'programOtherInfo'], ['areaHeading2', 'areaDetails2'], ['areaHeading3', 'areaDetails3']]
    : [['areaHeading2', 'areaDetails2'], ['areaHeading3', 'areaDetails3'], ['moreHeading', 'readmore']]) {
    const copy = readHtml(take(content)), subheading = content === 'readmore' ? apiPlain(take('moresubHeading', ...(kind === 'school' ? ['subHeading'] : []))) : '';
    const title = apiPlain(take(heading, ...(kind === 'school' && content === 'readmore' ? ['heading'] : [])));
    if (content === 'readmore') { add(title, (subheading && subheading !== title ? `<h3>${escapeHtml(subheading)}</h3>` : '') + copy); continue; }
    const parts = splitAcademicContent(copy, wanted);
    if (hasContent(parts.intro)) add(apiPlain(take(heading)), parts.intro);
    parts.sections.forEach(section => add(section.title, section.html));
  }
  const tabs = publishedBody ? [] : take('tabs', 'programTabs');
  for (const item of academicRecords(tabs, ['tabName','heading','title'])) {
    const row = apiRecord(item); if (!row) continue; const f = apiFields(row);
    const title = apiPlain(apiValue(f, 'tabName', 'heading', 'title'));
    const other = academicSectionKey(title) === 'other-programs';
    const related = apiValue(f, 'tabPrograms', 'programs');
    const links = academicRecords(related, ['programName','name']).flatMap(program => {
      const p = apiRecord(program); if (!p) return []; const pf = apiFields(p);
      const name = apiPlain(apiValue(pf, 'programName', 'name')), href = apiProgramHref(apiValue(pf, 'url','friendly_url'), apiValue(pf, 'id') as string | number | undefined);
      if (other && name) info.otherPrograms.push({ id: apiText(apiValue(pf, 'id')), name, href });
      return name ? [`<li>${href ? `<a href="${escapeHtml(href)}">${escapeHtml(name)}</a>` : escapeHtml(name)}</li>`] : [];
    });
    const content = readHtml(apiValue(f, 'tabDetails', 'description', 'content')) + (!other && links.length ? `<ul>${links.join('')}</ul>` : '');
    // Older CMS records nest the career section inside Advantage. Keep its
    // full body in the existing admission tabs instead of duplicating it.
    if (academicSectionKey(title) !== 'careers' && typeof DOMParser !== 'undefined') {
      const document = new DOMParser().parseFromString(content, 'text/html');
      const careers = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).filter(node => !node.closest('table,li') && academicSectionKey(node.textContent || '') === 'careers');
      if (careers.length) {
        const parts = splitAcademicContent(content, new Set(['careers']));
        let remainder = parts.intro;
        for (const part of parts.sections) {
          if (academicSectionKey(part.title) === 'careers') add(part.title, part.html, true);
          else remainder += `<h3>${escapeHtml(part.title)}</h3>${part.html}`;
        }
        add(title, remainder, true);
        continue;
      }
    }
    add(title, content, true);
  }
  const accordions = publishedBody ? [] : take('accordion', 'accordions');
  for (const item of academicRecords(accordions, ['accordionName','name','title'])) {
    const row = apiRecord(item); if (!row) continue; const f = apiFields(row);
    add(apiPlain(apiValue(f, 'accordionName', 'name', 'title')), readHtml(apiValue(f, 'accordionDetails', 'details', 'description', 'content')), false, true);
  }
  for (const [field, title] of [['eligibility', 'Eligibility Criteria'], ['feeStructure', 'Fee Structure'], ['scholarship', 'Scholarship'], ['researchFacility', 'Research Facilities'], ['overview', 'Overview'], ['academicPage', 'Academic Information']] as const) {
    if(publishedBody)continue;
    const content = html(take(field));
    if (hasContent(content) && ![...info.tabs, ...info.sections].some(section => apiPlain(section.html).includes(apiPlain(content)))) add(title, content);
  }
  const eligibility = publishedBody ? '' : ['eligibilityIntroduction', 'eligibilityCriteria1', 'eligibilityCriteria2', 'eligibilityTerms'].map(field => html(take(field))).filter(hasContent).join('');
  if (eligibility && !info.tabs.some(section => apiPlain(section.html).includes(apiPlain(eligibility)))) add('Eligibility Criteria', eligibility);
  for (const list of [info.tabs, info.pathways, info.sections, info.accordions]) {
    const merged = new Map<string, AcademicSection>();
    for (const section of list) {
      const key = academicSectionKey(section.title), old = merged.get(key);
      if (old) old.html = mergeAcademicBody(old.html, key==='industry' && old.title!==section.title ? `<h3>${escapeHtml(section.title)}</h3>${section.html}` : section.html);
      else merged.set(key, { ...section });
    }
    list.splice(0, list.length, ...merged.values());
  }
  // B.Com CPA: pull the CPA-specific headings from whichever API bucket
  // the CMS parser assigned, then expose them as a dedicated tab after Scholarship.
  if (kind === 'program' && ['bcom-cpa', 'bcom-uscpa'].includes(slug)) {
    const isCourseHighlight = (section: AcademicSection) => {
      const key = academicSectionKey(section.title);
      return key === 'streamlined cpa qualification' ||
        (key.includes('progression') && key.includes('coursework'));
    };
    const highlightSections: AcademicSection[] = [];
    for (const list of [info.tabs, info.sections, info.accordions]) {
      for (let index = list.length - 1; index >= 0; index--) {
        if (isCourseHighlight(list[index])) highlightSections.unshift(...list.splice(index, 1));
      }
    }
    const existing = info.tabs.find(section => academicSectionKey(section.title) === 'course highlights');
    if (existing) {
      const parts = splitAcademicContent(existing.html, new Set(['streamlined cpa qualification', 'progression and coursework']));
      highlightSections.unshift(...parts.sections.filter(isCourseHighlight));
      existing.html = parts.intro;
    }
    if (highlightSections.length) {
      const highlightsTab: AcademicSection = {
        title: 'Course Highlights',
        html: highlightSections.map(section => `<h3>${escapeHtml(section.title)}</h3>${section.html}`).join(''),
      };
      const existingIndex = info.tabs.findIndex(section => academicSectionKey(section.title) === 'course highlights');
      if (existingIndex >= 0) info.tabs[existingIndex] = { ...info.tabs[existingIndex], html: mergeAcademicBody(info.tabs[existingIndex].html, highlightsTab.html) };
      else {
        const scholarshipIndex = info.tabs.findIndex(section => academicSectionKey(section.title) === 'scholarship');
        info.tabs.splice(scholarshipIndex >= 0 ? scholarshipIndex + 1 : info.tabs.length, 0, highlightsTab);
      }
    }
  }
  for (const [field, title] of [['highlights', 'Program Highlights'], ['outcomes', 'Program Outcomes'], ['placements', 'Placements']] as const) {
    const rows = academicRecords(take(field), ['title', 'heading', 'placementHeading', 'counterName', 'placedCounter']);
    const content = rows.flatMap(item => {
      const row = apiRecord(item); if (!row) return []; const f = apiFields(row);
      const heading = apiPlain(apiValue(f, 'title', 'heading', 'placementHeading', 'counterName'));
      if(field==='placements' && apiPlain(apiValue(f,'name','studentName')) && apiValue(f,'imageURL','alumniImage')!==undefined && !heading)return [];
      const symbol = apiPlain(apiValue(f, 'symbol'));
      const body = html(apiValue(f, 'description', 'details', 'placementDetails'));
      let extra = ['shortHeading', 'shortDesc', 'placedCounter', 'ctcCounter', 'offerCounter'].map(key => html(apiValue(f, key))).join('');
      const url = apiMedia(apiValue(f, 'placementUrl'));
      if (field === 'placements') {
        for (const [key, alias, label] of [['placedCounter', 'studentsPlaced', 'Students Placed'], ['ctcCounter', 'averageCTC', 'CTC'], ['offerCounter', 'placementOffers', 'Offers']]) {
          const value = apiPlain(apiValue(f, key, alias));
          if (value && !info.placementStats.some(stat => stat[0] === value && stat[1] === label)) info.placementStats.push([value, label]);
        }
        const tagline = apiPlain(apiValue(f, 'shortHeading'));
        if (tagline && !info.placementTagline.includes(tagline)) info.placementTagline.push(tagline);
        if (url && !info.placementHref) info.placementHref = url;
        extra = html(apiValue(f, 'shortDesc'));
        // Numeric programme counters have their own copy; show them as theme stats.
        if (/^[\d,.]+\s*\+?$/.test(heading) && apiPlain(body) && !/<(a|img|table|ul|ol|h[1-6]|strong|b|em|i)\b/i.test(body)) {
          info.placementStats.push([heading + symbol, apiPlain(body)]);
          return [];
        }
        const secondaryLink = url && url !== info.placementHref ? `<p><a href="${escapeHtml(url)}">Read more</a></p>` : '';
        const label = heading && !/^placements?$/i.test(heading) ? `<h3>${escapeHtml(heading + symbol)}</h3>` : '';
        return hasContent(body + extra + secondaryLink) ? [label + academicBody(body + extra, heading) + secondaryLink] : [];
      }
      return heading || hasContent(body + extra) ? [`<div>${heading ? `<h3>${escapeHtml(heading + symbol)}</h3>` : ''}${body}${extra}${url ? `<p><a href="${escapeHtml(url)}">Read more</a></p>` : ''}</div>`] : [];
    }).join('');
    add(title, content);
  }
  const rows = (value: unknown) => Array.isArray(value) ? value.flatMap(item => { const row=apiRecord(item);return row ? [apiFields(row)] : []; }) : [];
  info.linkedPages=rows(take('linkedPages')).flatMap(f=>{const url=academicSlug(apiText(apiValue(f,'url'))),body=html(apiValue(f,'html'));return url && hasContent(body) ? [{url,title:apiPlain(apiValue(f,'title')),html:body}] : [];});
  const programLinks = (value: unknown): SchoolProgram[] => rows(value).flatMap(f => {
    const id=apiText(apiValue(f,'id')), name=apiPlain(apiValue(f,'programName','name')), href=apiProgramHref(apiValue(f,'url'),id,'program');
    return name ? [{id,name,href,level:apiPlain(apiValue(f,'levelName'))}] : [];
  });
  info.relatedPrograms=programLinks(take('relatedPrograms', 'specialization'));
  const otherIds=new Set<string>();
  info.otherPrograms=[...info.otherPrograms,...programLinks(take('otherPrograms','otherSpecialization','otherSpecializations'))].filter(program=>{
    const key=program.id || `${program.name}|${program.href}`;
    if(program.id===info.id || otherIds.has(key))return false;otherIds.add(key);return true;
  });
  info.recruiters=rows(take('recruiters')).flatMap(f=>{const image=apiMedia(apiValue(f,'imageURL','image','logo'));return image ? [{id:apiText(apiValue(f,'id')) || image, name:apiPlain(apiValue(f,'name','recruiterName')), image}] : [];});
  const offered=take('placementProgramIds','programsOffered');
  const offeredIds=Array.isArray(offered) ? offered.map(String) : typeof offered==='string' ? offered.split(',').map(value=>value.trim()) : null;
  const seenStudents = new Set<string>();
  // A legacy placements[] row is a student only when its exact relation is
  // supplied. The old PHP fallback can return unrelated course records.
  const legacyPlacements = academicRecords(take('placements'), ['name','imageURL','alumniImage']).filter(item => {
    const f=apiFields(item);
    return apiValue(f,'placementType') !== undefined && apiValue(f,'linkID') !== undefined;
  });
  const studentRows=academicRecords(take('students'), ['name','imageURL','alumniImage']);
  info.placementScopeVerified=take('placementScopeVerified')===true || Array.isArray(take('students'));
  info.students=[...studentRows,...legacyPlacements].flatMap(item=>{
    if(!placementStudentMatches(kind,info.id,offeredIds,item))return [];
    const f=apiFields(item), name=apiPlain(apiValue(f,'name','studentName'));
    const image=academicStudentImage(apiValue(f,'imageURL','image','alumniImage'));
    const company=apiPlain(apiValue(f,'company','currentEmployer')), id=apiText(apiValue(f,'id','sno'));
    const signature=id || `${name}|${company}|${image}`;
    if (seenStudents.has(signature)) return []; seenStudents.add(signature);
    return [{id,name,image,company,designation:apiPlain(apiValue(f,'designation')),batch:apiPlain(apiValue(f,'batch')),description:html(apiValue(f,'description','details'))}];
  });
  const seenBanners = new Set<string>();
  info.banners=academicRecords(take('banners','sliders','slider'),['imageURL','banner','image']).flatMap(item=>{
    const row=apiRecord(item);if(!row)return [];const f=apiFields(row);
    const mobile=apiMedia(apiValue(f,'mobileImageURL','mobileBannerImage','mobileBanner','mobileImage'));
    const image=apiMedia(apiValue(f,'imageURL','bannerImage','banner','image')) || mobile;
    const identity=image+'|'+mobile;
    if(!image || seenBanners.has(identity))return [];seenBanners.add(identity);
    return [{image,mobile,alt:apiPlain(apiValue(f,'name','alt','title')) || name,href:apiProgramHref(apiValue(f,'url','otherurl','link'))}];
  });
  const facultyIds=take('facultyIds','facultyIDs');
  if(facultyIds !== undefined)info.facultyIds=Array.from(new Set((Array.isArray(facultyIds)?facultyIds:apiText(facultyIds).split(',')).map(apiText).filter(id=>/^[1-9][0-9]*$/.test(id))));
  if (kind === 'school' && Array.isArray(take('faculty'))) {
    // The current response repeats one numeric ID for different faculty.
    // Its distinct profile URLs identify the actual supplied school members.
    const faculty = (take('faculty') as unknown[]).flatMap(value => {
      const row = apiRecord(value); if (!row) return [];
      const fields = apiFields(row), url = facultySlug(apiValue(fields, 'url'));
      return [{ ...row, id: url || apiText(apiValue(fields, 'id')) }];
    });
    info.faculty = parseFaculty({ error: '0', data: faculty }, { SCHOOL_URL: slug });
  }
  info.recognitions=rows(take('recognitions','logos')).flatMap(f=>{const image=apiMedia(apiValue(f,'imageURL','image','logo'));return image ? [{image,alt:apiPlain(apiValue(f,'name','alt'))}] : [];});
  info.videoStats=rows(take('videoStats')).flatMap(f=>{const value=apiPlain(apiValue(f,'value')),label=apiPlain(apiValue(f,'label','name'));return value&&label ? [[value,label] as const] : [];});
  for (const [field, label] of [['duration', 'Duration'], ['highestCTC', 'Highest CTC'], ['avgSalary', 'Average Salary']] as const) {
    const value = apiPlain(take(field)); if (value) info.facts.push({ label, value });
  }
  const faqs = take('faqs', 'faq');
  if (Array.isArray(faqs)) info.faqs = faqs.flatMap(item => {
    const row = apiRecord(item); if (!row) return []; const f = apiFields(row);
    const question = apiPlain(apiValue(f, 'question', 'name', 'title')), answer = html(apiValue(f, 'answer', 'details', 'description'));
    return question && hasContent(answer) ? [{ question, answer }] : [];
  });
  if (kind === 'school') {
    info.schoolUrl = slug;
    const statistics = apiRecord(take('statistics'));
    if (statistics) {
      const fields = apiFields(statistics);
      for (const [field, label] of [['satisfiedStudents', 'Satisfied Students'], ['qualifiedTeachers', 'Qualified Teachers'], ['honorAwardWin', 'Awards'], ['trendingCourse', 'Courses']] as const) {
        const value = apiPlain(apiValue(fields, field));
        if (value) info.facts.push({ label, value });
      }
    }
    const programs = take('programs');
    if (Array.isArray(programs)) info.programs = parsePrograms({ error: '0', data: programs });
  }
  const related = take('relatedPrograms');
  const links = new Map<string, string>();
  for (const program of [...info.relatedPrograms, ...info.otherPrograms, ...info.programs.flatMap(school => school.programs)]) {
    if (!program.href) continue;
    const identity=academicPathIdentity('program',new URL(program.href,'https://dgu.ac.in').pathname);
    if(identity)links.set(identity.slug,program.href);
  }
  if (Array.isArray(related)) for (const item of related) {
    const row = apiRecord(item); if (!row) continue; const f = apiFields(row);
    const url = apiText(apiValue(f, 'url')), slug = academicSlug(url);
    if (slug) links.set(slug, apiProgramHref(url, apiValue(f, 'id') as string | number | undefined));
  }
  if (links.size && typeof DOMParser !== 'undefined') {
    const rewrite = (source: string) => {
      const document = new DOMParser().parseFromString(source, 'text/html');
      for (const anchor of document.querySelectorAll('a[href]')) {
        const href = links.get(academicSlug(anchor.getAttribute('href') || ''));
        if (href) anchor.setAttribute('href', href);
      }
      return document.body.innerHTML;
    };
    info.intro = rewrite(info.intro);
    for (const section of [...info.pathways, ...info.tabs, ...info.sections, ...info.accordions]) section.html = rewrite(section.html);
    for (const faq of info.faqs) faq.answer = rewrite(faq.answer);
  }
  const featureCopies = info.sections.filter(section => ['difference','features','pillars'].includes(academicSectionKey(section.title))).map(section => section.html);
  info.sections = info.sections.flatMap(section => {
    if (!/^(?:about(?:\s+.+)?|academic information|overview)$/i.test(section.title)) return [section];
    const content = withoutRepeatedFeatures(section.html, featureCopies);
    return hasContent(content) ? [{ ...section, html:content }] : [];
  });
  return info;
}

const cached = contentCache<AcademicInfo>();
const ACADEMIC_CACHE_VERSION = 2;

function academicCacheKey(kind: AcademicKind, slug: string, recordId: string): string {
  return `dgu:academic-info:v${ACADEMIC_CACHE_VERSION}:${kind}:${encodeURIComponent(slug)}:${recordId || 'none'}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function hasStringFields(value: unknown, fields: string[]): boolean {
  return isRecord(value) && fields.every(field => typeof value[field] === 'string');
}

function isAcademicSchool(value: unknown): boolean {
  return hasStringFields(value, ['id', 'title', 'href', 'url']) && isRecord(value) &&
    Array.isArray(value.programs) && value.programs.every(program => hasStringFields(program, ['id', 'name', 'href']));
}

function isAcademicInfoFor(value: unknown, kind: AcademicKind, slug: string, recordId: string): value is AcademicInfo {
  if (!isRecord(value) || value.kind !== kind || value.slug !== slug || typeof value.id !== 'string' ||
      (recordId && value.id !== recordId) || typeof value.name !== 'string' || !value.name.trim()) return false;

  const strings = [
    'intro', 'banner', 'mobileBanner', 'tracksHeading', 'placementHref', 'video', 'videoPoster',
    'schoolUrl', 'schoolName', 'registrationLink', 'prospectusUrl', 'metaTitle', 'metaDescription', 'metaKeywords', 'metaCanonical',
  ];
  if (!strings.every(field => typeof value[field] === 'string')) return false;

  const recordArrays = [
    'tracks', 'linkedPages', 'pathways', 'tabs', 'sections', 'accordions', 'faqs', 'facts',
    'programs', 'recruiters', 'relatedPrograms', 'otherPrograms', 'students', 'banners', 'recognitions',
  ];
  if (!recordArrays.every(field => Array.isArray(value[field]) && (value[field] as unknown[]).every(isRecord))) return false;
  if (value.programOptions !== undefined && (!Array.isArray(value.programOptions) || !value.programOptions.every(isRecord))) return false;
  if (value.faculty !== undefined && (!Array.isArray(value.faculty) || !value.faculty.every(isRecord))) return false;
  if (value.testimonials !== undefined && (!Array.isArray(value.testimonials) || !value.testimonials.every(isRecord))) return false;
  if (value.facultyIds !== null && (!Array.isArray(value.facultyIds) || !value.facultyIds.every(item => typeof item === 'string'))) return false;
  if (value.placementScopeVerified !== undefined && typeof value.placementScopeVerified !== 'boolean') return false;
  if (!Array.isArray(value.placementStats) || !Array.isArray(value.placementTagline) || !Array.isArray(value.videoStats)) return false;

  const sections = ['pathways', 'tabs', 'sections', 'accordions', 'programOptions'];
  if (!sections.every(field => value[field] === undefined || (value[field] as unknown[]).every(item => hasStringFields(item, ['title', 'html'])))) return false;
  if (!(value.tracks as unknown[]).every(item => hasStringFields(item, ['title', 'html']))) return false;
  if (!(value.linkedPages as unknown[]).every(item => hasStringFields(item, ['title', 'url', 'html']))) return false;
  if (!(value.faqs as unknown[]).every(item => hasStringFields(item, ['question', 'answer']))) return false;
  if (!(value.facts as unknown[]).every(item => hasStringFields(item, ['label', 'value']))) return false;
  if (!(value.recruiters as unknown[]).every(item => hasStringFields(item, ['id', 'name', 'image']))) return false;
  if (!(value.relatedPrograms as unknown[]).every(item => hasStringFields(item, ['id', 'name', 'href']))) return false;
  if (!(value.otherPrograms as unknown[]).every(item => hasStringFields(item, ['id', 'name', 'href']))) return false;
  if (!(value.programs as unknown[]).every(isAcademicSchool)) return false;
  if (!(value.students as unknown[]).every(item => hasStringFields(item, ['name', 'company', 'image']))) return false;
  if (!(value.banners as unknown[]).every(item => hasStringFields(item, ['image', 'mobile', 'alt', 'href']))) return false;
  if (!(value.recognitions as unknown[]).every(item => hasStringFields(item, ['image', 'alt']))) return false;
  if (!(value.placementTagline as unknown[]).every(item => typeof item === 'string')) return false;
  if (!(value.placementStats as unknown[]).every(item => Array.isArray(item) && item.length === 2 && item.every(part => typeof part === 'string'))) return false;
  if (!(value.videoStats as unknown[]).every(item => Array.isArray(item) && item.length === 2 && item.every(part => typeof part === 'string'))) return false;

  return true;
}

export function readCachedAcademicInfo(kind: AcademicKind, rawSlug: string, recordId = ''): AcademicInfo | null {
  const slug = academicSlug(rawSlug);
  if (kind !== 'program' || !slug || typeof window === 'undefined') return null;
  const key = academicCacheKey(kind, slug, recordId);
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return null;
  }
  if (!raw) return null;
  let entry: unknown;
  try {
    entry = JSON.parse(raw);
  } catch {
    try { window.localStorage.removeItem(key); } catch { /* Storage can be unavailable. */ }
    return null;
  }
  try {
    if (!isRecord(entry) || entry.version !== ACADEMIC_CACHE_VERSION || entry.kind !== kind ||
        entry.slug !== slug || entry.recordId !== recordId || !isAcademicInfoFor(entry.info, kind, slug, recordId)) {
      window.localStorage.removeItem(key);
      return null;
    }
    return entry.info;
  } catch {
    return null;
  }
}

function persistAcademicInfo(info: AcademicInfo, kind: AcademicKind, slug: string, recordId: string): void {
  if (kind !== 'program' || typeof window === 'undefined' || !isAcademicInfoFor(info, kind, slug, recordId)) return;
  try {
    window.localStorage.setItem(academicCacheKey(kind, slug, recordId), JSON.stringify({
      version: ACADEMIC_CACHE_VERSION, kind, slug, recordId, info,
    }));
  } catch {
    // Storage can be unavailable or full; the live response remains usable.
  }
}

export function requestAcademicInfo(kind: AcademicKind, rawSlug: string, recordId = ''): Promise<AcademicInfo> {
  const slug = academicSlug(rawSlug);
  if (!slug) return Promise.reject(new Error('A valid page URL is required.'));
  if (recordId && (!/^[1-9][0-9]*$/.test(recordId) || !Number.isSafeInteger(Number(recordId)))) return Promise.reject(new Error('A valid program ID is required.'));
  if (kind === 'program' && !PROGRAM_DETAILS_ENABLED) return Promise.reject(new ProgramDetailsPausedError());
  return cached(`${kind}:${slug}:${recordId}`, async () => {
    const key = (kind === 'program' ? process.env.NEXT_PUBLIC_DGU_PROGRAM_INFO_API_KEY : undefined)?.trim() || process.env.NEXT_PUBLIC_DGU_MENU_API_KEY?.trim();
    if (!key) throw new Error('The API key is not configured.');
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(clientDguApiUrl(kind === 'program' ? 'program-info' : 'school-info', kind === 'program' ? process.env.NEXT_PUBLIC_DGU_PROGRAM_INFO_API_URL : undefined), {
        method: 'POST', headers: { 'Content-Type': 'application/json', Apikey: key },
        body: JSON.stringify({ [kind === 'program' ? 'PROGRAM_URL' : 'SCHOOL_URL']: slug }), cache: 'no-store', signal: controller.signal,
      });
      const info = parseAcademicInfo(await readDguApiJson(response), kind, slug, recordId);
      if (kind === 'program' && !hasContent(info.intro) && ![...info.pathways, ...info.tabs, ...info.sections, ...info.accordions, ...info.tracks, ...(info.programOptions || [])].some(section => hasContent(section.html))
        && !info.relatedPrograms.length && !info.otherPrograms.length && !info.faqs.length && !info.banner && !info.mobileBanner && !info.banners.length && !info.video) {
        throw new Error('The API returned no published programme content.');
      }
      if (!isAcademicInfoFor(info, kind, slug, recordId)) throw new Error('The API returned information for a different page.');
      return info;
    } finally { clearTimeout(timeout); }
  }).then(info => {
    if (!isAcademicInfoFor(info, kind, slug, recordId)) throw new Error('The API returned information for a different page.');
    persistAcademicInfo(info, kind, slug, recordId);
    return info;
  });
}
