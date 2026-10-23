import type { Metadata } from 'next';
import LocalPageShell from '../../components/LocalPageShell';
import FacultyDirectory from '../../components/FacultyDirectory';
import './faculties.css';

export const metadata: Metadata = {
  title: 'Leadership & Faculty | DBS Global University',
  description: 'Meet the leadership and faculty members of DBS Global University, Dehradun.',
};

export default function FacultiesPage() {
  return <LocalPageShell className="faculty-page">
    <a className="faculty-skip" href="#faculty-directory">Skip to faculty directory</a>
    <main className="faculty-main">
      <header className="faculty-intro">
        <h1>LEADERSHIP &amp; FACULTY</h1>
      </header>
      <div className="faculty-wordcloud" data-navigation-opening><img src="/nextjs/homev1/assets/faculty/learn-from-best.png" alt="Learn from the best: expertise, guidance, experience, leadership, knowledge and research" width={1632} height={520} fetchPriority="high" /></div>
      <FacultyDirectory />
    </main>
  </LocalPageShell>;
}
