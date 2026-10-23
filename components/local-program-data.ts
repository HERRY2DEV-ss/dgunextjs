import type { LocalPage } from './local-pages';
import { academicSlug } from './academic-page-api';
import { academicProgramRoutes } from './academic-route-identities';
import { resolveSiteHref } from './site-routes';
const computingRoutes=new Set(['btech','bca-with-specialization','mca','mtech','integrated-btech-mtech','integrated-btech-mba','btech-cse-with-spe-in-ai-and-ml-with-minor','btech-cse-with-minor']);
/** Legacy course URLs resolve to the same live API template. */
export function localProgramSlug(page:LocalPage):string {
  if(page.kind!=='content')return '';
  const route=resolveSiteHref(page.url,page.label),key=route.match(/\/programs\/([^/?#]+)\//)?.[1];
  if((key&&academicProgramRoutes[key]) || computingRoutes.has(page.slug))return academicSlug(page.url) || (key ? academicProgramRoutes[key] : page.slug);
  return '';
}
