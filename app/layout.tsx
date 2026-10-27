import type { Metadata } from 'next';
import './global.css';
import './page-consistency.css';
import PageMotion from '../components/PageMotion';
import { SITE_BASE } from '../components/site-base';
export const metadata: Metadata = {
  title: 'DBS Global University | DGU',
  description:
    'Explore the schools, placements, campus life and opportunities at DBS Global University, Dehradun.',
  icons: {
    icon: '/images/favicon.png',
    shortcut: '/images/favicon.png',
  },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Browser helpers may add attributes to <html> before hydration. Limit the
  // escape hatch to this root element; child hydration checks remain enabled.
  return <html lang="en" suppressHydrationWarning><body>
    <style>{`@font-face {font-family:'Clash Grotesk';src:url("${SITE_BASE}/fonts/ClashGrotesk-Light.woff2") format("woff2");font-weight:300;font-style:normal;font-display:swap;}
      @font-face {font-family:'Clash Grotesk';src:url("${SITE_BASE}/fonts/ClashGrotesk-Regular.woff2") format("woff2");font-weight:400;font-style:normal;font-display:swap;}
      @font-face {font-family:'Clash Grotesk';src:url("${SITE_BASE}/fonts/ClashGrotesk-Medium.woff2") format("woff2");font-weight:500;font-style:normal;font-display:swap;}
      @font-face {font-family:'Clash Grotesk';src:url("${SITE_BASE}/fonts/ClashGrotesk-Semibold.woff2") format("woff2");font-weight:600;font-style:normal;font-display:swap;}
      @font-face {font-family:'Clubs Clash Semibold';src:url("${SITE_BASE}/fonts/ClashGrotesk-Semibold.woff2") format("woff2");font-weight:600;font-style:normal;font-display:swap;}
      :root {
      --dgu-building-image: url("${SITE_BASE}/assets/building.webp");
      --dgu-campus-students-image: url("${SITE_BASE}/assets/campus/students-jump.webp");
      --dgu-campus-events-image: url("${SITE_BASE}/assets/campus/event-crowd.webp");
      --dgu-campus-dehradun-image: url("${SITE_BASE}/assets/campus/dehradun-bg.webp");
    }`}</style>
    {children}<PageMotion />
  </body></html>;
}
