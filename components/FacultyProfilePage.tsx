'use client';
import { useEffect, useState, type ReactNode } from 'react';
import LocalPageShell from './LocalPageShell';
import InternalPageHero from './InternalPageHero';
import { facultySlug } from './faculty-api';
import useFaculty from './useFaculty';
import { richTextNodes as facultyContent } from './ApiRichText';
import { SITE_BASE } from './site-routes';
import '../app/faculties/faculties.css';
import '../app/faculties/profile/profile.css';

export { richTextNodes as facultyContent } from './ApiRichText';

function Profile({ slug }: { slug: string }) {
  const { data, loading, error, retry } = useFaculty({ URL: slug });
  const faculty = data?.find(member => member.slug === slug);
  const [failed, setFailed] = useState(false);
  const [content, setContent] = useState<ReactNode>(null);
  useEffect(() => { setFailed(false); setContent(faculty?.details ? facultyContent(faculty.details) : null); }, [faculty]);
  useEffect(() => { if (faculty) document.title = `${faculty.name} | DBS Global University`; }, [faculty]);
  if (loading) return <><InternalPageHero title="Faculty profile"/><p role="status">Loading faculty profile…</p></>;
  if (error) return <div data-navigation-opening className="faculty-empty" role="alert"><h1>Profile unavailable</h1><p>{error}</p><button type="button" onClick={retry}>Try again</button></div>;
  if (!faculty) return <div data-navigation-opening className="faculty-empty"><h1>Profile not found</h1><p>Please choose another faculty member from the directory.</p></div>;
  return <><InternalPageHero title={faculty.name} eyebrow={faculty.school || 'DBS Global University'} parent={{label:'Faculties',href:`${SITE_BASE}/faculties/`}}/><article className="faculty-detail-layout">
    <aside className="faculty-detail-portrait">{faculty.image && !failed ? <img src={faculty.image} alt={faculty.name} width={360} height={440} onError={() => setFailed(true)} /> : <span className="faculty-photo-unavailable">Photo unavailable</span>}</aside>
    <div className="faculty-detail-copy"><header><p className="faculty-eyebrow">{faculty.school || 'DBS Global University'}</p><h2>{faculty.name}</h2>{faculty.role && <p className="faculty-detail-role">{faculty.role}</p>}</header>
      {(faculty.qualification || faculty.department || faculty.experience || faculty.vidwan) && <dl className="faculty-detail-facts">
        {([['Qualification', faculty.qualification], ['Department', faculty.department], ['Experience', faculty.experience], ['Vidwan ID', faculty.vidwan]] as const).filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>}
      {faculty.details && <div className="faculty-detail-body">{content}</div>}
    </div>
  </article></>;
}

export default function FacultyProfilePage({ slug: providedSlug }: { slug?: string }) {
  const [query, setQuery] = useState<string | null>(null);
  useEffect(() => {
    if (providedSlug) return;
    const sync = () => setQuery(new URLSearchParams(window.location.search).get('url') || '');
    sync(); window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [providedSlug]);
  const selected = providedSlug ?? query;
  const slug = facultySlug(selected);
  return <LocalPageShell className="faculty-page internal-page faculty-detail-page">
    <a className="faculty-skip" href="#faculty-profile">Skip to faculty profile</a>
    <main className="faculty-main" id="faculty-profile">
      {selected === null ? <><InternalPageHero title="Faculty profile"/><p role="status">Loading faculty profile…</p></> : slug ? <Profile key={slug} slug={slug} /> : <div className="faculty-empty"><h1>Choose a faculty profile</h1><p>This profile link is missing or invalid. Open a faculty member from the directory.</p></div>}
      <a className="faculty-detail-back" href={`${SITE_BASE}/faculties/`}>← Back to faculty directory</a>
    </main>
  </LocalPageShell>;
}
