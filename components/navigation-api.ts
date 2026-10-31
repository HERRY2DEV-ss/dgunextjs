import { resolveSiteHref, SITE_BASE } from './site-routes';
import { clientDguApiUrl, liveDguApiUrl, readDguApiJson } from './dgu-api-transport';
export type MenuItem = {
  label: string;
  url: string;
  target: string;
  children: MenuItem[];
};

type RawItem = { id?: number; name?: string; menuName?: string; url?: string; target?: string; childMenu?: RawItem[]; subMenu?: RawItem[]; subsubMenu?: RawItem[] };

const upstream = liveDguApiUrl('menus', process.env.NEXT_PUBLIC_DGU_MENU_API_URL?.trim());
export const MENU_API_URL = clientDguApiUrl('menus', upstream);

let menuRequest: Promise<MenuItem[]> | null = null;

export function requestMenus(): Promise<MenuItem[]> {
  if (menuRequest) return menuRequest;
  menuRequest = loadMenus().catch(error => {
    // Do not retain a rejected promise across later mounts.
    menuRequest = null;
    throw error;
  });
  return menuRequest;
}

async function loadMenus(): Promise<MenuItem[]> {
  const key = process.env.NEXT_PUBLIC_DGU_MENU_API_KEY?.trim() || '';
  const method = (process.env.NEXT_PUBLIC_DGU_MENU_API_METHOD?.trim() || 'POST').toUpperCase();
  const auth = (process.env.NEXT_PUBLIC_DGU_MENU_API_AUTH?.trim() || 'header').toLowerCase();
  if (method !== 'GET' && method !== 'POST') throw new Error('Menu API method must be GET or POST in .env.local.');
  if (auth !== 'header' && auth !== 'url') throw new Error('Menu API auth must be header or url in .env.local.');
  if (auth === 'header' && (!key || /^(PASTE_YOUR_API_KEY_HERE|YOUR_ACTUAL_API_KEY|apikey)$/i.test(key))) {
    throw new Error('Set NEXT_PUBLIC_DGU_MENU_API_KEY in the project-root .env.local, then restart or rebuild.');
  }
  if (auth === 'header' && /^https?:\/\//i.test(key)) {
    throw new Error('API KEY contains a URL. Put only the key here; use NEXT_PUBLIC_DGU_MENU_API_URL for the endpoint.');
  }
  let endpoint: URL;
  try { endpoint = new URL(upstream); } catch { throw new Error('Menu API URL must be a complete https:// URL.'); }
  if (!endpoint.pathname.endsWith('/get-menus.php')) {
    throw new Error('Menu API URL must point to the original get-menus.php endpoint.');
  }
  if (auth === 'url' && !endpoint.search) throw new Error('URL authentication requires the complete working API URL with its query parameters.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (auth === 'header') headers.Apikey = key;
    if (method === 'POST') headers['Content-Type'] = 'application/json';
    const response = await fetch(MENU_API_URL, { method, headers, signal: controller.signal });
    if (!response.ok) {
      const hint = response.status === 401 || response.status === 403
        ? ' Check the API key and authentication mode.'
        : response.status === 404 ? ' Check the endpoint and restart after updating next.config.ts.'
        : response.status === 405 ? ' Check whether the working API request uses GET or POST.' : '';
      throw new Error(`Menu API returned HTTP ${response.status}.${hint}`);
    }
    const payload = await readDguApiJson(response, 'Menu API');
    const menus = parseMenus(payload);
    if (!menus.length) throw new Error('Menu API returned no usable menus. Expected error: 0 and a non-empty data array; check the Network response.');
    return menus;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Menu API timed out after 20 seconds.');
    if (error instanceof TypeError) throw new Error('Menu API connection failed. Check Network for a connection or CORS error.');
    throw error;
  } finally { clearTimeout(timeout); }
}

const samePrefix = (items: RawItem[], previous: RawItem[]) =>
  items.length >= previous.length && previous.every((item, index) => {
    const candidate = items[index];
    return candidate?.id === item.id && candidate?.name === item.name &&
      candidate?.url === item.url && (candidate?.childMenu?.length ?? 0) === (item.childMenu?.length ?? 0);
  });

// Legacy feeds can repeat earlier siblings in successive childMenu arrays.
// The updated subMenu/subsubMenu arrays are independent and retain every item.
export function parseMenus(response: unknown): MenuItem[] {
  if (!response || typeof response !== 'object') return [];
  const payload = response as { error?: string | number; data?: RawItem[] };
  if (String(payload.error) !== '0' || !Array.isArray(payload.data)) return [];
  let previousGroupChildren: RawItem[] = [];
  return payload.data.filter(item => item && typeof (item.menuName ?? item.name) === 'string').map(group => {
    const updatedGroup = Array.isArray(group.subMenu);
    const rawChildren = updatedGroup ? group.subMenu! : Array.isArray(group.childMenu) ? group.childMenu : [];
    const start = !updatedGroup && samePrefix(rawChildren, previousGroupChildren) ? previousGroupChildren.length : 0;
    const children = rawChildren.slice(start).map((child, offset) => {
      const index = start + offset;
      const earlier = index ? rawChildren[index - 1]?.childMenu ?? [] : [];
      const updatedChild = Array.isArray(child.subsubMenu);
      const rawLeaves = updatedChild ? child.subsubMenu! : Array.isArray(child.childMenu) ? child.childMenu : [];
      const leafStart = !updatedGroup && !updatedChild && samePrefix(rawLeaves, earlier) ? earlier.length : 0;
      return {
        label: child.menuName ?? child.name ?? '', url: child.url ?? '', target: child.target ?? '',
        children: rawLeaves.slice(leafStart).map(leaf => ({
          label: leaf.menuName ?? leaf.name ?? '', url: leaf.url ?? '', target: leaf.target ?? '', children: [],
        })),
      };
    });
    previousGroupChildren = rawChildren;
    return { label: group.menuName ?? group.name ?? '', url: group.url ?? '', target: group.target ?? '', children };
  });
}

export function menuHref(item: Pick<MenuItem, 'label' | 'url'>): string | null {
  const name = item.label.trim().toUpperCase();
  if (name === 'ADMISSION' || name === 'ADMISSIONS') return `${SITE_BASE}/admissions/`;
  if (name === 'LIFE AT DGU' || name === 'CAMPUS LIFE') return `${SITE_BASE}/life-at-dgu/`;
  const raw = item.url.trim();
  const normalizedPath = raw.toLowerCase();
  const [menuPath = '', menuHash = ''] = normalizedPath.split('#', 2);
  const legacyPath = menuPath.split('?')[0].replace(/\/+$/, '');
  const legacyHash = menuHash.split(/[?&]/)[0];
  const isLegacyPlacementReports = legacyPath.endsWith('/placement-reports');
  if (isLegacyPlacementReports && (legacyHash === 'startup' || legacyHash === 'startup-entrepreneurial-success')) {
    return `${SITE_BASE}/startup-entrepreneurial-success/`;
  }
  if (isLegacyPlacementReports && (legacyHash === 'higher-education' || legacyHash === 'higher_education')) {
    return `${SITE_BASE}/higher-education/`;
  }
  if (!raw || raw === '#') {
    if (name === 'OVERVIEW' || name === 'HOME') return `${SITE_BASE}/`;
    if (name === 'PLACEMENTS') return `${SITE_BASE}/placement-reports/`;
    if (name === 'SCHOOLS & PROGRAMS') return `${SITE_BASE}/#schools`;
    return null;
  }
  return resolveSiteHref(raw, item.label) || null;
}

export const menuMatches = (item: MenuItem, term: string): boolean =>
  item.label.toLowerCase().includes(term) || item.children.some(child => menuMatches(child, term));
