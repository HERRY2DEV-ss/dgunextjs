# Program and School Content Mapping Audit

Audit date: 2026-10-23

Scope: source mapping and available fixture evidence. Live API responses and browser rendering were not re-run during this documentation audit.

## Common request-to-render path

`app/schools/[schoolSlug]/page.tsx` and `app/programs/[programSlug]/page.tsx` resolve aliases from `academic-route-identities.ts`, then render `AcademicQueryPage` (`components/AcademicQueryPage.tsx:7-35`). `AcademicQueryPage` normalizes clean paths and optional program record IDs before selecting `SchoolPage` or `ProgramPage` (`components/SchoolPage.tsx`, `components/ProgramPage.tsx`). Both call `AcademicApiPage`.

`AcademicApiPage.tsx:197-236` owns API state, brand/catalogue hooks, the common header/footer, and the block renderer. `useAcademicInfo` calls the academic adapter. `academic-page-api.ts:82-360` normalizes API fields into `AcademicInfo`, including intro, banners, programs, pathways, tabs, accordions, features, placements, faculty, recruiters, FAQs, media, and links. `academicLayout.ts:18-115` consumes those normalized sections once and orders blocks using `academicFlow`.

## Verified reference sequences

The sequences below are implementation guides, not proof that the current live payload contains every block.

### Doon Business School (`school-of-business`)

Source: `components/academic-content-flow.ts:4-18`.

1. Navigation and banner are handled by `AcademicApiPage` before `academicLayout` blocks.
2. Intro and logos/form are rendered by `SchoolIntroSection` (`AcademicApiPage.tsx:228-236`).
3. `OUR PROGRAMS` is the `programs` block and uses `useSchoolCatalogue` plus `ProgramLinks` (`AcademicApiPage.tsx:170-173`).
4. “What makes Doon Business School Different?” is a feature/section block and can use the wave renderer when its normalized key is `difference/features/pillars/global-difference`.
5. “PLACEMENTS + Top Recruiters 2025-26” maps to the `placements` block (`AcademicApiPage.tsx:185-190`), then school placement, recruiters, and school video highlights.
6. Faculty maps to `SchoolFaculty`; news maps to `NewsUpdatesSection`; international maps to `GlobalLearning`; FAQs map to `FaqSection`.
7. Footer is shared `SiteFooter` in `AcademicApiPage.tsx:241-243`.

### MBA (`mba`, record ID `10`)

Source: `components/academic-content-flow.ts:502-518` and `academicProgramRecordIds` in `components/academic-route-identities.ts:121-151`.

1. Navigation/banner, intro, logos/stats/form.
2. Program specialization.
3. Program Options at a Glance and MBA Global Pathway tabs.
4. Video + stats.
5. Placements + recruiters.
6. Advantage, Eligibility, and Fee Structure tabs.
7. Industry Collaboration accordion.
8. International, News, FAQs, Footer.

The block renderer confirms the special placement of program specifications before admission tabs (`academic-layout.ts:57-66`) and MBA accordion title handling (`AcademicApiPage.tsx:162`). Video uses `AdmissionsVideo` only when the API supplies a video (`AcademicApiPage.tsx:179`).

## Field-to-renderer map

| API/normalized field | Current destination | Source evidence | Status/risk |
|---|---|---|---|
| `name`, `programName`, `schoolName`, `title` | Page title, hero label, metadata | `academic-page-api.ts:82-100`, `AcademicApiPage.tsx:216-228` | Verified by parser/renderer; live values not rechecked. |
| `introText`, `description`, `content`, published HTML | `SchoolIntroSection` intro and form-adjacent content | `academic-page-api.ts:126-145`, `AcademicApiPage.tsx:228-236` | Confirmed source mapping. |
| `banners`, `sliders`, hero/banner aliases | `StepSlider` hero | `academic-page-api.ts:317-337`, `AcademicApiPage.tsx:218-227` | Confirmed parser path; image availability unverified live. |
| `programs`, school catalogue | School `OUR PROGRAMS`; program related links | `AcademicApiPage.tsx:170-173`, `SchoolProgramsSection`/`programs-api.ts` | Fixture and academic tests cover route/catalogue contracts. |
| `tabs`, `programTabs`, eligibility/fees/scholarship/structure | `AcademicContent` tabs and `TabBody` accordions/rich content | `academic-page-api.ts:145-191`, `AcademicApiPage.tsx:158-160` | Confirmed mapping; section order depends on guide matching. |
| `accordion`, `accordions`, track HTML | `AcademicAccordionGroup`, track tabs | `AcademicApiPage.tsx:156-164`, `academic-tracks.ts` | Confirmed source mapping. Nested CMS tab behavior is fixture-covered, live placement unverified. |
| top-level feature list HTML | `DifferentiatorSection` wave | `academicFeatures.ts`, `AcademicApiPage.tsx:122-143` | Confirmed first-six path; overflow bug documented in `WAVE_COMPONENT_AUDIT.md`. |
| `placements`, placement counters, `students` | `SchoolPlacementsSection`, `PlacementStudentCard`, recruiters and optional video | `academic-page-api.ts:250-316`, `AcademicApiPage.tsx:185-190` | API-only placement filtering is covered by placement tests. No static API fallback is used in the current modified placement branch. |
| `faculty`, `facultyIds` | `SchoolFaculty` | `academic-page-api.ts:317-344`, `AcademicApiPage.tsx:175` | Source mapping confirmed; scope/live payload freshness unverified. |
| `recruiters` | `RecruitersSection` | `academic-page-api.ts:302-316`, `AcademicApiPage.tsx:189` | Confirmed parser/render path. |
| international HTML/photos/partners | `GlobalLearning` | `AcademicApiPage.tsx:180-184` and `academic-media.ts` | Confirmed path; live content not rechecked. |
| news | `NewsUpdatesSection` | `AcademicApiPage.tsx:174` and `news-api.ts` | Scope and API contract covered by existing scripts; live page not re-rendered. |
| `faqs` | `FaqSection` | `academic-page-api.ts:335-344`, `AcademicApiPage.tsx:177` | Confirmed mapping. |

## Discrepancy matrix

| Page/page family | Actual implementation | Verified intended destination | Evidence | Severity | Proposed correction |
|---|---|---|---|---|---|
| Homepage | Separate homepage differentiator API, not academic renderer | Existing homepage wave/order must remain unchanged | `HomeDifferentiators.tsx:34-42`, `DifferentiatorSection.tsx:68` | Low | No change in this audit. Add a homepage fixture only if overflow behavior is explicitly required later. |
| `school-of-business` / Doon Business School | Shared `AcademicApiPage` with guide sequence above | Same guide sequence; API sections matched by normalized keys | `academic-content-flow.ts:4-18`, `academic-layout.ts:18-33` | Medium | Verify a captured live payload against the guide before changing mappings. |
| `mba` / MBA | Shared renderer with MBA-specific flow, specification relocation, and industry title | MBA source guide sequence above | `academic-content-flow.ts:502-518`, `academic-layout.ts:57-66`, `AcademicApiPage.tsx:162` | Medium | Keep page-specific rules in `academicFlow`/`academicLayout`; do not move sections from similar names alone. |
| All school feature sections | Full API feature list parsed, but wave receives only first six and school variant may show four based on count | First six in wave; remaining in existing list/accordion | `AcademicApiPage.tsx:136,143` | High | Fix premature truncation and add a >6 fixture regression. |
| All program feature sections | Same shared feature path | Same first-six/overflow rule | `AcademicApiPage.tsx:122-143` | High | Same narrow shared renderer correction; verify MBA and representative program. |
| All program/school placements | Shared `SchoolPlacementsSection`; placement data is scoped and API-driven | API records in placement UI; no unrelated static records | `AcademicApiPage.tsx:185-190`, `SchoolPlacementsSection.tsx:56-96` | Low/Medium | Keep current API-only behavior; run placement scope tests after any mapping change. |
| Unknown/unmatched CMS headings | `academicLayout` inserts unmatched sections before common ending blocks | Intended placement cannot be proven from code alone | `academic-layout.ts:34-52` | Medium, unverified | Capture live payload and manually approve section placement before changing guide rules. |

## Can mapping be automated?

Safe automation: normalized aliases, exact route IDs, parser field aliases, duplicate suppression, and the explicit six-plus-overflow split can be regression-tested with fixtures. Unsafe automation: moving arbitrary unmatched CMS headings based on similar words, changing MBA/DBS order from a single live response, or assuming every `placements`/`features` field has the same schema.

## Evidence limitations

The current run did not access live DGU APIs or a browser. Existing fixtures and scripts verify parser contracts and representative payloads, not every route's current production HTML. A live audit should capture MBA, Doon Business School, every school slug, and representative program families before approving page-specific corrections.

