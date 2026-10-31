import { resolveSiteHref } from './site-routes';

export type UtilityLink = { label: string; href: string };

/** Fixed quick links for the right-side utility strip. */
export const utilityLinks: UtilityLink[] = [
  { label: 'Alumni', href: resolveSiteHref('https://dgu.ac.in/alumni') },
  { label: 'Events', href: resolveSiteHref('https://dgu.ac.in/news') },
  { label: 'Virtual Tour', href: resolveSiteHref('https://dgu.ac.in/virtual-tour') },
  { label: 'Video Gallery', href: resolveSiteHref('https://dgu.ac.in/video-gallery') },
  { label: 'Merch Shop', href: resolveSiteHref('https://dgu.ac.in/merch-shop') },
  { label: 'Scholarship', href: resolveSiteHref('https://dgu.ac.in/scholarships') },
  { label: 'AI Cell', href: resolveSiteHref('https://dgu.ac.in/ai-cell') },
  { label: 'Career', href: resolveSiteHref('https://dgu.ac.in/career-with-us') },
  { label: 'Contact Us', href: resolveSiteHref('https://dgu.ac.in/contacts') },
].filter((link): link is UtilityLink => Boolean(link.href));

export function isUtilityGroup(): boolean { return false; }
export function apiUtilityLinks(): UtilityLink[] { return utilityLinks; }
