'use client';
import { sitePath } from '../../components/site-base';


import { useEffect } from 'react';

// Compatibility for old bookmarks. There is a single Admission design/page.
export default function OldAdmissionProcess() {
  const target = sitePath('/admissions/#admission-process-title');
  useEffect(() => { window.location.replace(target); }, []);
  return <main><h1>Admissions</h1><p><a href={target}>Continue to Admissions</a></p></main>;
}
