import type { Metadata } from 'next';
import GlancePage from '../../components/GlancePage';
import LocalPageShell from '../../components/LocalPageShell';
export const metadata: Metadata = {
  title: 'DGU at a Glance | DBS Global University',
  description: 'Discover DBS Global University, its mission, vision, approvals and recognition.',
};
export default function GlanceRoute() {
  return <LocalPageShell className="glance-page-shell"><GlancePage /></LocalPageShell>;
}
