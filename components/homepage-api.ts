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
