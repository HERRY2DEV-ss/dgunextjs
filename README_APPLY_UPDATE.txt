DGU SCHOOL VIDEO + STATISTICS UPDATE — 21 October 2026

Replace these 4 files together in the existing Next.js project:
components/AcademicApiPage.tsx
components/SchoolIntroSection.tsx
components/ExpandableText.tsx
components/AdvancedComputingIntro.tsx

Apply this package last. It includes the earlier intro text-clipping correction
and the updated placement of the school statistics.

Run npm run build, then deploy the rebuilt frontend with your existing process.
For the static site, deploy the generated out/ contents to the existing
/ location. No PHP changes are required for this placement update.

RESULT
The school page sequence is now:
Placement content / students -> existing video with school statistics ->
Top Recruiters -> the remaining existing school sections.

The counters are removed from the school introduction and its Read more area.
Advanced Computing also uses the video location for its counters; its intro,
partner-logo block and content sequence remain in place.

DESIGN AND DATA
This reuses AdmissionsVideo and its existing video/statistics CSS, including the
desktop overlay, mobile grid, play control and menu-paused behavior. No new
design, font or stylesheet is introduced.

Counters come from the current school's parsed API facts. If those facts are
absent, an explicit videoStats response may supply them. No sample numeric
counters are used. A missing statistics response does not borrow values from
another school or from AdmissionsVideo's default admission statistics.

The API's videoSrc/videoURL and videoPoster are respected when supplied.
Otherwise, the existing project campus film (/assets/mba.mp4 under the site
base) and existing hero-campus.webp poster are used with the shared component.
These media assets already exist in the supplied project; no new media files
are needed. Deploy the existing assets along with the rebuilt frontend.

Programme pages retain their existing facts, video data and section placement.
School API calls, placement galleries, recruiter feeds, branding, tabs, News
routes and other section mappings are preserved. The intro still ends its
collapsed preview at a complete rendered line, without the old white fade.

VALIDATION
80 browser checks passed on the actual Business, Advanced Computing, Law and
MBA page components with isolated API responses at desktop/mobile widths.
Checks cover exact API counter values, video immediately before recruiters,
no duplicate intro counters, responsive overlay bounds, changed API values,
missing statistics, explicit video/poster URLs and existing programme behavior.
The existing academic API, branding/media and school/news regression checks
also passed. TypeScript passed; lint has no errors (existing image warnings).
The full production build and static export of 671 pages passed.
Test fixtures, screenshots and browser tooling are not included in this ZIP.

This package has not been deployed to your live server from this workspace.
