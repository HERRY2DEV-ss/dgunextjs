import { apiData, apiFields, apiMedia, apiPlain, apiRecord, apiText, apiValue, contentCache } from './dgu-content-api';
import { clientDguApiUrl, readDguApiJson } from './dgu-api-transport';

export type Recruiter = { id: string; name: string; image: string };
export function parseRecruiters(payload: unknown): Recruiter[] {
  const entries = apiData(payload, ['recruiters']);
  if (!Array.isArray(entries)) throw new Error('Recruiter records are missing.');
  const seen = new Set<string>();
  const recruiters: Recruiter[] = [];
  for (const item of entries) {
    const record = apiRecord(item);
    if (!record) continue;
    const f = apiFields(record);
    const name = apiPlain(apiValue(f, 'name', 'recruiterName'));
    const image = apiMedia(apiValue(f, 'imageURL', 'image', 'logo'));
    if (!name || !image) continue;
    const id = apiText(apiValue(f, 'id')) || name + '|' + image;
    if (seen.has(id)) continue;
    seen.add(id);
    recruiters.push({ id, name, image });
  }
  if (entries.length && !recruiters.length) throw new Error('No readable recruiter logos were returned.');
  return recruiters;
}

const cachedRecruiters = contentCache<Recruiter[]>();
export function requestRecruiters(): Promise<Recruiter[]> {
  return cachedRecruiters('all', async () => {
    const key = process.env.NEXT_PUBLIC_DGU_RECRUITERS_API_KEY?.trim() || process.env.NEXT_PUBLIC_DGU_MENU_API_KEY?.trim();
    if (!key) throw new Error('Recruiter API key is not configured.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(clientDguApiUrl('recruiters', process.env.NEXT_PUBLIC_DGU_RECRUITERS_API_URL?.trim()), {
        method: 'POST', headers: { 'Content-Type': 'application/json', Apikey: key }, body: '{}',
        signal: controller.signal, cache: 'no-store',
      });
      return parseRecruiters(await readDguApiJson(response, 'Recruiters API'));
    } finally { clearTimeout(timeout); }
  });
}
