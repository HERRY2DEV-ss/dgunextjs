# DGU Regression Audit

Audit date: 2026-10-23

This is a read-only audit of the current checkout. Application source, CSS, API files, tests, configuration, routes, and existing documentation were not modified.

## Git baseline

Initial status before this audit:

```text
M AGENTS.md
M app/global.css
M app/page.tsx
M backend-api/get-program-info.php
M components/AdmissionPage.tsx
M components/AdmissionsVideo.tsx
M components/PlacementsFeedback.tsx
M components/SchoolPlacementsSection.tsx
?? docs/
```

`backend-api/get-program-info.php` is a tracked status artifact already present in the user worktree; this audit did not restore or modify it. Existing `docs/architecture/` files and `AGENTS.md` changes are preserved.

## Current modified-file review

| File | Observed change | Assessment |
|---|---|---|
| `app/page.tsx` | `usePlacements('', false)` supplies the adapter's required homepage scope; homepage video and API student sliders are separate; a scoped homepage media grid was added. | Intentional placement/API and layout changes. Program routes/adapters are not touched. The exact visual result remains unverified without a browser. |
| `app/global.css` | Three selectors scoped to homepage placement media: `.homepage-placement-media`, `.homepage-placement-column`, and its one-card pair rule. | Low shared-CSS risk because selectors are unique and no generic placement selector was changed in this diff. |
| `components/SchoolPlacementsSection.tsx` | API branch no longer copies static taglines/stats/students/descriptions when API data is missing; feedback renders for all API empty states; `mediaOnly` requires students. | Consistent with API-only project rule. Must retain placement scope tests. |
| `components/PlacementsFeedback.tsx` | Uses valid `PlacementsState` variants (`idle`, `loading`, `success`, `error`) and no unsupported retry property. | Type-contract correction. Existing component no longer renders a retry button; whether that is desired UX needs product confirmation. |
| `components/AdmissionPage.tsx` | Removes `admissionsPlacement` static stats from `AdmissionsVideo`; passes `stats={[]}`. | Prevents unverified placement claims. Admissions regression passed. |
| `components/AdmissionsVideo.tsx` | Default stats changed to empty and admissions data import removed. | Consistent with API-only admissions placement rule; program caller still supplies API video stats where applicable. |
| `AGENTS.md` | Adds project instructions, architecture notes, and known verification baseline. | User documentation change; preserved. |

## Confirmed regressions or risks

### High — academic feature overflow is dropped

`AcademicApiPage.tsx:136` passes `points.slice(0,6)` into `DifferentiatorSection`, while `AcademicApiPage.tsx:143` checks `points.length > 6` and slices `points.slice(6)` from the already-truncated value. For any API feature list with seven or more points, the existing normal accordion/list destination is never populated. This is confirmed statically and affects both school and program academic pages. It is independent of the homepage wave.

### Medium — live API and browser behavior not verified

The local environment has previously shown outbound proxy `EACCES` to `dgu.ac.in:443`. This audit did not re-run live requests or start a browser. Current parser/test results therefore cannot prove navigation, API content, route rendering, console health, or responsive overflow.

### Medium — test expectation drift

`npm run test:academic` failed at `scripts/academic-api-regression.cjs:30`: actual `/programs/new-published-course/` versus expected `/programs/new-published-course/123/`. This is a route-policy/test expectation mismatch in the existing baseline, not caused by this documentation task. No source fix was made.

### Low — lint warnings

`npm run lint` exited 0 with 119 warnings, primarily existing `no-img-element`, `react-hooks/set-state-in-effect`, and exhaustive-deps warnings. No lint errors were reported. These warnings span many unrelated files and should not be folded into a wave/content fix without separate approval.

## Protected areas reviewed

- Shared navigation/footer: `Navigation.tsx`, `SiteFooter.tsx`, and architecture docs show they are used by homepage and `AcademicApiPage`; no current diff changes them.
- Fonts/theme: `app/layout.tsx`, `app/global.css`, and page-specific CSS remain outside this audit's changes.
- API transport: `components/dgu-api-transport.ts` is centralized; no current diff changes URLs, authentication, response contracts, or rewrites.
- Program routes: `academic-route-identities.ts`, route files, `AcademicQueryPage`, `ProgramPage`, and `academic-page-api.ts` were inspected; no program route change is present in current user diff.
- Placement behavior: `placements-api.ts`, `usePlacements.ts`, `SchoolPlacementsSection.tsx`, and placement regression scripts were inspected. The current branch intentionally rejects unrelated/static API placement fallback content.
- Static export: `next.config.ts` and `package.json` preserve `output: 'export'`, base path/trailing slash assumptions, and the destructive `prebuild` cleanup hazard. No build was run.

## Regression classifications

| Classification | Items |
|---|---|
| Confirmed current issue | Academic feature overflow cannot reach the existing accordion/list for >6 items. |
| Confirmed baseline failure | `test:academic` route expectation mismatch at `scripts/academic-api-regression.cjs:30`. |
| Intentional/currently passing behavior | Placement scope/API-only fixture behavior; admissions missing-data behavior; API-only render exclusions. |
| Potential risk, not proven | Live API field/order differences, browser layout/overflow, keyboard behavior at current widths, exact current MBA/DBS production section order. |
| Not introduced by this audit | All application changes listed in Git baseline; this task only adds audit documents. |

## Verification performed

- `npm run test:academic` — failed at the existing route expectation mismatch described above.
- `npm run test:placements` — passed.
- `npm run test:admissions` — passed.
- `node scripts/api-only-render-regression.cjs` — passed.
- `npx tsc --noEmit` — passed with exit code 0 and no output.
- `npm run lint` — passed with exit code 0; 119 warnings, 0 errors.
- Production build — intentionally not run.
- Browser/live API — not run/verified.

