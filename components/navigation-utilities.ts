import { menuHref, type MenuItem } from './navigation-api';

export type UtilityLink = { label: string; href: string; target?: '_blank' };

/** Layout categories only. Every displayed link still comes from the menu API. */
export function isUtilityGroup(item: MenuItem): boolean {
  return /^(additional|quick|utility)\s+links$/i.test(item.label.trim());
}

export function apiUtilityLinks(menus: MenuItem[]): UtilityLink[] {
  const links: UtilityLink[] = [];
  const seen = new Set<string>();
  const excludedLabels = new Set(['home', 'startup & entrepreneurial success', 'higher education']);
  const visit = (items: MenuItem[]) => items.forEach(item => {
    const href = menuHref(item);
    if (!item.children.length && href && !excludedLabels.has(item.label.trim().toLowerCase()) && !seen.has(href)) {
      seen.add(href);
      links.push({ label: item.label, href, ...(item.target === '_blank' ? { target: '_blank' as const } : {}) });
    }
    visit(item.children);
  });
  menus.filter(isUtilityGroup).forEach(group => visit(group.children));
  return links;
}
