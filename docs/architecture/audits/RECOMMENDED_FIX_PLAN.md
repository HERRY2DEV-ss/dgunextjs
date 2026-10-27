# Recommended Fix Plan

Audit date: 2026-10-23

This plan is advisory only. No fixes were implemented during the audit.

## Priority order

### 1. Restore academic feature overflow (High)

Problem: `AcademicApiPage.tsx:136,143` truncates the feature array before deciding whether extra points exist.

Smallest fix:

1. Keep the full normalized `points` array in `FeatureSection`.
2. Pass the full array to `DifferentiatorSection`, which already limits the visible wave to four school points or six default points.
3. Render `AcademicAccordions` with `points.slice(6)` when the full array has more than six items.
4. Preserve the current variant rule, icon numbering, description truncation, dialog/hover behavior, and `content.remaining` rendering.
5. Do not change homepage `HomeDifferentiators` or global wave CSS in this fix.

Files likely changed: `components/AcademicApiPage.tsx`; regression fixture/script only if needed. Shared impact: low because the correction is in the academic feature wrapper, but it affects every school/program feature page and must be tested accordingly.

Required tests:

- Add/extend a fixture with seven feature points.
- Assert six wave points and one existing accordion item.
- Run `npm run test:academic`, `node scripts/api-only-render-regression.cjs`, and representative school/program render checks.
- Run `npx tsc --noEmit`, `npm run lint`, and `git diff --check`.

### 2. Resolve the academic route-test contract mismatch (High for CI clarity)

Problem: `scripts/academic-api-regression.cjs:30` expects an ID segment for `new-published-course`, while current route policy returns the slug-only path.

Safe approach:

1. Inspect `academic-clean-routes.ts`, `academic-route-identities.ts`, and the test fixture's intended public route.
2. Confirm the project rule that `/programs/ba-llb/` remains slug-based and do not generalize an ID segment.
3. Update only the stale test expectation if source evidence confirms slug-only is intentional, or document the source mismatch for approval.
4. Do not change program route rendering or API URL contracts as part of the wave fix.

Required tests: `npm run test:academic`, `node scripts/program-detail-pause-regression.cjs`, `node scripts/restored-api-regression.cjs`, and route identity assertions for MBA, BA LLB, and the published-course fixture.

### 3. Capture live MBA and Doon Business School evidence (Medium)

Before changing mapping/order rules, use the existing read-only verifier or approved captured fixtures to record:

- response status and normalized section titles;
- feature count/order;
- tabs, accordions, placements, faculty, recruiters, news, international, and FAQs;
- exact record ID/slug matching;
- missing/empty fields and API error behavior.

Do not print credentials or full personal/student records. If local outbound HTTPS remains blocked, have the Windows developer run the verifier outside the restricted environment or provide sanitized captures.

### 4. Browser regression pass (Medium)

After code/test fixes, run the dev server using the existing `npm run dev` script, then inspect:

- homepage wave at desktop/tablet/mobile;
- `/schools/business/` and `/programs/mba/` at the same widths;
- a school with six features and a program with more than six features;
- keyboard focus/Enter/Space dialog interactions;
- reduced-motion behavior;
- horizontal overflow, console errors, failed API requests, and loading/error/empty states.

Do not claim visual verification unless these checks are actually performed.

## Change boundaries

Avoid changing `DifferentiatorSection.tsx`, `app/global.css`, `app/schools/school.css`, or route identity files for the first fix unless a failing test proves they are required. Avoid `academic-page-api.ts` mapping changes until sanitized live payload evidence shows a field mismatch. Keep homepage wave and placement layout out of the academic overflow patch.

## Rollback and acceptance criteria

Rollback should be a reviewable revert of only the approved source/test diff; do not reset the worktree because it contains user changes. Accept the fix only when:

- six-or-fewer feature arrays preserve the current wave output;
- seven-plus arrays show first six in the wave and the remainder in the existing accordion/list;
- homepage output is unchanged by source comparison and visual check;
- MBA and Doon Business School section ordering remains as documented unless live evidence approves a correction;
- program routes, including slug-only BA LLB, remain unchanged;
- targeted tests, TypeScript, lint, and diff checks pass;
- no API keys, credentials, PHP files, or static-export configuration change.

