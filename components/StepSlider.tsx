'use client';
import {Children,useCallback,useEffect,useRef,useState,type ReactNode,type CSSProperties} from 'react';
import {refreshLayout} from './refreshLayout';
export default function StepSlider({children,size=1,mobileSize=1,loop=false,interval=5500,paused=false,label,className='',controls=false,vertical=false,horizontalOnMobile=false,dots=false,dotWindow=0,overlayControls=false,hint='',pauseOnHover=false,mouseDrag=true,onPageChange}:{children:ReactNode;size?:number;mobileSize?:number;loop?:boolean;interval?:number;paused?:boolean;label:string;className?:string;controls?:boolean;vertical?:boolean;horizontalOnMobile?:boolean;dots?:boolean;dotWindow?:number;overlayControls?:boolean;hint?:string;pauseOnHover?:boolean;mouseDrag?:boolean;onPageChange?:(firstItem:number)=>void}){
 const items=Children.toArray(children),root=useRef<HTMLDivElement>(null);
 const mouse=useRef<{x:number;y:number}|null>(null),dragged=useRef(false);
 const [mobile,setMobile]=useState(false),[page,setPage]=useState(0),[height,setHeight]=useState(0),[visible,setVisible]=useState(false),[held,setHeld]=useState(false),[reduced,setReduced]=useState(false),[awake,setAwake]=useState(true);
 const axis=mobile?!horizontalOnMobile:vertical,pageSize=mobile?mobileSize:size,count=Math.ceil(items.length/pageSize),looping=loop&&count>1,current=looping?((page%count)+count)%count:Math.min(page,Math.max(0,count-1));
 const dotCount=dotWindow>0?Math.min(count,Math.max(1,Math.floor(dotWindow))):count;
 const dotStart=Math.max(0,Math.min(count-dotCount,current-Math.floor(dotCount/2)));
 const [jump,setJump]=useState(false);
 const live=useRef({current,count});
 useEffect(()=>{live.current={current,count};},[current,count]);
 useEffect(()=>{onPageChange?.(current*pageSize);},[current,pageSize,onPageChange]);
 const move=useCallback((d:number,wrap=false)=>setPage(v=>looping?(v<0||v>=count?v:Math.max(-1,Math.min(count,v+d))):wrap?(v+d+count)%Math.max(count,1):Math.max(0,Math.min(count-1,v+d))),[count,looping,setPage]);
 useEffect(()=>{if(!looping || page>=0&&page<count)return;const timer=setTimeout(()=>{setJump(true);setPage(current);},reduced?0:660);return()=>clearTimeout(timer);},[looping,page,count,current,reduced]);
 useEffect(()=>{if(!jump)return;let next=0;const frame=requestAnimationFrame(()=>{next=requestAnimationFrame(()=>setJump(false));});return()=>{cancelAnimationFrame(frame);cancelAnimationFrame(next);};},[jump]);
 useEffect(()=>{
  const media=matchMedia('(max-width:700px)'),motion=matchMedia('(prefers-reduced-motion:reduce)');
  const sync=()=>{setMobile(media.matches);setReduced(motion.matches);},wake=()=>setAwake(!document.hidden);
  sync();wake();media.addEventListener('change',sync);motion.addEventListener('change',sync);document.addEventListener('visibilitychange',wake);
  const observer=new IntersectionObserver(([e])=>setVisible(e.isIntersecting),{threshold:.15});if(root.current)observer.observe(root.current);
  return()=>{observer.disconnect();media.removeEventListener('change',sync);motion.removeEventListener('change',sync);document.removeEventListener('visibilitychange',wake);};
 },[]);
 useEffect(()=>setPage(0),[pageSize]);
 useEffect(()=>{if(height)refreshLayout();},[height]);
 useEffect(()=>{const slide=root.current?.querySelector<HTMLElement>(`[data-page="${current}"]`);if(!slide)return;const resize=new ResizeObserver(()=>setHeight(slide.offsetHeight));resize.observe(slide);setHeight(slide.offsetHeight);return()=>resize.disconnect();},[current,pageSize,children]);
 useEffect(()=>{if(count<2||paused||held||!visible||reduced||!awake||looping&&(page<0||page>=count))return;const timer=setTimeout(()=>move(1,true),interval);return()=>clearTimeout(timer);},[current,count,paused,held,visible,reduced,awake,interval,move,looping,page]);
 useEffect(()=>{
  const node=root.current;if(!node)return;
  let start=0,delta=0,consumed=false,lastWheel=0,sum=0;
  const can=(d:number)=>looping?count>1:d>0?live.current.current<live.current.count-1:live.current.current>0;
  const down=(e:TouchEvent)=>{start=axis?e.touches[0].clientY:e.touches[0].clientX;delta=0;consumed=false;setHeld(true);};
  const drag=(e:TouchEvent)=>{if(e.touches.length!==1)return;delta=start-(axis?e.touches[0].clientY:e.touches[0].clientX);if(Math.abs(delta)>8&&can(delta)){if(e.cancelable)e.preventDefault();consumed=true;}};
  const up=()=>{if(consumed&&Math.abs(delta)>28)move(delta>0?1:-1);delta=0;setHeld(false);};
  const cancel=()=>{delta=0;setHeld(false);};
  const wheel=(e:WheelEvent)=>{const d=axis?e.deltaY:e.deltaX;if(Math.abs(d)<2)return;const now=performance.now(),gap=now-lastWheel;lastWheel=now;if(gap>240){consumed=false;sum=0;}if(consumed){if(e.cancelable)e.preventDefault();e.stopPropagation();return;}if(!can(d))return;e.preventDefault();e.stopPropagation();sum+=d;if(Math.abs(sum)>35){consumed=true;move(sum>0?1:-1);}};
  node.addEventListener('touchstart',down,{passive:true});node.addEventListener('touchmove',drag,{passive:false});node.addEventListener('touchend',up);node.addEventListener('touchcancel',cancel);node.addEventListener('wheel',wheel,{passive:false});
  return()=>{node.removeEventListener('touchstart',down);node.removeEventListener('touchmove',drag);node.removeEventListener('touchend',up);node.removeEventListener('touchcancel',cancel);node.removeEventListener('wheel',wheel);};
 },[axis,move,looping,count]);
 return <div ref={root} className={`batch-slider ${className} ${axis?'batch-vertical':''}${looping?' batch-loop':''}`} role="region" aria-roledescription="carousel" aria-label={label} tabIndex={0}
 onMouseEnter={()=>{if(pauseOnHover)setHeld(true);}} onMouseLeave={()=>{if(pauseOnHover)setHeld(false);}} onFocus={e=>{const target=e.target as HTMLElement;setHeld(pauseOnHover&&target.matches(':focus-visible')&&!target.closest('.batch-controls'));}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setHeld(false);}}
 onPointerDown={e=>{if(!mouseDrag||e.pointerType!=='mouse'||e.button!==0||count<2||(e.target as HTMLElement).closest('.batch-controls,.batch-overlay-controls'))return;mouse.current={x:e.clientX,y:e.clientY};dragged.current=false;e.currentTarget.setPointerCapture?.(e.pointerId);}}
 onPointerMove={e=>{if(!mouse.current)return;const dx=e.clientX-mouse.current.x,dy=e.clientY-mouse.current.y,delta=axis?dy:dx,cross=axis?dx:dy;if(Math.abs(delta)>36&&Math.abs(delta)>Math.abs(cross)*1.2){dragged.current=true;mouse.current=null;move(delta<0?1:-1,true);}}}
 onPointerUp={()=>{mouse.current=null;}} onPointerCancel={()=>{mouse.current=null;dragged.current=false;}}
 onDragStart={e=>{if(mouseDrag)e.preventDefault();}}
 onClickCapture={e=>{if(dragged.current){e.preventDefault();e.stopPropagation();dragged.current=false;}}}
 onKeyDown={e=>{if(e.target!==e.currentTarget)return;const next=axis?'ArrowDown':'ArrowRight',prev=axis?'ArrowUp':'ArrowLeft';if(e.key===next||e.key===prev){e.preventDefault();move(e.key===next?1:-1);}}}>
 <div className="batch-window" style={axis&&height?{height}:undefined}><div className="batch-track" style={looping?{transform:axis?`translateY(${-page*110}%)`:`translateX(-${(page+1)*100}%)`,transition:jump||reduced?'none':'transform .65s cubic-bezier(.22,1,.36,1)'}:axis?undefined:{transform:`translateX(-${current*100}%)`}}>
 {Array.from({length:count+(looping?2:0)},(_,frame)=>{
  const visual=looping?frame-1:frame,i=looping?(visual+count)%count:frame,copy=looping&&(visual<0||visual>=count);
  const batch=items.slice(i*pageSize,(i+1)*pageSize),filled=batch.length;
  if(loop && items.length>1)while(batch.length<pageSize)batch.push(items[(batch.length-filled)%items.length]);
  return <div key={visual} data-page={copy?undefined:i} data-loop-copy={copy || undefined} className="batch-page" inert={copy||i!==current} aria-hidden={copy||i!==current} role="group" aria-label={`${i+1} of ${count}`} style={{'--batch-size':pageSize,...(axis?{position:looping||height?'absolute':'relative',inset:looping||height?'0 0 auto':undefined,transform:`translateY(${(looping?visual:i-current)*110}%)`,visibility:!looping&&Math.abs(i-current)>1?'hidden':undefined}:{}),...(looping?{transition:'none'}:{})} as CSSProperties}>{batch}</div>;
 })}

 </div>{overlayControls&&count>1&&<div className="batch-overlay-controls"><button type="button" disabled={!looping&&current===0} aria-label={`Previous ${label}`} onClick={()=>move(-1,looping)}>‹</button><button type="button" disabled={!looping&&current===count-1} aria-label={`Next ${label}`} onClick={()=>move(1,looping)}>›</button></div>}</div>
 {(controls||axis)&&count>1&&<div className="batch-controls"><button type="button" disabled={!looping&&current===0} aria-label={`Previous ${label}`} onClick={()=>move(-1,looping)}>{axis?'↑':'‹'}</button>{dots&&<div className="batch-dots" aria-label={`${label} slides`}>{Array.from({length:dotCount},(_,offset)=>{const i=dotStart+offset;return <button key={i} className={i===current?'is-active':''} type="button" aria-label={`Go to slide ${i+1}`} aria-current={i===current?'true':undefined} onClick={()=>setPage(i)} />;})}</div>}<span>{current+1} / {count}{hint?` · ${hint}`:axis?' · Swipe ↑↓':''}</span><button type="button" disabled={!looping&&current===count-1} aria-label={`Next ${label}`} onClick={()=>move(1,looping)}>{axis?'↓':'›'}</button></div>}
 </div>;
}
