DGU - Programme memberships, specifications and testimonials

Copy the components/ files into your project's components/ directory, preserving
the paths. The scripts/ file is the updated regression check. Restart the local
development server, or rebuild with npm run build for your existing static hosting.
No PHP API file, database, CSS file, font or image asset needs replacing.
This package builds on the previously supplied shared academic page updates.

CHANGES

1. Memberships after the introduction
   Reuses the existing Global Membership | Recognition title and four static logos.
   Visibility follows the same exact Business School catalogue membership that
   already controls the header. This fixes specialization responses that omit
   schoolUrl, including MBA Logistics and MBA Agri Business.
   API-provided recognition logos retain their existing priority.
   The existing intro Read More remains in use and was checked at both widths.

2. Program Specification
   Actual API specification content is displayed once using the existing wave
   component, before its admission tabs. Fees, eligibility, structure and
   scholarship retain their shared tab design. No new copy is supplied.

3. Student Testimonials
   Reads this programme's actual API testimonial records or readable HTML cards
   from its testimonial-section. Reuses the project's review cards and StepSlider.
   Appears immediately before FAQs. No section is created when readable
   testimonial content is absent. No university-wide review feed or fallback
   testimonials are fetched. CMS carousel scripts are not executed.
   Current live responses: Logistics has one readable testimonial card;
   Agri Business and Global MBA have no supplied testimonial cards.

4. Global MBA
   POST PROGRAM_URL=dgu-global-mba currently returns record ID 33 with content.
   The public dgu-global-mba and global-mba route defaults now expect that ID,
   correcting the previous ID 97 mismatch. Existing public links are unchanged.
   The response is used directly; no data is substituted from another programme.

SOURCE CONTENT NOTE

The Logistics API testimonial currently names B. Lavanya and describes B.Sc
Forestry, with the image path supplied by that API. This package preserves the
supplied name, quote and course details. Correct that content in the source CMS
if it is not intended for Logistics. Data that exists only inside the old CMS
JavaScript carousel is not executed as content.

VERIFICATION

- Refreshed and audited all 28 Business School programme detail responses.
- 200 real-browser and response-mapping checks passed: desktop/mobile membership
  placement, Read More expansion, specification wave, conditional testimonials,
  FAQ adjacency, Global MBA slug/ID and existing school content/order.
- Existing branding/media, academic API and clean-news-route regressions passed.
- TypeScript and production build passed: 671 pages generated.
- Compared original and updated non-testimonial responses for the other Business
  School programmes. Existing school parsing and section order are unchanged.
- Source hash audit confirmed all CSS, fonts, app routes and PHP files unchanged.

Only the listed updated/new source files and this readme are included.
API keys, SQL dumps, live response snapshots and browser captures are excluded.
No live deployment was performed.
