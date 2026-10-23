# DGU – Original API integration update

Apply this small patch to your current Next.js project. The existing theme, section sequence, shared Program/School templates, tabs, animations and placement/faculty filters are preserved. No CSS, public assets, dependencies, database records, schema or credentials were changed.

1. Extract this ZIP into the existing project root, where `package.json` is located; merge the `app`, `components` and `scripts` folders.
2. Run `node scripts/configure-original-apis.cjs`. This sets the restored live `https://dgu.ac.in/api` endpoints and your supplied Apikey; it backs up `.env.local` and preserves unrelated settings. No localhost database is configured.
3. For local work, restart with `npm run dev`. For production, run `npm run build` and deploy the generated `out` contents to your existing `/nextjs/homev1` location on dgu.ac.in. Keep the existing export/academic URL rewrite setup.

If dependencies are missing (`next` is not recognized), run `npm ci` first. The exported production site uses the live APIs directly; local development uses the existing same-origin Next rewrites.

## Live API results – 14 October 2026

| API | Observed result |
| --- | --- |
| get-menus.php, POST + Apikey | 9 menu groups; existing menu adapter already matches the restored fields. Original PHP unchanged. |
| get-programs.php, POST + Apikey | 8 schools; `programs` replaces the older `childMenu`. School-specific requests return top-level level groups. |
| Catalogue mapping | Exact accumulated prefixes removed; school/order/level membership retained. Homepage counts: 6, 6, 3, 3, 3, 4, 5, 25. Business catalogue: 28 programmes across 4 levels. Shared programme ID 32 retained in both related schools. |
| get-school-info.php | All 8 school slugs returned their matching records. |
| get-program-info.php | MBA, HR, BA LLB, International Business, and Global MBA with the existing slug/ID requests returned matching records. |
| get-faculty.php | Law: 9 records; Business: 20; Mohit Aggarwal profile: 1. Existing school requests and faculty-ID whitelist unchanged. |
| get-reviews.php | 12 raw records, 5 distinct reviews under the existing deduplication rule. `imageURL` now maps to their actual photos. |
| get-recruiters.php | 25 recruiter records; existing mapping works. |
| get-footer.php | Flat contact/social fields and `quickLinks`/`otherLinks` now fill the same footer: 12 quick links, 21 resource links, 1 contact block, 4 social links. |
| next-homepage-data.php | GET, without Apikey, as required by its supplied PHP. Success-story arrays and actual category news returned. |
| get-news.php | Still returns the website’s 404 HTML with HTTP 200. The supplied API ZIP also lacks this file. Original News API restoration remains required for full archives, local article detail and SCHOOL_ID requests. |

The common news section tries the original POST News API first. Only an actual missing endpoint (404 or the verified 200/404 HTML response) uses news from the supplied, working homepage API. This is real API content, with no copied/dummy content. Its current buckets contain 25 campus items, 25 placement items and 2 admission items; these are server-returned counts, not frontend limits. Those summaries use the exact article links supplied by the API for Read More. Scoped news requests, authentication errors, database/server errors and malformed JSON never switch to unfiltered news. Once the original News API is restored, it is preferred automatically on the next uncached request.

## Restore the latest existing backend files

The restored server folder has lost some previously delivered files/changes. The ZIP includes the following **unchanged latest project copies**, not rewritten developer APIs:

- Copy `server-api/api/dgu-academic-common.php` to `public_html/api/dgu-academic-common.php`, retaining a backup of the present file. The restored copy is missing the existing `publishedPage` support; this latest copy restores full content from the exact matching published CMS page, including Global MBA. It keeps your existing `../includes/classes.php` connection.
- Copy `server-api/api/get-hostel-life.php` and `server-api/api/get-international.php` to the same `public_html/api/` folder if using those previously created pages. Both live URLs currently return 404 HTML. Their frontend designs/assets are untouched.
- Restore the original developer `get-news.php` separately. It was absent from the supplied backup; this patch does not invent a replacement news schema or school relationship.

Keep the restored developer `get-menus.php`, `get-programs.php`, `get-faculty.php`, `get-reviews.php`, `get-recruiters.php`, `get-footer.php`, and `next-homepage-data.php`. Do not upload older replacement versions over them. No SQL import, database update or credential change is needed. Backend restore files were syntax checked; executing them on your server after upload remains unverified because server deployment/database access was not provided.

## Files and checks

- `programs-api.ts`: restored/previous catalogue shapes, exact-prefix handling, scoped level wrapping and verified school-ID route identities. Names/content still come from the API; missing unknown routes remain non-clickable.
- `news-api.ts`, `homepage-api.ts`: original news preference, genuine homepage news mapping, shared GET, and strict error/scope separation. No new persistent cache.
- `app/page.tsx`: same homepage JSX, using the shared homepage request with a 20-second timeout.
- `NewsUpdatesSection.tsx`: same layout, typography, controls and animations; homepage-summary Read More uses its real article URL.
- `reviews-api.ts`, `footer-api.ts`: restored response-field mapping only.
- `configure-original-apis.cjs`: reversible live API configuration; `restored-api-regression.cjs`: new/old contract checks; `verify-dgu-apis.cjs`: school-scope parsing and browser-style audit request headers.

Passed: TypeScript/production build (618 exported pages), existing audit/academic/placement/recovery regressions, restored-contract tests, and mapping comparisons against captured live responses. All 13 supplied PHP files and 3 backend restore copies passed PHP syntax checks. Sixty sampled API image URLs returned actual image files.

Browser checks passed for Homepage, Business School, Law, Advanced Computing, MBA, HR, Global MBA and International Business at 1440, 768 and 390 pixels (24 cases). They used the captured live API responses and sampled real media; they verify rendering/mapping, not a deployed-server end-to-end test. Checks included clean routes, desktop/mobile banner variants, all school programmes after existing Show all controls, scoped student photos, active-tab scrolling, real news links, all footer links, zero horizontal page overflow and no browser runtime errors. Source hashes confirm zero CSS/public changes; homepage/news JSX structure matches the prior versions.

Run `node scripts/restored-api-regression.cjs`, `npm run test:audit`, `npm run test:academic`, `npm run test:placements` and `npm run test:recovery` to repeat local checks. `npm run test:live-api` reports the actual server state; its News check will currently fail until the missing original file is restored.
