'use client';
import { sitePath } from './site-base';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import HeaderDropdown from './HeaderDropdown';
import { resolveSiteHref } from './site-routes';
import { MENU_IMAGE, APPLY_URL } from './navigation.config';
import { requestMenus, takeInitialMenuRequest, menuHref, menuMatches, type MenuItem } from './navigation-api';
import { apiUtilityLinks, isUtilityGroup } from './navigation-utilities';
const MAIN_LOGO = sitePath('/assets/dgu_logo_svg.svg');
const FOOTER_LOGO = sitePath('/assets/dgu_logo_svg2.svg');
export default function Navigation({
  onOpenChange,
  logoSrc = MAIN_LOGO,
  logoAlt = 'DGU DBS Global University',
}: {
  onOpenChange?: (open: boolean) => void;
  logoSrc?: string;
  logoAlt?: string;
}) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedChild, setExpandedChild] = useState<string | null>(null);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [menuApiStatus, setMenuApiStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuSearchOpen, setMenuSearchOpen] = useState(false);
  const [menuQuery, setMenuQuery] = useState('');
  const [pastHero, setPastHero] = useState(false);
  const menuDialog = useRef<HTMLDialogElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuSearchInput = useRef<HTMLInputElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const openMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const dialog = menuDialog.current;
    setMenuVisible(false);
    setMenuSearchOpen(false); setMenuQuery(''); setExpanded(null); setExpandedChild(null);
    if (dialog && !dialog.open) dialog.show();
    setMenuOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setMenuVisible(true)));
  };
  const closeMenu = useCallback(() => {
    if (!menuDialog.current?.open) return;
    setMenuVisible(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      menuDialog.current?.close();
      setMenuOpen(false);
      menuTrigger.current?.focus();
    }, 560);
  }, []);
  useEffect(() => {
    onOpenChange?.(menuOpen);
  }, [menuOpen, onOpenChange]);
  useEffect(() => {
    let unmounted = false;
    takeInitialMenuRequest()
      .then(next => {
        if (unmounted) return;
        setMenus(next);
        setMenuApiStatus('ready');
      })
      .catch(error => {
        if (unmounted) return;
        console.warn('Navigation request failed.', error);
        setMenuApiStatus('error');
      });
    return () => { unmounted = true; };
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [menuOpen]);
  useEffect(() => { if (menuSearchOpen) menuSearchInput.current?.focus(); }, [menuSearchOpen]);
  useEffect(() => {
    // Keep the same trigger for static pages and API banners mounted after loading.
    if (!('IntersectionObserver' in window)) return;
    setPastHero(false);
    const observer = new IntersectionObserver(([entry]) => {
      setPastHero(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
    }, { threshold: 0 });
    let waiting: MutationObserver | undefined;
    const connect = () => {
      const hero = document.querySelector('[data-navigation-opening], .hero#home, .campus-hero, .admissions-opening, .school-opening, .program-opening');
      if (!hero) return false;
      observer.observe(hero); waiting?.disconnect(); return true;
    };
    if (!connect()) { waiting = new MutationObserver(connect); waiting.observe(document.body, {childList:true,subtree:true}); }
    return () => { observer.disconnect(); waiting?.disconnect(); };
  }, [pathname]);
  useEffect(() => {
    const header = headerRef.current;
    if (!header || !('ResizeObserver' in window)) return;
    const observer = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty('--dgu-header-height', `${entry.borderBoxSize?.[0]?.blockSize ?? header.offsetHeight}px`);
    });
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeMenu(); }
      if (event.key === 'Tab') {
        const controls = [headerRef.current, menuDialog.current].flatMap(root =>
          Array.from(root?.querySelectorAll<HTMLElement>('a[href],button,input,[tabindex="0"]') || []))
          .filter(node => node.getClientRects().length && !node.closest('[inert]') && !node.hasAttribute('disabled'));
        if (!controls.length) return;
        event.preventDefault();
        const current = controls.indexOf(document.activeElement as HTMLElement);
        controls[(current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length]?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen, closeMenu]);
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
  const activeLogoSrc = logoSrc === MAIN_LOGO ? FOOTER_LOGO : logoSrc;
  const search = menuQuery.trim().toLowerCase();
  const visibleMenus = useMemo(
    () => menus.filter(group => !isUtilityGroup(group) && (!search || menuMatches(group, search))),
    [menus, search],
  );
  const bottomLinks = useMemo(
    () => apiUtilityLinks(menus).filter(link => !search || link.label.toLowerCase().includes(search)),
    [menus, search],
  );
  const menuContent = useMemo(() => <>
    <div className="mega-menu-header">
      <a href={sitePath("/")} className="mega-menu-logo" onClick={closeMenu}>
        <img src={activeLogoSrc} width="452" height="132" alt={logoAlt} />
      </a>
      <div className="mega-menu-header-right">
        <a href={sitePath("/")} onClick={closeMenu}>OVERVIEW</a>
        <a href={sitePath("/admissions/")} onClick={closeMenu}>ADMISSION</a>
        <button type="button" className="mega-menu-search" aria-label="Search navigation"
          aria-expanded={menuSearchOpen} aria-controls={menuSearchOpen ? 'mega-menu-search-field' : undefined}
          onClick={() => { setMenuSearchOpen(!menuSearchOpen); setMenuQuery(''); }}>
          SEARCH <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="M20 20L16.2 16.2" />
          </svg>
        </button>
        <button type="button" className="mega-menu-close" aria-label="Close menu"
          onClick={closeMenu} autoFocus>MENU <i aria-hidden="true">×</i></button>
      </div>
    </div>
    <div className="mega-menu-left">
      <svg className="menu-brand-arrow" viewBox="0 0 540 520" preserveAspectRatio="none" aria-hidden="true"><path d="M0 520 166 235 252 370 396 130 354 102 540 0 540 205 475 165 254 520 174 388 97 520Z" fill="currentColor" /></svg>
      {menuSearchOpen && <div className="mega-menu-search-field" id="mega-menu-search-field">
        <label htmlFor="menu-query">Search navigation</label>
        <input ref={menuSearchInput} id="menu-query" type="search" value={menuQuery}
          onChange={event => setMenuQuery(event.target.value)} placeholder="Find a section…" />
      </div>}
      <nav className="mega-navigation" aria-label="University navigation">
        {visibleMenus.map((group,index) => {
          const open = expanded === group.label || Boolean(search);
          const children = group.children.filter(child => !search || group.label.toLowerCase().includes(search) || menuMatches(child, search));
          if (!children.length && menuHref(group)) return <a className="menu-direct-link" key={`${group.label}-${index}`} href={menuHref(group)!} target={group.target === '_blank' ? '_blank' : undefined} rel={group.target === '_blank' ? 'noopener noreferrer' : undefined} onClick={closeMenu}>{group.label}<span aria-hidden="true">↗</span></a>;
          return <div className="menu-accordion" key={group.label}>
            <button type="button" className="menu-section-toggle" aria-expanded={open} aria-controls={`menu-sub-${index}`} onClick={()=>{setExpanded(expanded===group.label?null:group.label);setExpandedChild(null);}}>
              <span>{group.label}</span><b aria-hidden="true"><svg width="30" height="24" viewBox="0 0 30 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m10 4 8 8-8 8" /></svg></b>
            </button>
            <div id={`menu-sub-${index}`} className={`menu-submenu ${open?'is-open':''}`} inert={!open} aria-hidden={!open}>
              <div><ul>{children.map((child,childIndex) => {
                const href = menuHref(child);
                const branchId = `${group.label}-${child.label}-${childIndex}`;
                const childOpen = expandedChild === branchId || Boolean(search);
                const leaves = child.children.filter(leaf => !search || group.label.toLowerCase().includes(search) || child.label.toLowerCase().includes(search) || menuMatches(leaf, search));
                return <li key={branchId} className="menu-child-item">
                  <div className="menu-child-row">
                    {href ? <a href={href} target={child.target === '_blank' ? '_blank' : undefined} rel={child.target === '_blank' ? 'noopener noreferrer' : undefined} onClick={closeMenu}>{child.label}<span aria-hidden="true">↗</span></a> : <button type="button" className="menu-child-label" aria-expanded={leaves.length ? childOpen : undefined} onClick={()=>setExpandedChild(childOpen?null:branchId)}>{child.label}</button>}
                    {leaves.length > 0 && <button type="button" className="menu-child-toggle" aria-label={`${childOpen ? 'Close' : 'Open'} ${child.label} links`} aria-expanded={childOpen} aria-controls={`menu-leaves-${index}-${childIndex}`} onClick={()=>setExpandedChild(childOpen?null:branchId)}><span aria-hidden="true">⌄</span></button>}
                  </div>
                  {leaves.length > 0 && <div className={`menu-child-panel${childOpen?' is-open':''}`} id={`menu-leaves-${index}-${childIndex}`} inert={!childOpen} aria-hidden={!childOpen}><div><ul className="menu-leaf-list">{leaves.map((leaf,leafIndex) => {
                    const leafHref = menuHref(leaf);
                    return leafHref && <li key={`${leaf.label}-${leafIndex}`}><a href={leafHref} target={leaf.target === '_blank' ? '_blank' : undefined} rel={leaf.target === '_blank' ? 'noopener noreferrer' : undefined} onClick={closeMenu}>{leaf.label}<span aria-hidden="true">↗</span></a></li>;
                  })}</ul></div></div>}
                </li>;
              })}</ul></div>
            </div>
          </div>;
        })}
        {menuApiStatus === 'loading' && <p className="menu-api-status" role="status">Loading navigation…</p>}
        {menuApiStatus === 'error' && <div className="menu-api-status is-error" role="alert"><p>Navigation is temporarily unavailable.</p><button type="button" className="text-link" onClick={() => { setMenuApiStatus('loading'); requestMenus().then(next => { setMenus(next); setMenuApiStatus('ready'); }).catch(() => setMenuApiStatus('error')); }}>Try again</button></div>}
        {menuApiStatus === 'ready' && search && !visibleMenus.length && !bottomLinks.length && <p role="status">No matching navigation links.</p>}
        {menuApiStatus === 'ready' && !search && !menus.length && <p role="status">No navigation links are available yet.</p>}
      </nav>
      {bottomLinks.length > 0 && <nav className="mega-menu-bottom" aria-label="Additional university links">
        {bottomLinks.map(link => <a key={link.label} href={link.href} target={link.target} rel={link.target === '_blank' ? 'noopener noreferrer' : undefined} onClick={closeMenu}>{link.label}</a>)}
      </nav>}
    </div>
    <div className="mega-menu-right">
      <div className="menu-feature-image"><img src={MENU_IMAGE} alt="DBS Global University campus" width="1921" height="901" /></div>
      <div className="menu-feature-content">
        <div className="menu-feature-text">
          <h2>Shape Your<br /><em>Future</em></h2>
          <p>Experience industry-focused education, global exposure and a vibrant campus designed to prepare you for tomorrow.</p>
        </div>
        <a href={sitePath("/#different")} className="menu-feature-button" onClick={closeMenu}><span>EXPLORE DGU</span><strong aria-hidden="true"><svg width="26" height="20" viewBox="0 0 30 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m10 4 8 8-8 8" /></svg></strong></a>
      </div>
    </div>
  </>, [activeLogoSrc, bottomLinks, closeMenu, expanded, expandedChild, logoAlt, menuApiStatus, menuQuery, menuSearchOpen, menus.length, search, visibleMenus]);
  const dropdownGroups = [
    { key: 'ADMISSION', title: 'ADMISSION', href: sitePath('/admissions/') },
    { key: 'PLACEMENTS', title: 'PLACEMENTS', href: sitePath('/placement-reports/') },
    { key: 'LIFE AT DGU', title: 'CAMPUS LIFE', href: sitePath('/life-at-dgu/') },
  ];
  return <>
    <svg width="0" height="0" aria-hidden="true" style={{position:'absolute'}}><defs><filter id="dgu-logo-cutout" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  2.5 0 0 0 -1.1" /></filter></defs></svg>
      <div ref={headerRef} className={`site-header${pastHero ? ' is-sticky' : ''}${menuVisible ? ' menu-is-open' : ''}`}>
        <a className="brand" href={sitePath("/")} aria-label={`${logoAlt} home`}><img src={activeLogoSrc} alt={logoAlt} width="452" height="132" /></a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href={sitePath("/")}>OVERVIEW</a>
          {dropdownGroups.map(({key,title,href}) => {
            const group = menus.find(item => item.label.toUpperCase() === key);
            return group && <HeaderDropdown key={key} title={title} href={href} group={group} />;
          })}
          <button ref={menuTrigger} className="menu-toggle" aria-expanded={menuOpen} aria-controls="site-menu" aria-haspopup="dialog" onClick={menuOpen ? closeMenu : openMenu}>MENU <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span></button>
        </nav>
      </div>
    <nav className="side-quick-menu" aria-label="Quick links" hidden={menuOpen}>
      <a href={APPLY_URL} aria-label="Apply now"><span>Apply Now</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5H5v15h14v-8M14 4l3-3 4 4-3 3-8 8-4 1 1-4Z" /></svg></a>
      <a href="tel:+917259162060" aria-label="Contact Us"><span>Contact Us</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3 2 6c0 7 9 16 16 16l3-3-5-5-3 2c-3-1-5-3-6-6l2-3Z" /></svg></a>
      <a href={resolveSiteHref("https://dgu.ac.in/uploads/documents/View-Book-2026.pdf")} target="_blank" rel="noopener noreferrer" aria-label="Download brochure"><span>Download Brochure</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v13m-5-5 5 5 5-5M3 14v7h18v-7" /></svg></a>
    </nav>
    <dialog id="site-menu" className={`mega-menu-overlay${menuVisible ? ' is-visible' : ''}`} ref={menuDialog}
      aria-label="Main navigation menu" onCancel={(event) => { event.preventDefault(); closeMenu(); }}
      onClose={() => { setMenuVisible(false); setMenuOpen(false); }}>
      {menuContent}
    </dialog>

  </>;
}
