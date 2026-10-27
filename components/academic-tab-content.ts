import { apiPlain } from './dgu-content-api';
import type { AcademicSection } from './academic-page-api';

/** Split semester headings from API HTML while preserving each semester's own tables and copy. */
export function academicTabContent(source:string, includeHeadings=false, includeAllHeadingLevels=false): {intro:string;sections:AcademicSection[]} {
  if(typeof DOMParser==='undefined')return {intro:source,sections:[]};
  const doc=new DOMParser().parseFromString(source,'text/html');
  const semesterPattern=/^(?:(?:the\\s+)?semester\\s*(?:[-:：.]\\s*)?(?:[1-8]|[ivxlcdm]+)|(?:first|second|third|fourth|fifth|sixth|seventh|eighth)\\s+semester)(?:\\s*[:：.-].*)?$/i;
  const titleOf=(node:Element)=>apiPlain(node.textContent).replace(/\\s+/g,' ').trim();
  const semesterNodes=Array.from(doc.body.querySelectorAll('.semester-title,h1,h2,h3,h4,h5,h6,p,div,strong,b,span'))
    .filter(node=>!node.closest('table,li') && semesterPattern.test(titleOf(node)));
  // If a wrapper and its child both repeat the same title, use the innermost match.
  const semesters=semesterNodes.filter(node=>!semesterNodes.some(other=>other!==node && node.contains(other)));
  if(semesters.length>=2){
    const fragment=(start:Element|null,end:Element|null)=>{
      const range=doc.createRange();range.selectNodeContents(doc.body);
      if(start)range.setStartAfter(start);if(end)range.setEndBefore(end);
      const node=doc.createElement('div');node.append(range.cloneContents());return node.innerHTML;
    };
    return {intro:fragment(null,semesters[0]),sections:semesters.map((node,index)=>({title:titleOf(node),html:fragment(node,semesters[index+1]||null)}))};
  }
  const headings=Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6')).filter(node=>!node.closest('table,li'));
  if(!includeHeadings || headings.length<2)return {intro:source,sections:[]};
  const level=Math.min(...headings.map(node=>Number(node.tagName.slice(1))));
  const boundaries=headings.filter(node=>includeAllHeadingLevels || Number(node.tagName.slice(1))===level);
  if(boundaries.length<2)return {intro:source,sections:[]};
  const fragment=(start:Element|null,end:Element|null)=>{const range=doc.createRange();range.selectNodeContents(doc.body);if(start)range.setStartAfter(start);if(end)range.setEndBefore(end);const node=doc.createElement('div');node.append(range.cloneContents());return node.innerHTML;};
  return {intro:fragment(null,boundaries[0]),sections:boundaries.map((node,index)=>({title:titleOf(node),html:fragment(node,boundaries[index+1]||null)}))};
}

/** Keep a page-specific multi-heading tab inside one existing accordion item. */
export function academicSingleAccordionSection(parts:{intro:string;sections:AcademicSection[]}): AcademicSection | null {
  if(!parts.sections.length)return null;
  return {
    title:parts.sections.map(section=>section.title).join(' / '),
    html:parts.intro + parts.sections.map(section=>section.html).join(''),
  };
}

/** Extract API-provided career titles and their content from CMS column groups. */
export function academicCareerAccordionSections(source:string): AcademicSection[] {
  if(typeof DOMParser==='undefined')return [];
  const doc=new DOMParser().parseFromString(source,'text/html');
  const rows=Array.from(doc.querySelectorAll('.row'));
  const columns=rows.map(row=>Array.from(row.children).filter(column=>
    Array.from(column.classList).some(name=>/^col-/.test(name)) &&
    Array.from(column.children).some(child=>/^H[1-6]$/.test(child.tagName))
  )).find(items=>items.length>1) || [];
  return columns.flatMap(column=>{
    const content=column.cloneNode(true) as Element;
    const heading=Array.from(content.children).find(child=>/^H[1-6]$/.test(child.tagName));
    const title=apiPlain(heading?.textContent);
    if(!title || !heading)return [];
    heading.remove();
    const html=content.innerHTML;
    return apiPlain(html) ? [{title,html}] : [];
  });
}

/** Preserve each API column while promoting its first paragraph to a card heading. */
export function academicColumnSections(source:string): AcademicSection[] {
  if(typeof DOMParser==='undefined')return [];
  const doc=new DOMParser().parseFromString(source,'text/html');
  const rows=Array.from(doc.querySelectorAll('.row'));
  const columns=rows.map(row=>Array.from(row.children).filter(column=>
    Array.from(column.classList).some(name=>/^col-/.test(name))
  )).find(items=>items.length>1) || [];
  return columns.flatMap(column=>{
    const content=column.cloneNode(true) as Element;
    const heading=content.querySelector('h1,h2,h3,h4,h5,h6,p');
    const title=apiPlain(heading?.textContent);
    if(!title || !heading)return [];
    heading.remove();
    return [{title,html:content.innerHTML}];
  });
}
