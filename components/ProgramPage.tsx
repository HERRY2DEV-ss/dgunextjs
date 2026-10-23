'use client';

import AcademicApiPage from './AcademicApiPage';

export default function ProgramPage({ slug, recordId = '' }: { slug: string; recordId?: string }) {
  return <AcademicApiPage kind="program" slug={slug} recordId={recordId} />;
}