# Wave Component Audit

Audit date: 2026-10-23

Scope: source-code audit only. No application files were changed and no browser visual verification was performed.

## Executive result

There are two related but separate wave paths:

1. Homepage differentiators use `HomeDifferentiators` and `DifferentiatorSection` with the `default` wave variant.
2. School/program API feature sections use `AcademicApiPage.FeatureSection`, which also renders `DifferentiatorSection` but adds API parsing, interactive dialogs/hover, and an existing accordion list for overflow.

The homepage six-point presentation is source-consistent and must remain unchanged. A confirmed academic-page bug prevents more than six API feature points from reaching the existing overflow accordion: `AcademicApiPage.tsx:136` passes `points.slice(0, 6)`, then `AcademicApiPage.tsx:143` tests `points.length > 6` on that already-truncated array. This is a data/rendering issue, not evidence that the wave CSS should be redesigned.

## Implementation inventory

| Surface | Source/data | Selection/order | Renderer | CSS/responsive path | Finding |
|---|---|---|---|---|---|
| Homepage | `HomeDifferentiators.tsx:8-10,34-42` calls `requestDifferentiators()`. | API points are sorted by database IDs using `[1,4,2,5,3,6]`; icons map to the same visual order. | `DifferentiatorSection` with `readMore` and `directLinks`. | `app/global.css:2918-3007`, plus `difference-wave-section--default` rules and mobile rules at `3261-3308`. | Confirmed six-point homepage design; no source evidence supports changing it. API points beyond six are currently dropped because the shared default renderer slices them. |
| School/program feature section | `AcademicApiPage.tsx:122-143`; `academicFeatures.ts:6-42` parses top-level list items or heading sections from API HTML. | Parser preserves source item order. `AcademicApiPage.tsx:125` sanitizes/truncates descriptions and assigns icons by index. | `DifferentiatorSection` with `pointInteraction`, `fitPoints`, hover/dialog behavior; intended overflow is `AcademicAccordions`. | `components/academic-api.css:21-26,88-148`, `app/academic-reference.css:144-190`, and shared wave CSS. | Confirmed overflow bug described above. |
| Legacy/reference school wave | Same `DifferentiatorSection`, `variant="school"` when API feature count is <=4 (`AcademicApiPage.tsx:136`). | `DifferentiatorSection.tsx:68` shows first four for the school variant. | Same wave markup, without API dialog unless supplied by caller. | `app/schools/school.css:407-419,514-523` and shared CSS. | Four-point school geometry is intentional. For five/six points the current code selects the default six-point geometry. |

## Point selection and rendering

`DifferentiatorSection.tsx:68` computes `shownPoints = points.slice(0, isSchool ? 4 : 6)`. Each rendered point receives a positional class, a delay, a link or non-link wrapper, and alternating icon/text order (`DifferentiatorSection.tsx:118-162`). The wave SVG is decorative (`aria-hidden="true"`); the actual point text remains in articles and links.

The homepage ordering is not the raw API order. `HomeDifferentiators.tsx:9` explicitly sorts IDs `[1,4,2,5,3,6]`, then maps icon numbers `{1:1,4:2,2:3,5:4,3:5,6:6}`. This is the source of truth for the current homepage visual order. Changing the generic renderer would risk the homepage.

Academic feature ordering begins with API HTML parsing. `academicFeatures.ts:11-42` uses top-level `li` elements, otherwise `splitAcademicContent`; it removes the extracted list from remaining copy. `AcademicApiPage.tsx:125` retains that order. `academicLayout.ts:18-33` and `academic-content-flow.ts` determine where the feature section sits on each page.

## Required rule audit

- Six or fewer points: current homepage default wave renders up to six; school variant renders four only when the source count is four or fewer. The API academic path uses the existing wave presentation. Verified from source.
- More than six points: desired existing overflow presentation is already present as `AcademicAccordions` at `AcademicApiPage.tsx:143` and `AcademicAccordions` at `AcademicApiPage.tsx:47-55`. It is currently unreachable because of the premature slice at line 136. Confirmed issue.
- Homepage unchanged: no homepage-specific overflow/list component was found. A shared change that adds new homepage UI would be a design change and is not justified by this audit.
- Source order: homepage order is explicitly verified from the ID sort. Academic order is API/parser order followed by the guide in `academicLayout`; live response ordering was not rechecked in this run.

## Responsive, accessibility, and interaction review

- Desktop: default wave positions six points along the SVG path (`app/global.css:2957-2976`). School CSS supplies four-point positions (`app/schools/school.css:407-419`).
- Tablet: `app/global.css:2980-2987` hides the SVG and presents a two-column card grid. School-specific tablet overrides are in `app/schools/school.css:514-523`.
- Mobile: `app/global.css:2989-3005` uses the mobile SVG and six grid rows; later homepage/default refinements are at `3261-3308`. Academic API mobile sizing and point positioning are scoped in `components/academic-api.css:140-148`.
- Motion: IntersectionObserver controls the `is-visible` class. Reduced motion disables path/point transitions at `app/global.css:3007`.
- Keyboard: interactive academic points use `role="button"`, `tabIndex=0`, Enter/Space handlers, focus/blur hover behavior, and a visible focus outline (`DifferentiatorSection.tsx:119-130`, `components/academic-api.css:88-89`). Non-interactive homepage points use links where an href exists; otherwise they are non-focusable presentation blocks.
- Potential overflow: long academic headings/descriptions are clamped by `components/academic-api.css:23-25,117-120`. No runtime browser measurement was performed, so actual clipping at current live widths remains unverified.

## Smallest safe correction recommendation

Do not change `DifferentiatorSection` or homepage CSS first. In `AcademicApiPage.FeatureSection`, retain the full `points` array, pass the first six to the wave, and pass `points.slice(6)` to the existing `AcademicAccordions`. The exact implementation must preserve the current `variant` decision and icon/order logic. Add a regression fixture with seven points proving six wave points plus one accordion item.

Shared-component impact: low if limited to `AcademicApiPage.tsx`; high if `DifferentiatorSection.tsx` or global wave CSS is changed because homepage, school, and program pages share it.

## Verification gap

No browser, live API response, console, keyboard, or responsive screenshot verification was performed. Fixture/regression tests prove parser contracts only; they do not prove current production point count or pixel layout.

