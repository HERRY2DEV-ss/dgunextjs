import LocalPageShell from '../../components/LocalPageShell';
import DocumentDetail from '../../components/DocumentDetail';
import '../[contentSlug]/local-content.css';
export const metadata = { title: 'University document | DBS Global University' };
export default function DocumentRoute() { return <LocalPageShell className="local-page internal-page"><DocumentDetail /></LocalPageShell>; }
