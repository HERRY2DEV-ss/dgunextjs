import { apiPlain } from './dgu-content-api';
import type { AcademicInfo, AcademicSection } from './academic-page-api';

/** Exact CMS fragment links select their own published API page sections. */
export function academicLaboratories(section:AcademicSection,pages:AcademicInfo['linkedPages']) {
  const result:{intro:string;tabs:{title:string;html:string;href:string}[]}={intro:section.html,tabs:[]};
  if(typeof DOMParser==='undefined')return result;
  const doc=new DOMParser().parseFromString(section.html,'text/html'),seen=new Set<string>();
  for(const link of Array.from(doc.querySelectorAll('a[href]'))){
    const href=link.getAttribute('href')||'',title=apiPlain(link.textContent);
    let url:URL;try{url=new URL(href,'https://dgu.ac.in');}catch{continue;}
    if(!title || !url.hash || !['http:','https:'].includes(url.protocol) || !['dgu.ac.in','www.dgu.ac.in'].includes(url.hostname))continue;
    const slug=url.pathname.replace(/^\/+|\/+$/g,''),page=pages.find(p=>p.url===slug);
    const content=page ? new DOMParser().parseFromString(page.html,'text/html') : null;
    let fragment:string;try{fragment=decodeURIComponent(url.hash.slice(1));}catch{continue;}
    const target=content?.getElementById(fragment);
    const html=target?.outerHTML || '';
    if(!seen.has(url.href)){seen.add(url.href);result.tabs.push({title,html,href:url.href});}
    link.remove();
  }
  for(const empty of Array.from(doc.querySelectorAll('p,li')))if(!apiPlain(empty.innerHTML)&&!empty.querySelector('img,table'))empty.remove();
  result.intro=doc.body.innerHTML;return result;
}
