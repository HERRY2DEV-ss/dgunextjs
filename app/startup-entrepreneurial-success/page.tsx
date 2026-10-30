import type { Metadata } from 'next';
import SuccessStoryDetailPage from '../../components/SuccessStoryDetailPage';

export const metadata: Metadata = {
  title: 'Startup & Entrepreneurial Success | DBS Global University',
};

export default function StartupEntrepreneurialSuccessPage() {
  return <SuccessStoryDetailPage kind="startup" />;
}
