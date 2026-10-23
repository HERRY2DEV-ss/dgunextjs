import type { Metadata } from 'next';
import HostelLifePage from '../../components/HostelLifePage';
import LocalPageShell from '../../components/LocalPageShell';

export const metadata: Metadata = {
  title: 'Hostel Life | DBS Global University',
  description: 'Explore hostel life, campus facilities, residences and the photo and video galleries at DBS Global University.',
};

export default function HostelLifeRoute() {
  return <LocalPageShell className="hostel-page-shell"><HostelLifePage /></LocalPageShell>;
}
