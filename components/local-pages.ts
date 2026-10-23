import data from './local-pages-data.json';
export type LocalPage = { slug: string; label: string; group: string; kind: string; url: string; html: string; documentUrl: string; newsTab: string; photos?: { src: string; alt: string }[] };
export const localPages: LocalPage[] = data;
const pagesBySlug = new Map(localPages.map(page => [page.slug, page]));
export function getLocalPage(slug: string) { return pagesBySlug.get(slug); }
