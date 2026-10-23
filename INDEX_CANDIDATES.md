# Candidate indexes — recommendations only

The supplied dump's existing indexes were recreated in the disposable QA snapshot and checked with `SHOW INDEX`. Native MariaDB 10.11 `EXPLAIN` used the actual recorded request parameters. No candidate index was created, and no production migration ran.

Most academic tables currently have only a `sno` primary key. `link_page` has a unique `sno` index; `sub_heading` also has a `heading` index. Representative current plans:

| Query | Existing plan |
| --- | --- |
| Programme detail with `sno` | PRIMARY, const, estimated 1 row |
| Programme lookup by URL without ID | ALL, estimated 97 rows, where/filesort |
| Children or full catalogue | ALL, estimated 97 rows, where/filesort |
| School-specific catalogue with actual 29 offered IDs | ALL, PRIMARY considered, estimated 97 rows, where/filesort |
| School URL lookup | ALL, estimated 9 rows, where/filesort |
| Programme tabs | ALL, estimated 474 rows, where/filesort |
| Admissions link pages | ALL, estimated 98 rows, where/filesort |
| All eligible admissions placements, descending ID | PRIMARY index scan, estimated 301 rows, where |

These are **estimated local plans**, not production measurements. Small/highly eligible tables can reasonably retain scans even with an index; actual plans and timings must decide whether a candidate is worthwhile.

| Actual table | Candidate columns, in order | Corresponding query |
| --- | --- | --- |
| masterPrograms | friendly_url, status, delete_status, sortingOrder, sno | Direct URL lookup |
| masterPrograms | parentProgram, status, delete_status, sortingOrder, sno | Child/sibling lists |
| masterPrograms | status, delete_status, searchArea, sortingOrder, sno | Full eligible catalogue |
| masterPrograms | status, delete_status, sortingOrder, sno | Lightweight legacy candidates without ID; assess overlap with catalogue candidate |
| masterSchool | friendly_url, status, delete_status, sorder, sno | School URL lookup |
| masterSchool | status, delete_status, sorder, sno | Bulk school catalogue and faculty relationship mapping; tiny table, likely low priority |
| masterProgramTab | programID, status, sortingOrder, sno | Programme tabs |
| masterFaq | faqType, typeID, status, sortingOrder, sno | Page-specific FAQs |
| sliders | sliderType, typeID, status, sorder, sno | Page-specific banners |
| masterPlacements | placementType, linkID, status, sno | Programme/school students |
| masterPlacements | status, sno | Complete admissions students; compare with existing PRIMARY scan |
| programHighlight / programOutcome / programPlacement / programRecruiters | programID, status, delete_status, sno — separately on each table | Programme detail blocks; these are established shared relationship/filter columns |
| schoolPlacement | schoolID, status, sno | School placement sections |
| masterRecruiters | status, sortingOrder, sno | Eligible admissions recruiters |
| link_page | friendly_url, status, sno | Fixed admissions slug set; IN ranges may still require sorting |
| bottom_menu | websitetype, status, section, position, sno | Footer groups and order |
| masterLevel | status, sorder, sno | Eligible levels; tiny table, low priority |
| settings | websitetype, sno | Public singleton settings; low priority |

Do not install this entire list blindly. Check **live** `SHOW INDEX`, representative `EXPLAIN`, actual execution times and index overlap first; evaluate one candidate at a time on a non-production copy. Indexes consume storage and add write work. No performance gain has been demonstrated for these uninstalled candidates.

No extra welcome index is recommended: `sno=1 LIMIT 1` already uses PRIMARY. ID-restricted programme lookup already uses PRIMARY. CSV `programsOffered`/faculty membership cannot be accelerated by an ordinary CSV-column index. No schema conversion is proposed. `LOWER(name)` in admissions heading lookup does not automatically benefit from a plain name index; that predicate and its current matching behavior remain unchanged.
