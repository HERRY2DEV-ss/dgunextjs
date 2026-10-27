# DGU Change Impact Matrix

Use this matrix before editing. The project has several high-fan-out modules; a local visual change can affect every route through shared classes or shells.

| Change request | Primary files to inspect/edit | Files to avoid changing unless required | Regression checks |
|---|---|---|---|
| Change one school's API content mapping | `components/academic-page-api.ts`, `AcademicApiPage.tsx`, `academic-route-identities.ts`, relevant school CSS | `program-info-api.ts`, global transport, route slugs, shared layout unless evidence requires it | `npm run test:academic`, `node scripts/school-news-api-regression.cjs`, `npm run test:recovery`, targeted live check. |
| Change one program page | `app/programs/[programSlug]/page.tsx` only for route validation; `academic-page-api.ts`, `AcademicApiPage.tsx`, program-specific layout/style | `app/schools/[schoolSlug]`, `programs-api.ts` catalogue, public slug contract | `npm run test:academic`, `node scripts/program-detail-pause-regression.cjs`, `node scripts/content-api-regression.cjs`. |
| Change program catalogue cards | `components/programs-api.ts`, `SchoolsProgramsSection.tsx`, `SchoolProgramsSection.tsx`, `ProgramCard.tsx` | `academic-page-api.ts` detail mapping and route identities | `node scripts/api-contracts.cjs`, `node scripts/menu-news-faculty-regression.cjs`, `npm run test:recovery`. |
| Change shared API URL/auth/JSON handling | `components/dgu-api-transport.ts`, `next.config.ts`, affected adapter | All presentation components; never change credentials/contracts casually | `node scripts/api-recovery-regression.cjs`, `node scripts/api-contracts.cjs`, `node scripts/content-api-regression.cjs`, live verifier. |
| Change navigation menu parsing | `navigation-api.ts`, `Navigation.tsx`, `HeaderDropdown.tsx`, `navigation-utilities.ts` | `site-routes.ts` unless links are demonstrably wrong | `node scripts/menu-news-faculty-regression.cjs`, `node scripts/api-contracts.cjs`, keyboard/manual menu test. |
| Change homepage placements | `app/page.tsx`, `usePlacements.ts`, `placements-api.ts`, placement cards/styles | `SchoolPlacementsSection.tsx` unless shared behavior is intended | `npm run test:placements`, `node scripts/api-only-render-regression.cjs`, live placement request, browser visual check. |
| Change school/program placement section | `SchoolPlacementsSection.tsx`, `PlacementsFeedback.tsx`, `placements-api.ts`, `academic-api.css`, school/program/admissions CSS | Homepage placement videos and admissions data unless requirement spans them | `npm run test:placements`, `npm run test:admissions`, `node scripts/api-only-render-regression.cjs`. |
| Change admissions process/fees | `admissions-api.ts`, `AdmissionPage.tsx`, `AdmissionResources.tsx`, admissions CSS | `admissions-data.ts` placement object unless static source is intentionally removed | `npm run test:admissions`, `node scripts/api-recovery-regression.cjs`, manual desktop/mobile. |
| Change news categories/detail | `news-api.ts`, `news-detail-api.ts`, `news-archive-api.ts`, `NewsUpdatesSection.tsx`, `NewsDetailPage.tsx`, route slug files | Homepage adapter unless fallback contract is explicitly involved | `node scripts/menu-news-faculty-regression.cjs`, `node scripts/school-news-api-regression.cjs`, `node scripts/news-clean-routes-regression.cjs`. |
| Change faculty directory/profile | `faculty-api.ts`, `useFaculty.ts`, `FacultyDirectory.tsx`, `FacultyProfilePage.tsx`, `SchoolFaculty.tsx` | Academic route parser unless scope IDs are changing | `node scripts/menu-news-faculty-regression.cjs`, `node scripts/school-news-api-regression.cjs`, manual profile/school scope. |
| Change footer | `footer-api.ts`, `SiteFooter.tsx`, `site-routes.ts` | Navigation API and header styles | `node scripts/api-contracts.cjs`, `npm run test:recovery`, manual link audit. |
| Change tabs/accordions/sliders | `SlidingTabList.tsx`, `StepSlider.tsx`, `BatchSlider.tsx`, relevant parent | Global slider CSS and unrelated pages unless shared regression is intended | `npm run lint`, `npm run test:audit` first stage, keyboard/mobile manual test. |
| Change global typography/spacing | `app/global.css`, `app/page-consistency.css`, font setup in `app/layout.tsx` | Component-local CSS unless a local override is intentional | `npm run lint`, `npx tsc --noEmit`, route screenshots at desktop/tablet/mobile. |
| Change static export/deployment | `next.config.ts`, `scripts/clean-export.cjs`, `scripts/finalize-export.cjs`, deployment rules | API adapters and route components | Never run casually: note `prebuild` removes `out`; run approved build and inspect export. |

## High-risk shared dependencies

### Transport fan-out

`dgu-api-transport.ts` controls every API URL and response acceptance rule. A change to development path, base path, URL validation, status handling or JSON parsing can make navigation, homepage, academic, admissions, news, faculty and footer feeds fail simultaneously.

### Academic renderer fan-out

`AcademicApiPage.tsx`, `academic-page-api.ts`, `academic-layout.ts`, `academic-section-key.ts` and `AcademicContent.tsx` are shared by all schools and programs. A field alias or section classification change can move content into the wrong tab/accordion on many routes.

### Global CSS fan-out

Selectors such as `.placement-overview`, `.placement-copy`, `.placement-media-slider`, `.program-video-highlights`, `.student-card`, `.outcome-panel-content`, `.content-width`, and typography selectors are reused across homepage, academic, admissions and special pages. Prefer scoped selectors and verify mobile layout before changing them.

### Route identity fan-out

`site-routes.ts`, `academic-clean-routes.ts`, `academic-route-identities.ts`, `news-urls.ts`, and `admissions-routes.ts` affect API request slugs, links, static export paths and redirects. Do not add program ID segments to the public slug route without an explicit contract change.

## Safe editing rules

1. Preserve the API contract before changing presentation.
2. Keep API data and presentation-only assets separate.
3. For missing API fields, use the established empty/error behavior; do not silently append unrelated local records.
4. Check `git status` and `git diff` first and preserve existing user changes.
5. Run the smallest relevant regression script, then TypeScript/lint; use live/browser checks separately.
6. Do not print or commit values from `.env.local`.

