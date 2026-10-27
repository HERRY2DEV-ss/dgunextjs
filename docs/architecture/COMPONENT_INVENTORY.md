# DGU Component Inventory

This inventory groups significant components by responsibility. Trivial leaf markup is grouped where its behavior is self-evident; paths and relationships are source references rather than filename-based assumptions.

## Shared application shell

| Component | Responsibility and dependencies | State/interaction | Impact if changed |
|---|---|---|---|
| `app/layout.tsx` | Root App Router layout; imports global CSS and shared font/runtime shell. | Root document metadata and children. | Global: every route, typography, body structure, metadata. |
| `components/Navigation.tsx` | Shared header, desktop dropdowns, dialog mega-menu, search, quick links, sticky-header observation. Calls `requestMenus()` from `navigation-api.ts`; uses `HeaderDropdown`, `navigation-utilities`, `site-routes`. | Menu open/close, nested expansion, search, `IntersectionObserver`, `ResizeObserver`, keyboard focus trap. Loading/error/empty API states are rendered inside the dialog. | Very high: all pages, links, accessibility, header layout. |
| `components/HeaderDropdown.tsx` | Desktop API menu group rendering. Receives `MenuItem` group and route href. | Hover/focus/click behavior delegated to component/CSS. | High: desktop navigation only. |
| `components/SiteFooter.tsx` | Shared footer; calls `requestFooter()` and renders contact, social, quick/other links. | Loading/error/empty state and retry behavior. | Very high: all pages and footer API contract. |
| `components/LocalPageShell.tsx` | Shared client shell/context for local pages; exposes `usePageMenuOpen()` and renders `Navigation`/`SiteFooter` around children. | Menu-open context, page shell class. | High: all local/specialized pages using the shell. |
| `components/PageMotion.tsx`, `SmoothScrolling.tsx`, `refreshLayout.ts` | Shared scroll/reveal/motion setup. | GSAP/Lenis/observers and cleanup. | High: animation, scroll and layout timing across pages. |

## Homepage

| Component | Render path and data | Important behavior |
|---|---|---|
| `app/page.tsx` | Root homepage. Composes `HeroVideo`, `Navigation`, `AboutSection`, `SchoolsProgramsSection`, `HomeDifferentiators`, outcomes tabs, `RecruitersSection`, `NewsUpdatesSection`, `GlobalLearning`, `LifeScroll`, `DehradunReveal`, `ReviewsSection`, `SiteFooter`. | Owns homepage state, API homepage feed via `requestHomepageData()`, placement state via `usePlacements('', false)`, tabs, modal viewer and pause state. API students and static presentation videos are rendered in separate sliders. |
| `components/SchoolsProgramsSection.tsx` | Homepage catalogue; calls `requestPrograms('', false)` and renders school/program cards. | Loading/error/retry; API-only rows. Uses `ProgramCard`. |
| `components/HomeDifferentiators.tsx` / `DifferentiatorSection.tsx` | Homepage differentiator feed via `requestDifferentiators()`. | Loading/error/retry; API point cards and supplied media/presentation styling. |
| `components/NewsUpdatesSection.tsx` | Tabbed campus/placements/admissions news using `requestNews()`. | Tab selection, slider, loading/error/retry, optional school scope. |
| `components/ReviewsSection.tsx` | Review/testimonial feed using `requestReviews()`. | Cached API state, slider and empty/error states. |
| `components/GlobalLearning.tsx`, `LifeScroll.tsx`, `DehradunReveal.tsx`, `AboutSection.tsx`, `HeroVideo.tsx` | Shared homepage visual/content sections. API content may be supplied by parents; media/layout are presentation responsibilities. | Sliders, reveal animations, video pause state and modal callbacks. |
| `components/PlacementStudentCard.tsx`, `PlacementVideoCard.tsx`, `PlacementRelatedVideos.tsx`, `HomepagePlacementCopy.tsx` | Placement cards, videos, related-video dialog and approved homepage presentation copy. | Student details open on click/touch; video viewer and related media. Do not infer a student/video relationship. |

## Academic school/program system

| Component/module | Responsibility |
|---|---|
| `app/schools/[schoolSlug]/page.tsx` | Validates a school slug against `academicSchoolRoutes`, then mounts `AcademicQueryPage kind="school"`. |
| `app/programs/[programSlug]/page.tsx` | Validates a program slug against `academicProgramRoutes`; supplies `academicProgramRecordIds[programSlug]` when defined. The public route remains slug-based. |
| `components/AcademicQueryPage.tsx` | Reads pathname/search params, resolves clean route identity and optional ID, then chooses `SchoolPage` or `ProgramPage`. Suspense is supplied by route files. |
| `components/SchoolPage.tsx` / `ProgramPage.tsx` | Thin identity-specific wrappers that call `AcademicApiPage` with `kind`, slug and optional record ID. |
| `components/AcademicApiPage.tsx` | Main shared academic renderer. Calls `useAcademicInfo`, `useAcademicBrand`, `useSchoolCatalogue`, and `useOtherSpecializations`; renders navigation/footer, hero, intro, API blocks, tabs, accordions, forms, placements, recruiters, faculty, news, media, FAQs and program links. |
| `components/academic-page-api.ts` | Academic request/parse/normalize layer for school-info and program-info. Matches returned records by normalized slug and, for programs, optional ID; maps body HTML into structured tabs, sections, tracks, placements, students, faculty, banners, stats and links. |
| `components/useAcademicInfo.ts`, `useProgramInfo.ts`, `useSchoolCatalogue.ts`, `useAcademicBrand.ts`, `useOtherSpecializations.ts` | Client state/cache hooks around academic and catalogue data. | Loading/error/retry and scope-aware cache behavior. |
| `components/AcademicContent.tsx`, `AcademicAccordionGroup.tsx`, `AcademicFeatureDialog.tsx`, `AcademicFeatureHover.tsx`, `AcademicTestimonials.tsx`, `FaqSection.tsx`, `ProgramCard.tsx`, `ApiRichText.tsx`, `ExpandableText.tsx` | Reusable API-rendering primitives. | Tabs, accordions, hover/dialog UI, safe HTML/media normalization, expand/collapse and responsive grids. |
| `components/SchoolIntroSection.tsx`, `SchoolProgramsSection.tsx`, `SchoolFaculty.tsx`, `SchoolPlacementsSection.tsx`, `RecruitersSection.tsx`, `NewsUpdatesSection.tsx` | School/program block renderers selected by `academic-layout.ts`. | Each receives API-derived data; placement fallbacks are restricted to non-API/presentation paths. |
| `components/academic-route-identities.ts`, `academic-clean-routes.ts`, `academic-section-key.ts`, `academic-layout.ts`, `academic-content-flow.ts` | Route identity, slug normalization, section classification and block ordering. | High impact on all school/program pages and links. |

## Admissions, placement and special pages

| Component | Responsibility and data behavior |
|---|---|
| `components/AdmissionPage.tsx` | `/admissions/` page. Calls `requestAdmissions()`, maps process/fees/resources/media/recruiters, then mounts `SchoolPlacementsSection apiSchoolUrl=""`. Static placement statistics are not injected. |
| `components/AdmissionDetailPage.tsx` / `PlacementReportsPage.tsx` | Admission detail content and placement-report presentation. Dynamic content comes from admissions/local page data; placement tables are parsed by `placementReportTables`. |
| `components/admissions-api.ts` | Parses admission page, process/fee HTML, resources, API media, API placement data and recruiters. Uses cached POST request. |
| `components/AdmissionsVideo.tsx` | Reusable campus/program/admissions video. Stats are props; default is empty. Handles autoplay, visibility, reduced motion, play failure and media error. |
| `components/SchoolPlacementsSection.tsx` | Shared placement section for academic, admissions and detail contexts. Calls `usePlacements`, renders API students, API copy/stats, presentation-only homepage copy, empty/loading/error feedback and existing sliders. |
| `components/usePlacements.ts`, `placements-api.ts`, `PlacementsFeedback.tsx` | Placement state/request/parser/feedback. `PlacementsState.status` is `idle | loading | success | error`; `requestPlacements` sends `SCHOOL_URL` or `PROGRAM_URL`. |
| `components/ClubsCommitteesPage.tsx`, `ClubApiPage.tsx`, `ClubDetailPage.tsx`, `IndividualClubPage.tsx` | Club list/detail rendering using `club-detail-api.ts`, shared club media/type modules and CSS module. |
| `components/HostelLifePage.tsx`, `GlancePage.tsx`, `InternationalPage.tsx` | API-driven special pages with dedicated parser/data module, local state, sliders, tabs, accordions, modal/video UI and page CSS modules. |
| `components/FacultyDirectory.tsx`, `FacultyProfilePage.tsx`, `FacultyCard.tsx` | Faculty listing/profile paths; `useFaculty` and `faculty-api.ts` supply all, school-scoped or profile-scoped data. |
| `components/NewsDetailPage.tsx`, `NavigationNewsList.tsx` | News listing/detail and navigation news views; use `news-api.ts`, `news-detail-api.ts`, archive helpers and route slug utilities. |

## Shared interactive primitives

- `StepSlider.tsx` / `BatchSlider.tsx`: responsive batch/slider controls, dots, loop, vertical/horizontal mobile modes, pause and optional drag.
- `SlidingTabList.tsx`: tab indicator wrapper; parents own active state and panel rendering.
- `AutoSlider.tsx`, `SmoothFrameCarousel.tsx`, `CampusPhotoCarousel.tsx`, `LocalGallery.tsx`: specialized image/media rails.
- `ExpandableText.tsx`, `ApiRichText.tsx`: collapsed copy and sanitized/normalized remote HTML rendering.
- `QuickContactForm.tsx`: school/program-aware form; course options may use `requestPrograms`.
- `InlineVideo.tsx`, `AdmissionsVideo.tsx`, `HeroVideo.tsx`: media playback with pause/error behavior.

## Styling ownership

Global selectors in `app/global.css` affect shared classes such as `.placement-overview`, `.placement-copy`, `.placement-media-slider`, `.outcome-panel-content`, `.program-video-highlights`, `.student-card`, and common typography. Route selectors in `app/schools/school.css`, `app/programs/program.css`, `app/admissions/admissions/admissions.css`, and `app/page-consistency.css` can override shared layout. Component CSS/modules include `academic-api.css`, `placements-api.css`, `header-dropdown.css`, news, club, hostel, glance and international styles.

