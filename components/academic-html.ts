import { apiPlain, apiRecord } from './dgu-content-api';

export const academicHeadingText = (value: string) => apiPlain(value).toLowerCase().replace(/\s+/g, ' ').replace(/\s*:\s*$/, '').trim();

/** PHP can return one object, an array, or an object indexed by record IDs. */
export function academicRecords(value: unknown, names: readonly string[]): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(item => academicRecords(item, names));
  const row = apiRecord(value);
  if (!row) return [];
  if (names.some(name => Object.keys(row).some(key => key.toLowerCase() === name.toLowerCase()))) return [row];
  return Object.values(row).flatMap(item => Array.isArray(item) ? academicRecords(item, names) : apiRecord(item) ? academicRecords(item, names) : []);
}

/** Remove only a leading heading which the template already renders. */
export function academicBody(source: string, title: string): string {
  if (!title || typeof DOMParser === 'undefined') return source;
  const doc = new DOMParser().parseFromString(source, 'text/html'), wanted = academicHeadingText(title);
  let node = doc.body.firstElementChild;
  while (node && ['DIV','SECTION'].includes(node.tagName) && node.children.length === 1 && !Array.from(node.childNodes).some(n => n.nodeType === 3 && n.textContent?.trim())) node = node.firstElementChild;
  while (node && /^(H[1-6]|P|STRONG|B)$/.test(node.tagName) && !node.querySelector('img,table,video,iframe') && academicHeadingText(node.textContent || '') === wanted) {
    const next = node.nextElementSibling; node.remove(); node = next;
  }
  return doc.body.innerHTML;
}

export function academicContentSignature(source: string): { text: string; assets: string[]; key: string } {
  const text = apiPlain(source).replace(/\s+/g, ' ').trim();
  const assets = typeof DOMParser === 'undefined' ? (source.match(/(?:src|href|srcset)\s*=\s*['"][^'"]+['"]/gi) || [])
    : Array.from(new DOMParser().parseFromString(source, 'text/html').querySelectorAll('[src],[href],[srcset]')).flatMap(node => ['src','href','srcset'].flatMap(name => node.hasAttribute(name) ? [name+'='+node.getAttribute(name)] : []));
  const unique = Array.from(new Set(assets)).sort();
  return { text, assets: unique, key: text+'|'+unique.join('|') };
}

/** Same-heading copies are combined; contained duplicate copy is not repeated. */
export function mergeAcademicBody(first: string, second: string): string {
  // A single CMS body may legitimately repeat values under different headings.
  // Only compare separate bodies; never deduplicate paragraphs in an untouched one.
  if (!first.trim()) return second;
  if (!second.trim()) return first;
  const a = academicContentSignature(first), b = academicContentSignature(second);
  if (a.key === b.key || (b.text && a.text.includes(b.text) && b.assets.every(value => a.assets.includes(value)))) return first;
  if (a.text && b.text.includes(a.text) && a.assets.every(value => b.assets.includes(value))) return second;
  if (typeof DOMParser === 'undefined') return first+second;
  const doc = new DOMParser().parseFromString(first+second, 'text/html'), seen = new Set<string>();
  for (const node of Array.from(doc.body.querySelectorAll('p'))) {
    if (node.closest('table,li,blockquote')) continue;
    const key = academicContentSignature(node.outerHTML).key;
    if (!apiPlain(node.outerHTML)) continue;
    if (seen.has(key)) node.remove(); else seen.add(key);
  }
  return doc.body.innerHTML;
}

/** Remove repeated feature blocks only from a generic CMS About wrapper.
 * Unique prose, tables and links survive; the named feature section is authoritative. */
export function withoutRepeatedFeatures(source: string, features: string[]): string {
  if (typeof DOMParser === 'undefined' || !features.length) return source;
  const copies = new Set<string>();
  for (const feature of features) {
    const doc = new DOMParser().parseFromString(feature, 'text/html');
    for (const node of doc.querySelectorAll('li,p')) if (!node.closest('table')) copies.add(academicContentSignature(node.outerHTML).key);
  }
  const doc = new DOMParser().parseFromString(source, 'text/html');
  let removed = false;
  for (const node of Array.from(doc.querySelectorAll('li,p'))) {
    if (!node.closest('table') && copies.has(academicContentSignature(node.outerHTML).key)) { node.remove(); removed = true; }
  }
  if (!removed) return source;
  for (const list of doc.querySelectorAll('ul,ol')) if (!list.textContent?.trim() && !list.querySelector('img,table')) list.remove();
  for (const node of Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6,strong,b'))) {
    if (/^(?:about(?:\s+(?:dgu|dbs))?|what makes .+|salient features)$/i.test(apiPlain(node.textContent))) node.remove();
  }
  return doc.body.innerHTML;
}
