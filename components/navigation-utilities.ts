import { menuHref, type MenuItem } from './navigation-api';

export type UtilityLink = { label: string; href: string; target?: '_blank' };

/** The API group is used only to position links; all labels and destinations remain API-driven. */
export function isUtilityGroup(item: MenuItem): boolean {
  return /^(additional|quick|utility)\s+links$/i.test(item.label.trim());
}

export function apiUtilityLinks(menus: MenuItem[]): UtilityLink[] {
  const links: UtilityLink[] = [];
  const seen = new Set<string>();
  const excludedLabels = new Set(['home', 'startup & entrepreneurial success', 'higher education']);
  const visit = (items: MenuItem[]) => items.forEach(item => {
    const label = item.label.trim();
    const href = menuHref(item);
    const key = label.toLowerCase();
    if (!item.children.length && href && !excludedLabels.has(key) && !seen.has(key)) {
      seen.add(key);
      links.push({ label, href, ...(item.target === '_blank' ? { target: '_blank' as const } : {}) });
    }
    visit(item.children);
  });
  menus.filter(isUtilityGroup).forEach(group => visit(group.children));
  return links;
}
