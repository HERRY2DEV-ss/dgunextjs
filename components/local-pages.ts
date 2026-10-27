import data from './local-pages-data.json';
import { sitePath } from './site-base';
export type LocalPage = { slug: string; label: string; group: string; kind: string; url: string; html: string; documentUrl: string; newsTab: string; photos?: { src: string; alt: string }[] };
export const localPages: LocalPage[] = data.map(page => ({
  ...page,
  url: sitePath(page.url),
  html: sitePath(page.html),
  documentUrl: sitePath(page.documentUrl),
  photos: page.photos?.map(photo => ({ ...photo, src: sitePath(photo.src) })),
}));
const pagesBySlug = new Map(localPages.map(page => [page.slug, page]));
export function getLocalPage(slug: string) { return pagesBySlug.get(slug); }
