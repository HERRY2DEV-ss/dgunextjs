import { academicProgramRoutes } from './academic-route-identities';
import type { SchoolProgram } from './programs-api';

type ProgramIdentity = { id: string; slug: string };
type SpecializationParent = { slug: string; id: string };

const parentById: Record<string, SpecializationParent> = {};
const parentBySlug: Record<string, SpecializationParent> = {};

function register(parent: SpecializationParent, ids: string[], slugs: string[]) {
  ids.forEach(id => { parentById[id] = parent; });
  slugs.forEach(slug => { parentBySlug[slug] = parent; });
}

register({ slug: 'btech', id: '88' },
  ['13', '14', '34', '35', '36', '89', '102'],
  ['btech-cse-with-minor', 'btech-cse-with-spe-in-ai-and-ml-with-minor', 'btech-cse-in-quantum-computing-with-minor',
    'btech-cse-with-spe-in-ai-and-ml-hcl', 'btech-cse-with-spe-in-cyber-security-hcl',
    'btech-cse-with-spe-in-data-science-hcl', 'btech-cse-lateral-entry']);
register({ slug: 'mba', id: '10' },
  ['23', '24', '25', '26', '27', '28', '29', '30', '31'],
  ['mba-business-analytics', 'mba-digital-marketing', 'mba-marketing', 'mba-human-resource', 'mba-finance',
    'mba-international-business', 'mba-healthcare-pharma-management', 'mba-logistics-supply-chain',
    'mba-media-and-creative-communication']);
register({ slug: 'bba', id: '2' },
  ['3', '4', '5', '17', '18', '19', '20', '21', '22'],
  ['bba-general', 'bba-ecommerce-supplychain', 'bba-fintech', 'bba-business-analytics',
    'bba-specialization-digital-marketing', 'bba-entrepreneurship', 'bba-banking-financial-services',
    'bba-capital-markets', 'bba-international-business']);
register({ slug: 'bcom', id: '6' },
  ['7', '8', '9'],
  ['bcom-icai', 'bcom-ukacca', 'bcom-uscpa']);

export function specializationParent(info: ProgramIdentity & { kind: string }): SpecializationParent | null {
  if (info.kind !== 'program') return null;
  return parentById[info.id] || parentBySlug[academicProgramRoutes[info.slug] || info.slug] || null;
}

function isCurrentProgram(program: SchoolProgram, current: ProgramIdentity) {
  if (program.id && current.id && program.id === current.id) return true;
  const hrefSlug = program.href.match(/\/programs\/([^/]+)/i)?.[1];
  const currentSlug = academicProgramRoutes[current.slug] || current.slug;
  return !!hrefSlug && (hrefSlug === currentSlug || hrefSlug === current.slug);
}

export function relatedSpecializations(programs: SchoolProgram[], current: ProgramIdentity): SchoolProgram[] {
  if (!programs.some(program => isCurrentProgram(program, current))) return [];
  return programs.filter(program => !isCurrentProgram(program, current));
}

export function mergeOtherSpecializations(direct: SchoolProgram[], siblings: SchoolProgram[], current: ProgramIdentity): SchoolProgram[] {
  const seen = new Set<string>();
  return [...direct, ...siblings].filter(program => {
    if (isCurrentProgram(program, current)) return false;
    const key = program.id || program.href || program.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
