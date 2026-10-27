# DGU Testing and Verification Guide

## Standard commands

Run from `C:\Users\USER\Desktop\mba\mba_gt`:

```powershell
npx tsc --noEmit
npm run lint
git diff --check
```

Do not assume an npm script exists; use the scripts listed in `package.json`.

## Regression scripts

| Command | Coverage |
|---|---|
| `npm run test:placements` | Placement scope matching, active/deleted filtering, incomplete records, and no invented placement prose. |
| `npm run test:admissions` | Admissions POST/key/body contract, API-only missing sections, media/statistics behavior, invalid responses, retry and shared cache. |
| `npm run test:recovery` | Original/local/development endpoint transport, real Response JSON/404/401 handling and common school/program routes. |
| `npm run test:academic` | Academic parser/request/cache/matching behavior. Current baseline includes stale expectations for an old program ID URL in the checked-in script; do not change public route behavior to satisfy it. |
| `node scripts/api-contracts.cjs` | Mock request contracts for menus, programs, program details, news/footer/faculty/reviews, development rewrites and production export assumptions. |
| `node scripts/content-api-regression.cjs` | Shared content transport, headers/body, base path, per-program matching, response validation, cache, retry, invalid JSON and timeout behavior. |
| `node scripts/api-only-render-regression.cjs` | API-only rendering and exclusion of manual copy/fees/FAQs/partners/inferred levels in partial/loading program states. |
| `node scripts/menu-news-faculty-regression.cjs` | Menu nesting/deduplication, news fixture coverage, faculty directory/profile/scope and production/development transports. |
| `node scripts/school-news-api-regression.cjs` | School API/news relationships, article fields/photos, faculty relationships, missing banners and cache isolation. |
| `node scripts/club-api-regression.cjs` | Club listing/detail contracts and route handling. |
| `node scripts/differentiators-api-regression.cjs` | Differentiator parser and request contract. |
| `node scripts/program-detail-pause-regression.cjs` | Program-detail policy, program `PROGRAM_URL` and school transport behavior. |
| `node scripts/news-clean-routes-regression.cjs` | News clean URL/slug normalization. |
| `npm run test:audit` | Chained broad audit. It currently stops at the known BA LLB href expectation mismatch before all chained scripts run. |
| `npm run test:live-api` | Existing read-only live verifier. Reports statuses/field names/counts and intentionally does not print credentials or content records. |

## Verification levels

### Source verification

Use imports, props, hooks and call sites to establish behavior. Examples:

- `AcademicQueryPage.tsx` chooses school/program renderers.
- `academic-page-api.ts` maps exact API fields and scopes.
- `SchoolPlacementsSection.tsx` distinguishes API and non-API branches.
- `next.config.ts` maps development proxy routes.

Source verification does not prove that the current remote server returns the expected data.

### Fixture/contract verification

Regression scripts transpile/load adapters with mocked fetch responses and fixture data. They prove parser aliases, request methods, bodies, headers, cache/retry behavior and fallback exclusion. They do not prove visual placement, current upstream content, or browser CORS.

### Live API verification

Use `node scripts/verify-dgu-apis.cjs` or an approved equivalent. Never print `.env.local` values, full response bodies, student records or tokens. Report only endpoint, status, root fields and safe counts. A live HTTP 200 proves the endpoint responded; it does not prove every page rendered the correct card, tab or order.

### Browser verification

When browser automation is available:

1. Check whether `npm run dev` is already running before starting another server.
2. Open the base-path URL `/` and representative routes.
3. Inspect Network requests for `/api/dgu-*`, status, method, payload and response shape.
4. Check console errors and warnings, especially parser/retry messages.
5. Test header open/close/search, dropdowns, tabs, accordions, sliders, modal/video controls, forms and internal links.
6. Test desktop, tablet and mobile widths, including horizontal overflow and focus/keyboard behavior.
7. Record routes as Pass, Fail, Blocked or Not tested. Do not claim visual verification from source/tests alone.

## Static export caution

`npm run build` invokes `scripts/clean-export.cjs` before Next build. That script removes `out`; `scripts/finalize-export.cjs` then modifies generated `.htaccess` and validates exported news output. Do not run the build during a read-only audit without explicitly reporting/approving this side effect. `output: 'export'` is disabled only in development by `next.config.ts`.

## Current known limitations and risks

- Existing user changes are present in the working tree; inspect `git status` before any future edit.
- `backend-api/get-program-info.php` has a status entry but its content hash matches `HEAD`; do not restore it unnecessarily.
- Local development can show API 500/unavailable states when the execution environment blocks outbound HTTPS to `dgu.ac.in`; direct live checks may still succeed from another network context.
- Browser automation was not available during this documentation task, so no visual or console claim is made here.
- `npm run test:audit` and `npm run test:academic` contain the known old ID-segment href expectation (`/programs/ba-llb/2/`) while the intended public route is slug-only (`/programs/ba-llb/`). Treat this as a test-maintenance issue, not permission to alter the route.
- Some lint warnings (notably existing image/effect warnings) may remain even when lint exits successfully; distinguish warnings from errors.

## Recommended verification order after a change

1. `git diff --check` and inspect the exact diff.
2. `npx tsc --noEmit`.
3. Run the feature-specific regression script.
4. Run `node scripts/api-only-render-regression.cjs` for API/fallback changes.
5. Run `npm run lint`.
6. Run a safe live API check if the change affects request/response behavior.
7. Use browser route/network/console/responsive checks.
8. Run an approved production build separately, with the `out` deletion/regeneration side effect documented.

