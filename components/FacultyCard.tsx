'use client';

import { useState } from 'react';
import type { FacultyMember } from './faculty-data';

/** One card design shared by the faculty directory and school/MBA sliders. */
export default function FacultyCard({ member, priority = false, compact = false, duplicate = false }: {
  member: FacultyMember; priority?: boolean; compact?: boolean; duplicate?: boolean;
}) {
  const [failedImage, setFailedImage] = useState('');
  const Name = compact ? 'h3' : 'h2';
  const content = <>
    <div className="faculty-card-panel">
      <div className="faculty-portrait">
        {failedImage === member.image || !member.image ? <span className="faculty-photo-unavailable">Photo unavailable</span> : <img src={member.image} alt={member.name} width="360" height="400" loading={priority ? 'eager' : 'lazy'} decoding="async" draggable={false} onError={() => setFailedImage(member.image)} />}
      </div>
      <div className="faculty-card-copy">
        <Name>{member.name}</Name>
        {member.role && <p className="faculty-designation">{member.role}</p>}
        {!compact && member.notes.length > 0 && <p className="faculty-note">{member.notes.join(' · ')}</p>}
        {!compact && member.vidwan && <p className="faculty-vidwan">Vidwan ID: {member.vidwan}</p>}
        {compact && member.href && <span className="faculty-profile-cta">View profile <Arrow /></span>}
      </div>
    </div>
    {!compact && member.href && <span className="faculty-profile-cta">View profile <Arrow /></span>}
  </>;
  return <article className={'faculty-card' + (compact ? ' school-faculty-slide' : '') + (duplicate ? ' is-loop-copy' : '')} aria-hidden={duplicate || undefined}>
    {member.href ? <a className="faculty-profile-link" href={member.href} tabIndex={duplicate ? -1 : undefined} aria-label={`View ${member.name}'s profile`}>{content}</a> : <div className="faculty-profile-link">{content}</div>}
  </article>;
}

function Arrow() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>;
}
