import Image from 'next/image';
import Navigation from './Navigation';
import SiteFooter from './SiteFooter';
import PageTitleStrip from './PageTitleStrip';
import './placements-landing.css';

export default function PlacementsLandingPage() {
  return (
    <div className="placements-landing">
      <Navigation />
      <main>
        <div data-navigation-opening>
          <Image
            className="placements-landing-banner"
            src="/assets/placement/placements_banner.webp"
            alt="DBS Global University placements"
            width={5133}
            height={1635}
            sizes="100vw"
            unoptimized
            preload
          />
        </div>
        <PageTitleStrip title="Placements" />
      </main>
      <SiteFooter />
    </div>
  );
}
