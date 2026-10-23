import { apiMedia, apiPlain, apiText } from './dgu-content-api';

/** Both API generations use this verified upload directory for student portraits. */
export function academicStudentImage(value: unknown): string {
  const raw = apiText(value);
  const image = apiMedia(raw && !/[/:]/.test(raw) && /\.(?:webp|png|jpe?g|gif)(?:[?#]|$)/i.test(raw) ? '/uploads/images/placement/' + raw : raw);
  if (!image) return '';
  const url = new URL(image);
  if (['dgu.ac.in', 'www.dgu.ac.in'].includes(url.hostname)) {
    url.pathname = url.pathname.replace(/^\/uploads\/images\/placements\//i, '/uploads/images/placement/');
  }
  return url.href;
}

export const academicImageSource = (image: Element) => ['data-src','data-lazy-src','src'].map(name=>apiMedia(image.getAttribute(name))).find(Boolean) || '';

/** Move real CMS carousel images into the existing theme's sliders; discard duplicate loop copies. */
export function academicGallery(source:string,international=false) {
  const result:{html:string;photos:{src:string;alt:string}[];partners:{name:string;logo:string}[]}={html:source,photos:[],partners:[]};
  if(typeof DOMParser==='undefined')return result;
  const d=new DOMParser().parseFromString(source,'text/html'),seen=new Set<string>();
  for(const image of d.querySelectorAll('img')){
    if(!international&&!image.closest('[class*="slider"],[class*="track"],.dgu-gx__media'))continue;
    const src=academicImageSource(image),alt=apiPlain(image.getAttribute('alt'));
    if(src&&!seen.has(src)){
      seen.add(src);
      if(international&&/\/logo[^/]*\.(?:webp|jpe?g|png|svg)/i.test(src))result.partners.push({name:alt,logo:src});
      else result.photos.push({src,alt});
    }
    image.remove();
  }
  result.html=d.body.innerHTML;
  return result;
}
