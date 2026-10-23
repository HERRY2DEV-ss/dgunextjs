import type { Metadata } from 'next';
import FacultyProfilePage from '../../../components/FacultyProfilePage';
export const metadata: Metadata = { title: 'Faculty profile | DBS Global University', description: 'Faculty qualifications, expertise and profile at DBS Global University.' };
export default function FacultyProfileRoute() { return <FacultyProfilePage />; }
