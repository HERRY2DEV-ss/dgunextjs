'use client';
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import ApiRichText from './ApiRichText';
import type { AcademicFeature } from './academic-features';

/** Full API copy opens outside the wave, without changing its measurements. */
export default function AcademicFeatureDialog({ point, onClose }: { point: AcademicFeature | undefined; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null), titleId = useId();
  useEffect(() => {
    const node = dialog.current;
    if (!point || !node) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; node.showModal();
    return () => { node.close(); document.body.style.overflow = previousOverflow; };
  }, [point]);
  if (!point || typeof document === 'undefined') return null;
  return createPortal(<dialog ref={dialog} className="academic-feature-dialog" aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}>
    <button type="button" className="academic-feature-close" aria-label="Close details" autoFocus onClick={onClose}>×</button>
    <h2 id={titleId}>{point.title}</h2>
    <ApiRichText html={point.html || point.description} scrollTables />
  </dialog>, document.body);
}
