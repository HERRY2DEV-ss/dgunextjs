# DGU internal pages — design update

**15 October follow-up:** this archive now also includes the new placements API integration. See `DGU_PLACEMENTS_API_REPORT.md` for current placement sources, the verified backend school-filter defect and the guard that prevents unrelated students from appearing. The report below describes the preceding internal-page design stage; its earlier statement about unchanged academic adapters applies to that stage.

Extract this ZIP into the **existing project root** and overwrite matching files. Restart the dev server, or run `npm run build` and upload the rebuilt `out` files to the existing configured location. Asset paths and `` configuration are preserved. No new dependency is required.

## Pages covered

- **328 shared internal routes:** university overview/governance, councils/committees, research, labs, facilities, international opportunities, fees, policies, resources, blogs, events, galleries, documents and existing pending destinations.
- **Faculty:** existing directory retained; common banner and responsive profile layout used by the 83 stored profile routes and query-based profile viewer.
- **Admissions:** existing overview layout retained; eight detail destinations use the common banner and content layout. The existing admissions navigation row now scrolls safely when its labels exceed the available width.
- **News:** archive/listing views and article viewer use the common banner and shared shell; API parsing and article sanitization are preserved.
- **Document, image and reserved-page viewers:** common banner and existing viewer/selection behavior.
- **Clubs and completed reference pages:** their designs are retained. Shared-shell connections and banner markers keep navigation, menu pause behavior and footer consistent.

`DGU_INTERNAL_PAGES.csv` lists every audited content destination, its presentation and content source, including preserved references. Dedicated School/Program page layouts, routes and API adapters are unchanged. Programme-detail integration remains paused as previously configured.

## Shared implementation

- `InternalPageHero`: the existing purple title-band/framed-media treatment. It repositions an existing suitable cover or portrait; it does not select unrelated stock images.
- `InternalContent` and `internal-content-layout`: preserve full copy while arranging comparable sections into sliding tabs, single-open accordion groups, reading sections, cards, tables, image/text layouts and media rails. FAQs use expandable groups; ordinary articles retain a reading layout.
- `LocalContentPage`, `AdmissionDetailPage`, `FacultyProfilePage` and resource viewers consume these shared patterns. API HTML continues through `ApiRichText` sanitization.
- `LocalGallery` reuses `StepSlider`, with autoplay, swipe, pause and the existing image viewer. Single photographs retain their static presentation. `SlidingTabList` is reused for active-tab alignment.
- `LocalPageShell`, `Navigation`, `SmoothScrolling` and `SiteFooter` remain common. Navigation also observes banners mounted after API loading. Existing admissions, campus-life, placements and news bodies use that shared shell.
- Internal presentation and responsive/motion rules are separated into `internal-pages.css` and `internal-pages-responsive.css`. Obsolete local heading/header rules were removed. `PageMotion` supplies the existing entrance timing with subtle card staggering.

## Verification

| Check | Result |
| --- | --- |
| Production build / TypeScript | Passed; 618 static pages generated |
| All shared internal routes | 328 checked in a browser at 320px; no route failures, horizontal page overflow or uncaught errors |
| Responsive families | 25 page families at 320, 390, 768, 1024 and 1440px: 125 cases |
| Interactions | 545 assertions passed, including tabs, accordion groups, looping sliders, menu pause/restore, sticky header, footer parity, touch and reduced motion |
| Content comparison | All 232 stored HTML bodies preserve full text, links, embeds, table cells and image sources; all 399 gallery photo records remain available |
| Image URLs | 794 source entries verified, with normal browser entity/URI encoding; representative browser media used actual downloaded files |
| Existing tests | Audit, admissions, placements, API recovery, programme-pause and new `node scripts/internal-pages-regression.cjs` checks passed |
| Targeted lint | 0 errors; 37 framework/style warnings remain |

## Current content and backend note

The 186 ordinary content pages, 42 galleries and four pending pages in the shared template keep their existing stored HTML. The 93 document destinations retain their existing document URLs. API-backed pages retain their existing API/loading/error behavior. The CSV identifies these sources individually. The original stored-content JSON and API adapter files were not edited.

Live read checks returned JSON for menus, footer, admissions, faculty, clubs, Glance, Hostel Life and International; faculty detail and school-filter requests also returned data. **The existing `get-news.php` endpoint returned a website 404 HTML page with HTTP 200, rather than JSON.** Its server response needs verification/restoration; no replacement endpoint or fabricated news has been added.

Browser interaction checks ran locally against current live-response fixtures. They are not a production deployment test. Existing remote document viewers were retained; every PDF was not rendered individually. PHP, database/schema, credentials and public source assets were not changed.
