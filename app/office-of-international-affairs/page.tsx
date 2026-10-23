import type { Metadata } from 'next';
import InternationalPage from '../../components/InternationalPage';
import LocalPageShell from '../../components/LocalPageShell';

export const metadata: Metadata = {
  title: 'Office of International Affairs | DBS Global University',
  description: 'Global partnerships, international opportunities, student mobility and admissions at DBS Global University.',
};

export default function InternationalRoute() {
  return <LocalPageShell className="international-page-shell"><InternationalPage /></LocalPageShell>;
}
