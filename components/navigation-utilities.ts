import { menuHref, type MenuItem } from './navigation-api';

export type UtilityLink = { label: string; href: string; target?: '_blank' };

const utilityLabels = new Set([
  'alumni',
  'events',
  'virtual tour',
  'video gallery',
  'merch shop',
  'scholarship',
  'ai cell',
  'career',
  'contact us',
]);

/** Utility categories are layout-only; labels and destinations always come from the live menu API. */
export function isUtilityGroup(item: MenuItem): boolean {
  return /^(additional|quick|utility)\s+links$/i.test(item.label.trim());
}

/** Collect the nine requested utility links wherever the API nests them. */
export function apiUtilityLinks(menus: MenuItem[]): UtilityLink[] {
  const links: UtilityLink[] = [];
  const seen = new Set<string>();
  const visit = (items: MenuItem[]) => items.forEach(item => {
    const label = item.label.trim();
    const href = menuHref(item);
    if (utilityLabels.has(label.toLowerCase()) && href && !seen.has(label.toLowerCase())) {
      seen.add(label.toLowerCase());
      links.push({ label, href, ...(item.target === '_blank' ? { target: '_blank' as const } : {}) });
    }
    visit(item.children);
  });
  menus.forEach(group => visit([group]));
  return links;
}
