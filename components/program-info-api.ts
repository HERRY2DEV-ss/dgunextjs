import type { ProgramPageData } from './program-page-data';
import { apiData, apiField, apiFields, apiMedia, apiPlain, apiRecord, apiText, apiValue, contentCache, postContent, type ApiRecord } from './dgu-content-api';
import { PROGRAM_DETAILS_ENABLED, ProgramDetailsPausedError } from './program-detail-policy';

export type ProgramInfo = {
  patch: Partial<ProgramPageData>;
  metadata?: { title: string; description: string };
  overviewHtml: string; advantagesHtml: string; eligibilityHtml: string; feesHtml: string; feeTitle: string;
  specializationsHtml: string; pathwaysHtml: string; globalPathwayHtml: string; industryHtml: string; internationalHtml: string; faqHtml: string;
  international?: { heading?: string; subtitle?: string; photos?: { src: string; alt: string }[]; partners?: { name: string; logo?: string; href?: string }[] };
  registrationLink?: string; prospectusUrl?: string;
  relatedPrograms?: { title: string; note: string; href: string }[];
  higherEducationPhotos: { src: string; alt: string }[];
  facts: { label: string; value: string }[];
  // Older API sections omit the optional category used by AcademicContent.
  sections: { title: string; html: string; kind?: string }[];
  unmappedFields: string[];
};
// Original URL aliases verified against the supplied project's recorded programs feed.
const originalProgramUrls: Record<string, string> = {
  'bba-mba': 'bba-mba-integrated', 'mba-winter': 'mba-winter-batch',
  'ba-liberal-studies': 'bachelor-of-arts-liberal-arts', 'ma-liberal-studies': 'ma',
  'ba-film-tv': 'ba-film-and-tv', 'ba-digital-media': 'ba-digital-media-and-mass-communications', 'bpharm-lateral': 'bpharm-lateral-entry',
  'cert-artificial-intelligence': 'artificial-intelligence', 'cert-machine-learning': 'machine-learning',
  'cert-big-data-python-r': 'big-data-python-and-r', 'cert-internet-of-things': 'internet-of-things',
  'cert-sap': 'sap', 'cert-sas': 'sas', 'cert-nism': 'nism-certifications', 'cert-digital-marketing': 'digital-marketing',
  'cert-ecommerce': 'e-commerce', 'cert-agile-scrum': 'agile-and-scrum', 'cert-advanced-excel': 'basic-advanced-excel',
  'cert-big-data-analytics': 'big-data-analytics', 'cert-tally': 'computerised-accounting-tally', 'cert-derivatives': 'derivatives',
  'cert-french': 'french-language', 'cert-hr-analytics': 'hr-analytics', 'cert-international-logistics': 'international-logistics',
  'cert-java': 'java-technologies', 'cert-luxury-brand-marketing': 'luxury-brand-marketing', 'cert-rapidminer-tableau': 'rapidminer-tableau',
  'cert-red-hat-linux': 'red-hat-linux', 'cert-social-media-marketing': 'social-media-marketing',
  'cert-web-development': 'website-development-and-implementation', 'cert-dotnet-networking': 'net-framework-networking', 'cert-data-analytics-tools': 'data-analytics-tools',
};
export function programInfoSlug(value: string): string {
  const raw = value.trim();
  if (!raw) return '';
  try {
    const url = new URL(raw, 'https://dgu.ac.in/');
    if (!['https:', 'http:'].includes(url.protocol) || !['dgu.ac.in', 'www.dgu.ac.in'].includes(url.hostname) || url.search || url.hash) return '';
    const slug = url.pathname.replace(/^\/+|\/+$/g, '');
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug) ? slug.toLowerCase() : '';
  } catch { return ''; }
}
/** The original program URL may differ from its local Next.js route. */
export function programRequestSlug(data: Pick<ProgramPageData, 'slug' | 'sourceUrl'>): string {
  const source = data.sourceUrl ? programInfoSlug(data.sourceUrl) : '';
  return source && !source.startsWith('school-of-') ? source : originalProgramUrls[data.slug] || programInfoSlug(data.slug);
}
const label = (key: string) => key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, letter => letter.toUpperCase());
const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function contentHtml(value: unknown, depth = 0): string {
  if (depth > 6 || value === null || value === undefined || typeof value === 'boolean') return '';
  if (typeof value === 'string' || typeof value === 'number') {
    const text = apiText(value);
    return /<[a-z][\s\S]*>/i.test(text) ? text : text ? '<p>' + escape(text).replace(/\n/g, '<br>') + '</p>' : '';
  }
  if (Array.isArray(value)) return value.map(item => contentHtml(item, depth + 1)).join('');
  const record = apiRecord(value);
  if (!record) return '';
  const fields = apiFields(record);
  const title = apiPlain(apiValue(fields, 'title', 'heading', 'sectionTitle', 'tabName', 'name', 'label'));
  const body = apiValue(fields, 'html', 'content', 'description', 'details', 'body', 'text', 'items', 'value');
  if (body !== undefined) return (title ? '<h3>' + escape(title) + '</h3>' : '') + contentHtml(body, depth + 1);
  return Object.entries(record).filter(([key]) => !/^(id|url|slug|sort|order|status|image)$/i.test(key)).map(([key, item]) => {
    const html = contentHtml(item, depth + 1);
    return html ? '<h3>' + escape(label(key)) + '</h3>' + html : '';
  }).join('');
}

function feeTable(value: unknown): string {
  const rows: ApiRecord[] = Array.isArray(value) ? value.map(apiRecord).filter((row): row is ApiRecord => !!row)
    : apiRecord(value) && Object.values(value as ApiRecord).every(item => typeof item === 'string' || typeof item === 'number')
      ? Object.entries(value as ApiRecord).map(([course, fee]) => ({ course, fee })) : [];
  if (!rows.length) return contentHtml(value);
  const columns = [...new Set(rows.flatMap(row => Object.keys(row).filter(key => !/^(id|url|slug|sort|status|order)$/i.test(key))))];
  if (!columns.length || rows.some(row => Object.values(row).some(item => apiRecord(item) || Array.isArray(item)))) return contentHtml(value);
  return '<table><thead><tr>' + columns.map(key => '<th scope="col">' + escape(label(key)) + '</th>').join('') + '</tr></thead><tbody>'
    + rows.map(row => '<tr>' + columns.map((key, index) => '<' + (index ? 'td' : 'th scope="row"') + '>' + escape(apiPlain(row[key])) + '</' + (index ? 'td' : 'th') + '>').join('') + '</tr>').join('') + '</tbody></table>';
}
function advantageHtml(value: unknown): string {
  if (!Array.isArray(value)) return contentHtml(value);
  const columns = value.some(Array.isArray) ? value : [value];
  return columns.map(column => '<ul>' + (Array.isArray(column) ? column : [column]).map(item => '<li>' + contentHtml(item) + '</li>').join('') + '</ul>').join('');
}

type Slot = 'overviewHtml' | 'advantagesHtml' | 'eligibilityHtml' | 'feesHtml' | 'specializationsHtml' | 'pathwaysHtml' | 'globalPathwayHtml' | 'industryHtml' | 'internationalHtml' | 'faqHtml' | 'common' | 'section';
/** Place named API blocks into the existing design, independent of field casing. */
function sectionSlot(name: string): Slot | null {
  const key = apiField(name).replace(/^(program|programme|course)/, '');
  if (/fee|tuition|academiccost/.test(key)) return 'feesHtml';
  if (/eligib|admissionrequirement|whocanapply/.test(key)) return 'eligibilityHtml';
  if (/advantage|benefit|whychoose|highlights/.test(key)) return 'advantagesHtml';
  if (/mbaglobalpathway|globalpathway/.test(key)) return 'globalPathwayHtml';
  if (/internation|globallearning|studyabroad|globalexposure|globalimmersion/.test(key)) return 'internationalHtml';
  if (/specialization|specialisation|major|minor/.test(key)) return 'specializationsHtml';
  if (/pathway|optionsataglance/.test(key)) return 'pathwaysHtml';
  if (/industrycollab|collaborativeindustr|industrialcollab/.test(key)) return 'industryHtml';
  if (/faq|frequentlyasked/.test(key)) return 'faqHtml';
  if (/^(intro|introduction|overview|about|abouttheprogram|aboutprogram|description|programoverview)$/.test(key) || key.includes('about')) return 'overviewHtml';
  if (/placement|recruiter|campusnews|newsupdate|latestnews|facult|poweredby|careersuccessinhigher/.test(key)) return 'common';
  if (/curriculum|syllabus|career|learningoutcome|educationalobjective|specificoutcome|programoutcome|admissionprocess|scholarship|structure|certification|learningthrough|project|internship|procedure|disclaimer|workingprofessional|mtech/.test(key)) return 'section';
  return null;
}

export function parseProgramInfo(payload: unknown, requestedSlug: string): ProgramInfo {
  let source = apiData(payload, ['programInfo', 'program', 'programPage']);
  const container = apiRecord(source);
  if (container) {
    const nested = apiRecord(apiValue(apiFields(container), 'programInfo', 'program', 'programPage'));
    if (nested) source = { ...container, ...nested };
  }
  const entries = Array.isArray(source) ? source : apiRecord(source) ? [source] : [];
  const records = entries.map(apiRecord).filter((record): record is ApiRecord => !!record);
  const recordSlug = (record: ApiRecord) => programInfoSlug(apiText(apiValue(apiFields(record), 'programUrl', 'url', 'slug')));
  const record = records.find(item => recordSlug(item) === requestedSlug) || (records.length === 1 ? records[0] : undefined);
  if (!record) throw new Error('No information was returned for this programme.');
    const suppliedSlug = recordSlug(record);
  if (suppliedSlug && suppliedSlug !== requestedSlug) throw new Error('The API returned a different programme.');
  const fields = apiFields(record);
  const used = new Set<string>();
  const take = (...keys: string[]) => { keys.forEach(key => used.add(apiField(key))); return apiValue(fields, ...keys); };
  const info: ProgramInfo = { patch: {}, overviewHtml: '', advantagesHtml: '', eligibilityHtml: '', feesHtml: '', feeTitle: '',
    specializationsHtml: '', pathwaysHtml: '', globalPathwayHtml: '', industryHtml: '', internationalHtml: '', faqHtml: '', higherEducationPhotos: [], facts: [], sections: [], unmappedFields: [] };
  const routeSection = (title: string, html: string, explicit = false, append = false) => {
    if (!apiPlain(html)) return;
    const slot = sectionSlot(title);
    if (slot === 'common') {
      if (/careersuccessinhigher/i.test(apiField(title))) {
        const images = Array.from(html.matchAll(/<img\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1[^>]*>/gi));
        const seen = new Set(info.higherEducationPhotos.map(photo => photo.src));
        for (const match of images) { const src = apiMedia(match[2]); if (!src || !/\/slides\/career\//i.test(src) || seen.has(src)) continue; seen.add(src); info.higherEducationPhotos.push({ src, alt: apiPlain(match[0].match(/\balt\s*=\s*(["'])(.*?)\1/i)?.[2]) }); }
      }
      return; // Shared news/recruiters/faculty already occupy their own sections.
    }
    if (slot && slot !== 'section') {
      const namedHtml = append && slot === 'specializationsHtml' ? '<h3>' + escape(title) + '</h3>' + html : html;
      if (!info[slot]) info[slot] = namedHtml;
      else if (append && !apiPlain(info[slot]).includes(apiPlain(html))) info[slot] += namedHtml;
      return;
    }
    if (slot === 'section' || explicit) info.sections.push({ title, html });
    else info.unmappedFields.push(title);
  };
  const shortName = apiPlain(take('shortName', 'programShortName', 'shortTitle'));
  const fullName = apiPlain(take('fullName', 'programFullName', 'programName', 'name', 'title'));
  info.metadata = { title: apiPlain(take('metaTitle', 'seoTitle')), description: apiPlain(take('metaDescription', 'seoDescription')) };
  if (shortName) info.patch.shortName = shortName;
  if (fullName) info.patch.fullName = fullName;
  const hero = take('heroImage', 'bannerImage', 'banner', 'programImage', 'image');
  const heroRecord = apiRecord(hero);
  const heroImage = apiMedia(heroRecord ? apiValue(apiFields(heroRecord), 'image', 'src', 'url') : hero);
  if (heroImage) { info.patch.heroImage = heroImage; info.patch.heroAlt = fullName || shortName || 'Programme banner'; }
  const caption = apiPlain(take('heroCaption', 'bannerCaption', 'bannerHeading', 'bannerTitle', 'caption', 'tagline'));
  if (caption) info.patch.heroCaption = caption;
  info.overviewHtml = contentHtml(take('introText')) + contentHtml(take('programDetails', 'intro', 'overview', 'aboutProgram', 'aboutTheProgram', 'programDescription', 'description', 'about', 'content', 'details'));
  info.registrationLink = apiMedia(take('registrationLink')) || undefined;
  info.prospectusUrl = apiMedia(take('prospectusURL', 'prospectusUrl')) || undefined;
  take('canonical');
  if (apiPlain(info.overviewHtml)) info.patch.intro = [apiPlain(info.overviewHtml)];
  const recognitionTitle = apiPlain(take('recognitionTitle', 'accreditationTitle'));
  if (recognitionTitle) info.patch.recognitionTitle = recognitionTitle;
  const recognitions = take('recognitions', 'accreditations', 'recognitionLogos');
  if (Array.isArray(recognitions)) {
    const logos = recognitions.flatMap(item => {
      const row = apiRecord(item); const f = row ? apiFields(row) : {};
      const image = apiMedia(row ? apiValue(f, 'image', 'src', 'logo', 'url') : item);
      return image ? [{ image, alt: apiPlain(apiValue(f, 'alt', 'name', 'title')) || 'Programme recognition' }] : [];
    });
    if (!recognitions.length || logos.length) info.patch.recognitions = logos;
  }
  const faqSource = take('faqs', 'faq', 'frequentlyAskedQuestions');
  if (Array.isArray(faqSource)) {
    const faqs = faqSource.flatMap(item => {
      const row = apiRecord(item); if (!row) return [];
      const f = apiFields(row);
      const question = apiPlain(apiValue(f, 'question', 'faqQuestion', 'title'));
      const answer = contentHtml(apiValue(f, 'answer', 'faqAnswer', 'description', 'content'));
      return question && answer ? [{ question, answer }] : [];
    });
    if (!faqSource.length || faqs.length) info.patch.faqs = faqs;
  } else if (faqSource) { info.patch.faqs = []; info.faqHtml = contentHtml(faqSource); }

  const detailsRecord = apiRecord(take('admissionDetails', 'admissions'));
  const details = detailsRecord ? apiFields(detailsRecord) : {};
  info.advantagesHtml = advantageHtml(take('advantages', 'advantage', 'programAdvantages', 'benefits', 'highlights') ?? apiValue(details, 'advantages', 'benefits'));
  info.eligibilityHtml = contentHtml(take('eligibility', 'programEligibility', 'eligibilityCriteria', 'admissionRequirements') ?? apiValue(details, 'eligibility', 'eligibilityCriteria'));
  const feeSource = take('fees', 'programFees', 'feeStructure', 'programFeeStructure', 'feeRows', 'academicFees') ?? apiValue(details, 'feeRows', 'fees', 'feeStructure');
  const feeRows = Array.isArray(feeSource) ? feeSource.flatMap(item => {
    const row = apiRecord(item); if (!row) return [];
    const f = apiFields(row);
    const course = apiPlain(apiValue(f, 'course', 'courseName', 'program', 'programName', 'pathway'));
    const fee = apiPlain(apiValue(f, 'fee', 'fees', 'amount', 'totalAcademicFee'));
    return course && fee ? [{ course, fee }] : [];
  }) : [];
  info.feesHtml = feeRows.length && feeRows.length === (feeSource as unknown[]).length
    ? '<table><thead><tr><th>Programme</th><th>Academic Fee</th></tr></thead><tbody>' + feeRows.map(row => '<tr><th scope="row">' + escape(row.course) + '</th><td>' + escape(row.fee) + '</td></tr>').join('') + '</tbody></table>'
    : feeTable(feeSource);
  info.feeTitle = apiPlain(take('feeTitle', 'feeStructureTitle'));
  const feeNote = take('feeNote') ?? apiValue(details, 'feeNote');
  if (info.advantagesHtml || info.eligibilityHtml || info.feesHtml) {
    info.patch.admissionDetails = { advantages: [], eligibility: '', feeRows: [], feeNote: '' };
  }

  const groups = take('specializationGroups', 'specializations', 'specialisations');
  if (Array.isArray(groups)) {
    const columns = groups.some(Array.isArray) ? groups : [groups];
    const specializationGroups = columns.filter(Array.isArray).map(column => column.flatMap(item => {
      const row = apiRecord(item); const f = row ? apiFields(row) : {};
      const title = apiPlain(row ? apiValue(f, 'title', 'name', 'specializationName') : item);
      return title ? [{ title, eyebrow: apiPlain(apiValue(f, 'eyebrow')), note: apiPlain(apiValue(f, 'note')), href: apiMedia(apiValue(f, 'href', 'url')) || undefined }] : [];
    })).filter(column => column.length);
    if (!groups.length || specializationGroups.length) info.patch.specializationGroups = specializationGroups;
  } else if (groups) info.specializationsHtml = contentHtml(groups);
  const industry = take('industryCollaborations', 'industryCollaboration');
  if (Array.isArray(industry)) {
    const cards = industry.flatMap(item => {
      const row = apiRecord(item); if (!row) return []; const f = apiFields(row);
      const title = apiPlain(apiValue(f, 'title', 'name'));
      const copy = apiValue(f, 'paragraphs', 'content', 'description', 'details');
      const paragraphs = (Array.isArray(copy) ? copy : [copy]).map(apiPlain).filter(Boolean);
      return title && paragraphs.length ? [{ title, subtitle: apiPlain(apiValue(f, 'subtitle')), paragraphs }] : [];
    });
    if (cards.length === industry.length) info.patch.industryCollaborations = cards;
    else info.industryHtml = contentHtml(industry);
  } else if (industry !== undefined) info.industryHtml = contentHtml(industry);
  const pathways = take('pathwayOptions', 'pathways');
  const pathwayRecord = apiRecord(pathways), p = pathwayRecord ? apiFields(pathwayRecord) : {};
  if (pathwayRecord && Array.isArray(apiValue(p, 'rows'))) {
    const rows = (apiValue(p, 'rows') as unknown[]).flatMap(item => {
      const row = apiRecord(item); if (!row) return []; const f = apiFields(row);
      const pathway = apiPlain(apiValue(f, 'pathway', 'name')); if (!pathway) return [];
      return [{ pathway, focus: apiPlain(apiValue(f, 'focus')), structure: apiPlain(apiValue(f, 'structure')), idealFor: apiPlain(apiValue(f, 'idealFor')) }];
    });
    if (rows.length) info.patch.pathwayOptions = { introduction: apiPlain(apiValue(p, 'introduction')), rows,
      globalIntroduction: Array.isArray(p.globalintroduction) ? p.globalintroduction.map(apiPlain).filter(Boolean) : [],
      globalHighlights: Array.isArray(p.globalhighlights) ? p.globalhighlights.flatMap(item => { const row = apiRecord(item); if (!row) return []; const f = apiFields(row); return [{ highlight: apiPlain(apiValue(f, 'highlight', 'title')), description: apiPlain(apiValue(f, 'description')) }]; }) : [] };
  } else if (pathways !== undefined) info.pathwaysHtml = contentHtml(pathways);
  info.globalPathwayHtml = contentHtml(take('globalPathway', 'mbaGlobalPathway'));
  const globalSource = take('international', 'internationalExposure', 'globalLearning', 'studyAbroad', 'globalExposure');
  const globalRecord = apiRecord(globalSource);
  if (globalRecord) {
    const g = apiFields(globalRecord);
    info.internationalHtml = contentHtml(apiValue(g, 'content', 'description', 'details', 'text', 'overview'));
    info.international = { heading: apiPlain(apiValue(g, 'heading', 'title')) || undefined, subtitle: apiPlain(apiValue(g, 'subtitle')) || undefined };
    const photos = apiValue(g, 'photos', 'images', 'gallery');
    if (Array.isArray(photos)) info.international.photos = photos.flatMap(item => { const row = apiRecord(item), f = row ? apiFields(row) : {}; const src = apiMedia(row ? apiValue(f, 'src', 'image', 'url') : item); return src ? [{ src, alt: apiPlain(apiValue(f, 'alt', 'title')) }] : []; });
    const partners = apiValue(g, 'partners', 'universities', 'logos');
    if (Array.isArray(partners)) info.international.partners = partners.flatMap(item => { const row = apiRecord(item), f = row ? apiFields(row) : {}; const logo = apiMedia(row ? apiValue(f, 'logo', 'image', 'src') : item); const name = apiPlain(apiValue(f, 'name', 'title', 'alt')); return logo || name ? [{ name, logo: logo || undefined, href: apiMedia(apiValue(f, 'href', 'url')) || undefined }] : []; });
  } else info.internationalHtml = contentHtml(globalSource);

  // Direct named fields take precedence over an additional sections/tabs list.
  for (const [key, value] of Object.entries(record)) {
    const slot = sectionSlot(key);
    if (used.has(apiField(key)) || !slot || slot === 'section' || slot === 'common') continue;
    take(key);
    routeSection(label(key), slot === 'feesHtml' ? feeTable(value) : slot === 'advantagesHtml' ? advantageHtml(value) : contentHtml(value));
  }
  const rawSections = take('sections', 'programSections', 'pageSections', 'pageContent', 'tabs');
  const tabsRecord = apiRecord(rawSections);
  const sections = tabsRecord && apiValue(apiFields(tabsRecord), 'tabName') ? [tabsRecord] : rawSections;
  if (Array.isArray(sections)) {
    for (const item of sections) {
      const row = apiRecord(item); if (!row) continue;
      const f = apiFields(row);
      const title = apiPlain(apiValue(f, 'title', 'heading', 'sectionTitle', 'tabName', 'name')) || 'Programme information';
      if (sectionSlot(title) === 'feesHtml' && !info.feeTitle) info.feeTitle = title;
      const content = apiValue(f, 'tabDetails', 'html', 'content', 'description', 'details', 'body', 'text', 'items', 'value');
      const html = sectionSlot(title) === 'feesHtml' ? feeTable(content) : sectionSlot(title) === 'advantagesHtml' ? advantageHtml(content) : contentHtml(content);
      take('tabInnerHeading', 'tabPrograms');
      const programs = apiValue(f, 'tabPrograms');
      if (programs) info.relatedPrograms = (Array.isArray(programs) ? programs : [programs]).flatMap(item => { const row = apiRecord(item); if (!row) return []; const p = apiFields(row); const title = apiPlain(apiValue(p, 'programName', 'title', 'name')), href = apiMedia(apiValue(p, 'friendly_url', 'url', 'href')); return title ? [{ title, href, note: apiPlain(apiValue(p, 'shortDescription', 'description')) }] : []; });
      if (!html) continue;
      routeSection(title, html, true);
    }
  } else if (apiRecord(sections)) for (const [title, value] of Object.entries(sections as ApiRecord)) routeSection(label(title), contentHtml(value), true);
  else if (sections) routeSection('Program overview', contentHtml(sections));
  for (const [headingKey, bodyKey] of [['programMoreInfoHeading', 'programMoreInfo'], ['programOtherInfoHeading', 'programOtherInfo']]) {
    const title = apiPlain(take(headingKey)), body = take(bodyKey);
    if (body) routeSection(title || 'Program information', contentHtml(body), true);
  }
  const accordion = take('accordion');
  if (Array.isArray(accordion) && accordion.length) {
    const cards = accordion.flatMap(item => { const row = apiRecord(item); if (!row) return []; const f = apiFields(row); const title = apiPlain(apiValue(f, 'title', 'heading', 'accordionName', 'name')); const copy = apiValue(f, 'accordionDetails', 'details', 'content', 'description'); return title && copy ? [{ title, paragraphs: [apiPlain(contentHtml(copy))] }] : []; });
    if (cards.length) info.patch.industryCollaborations = cards;
  }

  // Keep further supplied sections (curriculum, careers, duration, etc.) visible.
  // Routing identifiers and API/SEO metadata are never shown as page content.
  const metadata = /^(id|programid|url|programurl|slug|schoolid|schoolurl|schoolname|school|error|success|status|message|sort|sortorder|order|createdat|updatedat|metatitle|metadescription|metakeywords|seotitle|seodescription|seokeywords|programinfo|program|programpage)$/;
  const factKeys = /^(duration|programduration|level|programlevel|intake|mode|studymode|credits|semesters|degree|qualification)$/;
  for (const [key, value] of Object.entries(record)) {
    const normalized = apiField(key);
    if (used.has(normalized) || metadata.test(normalized)) continue;
    const html = contentHtml(value);
    if (!apiPlain(html)) continue;
    if (factKeys.test(normalized)) info.facts.push({ label: label(key), value: apiPlain(value) || apiPlain(html) });
    else routeSection(label(key), html);
  }
  // A full HTML article may contain the same named blocks instead of separate fields.
  // Split recognized headings so its fees/advantages/international copy stays in the design slots.
  const originalOverview = info.overviewHtml.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<link\b[^>]*>/gi, '')
    .replace(/<div\b[^>]*class\s*=\s*(["'])global-program-title\1[^>]*>([\s\S]*?)<\/div>/gi, '<h3>$2</h3>');
  info.overviewHtml = originalOverview;
  // The live MBA record embeds its benefits in programDetails instead of a tab.
  // Keep that list in the existing Advantage panel and the introduction in Overview.
  if (requestedSlug === 'mba' && !info.advantagesHtml) {
    const benefits = originalOverview.match(/<ul\b[^>]*>[\s\S]*?<\/ul>/i)?.[0];
    if (benefits && /major plus minor|ai-integrated|pathway-based/i.test(apiPlain(benefits))) {
      info.advantagesHtml = benefits;
      info.overviewHtml = info.overviewHtml.replace(benefits, '');
    }
  }
  const articleOverview = info.overviewHtml;
  const headings = Array.from(articleOverview.matchAll(/<h([1-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi));
  const boundaries = headings.filter(match => sectionSlot(apiPlain(match[2])));
  if (boundaries.length) {
    info.overviewHtml = articleOverview.slice(0, boundaries[0].index);
    for (let index = 0; index < boundaries.length; index++) {
      const match = boundaries[index], title = apiPlain(match[2]);
      routeSection(title, articleOverview.slice((match.index || 0) + match[0].length, boundaries[index + 1]?.index ?? articleOverview.length), true, true);
    }
  }
  if (info.overviewHtml) info.patch.intro = [apiPlain(info.overviewHtml)];
  if (feeNote && info.feesHtml) info.feesHtml += contentHtml(feeNote);
  if (info.specializationsHtml) info.patch.specializationGroups = [];
  if (info.industryHtml) info.patch.industryCollaborations = [];
  if (info.faqHtml) info.patch.faqs = [];
  // Move recognizable international gallery/logo media into the existing common sliders.
  const globalPhotos: { src: string; alt: string }[] = [], globalPartners: { name: string; logo: string }[] = [], globalMedia = new Set<string>();
  info.internationalHtml = info.internationalHtml.replace(/<img\b[^>]*>/gi, tag => {
    const source = tag.match(/\bsrc\s*=\s*(["'])(.*?)\1/i)?.[2], alt = tag.match(/\balt\s*=\s*(["'])(.*?)\1/i)?.[2] || '';
    const src = apiMedia(source); if (!src) return tag;
    const photo = /abroad-pathways/i.test(src), partner = /university-logo\/logo\d/i.test(src);
    if (!photo && !partner) return tag;
    if (!globalMedia.has(src)) { if (photo) globalPhotos.push({ src, alt: apiPlain(alt) }); else globalPartners.push({ name: apiPlain(alt), logo: src }); globalMedia.add(src); }
    return '';
  });
  if (globalPhotos.length || globalPartners.length) info.international = { ...info.international, ...(globalPhotos.length ? { photos: globalPhotos } : {}), ...(globalPartners.length ? { partners: globalPartners } : {}) };
  if (info.advantagesHtml || info.eligibilityHtml || info.feesHtml) info.patch.admissionDetails ??= { advantages: [], eligibility: '', feeRows: [], feeNote: '' };
  const unique = new Set([info.overviewHtml, info.advantagesHtml, info.eligibilityHtml, info.feesHtml, info.specializationsHtml, info.pathwaysHtml, info.globalPathwayHtml, info.industryHtml, info.internationalHtml, info.faqHtml].map(apiPlain).filter(Boolean));
  info.sections = info.sections.filter(section => {
    const identity = apiPlain(section.html);
    if (!identity || unique.has(identity)) return false;
    unique.add(identity); return true;
  });
  if (!Object.keys(info.patch).length && !info.sections.length && !info.facts.length && !info.internationalHtml && !info.international) throw new Error('The API response has no readable programme information.');
  return info;
}

const cachedProgram = contentCache<ProgramInfo>();
export function requestProgramInfo(value: string): Promise<ProgramInfo> {
  const slug = programInfoSlug(value);
  if (!slug || slug.startsWith('school-of-')) return Promise.reject(new Error('A valid PROGRAM_URL is required.'));
  if (!PROGRAM_DETAILS_ENABLED) return Promise.reject(new ProgramDetailsPausedError());
  return cachedProgram(slug, async () => parseProgramInfo(await postContent('program', { PROGRAM_URL: slug }), slug));
}
/** Route identity and approved artwork are presentation, never editorial fallback content. */
export function programPresentation(template: ProgramPageData): ProgramPageData {
  return {
    slug: template.slug, schoolSlug: template.schoolSlug, sourceUrl: template.sourceUrl, referenceLayout: template.referenceLayout,
    heroImage: template.heroImage, heroAlt: 'Programme banner', heroCaption: '',
    videoSrc: template.videoSrc, videoPoster: template.videoPoster,
    shortName: '', fullName: '', intro: [], recognitionTitle: '', recognitions: [],
  };
}

/** Only API-supplied fields can enter the programme's displayed content. */
export function applyProgramInfo(template: ProgramPageData, info: ProgramInfo | null): ProgramPageData {
  const presentation = programPresentation(template);
  if (!info) return presentation;
  const data = { ...presentation, ...info.patch, slug: template.slug, schoolSlug: template.schoolSlug };
  data.shortName ||= data.fullName;
  data.fullName ||= data.shortName;
  if (!data.pathwayOptions && (info.pathwaysHtml || info.globalPathwayHtml)) {
    data.pathwayOptions = { introduction: '', rows: [], globalIntroduction: [], globalHighlights: [] };
  }
  if (info.relatedPrograms?.length && !info.specializationsHtml) {
    const groups = (data.specializationGroups || []).map(group => group.map(item => ({ ...item })));
    for (const program of info.relatedPrograms) {
      const name = apiField(program.title);
      const existing = groups.flat().find(item => name.includes(apiField(item.title)));
      if (existing) { existing.note = program.note || existing.note; }
      else { if (!groups.length) groups.push([]); groups[0].push({ title: program.title, note: program.note, href: program.href }); }
    }
    data.specializationGroups = groups;
  }
  return data;
}
