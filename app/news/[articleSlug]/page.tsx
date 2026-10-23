import { notFound } from 'next/navigation';
import NewsDetailPage from '../../../components/NewsDetailPage';
import { newsRouteSlugs } from '../../../components/news-route-slugs';
import { newsSlug } from '../../../components/news-urls';
import '../news.css';

export const metadata = { title: 'News & Updates | DBS Global University' };
export function generateStaticParams() {
  return newsRouteSlugs.map(articleSlug => ({ articleSlug }));
}
export default async function NewsArticleRoute({ params }: { params: Promise<{ articleSlug: string }> }) {
  const { articleSlug } = await params;
  if (newsSlug(articleSlug) !== articleSlug) notFound();
  return <NewsDetailPage defaultSlug={articleSlug} />;
}
