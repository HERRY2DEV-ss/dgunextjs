'use client';

import { useEffect } from 'react';

// Compatibility for old bookmarks. There is a single Admission design/page.
export default function OldAdmissionProcess() {
  const target = '/nextjs/homev1/admissions/#admission-process-title';
  useEffect(() => { window.location.replace(target); }, []);
  return <main><h1>Admissions</h1><p><a href={target}>Continue to Admissions</a></p></main>;
}
