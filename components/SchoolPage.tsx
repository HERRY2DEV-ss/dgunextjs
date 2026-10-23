'use client';
import AcademicApiPage from './AcademicApiPage';
/** All school routes use the same DBS design and live API content. */
export default function SchoolPage({slug}:{slug:string}) {
  return <AcademicApiPage kind="school" slug={slug} />;
}
