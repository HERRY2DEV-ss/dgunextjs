# Changes and validation

## Files

| File | Change |
| --- | --- |
| `api/dgu-academic-common.php` | Child programmes fetched once per request; lightweight legacy lookup; explicit established columns; indexed catalogue/level/school relationships; reuse school lookup; scalar/ID validation before PDO work; checked JSON encoding and safe buffered output; corrected verified placement-photo directory. |
| `api/get-programs.php` | Independently deployable catalogue with indexed membership and level grouping; school-specific SQL; consistent URL normalization; eligible records with missing URLs retained/logged; validation and reliable JSON responses. Its flat `childMenu` with `levelName` is preserved. |
| `api/get-admissions.php` | Removes placement `LIMIT 24` and presentation-only exclusions; placements available without the placement page; available admissions sections survive missing process/fees pages; duplicate slugs logged with existing last-in-sno-order selection retained; safer media URLs/JSON errors. |
| `api/get-differentiators.php` | Retains meaningful points without links/titles and without a section heading; one JSON decode; PDO exceptions and buffered output; checked encoding. Existing welcome record `sno=1`, singleton `LIMIT 1` and six blocks preserved. |
| `api/get-program-info.php` | Existing wrapper unchanged; included with its required common helper. |
| `api/get-school-info.php` | Existing wrapper unchanged; included with its required common helper. |
| `api/get-footer.php` | Existing wrapper unchanged; footer output exactly matches before. |

`get-menus.php` is developer-owned reference code and is unchanged. No credentials, schema, original database records, existing frontend files or assets were modified. Production APIs contain SELECT queries and still use `includes/classes.php`. No persistent cache added.

## Intended completeness fixes

- Admissions placements: **24 → 298 eligible students** in the supplied snapshot, in existing descending `sno` order. Existing student values are unchanged. Blank/null presentation fields no longer remove otherwise eligible records; missing media returns an empty string.
- If placement students exist without a `placement-reports` page, `placements` contains the same metadata keys and `students`: `id` is **null**, and `title`, `html`, `url` are empty strings. This newly available case represents an absent page honestly; real page IDs keep their existing types/values. With no page and no students, `placements` remains null.
- Admissions returns other eligible source sections when process/fees are absent; 404 requires no available page/heading/student/recruiter sources. A missing page title is not replaced with invented content.
- Missing/unsupported programme URLs no longer silently delete catalogue records: `url` is empty and the programme ID is logged. Bare slugs, existing HTTP(S) URLs, leading/trailing slash paths, protocol-relative URLs and encoded single-slug paths normalize consistently. Nested/unsupported paths are not converted into invented routes.
- Differentiator points with meaningful title or description survive empty/invalid links; `url` stays empty. No fake title/link is introduced. Empty heading plus meaningful points succeeds; wholly absent content still returns 404.
- Common placement-photo folder changes from `placements` to **`placement`**. This is a verified URL correction, not a performance-only change: the original B.Com page declares this folder and its Dev Maggo image loaded at 450×520. Admissions already used the correct folder.

No new pagination, truncation or list limit was introduced. Status, delete_status, searchArea and relationship eligibility filters are preserved. Programme/school rich-text fields retain full HTML; existing admissions HTML handling and differentiator text-field conversion remain unchanged. Theme assets still use configured `DGU_FRONTEND_BASE_PATH` or the verified deployed `/nextjs/homev1`, and are returned only if the actual server file exists.

## Performance-only changes and measured results

| Local request | Before | After |
| --- | --- | --- |
| School detail, school ID 1 | 8 SQL executions / 92 rows transferred | 7 executions / 30 rows |
| School-specific catalogue, school ID 1 | 3 executions / 74 rows | 3 executions / 13 rows |
| Fixture: two enabled `showPrograms` tabs | 14 executions | 12 executions; one child query |
| Full standalone catalogue | 3 executions / 74 rows | 3 executions / 74 rows; repeated PHP scans replaced with maps |
| Fixture: legacy programme URL with ID | Fallback transfers 88 full rows × 54 columns | One candidate × 2 columns, then one complete matched record |

Legacy fallback adds one matched-record fetch: the measured fixture's total query count is **12 → 13**. It reduces unnecessary rich-text transfer, not every query count. The existing snapshot has at most one enabled `showPrograms` tab per programme; the two-tab result is explicitly an isolated fixture. Full standalone selection now also includes established filter/order columns, so its selected cell count increases; no blanket transfer/speed improvement is claimed. Admissions response size grows intentionally to include every eligible student.

School and level order, programme `sortingOrder/sno` order, duplicate lookup selection and direct-school-before-parent fallback are preserved. CSV relationship order does not determine catalogue order. Unknown levels remain under the existing `Programs` group. Common grouped/flat catalogue modes remain distinct from the standalone contract.

## Local validation

- Native **PHP 8.3 syntax checks pass** for every supplied/updated PHP file.
- Before/after on the same read-only supplied snapshot: **88 published programmes, 8 schools, 53 catalogue entries**. IDs, relationships, ordering, nesting, types and full text match; verified photo-path and documented completeness changes are treated separately.
- Footer and existing six differentiators match exactly. Admissions page content, other sections, existing recruiters and the previous students' values match exactly.
- Separate disposable fixture tests pass for multiple enabled/disabled tabs, unknown levels, missing/malformed links, empty relationships, multiple schools, parent fallback, legacy/duplicate URLs, inactive/deleted/search-hidden records, missing presentation values, missing admissions pages, duplicate page slugs and empty differentiator headings.
- POST/OPTIONS/Apikey/CORS checks and malformed JSON/scalar/overflowing-ID cases pass. Invalid inputs fail before query execution. All four serializers return valid error JSON on encoding failure. Included output/warnings are suppressed from JSON; real database failures produce safe 500 errors rather than empty successes. Differentiator error `data:null` and other endpoints' error `data:[]` remain distinct.
- All **21 snapshot table checksums remain unchanged**. Original project source and public assets remain byte-for-byte unchanged. Fixture edits were confined to a separate disposable QA database, never the supplied snapshot or live server.

## Menu finding and proposal

| Current parser expects | Supplied updated API returns |
| --- | --- |
| `name` | `menuName` |
| `childMenu` at top level | `subMenu` |
| `childMenu` in submenu | `subsubMenu` |

The updated PHP returns `error:"0"` and **9 menus** on the supplied snapshot; the actual current parser produces **0**. The three available earlier ZIPs also contain the old field mapping, including the same empty-menu error guard. This confirms a contract mismatch rather than proving that the live API has no records.

The optional patch changes one frontend parser file, preserves legacy feed support, and avoids applying legacy cumulative-prefix removal to the new independent arrays. In-memory TypeScript checks and exact updated/legacy menu-mapping tests pass; all new menu labels, links, targets and nested items are retained. It is **not applied**, because the current mandatory conditions prohibit frontend edits. No API response keys were renamed.

The supplied menu PHP also lacks `Apikey` in its CORS allowed-header list and reads a case-sensitive header name. These are separate deployment checks for genuinely cross-origin/lowercase-header requests; no live authenticated response was available to prove either causes this reported error. Do not replace developer menu code or change the key without checking the actual response.

**Other frontend follow-up required for newly available edge cases:** the unchanged `differentiators-api.ts` still requires a section heading and point title/link, so it can reject the backend's correctly retained linkless/titleless records. The unchanged `admissions-api.ts` only maps students when placement page metadata passes its `resource()` check, and filters missing name/company/image; its page parser also requires a title. Thus the PHP fixes make those records available in JSON, but displaying these newly supported missing-field cases needs a separate frontend exception. These restrictions were confirmed by reading the current parsers, not dismissed as unknown live behavior. Existing valid-content snapshot responses remain compatible. The optional patch addresses menu mapping only.

## Limits and deployment

Local snapshot counts are not promises about current live counts. Authenticated live POST calls were not verified: this execution environment receives HTTP 403 / error code 1010. Live credentials, server PHP configuration, upload-file existence beyond the verified photo, current indexes/statistics and end-to-end UI rendering remain unverified; known parser restrictions are listed above. No live deployment or guaranteed speed claim is made.

Deploy the seven PHP files together using `README.md`, retain the existing PDO connection, then run server-side lint and authenticated POST checks against current live data. If a rollback is needed, restore the PHP files together; no database rollback is required. Index candidates are a separate review, not a dependency for this update.
