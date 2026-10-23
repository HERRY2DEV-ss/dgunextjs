'use client';
import { useEffect, useRef } from 'react';
const layers=['33','47','02'];
export default function DehradunReveal(){
 const root=useRef<HTMLElement>(null);
 useEffect(()=>{
  const node=root.current;if(!node)return;
  let visible=false;
  const sync=()=>node.classList.toggle('clouds-running',visible&&!document.hidden);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();});
  observer.observe(node);document.addEventListener('visibilitychange',sync);
  return()=>{observer.disconnect();document.removeEventListener('visibilitychange',sync);};
 },[]);
 return <section ref={root} className="era-campus-finale" aria-labelledby="dehradun-title">
  <div className="era-cloud-bridge" aria-hidden="true">
   {layers.map(layer=><div key={layer} className={`era-cloud-bank bank-${layer}`}><div className="era-cloud-track">
    {[0,1].map(copy=><div className="era-cloud-list" key={copy}>{[0,1].map(item=><div className="era-cloud-item" key={item}><img src={`/nextjs/homev1/assets/era-cloud-${layer}.avif`} alt="" className={`era-cloud-image cloud-${layer}`} loading="lazy"/></div>)}</div>)}
   </div></div>)}
  </div>
  <div className="era-title-wrap"><h2 id="dehradun-title" className="era-location-title"><span>Study in</span><strong>Dehradun</strong></h2></div>
  <div className="era-location">
   <div className="era-aerial-viewport"><div className="era-aerial-outer"><div className="era-aerial-inner"><img src="/nextjs/homev1/assets/footer-campus.webp" alt="Dehradun skyline and distant Himalayan foothills" width="1920" height="1680" loading="lazy"/></div></div></div>
   <div className="era-cloud-sky" aria-hidden="true">
    <div className="era-cloud-gradient"/>
    {layers.map(layer=><div key={layer} className={`era-cloud-bank bank-${layer}`}><div className="era-cloud-track">
     {[0,1].map(copy=><div className="era-cloud-list" key={copy}>{[0,1].map(item=><div className="era-cloud-item" key={item}><img src={`/nextjs/homev1/assets/era-cloud-${layer}.avif`} alt="" className={`era-cloud-image cloud-${layer}`} loading="lazy"/></div>)}</div>)}
    </div></div>)}
   </div>
  </div>
 </section>;
}
