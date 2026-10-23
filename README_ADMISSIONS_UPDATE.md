# Admissions API update

Read More now opens the existing detail page. Its complete content comes from the same `get-admissions.php` response. No second admissions API or SQL update is required.

## Install

1. Extract this ZIP into your existing `mba_gt` project root and replace the included files.
2. If the admissions API has not been installed yet, upload `server-api/api/get-admissions.php` to `public_html/api/get-admissions.php`. It uses the existing `public_html/includes/classes.php` PDO connection and your supplied key. If this endpoint is already installed, its PHP code has not changed in this Read More update.
3. Run `npm ci` if dependencies are missing, then `npm run build`.
4. Deploy the new `out` contents at the project's existing `/nextjs/homev1/` location. For development, restart `npm run dev`.

The build clears generated `out` files before exporting, preventing an old admission page from remaining. `public` assets are untouched.

Optional overrides: `NEXT_PUBLIC_DGU_ADMISSIONS_API_URL` and `NEXT_PUBLIC_DGU_ADMISSIONS_API_KEY` in `.env.local`; restart/rebuild after changing them. The default request is POST `{}` with the existing `Apikey` header.

## API content and existing pages

| API source | Full-content page |
| --- | --- |
| `admission-process` | `/admission-requirements/` |
| `programs-fee-structures` | `/programs-fee-structures/` |
| `education-loan` | `/education-loan/` |
| `scholarships` | `/scholarships/` |
| `hostel-types` | `/hostel-life/` |
| `international-student-admission` | `/international-student-admission/` |
| `refund-policy` | `/refund-policy/` |
| `program-commencement-2026` (or older `program-commencement-date`) | `/program-commencement-2026/` |
| `placement-reports` | `/placement-reports/` |

These URLs include the project's base path when rendered. Read More in the process, resource, international and placement previews navigates to the matching full page. The existing fee accordions and policy/date expanders on the admissions overview are retained; their full pages are also API-backed.

The detail pages retain the shared university header/footer and article theme. Headings, body, lists, images and table contents come from the API. Fee tables scroll within their own frame on mobile. No old `local-pages-data.json` body is rendered for these nine routes. Missing content shows an unavailable state; a failed request offers retry. CMS scripts, CSS and click handlers cannot override the theme.

The overview's existing four static video statistics remain at your request. Other admissions editorial content is API-driven. Placement photographs fit without cropping; HTML quotes and API-provided counter units are preserved.

## Local verification

The supplied database's published content was used through the local PHP response, not a fabricated production fallback. Browser checks covered all nine detail routes, actual Read More clicks, direct URLs, complete source text/images/table cells, all 61 fee tables, mobile widths, missing content and API failure/retry. Contract/audit tests and the 598-route production build passed. All 441 original public assets were unchanged.

Live PHP/MySQL deployment is not performed by this patch. After uploading, check a Read More link and the API response on your server. The ZIP contains source changes and this README; no database dump, assets, dependencies or generated build output.
