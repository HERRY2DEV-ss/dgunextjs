# DGU shared-component design audit

Date: 16 October 2026
Scope: current working source after the School/News, Faculty, Advanced Computing, Typography and Browser Errors updates. Compared with the originally uploaded mba_gt(1).zip and with before/after browser measurements.

## Finding

You are correct: changing the sequence or mapping API data should not change the design. The API is not selecting a new font. The site reuses React components, but their CSS is not isolated: several global and page-specific stylesheets override the same elements. The sequence work also added a custom intro branch, and the later typography patch changed tab presentation explicitly. Those are implementation/style changes, not an unavoidable consequence of API integration.

## What is shared, and what overrides it

Both SchoolPage.tsx and ProgramPage.tsx render AcademicApiPage.tsx. That renderer uses SchoolIntroSection, AcademicContent, ProgramCard, DifferentiatorSection, SchoolFaculty, SchoolPlacementsSection and NewsUpdatesSection.

Six primary stylesheets affect that renderer, in addition to styles imported by individual components:

| File | Role and conflict |
| --- | --- |
| app/global.css | Site styles plus repeated News/tab/card rules. Contains 410 font-size declarations and 98 !important declarations across the entire file. |
| app/page-consistency.css | Root typography tokens; broad body main heading, paragraph and tab rules with !important. These can beat a shared component's own styling. |
| app/schools/school.css | School-specific wrappers and section styles. |
| app/programs/program.css | Programme wrappers, content tabs, card and API copy rules. |
| app/academic-reference.css | Business School/MBA reference theme with another intro, heading, table and tab scale. |
| components/academic-api.css | API-rendered content styles and later overrides, including the typography patch. |

Counts above are file-wide, not counts of rules matching a particular element. The last three files alone do not determine the final appearance: selector specificity, !important, responsive rules and import order all matter. Installed Next.js documentation also warns that global styles can remain loaded across client navigation and that production CSS ordering must be checked. This is an architectural risk; the audit does not claim that every visual difference was caused by import order.

## Specific causes

| Priority | Evidence | Status |
| --- | --- | --- |
| High | Global selectors such as body main h2, body main p and body main :is(...tab selectors...) overlap the reference theme and component rules. A shared JSX component therefore receives different final styles under .academic-api-page, .school-page or .program-page. | Existing style ownership problem. |
| High | The Advanced Computing mapping introduced introContent, which bypasses the normal ExpandableText wrapper. Its initial ApiRichText lacked academic-intro-text. Before the typography correction, desktop Business intro measured 25.92px while Computing measured 18px. | Wrapper class corrected in the previous patch; current intros match. |
| High | The typography patch added roughly 132 lines to academic-api.css compared with the uploaded file. It changed tab font sizes, casing, wrapping, underlines and spacing, including News tabs on academic pages. | A real style change, not data mapping. Documented here; not changed again in this patch. |
| Medium | The academic override applies to NewsUpdatesSection only when inside an academic page. The same News component on home uses the global scale. Desktop active News tabs currently measure 23.04px on Business/Computing/MBA versus 33.84px on home. | Confirmed remaining cross-context difference. |
| Medium | Mapping chooses different renderers: tabs, accordions, generic sections and a four- or six-point wave variant. Changing that renderer or its wrapper changes layout even if the underlying UI component is shared. | Keep sequence configuration separate from visual variants. |
| Medium | ApiRichText retains semantic headings, lists, tables and emphasis, but removes remote style tags, inline styles and most CMS classes. This protects the page from CMS CSS, yet an API h3/list still has a different semantic role from a paragraph. Generic CMS divs do not automatically become the original designed card/grid. | Use explicit semantic mapping to existing components. Do not restore remote CSS to solve this. |
| Medium | Campus News thumbnails had object-fit: cover. Placement thumbnails are now wrapped in a link, so legacy .update-card > img selectors do not match; most measured placement images used fill. Archive thumbnails also used cover. | Fixed in this patch. |

The original uploaded SchoolPage and ApiRichText files, academic-reference.css and page-consistency.css already contained the shared renderer/sanitizer and these overlapping themes. The entire issue was not introduced by the latest patch. The custom Computing branch and later tab overrides did add further differences.

## Current computed typography

Production browser measurements with fonts ready. Values below are representative matched elements, not a claim that every text element should use the same size.

| Element | Business School | Advanced Computing | MBA |
| --- | --- | --- | --- |
| Intro at 1440px | 25.92px / line 33.696px / weight 400 | Same | Same |
| Intro at 390px | 16px / line 24px / weight 400 | Same | Same |
| Active academic tab at 1440px | No content tab in this captured school response | 23.04px / line 29.952px / weight 500 | Same |
| Active News tab at 1440px | 23.04px / line 29.952px / weight 500 | Same | Same |
| Active News tab on home at 1440px | 33.84px / line 42.3px / weight 500 | — | — |

The computed family is Clash Grotesk, Arial, sans-serif across the sampled elements. A different computed font family was not found in this build. Current active tabs use weight 500, inactive tabs 300, and paragraph text 400. Different weight/size/line-height can make the same font look like a different style.

## Changes included now

Only News image fitting is changed; there is no new typography or layout redesign.

- components/NewsUpdatesSection.tsx: attach component-local image classes to existing thumbnail links/images.
- components/news-images.module.css: object-fit: contain and centered positioning, scoped to those links/images. It covers Campus and Placement News on home, schools and programmes, without relying on a direct-child selector that the markup no longer matches.
- app/[contentSlug]/local-content.css: archive thumbnails use contain.
- app/news/news.css: article body images explicitly use contain. Hero/enlarged images already used contain.

Image boxes and aspect ratios are retained. Contain can show spare space around an image instead of cropping it. The API, data, typography, section mapping and earlier error fixes are unchanged.

## Verification

- Production build passed.
- Before/after measurements covered all eight schools, MBA, B.Pharm, B.Tech and home at 1440px and 390px: 24 route/viewport combinations.
- Campus and Placement News images resolved to contain in every after-change combination.
- Compared intro, content, heading, content-tab and News-tab computed styles before/after: zero typography differences from this patch.
- Source hash comparison confirmed that section mapping and typography files were untouched.
- News archive, article body and hero images passed separate desktop/mobile containment checks; original downloaded API image files decoded successfully.
- No page errors occurred in these checks. Checks used captured official API responses rather than relying on the API being stable during each run.

## Recommended design ownership

1. Treat the approved Business School component styles as the reference contract. Record explicit approved values for corresponding headings, intro/body text, cards and tabs.
2. Let mapping files return section type, order and content only. Do not add font or layout overrides there.
3. Move component presentation into component-scoped styles; use shared tokens for typography. Remove competing legacy rules only after comparing the approved reference visually.
4. Choose a component's visual variant explicitly. Do not infer a different design from the number of API points or the school slug unless that difference is approved.
5. Reuse the standard intro wrapper when inserting stats/logos so a mapping change does not bypass its typography.
6. Verify both direct loads and client navigation in development and production. Keep before/after component screenshots and computed-style checks for the approved reference.

These broader CSS cleanup recommendations are audit findings, not changes silently included in this patch.
