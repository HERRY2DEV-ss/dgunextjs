'use client';
import { useState } from 'react';
import ApiRichText from './ApiRichText';
import type { PlacementStudent } from './placements-api';
import './placements-api.css';

function StudentPhoto({ student }: { student: PlacementStudent }) {
  const [failed, setFailed] = useState(false);
  return !student.image || failed ? <div className="student-photo-unavailable" aria-hidden="true" />
    : <img src={student.image} alt={[student.name, student.company].filter(Boolean).join(' — ')} loading="lazy" width="355" height="498" onError={() => setFailed(true)} />;
}

export default function PlacementStudentCard({ student, open, onToggle, onClose }: {
  student: PlacementStudent; open: boolean; onToggle: () => void; onClose: () => void;
}) {
  return <article className={`student-card placement-student-card${open ? ' is-open' : ''}`} data-student-id={student.id || undefined} aria-label={[student.name, student.company].filter(Boolean).join(', ')}>
    <StudentPhoto key={student.image} student={student} />
    <button className="student-profile-trigger" type="button" aria-label={student.name ? `Show ${student.name}'s placement details` : 'Show placement details'} aria-expanded={open} onClick={event => {
      if (event.detail === 0 || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) onToggle();
    }} />
    <div className="student-hover">
      <button className="student-placement-close" type="button" aria-label="Close placement details" onClick={event => { onClose(); event.currentTarget.blur(); }}>×</button>
      <div className="student-hover-copy">
        <span>PLACEMENT</span>
        {student.name && <h3>{student.name}</h3>}
        {(student.name || student.company) && <i aria-hidden="true" />}
        {student.company && <p className="student-company">{student.company}</p>}
        {student.designation && <p>{student.designation}</p>}
        {student.batch && <p>{student.batch}</p>}
        {student.description && <ApiRichText html={student.description} scrollTables />}
      </div>
    </div>
  </article>;
}
