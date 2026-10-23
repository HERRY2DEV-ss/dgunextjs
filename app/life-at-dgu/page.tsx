import type { Metadata } from 'next';
import './life-at-dgu/life-at-dgu.css';
import CampusOverview from '../../components/CampusOverview';

export const metadata: Metadata = {
  title: 'Life at DGU | Campus Life | DBS Global University',
  description: 'Experience Genesis, visiting artists, student clubs, hostel life and educational tours at DBS Global University in Dehradun.',
};

export default function LifeAtDGURoute() {
  return <CampusOverview />;
}
