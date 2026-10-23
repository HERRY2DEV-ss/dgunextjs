import { Suspense } from 'react';
import AcademicQueryPage from '../../components/AcademicQueryPage';
export const metadata={title:'School | DBS Global University'};
export default function Page(){return <Suspense fallback={<p role="status">Loading school information…</p>}><AcademicQueryPage kind="school"/></Suspense>;}
