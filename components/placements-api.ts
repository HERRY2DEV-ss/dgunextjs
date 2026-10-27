import { apiFields, apiMedia, apiPlain, apiRecord, apiText, apiValue } from './dgu-content-api';
import { clientDguApiUrl, readDguApiJson } from './dgu-api-transport';

export type PlacementStudent = {
  id: string;
  name: string;
  company: string;
  image: string;
  description: string;
  designation?: string;
  batch?: string;
};

export type PlacementSection = {
  id: string;
  title: string;
  tagline: string[];
  description: string;
  url: string;
  stats: [string, string][];
  students: PlacementStudent[];
};

export type PlacementsData = {
  sections: PlacementSection[];
  students: PlacementStudent[];
};

/** Scoped school responses are not yet verified against the live database. */
export const SCHOOL_PLACEMENTS_FILTER_VERIFIED = false;

export function parsePlacements(payload: unknown): PlacementsData {
  const root = apiRecord(payload);
  if (!root || String(root.error) !== '0' || !Array.isArray(root.data)) {
    return { sections: [], students: [] };
  }

  const sections: PlacementSection[] = root.data.flatMap(item => {
    const record = apiRecord(item);
    if (!record) return [];

    const fields = apiFields(record);
    const rawPlacements = apiValue(fields, 'placements', 'placement_list', 'students');
    const placementList = Array.isArray(rawPlacements) ? rawPlacements : [];

    const stats: [string, string][] = [];
    for (const [key, label] of [
      ['studentsPlaced', 'Students Placed'],
      ['avgCtc', 'Average CTC'],
      ['placementOffers', 'Placement Offers'],
    ]) {
      const value = apiPlain(apiValue(fields, key));
      if (value) stats.push([value, label]);
    }

    const students: PlacementStudent[] = placementList.flatMap(studentItem => {
      const student = apiRecord(studentItem);
      if (!student) return [];

      const f = apiFields(student);
      const status = apiValue(f, 'status');
      const deleted = apiValue(f, 'delete_status');

      if (
        (status !== undefined && String(status) !== '1') ||
        (deleted !== undefined && String(deleted) !== '0')
      ) {
        return [];
      }

      // Check all backend API property aliases for program and school placements
      const nestedStudent = ['student', 'studentDetails', 'alumni', 'profile', 'candidate']
        .map(key => apiRecord(apiValue(f, key)))
        .find(Boolean) || {};
      const value = (...names: string[]) => apiValue(f, ...names) ?? apiValue(nestedStudent, ...names);
      const studentName =
        apiPlain(value('name', 'fullName', 'studentName', 'student_name', 'alumniName', 'alumni_name', 'title')) ||
        '';

      const companyName =
        apiPlain(value('currentEmployer', 'current_employer', 'company', 'companyName', 'company_name', 'employer', 'organization')) ||
        '';

      const designationName =
        apiPlain(value('designation', 'role', 'position', 'jobTitle', 'job_title')) || '';

      const batchName =
        apiPlain(value('batch', 'year', 'passoutYear', 'passout_year', 'session')) || '';

      const imageUrl = apiMedia(
        value('imageURL', 'image_url', 'image', 'alumniImage', 'alumni_image', 'photo', 'picture')
      );

      const studentInfo =
        apiText(value('shortInfo', 'short_info', 'description', 'details', 'info', 'bio')) ||
        '';

      return [
        {
          id: apiText(apiValue(f, 'id')) || String(Math.random()),
          name: studentName,
          company: companyName,
          image: imageUrl,
          description: studentInfo,
          designation: designationName,
          batch: batchName,
        },
      ];
    });

    return [
      {
        id: apiText(apiValue(fields, 'id')),
        title: apiPlain(apiValue(fields, 'heading', 'title')) || 'Placements',
        tagline: [
          apiPlain(apiValue(fields, 'subHeading', 'shortHeading')),
          apiPlain(apiValue(fields, 'tagLine')),
        ].filter(Boolean),
        description: [
          apiText(apiValue(fields, 'shortDescription', 'shortDesc')),
          apiText(apiValue(fields, 'description')),
        ]
          .filter(Boolean)
          .join('\n'),
        url: apiText(apiValue(fields, 'url')),
        stats,
        students,
      },
    ];
  });

  return {
    sections,
    students: sections.flatMap(section => section.students),
  };
}

const pending = new Map<string, Promise<PlacementsData>>();

export function requestPlacements(identifier = '', isProgram = false): Promise<PlacementsData> {
  const validIdentifier = typeof identifier === 'string' && (identifier === '' && !isProgram || /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(identifier));
  if (!validIdentifier) return Promise.reject(new Error(`A valid ${isProgram ? 'program' : 'school'} URL is required.`));
  const cacheKey = `${isProgram ? 'program:' : 'school:'}${identifier}`;
  const active = pending.get(cacheKey);
  if (active) return active;

  const request = (async () => {
    const key =
      process.env.NEXT_PUBLIC_DGU_PLACEMENTS_API_KEY?.trim() ||
      process.env.NEXT_PUBLIC_DGU_MENU_API_KEY?.trim();

    if (!key) throw new Error('The Placements API key is not configured.');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const payloadBody = isProgram
        ? { PROGRAM_URL: identifier }
        : identifier ? { SCHOOL_URL: identifier } : {};

      const response = await fetch(
        clientDguApiUrl('placements', process.env.NEXT_PUBLIC_DGU_PLACEMENTS_API_URL?.trim()),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Apikey: key },
          body: JSON.stringify(payloadBody),
          signal: controller.signal,
          cache: 'no-store',
        }
      );

      return parsePlacements(await readDguApiJson(response, 'Placements API'));
    } catch (error) {
      if (controller.signal.aborted) throw new Error('The Placements API request timed out.');
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  })().finally(() => pending.delete(cacheKey));

  pending.set(cacheKey, request);
  return request;
}
