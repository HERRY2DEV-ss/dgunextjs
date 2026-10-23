'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import FacultyCard from './FacultyCard';
import useFaculty from './useFaculty';
import { facultySlug, type ApiFaculty } from './faculty-api';
import { requestFacultyPhotos, type FacultyPhotos } from './faculty-photo-api';
import '../app/faculties/faculties.css';

export default function SchoolFaculty({ schoolUrl, schoolName, facultyIds, members, paused = false }: {
  schoolUrl: string; schoolName: string; facultyIds?: string[] | null; members?: ApiFaculty[]; paused?: boolean; variant?: 'default' | 'reference';
}) {
  const scope = facultySlug(schoolUrl);
  const enabled = !!scope && (members !== undefined ? members.length > 0 : facultyIds?.length !== 0);
  const needsPhotos = members?.some(member => !member.image) ?? false;
  const remote = useFaculty({ SCHOOL_URL: scope }, enabled && members === undefined);
  const [photoAttempt, setPhotoAttempt] = useState(0);
  const photoScope = `${scope}:${photoAttempt}`;
  const [photoState, setPhotoState] = useState<FacultyPhotos & { scope: string }>({ scope: '', images: {}, missing: [] });
  useEffect(() => {
    if (!enabled || !members || !needsPhotos) return;
    let active = true;
    requestFacultyPhotos(scope, members).then(result => {
      if (active) setPhotoState({ ...result, scope: photoScope });
    });
    return () => { active = false; };
  }, [enabled, members, needsPhotos, scope, photoScope]);
  const currentPhotos = photoState.scope === photoScope;
  const loading = members === undefined ? remote.loading : needsPhotos && !currentPhotos;
  const error = members === undefined ? remote.error : needsPhotos && currentPhotos && photoState.missing.length ? 'Some faculty photos are temporarily unavailable.' : '';
  const retry = members === undefined ? remote.retry : () => setPhotoAttempt(value => value + 1);
  const allowedIds = members === undefined && facultyIds ? new Set(facultyIds) : null;
  const photos = currentPhotos ? photoState.images : {};
  const items = (members || remote.data || []).filter(member => !allowedIds || allowedIds.has(member.id)).map(member =>
    !member.image && photos[member.slug] ? { ...member, image: photos[member.slug] } : member);
  const titleId = useId();
  const track = useRef<HTMLDivElement>(null);
  const visible = useRef(false);
  const interaction = useRef(0);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const reverseWrap = useRef(false);
  const [columns, setColumns] = useState(4);
  const looping = items.length > columns;

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 700px)');
    const tablet = window.matchMedia('(max-width: 1100px)');
    const update = () => setColumns(mobile.matches ? 1 : tablet.matches ? 2 : 4);
    update(); mobile.addEventListener('change', update); tablet.addEventListener('change', update);
    return () => { mobile.removeEventListener('change', update); tablet.removeEventListener('change', update); };
  }, []);

  useEffect(() => {
    const node = track.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => { visible.current = entry.isIntersecting; });
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, items.length]);

  useEffect(() => { if (track.current) track.current.scrollLeft = 0; }, [schoolUrl, columns]);

  const move = useCallback((direction: 1 | -1) => {
    const node = track.current;
    if (!node || !looping) return;
    const cards = Array.from(node.children) as HTMLElement[];
    const first = cards[0], second = cards[1], copy = cards[items.length];
    if (!first || !second || !copy) return;
    const stride = second.offsetLeft - first.offsetLeft;
    const width = copy.offsetLeft - first.offsetLeft;
    if (stride <= 0 || width <= 0) return;
    let start = node.scrollLeft;
    if (start >= width) { start -= width; node.scrollLeft = start; }
    if (direction === -1 && start < stride / 2) { start = width; reverseWrap.current = true; node.scrollLeft = width; }
    node.scrollTo({ left: Math.max(0, Math.min(width, Math.round(start / stride) * stride + direction * stride)), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [items.length, looping]);

  useEffect(() => {
    if (!looping || paused) return;
    const timer = window.setInterval(() => {
      if (visible.current && !document.hidden && Date.now() - interaction.current >= 1800 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) move(1);
    }, 3800);
    return () => window.clearInterval(timer);
  }, [looping, move, paused]);

  const manual = (direction: 1 | -1) => { interaction.current = Date.now(); move(direction); };
  if (!enabled || (!loading && !error && !items.length)) return null;
  return <section className="school-faculty school-faculty--slider faculty-page" data-faculty-school={scope} aria-labelledby={titleId}>
    <h2 id={titleId}>FACULTY<span className="visually-hidden"> — {schoolName}</span></h2>
    {loading && <p className="faculty-slider-feedback" role="status">Loading faculty…</p>}
    {error && <div className="faculty-slider-feedback" role="alert"><p>{error}</p><button type="button" onClick={retry}>Try again</button></div>}
    {!loading && !error && !items.length && <p className="faculty-slider-feedback" role="status">Faculty information will be available soon.</p>}
    <div className="school-faculty-track" ref={track} role="region" aria-roledescription="carousel" aria-label={`${schoolName} faculty`} aria-busy={loading} tabIndex={looping ? 0 : -1}
      onScroll={() => {
        const node = track.current, first = node?.children[0] as HTMLElement | undefined, copy = node?.children[items.length] as HTMLElement | undefined;
        const width = first && copy ? copy.offsetLeft - first.offsetLeft : 0;
        if (node && reverseWrap.current) { if (node.scrollLeft < width - .5) reverseWrap.current = false; return; }
        if (node && width > 0 && node.scrollLeft >= width) node.scrollLeft -= width;
      }}
      onWheel={() => { interaction.current = Date.now(); }}
      onTouchStart={() => { interaction.current = Date.now(); }}
      onPointerDown={event => {
        if (event.pointerType !== 'mouse' || event.button !== 0) return;
        pointer.current = { x: event.clientX, y: event.clientY }; dragged.current = false;
      }}
      onPointerMove={event => {
        if (!pointer.current) return;
        const dx = event.clientX - pointer.current.x, dy = event.clientY - pointer.current.y;
        if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.2) {
          pointer.current = null; dragged.current = true; event.currentTarget.setPointerCapture?.(event.pointerId); manual(dx < 0 ? 1 : -1);
        }
      }}
      onPointerUp={() => { pointer.current = null; }} onPointerCancel={() => { pointer.current = null; dragged.current = false; }}
      onPointerLeave={() => { pointer.current = null; }}
      onClickCapture={event => { if (dragged.current) { event.preventDefault(); event.stopPropagation(); dragged.current = false; } }}
      onKeyDown={event => { if (event.target === event.currentTarget && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) { event.preventDefault(); manual(event.key === 'ArrowRight' ? 1 : -1); } }}>
      {(looping ? [...items, ...items] : items).map((member, index) => <FacultyCard key={`${member.id}-${index}`} member={member} compact duplicate={index >= items.length} />)}
    </div>
    {looping && <div className="faculty-slider-controls" aria-label="Faculty slider controls"><i aria-hidden="true" /><button type="button" onClick={() => manual(-1)} aria-label="Previous faculty member">‹</button><button type="button" onClick={() => manual(1)} aria-label="Next faculty member">›</button></div>}
  </section>;
}
