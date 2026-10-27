# DGU Route and Page Map

## Route inventory

The following routes are present under `app/` and are source-confirmed from page files. All public URLs use the configured base path `` when served locally/exported.

| Public route | Source | Renderer and data path |
|---|---|---|
| `/` | `app/page.tsx` | Full homepage composition; homepage, menu, catalogue, differentiator, news, reviews, footer, recruiters and placements feeds. |
| `/[contentSlug]/` | `app/[contentSlug]/page.tsx` | `dynamicParams=false`; resolves `local-pages.ts`, admission detail slugs, and local content. Uses `AdmissionDetailPage` for registered admission-detail slugs, otherwise `LocalContentPage`. |
| `/admission-process/` | `app/admission-process/page.tsx` | Compatibility/legacy admission route. |
| `/admissions/` | `app/admissions/page.tsx` | `AdmissionPage`; admissions API, process, fees, resources, media, placements and recruiters. |
| `/dgu-at-glance/` | `app/dgu-at-glance/page.tsx` | `LocalPageShell` + `GlancePage`; glance API and page CSS module. |
| `/document/` | `app/document/page.tsx` | Shared shell + `DocumentDetail`; document viewer. |
| `/faculties/` | `app/faculties/page.tsx` | Shared shell + `FacultyDirectory`; faculty API. |
| `/faculties/profile/` | `app/faculties/profile/page.tsx` | `FacultyProfilePage`; profile scope comes from route/query implementation and faculty API. |
| `/hostel-life/` | `app/hostel-life/page.tsx` | Shared shell + `HostelLifePage`; hostel API and module CSS. |
| `/image/` | `app/image/page.tsx` | Shared shell + `ImageDetail`; local image/document viewer. |
| `/life-at-dgu/` | `app/life-at-dgu/page.tsx` | `CampusOverview`; campus scene data, sliders and campus CSS. |
| `/news/` | `app/news/page.tsx` | `NewsDetailPage` list/archive mode; news API and route CSS. |
| `/news/[articleSlug]/` | `app/news/[articleSlug]/page.tsx` | Validates against `newsRouteSlugs`, then `NewsDetailPage` detail mode with news detail API. |
| `/office-of-international-affairs/` | `app/office-of-international-affairs/page.tsx` | Shared shell + `InternationalPage`; international API, tabs, map, gallery and module CSS. |
| `/page-detail/` | `app/page-detail/page.tsx` | Shared shell + `PendingPageDetail`; compatibility/internal detail viewer. |
| `/program-detail/` | `app/program-detail/page.tsx` | Suspense + `AcademicQueryPage kind="program"`; query-driven compatibility program route. |
| `/programs/[programSlug]/` | `app/programs/[programSlug]/page.tsx` | Validates `academicProgramRoutes`; slug-based public program route, optional internal record ID supplied to API matching. |
| `/school-detail/` | `app/school-detail/page.tsx` | Suspense + `AcademicQueryPage kind="school"`; query-driven compatibility school route. |
| `/schools/[schoolSlug]/` | `app/schools/[schoolSlug]/page.tsx` | Validates `academicSchoolRoutes`; shared school renderer. |

Routes such as `/placement-reports/`, admission resource detail pages, and other CMS/local paths are represented through the catch-all `contentSlug` route and registries in `components/local-pages.ts`, `admissions-routes.ts`, `news-routes.ts`, and `local-navigation-routes.ts`.

## Academic route resolution

1. `app/schools/[schoolSlug]/page.tsx` and `app/programs/[programSlug]/page.tsx` validate the incoming slug using `academic-route-identities.ts` and `academicSlug`.
2. The route passes a normalized default URL to `AcademicQueryPage`.
3. `AcademicQueryPage.tsx:10-32` combines pathname/search params, resolves clean route identity and optional record ID, then renders `SchoolPage` or `ProgramPage`.
4. `SchoolPage.tsx` and `ProgramPage.tsx` are thin wrappers around `AcademicApiPage`.
5. `AcademicApiPage` calls `useAcademicInfo`, which calls `requestAcademicInfo` with `SCHOOL_URL` or `PROGRAM_URL`.
6. `parseAcademicInfo` matches the API record to the requested slug and, when present, validates the requested program ID. It does not change the public slug route.

The intended public program URL remains `/programs/ba-llb/`; the old ID-segment expectation in some regression scripts is stale relative to the current route contract and must not be used to change the route.

## Shared versus specialized page behavior

### Shared academic pages

School and program pages share the academic renderer and block system. The `kind` value controls the endpoint, fields and some layout decisions. Common blocks include:

- API hero/banner and intro.
- Features/differentiators.
- Tracks, tabs and accordions.
- Program/specialization cards.
- Global learning and galleries.
- Placement students/stats/copy.
- Recruiters, faculty, news and FAQs.
- Registration/prospectus/contact actions.

The `academic-layout.ts` block classifier and `academic-section-key.ts` determine which API section is placed in which UI block. `academic-api.css`, school/program CSS and global styles provide the shared visual structure.

### Homepage versus academic placements

Homepage placements are owned by `app/page.tsx`: API students use `usePlacements('', false)` and `PlacementStudentCard`; the page's intentional static placement video assets are rendered in a separate slider; `HomepagePlacementCopy` is presentation copy. School/program/admission placements use `SchoolPlacementsSection`, whose API branch uses the scoped placement response and does not use static student/statistics fallbacks.

### Local/CMS pages

`local-pages.ts` and `local-pages-data.json` provide registered local page records. `LocalContentPage`, `InternalContent`, `LocalGallery`, `DocumentDetail`, `PlacementReportsPage`, and admission detail render those records. This path is separate from the academic API renderer even when links point to the same site sections.

## Navigation-derived routes

`navigation-api.ts:106-120` maps API menu labels and URLs through `menuHref`; special labels map to admissions, life-at-DGU, placements and schools/programs anchors. `site-routes.ts` and `admissions-routes.ts` normalize base paths and internal links. Changing route normalization affects every menu, card and API-generated link.

## Route-level loading/error behavior

- Route files use `Suspense` for query-driven academic pages.
- Client API pages keep explicit loading/error/retry state, generally rendering a status message instead of fake content.
- `notFound()` is used for invalid static route identities and unknown news/program/school slugs.
- Static export requires dynamic route identities/params to be compatible with the project’s route registries and `output: 'export'` architecture.

