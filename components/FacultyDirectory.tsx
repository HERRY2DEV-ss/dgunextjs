'use client';

import { useMemo, useRef, useState } from 'react';
import FacultyCard from './FacultyCard';
import useFaculty from './useFaculty';
import '../app/faculties/faculties.css';

const PAGE_SIZE = 6;
export default function FacultyDirectory() {
  const { data, loading, error, retry } = useFaculty();
  const directoryId = 'faculty-directory';
  const searchId = 'faculty-search';
  const designationId = 'faculty-designation';
  const facultyMembers = useMemo(() => data || [], [data]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const directory = useRef<HTMLElement>(null);
  const categories = useMemo(() => Array.from(new Set(facultyMembers.map(member => member.category))), [facultyMembers]);
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return facultyMembers.filter(member => (category === 'all' || member.category === category) &&
      (!search || [member.name, member.role, ...member.notes, member.vidwan].join(' ').toLocaleLowerCase().includes(search)));
  }, [query, category, facultyMembers]);
  const pages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(1, pages));
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  const pageNumbers = Array.from({ length: pages }, (_, index) => index + 1).filter(number => number === 1 || number === pages || Math.abs(number - currentPage) <= 2);
  const changePage = (next: number) => {
    setPage(next);
    requestAnimationFrame(() => directory.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
  };

  return <section ref={directory} id={directoryId} className="faculty-directory" aria-label="Faculty directory" aria-busy={loading}>
    <div className="faculty-controls">
      <div className="faculty-search">
        <label htmlFor={searchId}>FIND A FACULTY MEMBER</label>
        <div className="faculty-search-field">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
          <input id={searchId} type="search" placeholder="Search by name or designation" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} />
        </div>
      </div>
      <div className="faculty-filter">
        <label htmlFor={designationId}>DESIGNATION</label>
        <select id={designationId} value={category} onChange={event => { setCategory(event.target.value); setPage(1); }}>
          <option value="all">All designations</option>
          {categories.map(value => <option value={value} key={value}>{value}</option>)}
        </select>
      </div>
    </div>
    <p className="faculty-results" role="status" aria-live="polite">{loading ? 'Loading faculty members…' : error ? 'Faculty directory unavailable.' : filtered.length ? `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length} faculty members` : facultyMembers.length ? 'No faculty members match your search.' : 'No faculty members are published yet.'}</p>
    {!loading && !error && visible.length > 0 && <h2 className="faculty-directory-heading">Our Academic &amp; Executive Leadership</h2>}
    {error ? <div className="faculty-empty" role="alert"><h2>Unable to load faculty</h2><p>{error}</p><button type="button" onClick={retry}>Try again</button></div>
      : loading ? <div className="faculty-empty" aria-hidden="true">Please wait while the directory loads.</div>
      : visible.length ? <div className="faculty-grid">{visible.map((member, index) => <FacultyCard member={member} key={member.id} priority={index < 4} />)}</div>
      : <div className="faculty-empty"><h2>{facultyMembers.length ? 'No results found' : 'Faculty information coming soon'}</h2><p>{facultyMembers.length ? 'Try another name or choose a different designation.' : 'No faculty members are published in the directory yet.'}</p>{facultyMembers.length > 0 && <button type="button" onClick={() => { setQuery(''); setCategory('all'); setPage(1); }}>Clear filters</button>}</div>}
    {pages > 1 && <nav className="faculty-pagination" aria-label="Faculty directory pages">
      <button type="button" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)} aria-label="Previous faculty page"><span aria-hidden="true">←</span></button>
      {pageNumbers.map((number, index) => <span className="faculty-page-number" key={number}>
        {index > 0 && number - pageNumbers[index - 1] > 1 && <span className="faculty-page-gap" aria-hidden="true">…</span>}
        <button type="button" aria-label={`Faculty page ${number}`} aria-current={currentPage === number ? 'page' : undefined} onClick={() => changePage(number)}>{number}</button>
      </span>)}
      <button type="button" disabled={currentPage === pages} onClick={() => changePage(currentPage + 1)} aria-label="Next faculty page"><span aria-hidden="true">→</span></button>
    </nav>}
  </section>;
}
