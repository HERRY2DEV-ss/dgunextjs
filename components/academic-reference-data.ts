import type { ProgramPageData } from './program-page-data';
import type { SchoolPageData } from './school-page-data';

/** PDF-based demo content explicitly requested for these three reference layouts. */
export const referenceStats: [string, string][] = [
  ['400+', 'Recruiters'], ['40+ LPA', 'Highest CTC'], ['1500+', 'Students Placed'], ['92%', 'Placement Rate'],
];
export const referenceDifferentiatorIcons = ['industry', 'labs', 'global', 'career', 'interdisciplinary', 'innovation'].map(name => '/nextjs/homev1/assets/academic/difference-' + name + '.webp');
export const computingRecruiters: ReadonlyArray<readonly [string, string]> = [
  ['wipro', 'Wipro'], ['infosys', 'Infosys'], ['hcltech', 'HCLTech'], ['kpmg', 'KPMG'],
  ['techmahindra', 'Tech Mahindra'], ['deloitte', 'Deloitte'], ['tcs', 'TCS'],
];

/** Presentation FAQs for the reference pages; supplied FAQs always take priority. */
export const mbaReferenceFaqs = [
  { question: 'Where can I explore the MBA specializations and pathways?', answer: '<p>Explore the Program Specialization cards and the Program Options at a Glance and MBA Global Pathway tabs on this page. Open a course card to read about that programme.</p>' },
  { question: 'Where can I check MBA eligibility and fees?', answer: '<p>Use the Eligibility Criteria and Fee Structure tabs on this page. Contact the admissions team for the latest requirements, fees and applicable admission conditions.</p>' },
  { question: 'How can I learn more about the MBA faculty?', answer: '<p>Browse the Doon Business School faculty section. You can search by name or designation and select View profile to read more about an individual faculty member.</p>' },
  { question: 'How can I ask the admissions team about the MBA?', answer: '<p>Use the enquiry form on this page to contact the admissions team about programme options and the application process.</p>' },
];

export function referenceSchoolFaqs(schoolName: string) {
  return [
    { question: `Where can I find the programmes offered by ${schoolName}?`, answer: '<p>Browse the Our Programs section on this page. Select a programme to open its detailed course information, including the available eligibility and fee details.</p>' },
    { question: 'How can I explore faculty profiles?', answer: '<p>Use the faculty search or designation filter below the Faculty heading. Select View profile on a card to read more about that faculty member.</p>' },
    { question: 'Where can I find placement and recruiter information?', answer: '<p>Explore the Placements and Top Recruiters sections on this page, along with the latest Placement Updates in the news section.</p>' },
    { question: 'How can I contact the admissions team?', answer: '<p>Use the enquiry form near the introduction to ask the admissions team about programme choices and the application process.</p>' },
  ];
}

const route = (slug: string) => '/nextjs/homev1/programs/' + slug + '/';
const computingRoute = (slug: string) => '/nextjs/homev1/' + slug + '/';
export const mbaReference: Partial<ProgramPageData> = {
  shortName: 'MBA', fullName: 'MBA (Master of Business Administration)',
  heroCaption: 'Unlock the Potential of your Leadership Skills with our innovative MBA',
  intro: [
    "Doon Business School's MBA portfolio is an elite suite of outcome-driven programs built on an 18-year legacy of excellence in management education.",
    'The MBA is designed to build managerial depth, industry alignment, and flexible career outcomes. Unlike conventional MBA structures that defer differentiation to a narrow elective window, the DBS model combines a strong common management foundation with applied technologies, specialization depth, and pathway flexibility, enabling students to shape a sharper professional trajectory from the very beginning.',
  ],
  recognitionTitle: 'Global Membership | Recognition',
  recognitions: [
    { image: '/nextjs/homev1/media/schools/accreditation-aacsb.webp', alt: 'AACSB Member' },
    { image: '/nextjs/homev1/media/schools/accreditation-business-graduates.webp', alt: 'Business Graduates Association Member' },
    { image: '/nextjs/homev1/media/schools/accreditation-ioh.webp', alt: 'IOH Certified 2025-26' },
    { image: '/nextjs/homev1/media/schools/accreditation-iscea.webp', alt: 'ISCEA' },
  ],
  specializationGroups: [
    [
      { eyebrow: 'MBA with Specialization in', title: 'Business Analytics', href: route('mba-business-analytics') },
      { eyebrow: 'MBA with Specialization in', title: 'Digital Transformation', href: route('mba-digital-transformation') },
      { eyebrow: 'MBA in', title: 'Marketing', href: route('mba-marketing') },
      { eyebrow: 'MBA in', title: 'Human Resource', href: route('mba-human-resource') },
    ],
    [
      { eyebrow: 'MBA in', title: 'Finance', href: route('mba-finance') },
      { eyebrow: 'MBA in', title: 'International Business', href: route('mba-international-business') },
      { eyebrow: 'MBA in', title: 'Logistics & Supply Chain Management', href: route('mba-logistics-supply-chain') },
      { title: 'Global MBA', note: '(2026-28)', href: route('global-mba') },
    ],
    [
      { eyebrow: 'MBA in', title: 'Healthcare Pharma Management', href: route('mba-healthcare-pharma') },
      { eyebrow: 'MBA in', title: 'Media & Creative Communication', href: route('mba-media-creative') },
    ],
  ],
  pathwayOptions: {
    tabLabels: ['Program Options at a Glance', 'MBA Global Pathway'],
    introduction: 'Students can choose the pathway that matches their ambition, learning preference, and intended level of industry exposure.',
    rows: [
      { pathway: 'MBA', focus: 'Management foundation with specialization depth and applied project orientation', structure: 'Core courses, major / minor electives, internship and consulting projects', idealFor: 'Students seeking a broad management foundation and career specialization' },
      { pathway: 'MBA with SAP & SAS', focus: 'MBA learning strengthened through enterprise systems and analytics exposure', structure: 'MBA structure with SAP and SAS learning components, labs and applied analytics', idealFor: 'Students targeting analytics, business systems and data-driven management roles' },
      { pathway: 'MBA Global', focus: 'Management learning with international academic exposure', structure: 'MBA structure with global courses and international learning opportunities', idealFor: 'Students seeking global exposure and cross-cultural career readiness' },
    ],
    globalIntroduction: ['Explore a global learning pathway with international academic exposure and applied management study.'],
    globalHighlights: [
      { highlight: 'International learning', description: 'Sample global immersion and cross-cultural learning opportunities.' },
      { highlight: 'Career readiness', description: 'Sample projects that connect management learning with international business contexts.' },
    ],
  },
  admissionDetails: {
    advantages: [
      ['Dehradun - A Safe, Beautiful & Cosmopolitan Education City.', 'Bundle of Industry Integrated Value Added Certificates.', 'Students from 23 States & 5 Countries on campus.', 'Multiple Placements for all.'],
      ['More than 350+ Companies for Campus Placement.', 'Possibilities of International Exposure.', 'On-campus hostels with Modern Sporting & Gym facilities.'],
    ],
    eligibility: 'Sample eligibility content: graduation in a recognised discipline. Final eligibility and admission conditions will follow the published programme information.',
    feeRows: [{ course: 'MBA - 2026-28', fee: 'Sample fee content - to be updated' }],
    feeNote: 'This sample fee panel is for the reference layout. Published fees are taken from the Program Info API when available.',
  },
  industryCollaborations: [
    { title: 'NISM Integration', subtitle: 'Capital Markets Focus', paragraphs: ['Sample content for capital markets learning, applied finance projects and industry-focused activities.'] },
    { title: 'SAP Program', paragraphs: ['Sample content for enterprise systems, practical applications and management learning.'] },
    { title: 'SAS Program', paragraphs: ['Sample content for business analytics, data interpretation and applied classroom projects.'] },
    { title: 'IIM Residential Program', paragraphs: ['Sample content for the residential learning experience, peer collaboration and management activities.'] },
  ],
};

export const referencePlacementCopy = 'Placement is an independent activity managed by the career development cell and the students through their nominated committee member, under the guidance of an experienced Placement Coordinator. The activities calendar incorporates opportunities to promote industry interaction. Relationship building with corporates through knowledge exchange helps nurture talent and develop professional skills.';

/** Scoped demo defaults: all other programme pages retain the API-only contract. */
export function referenceProgram(base: ProgramPageData): ProgramPageData {
  const details = base.admissionDetails;
  const demoDetails = mbaReference.admissionDetails!;
  const supplied = (base.specializationGroups?.flat() || []).map(item => ({
    ...item,
    // Related-program descriptions belong on their course page, not in its title card.
    note: item.note && item.note.length <= 120 ? item.note : undefined,
  }));
  const identity = (title: string) => title.toLowerCase().replace(/^mba\s+(?:with specialization in|in)\s+/, '').replace(/[^a-z0-9]/g, '');
  const demoColumns = mbaReference.specializationGroups!;
  let columns: ProgramPageData['specializationGroups'];
  if (supplied.length < 3) {
    const matched = new Set<string>();
    columns = demoColumns.map(group => group.map(demo => {
      const live = supplied.find(item => identity(item.title) === identity(demo.title));
      if (!live) return demo;
      matched.add(live.title);
      return { ...demo, href: live.href || demo.href, note: live.note || demo.note };
    }));
    const additional = supplied.filter(item => !matched.has(item.title));
    columns = columns.map((group, index) => index === 2 ? [...group, ...additional] : group);
  } else {
    // Balance three non-empty columns even when the API supplies four or five courses.
    let offset = 0;
    columns = Array.from({ length: 3 }, (_, index) => {
      const size = Math.floor(supplied.length / 3) + (index < supplied.length % 3 ? 1 : 0);
      const group = supplied.slice(offset, offset + size);
      offset += size;
      return group;
    });
  }
  return {
    ...base,
    shortName: base.shortName || mbaReference.shortName!,
    fullName: base.fullName && !/^mba$/i.test(base.fullName.trim()) ? base.fullName : mbaReference.fullName!,
    heroCaption: base.heroCaption || mbaReference.heroCaption!,
    intro: base.intro.length ? base.intro : mbaReference.intro!,
    recognitionTitle: base.recognitionTitle || mbaReference.recognitionTitle!,
    recognitions: base.recognitions.length ? base.recognitions : mbaReference.recognitions!,
    specializationGroups: columns,
    pathwayOptions: {
      ...mbaReference.pathwayOptions!, ...base.pathwayOptions,
      introduction: base.pathwayOptions?.introduction || mbaReference.pathwayOptions!.introduction,
      rows: base.pathwayOptions?.rows.length ? base.pathwayOptions.rows : mbaReference.pathwayOptions!.rows,
      globalIntroduction: base.pathwayOptions?.globalIntroduction.length ? base.pathwayOptions.globalIntroduction : mbaReference.pathwayOptions!.globalIntroduction,
      globalHighlights: base.pathwayOptions?.globalHighlights.length ? base.pathwayOptions.globalHighlights : mbaReference.pathwayOptions!.globalHighlights,
    },
    admissionDetails: {
      advantages: details?.advantages.some(column => column.length) ? details.advantages : demoDetails.advantages,
      eligibility: details?.eligibility || demoDetails.eligibility,
      feeRows: details?.feeRows.length ? details.feeRows : demoDetails.feeRows,
      feeNote: details?.feeNote || demoDetails.feeNote,
    },
    industryCollaborations: mbaReference.industryCollaborations!.map(demo => {
      const token = demo.title.split(' ')[0];
      const supplied = base.industryCollaborations?.find(item => new RegExp('\\b' + token + '\\b', 'i').test(item.title));
      return supplied ? { ...supplied, title: demo.title, subtitle: supplied.subtitle || demo.subtitle } : demo;
    }),
  };
}

export function referencePlacement(school: SchoolPageData): SchoolPageData['placement'] {
  return { ...school.placement, tagline: ['ENJOY EVERYDAY WHILE', 'ENSURING GREAT CAREER'], description: referencePlacementCopy, stats: referenceStats };
}

export const referenceSchoolPrograms: Record<string, SchoolPageData['programs']> = {
  'advanced-computing': [
    { title: 'Undergraduate', items: [
      { name: 'B.Tech CSE', href: computingRoute('btech') },
      { name: 'B.Tech CSE', note: 'in AI & ML with Minor', href: computingRoute('btech-cse-with-spe-in-ai-and-ml-with-minor') },
      { name: 'B.Tech CSE', note: 'in Quantum Computing with Minor', href: computingRoute('btech-cse-in-quantum-computing-with-minor') },
      { name: 'B.Tech CSE', note: 'with Minor', href: computingRoute('btech-cse-with-minor') },
      { name: 'B.Tech CSE', note: 'with Dual Specialization in AI & ML - HCLTech', href: computingRoute('btech-cse-with-spe-in-ai-and-ml-hcl') },
      { name: 'B.Tech CSE', note: 'with Dual Specialization in Cyber Security - HCLTech', href: computingRoute('btech-cse-with-spe-in-cyber-security-hcl') },
      { name: 'B.Tech CSE', note: 'with Dual Specialization in Data Science - HCLTech', href: computingRoute('btech-cse-with-spe-in-data-science-hcl') },
      { name: 'B.Tech CSE', note: 'with Dual Specialization', href: computingRoute('btech') },
    ] },
    { title: 'Integrated', items: [{ name: 'B.Tech CSE + MBA', href: computingRoute('integrated-btech-mba') }, { name: 'B.Tech CSE + M.Tech', href: computingRoute('integrated-btech-mtech') }] },
    { title: 'Postgraduate', items: [{ name: 'M.Tech CSE / M.Tech CSE', note: 'by Research', href: computingRoute('mtech') }, { name: 'MCA', href: computingRoute('mca') }] },
  ],
  business: [
    { title: 'Undergraduate', items: [{ name: 'BBA', href: route('bba') }, { name: 'B.Com', href: route('bcom') }] },
    { title: 'Integrated', items: [{ name: 'BBA + MBA', href: route('bba-mba') }] },
    { title: 'Postgraduate', items: [{ name: 'MBA', href: route('mba') }, { name: 'MBA Winter Batch', href: route('mba-winter') }, { name: 'Global MBA', href: route('global-mba') }] },
  ],
};
