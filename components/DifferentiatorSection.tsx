'use client';
import { sitePath } from './site-base';


import { resolveSiteHref } from './site-routes';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

export type DifferentiatorPoint = {
  title: string;
  description: string;
  icon: string;
  href?: string;
  forceReadMore?: boolean;
};

type DifferentiatorSectionProps = {
  title: string;
  points: DifferentiatorPoint[];
  id?: string;
  variant?: 'default' | 'school';
  readMore?: boolean;
  directLinks?: boolean;
  introduction?: ReactNode;
  onPointReadMore?: (point: DifferentiatorPoint) => void;
  expandedPoint?: string;
  detailId?: string;
  detailsInDialog?: boolean;
  pointInteraction?: boolean;
  fitPoints?: boolean;
  onPointHover?: (point:DifferentiatorPoint,anchor:HTMLElement)=>void;
  onPointHoverEnd?: ()=>void;
  hoveredPoint?: string;
  tooltipId?: string;
};

const desktopPaths = {
  default: 'M60 158 C60 90 115 35 183 35 S306 90 306 158 S361 281 429 281 S552 226 552 158 S607 35 675 35 S798 90 798 158 S853 281 921 281 S1044 226 1044 158 S1099 35 1167 35 S1290 90 1290 158 S1345 281 1413 281 S1536 226 1536 158',
  school: 'M60 158 C60 90 115 35 183 35 S306 90 306 158 S361 281 429 281 S552 226 552 158 S607 35 675 35 S798 90 798 158 S853 281 921 281 S1044 226 1044 158',
};

const mobilePaths = {
  default: 'M22 20 L262 20 A70 70 0 0 1 262 160 L98 160 A70 70 0 0 0 98 300 L262 300 A70 70 0 0 1 262 440 L98 440 A70 70 0 0 0 98 580 L262 580 A70 70 0 0 1 262 720 L98 720 A70 70 0 0 0 98 860 L334 860',
  school: 'M22 20 L262 20 A70 70 0 0 1 262 160 L98 160 A70 70 0 0 0 98 300 L262 300 A70 70 0 0 1 262 440 L98 440 A70 70 0 0 0 98 580 L334 580',
};

export default function DifferentiatorSection({
  title,
  points,
  id = 'different',
  variant = 'default',
  readMore = false,
  directLinks = false,
  introduction,
  onPointReadMore,
  expandedPoint,
  detailId,
  detailsInDialog = false,
  pointInteraction = false,
  fitPoints = false,
  onPointHover,
  onPointHoverEnd,
  hoveredPoint,
  tooltipId,
}: DifferentiatorSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const isSchool = variant === 'school';
  const shownPoints = points.slice(0, isSchool ? 4 : 6);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const count=shownPoints.length,width=fitPoints ? 124+246*count : isSchool ? 1104 : 1600;
  const end=fitPoints ? 60+246*count : isSchool ? 1044 : 1536;
  let fittedPath='M60 158 C60 90 115 35 183 35 S306 90 306 158';
  for(let i=1;i<count;i++){const centre=183+246*i,last=306+246*i,peak=i%2?281:35;fittedPath+=` S${centre-68} ${peak} ${centre} ${peak} S${last} ${i%2?226:90} ${last} 158`;}
  const mobileHeight=fitPoints ? 40+140*count : isSchool ? 600 : 880;
  const mobileEnd=fitPoints && count%2 ? 22 : 334;
  let fittedMobile='M22 20 L262 20';
  for(let i=0;i<count;i++){const y=20+140*(i+1);fittedMobile+=` A70 70 0 0 ${i%2?0:1} ${i%2?98:262} ${y} L${i===count-1?mobileEnd:i%2?262:98} ${y}`;}
  const path = fitPoints ? fittedPath : desktopPaths[variant];
  const mobilePath = fitPoints ? fittedMobile : mobilePaths[variant];
  const titleId = `${id}-title`;

  // The static export is hosted at . Legacy school data uses icon
  // filenames which are absent from public/assets/svg; reuse the real 1–6 SVGs.
  const iconSrc = (icon: string, index: number) => {
    if (/\/(innovative-pedagogy|new-curriculums|future-skill-programs|certified-trainings)\.svg$/.test(icon)) {
      return sitePath(`/assets/svg/${index + 1}.svg`);
    }
    return icon;
  };

  return (
    <section
      ref={sectionRef}
      className={`different-section difference-wave-section difference-wave-section--default${isSchool ? ' difference-wave-section--school' : ''}${readMore ? ' difference-wave-section--preview' : ''}${visible ? ' is-visible' : ''}`}
      id={id}
      aria-labelledby={titleId}
    >
      <div className="difference-wave-inner content-width">
        <h2 id={titleId}>{title}</h2>
        {introduction && <div className="difference-wave-introduction">{introduction}</div>}
        <div className="difference-wave-layout" style={{ '--difference-point-count': shownPoints.length, '--hr-wave-ratio':`${width} / 340`, '--feature-wave-width':`${width}px` } as CSSProperties}>
          <svg className="difference-wave" viewBox={`0 0 ${width} 340`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <defs>
              <linearGradient id="difference-wave-gradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#ffcf19" />
                <stop offset=".28" stopColor="#ec4b42" />
                <stop offset=".52" stopColor="#a02ab2" />
                <stop offset=".76" stopColor="#3f72cf" />
                <stop offset="1" stopColor="#b96cba" />
              </linearGradient>
            </defs>
            <path className="difference-wave-shadow" pathLength="1" d={path} />
            <path className="difference-wave-path" pathLength="1" d={path} />
            <circle className="difference-wave-dot wave-dot-start" cx="60" cy="158" r="22" />
            <circle className="difference-wave-dot wave-dot-end" cx={end} cy="158" r="22" />
          </svg>

          <svg className="difference-wave-mobile" viewBox={`0 0 360 ${mobileHeight}`} preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="difference-wave-mobile-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffcf19" />
                <stop offset=".3" stopColor="#ec4b42" />
                <stop offset=".56" stopColor="#a02ab2" />
                <stop offset=".8" stopColor="#3f72cf" />
                <stop offset="1" stopColor="#b96cba" />
              </linearGradient>
            </defs>
            <path className="difference-wave-shadow" pathLength="1" d={mobilePath} />
            <path className="difference-wave-path" pathLength="1" d={mobilePath} />
            <circle className="difference-wave-dot wave-dot-start" cx="22" cy="20" r="11" />
            <circle className="difference-wave-dot wave-dot-end" cx={mobileEnd} cy={mobileHeight-20} r="11" />
          </svg>

          {shownPoints.map((point, index) => (
            <article
              className={`difference-wave-point point-${index + 1}`}
              style={{ '--point-delay': `${0.25 + index * 0.45}s`, '--hr-point-left':`${(65+246*index)/width*100}%`, '--hr-point-width':`${236/width*100}%`, '--feature-mobile-top':`${(20+140*index)/mobileHeight*100}%`, '--feature-mobile-height':`${140/mobileHeight*100}%` } as CSSProperties}
              key={point.title}
              role={pointInteraction?'button':undefined} tabIndex={pointInteraction?0:undefined}
              aria-haspopup={pointInteraction?'dialog':undefined} aria-label={pointInteraction?`${point.title}: view details`:undefined}
              aria-describedby={hoveredPoint===point.title?tooltipId:undefined}
              onPointerEnter={event=>{if(pointInteraction && event.pointerType!=='touch' && window.matchMedia('(min-width:701px) and (hover:hover) and (pointer:fine)').matches)onPointHover?.(point,event.currentTarget);}}
              onPointerLeave={()=>{if(pointInteraction)onPointHoverEnd?.();}}
              onFocus={event=>{if(pointInteraction && window.matchMedia('(min-width:701px) and (hover:hover) and (pointer:fine)').matches)onPointHover?.(point,event.currentTarget);}}
              onBlur={()=>{if(pointInteraction)onPointHoverEnd?.();}}
              onClick={()=>{if(pointInteraction)onPointReadMore?.(point);}}
              onKeyDown={event=>{if(pointInteraction && (event.key==='Enter' || event.key===' ')){event.preventDefault();onPointReadMore?.(point);}}}
            >
              <PointLink point={point} direct={directLinks}>
                {index % 2 === 0 ? (
                  <>
                    <div className="difference-wave-icon" aria-hidden="true"><img src={iconSrc(point.icon, index)} alt="" /></div>
                    <h3>{point.title}</h3>
                    <span className="difference-wave-divider" />
                    <PointDescription text={point.description} title={point.title} readMore={readMore && !!point.href} forceReadMore={point.forceReadMore} onReadMore={!pointInteraction && onPointReadMore ? () => onPointReadMore(point) : undefined} expanded={expandedPoint === point.title} detailId={detailId} detailsInDialog={detailsInDialog} />
                  </>
                ) : (
                  <>
                    <h3>{point.title}</h3>
                    <PointDescription text={point.description} title={point.title} readMore={readMore && !!point.href} forceReadMore={point.forceReadMore} onReadMore={!pointInteraction && onPointReadMore ? () => onPointReadMore(point) : undefined} expanded={expandedPoint === point.title} detailId={detailId} detailsInDialog={detailsInDialog} />
                    <span className="difference-wave-divider" />
                    <div className="difference-wave-icon" aria-hidden="true"><img src={iconSrc(point.icon, index)} alt="" /></div>
                  </>
                )}
              </PointLink>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PointLink({ point, children, direct }: { point: DifferentiatorPoint; children: ReactNode; direct: boolean }) {
  if (!point.href) return <div className="difference-wave-link">{children}</div>;

  return <a className="difference-wave-link" href={direct ? point.href : resolveSiteHref(point.href, point.title)} aria-label={`Learn more about ${point.title}`}>
    {children}
  </a>;
}

function PointDescription({ text, title, readMore, forceReadMore, onReadMore, expanded, detailId, detailsInDialog }: { text: string; title: string; readMore: boolean; forceReadMore?: boolean; onReadMore?: () => void; expanded?: boolean; detailId?: string; detailsInDialog?: boolean }) {
  const paragraph = useRef<HTMLParagraphElement>(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const node = paragraph.current;
    if (!onReadMore || !node) return;
    const heading = node.closest('article')?.querySelector('h3');
    const measure = () => setOverflow(!!forceReadMore || node.scrollHeight > node.clientHeight + 1 || !!heading && heading.scrollHeight > heading.clientHeight + 1);
    const observer = new ResizeObserver(measure); observer.observe(node); if (heading) observer.observe(heading); measure();
    return () => observer.disconnect();
  }, [onReadMore, text, forceReadMore]);
  return <><p ref={paragraph}>{readMore ? <><span className="difference-wave-description">{text}</span><span className="difference-wave-more">Read More <span aria-hidden="true">↗</span></span></>
    : text.split('\n').map((line, index) => <span key={`${line}-${index}`}>{index > 0 && <br />}{line}</span>)}</p>
    {onReadMore && overflow && <button type="button" className="academic-feature-more" aria-haspopup={detailsInDialog ? 'dialog' : undefined} aria-expanded={detailsInDialog ? undefined : expanded} aria-controls={detailId} aria-label={`Read more about ${title}`} onClick={onReadMore}>Read more <span aria-hidden="true">{detailsInDialog ? '↗' : '↓'}</span></button>}
  </>;
}
