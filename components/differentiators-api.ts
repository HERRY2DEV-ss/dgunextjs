import { apiData, apiFields, apiMedia, apiPlain, apiRecord, apiValue, contentCache } from './dgu-content-api';
import { clientDguApiUrl, readDguApiJson } from './dgu-api-transport';

export type HomeDifferentiator = { id: number; title: string; description: string; href: string };
export type DifferentiatorsData = { title: string; points: HomeDifferentiator[] };

export function parseDifferentiators(payload: unknown): DifferentiatorsData {
  const record = apiRecord(apiData(payload, ['differentiators']));
  if (!record) throw new Error('Differentiator data is missing.');
  const fields = apiFields(record), title = apiPlain(apiValue(fields, 'title'));
  if (!title) throw new Error('The API did not return the section title.');
  const raw = apiValue(fields, 'points'), seen = new Set<number>();
  const points: HomeDifferentiator[] = Array.isArray(raw) ? raw.flatMap(item => {
    const record = apiRecord(item); if (!record) return [];
    const fields = apiFields(record), id = Number(apiValue(fields, 'id'));
    const title = apiPlain(apiValue(fields, 'title')), description = apiPlain(apiValue(fields, 'description'));
    const href = apiMedia(apiValue(fields, 'url'));
    if (!Number.isInteger(id) || id < 1 || id > 6 || seen.has(id) || !title || !href) return [];
    seen.add(id); return [{ id, title, description, href }];
  }) : [];
  return { title, points };
}

const cache = contentCache<DifferentiatorsData>();
export function requestDifferentiators(): Promise<DifferentiatorsData> {
  return cache('home-differentiators', async () => {
    const key = process.env.NEXT_PUBLIC_DGU_DIFFERENTIATORS_API_KEY?.trim() || process.env.NEXT_PUBLIC_DGU_MENU_API_KEY?.trim();
    if (!key) throw new Error('The API key is not configured.');
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(clientDguApiUrl('differentiators', process.env.NEXT_PUBLIC_DGU_DIFFERENTIATORS_API_URL), {
        method: 'POST', headers: { 'Content-Type': 'application/json', Apikey: key },
        body: '{}', cache: 'no-store', signal: controller.signal,
      });
      return parseDifferentiators(await readDguApiJson(response, 'Differentiators API'));
    } finally { clearTimeout(timeout); }
  });
}
