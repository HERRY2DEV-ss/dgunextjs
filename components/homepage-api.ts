import { apiMedia, apiRecord, contentCache } from './dgu-content-api';
import { clientDguApiUrl, readDguApiJson } from './dgu-api-transport';

export type HomepageData = {
  success: true;
  higherEducation: string[];
  startupSuccess: string[];
  news: unknown;
};

export function parseHomepageData(payload: unknown): HomepageData {
  const data = apiRecord(payload);
  if (data?.success !== true) throw new Error('Homepage API did not return a successful response.');
  const images = (value: unknown) => Array.isArray(value) ? Array.from(new Set(value.map(apiMedia).filter(Boolean))) : [];
  return { success: true, higherEducation: images(data.higherEducation), startupSuccess: images(data.startupSuccess), news: data.news };
}

const cachedHomepage = contentCache<HomepageData>();
/** The supplied homepage PHP accepts GET, without an Apikey header. Share the
 * same live response between success stories and the common news section. */
export function requestHomepageData(): Promise<HomepageData> {
  return cachedHomepage('home', async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(clientDguApiUrl('homepage', process.env.NEXT_PUBLIC_HOMEPAGE_DATA_API), {
        signal: controller.signal, credentials: 'omit', cache: 'no-store',
      });
      return parseHomepageData(await readDguApiJson(response, 'Homepage API'));
    } finally { clearTimeout(timeout); }
  });
}


export type HomepageHeroSlide = { image: string; alt?: string; caption?: string };

function extractHeroSlides(payload: unknown): HomepageHeroSlide[] {
  const slides: HomepageHeroSlide[] = [];
  const seen = new Set<string>();
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const imageKeys = new Set(['image', 'imageurl', 'sliderimage', 'sliderimageurl', 'banner', 'bannerimage', 'bannerurl', 'desktopimage', 'desktopimageurl', 'photourl', 'picture', 'src']);
  const titleKeys = new Set(['title', 'heading', 'name', 'caption', 'alt', 'description']);
  const visit = (value: unknown, depth = 0): void => {
    if (depth > 6 || !value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach(item => visit(item, depth + 1)); return; }
    const entries = Object.entries(value as Record<string, unknown>);
    const imageEntry = entries.find(([key, item]) => imageKeys.has(normalize(key)) && typeof item === 'string' && Boolean(apiMedia(item)));
    if (imageEntry) {
      const image = apiMedia(imageEntry[1]);
      if (image && !seen.has(image)) {
        seen.add(image);
        const textEntry = entries.find(([key, item]) => titleKeys.has(normalize(key)) && typeof item === 'string' && item.trim());
        slides.push({ image, alt: textEntry ? String(textEntry[1]).trim() : 'DBS Global University' });
      }
    }
    entries.forEach(([, child]) => { if (child && typeof child === 'object') visit(child, depth + 1); });
  };
  visit(payload);
  return slides;
}

export async function requestHomepageHeroSlides(): Promise<HomepageHeroSlide[]> {
  const key = process.env.NEXT_PUBLIC_DGU_SLIDERS_API_KEY?.trim()
    || process.env.NEXT_PUBLIC_DGU_MENU_API_KEY?.trim();
  if (!key || /^(PASTE_YOUR_API_KEY_HERE|YOUR_ACTUAL_API_KEY|apikey)$/i.test(key)) {
    throw new Error('Configure the DGU API key for the homepage sliders endpoint.');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(clientDguApiUrl('sliders'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Apikey: key },
      body: JSON.stringify({}),
      cache: 'no-store',
      signal: controller.signal,
    });
    const payload = await readDguApiJson(response, 'Homepage sliders API');
    const slides = extractHeroSlides(payload);
    if (!slides.length) throw new Error('Homepage sliders API returned no usable image records.');
    return slides;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Homepage sliders API request timed out.');
    throw error;
  } finally { clearTimeout(timeout); }
}
