import type { ReactNode } from 'react';
import { SITE_BASE } from './site-routes';
import './internal-pages.css';
import './internal-pages-responsive.css';

/** The same purple title band and framed media used by the completed internal pages. */
export default function InternalPageHero({ title, eyebrow='DBS Global University', children, parent, image }: {
  title: string; eyebrow?: string; children?: ReactNode;
  parent?: {label:string;href:string}; image?: {src:string;alt:string};
}) {
  return <header className={`internal-hero${image?' internal-hero--media':''}`} data-navigation-opening>
    <div className="internal-hero-band"><div className="internal-width">
      <nav className="internal-breadcrumb" aria-label="Breadcrumb"><a href={`${SITE_BASE}/`}>Home</a><span aria-hidden="true">/</span>{parent&&<><a href={parent.href}>{parent.label}</a><span aria-hidden="true">/</span></>}<span aria-current="page">{title}</span></nav>
      <p className="internal-eyebrow">{eyebrow}</p><h1>{title}</h1>{children}
      <span className="internal-hero-orbit" aria-hidden="true" />
    </div></div>
    {image&&<figure className="internal-hero-media"><img src={image.src} alt={image.alt} fetchPriority="high" /></figure>}
  </header>;
}
