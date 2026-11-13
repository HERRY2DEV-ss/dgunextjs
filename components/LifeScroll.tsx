'use client';
import { sitePath } from './site-base';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ImgHTMLAttributes } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { campusScenes } from './campus-life-data';

function TourImage({fallback, enabled = true, src, ...props}: ImgHTMLAttributes<HTMLImageElement> & {fallback:string; enabled?:boolean}) {
  const image=useRef<HTMLImageElement>(null);
  const replace=useCallback(()=>{const node=image.current;if(enabled&&node&&!node.dataset.fallback){node.dataset.fallback='true';node.src=fallback;}},[enabled,fallback]);
  useEffect(()=>{const node=image.current;if(enabled&&node?.currentSrc&&node.complete&&!node.naturalWidth)replace();},[enabled,replace]);
  return <img {...props} src={enabled ? src : undefined} alt={props.alt || 'DBS Global University campus'} ref={image} onError={replace} />;
}

/** Faithful React conversion of the supplied GSAP master timeline. */
export default function LifeScroll({onImage}: {onImage:(title:string,image:string)=>void}) {
  const root=useRef<HTMLDivElement>(null);
  const [imagesEnabled,setImagesEnabled]=useState(false);
  useEffect(()=>{
    const node=root.current;
    if(!node)return;
    if(!('IntersectionObserver' in window)){
      const frame=requestAnimationFrame(()=>setImagesEnabled(true));
      return ()=>cancelAnimationFrame(frame);
    }
    const observer=new IntersectionObserver(([entry])=>{
      if(entry.isIntersecting){setImagesEnabled(true);observer.disconnect();}
    },{rootMargin:'700px 0px'});
    observer.observe(node);
    return ()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    const node=root.current;
    if(!node)return;
    gsap.registerPlugin(ScrollTrigger);
    const media=gsap.matchMedia();
    const context=gsap.context(()=>{
      media.add('(prefers-reduced-motion: no-preference)',()=>{
        node.classList.add('is-pinned');
        const mobile=window.matchMedia('(max-width:768px)').matches;
        const select=gsap.utils.selector(node);
        const slides=select('.pin-slide') as HTMLElement[];
        const progress=node.querySelector<HTMLElement>('.campus-progress');
        let active=-1;
        const syncAccessibility=()=>{
          let best=0,alpha=-1;
          slides.forEach((slide,i)=>{const value=Number(gsap.getProperty(slide,'opacity'));if(value>=alpha){alpha=value;best=i;}});
          if(best!==active){active=best;slides.forEach((slide,i)=>{slide.inert=i!==best;slide.setAttribute('aria-hidden',String(i!==best));});}
        };
        const timeline=gsap.timeline({
          onUpdate:syncAccessibility,
          scrollTrigger:{refreshPriority:1,trigger:node,start:'top top',end:()=>`+=${window.innerHeight*(mobile?campusScenes.length+.5:8)}`,pin:true,anticipatePin:1,scrub:.6,invalidateOnRefresh:true,
            snap:mobile ? undefined : {snapTo:'labelsDirectional',duration:{min:.22,max:.5},delay:.06,ease:'power2.inOut'},
            onUpdate:self=>{if(progress)progress.style.transform=`scaleX(${self.progress})`;}}
        });
        timeline.add('heroStart')
          .to(select('.campus-hero-line1, .campus-hero-line2, .campus-hero-sub, .campus-scroll-cue'),{y:-50,opacity:0,duration:1,stagger:.1},'heroStart')
          .to(select('.campus-hero-bg'),{scale:1.2,duration:1.5},'heroStart')
          .to(select('.campus-hero'),{autoAlpha:0,duration:1},'heroStart+=1');
        const build=(id:string,label:string)=>{
          const selector=`[data-campus-slide="${id}"]`;
          timeline.to(select(selector),{autoAlpha:1,zIndex:2,duration:1.2},label)
            .fromTo(select(`${selector} .tour-tag`),{opacity:0,y:40},{opacity:1,y:0,duration:1},'<0.4')
            .fromTo(select(`${selector} .tour-title`),{opacity:0,y:40},{opacity:1,y:0,duration:1},'<0.2')
            .fromTo(select(`${selector} .tour-sub`),{opacity:0,y:40},{opacity:1,y:0,duration:1},'<0.2')
            .fromTo(select(`${selector} .tour-desc`),{opacity:0,y:40},{opacity:1,y:0,duration:1},'<0.2')
            .fromTo(select(`${selector} .tour-photos`),{opacity:0,y:60},{opacity:1,y:0,duration:1.2},'<0.3')
            .add(`hold_${id}`,id===campusScenes[campusScenes.length-1].id?'+=0.1':'+=0.8');
          return `hold_${id}`;
        };
        let label='heroStart+=1';
        campusScenes.forEach((scene,index)=>{
          label=build(scene.id,label);
          if(index<campusScenes.length-1)timeline.to(select(`[data-campus-slide="${scene.id}"]`),{autoAlpha:0,duration:1.2},label);
        });

        syncAccessibility();
        const scrollTrigger=timeline.scrollTrigger;
        const stepLabels=['heroStart',...campusScenes.map(scene=>`hold_${scene.id}`)];
        let gateLocked=false;
        let gateFrame=0;
        let gateRelease=0;
        let touchStartY=0;
        let touchCurrentY=0;
        let wheelTotal=0;
        let wheelReset=0;
        let lastManualStep=0;

        const stepPositions=()=>{
          if(!scrollTrigger)return [];
          const duration=Math.max(timeline.duration(),.001);
          return stepLabels.map((label,index)=>{
            if(index===0)return scrollTrigger.start;
            const time=timeline.labels[label] ?? duration;
            return Math.min(scrollTrigger.end-2,scrollTrigger.start+(time/duration)*(scrollTrigger.end-scrollTrigger.start));
          });
        };
        const insideCampus=()=>Boolean(scrollTrigger&&window.scrollY>=scrollTrigger.start-2&&window.scrollY<=scrollTrigger.end+2);
        const nearestStep=(positions:number[])=>positions.reduce((best,position,index)=>Math.abs(position-window.scrollY)<Math.abs(positions[best]-window.scrollY)?index:best,0);
        const autoInterval=5000;
        const ease=(value:number)=>(1-Math.cos(Math.PI*value))/2;
        const moveOneStep=(direction:1|-1, fromControl=false)=>{
          if((!mobile&&!fromControl)||!scrollTrigger||gateLocked)return false;
          const positions=stepPositions();
          const current=nearestStep(positions);
          const next=current+direction;
          if(next<0||next>=positions.length)return false;

          gateLocked=true;
          const from=window.scrollY;
          const to=positions[next];
          const started=performance.now();
          const duration=1300;
          const animate=(now:number)=>{
            const progress=Math.min(1,(now-started)/duration);
            window.scrollTo(0,from+(to-from)*ease(progress));
            ScrollTrigger.update();
            if(progress<1){gateFrame=requestAnimationFrame(animate);return;}
            gateRelease=window.setTimeout(()=>{gateLocked=false;},260);
          };
          gateFrame=requestAnimationFrame(animate);
          return true;
        };
        const previousButton=node.querySelector<HTMLButtonElement>('.campus-tour-arrow-up');
        const nextButton=node.querySelector<HTMLButtonElement>('.campus-tour-arrow-down');
        const stepBack=()=>{lastManualStep=performance.now();moveOneStep(-1,true);};
        const stepForward=()=>{lastManualStep=performance.now();moveOneStep(1,true);};
        const pauseForManualScroll=()=>{if(insideCampus())lastManualStep=performance.now();};
        previousButton?.addEventListener('click',stepBack);
        nextButton?.addEventListener('click',stepForward);
        window.addEventListener('wheel',pauseForManualScroll,{passive:true});
        window.addEventListener('touchstart',pauseForManualScroll,{passive:true});
        const autoTimer=window.setInterval(()=>{
          if(document.hidden||!insideCampus()||document.querySelector('dialog[open]')||performance.now()-lastManualStep<autoInterval)return;
          moveOneStep(1,true);
        },autoInterval);
        const atExitBoundary=(direction:1|-1)=>{
          const positions=stepPositions();
          if(!positions.length)return true;
          const current=nearestStep(positions);
          return (direction<0&&current===0)||(direction>0&&current===positions.length-1);
        };
        const block=(event:Event)=>{if(event.cancelable)event.preventDefault();};
        const onWheel=(event:WheelEvent)=>{
          if(!mobile||!insideCampus()||Math.abs(event.deltaY)<=Math.abs(event.deltaX))return;
          const direction:1|-1=event.deltaY>0?1:-1;
          if(atExitBoundary(direction)&&!gateLocked)return;
          block(event);
          if(gateLocked)return;
          wheelTotal+=event.deltaY;
          window.clearTimeout(wheelReset);
          wheelReset=window.setTimeout(()=>{wheelTotal=0;},180);
          if(Math.abs(wheelTotal)>=24){wheelTotal=0;lastManualStep=performance.now();moveOneStep(direction);}
        };
        const onTouchStart=(event:TouchEvent)=>{
          if(!mobile||event.touches.length!==1)return;
          touchStartY=event.touches[0].clientY;
          touchCurrentY=touchStartY;
        };
        const onTouchMove=(event:TouchEvent)=>{
          if(!mobile||event.touches.length!==1||!insideCampus())return;
          touchCurrentY=event.touches[0].clientY;
          const delta=touchStartY-touchCurrentY;
          if(Math.abs(delta)<6)return;
          const direction:1|-1=delta>0?1:-1;
          if(atExitBoundary(direction)&&!gateLocked)return;
          block(event);
        };
        const onTouchEnd=(event:TouchEvent)=>{
          if(!mobile||!insideCampus())return;
          const delta=touchStartY-touchCurrentY;
          if(Math.abs(delta)<32)return;
          const direction:1|-1=delta>0?1:-1;
          if(atExitBoundary(direction)&&!gateLocked)return;
          block(event);
          lastManualStep=performance.now();
          moveOneStep(direction);
          touchStartY=touchCurrentY=0;
        };
        const onTouchCancel=()=>{touchStartY=touchCurrentY=0;};
        if(mobile){
          window.addEventListener('wheel',onWheel,{passive:false});
          window.addEventListener('touchstart',onTouchStart,{passive:true});
          window.addEventListener('touchmove',onTouchMove,{passive:false});
          window.addEventListener('touchend',onTouchEnd,{passive:false});
          window.addEventListener('touchcancel',onTouchCancel);
        }
        const refreshFrame=requestAnimationFrame(()=>ScrollTrigger.refresh());
        const pendingRefresh=gsap.delayedCall(.2,()=>ScrollTrigger.refresh()).pause();
        const refresh=()=>{pendingRefresh.restart(true);};
        const images=Array.from(node.querySelectorAll('img'));
        images.forEach(img=>img.addEventListener('load',refresh));
        return ()=>{
          pendingRefresh.kill();
          cancelAnimationFrame(refreshFrame);
          cancelAnimationFrame(gateFrame);
          window.clearTimeout(gateRelease);
          window.clearTimeout(wheelReset);
          window.clearInterval(autoTimer);
          previousButton?.removeEventListener('click',stepBack);
          nextButton?.removeEventListener('click',stepForward);
          window.removeEventListener('wheel',pauseForManualScroll);
          window.removeEventListener('touchstart',pauseForManualScroll);
          window.removeEventListener('wheel',onWheel);
          window.removeEventListener('touchstart',onTouchStart);
          window.removeEventListener('touchmove',onTouchMove);
          window.removeEventListener('touchend',onTouchEnd);
          window.removeEventListener('touchcancel',onTouchCancel);
          images.forEach(img=>img.removeEventListener('load',refresh));
          node.classList.remove('is-pinned');
          slides.forEach(slide=>{slide.inert=false;slide.removeAttribute('aria-hidden');});
        };
      });
    },node);
    return ()=>{media.revert();context.revert();};
  },[]);
  return <section id="life" aria-label="Life at DGU"><div ref={root} className="campus-tour">
    <div className="campus-progress" aria-hidden="true" />
    <div className="campus-tour-arrows" aria-label="Campus Life slides">
      <button className="campus-tour-arrow-up" type="button" aria-label="Previous Campus Life slide"><span aria-hidden="true">↑</span></button>
      <button className="campus-tour-arrow-down" type="button" aria-label="Next Campus Life slide"><span aria-hidden="true">↓</span></button>
    </div>
    <div className="campus-particles" aria-hidden="true">{Array.from({length:25},(_,i)=><i key={i} style={{left:`${(i*37)%100}%`,animationDuration:`${8+(i*7)%12}s`,animationDelay:`${(i*3)%10}s`,width:`${1+i%3}px`,height:`${1+i%3}px`} as CSSProperties}/>)}</div>
    <section className="campus-hero pin-slide">
      <TourImage className="campus-hero-bg" src={sitePath("/assets/life-night.webp")} fallback={sitePath("/assets/life-night.webp")} alt="" loading="lazy" enabled={imagesEnabled} />
      <div className="campus-hero-fog" />
      <h2 className="campus-hero-text"><span className="campus-hero-line1">Campus Life</span><span className="campus-hero-line2">AT DGU</span></h2>
      <div className="campus-hero-sub"><p>A preferred destination for students from 20+ countries and across India.</p></div>
      <div className="campus-scroll-cue"><span>Scroll</span><i /></div>
    </section>
    {campusScenes.map((scene, sceneIndex)=><section className="pin-slide" data-campus-slide={scene.id} key={scene.id}>
      <TourImage className="tour-bg-img" src={scene.background} fallback={scene.backgroundFallback} alt="" loading="lazy" enabled={imagesEnabled} />
      <div className={`tour-overlay ${scene.theme==='tour-light'?'overlay-dark':'overlay-light'}`} />
      <div className={`tour-content ${scene.theme} ${sceneIndex % 2 === 0 ? 'align-left' : 'align-right'}`}>
        <div className="tour-tag">{scene.tag}</div>
        <h2 className="tour-title">{scene.title.split('\n').map((line,index)=><span className={index === 0 ? 'tour-title-primary' : 'tour-title-secondary'} key={line}>{line}</span>)}</h2>
        <h3 className="tour-sub">{scene.subtitle}</h3>
        <p className="tour-desc">{scene.description}</p>
        <div className="tour-photos">{scene.photos.map(photo=><button key={photo.src} onClick={event=>onImage(photo.alt,event.currentTarget.querySelector('img')?.getAttribute('src') || photo.src)} aria-label={`Enlarge ${photo.alt}`}><TourImage src={photo.src} fallback={photo.fallback} alt={photo.alt} loading="lazy" enabled={imagesEnabled} /></button>)}</div>
      </div>
    </section>)}
    </div></section>;
}
