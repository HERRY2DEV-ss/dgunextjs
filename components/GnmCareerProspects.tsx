import Image from 'next/image';
import './gnm-career-prospects.css';

const employerGroups = [
  {
    title: 'Top Corporate & Private Hospital Chains',
    logos: [
      { src: '/assets/academic/gnm-career/apollo-hospitals.png', alt: 'Apollo Hospitals' },
      { src: '/assets/academic/gnm-career/max-healthcare.png', alt: 'Max Healthcare' },
      { src: '/assets/academic/gnm-career/fortis-hospitals.png', alt: 'Fortis Hospitals' },
    ],
  },
  {
    title: 'Home Healthcare & Digital Health Companies',
    logos: [
      { src: '/assets/academic/gnm-career/portea-health-at-home.png', alt: 'Portea Heal at Home' },
      { src: '/assets/academic/gnm-career/apollo-homecare.png', alt: 'Apollo Homecare' },
      { src: '/assets/academic/gnm-career/kefi-healthcare.png', alt: 'KEFI Healthcare' },
    ],
  },
  {
    title: 'Government Hospitals & Institutes',
    logos: [
      { src: '/assets/academic/gnm-career/aiims.png', alt: 'All India Institute of Medical Sciences' },
      { src: '/assets/academic/gnm-career/indian-railways-rrb.png', alt: 'Indian Railways' },
      { src: '/assets/academic/gnm-career/military-nursing-services.png', alt: 'Military Nursing Services' },
    ],
  },
] as const;

const roles = [
  { title: 'Staff Nurse / Nursing Officer', detail: '(Private & Government Hospitals)', icon: 'hospital', side: 'left' },
  { title: 'Home Healthcare Specialist', detail: '', icon: 'home', side: 'right' },
  { title: 'Community Health Nurse', detail: '(CHN)', icon: 'community', side: 'left' },
  { title: 'Military Nurse / Industrial Nurse', detail: '', icon: 'shield', side: 'right' },
  { title: 'Critical Care / ICU Nurse', detail: '', icon: 'critical', side: 'left' },
  { title: 'Nursing Educator', detail: '', icon: 'education', side: 'right' },
] as const;

function RoleIcon({ name }: { name: (typeof roles)[number]['icon'] }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      {name === 'hospital' && <>
        <path {...common} d="M8 40V13h20v27M28 22h12v18M13 18h4m5 0h1m-10 6h4m5 0h1m-10 6h4m5 0h1M17 40V34h7v6" />
        <path {...common} d="M15 7v7m-3.5-3.5h7M34 28h1m3 0h1m-5 5h1m3 0h1" />
        <circle {...common} cx="34" cy="12" r="4" />
        <path {...common} d="M30 11h8m-4-4v3m-6 30v-7a6 6 0 0 1 12 0v7m-8-7v7m4-7v7" />
      </>}
      {name === 'home' && <>
        <path {...common} d="m6 22 18-15 18 15v18H6zM19 40V27h10v13" />
        <circle {...common} cx="24" cy="16" r="4" />
        <circle {...common} cx="12" cy="24" r="3" /><circle {...common} cx="36" cy="24" r="3" />
        <path {...common} d="M18 37v-8a6 6 0 0 1 12 0v8M4 39v-7a7 7 0 0 1 9-6m31 13v-7a7 7 0 0 0-9-6m-4-17v-5h5v10" />
        <path {...common} d="M22 16h4m-2-2v4" />
      </>}
      {name === 'community' && <>
        <circle {...common} cx="24" cy="13" r="5" /><circle {...common} cx="11" cy="19" r="4" /><circle {...common} cx="37" cy="19" r="4" />
        <path {...common} d="M14 40v-8a10 10 0 0 1 20 0v8M3 39v-7a8 8 0 0 1 8-8m34 15v-7a8 8 0 0 0-8-8M24 28v8m-4-4h8" />
      </>}
      {name === 'shield' && <>
        <path {...common} d="M24 5 39 11v11c0 10-6 17-15 21C15 39 9 32 9 22V11z" />
        <circle {...common} cx="24" cy="17" r="5" />
        <path {...common} d="m18 13 2-5 4 2 4-2 2 5m-9 10v10m6-10v10m-9-7h12m-10 8-3 5m11-5 3 5m-4-21h.1" />
        <path {...common} d="M21 16h6m-3-3v6" />
      </>}
      {name === 'critical' && <>
        <path {...common} d="M24 41S7 31 7 19a9 9 0 0 1 17-4 9 9 0 0 1 17 4c0 12-17 22-17 22z" />
        <path {...common} d="M10 25h8l3-6 5 12 4-7h8" />
      </>}
      {name === 'education' && <>
        <path {...common} d="M7 8h34v23H7zM12 36h24m-12-5v5" />
        <circle {...common} cx="15" cy="20" r="3" /><circle {...common} cx="33" cy="22" r="3" />
        <path {...common} d="M10 28v-2a5 5 0 0 1 10 0v2m8 0v-1a5 5 0 0 1 10 0v1m-8-16h9m-9 4h6" />
      </>}
    </svg>
  );
}

export default function GnmCareerProspects() {
  const leftRoles = roles.filter(role => role.side === 'left');
  const rightRoles = roles.filter(role => role.side === 'right');

  return (
    <section className="gnm-career-prospects" aria-label="Career prospects">
      <div className="gnm-career-prospects-stage">
        <div className="gnm-career-prospects-artwork">
          <ol className="gnm-career-role-list gnm-career-role-list--left">
            {leftRoles.map(role => (
              <li className="gnm-career-role" key={role.title}>
                <span className="gnm-career-role-icon"><RoleIcon name={role.icon} /></span>
                <span className="gnm-career-role-copy"><strong>{role.title}</strong>{role.detail && <small>{role.detail}</small>}</span>
              </li>
            ))}
          </ol>
          <div className="gnm-career-prospects-center">
            <h2>Career <strong>Prospects</strong></h2>
            <p>A diploma in GNM opens diverse pathways in the rapidly growing global healthcare sector. Our graduates routinely secure roles as:</p>
          </div>
          <ol className="gnm-career-role-list gnm-career-role-list--right">
            {rightRoles.map(role => (
              <li className="gnm-career-role" key={role.title}>
                <span className="gnm-career-role-copy"><strong>{role.title}</strong></span>
                <span className="gnm-career-role-icon"><RoleIcon name={role.icon} /></span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="gnm-career-employer-groups">
        {employerGroups.map(group => (
          <article className="gnm-career-employer-group" key={group.title}>
            <h3>{group.title}</h3>
            <ul>
              {group.logos.map(logo => (
                <li key={logo.src}>
                  <Image src={logo.src} alt={logo.alt} width={352} height={100} />
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
