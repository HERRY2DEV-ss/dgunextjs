import LocalPageShell from '../../components/LocalPageShell';
import PendingPageDetail from '../../components/PendingPageDetail';
import '../[contentSlug]/local-content.css';
export const metadata = { title: 'Page details | DBS Global University' };
export default function PageDetailRoute() { return <LocalPageShell className="local-page internal-page"><PendingPageDetail /></LocalPageShell>; }
