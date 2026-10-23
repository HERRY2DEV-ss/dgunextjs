import { PLACEMENTS_HREF } from './news-routes';

/** The user-approved homepage copy; only student media is page-specific. */
export default function HomepagePlacementCopy({headingId}:{headingId?:string}) {
  return <div className="placement-copy homepage-placement-copy">
    <h2 id={headingId}>PLACEMENTS</h2>
    <p className="placement-tagline">ENJOY EVERYDAY WHILE<br />ENSURING GREAT CAREER</p>
    <p className="placement-description">Placement is an independent activity managed by the career development cell &amp; the students on their own through their nominated committee member, under the overall guidance of an experienced Placement Coordinator. Moreover, the activities calendar of DGU has incorporated a number of activities which have been designed to promote industry interaction. Relationship building with Corporates through rich knowledge exchange helps build a trust in DGU capabilities to nurture talent and impart necessary skills in its students.</p>
    <a className="text-link placement-page-link" href={PLACEMENTS_HREF}>Read More <span aria-hidden="true">→</span></a>
    <div className="placement-stats">{[['400+', 'Recruiters'], ['40+ LPA', 'Highest CTC'], ['1500+', 'Students Placed'], ['92%', 'Placement Rate']].map(([value,label],i)=><div className={`stat stat-${i}`} key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
  </div>;
}
