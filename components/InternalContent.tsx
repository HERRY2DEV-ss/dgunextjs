'use client';
import { createContext, useContext, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import SlidingTabList from './SlidingTabList';
import StepSlider from './StepSlider';
import ApiRichText from './ApiRichText';
import { usePageMenuOpen } from './LocalPageShell';
import { internalContentLayout, type ContentBlock, type ContentSection } from './internal-content-layout';
import './internal-pages.css';
import './internal-pages-responsive.css';
const ApiContentContext=createContext(false);
function ContentHtml({html}:{html:string}) {
  const api=useContext(ApiContentContext);
  return api?<ApiRichText html={html} scrollTables/>:<div  className="internal-source" dangerouslySetInnerHTML={{__html:html}}/>;
}

function MediaRail({html,size=2}:{html:string;size?:number}) {
  const menuOpen=usePageMenuOpen(),[paused,setPaused]=useState(false);
  // Only image-only blocks enter this rail. Exact source URLs and alt text are retained.
  const images=html.match(/<img\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi)||[];
  return <div className="internal-media-rail">
    <StepSlider label="Campus photographs" loop size={size} mobileSize={1} controls horizontalOnMobile interval={3600} paused={menuOpen||paused} mouseDrag>
      {images.map((image,index)=><figure key={index}><ContentHtml html={image}/></figure>)}
    </StepSlider>
    <button className="internal-pause" type="button" aria-pressed={paused} onClick={()=>setPaused(value=>!value)}>{paused?'Play':'Pause'} photographs</button>
  </div>;
}
function Blocks({blocks}:{blocks:ContentBlock[]}) {
  return <>{blocks.map((block,index)=>block.images?.length?<div className="internal-spotlight" key={index}><MediaRail html={block.images.join('')} size={1}/><div className="internal-copy-block"><ContentHtml html={block.html}/></div></div>:block.media?<MediaRail key={index} html={block.html}/>:<div className={`internal-copy-block${block.title?' internal-source-title':''}`} key={index}><ContentHtml html={block.html}/></div>)}</>;
}
function Sections({sections,mode,heading='h2'}:{sections:ContentSection[];mode:'reading'|'tabs'|'accordion';heading?:'h2'|'h3'}) {
  const Heading=heading;
  const id=useId().replace(/:/g,''), [active,setActive]=useState(0), [open,setOpen]=useState<number|null>(null);
  const keys=(event:KeyboardEvent<HTMLButtonElement>,index:number)=>{
    const next=event.key==='ArrowRight'?(index+1)%sections.length:event.key==='ArrowLeft'?(index-1+sections.length)%sections.length:event.key==='Home'?0:event.key==='End'?sections.length-1:null;
    if(next===null)return;event.preventDefault();setActive(next);document.getElementById(`${id}-tab-${next}`)?.focus({preventScroll:true});
  };
  if(mode==='tabs')return <section className="internal-section internal-tabs-section">
    <SlidingTabList activeKey={active} className="internal-tabs" aria-label="Page sections">{sections.map((section,index)=><button key={index} type="button" role="tab" id={`${id}-tab-${index}`} aria-selected={active===index} aria-controls={`${id}-panel-${index}`} tabIndex={active===index?0:-1} onClick={()=>setActive(index)} onKeyDown={event=>keys(event,index)}>{section.title}</button>)}</SlidingTabList>
    {sections.map((section,index)=><div className="internal-tab-panel" key={index} id={`${id}-panel-${index}`} role="tabpanel" aria-labelledby={`${id}-tab-${index}`} hidden={active!==index} tabIndex={0}><Blocks blocks={section.blocks}/></div>)}
  </section>;
  if(mode==='accordion')return <div className="internal-accordions">{sections.map((section,index)=>{
    const expanded=open===index;
    return <section className="internal-accordion" key={index} data-open={expanded}>
      <Heading><button type="button" id={`${id}-trigger-${index}`} aria-expanded={expanded} aria-controls={`${id}-answer-${index}`} onClick={()=>setOpen(value=>value===index?null:index)}><span className="internal-accordion-label">{section.title}</span><span className="internal-accordion-icon" aria-hidden="true">{expanded?'−':'+'}</span></button></Heading>
      <div className="internal-accordion-transition" inert={!expanded} aria-hidden={!expanded}><div><div className="internal-accordion-answer" id={`${id}-answer-${index}`} role="region" aria-labelledby={`${id}-trigger-${index}`}><Blocks blocks={section.blocks}/></div></div></div>
    </section>;
  })}</div>;
  return <>{sections.map((section,index)=>{
    const questions=/\bfaq|frequently asked|common questions/i.test(section.title);
    const level=Math.min(...section.blocks.slice(1).filter(block=>block.title).map(block=>block.level!));
    const groups:ContentSection[]=[],lead:ContentBlock[]=[];
    if(questions)for(const block of section.blocks){if(block.level===level&&block.title)groups.push({title:block.title,blocks:[]});(groups.length?groups[groups.length-1].blocks:lead).push(block);}
    return <section className="internal-section" key={index}>{questions&&groups.length>1?<><Blocks blocks={lead}/><Sections sections={groups} mode="accordion" heading="h3"/></>:<Blocks blocks={section.blocks}/>}</section>;
  })}</>;
}
/** Works for current stored copy and future API HTML without replacing their source. */
export default function InternalContent({html,slug='',className='',api=false}:{html:string;slug?:string;className?:string;api?:boolean}) {
  const layout=useMemo(()=>internalContentLayout(html,slug),[html,slug]),root=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const node=root.current;if(!node)return;
    // Native details from the original content follow the same single-open rule.
    const toggled=(event:Event)=>{const detail=event.target;if(!(detail instanceof HTMLDetailsElement)||!detail.open)return;node.querySelectorAll('details[open]').forEach(other=>{if(other!==detail&&!other.contains(detail)&&!detail.contains(other))other.removeAttribute('open');});};
    node.addEventListener('toggle',toggled,true);return()=>node.removeEventListener('toggle',toggled,true);
  },[html]);
  return <ApiContentContext.Provider value={api}><div ref={root} className={`internal-content local-article ${className}`} data-internal-content={slug}>
    {!!layout.intro.length&&<section className="internal-section internal-introduction"><Blocks blocks={layout.intro}/></section>}
    <Sections key={slug+html} sections={layout.sections} mode={layout.mode}/>
  </div></ApiContentContext.Provider>;
}
