import { apiMedia, apiPlain, apiRecord } from './dgu-content-api';
import { clientDguApiUrl, readDguApiJson } from './dgu-api-transport';
import { hostelVideo, type HostelVideo } from './hostel-page-data';

export type InternationalPhoto = { src: string; alt: string };
export type InternationalPartner = { src: string; name: string; country: string };
export type InternationalBlock = { title: string; html: string; href: string };
export type InternationalOpportunity = { title: string; caption: string; cards: { title: string; href: string; image: string }[] };
export type InternationalUpdate = { title: string; summary: string; html: string; image: string; date: string; href: string; video: HostelVideo | null };
export type InternationalContent = {
  title: string; tagline: string; intro: string; stats: { value: string; label: string }[];
  partners: InternationalPartner[]; opportunities: InternationalOpportunity[]; pathways: InternationalBlock[];
  director: { name: string; role: string; html: string; image: string; video: HostelVideo | null } | null;
  initiatives: InternationalUpdate[]; news: InternationalUpdate[];
  accreditation: InternationalBlock & { logos: InternationalPhoto[] }; erasmus: InternationalBlock;
  photos: InternationalPhoto[]; location: InternationalBlock & { subtitle: string; accordions: InternationalBlock[]; video: HostelVideo | null };
  eligibilityIntro: string; eligibility: InternationalBlock[]; process: { title: string; steps: { title: string; text: string }[] };
  impact: { title: string; caption: string; stories: { name: string; quote: string; image: string }[] };
  heroVideo: HostelVideo | null; additional: InternationalBlock[];
};

// Country metadata for the actual named logos in this CMS, verified against the
// published partner artwork. Image URLs themselves always come from the API.
const partnerMetadata: Record<string, readonly [string, string]> = {
  'victoria-uni-logo.webp': ['Victoria University', 'Australia'],
  'torrens-uni-logo.webp': ['Torrens University Australia', 'Australia'],
  'shinawatra-uni-logo.webp': ['Shinawatra University', 'Thailand'],
  'ait-uni-logo.webp': ['Asian Institute of Technology', 'Thailand'],
  'dpu-uni-logo.webp': ['Dhurakij Pundit University', 'Thailand'],
  'mahsa-uni-logo.webp': ['MAHSA University', 'Malaysia'],
  'tarumt-uni-logo.webp': ['Tunku Abdul Rahman University of Management and Technology', 'Malaysia'],
  'must-uni-logo.webp': ['Malaysia University of Science and Technology', 'Malaysia'],
  'unitar-uni-logo.webp': ['UNITAR International University', 'Malaysia'],
  'sunway-uni-logo.webp': ['Sunway University', 'Malaysia'],
  'unimy-uni-logo.webp': ['University Malaysia of Computer Science and Engineering', 'Malaysia'],
  'utm-uni-logo.webp': ['Universiti Teknologi Malaysia', 'Malaysia'],
  'ucsi-uni-logo.webp': ['UCSI University', 'Malaysia'],
  'uowm-uni-logo.webp': ['University of Wollongong Malaysia', 'Malaysia'],
  'ntnu-uni-logo.webp': ['Norwegian University of Science and Technology', 'Norway'],
  'dulaty-uni-logo.webp': ['Dulaty University', 'Kazakhstan'],
  'turan-uni-logo.webp': ['Turan International University', 'Uzbekistan'],
  'caucasus-uni-logo.webp': ['Caucasus University', 'Georgia'],
  'indonesia-two-uni-logo.webp': ['Universitas Airlangga and Universitas Pancasakti Tegal', 'Indonesia'],
  'indonesia-two-uni-logo1.webp': ['', 'Indonesia'],
  'synergy-uni-logo.webp': ['Synergy University', 'Russia'],
  'washington-uni-logo.webp': ['Washington University of Science and Technology', 'United States'],
  'la-roche-uni-logo.webp': ['La Roche University', 'United States'],
  'medipol-uni-logo.webp': ['Istanbul Medipol University', 'Turkey'],
  'gedik-uni-logo.webp': ['Istanbul Gedik University', 'Turkey'],
  'bau-uni-logo.webp': ['Bahçeşehir University', 'Turkey'],
};
const accreditationNames: Record<string, string> = {
  'association-of-mba-logo.webp': 'Association of MBAs', 'aacsb-logo.webp': 'AACSB International',
  'bga-member-logo.webp': 'Business Graduates Association', 'ioh-logo.webp': 'Institution of Happiness',
  'iscea-sm-logo.webp': 'International Supply Chain Education Alliance', 'erasmus-logo.webp': 'Erasmus+', 'sii-logo.webp': 'Study in India',
};
const plain = (element: Element | null | undefined) => element?.textContent?.replace(/\s+/g, ' ').trim() || '';
function cleaned(element: Element | null | undefined, selectors = ''): string {
  if (!element) return '';
  const copy = element.cloneNode(true) as Element;
  copy.querySelectorAll('script,style,button,svg,.heading-seperator' + (selectors ? ',' + selectors : '')).forEach(node => node.remove());
  copy.querySelectorAll('i').forEach(node => { if (!plain(node)) node.remove(); });
  return copy.innerHTML;
}
function videoFrom(element: Element | null | undefined, title: string): HostelVideo | null {
  const youtube = element?.querySelector('lite-youtube[videoid]');
  if (youtube) return hostelVideo(`https://www.youtube.com/watch?v=${youtube.getAttribute('videoid')}`, title);
  const video = element?.querySelector('video[src],iframe[src]');
  return video ? hostelVideo(video.getAttribute('src') || '', title) : null;
}

export function parseInternationalContent(payload: unknown): InternationalContent {
  const outer = apiRecord(payload), data = apiRecord(outer?.data), page = apiRecord(data?.page);
  if (!outer || String(outer.error) !== '0' || !page || typeof page.html !== 'string' || !page.html.trim() || typeof DOMParser === 'undefined') throw new Error('International page content is unavailable.');
  const doc = new DOMParser().parseFromString(page.html, 'text/html');
  doc.querySelectorAll('script,style,head,template').forEach(node => node.remove());
  doc.querySelectorAll('img,video,iframe').forEach(node => {
    const raw = node.getAttribute('data-src') || node.getAttribute('src');
    if (raw) node.setAttribute('src', apiMedia(raw));
  });
  const used = new Set<Element>();
  const section = (pattern: RegExp) => {
    const result = Array.from(doc.querySelectorAll('section')).find(node => pattern.test(plain(node.querySelector('h2'))));
    if (result) used.add(result);
    return result;
  };
  const banner = doc.querySelector('.cust-adjust-banner');
  const stats = Array.from(banner?.querySelectorAll('.count-up') || []).map(node => ({ value: (node.querySelector('[data-target]')?.getAttribute('data-target') || plain(node.querySelector('.counter-count, .count, .counter-value'))).replace(/\+$/, '') + (node.querySelector('[data-target]')?.getAttribute('data-suffix') || '+'), label: plain(node.querySelector('h2,h3,h4,h5,h6')) })).filter(stat => stat.value !== '+' && stat.label);
  const partnersSection = section(/^Global Partnerships$/i);
  const partners: InternationalPartner[] = Array.from(partnersSection?.querySelectorAll('img[src]') || []).map(image => {
    const src = image.getAttribute('src') || '', filename = src.split('/').pop()?.split('?')[0] || '';
    const metadata = partnerMetadata[filename];
    return { src, name: image.getAttribute('alt')?.trim() || metadata?.[0] || '', country: image.getAttribute('data-country')?.trim() || metadata?.[1] || '' };
  }).filter(partner => partner.src);

  const opportunities: InternationalOpportunity[] = [], pathways: InternationalBlock[] = [];
  const opportunitySection = Array.from(doc.querySelectorAll('section')).find(node => /incoming opportunities/i.test(plain(node.querySelector('.toggle-title'))));
  if (opportunitySection) used.add(opportunitySection);
  opportunitySection?.querySelectorAll('.toggle').forEach(node => {
    const heading = node.querySelector('.toggle-title'), body = node.querySelector('.toggle-content'), title = plain(heading?.querySelector('h3,h4'));
    if (/^(incoming|outgoing) opportunities/i.test(title)) {
      const cards = Array.from(body?.querySelectorAll('a.jon-thumb2[href]') || []).map(link => ({ title: plain(link), href: link.getAttribute('href') || '', image: link.querySelector('img')?.getAttribute('src') || '' }));
      opportunities.push({ title, caption: plain(heading?.querySelector('p')), cards });
    } else if (title && body) {
      const link = Array.from(body.querySelectorAll('a[href]')).find(anchor => /read more/i.test(plain(anchor)));
      const copy = body.cloneNode(true) as Element;
      copy.querySelectorAll('a').forEach(anchor => { if (/read more/i.test(plain(anchor))) anchor.remove(); });
      pathways.push({ title, html: cleaned(copy), href: link?.getAttribute('href') || '' });
    }
  });

  const directorSection = Array.from(doc.querySelectorAll('section')).find(node => /jyoti bansal/i.test(plain(node.querySelector('h5'))));
  if (directorSection) used.add(directorSection);
  const director = directorSection ? {
    name: plain(directorSection.querySelector('h5')), role: plain(directorSection.querySelector('.team-position')),
    html: Array.from(directorSection.querySelectorAll('.col-lg-6 > p')).map(node => node.outerHTML).join(''),
    image: directorSection.querySelector('img')?.getAttribute('src') || '', video: videoFrom(directorSection, 'Office of International Affairs'),
  } : null;

  const updateSection = section(/^International Initiatives$/i);
  const updates = (nodes: NodeListOf<Element> | undefined): InternationalUpdate[] => Array.from(nodes || []).map(node => {
    const anchor = node.querySelector('a[data-bs-target]'), modalId = anchor?.getAttribute('data-bs-target')?.slice(1), modal = modalId ? doc.getElementById(modalId) : null;
    const title = plain(node.querySelector('h3')), description = node.querySelector('.update-card-desc'), summaryNode = description?.cloneNode(true) as Element | undefined;
    summaryNode?.querySelectorAll('a').forEach(link => link.remove());
    const actualLink = Array.from(node.querySelectorAll('a[href]')).find(link => !/^(#|javascript:)/i.test(link.getAttribute('href') || ''));
    const body = (modal?.querySelector('.modal-body') || description)?.cloneNode(true) as Element | undefined;
    body?.querySelectorAll('a[data-bs-target],a[href^="javascript:"]').forEach(link => { if (/read more/i.test(plain(link))) link.remove(); });
    return { title, summary: plain(summaryNode), html: cleaned(body), image: node.querySelector('img')?.getAttribute('src') || '', date: plain(node.querySelector('.news-date')), href: actualLink?.getAttribute('href') || '', video: videoFrom(modal, title) };
  }).filter(item => item.title || item.summary || item.html);
  const initiatives = updates(updateSection?.querySelectorAll('.split-column:not(.cust-br) .update-card'));
  const news = updates(updateSection?.querySelectorAll('.updates-slider-track .update-card'));
  const accreditationSection = section(/^Accreditations and Memberships$/i), erasmusSection = section(/^Erasmus\+ Registration$/i);
  const paragraphs = (element: Element | undefined) => Array.from(element?.querySelectorAll('p') || []).map(node => node.outerHTML).join('');
  const accreditation = {
    title: plain(accreditationSection?.querySelector('h2')), html: paragraphs(accreditationSection), href: '',
    logos: Array.from(accreditationSection?.querySelectorAll('img[src]') || []).map(image => { const src = image.getAttribute('src') || ''; return { src, alt: image.getAttribute('alt')?.trim() || accreditationNames[src.split('/').pop() || ''] || '' }; }),
  };
  const erasmus = { title: plain(erasmusSection?.querySelector('h2')), html: paragraphs(erasmusSection), href: '' };

  const gallerySection = section(/^Photo Gallery$/i), partnershipHeading = section(/^DBS Global University: Connecting Continents/i);
  const partnershipStories = Array.from(doc.querySelectorAll('section')).find(node => node.querySelector('img[src*="mou-signed-img"],img[src*="university-of-law-img"]'));
  if (partnershipStories) used.add(partnershipStories);
  // The CMS keeps the signed-partnership photo carousel in the next section.
  // Its heading is already represented by the PDF hero; its photos stay in the gallery.
  if (partnershipHeading) used.add(partnershipHeading);
  const photos: InternationalPhoto[] = [];
  [gallerySection, partnershipStories].forEach(node => node?.querySelectorAll('img[src]').forEach(image => {
    const src = image.getAttribute('src') || '', caption = plain(image.closest('.mou-slide')?.querySelector('.mou-slide-text') || image.closest('.featured-imagebox')?.querySelector('p,h3,h4,h5') || image.closest('[class*="col-"]')?.querySelector('p,h3,h4,h5'));
    if (src && !photos.some(photo => photo.src === src)) photos.push({ src, alt: image.getAttribute('alt') && image.getAttribute('alt') !== 'image' ? image.getAttribute('alt')! : caption });
  }));
  if (Array.isArray(data?.photos)) data.photos.forEach(item => { const row = apiRecord(item), src = apiMedia(row?.imageURL); if (src && !photos.some(photo => photo.src === src)) photos.push({ src, alt: apiPlain(row?.title) }); });

  const locationSection = section(/^location & Campus$/i);
  const location = {
    title: plain(locationSection?.querySelector('h2')), subtitle: plain(locationSection?.querySelector('h3')), href: '',
    html: Array.from(locationSection?.querySelectorAll(':scope > div > p') || []).map(node => node.outerHTML).join(''),
    accordions: Array.from(locationSection?.querySelectorAll('.toggle') || []).map(node => ({ title: plain(node.querySelector('.toggle-title')), html: cleaned(node.querySelector('.toggle-content')), href: '' })),
    video: videoFrom(locationSection, 'Location & Campus'),
  };
  const applySection = section(/^Who Can Apply\?$/i), eligibility: InternationalBlock[] = [];
  let eligibilityIntro = '';
  applySection?.querySelectorAll('.cust-bx-style2').forEach(node => {
    const title = plain(node.querySelector('h3')), html = cleaned(node, '.flex-column');
    if (/^At DBS Global University/i.test(title)) eligibilityIntro = `<h3>${title}</h3>${html}`;
    else if (title) eligibility.push({ title, html, href: '' });
  });
  const process = { title: plain(Array.from(applySection?.querySelectorAll('h2') || []).find(node => /application process/i.test(plain(node)))), steps: Array.from(applySection?.querySelectorAll('.process-card') || []).map(node => ({ title: plain(node.querySelector('h4')), text: plain(node.querySelector('p')) })) };
  const impactSection = section(/^Global Journeys/i), impact = {
    title: plain(impactSection?.querySelector('h2')), caption: plain(impactSection?.querySelector('.mainHeading h4')),
    stories: Array.from(impactSection?.querySelectorAll('.testi-flex') || []).map(node => ({ name: plain(node.querySelector('h5')).replace(/^~\s*/, ''), quote: plain(node.querySelector('p')).replace(/^['‘]|['’]$/g, ''), image: node.querySelector('img')?.getAttribute('src') || '' })),
  };
  // New CMS sections remain available instead of silently discarding content.
  const additional = Array.from(doc.querySelectorAll('section')).filter(node => !used.has(node) && !node.closest('.modal') && !node.parentElement?.closest('section') && plain(node)).map(node => ({ title: plain(node.querySelector('h2,h3,h4')), html: cleaned(node), href: '' }));
  return { title: plain(banner?.querySelector('h1')), tagline: plain(banner?.querySelector('h2')), intro: plain(banner?.querySelector('p')), stats, partners, opportunities, pathways, director, initiatives, news, accreditation, erasmus, photos, location, eligibilityIntro, eligibility, process, impact, heroVideo: hostelVideo(String(data?.heroVideoUrl || '')), additional };
}

export async function requestInternationalContent(signal: AbortSignal): Promise<InternationalContent> {
  const key = process.env.NEXT_PUBLIC_DGU_INTERNATIONAL_API_KEY?.trim() || process.env.NEXT_PUBLIC_DGU_MENU_API_KEY?.trim();
  if (!key) throw new Error('International API key is not configured.');
  const response = await fetch(clientDguApiUrl('international', process.env.NEXT_PUBLIC_DGU_INTERNATIONAL_API_URL), { method: 'POST', headers: { 'Content-Type': 'application/json', Apikey: key }, body: JSON.stringify({ URL: 'office-of-international-affairs' }), signal, cache: 'no-store' });
  return parseInternationalContent(await readDguApiJson(response, 'International API'));
}
