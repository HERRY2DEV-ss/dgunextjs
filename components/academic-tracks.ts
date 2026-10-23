import { apiPlain } from './dgu-content-api';

export type AcademicTrack = { title: string; html: string };
/** CMS tracks use toggle-title/toggle-content, independently of admission tabs. */
export function academicTracks(source: string): { html: string; heading:string; tracks: AcademicTrack[] } {
  if(typeof DOMParser==='undefined')return {html:source,heading:'',tracks:[]};
  const doc=new DOMParser().parseFromString(source,'text/html'),tracks:AcademicTrack[]=[];
  let heading='';
  for(const toggle of Array.from(doc.querySelectorAll('.toggle'))){
    const titleNode=toggle.querySelector('.toggle-title'),content=toggle.querySelector('.toggle-content');
    const name=apiPlain(titleNode?.textContent);
    const match=name.match(/^(MBA\s+(?:in|with\s+Specialization\s+in)\s+.+?\s+Tracks?)\s*[-–—:]\s*(.+)$/i);
    if(!match || !content || !apiPlain(content.innerHTML) && !content.querySelector('img,table'))continue;
    if(!heading)heading=match[1];
    tracks.push({title:match[2],html:content.innerHTML});
    toggle.remove();
  }
  if(/^MBA in Human Resource Track$/i.test(heading))heading='MBA in Human Resource Tracks';
  if(/^MBA in Finance Track$/i.test(heading))for(const track of tracks)if(/^FinTech$/i.test(track.title))track.title='Track - FinTech';
  return {html:doc.body.innerHTML,heading,tracks};
}
export const humanResourceTracks=academicTracks;

/** Full DOM ranges preserve tables, lists, and unique paragraphs in each track. */
export function trackAccordions(source: string): AcademicTrack[] {
  if(typeof DOMParser==='undefined')return [{title:'Track Overview',html:source}];
  const doc=new DOMParser().parseFromString(source,'text/html');
  const all=Array.from(doc.body.querySelectorAll('h1,h2,h3,h4,h5,h6')).filter(node=>!node.closest('table,li'));
  const level=Math.min(...all.map(node=>Number(node.tagName.slice(1))));
  const headings=all.filter(node=>Number(node.tagName.slice(1))===level);
  const range=(start:Element|null,end:Element|null)=>{
    const selection=doc.createRange();selection.selectNodeContents(doc.body);
    if(start)selection.setStartAfter(start);if(end)selection.setEndBefore(end);
    const holder=doc.createElement('div');holder.append(selection.cloneContents());return holder.innerHTML;
  };
  const meaningful=(html:string)=>!!apiPlain(html)||/<(img|table)\b/i.test(html);
  const intro=range(null,headings[0]||null);
  return [...(meaningful(intro)?[{title:'Track Overview',html:intro}]:[]),...headings.flatMap((heading,index)=>{
    const html=range(heading,headings[index+1]||null);return meaningful(html)?[{title:apiPlain(heading.textContent),html}]:[];
  })];
}
