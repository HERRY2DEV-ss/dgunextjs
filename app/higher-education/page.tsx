import type { Metadata } from 'next';
import SuccessStoryDetailPage from '../../components/SuccessStoryDetailPage';

export const metadata: Metadata = {
  title: 'Higher Education | DBS Global University',
};

export default function HigherEducationPage() {
  return <SuccessStoryDetailPage kind="higher" />;
}
