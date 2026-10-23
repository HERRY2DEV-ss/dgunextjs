/** The restored developer endpoint uses POST with PROGRAM_URL.
 * Its response is mapped by the shared academic renderer, without content fallback. */
export const PROGRAM_DETAILS_ENABLED: boolean = true;

export class ProgramDetailsPausedError extends Error {
  constructor() {
    super('Programme detail integration is paused.');
    this.name = 'ProgramDetailsPausedError';
  }
}
