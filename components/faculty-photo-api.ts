import { requestFaculty, type ApiFaculty } from './faculty-api';

export type FacultyPhotos = { images: Record<string, string>; missing: string[] };

/** Enrich only the School API's existing members, matching actual profile URLs.
 * School, directory and individual feeds can expose different published lists. */
export async function requestFacultyPhotos(schoolUrl: string, members: readonly ApiFaculty[]): Promise<FacultyPhotos> {
  const wanted = new Set(members.map(member => member.slug).filter(Boolean));
  const images: Record<string, string> = Object.create(null);
  const add = (rows: readonly ApiFaculty[]) => {
    for (const member of rows) if (wanted.has(member.slug) && member.image && !images[member.slug]) images[member.slug] = member.image;
  };
  const missing = () => [...wanted].filter(slug => !images[slug]);
  add(members);
  if (missing().length) {
    try { add(await requestFaculty({ SCHOOL_URL: schoolUrl })); } catch { /* Continue with exact profile matching. */ }
  }
  if (missing().length) {
    try { add(await requestFaculty()); } catch { /* Individual published profiles can still supply their photo. */ }
  }
  const remaining = missing();
  // Limit simultaneous profile lookups; never replace membership with a global list.
  for (let index = 0; index < remaining.length; index += 4) {
    await Promise.all(remaining.slice(index, index + 4).map(async slug => {
      try { add(await requestFaculty({ URL: slug })); } catch { /* Retain the member and its missing-photo state. */ }
    }));
  }
  return { images, missing: missing() };
}
