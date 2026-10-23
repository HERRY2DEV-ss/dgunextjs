import type { LocalPage } from './local-pages';
import { contentText } from './internal-content-layout';

/** Reposition an existing cover photograph; never substitute unrelated stock media. */
export function internalHeroContent(page: Pick<LocalPage,'slug'|'html'>): {html:string;image?:{src:string;alt:string};portrait?:{src:string;alt:string}} {
  const covers=/^(?:college-fest|cultural-activities|dehradun-advantage|law-activities|genesis|iqac|blog-(?!author|category|tag))/;
  const portraits=/^(?:the-visitor|the-vice-chancellor|pro-vice-chancellor|ombudsperson)$/;
  if(!covers.test(page.slug)&&!portraits.test(page.slug))return {html:page.html};
  const match=/<img\b(?:"[^"]*"|'[^']*'|[^'">])*>/i.exec(page.html);
  if(!match)return {html:page.html};
  const before=page.html.slice(0,match.index);
  if(before.lastIndexOf('<a ')>before.lastIndexOf('</a>'))return {html:page.html};
  const src=match[0].match(/\bsrc=["']([^"']+)["']/i)?.[1];
  if(!src||!/^(?:https?:\/\/|\/)/i.test(src))return {html:page.html};
  const alt=contentText(match[0].match(/\balt=["']([^"']*)["']/i)?.[1]||'');
  return {[portraits.test(page.slug)?'portrait':'image']:{src,alt},html:page.html.slice(0,match.index)+page.html.slice(match.index+match[0].length)};
}
