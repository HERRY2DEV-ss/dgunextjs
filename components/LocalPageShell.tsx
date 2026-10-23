'use client';
import { createContext, useContext, useState, type ReactNode } from 'react';
import Navigation from './Navigation';
import SiteFooter from './SiteFooter';
import SmoothScrolling from './SmoothScrolling';
const PageMenuContext = createContext(false);
export function usePageMenuOpen() { return useContext(PageMenuContext); }
export default function LocalPageShell({ children, className }: { children: ReactNode; className: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <PageMenuContext.Provider value={menuOpen}><div className={className}>
    <SmoothScrolling disabled={menuOpen} />
    <Navigation onOpenChange={setMenuOpen} />
    {children}
    <SiteFooter />
  </div></PageMenuContext.Provider>;
}
