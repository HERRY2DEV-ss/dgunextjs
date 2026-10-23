import { apiData, apiFields, apiMedia, apiPlain, apiRecord, apiText, apiValue, contentCache } from './dgu-content-api';
import { clientDguApiUrl, readDguApiJson } from './dgu-api-transport';
import { parseRecruiters, type Recruiter } from './recruiters-api';
import type { SchoolPageData } from './school-page-data';

export type AdmissionTrack = { label: string; title: string; html: string };
export type AdmissionSchool = { name: string; tracks: AdmissionTrack[] };
export type AdmissionFee = { key: string; title: string; html: string };
export type FeeSchool = { name: string; groups: { label: string; programs: AdmissionFee[]; html: string }[] };
export type AdmissionResource = { title: string; html: string; href: string };
export type AdmissionData = {
  title: string; intro: string; banner: string; metaTitle: string; metaDescription: string;
  details: AdmissionResource[];
  processTitle: string; schools: AdmissionSchool[]; processExtra: string;
  feeTitle: string; feeSchools: FeeSchool[]; feesExtra: AdmissionFee | null;
  resources: AdmissionResource[]; international: AdmissionResource | null; refund: AdmissionResource | null;
  commencement: AdmissionResource | null; viewBookUrl: string;
  media: { src: string; poster: string; stats: [string, string][] };
  placement: SchoolPageData['placement'] | null; placementHtml: string;
  recruiters: Recruiter[]; recruiterTitle: string;
};

const clean = (value: unknown) => apiText(value).replace(/<(script|style|head)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<!--[^]*?-->/g, '');
const meaningful = (html: string) => !!apiPlain(html) || /<(img|table)\b/i.test(html);
const contentTitle = (value: unknown) => apiPlain(value).replace(/\s*[+⌄›]\s*$/, '').trim();

function documentFor(value: unknown): Document | null {
  if (typeof DOMParser === 'undefined') return null;
  const document = new DOMParser().parseFromString(clean(value), 'text/html');
  document.querySelectorAll('script,style,head,link,meta,title,template').forEach(node => node.remove());
  return document;
}

function tabParts(node: Element): { label: string; html: string }[] {
  const labels = Array.from(node.querySelectorAll(':scope > ul.tabs > li')).map(item => contentTitle(item.textContent));
  const parent = node.querySelector(':scope > .content-tab');
  const panels = parent ? Array.from(parent.children).filter(item => item.matches('.fees-content-inner,.content-inner')) : [];
  return panels.map((panel, index) => ({ label: labels[index] || '', html: panel.innerHTML })).filter(panel => meaningful(panel.html));
}

function processGroups(source: string): { schools: AdmissionSchool[]; extra: string } {
  const document = documentFor(source);
  if (!document) return { schools: [], extra: source };
  const schools: AdmissionSchool[] = [];
  const toggles = Array.from(document.body.querySelectorAll('.toggle')).filter(node => !node.parentElement?.closest('.toggle'));
  for (const toggle of toggles) {
    const name = contentTitle(toggle.querySelector(':scope > .toggle-title')?.textContent);
    const content = toggle.querySelector(':scope > .toggle-content');
    if (!name || !content) continue;
    const tabs = content.querySelector('.ttm-tabs');
    const parts = tabs ? tabParts(tabs) : [{ label: '', html: content.innerHTML }];
    const tracks = parts.map(part => {
      const body = documentFor(part.html)!;
      const first = body.body.querySelector('h2,h3,h4,h5');
      const title = first && apiPlain(first.textContent).length < 240 ? contentTitle(first.textContent) : '';
      if (title) first!.remove();
      return { label: part.label, title, html: body.body.innerHTML };
    });
    if (tracks.length) { schools.push({ name, tracks }); toggle.remove(); }
  }
  const extra = document.body.innerHTML;
  return { schools, extra: meaningful(extra) ? extra : '' };
}

function feeGroups(source: string): { schools: FeeSchool[]; extra: AdmissionFee | null } {
  const document = documentFor(source);
  if (!document) return { schools: [], extra: meaningful(source) ? { key: 'extra', title: '', html: source } : null };
  const headings = Array.from(document.body.querySelectorAll('.section-title .title'));
  const schools: FeeSchool[] = [];
  for (const node of Array.from(document.body.querySelectorAll('.ttm-tabs')).filter(node => !node.parentElement?.closest('.ttm-tabs'))) {
    const heading = headings.filter(item => document.body.contains(item) && (item.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0).at(-1);
    const name = contentTitle(heading?.textContent); if (!name) continue;
    const groups = tabParts(node).map((part, groupIndex) => {
      const body = documentFor(part.html)!;
      const programs: AdmissionFee[] = [];
      for (const toggle of Array.from(body.body.querySelectorAll('.toggle')).filter(item => !item.parentElement?.closest('.toggle'))) {
        const title = contentTitle(toggle.querySelector(':scope > .toggle-title')?.textContent);
        const content = toggle.querySelector(':scope > .toggle-content');
        if (title && content && meaningful(content.innerHTML)) { programs.push({ key: `${groupIndex}-${programs.length}`, title, html: content.innerHTML }); toggle.remove(); }
      }
      const remaining = body.body.innerHTML;
      return { label: part.label, programs, html: meaningful(remaining) ? remaining : '' };
    });
    if (groups.length) { schools.push({ name, groups }); node.remove(); heading?.closest('.section-title')?.remove(); }
  }
  const remaining = document.body.innerHTML;
  const first = document.body.querySelector('summary,h1,h2,h3');
  const title = contentTitle(first?.textContent);
  return { schools, extra: meaningful(remaining) ? { key: 'compiled-fees', title, html: remaining } : null };
}

function resource(value: unknown): AdmissionResource | null {
  const record = apiRecord(value); if (!record) return null; const f = apiFields(record);
  const title = apiPlain(apiValue(f, 'title')), html = clean(apiValue(f, 'html')), href = apiMedia(apiValue(f, 'url'));
  return title && (meaningful(html) || href) ? { title, html, href } : null;
}

export function parseAdmissions(payload: unknown): AdmissionData {
  const record = apiRecord(apiData(payload, ['admissions']));
  if (!record) throw new Error('Admissions data is missing.');
  const f = apiFields(record), page = apiRecord(apiValue(f, 'page'));
  if (!page) throw new Error('Admissions page fields are missing.'); const p = apiFields(page);
  const title = apiPlain(apiValue(p, 'title')); if (!title) throw new Error('The API did not return the page title.');
  const process = resource(apiValue(f, 'process')), fees = resource(apiValue(f, 'fees'));
  const mappedProcess = processGroups(process?.html || ''), mappedFees = feeGroups(fees?.html || '');
  const media = apiRecord(apiValue(f, 'media')), m = media ? apiFields(media) : {};
  const resources = apiValue(f, 'resources');
  const info: AdmissionData = {
    title, intro: clean(apiValue(p, 'intro')), banner: apiMedia(apiValue(p, 'bannerImage')), details: [],
    metaTitle: apiPlain(apiValue(p, 'metaTitle')), metaDescription: apiPlain(apiValue(p, 'metaDescription')),
    processTitle: process?.title || '', schools: mappedProcess.schools, processExtra: mappedProcess.extra,
    feeTitle: fees?.title || '', feeSchools: mappedFees.schools, feesExtra: mappedFees.extra,
    resources: Array.isArray(resources) ? resources.map(resource).filter((item): item is AdmissionResource => !!item && meaningful(item.html)) : [],
    international: resource(apiValue(f, 'international')), refund: resource(apiValue(f, 'refundPolicy')),
    commencement: resource(apiValue(f, 'commencement')), viewBookUrl: apiMedia(apiValue(f, 'viewBookUrl')),
    media: { src: apiMedia(apiValue(m, 'src')), poster: apiMedia(apiValue(m, 'poster')), stats: [] }, placement: null, placementHtml: '', recruiters: [], recruiterTitle: apiPlain(apiValue(f, 'recruiterTitle'))
  };
  const stats = apiValue(m, 'stats');
  if (Array.isArray(stats)) info.media.stats = stats.flatMap(item => Array.isArray(item) && item.length === 2 && apiPlain(item[0]) && apiPlain(item[1]) ? [[apiPlain(item[0]), apiPlain(item[1])] as [string, string]] : []);
  
  const placement = resource(apiValue(f, 'placements')), pr = apiRecord(apiValue(f, 'placements'));
  info.details = [process, fees, ...info.resources, info.international, info.refund, info.commencement, placement]
    .filter((item): item is AdmissionResource => !!item && meaningful(item.html));
    
  if (placement && pr) {
    const prFields = apiFields(pr);
    const students = apiValue(prFields, 'students', 'placements');
    const statsList: [string, string][] = [];

    for (const [key, label] of [['studentsPlaced', 'Students Placed'], ['avgCtc', 'Average CTC'], ['placementOffers', 'Placement Offers']]) {
      const value = apiPlain(apiValue(prFields, key));
      if (value) statsList.push([value, label]);
    }

    info.placement = {
      title: placement.title || apiPlain(apiValue(prFields, 'heading', 'title')) || 'Placements',
      tagline: [apiPlain(apiValue(prFields, 'subHeading', 'shortHeading')), apiPlain(apiValue(prFields, 'tagLine'))].filter(Boolean),
      description: apiText(apiValue(prFields, 'shortDescription', 'shortDesc', 'description')),
      videoTitle: '',
      videoPoster: '',
      stats: statsList,
      students: Array.isArray(students) ? students.flatMap(item => {
        const row = apiRecord(item); if (!row) return []; const fields = apiFields(row);
        const name = apiPlain(apiValue(fields, 'name', 'currentEmployer'));
        const company = apiPlain(apiValue(fields, 'currentEmployer', 'company')) || name;
        const image = apiMedia(apiValue(fields, 'imageURL', 'image', 'alumniImage'));
        return name && image ? [{ name, company, image }] : [];
      }) : []
    };
    info.placementHtml = placement.html;
  }
  
  const recruiters = apiValue(f, 'recruiters');
  if (Array.isArray(recruiters)) info.recruiters = parseRecruiters({ error: '0', data: recruiters });
  return info;
}

const cache = contentCache<AdmissionData>();
export function requestAdmissions(): Promise<AdmissionData> {
  return cache('admissions', async () => {
    const key = process.env.NEXT_PUBLIC_DGU_ADMISSIONS_API_KEY?.trim() || process.env.NEXT_PUBLIC_DGU_MENU_API_KEY?.trim();
    if (!key) throw new Error('Admissions API key is not configured.');
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(clientDguApiUrl('admissions', process.env.NEXT_PUBLIC_DGU_ADMISSIONS_API_URL), {
        method: 'POST', headers: { 'Content-Type': 'application/json', Apikey: key }, body: '{}', signal: controller.signal, cache: 'no-store',
      });
      return parseAdmissions(await readDguApiJson(response, 'Admissions API'));
    } finally { clearTimeout(timeout); }
  });
}