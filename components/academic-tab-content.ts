import { apiPlain } from './dgu-content-api';
import type { AcademicSection } from './academic-page-api';

type SemesterTableGroup = {
  title: string;
  start: number;
  end: number;
  rows: { parent: Element | null; row: HTMLTableRowElement }[];
};

function semesterTitle(value: string): string {
  const title = apiPlain(value).replace(/\s+/g, ' ').trim();
  return /^(?:(?:the\s+)?semester\s+(?:[1-8]|i{1,3}|iv|v|vi{0,3})|(?:first|second|third|fourth|fifth|sixth|seventh|eighth)\s+semester)$/i.test(title)
    ? title
    : '';
}

function splitSemesterTable(table: HTMLTableElement): { recognized: boolean; sections: AcademicSection[] } {
  const rows = Array.from(table.querySelectorAll('tr')).filter(row => row.closest('table') === table);
  const occupiedUntil = new Map<number, number>();
  let safeGrid = true;
  const positionedRows = rows.map((row, rowIndex) => {
    let column = 0;
    const cells = Array.from(row.children)
      .filter(cell => cell.tagName === 'TH' || cell.tagName === 'TD')
      .map(cell => {
        while ((occupiedUntil.get(column) ?? -1) >= rowIndex) column++;
        const rawColspan = Number(cell.getAttribute('colspan') || 1);
        const rawRowspan = Number(cell.getAttribute('rowspan') || 1);
        const validColspan = Number.isSafeInteger(rawColspan) && rawColspan > 0 && rawColspan <= 100;
        const validRowspan = Number.isSafeInteger(rawRowspan) && rawRowspan > 0 && rawRowspan <= 100;
        if (!validColspan || !validRowspan) safeGrid = false;
        const colspan = validColspan ? rawColspan : 1;
        const rowspan = validRowspan ? rawRowspan : 1;
        const start = column;
        column += colspan;
        for (let index = start; index < column; index++) {
          occupiedUntil.set(index, Math.max(occupiedUntil.get(index) ?? -1, rowIndex + rowspan - 1));
        }
        return { cell: cell as HTMLTableCellElement, start, end: column };
      });
    return { row, cells };
  });
  const recognized = positionedRows.some(({ cells }) => cells.some(({ cell }) => semesterTitle(cell.textContent || '')));
  if (!recognized) return { recognized: false, sections: [] };
  if (!safeGrid) return { recognized: true, sections: [] };

  const groups: SemesterTableGroup[] = [];
  const activeColumns = new Map<number, SemesterTableGroup>();
  let safe = true;
  for (const { row, cells } of positionedRows) {
    const headings = cells.filter(({ cell }) => semesterTitle(cell.textContent || ''));
    if (headings.length) {
      for (const heading of headings) {
        const title = semesterTitle(heading.cell.textContent || '');
        let group = groups.find(item => item.title === title && item.start === heading.start && item.end === heading.end);
        if (!group) {
          group = { title, start: heading.start, end: heading.end, rows: [] };
          groups.push(group);
        }
        for (let index = heading.start; index < heading.end; index++) activeColumns.set(index, group);
      }
      if (cells.some(({ cell }) => !semesterTitle(cell.textContent || '') && (apiPlain(cell.textContent) || cell.querySelector('img,a,table')))) safe = false;
      continue;
    }

    const rowGroups = new Map<SemesterTableGroup, HTMLTableCellElement[]>();
    for (const { cell, start, end } of cells) {
      const cellOwners = Array.from({ length: end - start }, (_, offset) => activeColumns.get(start + offset));
      const owners = new Set(cellOwners.filter((group): group is SemesterTableGroup => !!group));
      if (owners.size !== 1 || cellOwners.some(group => !group)) {
        if (apiPlain(cell.textContent) || cell.querySelector('img,a,table')) safe = false;
        continue;
      }
      const group = owners.values().next().value as SemesterTableGroup;
      rowGroups.set(group, [...(rowGroups.get(group) || []), cell]);
    }
    for (const [group, rowCells] of rowGroups) {
      const copy = row.cloneNode(false) as HTMLTableRowElement;
      rowCells.forEach(cell => copy.append(cell.cloneNode(true)));
      group.rows.push({ parent: row.parentElement, row: copy });
    }
  }
  if (!safe) return { recognized: true, sections: [] };

  const sections = groups.flatMap(group => {
    if (!group.rows.length) return [];
    const copy = table.cloneNode(false) as HTMLTableElement;
    const containers = new Map<Element, Element>();
    for (const child of Array.from(table.children)) {
      if (/^(THEAD|TBODY|TFOOT)$/.test(child.tagName)) {
        const container = child.cloneNode(false) as Element;
        copy.append(container);
        containers.set(child, container);
      } else if (child.tagName !== 'TR') {
        copy.append(child.cloneNode(true));
      }
    }
    for (const entry of group.rows) {
      const container = entry.parent ? containers.get(entry.parent) : undefined;
      (container || copy).append(entry.row);
    }
    return [{ title: group.title, html: copy.outerHTML }];
  });
  return { recognized: true, sections };
}

/** Split semester columns in API tables without exposing the original table twice. */
export function academicSemesterContent(source: string): { intro: string; sections: AcademicSection[]; handled: boolean } {
  if (typeof DOMParser === 'undefined') return { intro: '', sections: [], handled: false };
  const doc = new DOMParser().parseFromString(source, 'text/html');
  const sections: AcademicSection[] = [];
  let handled = false;
  for (const table of Array.from(doc.body.querySelectorAll('table'))) {
    const result = splitSemesterTable(table);
    if (!result.recognized) continue;
    handled = true;
    sections.push(...result.sections);
    table.remove();
  }
  return { intro: handled ? doc.body.innerHTML : source, sections, handled };
}

/** Split semester headings from API HTML while preserving each semester's own tables and copy. */
export function academicTabContent(source:string, includeHeadings=false, includeAllHeadingLevels=false): {intro:string;sections:AcademicSection[]} {
  if(typeof DOMParser==='undefined')return {intro:source,sections:[]};
  const doc=new DOMParser().parseFromString(source,'text/html');
  const semesterPattern=/^(?:(?:the\s+)?semester\s*(?:[-:：.]\s*)?(?:[1-8]|[ivxlcdm]+)|(?:first|second|third|fourth|fifth|sixth|seventh|eighth)\s+semester)(?:\s*[:：.-].*)?$/i;
  const titleOf=(node:Element)=>apiPlain(node.textContent).replace(/\s+/g,' ').trim();
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

/** Extract the facilities heading and its following content for an accordion. */
export function academicLearningEnvironmentSection(source:string): {before:string;section:AcademicSection;after:string}|null {
  if(typeof DOMParser==='undefined')return null;
  const doc=new DOMParser().parseFromString(source,'text/html');
  const headings=Array.from(doc.body.querySelectorAll('h1,h2,h3,h4,h5,h6')).filter(node=>
    apiPlain(node.textContent).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()==='state of the art learning environment'
  );
  const heading=headings[0];
  if(!heading)return null;
  const allHeadings=Array.from(doc.body.querySelectorAll('h1,h2,h3,h4,h5,h6'));
  const headingIndex=allHeadings.indexOf(heading),level=Number(heading.tagName.slice(1));
  const next=allHeadings.find((node,index)=>index>headingIndex&&Number(node.tagName.slice(1))<=level)||null;
  const fragment=(start:Element|null,end:Element|null)=>{
    const range=doc.createRange();
    range.selectNodeContents(doc.body);
    if(start)range.setStartAfter(start);
    if(end)range.setEndBefore(end);
    const content=doc.createElement('div');
    content.append(range.cloneContents());
    return content.innerHTML;
  };
  let after='';
  if(next){
    const range=doc.createRange();
    range.selectNodeContents(doc.body);
    range.setStartBefore(next);
    const content=doc.createElement('div');
    content.append(range.cloneContents());
    after=content.innerHTML;
  }
  const sectionHtml=fragment(heading,next);
  if(!apiPlain(sectionHtml)&&!/<(img|table|a)\b/i.test(sectionHtml))return null;
  return {
    before:fragment(null,heading),
    section:{title:apiPlain(heading.textContent),html:sectionHtml},
    after,
  };
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

/** Split numbered specialization columns into accordion items, keeping surrounding copy in place. */
export function academicSpecializationAccordionContent(source:string): {intro:string;sections:AcademicSection[]}|null {
  if(typeof DOMParser==='undefined')return null;
  const doc=new DOMParser().parseFromString(source,'text/html');
  for(const row of Array.from(doc.body.querySelectorAll('.row,.dgu-api-row'))){
    const sections=Array.from(row.children).flatMap(column=>{
      const content=column.cloneNode(true) as Element;
      const heading=Array.from(content.querySelectorAll('p')).map(paragraph=>({
        paragraph,label:paragraph.querySelector('b,strong'),
      })).find(item=>item.label && /^\s*\d+\.\s*/.test(apiPlain(item.label.textContent)));
      if(!heading?.label)return [];
      const title=apiPlain(heading.label.textContent).replace(/^\s*\d+\.\s*/,'').trim();
      if(!title)return [];
      const lineBreak=heading.label.nextSibling;
      heading.label.remove();
      if(lineBreak?.nodeType===1 && (lineBreak as Element).tagName==='BR')lineBreak.parentNode?.removeChild(lineBreak);
      if(!apiPlain(heading.paragraph.textContent) && !heading.paragraph.querySelector('img,table,a'))heading.paragraph.remove();
      return [{title,html:content.innerHTML}];
    });
    if(sections.length<2)continue;
    row.remove();
    return {intro:doc.body.innerHTML,sections};
  }
  return null;
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
