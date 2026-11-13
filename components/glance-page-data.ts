import { apiMedia, apiRecord } from './dgu-content-api';
import { clientDguApiUrl, readDguApiJson } from './dgu-api-transport';
import { hostelVideo, type HostelVideo } from './hostel-page-data';

export type GlanceContent = {
  established: string; location: string; name: string; formerName: string; legacy: string;
  introduction: string; more: string; mission: { title: string; items: string[] };
  vision: { title: string; html: string }; values: string[];
  approvals: { title: string; caption: string; logos: { src: string; title: string; artwork: string; caption: string }[] };
  rankings: { title: string; caption: string }; video: HostelVideo | null;
};
const plain = (node: Element | null | undefined) => node?.textContent?.replace(/\s+/g, ' ').trim() || '';

export function parseGlanceContent(payload: unknown): GlanceContent {
  const outer = apiRecord(payload), data = apiRecord(outer?.data), page = apiRecord(data?.page);
  if (!outer || String(outer.error) !== '0' || !page || typeof page.html !== 'string' || !page.html.trim() || typeof DOMParser === 'undefined') throw new Error('DGU at a Glance content is unavailable.');
  const doc = new DOMParser().parseFromString(page.html, 'text/html');
  doc.querySelectorAll('script,style,head,template').forEach(node => node.remove());
  const head = doc.querySelector('.dgu-glance-head');
  const [established = '', location = ''] = plain(head?.querySelector('.dgu-sec-label')).split(/\s*·\s*/, 2);
  const [formerName = '', legacy = ''] = plain(head?.querySelector('p')).split(/\s*[—–]\s*/, 2);
  const intro = doc.querySelector('.dgu-about'), rest = intro?.cloneNode(true) as Element | undefined;
  const introduction = intro?.querySelector('p')?.outerHTML || ''; rest?.querySelector('p')?.remove();
  const mission = doc.querySelector('.mv-mission'), vision = doc.querySelector('.mv-vision');
  const valueText = plain(doc.querySelector('.mv-footer')).split(/[—–]/).slice(1).join('—');
  const approval = doc.getElementById('approvals-accreditation'), rankings = doc.getElementById('rankings-recognition');
  const order = ['University Grants Commission', 'AACSB Member', 'Association of Indian Universities', 'Pharmacy Council of India', 'Bar Council of India'];
  // These existing CMS filenames were checked against their actual image content.
  // The CMS alt labels are mismatched. Use the corresponding supplied PDF artwork
  // for the reference presentation, while retaining each actual API source URL.
  const verified: Record<string, readonly [string, string, string]> = {
    'dgu-affiliation-1.webp': ['University Grants Commission', 'approval-ugc.jpeg', 'University Grants Commission'],
    'dgu-affiliation-2.webp': ['AACSB Member', 'approval-aacsb.jpeg', 'Business Excellence Award'],
    'dgu-affiliation-3.webp': ['Association of Indian Universities', 'approval-aiu.jpeg', 'Association of Indian Universities'],
    'dgu-affiliation-4.webp': ['Pharmacy Council of India', 'approval-pci.jpeg', 'Pharmacy Council of India'],
  };
  const logos = Array.from(approval?.querySelectorAll('img') || []).flatMap(image => {
    const src = apiMedia(image.getAttribute('data-src') || image.getAttribute('src'));
    if (!src) return [];
    const filename = new URL(src).pathname.split('/').pop() || '', known = verified[filename];
    const title = known?.[0] || image.getAttribute('alt')?.trim() || '';
    return [{ src, title, artwork: known?.[1] || '', caption: known?.[2] || title }];
  });
  if (approval && !logos.some(logo => /bar council of india/i.test(logo.title))) {
    logos.push({
      src: '',
      title: 'Bar Council of India',
      artwork: 'Logo_of_Bar_Council_of_India.webp',
      caption: 'Bar Council of India',
    });
  }
  // Reference presentation order only. Missing CMS logos are never substituted.
  const rank = (name: string) => { const i = order.indexOf(name); return i < 0 ? order.length : i; };
  logos.sort((a, b) => rank(a.title) - rank(b.title));
  return {
    established, location, name: plain(head?.querySelector('h2')), formerName, legacy, introduction, more: rest?.innerHTML || '',
    mission: { title: plain(mission?.querySelector('h3')), items: Array.from(mission?.querySelectorAll('li') || []).map(item => item.innerHTML) },
    vision: { title: plain(vision?.querySelector('h3')), html: vision?.querySelector('p')?.outerHTML || '' },
    values: valueText.split('·').map(text => text.trim()).filter(Boolean),
    approvals: { title: plain(approval?.querySelector('h2')), caption: plain(approval?.querySelector('.dgu-sec-label')), logos },
    rankings: { title: plain(rankings?.querySelector('h2')), caption: plain(rankings?.querySelector('.dgu-sec-label')) },
    video: hostelVideo(typeof data?.videoUrl === 'string' ? data.videoUrl : '', 'DBS Global University'),
  };
}

export async function requestGlanceContent(signal: AbortSignal): Promise<GlanceContent> {
  const key = process.env.NEXT_PUBLIC_DGU_GLANCE_API_KEY?.trim() || process.env.NEXT_PUBLIC_DGU_MENU_API_KEY?.trim();
  if (!key) throw new Error('Glance API key is not configured.');
  const response = await fetch(clientDguApiUrl('glance', process.env.NEXT_PUBLIC_DGU_GLANCE_API_URL), {
    method: 'POST', headers: { 'Content-Type': 'application/json', Apikey: key },
    body: JSON.stringify({ URL: 'dgu-at-glance' }), signal, cache: 'no-store',
  });
  return parseGlanceContent(await readDguApiJson(response, 'Glance API'));
}
