import type { ClubPageData } from './club-detail-types';
import roboticsHero from '../public/assets/club-detail/robotics-hero.webp';
import roboticsEmblem from '../public/assets/club-detail/robotics-emblem.png';
import roboticsPoster from '../public/assets/club-detail/robotics-video-poster.webp';
import clubBanner from '../public/assets/clubs/basketball-banner.webp';

/** Approved presentation images only; club content and people always come from the API. */
export function clubMedia(slug: string): Pick<ClubPageData, 'hero' | 'video'> & { emblem?: string } {
  if (slug === 'robotics-and-automation-club') return {
    hero: { image: roboticsHero.src, imageAlt: 'Student building a robot', titleLines: ['INNOVATE.', 'AUTOMATE.', 'ELEVATE.'], subtitle: 'Where Ideas Take Motion.' },
    emblem: roboticsEmblem.src,
    video: { poster: roboticsPoster.src, title: 'Robotics Club' },
  };
  return { hero: { image: clubBanner.src, imageAlt: 'Student clubs and campus sports', titleLines: [], fullImage: true } };
}
