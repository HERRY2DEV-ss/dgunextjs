import { apiFields, apiMedia, apiPlain, apiRecord, apiValue } from './dgu-content-api';
import { clientDguApiUrl, readDguApiJson } from './dgu-api-transport';

export type HostelPhoto = { src: string; alt: string };
export type HostelVideo = { src: string; title: string; poster: string };
export type HostelDetail = { title: string; blocks: { title: string; html: string }[]; photos: HostelPhoto[] };
export type HostelContent = {
  intro: string; reasons: { title: string; text: string }[]; campusIntro: string;
  mess: string; facilities: string[][]; residences: HostelDetail[]; common: HostelDetail | null;
  photos: HostelPhoto[]; videos: HostelVideo[]; tour: HostelVideo | null;
};

const plain = (element: Element | null) => element?.textContent?.replace(/\s+/g, ' ').trim() || '';
export function hostelVideo(source: string, title = '', poster = ''): HostelVideo | null {
  const src = apiMedia(source);
  if (!src) return null;
  let url: URL;
  try { url = new URL(src); } catch { return null; }
  if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com', 'youtu.be'].includes(url.hostname)) {
    const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.pathname.match(/\/(?:embed|shorts)\/([\w-]+)/)?.[1] || url.searchParams.get('v') || '';
    if (!/^[\w-]{11}$/.test(id)) return null;
    return { src: `https://www.youtube-nocookie.com/embed/${id}`, title, poster: poster || `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
  }
  if (/\.(?:mp4|webm)(?:$|[?#])/i.test(src)) return { src, title, poster };
  return null;
}

function detail(title: string, node: Element): HostelDetail {
  const blocks: HostelDetail['blocks'] = [];
  for (const element of node.querySelectorAll('p,h2,h3,h4,h5,h6,ul,ol,table')) {
    if (element.parentElement?.closest('ul,ol,table,p')) continue;
    if (/^H[2-6]$/.test(element.tagName)) {
      blocks.push({ title: plain(element), html: '' });
    } else if (plain(element) || element.tagName === 'TABLE') {
      if (!blocks.length) blocks.push({ title: '', html: '' });
      blocks[blocks.length - 1].html += element.outerHTML;
    }
  }
  return {
    title, blocks: blocks.filter(block => block.title || block.html),
    photos: Array.from(node.querySelectorAll('img')).flatMap(image => {
      const src = apiMedia(image.getAttribute('data-src') || image.getAttribute('src'));
      return src ? [{ src, alt: image.getAttribute('alt') === 'image' ? title : image.getAttribute('alt') || title }] : [];
    }),
  };
}

export function parseHostelContent(payload: unknown): HostelContent {
  const outer = apiRecord(payload);
  if (!outer || String(outer.error) !== '0') throw new Error('Hostel content is unavailable.');
  const root = apiRecord(outer.data);
  if (!root || typeof DOMParser === 'undefined') throw new Error('Hostel page fields are missing.');
  const fields = apiFields(root), page = apiRecord(apiValue(fields, 'page')), types = apiRecord(apiValue(fields, 'residencesPage'));
  const html = page ? String(page.html || '') : '', typesHtml = types ? String(types.html || '') : '';
  if (!html.trim() && !typesHtml.trim()) throw new Error('Hostel content is unavailable.');
  const document = new DOMParser().parseFromString(html, 'text/html');
  document.querySelectorAll('script,style,head,template').forEach(node => node.remove());
  const introTitle = Array.from(document.querySelectorAll('h2,h3')).find(node => /top reasons/i.test(plain(node)));
  const intro = introTitle?.closest('section')?.querySelector('h5,p') || null;
  const reasonList = document.querySelector('.featured-desc2 ul') || Array.from(document.querySelectorAll('ul')).find(list => /live smart/i.test(plain(list)));
  const reasons = reasonList ? Array.from(reasonList.children).filter(node => node.tagName === 'LI').map(node => {
    const text = plain(node), point = text.search(/\.\s/);
    return { title: point > 0 ? text.slice(0, point + 1) : text, text };
  }) : [];
  const campusIntro = plain(reasonList?.closest('.featured-content')?.querySelector('p') || null);
  const messHeading = Array.from(document.querySelectorAll('h3,h4,h5')).find(node => /^mess$/i.test(plain(node)));
  const mess = plain(messHeading?.closest('.featured-content')?.querySelector('.featured-desc p') || messHeading?.parentElement?.parentElement?.querySelector('p') || null);
  const lifeToggles = document.querySelectorAll('.toggle');
  const residenceDocument = lifeToggles.length ? document : new DOMParser().parseFromString(typesHtml, 'text/html');
  const residences = Array.from(residenceDocument.querySelectorAll('.toggle')).flatMap(node => {
    const title = plain(node.querySelector('.toggle-title')), content = node.querySelector('.toggle-content');
    return title && content ? [detail(title, content)] : [];
  });
  const commonHeading = Array.from(document.querySelectorAll('h3,h4')).find(node => /common facilities/i.test(plain(node)));
  const commonNode = commonHeading?.closest('section');
  const common = commonHeading && commonNode ? detail(plain(commonHeading), commonNode) : null;
  if (common && common.blocks[0]?.title === common.title) common.blocks.shift();
  const allItems = [...document.querySelectorAll('.ttm-list-li-content')].map(plain);
  const matchers = [/wi-?fi|wireless/i, /hot water/i, /laundry/i, /mess/i, /atm/i, /sports|sporting|basketball|football|snooker|table tennis/i, /electrical backup|power backup/i];
  const facilities = matchers.map(regex => [...new Set(allItems.filter(text => regex.test(text)))]);
  const photos = Array.isArray(root.photos) ? root.photos.flatMap(value => {
    const row = apiRecord(value); if (!row) return [];
    const src = apiMedia(row.imageURL); return src ? [{ src, alt: apiPlain(row.title) }] : [];
  }) : [];
  const videos = Array.isArray(root.videos) ? root.videos.flatMap(value => {
    const row = apiRecord(value); if (!row) return [];
    const video = hostelVideo(String(row.url || ''), apiPlain(row.title)); return video ? [video] : [];
  }) : [];
  return { intro: plain(intro), reasons, campusIntro, mess, facilities, residences, common, photos, videos, tour: hostelVideo(String(root.tourUrl || '')) };
}

export async function requestHostelContent(signal: AbortSignal): Promise<HostelContent> {
  const key = process.env.NEXT_PUBLIC_DGU_HOSTEL_API_KEY?.trim() || process.env.NEXT_PUBLIC_DGU_MENU_API_KEY?.trim();
  if (!key) throw new Error('Hostel API key is not configured.');
  const response = await fetch(clientDguApiUrl('hostel-life', process.env.NEXT_PUBLIC_DGU_HOSTEL_API_URL), {
    method: 'POST', headers: { 'Content-Type': 'application/json', Apikey: key },
    body: JSON.stringify({ URL: 'hostel-life' }), signal, cache: 'no-store',
  });
  return parseHostelContent(await readDguApiJson(response, 'Hostel API'));
}
