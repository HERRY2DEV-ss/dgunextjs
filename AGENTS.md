<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# DGU project notes

## Working agreement

- Preserve existing DGU visual language, shared navigation/footer, Clash Grotesk fonts, responsive layouts, motion, and public assets.
- Inspect the relevant API adapter and current response shape before changing API-backed UI. Do not add invented content or expose credentials.
- Preserve uncommitted user work. Check `git status` and `git diff` before editing; do not commit, push, reset, clean, or deploy unless explicitly requested.
- Use the existing scripts from `package.json`. For local development use `npm run dev`; for the static production export use `npm run build`; serve the export with `npm start` when needed.

## Architecture

- This is a Next.js App Router project using Next 16.3.3, React 19, TypeScript, and a static production export. `next.config.ts` sets `basePath` to `/`, `trailingSlash: true`, unoptimized images, and development-only same-origin API rewrites.
- `app/page.tsx` composes the homepage. `components/Navigation.tsx` and `components/SiteFooter.tsx` are shared client shells with lazy API loading. Global homepage/theme CSS starts in `app/global.css`; page-specific styles live beside the related route/component.
- School and program routes under `app/schools/[schoolSlug]` and `app/programs/[programSlug]` resolve identities from `components/academic-route-identities.ts` and render through `AcademicQueryPage`/`AcademicApiPage`.
- Generic CMS/navigation pages use `app/[contentSlug]` and the registry in `components/local-pages.ts`; dedicated routes exist for homepage, news, faculties, admissions, campus/life, hostel, international affairs, glance, and academic viewers.
- API transport and JSON/error validation are centralized in `components/dgu-api-transport.ts`. Feed-specific parsing lives in files such as `navigation-api.ts`, `homepage-api.ts`, `news-*.ts`, `academic-page-api.ts`, `admissions-api.ts`, `placements-api.ts`, `footer-api.ts`, and related adapters. Development requests go through `/api/dgu-*`; production requests use the configured/live DGU endpoints.
- API absence/failure should produce the established loading, unavailable, or retry states. Do not silently fall back to stale or unrelated static data, especially for school/program placements and news.

## Verification baseline

- Run `npm run lint`, `npx tsc --noEmit`, and the relevant regression script(s) for the area changed. A full audit may be run with `npm run test:audit`.
- Before claiming visual verification, start/check the local server and inspect the target route at desktop and mobile widths, including console/API failures and horizontal overflow.
- Known baseline issues at the time these notes were added: TypeScript reports errors in `app/page.tsx` and `components/PlacementsFeedback.tsx`; `npm run test:audit` currently stops at a BA LLB href expectation mismatch in `scripts/audit-regression.cjs`; lint exits 0 but reports existing warnings. Recheck these before treating them as regressions.
