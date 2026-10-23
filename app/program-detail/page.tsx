import { Suspense } from 'react';
import AcademicQueryPage from '../../components/AcademicQueryPage';
export const metadata={title:'Programme | DBS Global University'};
export default function Page(){return <Suspense fallback={<p role="status">Loading programme information…</p>}><AcademicQueryPage kind="program"/></Suspense>;}
