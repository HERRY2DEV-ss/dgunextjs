/** Lossless presentation model for existing university content. No copy or API data is added. */
import { apiPlain } from './dgu-content-api';
export type ContentBlock = { html: string; title?: string; level?: number; media?: boolean; images?: string[] };
export type ContentSection = { title: string; blocks: ContentBlock[] };
export type InternalLayout = { intro: ContentBlock[]; sections: ContentSection[]; mode: 'reading' | 'tabs' | 'accordion' };
type Node = { tag: string; start: number; openEnd: number; end: number; attrs: string; children: Node[] };
const voids = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const wrappers = new Set(['div','section','article','main','header','footer']);
const inline = new Set(['span','strong','b','em','i','a','br','small','sup','sub']);
const atomicClasses = /\b(local-card-grid|local-content-card|local-table-scroll|local-profile-summary)\b/;
const spanSections = new Set(['facilities','international-collaborative-research-program','semester-abroad-with-credit-transfer','international-summer-schools']);
const tabPages = new Set(['modern-computer-labs','facilities','board-of-studies','international-collaborative-research-program','short-term-global-immersion','fully-sponsored-dgu-global-immersion-program','tuitions-free-semester-in-india-for-international-students']);
const accordionPages = /(?:fee-structure|programs-fee-structures|hostel-and-mess-fee|transportation-fee|refund-policy|privacy-policy|terms-and-conditions|public-self-disclosure|downloads|academic-calendar|scholarships|admission-requirements)$/;
export function contentText(source: string): string {
  return apiPlain(source);
}
function attribute(attrs: string, name: string): string {
  const value = attrs.match(new RegExp('(?:^|\\s)'+name+'\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i'));
  return value?.[1] ?? value?.[2] ?? value?.[3] ?? '';
}
function tree(source: string): Node {
  const root: Node = { tag:'root',start:0,openEnd:0,end:source.length,attrs:'',children:[] }, stack=[root];
  const tags=/<!--[\s\S]*?-->|<\/?([a-z][\w:-]*)\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi;
  let match: RegExpExecArray | null;
  while ((match=tags.exec(source))) {
    if(!match[1])continue;
    const tag=match[1].toLowerCase();
    if (match[0][1]==='/') {
      let index=stack.length-1;
      while(index>0&&stack[index].tag!==tag)index--;
      if(index>0){for(let i=stack.length-1;i>=index;i--)stack[i].end=tags.lastIndex;stack.length=index;}
    } else {
      const node:Node={tag,start:match.index,openEnd:tags.lastIndex,end:tags.lastIndex,attrs:match[0].slice(tag.length+1,-1),children:[]};
      stack[stack.length-1].children.push(node);
      if(!voids.has(tag)&&!match[0].endsWith('/>'))stack.push(node);
    }
  }
  for(const node of stack.slice(1))node.end=source.length;
  return root;
}
/** Wrapper-only CMS markup is flattened; paragraphs, links, tables, media and IDs survive. */
export function internalContentLayout(source: string, slug=''): InternalLayout {
  const root=tree(source), blocks:ContentBlock[]=[];
  const markup=(node:Node)=>source.slice(node.start,node.end);
  const descendants=(node:Node,predicate:(n:Node)=>boolean):Node[]=>node.children.flatMap(child=>[...(predicate(child)?[child]:[]),...descendants(child,predicate)]);
  const emit=(html:string,extra:Partial<ContentBlock>={})=>{if(html.trim())blocks.push({html,...extra});};
  const visit=(node:Node)=>{
    const html=markup(node), title=contentText(html), classes=attribute(node.attrs,'class');
    const headings=descendants(node,n=>/^h[2-6]$/.test(n.tag));
    const statCards=node.children.filter(child=>descendants(child,n=>/^h[2-6]$/.test(n.tag)).some(heading=>/^(?:\d[\d.,]*\+?|XX\+?)$/.test(contentText(markup(heading)))));
    if(statCards.length>1&&statCards.length===node.children.length){emit(`<div class="internal-stats-grid">${node.children.map(markup).join('')}</div>`);return;}
    if(slug==='contacts'&&node.children.length>1&&node.children.every(child=>descendants(child,n=>n.tag==='h4').length===1)){emit(`<div class="internal-office-grid">${node.children.map(markup).join('')}</div>`);return;}
    // Lab sections place their images before the heading. Keep that whole section together.
    if(slug==='modern-computer-labs'&&node.tag==='section'&&headings.length===1){
      const photos=descendants(node,n=>n.tag==='img');let copy=html;
      for(const photo of [...photos].reverse())copy=copy.slice(0,photo.start-node.start)+copy.slice(photo.end-node.start);
      emit(copy,{title:contentText(markup(headings[0])),level:2,images:photos.map(markup)});return;
    }
    if(/^h[2-6]$/.test(node.tag)){emit(html,title?{title,level:Number(node.tag[1])}:{});return;}
    const spanTitle=spanSections.has(slug)&&node.tag==='div'&&node.children.length===1&&node.children[0].tag==='span'&&title.length>0&&title.length<110;
    const feeTitle=accordionPages.test(slug)&&node.tag==='div'&&node.children.length===1&&node.children[0].tag==='span'&&title.length>0&&title.length<160;
    if(spanTitle||feeTitle){emit(html,{title,level:2});return;}
    if(wrappers.has(node.tag)&&node.children.every(child=>inline.has(child.tag))){emit(html);return;}
    if(atomicClasses.test(classes)||!wrappers.has(node.tag)){emit(html);return;}
    const images=descendants(node,n=>n.tag==='img');
    if(images.length>1&&!title&&!descendants(node,n=>['a','iframe','video','table'].includes(n.tag)).length){emit(html,{media:true});return;}
    const id=attribute(node.attrs,'id');
    if(id)emit(`<span class="internal-anchor" id="${id.replace(/"/g,'&quot;')}"></span>`);
    let cursor=node.openEnd;
    for(const child of node.children){emit(source.slice(cursor,child.start));visit(child);cursor=child.end;}
    const close=source.lastIndexOf('</',node.end-1);
    emit(source.slice(cursor,node.tag==='root'?node.end:Math.max(cursor,close)));
  };
  let cursor=0;
  for(const node of root.children){emit(source.slice(cursor,node.start));visit(node);cursor=node.end;}
  emit(source.slice(cursor));
  // Reading articles retain their heading hierarchy. Only comparable content becomes tabs.
  const mode:InternalLayout['mode']=tabPages.has(slug)?'tabs':accordionPages.test(slug)?'accordion':'reading';
  const levels=blocks.filter(block=>block.title&&block.title.length<=160).map(block=>block.level!);
  const level=slug==='board-of-studies'?5:Math.min(...levels);
  const intro:ContentBlock[]=[],sections:ContentSection[]=[];
  for(const block of blocks){
    if(block.title&&block.level===level&&block.title.length<=160)sections.push({title:block.title,blocks:[]});
    (sections.length?sections[sections.length-1].blocks:intro).push(block);
  }
  return {intro,sections,mode:sections.length>1?mode:'reading'};
}
