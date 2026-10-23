import LocalPageShell from '../../components/LocalPageShell';
import ImageDetail from '../../components/ImageDetail';
import '../[contentSlug]/local-content.css';
export const metadata = { title: 'Image viewer | DBS Global University' };
export default function ImageRoute() { return <LocalPageShell className="local-page internal-page"><ImageDetail /></LocalPageShell>; }
