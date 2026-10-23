'use client';

import { useEffect, useState } from 'react';
import { APPLY_URL } from './navigation.config';
import { requestPrograms } from './programs-api';

export default function QuickContactForm({ courses, selectedCourse = '', schoolUrl = '', applyUrl, apiOnly = false }: { courses?: string[]; selectedCourse?: string; schoolUrl?: string; applyUrl?: string; apiOnly?: boolean }) {
  const [status, setStatus] = useState('');
  const [attempt, setAttempt] = useState(0);
  const scope = `${schoolUrl}|${attempt}`;
  const supplied = courses !== undefined;
  const [feed, setFeed] = useState<{ scope: string; courses: string[]; error: boolean }>({ scope: '', courses: [], error: false });
  useEffect(() => {
    if (supplied) return;
    let active = true;
    requestPrograms(schoolUrl).then(schools => {
      const rows = schoolUrl ? schools.filter(school => school.url.replace(/^https?:\/\/(www\.)?dgu\.ac\.in\//, '').replace(/\/$/, '') === schoolUrl) : schools;
      if (schoolUrl && schools.length && !rows.length) throw new Error('A different school was returned.');
      if (active) setFeed({ scope, courses: rows.flatMap(school => school.programs.map(program => program.name)), error: false });
    }).catch(() => { if (active) setFeed({ scope, courses: [], error: true }); });
    return () => { active = false; };
  }, [supplied, schoolUrl, scope]);
  const current = feed.scope === scope;
  const loading = !supplied && !current;
  const unavailable = !supplied && current && feed.error;
  const options = Array.from(new Set(courses ?? (current ? feed.courses : []))).filter(Boolean);
  return <form className="school-contact-form" onSubmit={event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    const body = ['DBS Global University enquiry', ...['name', 'email', 'phone', 'course', 'state', 'city'].map(key => `${key}: ${String(fields.get(key) || '')}`)];
    setStatus('Your email app will open with your enquiry. Send the email there to complete your request.');
    window.location.href = `mailto:admissions@dgu.ac.in?subject=${encodeURIComponent('Programme enquiry')}&body=${encodeURIComponent(body.join('\n'))}`;
  }}>
    <h2>Quick Contact</h2>
    <input type="text" name="name" placeholder="Enter Name *" aria-label="Enter Name" autoComplete="name" required />
    <input type="email" name="email" placeholder="Enter Email Address *" aria-label="Enter Email Address" autoComplete="email" required />
    <div className="school-phone-row"><select aria-label="Country code" defaultValue="+91"><option>+91</option></select><input type="tel" name="phone" placeholder="Enter Mobile Number *" aria-label="Enter Mobile Number" autoComplete="tel-national" inputMode="numeric" pattern="[0-9]{10}" title="Enter a 10 digit mobile number" required /></div>
    <select name="course" aria-label="Select Course" defaultValue={selectedCourse} disabled={!options.length} required><option value="" disabled>{loading ? 'Loading courses…' : 'Select Course *'}</option>{options.map(course => <option key={course}>{course}</option>)}</select>
    {unavailable && <p className="school-contact-status" role="status">Courses are temporarily unavailable. <button type="button" className="text-link" onClick={() => setAttempt(value => value + 1)}>Try again</button></p>}
    {!loading && !unavailable && !options.length && <p className="school-contact-status" role="status">No courses are available yet.</p>}
    <div className="school-location-row"><input name="state" placeholder="Enter State *" aria-label="State" autoComplete="address-level1" required /><input name="city" placeholder="Enter City *" aria-label="City" autoComplete="address-level2" required /></div>
    <label className="school-consent"><input type="checkbox" required /><span>I agree to receive information about my enquiry from DBS Global University.</span></label>
    <button type="submit" disabled={!options.length}>Send enquiry by email</button>
    {(!apiOnly || applyUrl) && <p className="school-contact-status">You can also <a href={applyUrl || APPLY_URL}>apply through the admissions portal</a>.</p>}
    {status && <p className="school-contact-status" role="status">{status}</p>}
  </form>;
}
