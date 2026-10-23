import type { Metadata } from 'next';
import NewsDetailPage from '../../components/NewsDetailPage';
import './news.css';
export const metadata: Metadata = { title: 'News & Updates | DBS Global University', description: 'News, events and stories from DBS Global University.' };
export default function NewsPage() { return <NewsDetailPage />; }
