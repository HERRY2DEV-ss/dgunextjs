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

function parseHomepageHeroSlides(payload: unknown): HomepageHeroSlide[] {
  const response = apiRecord(payload);
  if (!response || String(response.error) !== '0' || !Array.isArray(response.data)) {
    throw new Error('Homepage sliders API returned an invalid response.');
  }
  return response.data.flatMap(item => {
    const record = apiRecord(item);
    const image = apiMedia(record?.imageURL);
    if (!record || !image) return [];
    const name = typeof record.name === 'string' ? record.name.trim() : '';
    return [{ image, alt: name || 'DBS Global University' }];
  });
}

const cachedHomepageHeroSlides = contentCache<HomepageHeroSlide[]>();

export function requestHomepageHeroSlides(): Promise<HomepageHeroSlide[]> {
  return cachedHomepageHeroSlides('home', async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      // Local development uses the Next.js rewrite to avoid browser CORS;
      // production static hosting calls the existing live DGU API directly.
      const sliderApiUrl = process.env.NODE_ENV === 'development'
        ? '/api/get-homepage-sliders.php'
        : 'https://dgu.ac.in/api/get-homepage-sliders.php';
      const response = await fetch(sliderApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        cache: 'no-store',
        credentials: 'omit',
        signal: controller.signal,
      });
      const payload = await readDguApiJson(response, 'Homepage sliders API');
      return parseHomepageHeroSlides(payload);
    } catch (error) {
      if (controller.signal.aborted) throw new Error('Homepage sliders API request timed out.');
      throw error;
    } finally { clearTimeout(timeout); }
  });
}
