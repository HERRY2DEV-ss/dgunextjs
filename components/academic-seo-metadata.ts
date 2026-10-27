import 'server-only';
import { apiData, apiFields, apiPlain, apiRecord, apiText, apiValue, type ApiRecord } from './dgu-content-api';
import { liveDguApiUrl, readDguApiJson } from './dgu-api-transport';

export type ProgrammeSeoMetadata = {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
};

function identitySlug(value: unknown): string {
  const raw = apiText(value);
  if (!raw) return '';
  try {
    const url = new URL(raw, 'https://dgu.ac.in/');
    return url.pathname.replace(/^\/+|\/+$/g, '').split('/').pop()?.toLowerCase() || '';
  } catch {
    return raw.replace(/^\/+|\/+$/g, '').toLowerCase();
  }
}

function absoluteCanonical(value: unknown): string {
  const raw = apiText(value);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password && !url.hash ? raw : '';
  } catch {
    return '';
  }
}

export function parseAcademicSeoMetadata(payload: unknown, kind: 'program' | 'school', slug: string, recordId = ''): ProgrammeSeoMetadata {
  const source = apiData(payload, [kind, `${kind}Info`]);
  const records: ApiRecord[] = [];
  for (const item of Array.isArray(source) ? source : [source]) {
    const record = apiRecord(item);
    if (record) records.push(record);
  }

  const matching = records.filter(record => {
    const fields = apiFields(record);
    const urlSlug = identitySlug(apiValue(fields, 'url', `${kind}Url`, 'friendly_url'));
    const id = apiText(apiValue(fields, 'id', kind === 'program' ? 'programID' : 'schoolID'));
    if ((urlSlug && urlSlug !== slug) || (recordId && id && id !== recordId)) return false;
    return records.length === 1 || !!urlSlug || (!!recordId && id === recordId);
  });
  if (matching.length !== 1) throw new Error(`The API did not return one matching ${kind === 'program' ? 'programme' : 'school'} metadata record.`);

  const fields = apiFields(matching[0]);
  return {
    title: apiPlain(apiValue(fields, 'meta_title')),
    description: apiPlain(apiValue(fields, 'meta_desc')),
    keywords: apiPlain(apiValue(fields, 'meta_keywords')),
    canonical: absoluteCanonical(apiValue(fields, 'meta_canonical')),
  };
}

export function parseProgrammeSeoMetadata(payload: unknown, slug: string, recordId = ''): ProgrammeSeoMetadata {
  return parseAcademicSeoMetadata(payload, 'program', slug, recordId);
}

export async function loadAcademicSeoMetadata(kind: 'program' | 'school', slug: string, recordId = ''): Promise<ProgrammeSeoMetadata> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)) throw new Error(`A valid ${kind} URL is required.`);
  const key = (kind === 'program' ? process.env.NEXT_PUBLIC_DGU_PROGRAM_INFO_API_KEY : undefined)?.trim()
    || process.env.NEXT_PUBLIC_DGU_MENU_API_KEY?.trim();
  if (!key || /^(PASTE_YOUR_API_KEY_HERE|YOUR_ACTUAL_API_KEY|apikey)$/i.test(key)) {
    throw new Error(`The ${kind} metadata API key is not configured.`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(liveDguApiUrl(kind === 'program' ? 'program-info' : 'school-info',
      kind === 'program' ? process.env.NEXT_PUBLIC_DGU_PROGRAM_INFO_API_URL : undefined), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Apikey: key },
      body: JSON.stringify(kind === 'program' ? { PROGRAM_URL: slug } : { SCHOOL_URL: slug }),
      cache: 'force-cache',
      signal: controller.signal,
    });
    return parseAcademicSeoMetadata(await readDguApiJson(response), kind, slug, recordId);
  } finally {
    clearTimeout(timeout);
  }
}

export function loadProgrammeSeoMetadata(slug: string, recordId = ''): Promise<ProgrammeSeoMetadata> {
  return loadAcademicSeoMetadata('program', slug, recordId);
}
