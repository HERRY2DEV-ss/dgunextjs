import { resolveSiteHref } from './site-routes';
import { clientDguApiUrl, readDguApiJson } from './dgu-api-transport';
import { apiPlain } from './dgu-content-api';
export type FooterLink = { id: string; name: string; href: string; target: '_self' | '_blank' };
export type FooterGroup = { id: string; name: string; links: FooterLink[] };
export type FooterContact = { campusAddress: string; cityAddress: string; mobileNo: string; emailID: string };
export type FooterData = { groups: FooterGroup[]; contacts: FooterContact[]; social: { name: string; href: string }[]; copyright: string; websiteName: string };
const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
export function parseFooter(payload: unknown): FooterData {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid footer response.');
  const response = payload as { error?: unknown; data?: unknown };
  if (String(response.error) !== '0' || !Array.isArray(response.data)) throw new Error('Footer API did not return successful data.');
  const groups: FooterGroup[] = [];
  const contacts: FooterContact[] = [];
  const social: FooterData['social'] = [];
  let copyright = '', websiteName = '';
  // The restored original footer returns quickLinks/otherLinks and flat contact
  // fields. Adapt them to the same groups/contact slots used by SiteFooter.
  const records = response.data.flatMap(row => {
    if (!row || typeof row !== 'object') return [];
    const normalized = { ...row };
    const address = (value: unknown) => text(value).replace(/<(?:br\s*\/?|\/p)>/gi, '\n')
      .split('\n').map(apiPlain).filter(Boolean).join('\n');
    if (!Array.isArray(row.info) && ['address', 'cityOffice', 'phone', 'email'].some(field => field in row)) {
      normalized.info = [{ campusAddress: address(row.address), cityAddress: address(row.cityOffice), mobileNo: text(row.phone), emailID: text(row.email) }];
    }
    if (!Array.isArray(row.social)) normalized.social = ['instagram', 'facebook', 'youtube', 'twitter', 'linkedin'].flatMap(network =>
      text(row[network]) ? [{ name: network === 'twitter' ? 'X' : network[0].toUpperCase() + network.slice(1), url: text(row[network]) }] : []);
    const groups = [['quickLinks', 'section1', 'Quick Links'], ['otherLinks', 'section3', 'Resources']].flatMap(([field, id, name]) =>
      Array.isArray(row[field]) && row[field].length ? [{ id, name, childMenu: row[field] }] : []);
    return [...groups, normalized];
  });
  for (const row of records) {
    if (!row || typeof row !== 'object') continue;
    if (text(row.copyright)) copyright = text(row.copyright);
    if (text(row.websiteName)) websiteName = text(row.websiteName);
    if (Array.isArray(row.social)) for (const item of row.social) {
      if (!item || !text(item.name) || !text(item.url)) continue;
      const href = resolveSiteHref(text(item.url));
      if (/^https?:\/\//i.test(href)) social.push({ name:text(item.name), href });
    }
    if (Array.isArray(row.childMenu)) {
      const links: FooterLink[] = [];
      const seen = new Set<string>();
      for (const item of row.childMenu) {
        if (!item || !text(item.name)) continue;
        const id = String(item.id ?? `${item.name}|${item.url}`);
        if (seen.has(id)) continue;
        seen.add(id);
        const raw = text(item.url);
        const name = text(item.name);
        const query = raw.split('?', 2)[1]?.split('#', 1)[0] || '';
        const sustainabilityPath = /^\/sustinability\/?$/i.test(new URLSearchParams(query).get('path') || '');
        const href = sustainabilityPath || /^the sust(?:ain|in)ability impact ratings$/i.test(name) || /^sustainibility initiatives$/i.test(name)
          ? 'https://dgu.ac.in/sustinability.html'
          : raw ? resolveSiteHref(raw) : '';
        links.push({ id, name, href, target: item.target === '_blank' ? '_blank' : '_self' });
      }
      groups.push({ id: String(row.id ?? groups.length), name: text(row.name), links });
    }
    if (Array.isArray(row.info)) for (const info of row.info) {
      if (info && typeof info === 'object') contacts.push({ campusAddress: text(info.campusAddress), cityAddress: text(info.cityAddress), mobileNo: text(info.mobileNo), emailID: text(info.emailID) });
    }
  }
  const combined = new Map<string, FooterGroup>();
  for (const group of groups) {
    const key = group.name.toLowerCase() || group.id;
    const previous = combined.get(key);
    if (previous) previous.links.push(...group.links); else combined.set(key, {...group,links:[...group.links]});
  }
  for (const group of combined.values()) {
    const ids = new Set<string>(), destinations = new Set<string>();
    group.links = group.links.filter(link => {
      const destination = `${link.href}|${link.name.toLowerCase()}`;
      if (ids.has(link.id) || destinations.has(destination)) return false;
      ids.add(link.id); destinations.add(destination); return true;
    });
  }
  const uniqueContacts = contacts.filter((contact,index) => contacts.findIndex(other => JSON.stringify(other) === JSON.stringify(contact)) === index);
  const uniqueSocial = social.filter((item,index) => social.findIndex(other => other.href === item.href) === index);
  return { groups:Array.from(combined.values()), contacts:uniqueContacts, social:uniqueSocial, copyright, websiteName };
}
let pending: Promise<FooterData> | undefined;
let cached: { expires: number; data: FooterData } | undefined;
export function requestFooter(): Promise<FooterData> {
  if (cached && cached.expires > Date.now()) return Promise.resolve(cached.data);
  if (pending) return pending;
  pending = loadFooter().then(data => { cached = { data, expires: Date.now() + 60000 }; return data; }).finally(() => { pending = undefined; });
  return pending;
}
async function loadFooter(): Promise<FooterData> {
  const key = process.env.NEXT_PUBLIC_DGU_MENU_API_KEY?.trim();
  if (!key) throw new Error('Footer API key is not configured.');
  const endpoint = clientDguApiUrl('footer');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Apikey: key }, body: '{}', signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new Error(`Footer API returned HTTP ${response.status}.`);
    return parseFooter(await readDguApiJson(response, 'Footer API'));
  } finally { clearTimeout(timeout); }
}
