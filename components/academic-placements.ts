import { apiFields, apiPlain, apiValue } from './dgu-content-api';
import { resolveSiteHref } from './site-routes';

/** Legacy scoped feeds omit these fields; the updated API supplies the DB relation. */
export function placementStudentMatches(kind: 'school' | 'program', id: string, offered: readonly string[] | null, student: Record<string, unknown>): boolean {
  const fields=apiFields(student),type=apiValue(fields,'placementType'),link=apiValue(fields,'linkID');
  const status=apiValue(fields,'status'),deleted=apiValue(fields,'delete_status');
  if(status!==undefined && String(status)!=='1' || deleted!==undefined && String(deleted)!=='0')return false;
  if(type===undefined && link===undefined)return true;
  if(typeof type!=='string' || !['string','number'].includes(typeof link) || !/^[1-9][0-9]*$/.test(String(link)) || !Number.isSafeInteger(Number(link)))return false;
  return kind==='program' ? type==='course' && String(link)===id
    : type==='school' && String(link)===id || type==='course' && !!offered?.includes(String(link));
}

/** Move a repeated CMS placement CTA into the template's single link. */
export function academicPlacementCopy(source: string, link = ''): { html: string; href: string } {
  const target=(value:string)=>{if(!value.trim() || value.trim()==='#')return '';const href=resolveSiteHref(value);return /^(?:\/(?!\/)|https?:\/\/)/i.test(href)?href:'';};
  let href=link ? target(link) : '';
  if(typeof DOMParser==='undefined')return {html:source,href};
  const doc=new DOMParser().parseFromString(source,'text/html');
  const isMore=(node:Element)=>apiPlain(node.textContent).replace(/[^a-z0-9]/gi,'').toLowerCase()==='readmore';
  for(const anchor of Array.from(doc.querySelectorAll('a[href]'))){
    if(!isMore(anchor))continue;
    const url=target(anchor.getAttribute('href') || '');if(!url)continue;
    if(!href)href=url;
    if(url!==href)continue;
    const parent=anchor.parentElement;anchor.remove();
    if(parent && parent!==doc.body && !apiPlain(parent.innerHTML) && !parent.querySelector('img,table,video'))parent.remove();
  }
  if(href)for(const node of Array.from(doc.querySelectorAll('p')))if(isMore(node) && !node.querySelector('a,img,table'))node.remove();
  return {html:doc.body.innerHTML,href};
}
