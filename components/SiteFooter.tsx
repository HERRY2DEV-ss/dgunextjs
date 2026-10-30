'use client';
import { sitePath } from './site-base';


import { useEffect, useRef, useState } from 'react';
import { requestFooter, type FooterData, type FooterGroup } from './footer-api';

function FooterLink({ link }: { link: FooterGroup['links'][number] }) {
  return <li>{link.href ? <a href={link.href} target={link.target} rel={link.target === '_blank' ? 'noopener noreferrer' : undefined}>{link.name}</a> : link.name}</li>;
}
function LinkGroup({ group }: { group: FooterGroup }) {
  return <><h2>{group.name}</h2><ul>{group.links.map(link => <FooterLink key={link.id} link={link} />)}</ul></>;
}
function ResourcesGroup({ group }: { group: FooterGroup }) {
  const splitAt = Math.ceil(group.links.length / 2);
  const left = group.links.slice(0, splitAt);
  const right = group.links.slice(splitAt);
  return <section className="footer-link-group footer-resources-group" aria-label={group.name}>
    <h2>{group.name}</h2>
    <div className="footer-resources-two-col">
      <ul>{left.map(link => <FooterLink key={link.id} link={link} />)}</ul>
      <ul>{right.map(link => <FooterLink key={link.id} link={link} />)}</ul>
    </div>
  </section>;
}
function SocialIcon({name}:{name:string}) {
  const key=name.toLowerCase();
  return <svg aria-hidden="true" viewBox="0 0 24 24">
    {key==='instagram' ? <><rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r=".7"/></>
      : key==='facebook' ? <path d="M14 21V12h4l1-4h-5V6c0-2 2-2 4-2V1h-4c-4 0-5 3-5 5v2H6v4h3v9"/>
      : key==='youtube' ? <><rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 6 3-6 3Z"/></>
      : key==='whatsapp' ? <><path d="M5 19 2 22l1-6a9 9 0 1 1 2 3Z"/><path d="M8 6c-4 3 5 12 8 8l-3-2-1 1-2-2 1-2Z"/></>
      : <path d="m3 3 18 18M21 3 3 21M3 3h5l13 18h-5Z"/>}
  </svg>;
}

export default function SiteFooter() {
  const root = useRef<HTMLElement>(null);
  const mounted = useRef(false);
  const [data, setData] = useState<FooterData | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const load = () => {
    setStatus('loading');
    requestFooter().then(result => { if (mounted.current) { setData(result); setStatus('ready'); } }).catch(error => {
      console.warn('Footer API:', error instanceof Error ? error.message : 'Request failed');
      if (mounted.current) { setData(null); setStatus('error'); }
    });
  };
  useEffect(() => {
    mounted.current = true;
    let observer: IntersectionObserver | undefined;
    if (root.current && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { observer?.disconnect(); load(); } }, { rootMargin: '900px 0px' });
      observer.observe(root.current);
    } else load();
    return () => { mounted.current = false; observer?.disconnect(); };
  }, []);
  const first = data?.groups[0];
  const columns = data?.groups.slice(1) || [];
  return (
    <footer ref={root} aria-busy={status === 'loading'} className="site-footer" id="contact"><div className="footer-inner content-width">
      <div className="footer-contact"><a href={sitePath("/")}><img className="footer-logo" src={sitePath("/assets/dgu_logo_svg2.svg")} alt="DBS Global University" width="452" height="132" loading="lazy" /></a>{data?.contacts.map((contact, index) => <address key={index}><strong>Visit Us</strong>{contact.campusAddress && <><span>Campus</span><p style={{ whiteSpace: 'pre-line' }}>{contact.campusAddress}</p></>}{contact.cityAddress && <><span>City Office</span><p style={{ whiteSpace: 'pre-line' }}>{contact.cityAddress}</p></>}{contact.mobileNo && <a href={`tel:${contact.mobileNo.replace(/[^+\d]/g, '')}`}>{contact.mobileNo}</a>}{contact.emailID && <a href={`mailto:${contact.emailID}`}>{contact.emailID}</a>}</address>)}{(data?.social.length || 0)>0 && <p className="follow-us">Follow Us: <span className="footer-social-icons" aria-label="Social channels">{data?.social.map(item=><a key={item.name} href={item.href} aria-label={item.name} target="_blank" rel="noopener noreferrer"><SocialIcon name={item.name}/></a>)}</span></p>}</div>
      <div className="footer-quick">
        {status === 'loading' ? <p role="status">Loading footer…</p> : status === 'error' ? <div role="status"><p>Footer information is temporarily unavailable.</p><button type="button" className="text-link" onClick={load}>Try again</button></div> : first ? <LinkGroup group={first} /> : <p>No footer links available.</p>}
      </div>
      <div className="footer-resources"><div className="footer-link-columns">{columns.map(group => group.name.trim().toLowerCase() === 'resources' ? <ResourcesGroup group={group} key={group.id} /> : <div className="footer-link-group" key={group.id}><LinkGroup group={group} /></div>)}</div></div>
      {data?.copyright && <p className="copyright">Copyright © {new Date().getFullYear()} {data.copyright}</p>}
    </div></footer>
  );
}
