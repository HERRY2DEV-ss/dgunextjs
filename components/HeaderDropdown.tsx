'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { menuHref, type MenuItem } from './navigation-api';
import './header-dropdown.css';

type Panel = { items: MenuItem[]; label: string; left: number; top: number; width: number; side?: 'left' | 'right'; parent: HTMLElement };
// Keep nested panels flush so the pointer never crosses an unhoverable gap.
const GAP = 0;

export default function HeaderDropdown({ title, href, group }: { title: string; href: string; group?: MenuItem }) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  const cancelClose = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  const close = () => { cancelClose(); setPanels([]); setPortalTarget(null); };
  // Keep the top-level header dropdown on its original short close delay.
  const leaveRoot = () => { cancelClose(); timer.current = setTimeout(() => { setPanels([]); setPortalTarget(null); }, 180); };
  // Nested panels are portalled with a small visual gap, so give pointer travel
  // between a parent row and its child panel a longer grace period.
  const leavePanel = () => { cancelClose(); timer.current = setTimeout(() => { setPanels([]); setPortalTarget(null); }, 420); };
  const focusPanel = (level: number) => requestAnimationFrame(() => panelRefs.current[level]?.querySelector<HTMLElement>('a,button')?.focus());

  const showRoot = (focus = false) => {
    cancelClose();
    if (!group?.children.length || !root.current) return;
    // Native dialogs render in the browser top layer. Portal quick-menu panels
    // into the open dialog so they remain visible above the mega-menu surface.
    const openMenu = document.querySelector<HTMLElement>('.mega-menu-overlay[open]');
    setPortalTarget(openMenu ?? document.body);
    const rect = root.current.getBoundingClientRect();
    const headerBottom = root.current.closest('.site-header')?.getBoundingClientRect().bottom ?? rect.bottom;
    const width = Math.min(292, window.innerWidth - 24);
    setPanels([{ items: group.children, label: title, width,
      left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
      top: headerBottom + 10, parent: toggle.current! }]);
    if (focus) focusPanel(0);
  };
  const showBranch = (item: MenuItem, level: number, row: HTMLElement, focus = false) => {
    cancelClose();
    const openMenu = document.querySelector<HTMLElement>('.mega-menu-overlay[open]');
    setPortalTarget(openMenu ?? document.body);
    if (!item.children.length) { setPanels(previous => previous.slice(0, level + 1)); return; }
    const rect = row.getBoundingClientRect();
    const panelRect = panelRefs.current[level]?.getBoundingClientRect();
    if (!panelRect) return;
    const width = Math.min(292, window.innerWidth - 24);
    const right = panelRect.right + GAP;
    const left = right + width <= window.innerWidth - 12 ? right : panelRect.left - width - GAP;
    const top = Math.max(panels[0]?.top ?? 12, Math.min(rect.top, window.innerHeight - Math.min(item.children.length * 48 + 62, 420) - 12));
    setPanels(previous => [...previous.slice(0, level + 1), { items: item.children, label: item.label,
      left: Math.max(12, left), top, width, side: left < panelRect.left ? 'left' : 'right', parent: row.querySelector<HTMLButtonElement>('button')! }]);
    if (focus) focusPanel(level + 1);
  };

  useEffect(() => {
    if (!panels.length) return;
    const outside = (event: Event) => {
      const target = event.target as Node | null;
      if (target && !root.current?.contains(target) && !panelRefs.current.some(panel => panel?.contains(target))) setPanels([]);
    };
    const dismiss = () => { setPanels([]); setPortalTarget(null); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    window.addEventListener('resize', dismiss);
    window.addEventListener('scroll', dismiss);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      window.removeEventListener('resize', dismiss);
      window.removeEventListener('scroll', dismiss);
    };
  }, [panels.length]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return <div ref={root} className="dgu-header-dropdown" onMouseEnter={() => showRoot()} onMouseLeave={leaveRoot}
    onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); close(); toggle.current?.focus(); }
      if (event.key === 'ArrowDown' && group?.children.length) { event.preventDefault(); showRoot(true); }
    }}>
    <a href={group ? menuHref(group) || href : href} onClick={close}>{title}</a>
    {!!group?.children.length && <button ref={toggle} type="button" className="dgu-header-dropdown-toggle"
      aria-label={`${title} submenu`} aria-expanded={panels.length > 0} aria-controls={panels.length ? `${id}-0` : undefined}
      onClick={() => panels.length ? close() : showRoot(true)}><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg></button>}
    {panels.length > 0 && createPortal(<>{panels.map((panel, level) => <div key={`${id}-${level}`}
      ref={element => { panelRefs.current[level] = element; }} id={`${id}-${level}`} className={`dgu-header-panel${level > 0 ? ' dgu-header-panel--nested' : ''}`}
      style={{ left: panel.left, top: panel.top, width: panel.width, ...(level > 0 ? { height: Math.min(panel.items.length * 44 + 12, Math.max(120, window.innerHeight - panel.top - 12)), maxHeight: `calc(100dvh - ${panel.top + 12}px)` } : {}) }}
      onWheel={level > 0 ? event => event.stopPropagation() : undefined}
      onMouseEnter={cancelClose} onMouseLeave={leavePanel}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); close(); toggle.current?.focus(); }
        if (event.key === 'ArrowLeft' && level > 0) { event.preventDefault(); setPanels(previous => previous.slice(0, level)); panel.parent.focus(); }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          const controls = Array.from(panelRefs.current[level]?.querySelectorAll<HTMLElement>('a,button') || []);
          const index = controls.indexOf(document.activeElement as HTMLElement);
          controls[(index + (event.key === 'ArrowDown' ? 1 : -1) + controls.length) % controls.length]?.focus();
        }
      }}>
      <ul aria-label={`${panel.label} links`}>{panel.items.map((item, index) => {
        const itemHref = menuHref(item);
        const active = panels[level + 1]?.items === item.children;
        return <li key={`${item.label}-${index}`} className={active ? 'is-active' : undefined}
          onMouseEnter={event => showBranch(item, level, event.currentTarget)}
          onKeyDown={event => { if (event.key === 'ArrowRight' && item.children.length) { event.preventDefault(); showBranch(item, level, event.currentTarget, true); } }}>
          {itemHref ? <a href={itemHref} target={item.target === '_blank' ? '_blank' : undefined}
            rel={item.target === '_blank' ? 'noopener noreferrer' : undefined} onClick={close}>{item.label}</a>
            : item.children.length ? <button type="button" className="dgu-header-branch-label"
              aria-expanded={active} aria-controls={active ? `${id}-${level + 1}` : undefined}
              onClick={event => showBranch(item, level, event.currentTarget.parentElement!, true)}>{item.label}</button>
            : <span className="dgu-header-label">{item.label}</span>}
          {!!item.children.length && <button type="button" className="dgu-header-branch-toggle" data-direction={active ? panels[level + 1]?.side : 'right'}
            aria-label={`${item.label} submenu`} aria-expanded={active} aria-controls={active ? `${id}-${level + 1}` : undefined}
            onClick={event => active ? setPanels(previous => previous.slice(0, level + 1)) : showBranch(item, level, event.currentTarget.parentElement!, true)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
          </button>}
        </li>;
      })}</ul>
    </div>)}</>, portalTarget ?? document.body)}
  </div>;
}
