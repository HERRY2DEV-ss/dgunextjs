'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const targets = [
  '.school-intro-main', '.school-enquiry', '.school-accreditation',
  '.school-page main > section > h2', '.school-faculty-intro',
  '.program-overview-copy', '.program-enquiry', '.program-industry-card', '.program-faqs > h2',
  '.admissions-opening > h1', '.admissions-process-inner > h2', '.admissions-process-grid', '.admissions-fees > h2', '.admissions-resources > h2',
  '.internal-content > .internal-section', '.internal-accordion', '.internal-hero-media',
  '.local-article > section', '.local-content-card', '.local-profile-summary',
  '.faculty-card', '.local-news-card', '.local-gallery-photo',
  '.post-recruiter-tabs .section-heading', '.placement-copy',
  '.campus-overview .campus-reveal', '.news-article-body',
].join(',');

// Content stays visible before hydration and when JS/motion is unavailable.
// One observer and one timing curve give all page types the same entry motion.
export default function PageMotion() {
  const pathname = usePathname();
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!('IntersectionObserver' in window)) return;
    const registered = new WeakSet<Element>();
    const animated = new Set<Element>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (preference.matches) continue;
        entry.target.classList.add('dgu-enter');
        animated.add(entry.target);
      }
    }, { threshold: 0.05, rootMargin: '0px 0px -16px 0px' });
    let frame = 0;
    const register = () => {
      frame = 0;
      if (preference.matches) return;
      document.querySelectorAll<HTMLElement>(targets).forEach(element => {
        if (registered.has(element) || element.closest('[aria-hidden="true"]') || !element.getClientRects().length) return;
        registered.add(element);
        // Above-the-fold content renders immediately; animate later sections once.
        if (element.getBoundingClientRect().top >= window.innerHeight - 16) observer.observe(element);
      });
    };
    register();
    const mutations = new MutationObserver(() => {
      if (!frame) frame = requestAnimationFrame(register);
    });
    mutations.observe(document.querySelector('main') || document.body, { childList: true, subtree: true });
    const onPreference = () => {
      if (preference.matches) {
        observer.disconnect();
        animated.forEach(element => element.classList.remove('dgu-enter'));
      } else register();
    };
    preference.addEventListener('change', onPreference);
    return () => {
      observer.disconnect(); mutations.disconnect(); cancelAnimationFrame(frame);
      preference.removeEventListener('change', onPreference);
      animated.forEach(element => element.classList.remove('dgu-enter'));
    };
  }, [pathname]);
  return null;
}
