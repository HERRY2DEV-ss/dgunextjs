# Placements API update — 15 October 2026

This ZIP includes the previous internal-page design update plus the placements integration. Extract into the existing project root and overwrite matching files. Public assets, PHP files, database records, credentials and dependencies were not changed.

## Important backend correction required

**School filtering is currently incorrect in the developer endpoint.** Live JSON POST tests with the supplied key returned:

| Request body | Response | Placement IDs |
| --- | --- | --- |
| `{}` | 6 homepage records | 12, 13, 15, 16, 349, 351 |
| `{"SCHOOL_URL":"school-of-business"}` | 8 records | 6, 7, 8, 9, 10, 11, 12, 13 |
| `{"SCHOOL_URL":"school-of-law"}` | Same 8 records | 6, 7, 8, 9, 10, 11, 12, 13 |
| `{"SCHOOL_URL":"invalid-placement-audit-school"}` | Same 8 records, success | 6, 7, 8, 9, 10, 11, 12, 13 |

The scoped response also omits `name`; its `currentEmployer` values contain apparent student names and it provides no student-to-school/program relationship fields. The client preserves the values as supplied; it does not relabel them by guessing.

**Unverified scoped students are hidden.** `SCHOOL_PLACEMENTS_FILTER_VERIFIED` in `components/placements-api.ts` remains `false`. School sections show an unavailable message and retain the previously approved static right-side design. They do not fall back to homepage students, the old School API student array or local portraits. This is a deliberate guard against showing unrelated placements, not a claim that school filtering is fixed.

The developer must correct the `SCHOOL_URL` lookup/filter and confirm student name/employer fields. After that, recheck at least two different schools, a school with no placements, and a nonexistent school. Confirm real relationships against the database, then enable the guard, update its regression assertion and rebuild. No developer PHP file was overwritten.

## Sections connected

| Location | Current behavior |
| --- | --- |
| Homepage → Placements | All 6 records from the new unfiltered feed; hardcoded student array removed. Existing video/portrait pairing, controls, hover/touch details and approved static right copy retained. |
| Admissions overview | Student gallery, heading, subtitle and description come from the new API, independently of the old admissions `students` array. Other admissions content remains on its existing API. |
| Placement reports | Added the new live student gallery. Existing full report content/tables remain fetched from the admissions API. Root and generic viewer entry paths use the same page. |
| Every School placements block | Sends its actual `SCHOOL_URL`. Current broken scoped records are blocked as described above. Layout and recruiters remain common. |
| Program placements renderer | Prepared to use the Program API's explicit school relationship with the documented school filter. A missing relationship never becomes an unfiltered request. Program Details remains paused under the previous instruction; it has not been reactivated. |

Only `SCHOOL_URL` is documented for this endpoint. No `PROGRAM_URL`, `PROGRAM_ID`, paging, limits or imaginary detail endpoint were introduced. The six unfiltered records are what the server currently supplies; they are not a verified complete university placement catalogue. Some homepage `shortInfo` values already contain ellipses in the response; the client does not truncate them or invent the missing text.

## File changes

| Files | Purpose |
| --- | --- |
| `components/placements-api.ts` | Both observed payload shapes, full supplied HTML, safe image URL normalization, all returned records in order, POST/key transport, shared in-flight requests, fresh fetching and school guard. |
| `components/usePlacements.ts`, `PlacementsFeedback.tsx` | Loading/empty/error/retry states; stale responses cannot cross scopes; disabled scope cannot fetch global students. |
| `components/PlacementStudentCard.tsx`, `placements-api.css` | Shared student image/details card; hover, touch, missing-image handling and reduced motion; responsive card grid and separate subtitle lines. |
| `components/SchoolPlacementsSection.tsx` | Shared API-aware gallery; old arrays cannot appear during API failure; menu/profile pause behavior retained. |
| `app/page.tsx` | Homepage student source replaced; existing design/video sources/static copy retained. |
| `components/AcademicApiPage.tsx` | Connect common School/Program placements to their explicit school relationship. |
| `components/AdmissionPage.tsx`, `AdmissionDetailPage.tsx`, `LocalContentPage.tsx` | Admissions and placement-report entry paths use the new gallery. No new placement sections were added to unrelated pages. |
| `components/dgu-api-transport.ts`, `next.config.ts` | Original `get-placements.php` mapping and development proxy under the existing base path. |
| `scripts/placements-api-regression.cjs` | Contract, completeness, input/error/retry, media and scope-guard checks. |

## Validation

- Live POST requests: unfiltered, Business, Law, nonexistent school, and form-versus-JSON behavior. JSON with the documented optional parameter is used; form encoding produced the unfiltered response.
- All 14 distinct image URLs in the unfiltered/Business responses returned HTTP 200.
- API regression: both shapes; 43 complete/incomplete records without an arbitrary limit; ordering, explicit inactive/deleted flags, duplicate preservation, full rich text, safe media, malformed input/JSON, HTTP failure, retry, in-flight sharing and fresh requests.
- Existing audit, admissions, placement relationships and Program Details pause regressions passed. Production build/TypeScript generated 618 static pages.
- Final browser checks used recorded live responses against the local production export: homepage, admissions, reports, Business and Law at 320, 390, 768 and 1440px; image loading, exact student ID order, slider controls/autoplay, touch details, empty/error/HTML-error/retry states and reduced motion. Passed: 252 assertions, 20 responsive cases, no uncaught errors. Desktop/mobile screenshots were inspected; a concatenated subtitle was corrected and the final build was checked again.
- Focused lint: zero errors; 11 existing-pattern `<img>` warnings.

These are local checks with live-response fixtures, not a live deployment or database audit. An OPTIONS request from a localhost origin returned 403; development uses the existing same-origin Next proxy, and production is configured for the existing DGU origin. Direct cross-origin static preview hosting has not been validated.

## Apply

1. Back up the current project. Extract this ZIP into its root and overwrite matching files. Do not delete or replace `public`.
2. Keep the existing `.env.local` and API key. The existing `NEXT_PUBLIC_DGU_MENU_API_KEY` is reused; optional placement-specific key/URL overrides follow the project's existing convention. No new key is required.
3. Restart `npm run dev`, or run `npm run build` and deploy the rebuilt export to `/nextjs/homev1` using the existing process. Do not upload this ZIP over the developer's PHP API folder.
4. Keep scoped students guarded until the developer correction is verified. Do not enable the guard merely to make the 8 unrelated records visible.

Run `node scripts/placements-api-regression.cjs` for the added offline contract checks. The earlier internal-page report and inventory are included separately and describe the previous design stage.
