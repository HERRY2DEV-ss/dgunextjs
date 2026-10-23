import { apiPlain } from './dgu-content-api';
import type { AcademicSection } from './academic-page-api';

/** Semester titles are CMS divs; preserve all text/tables when folding DOM ranges. */
export function academicTabContent(source:string, includeHeadings=false): {intro:string;sections:AcademicSection[]} {
  if(typeof DOMParser==='undefined')return {intro:source,sections:[]};
  const doc=new DOMParser().parseFromString(source,'text/html');
  const semesters=Array.from(doc.querySelectorAll('.semester-title')).filter(node=>!node.closest('table,li'));
  const headings=Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6')).filter(node=>!node.closest('table,li'));
  const level=Math.min(...headings.map(node=>Number(node.tagName.slice(1))));
  const boundaries=Array.from(doc.querySelectorAll('.semester-title,h1,h2,h3,h4,h5,h6')).filter(node=>!node.closest('table,li') && (semesters.includes(node) || (includeHeadings || semesters.length>1) && Number(node.tagName.slice(1))===level));
  if(boundaries.length<2)return {intro:source,sections:[]};
  const fragment=(start:Element|null,end:Element|null)=>{const range=doc.createRange();range.selectNodeContents(doc.body);if(start)range.setStartAfter(start);if(end)range.setEndBefore(end);const node=doc.createElement('div');node.append(range.cloneContents());return node.innerHTML;};
  return {intro:fragment(null,boundaries[0]),sections:boundaries.map((node,index)=>({title:apiPlain(node.textContent),html:fragment(node,boundaries[index+1] || null)}))};
}
