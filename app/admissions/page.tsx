import type { Metadata } from 'next';
import AdmissionPage from '../../components/AdmissionPage';
import './admissions/admissions.css';

export const metadata: Metadata = {
  title: 'Admissions | DBS Global University',
};

export default function AdmissionsRoute() {
  return <AdmissionPage />;
}
