# School and News API update

16 October 2026

## Install

1. Extract `DGU_School_News_Update.zip` into the existing `mba_gt` project root, where `package.json` is located. Replace the included files.
2. Keep the existing API key in `.env.local`. The update uses the existing `Apikey` header.
3. Restart the development server, or run `npm run build` for production.
4. Upload the rebuilt `out` contents, including its `.htaccess`, to `public_html/`.

This update requires frontend files only. The developer's live PHP APIs do not need to be overwritten. The full project ZIP contains the same changes if a complete source copy is preferred.

## Integrated

- **School details:** `POST get-school-info.php` with `SCHOOL_URL`. The shared School template now maps `heading`, `subHeading`, `readmore`, statistics, curriculum/immersion content and supplied faculty.
- **School faculty:** the current response repeats one numeric ID across different people. Cards use the actual distinct profile URLs as stable identifiers, retaining all supplied members. An empty faculty list hides the section. Program pages retain their existing scoped Faculty API flow.
- **News listing:** `POST get-news.php` with `CATEGORY_ID` and optional `SCHOOL_URL`. Updated `shortDesc` and `imageURL` fields populate summaries and photos. Existing earlier field names remain supported.
- **News details:** `POST get-news.php` with `URL`. The article uses `category`, `imageURL`, and the full `otherDetails` body. A repeated shortened introduction is removed; all three inline photos in the supplied example are retained.
- **News links:** DGU stories open the existing local News detail page. Requests and caches use school URL scopes, replacing the old `SCHOOL_ID` parameter.
- Existing page templates, tabs, accordions, sliders, navigation and public assets are retained. Remote CMS scripts/styles are excluded from the rendered content.

## Checks completed

- Live School detail requests succeeded for all eight schools; their responses were checked against the updated parser.
- Live Campus and Placement News lists and the supplied article detail returned valid JSON. The example article cover, three inline photos and first Campus News cover returned HTTP 200 image files.
- Production build passed and generated 619 pages.
- 22 browser cases passed at 1440px and 390px, covering all eight Schools, complete faculty lists, News archive/detail, article photos, image dialog, missing articles and retry. No browser page errors or horizontal overflow were found.
- Browser checks used recorded current API responses against the production export and original bytes for the five checked News images; other external images were omitted during these checks. This does not certify every external image on the website.
- Existing audit, academic, News/Faculty contract, restored API, placement scope, placements API and Program policy checks passed. The new regression script includes two representative School captures and the new News list/detail schema.

Run the included checks with:

```bash
npm run test:audit
node scripts/school-news-api-regression.cjs
node scripts/menu-news-faculty-regression.cjs
npm run build
```

## Backend follow-up

| Item | Verified response | Required backend action |
| --- | --- | --- |
| School-specific News | Business, Technology and an invalid school slug returned the identical 25 Campus News IDs. | Make `SCHOOL_URL` filter records correctly. The existing shared News section remains a common university feed. |
| Admission News | `CATEGORY_ID: "2"`, numeric `2`, and the old home parameter each returned HTTP 200 with only a tab character, not JSON. | Return the category records, or a valid empty response such as `{"error":"0","data":[]}`. The frontend shows a retry state for the blank response. |
| School banners | The eight School detail responses have no desktop/mobile banner fields. | Supply the actual banner URLs if banners are required. No substitute banners were added. |
| Embedded faculty IDs | Each non-empty School faculty array repeats one numeric ID across different profiles. | Return each member's correct ID. The frontend already handles this using the supplied profile URLs. |

The update is implemented and tested locally. Production deployment is completed by uploading the rebuilt export.
