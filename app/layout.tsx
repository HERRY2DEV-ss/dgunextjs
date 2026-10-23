import type { Metadata } from 'next';
import './global.css';
import './page-consistency.css';
import PageMotion from '../components/PageMotion';
export const metadata: Metadata = {
  title: 'DBS Global University | DGU',
  description: 'Explore the schools, placements, campus life and opportunities at DBS Global University, Dehradun.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Browser helpers may add attributes to <html> before hydration. Limit the
  // escape hatch to this root element; child hydration checks remain enabled.
  return <html lang="en" suppressHydrationWarning><body>{children}<PageMotion /></body></html>;
}
