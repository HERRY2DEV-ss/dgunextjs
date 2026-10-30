import Image from 'next/image';
import Navigation from './Navigation';
import SiteFooter from './SiteFooter';
import './placements-landing.css';

export default function PlacementsLandingPage() {
  return (
    <div className="placements-landing">
      <Navigation />
      <main>
        <section className="placements-landing-heading" data-navigation-opening>
          <h1>Placements</h1>
        </section>
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
      </main>
      <SiteFooter />
    </div>
  );
}
