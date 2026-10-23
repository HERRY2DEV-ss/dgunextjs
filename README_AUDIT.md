# Clubs & Committees — page update and audit

Based on the supplied “Students Clubs & Committees _website page(1).pdf” and the latest DGU_API_Dependency_Cleaned source.

## Apply the update

1. Copy the `components` and `public` folders into your existing project root, merging folders and replacing these files only. Keep all existing public assets and common components.
2. Run `npm run build` in that project. This is a source patch, not a deploy-ready `out` folder.
3. Deploy the resulting static export using your existing `/nextjs/homev1` setup.
4. Open `/nextjs/homev1/students-clubs-and-committees/`.

There is no new route, API folder, dependency, package change, or full-project replacement. The existing content-route renderer selects the Clubs component for this slug.

## What matches the reference

- Purple title band and original composite basketball banner, including the grayscale background and blue uniforms.
- Banner proportions, inset width and partial purple backdrop.
- Compact, centered introduction with the existing common ExpandableText component; complete original introductory copy retained under Read more.
- Original football poster across the full width.
- Light-weight two-line Clubs & Committees heading.
- All 19 original club logos, original colours, alternating left/right curved frames and capsule outlines.
- Desktop two-column placement; mobile one-column layout preserves the same row-by-row order and mirrored frames.
- Common LocalPageShell navigation/footer, LocalGallery image viewer, and existing AdmissionsVideo component when a real video URL is configured.

The PDF repeats “Social Welfare Club” next to the Spectrum logo. That card is correctly labelled “Spectrum Club” and links to the existing Spectrum route. No duplicate Social Welfare card was added.

Logos are packed in one WebP atlas to avoid 19 extra asset files. The banner and poster are extracted from the supplied PDF. The locally served Clash Grotesk Semibold font comes from Fontshare's official CSS service, alongside the existing project's Light, Regular and Medium weights. No 700/800 weight is used on the new page. Fontshare's applicable font terms continue to apply: https://www.fontshare.com/fonts/clash-grotesk

The project's global typography rules were overriding the reference heading and paragraph sizes. Page-scoped scale variables and selectors fix this without changing typography on other pages.

## Sports media — supplied asset limitation

The reference includes a video play symbol, but no corresponding sports video was supplied. The patch currently shows the original poster with a working enlarge control and the common image viewer. Its circular control uses an enlarge arrow, not a misleading video play button.

To enable a real clip, add this optional variable to your existing environment configuration before building:

```env
NEXT_PUBLIC_CLUBS_VIDEO_URL=/nextjs/homev1/assets/clubs/sports.mp4
```

Place the actual clip at `public/assets/clubs/sports.mp4`, or use its real HTTPS URL. Rebuild after changing this value. With a configured URL, the common video component provides muted inline playback, a play-with-sound control and native video controls. The MBA video is not substituted as a football video. Actual sports-clip playback remains unverified until the corresponding asset is available.

## Audit results

| Check | Result |
| --- | --- |
| Next.js 16.3.3 production build | Passed; all 596 existing static pages generated |
| TypeScript | Passed |
| Targeted ESLint | 0 errors; one existing-framework advisory for the pre-optimized native WebP banner image |
| Browser widths | Passed at 1440, 1152, 768, 720, 390 and 320 px |
| Horizontal overflow | None at any tested width |
| Club labels | All 19 visible; no clipped text |
| Club destinations | All 19 existing local detail routes returned HTTP 200 |
| Intro Read more / Read less | Passed; expanded and preview paragraphs have the same font, size, weight, line-height and content width at every tested width |
| Desktop intro font | Clash Grotesk Regular, 22.5 px at a 1152 px viewport; PDF-relative sizing |
| Photo preview | Open, Escape close and focus restoration passed |
| Page assets | All page images, logo atlas and fonts loaded |
| Browser exceptions | None in the tested flows |
| Header breakpoint | Offset matches the existing 96 px desktop / 82 px mobile navigation |
| Visual review | Rendered PDF compared against browser desktop and mobile screenshots |

Navigation/footer browser checks used controlled API responses to isolate layout. No mock data is shipped in this patch. Common navigation/footer API code and the previously diagnosed upstream API-response problem are unchanged; this page update does not claim to repair or verify those live endpoints.

## Files in this patch

- `components/ClubsCommitteesPage.tsx` — page layout and original club details.
- `components/clubs-committees.css` — scoped reference styling and responsive layout.
- `components/LocalContentPage.tsx` — one import and one selection branch for the existing Clubs route.
- `public/assets/clubs/basketball-banner.webp` — original banner.
- `public/assets/clubs/sports-poster.webp` — original poster.
- `public/assets/clubs/club-logos.webp` — 19 original logos in one atlas.
- `public/fonts/ClashGrotesk-Semibold.woff2` — local reference title/card font.
- This setup and audit report.
