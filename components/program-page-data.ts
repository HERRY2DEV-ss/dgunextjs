/** Local route identity and approved artwork only; all editorial content comes from Program Info. */
export type ProgramPageData = {
  slug: string;
  schoolSlug?: 'business' | 'advanced-computing' | 'law' | 'liberal-studies' | 'modern-media' | 'pharmacy' | 'agriculture-forestry' | 'future-skills';
  sourceUrl?: string;
  referenceLayout?: boolean;
  showSchoolPlacements?: boolean;
  videoSrc?: string;
  videoPoster?: string;
  shortName: string;
  fullName: string;
  heroImage: string;
  heroAlt: string;
  heroCaption: string;
  intro: readonly string[];
  recognitionTitle: string;
  recognitions: readonly { image: string; alt: string }[];
  videoHeading?: string;
  videoTitle?: string;
  videoDescription?: string;
  specializationGroups?: ReadonlyArray<ReadonlyArray<{
    eyebrow?: string;
    title: string;
    note?: string;
    href?: string;
  }>>;
  pathwayOptions?: {
    tabLabels?: readonly [string, string];
    columnLabels?: readonly [string, string, string, string];
    highlightsLabels?: readonly [string, string];
    introduction: string;
    rows: ReadonlyArray<{ pathway: string; focus: string; structure: string; idealFor: string }>;
    globalIntroduction: readonly string[];
    globalHighlights: ReadonlyArray<{ highlight: string; description: string }>;
  };
  admissionDetails?: {
    advantages: ReadonlyArray<ReadonlyArray<string>>;
    eligibility: string;
    feeRows: ReadonlyArray<{ course: string; fee: string }>;
    feeNote: string;
  };
  industryCollaborations?: ReadonlyArray<{
    title: string;
    subtitle?: string;
    paragraphs: readonly string[];
  }>;
  faqs?: ReadonlyArray<{ question: string; answer: string }>;
};

const programRoutes = [
  {"slug":"mba","schoolSlug":"business","referenceLayout":true,"heroImage":"/nextjs/homev1/assets/academic/mba-banner.webp","videoSrc":"/nextjs/homev1/assets/mba.mp4","videoPoster":"/nextjs/homev1/assets/academic/mba-banner.webp"},
  {"slug":"mba-business-analytics","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/mba-business-analytics","heroImage":"/nextjs/homev1/assets/school-business.webp","videoSrc":"/nextjs/homev1/assets/mba.mp4","videoPoster":"/nextjs/homev1/assets/mba.webp"},
  {"slug":"bba","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/bba","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"bba-bfsi","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/school-of-business","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"bba-business-analytics","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/school-of-business","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"bba-capital-markets","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/school-of-business","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"bba-digital-marketing","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/school-of-business","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"bba-ecommerce-supply-chain","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/school-of-business","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"bba-entrepreneurship","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/school-of-business","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"bba-fintech","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/bba-fintech","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"bba-international-business","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/school-of-business","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"bcom","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/school-of-business","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"bcom-icai","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/school-of-business","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"bcom-acca","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/school-of-business","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"bcom-cpa","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/school-of-business","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"bba-mba","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/bba-mba-integrated","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"mba-winter","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/mba-winter-batch","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"global-mba","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/school-of-business","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"phd-management","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/school-of-business","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"mba-digital-transformation","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/school-of-business","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"mba-finance","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/school-of-business","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"mba-marketing","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/school-of-business","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"mba-human-resource","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/school-of-business","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"mba-international-business","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/mba-international-business","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"mba-logistics-supply-chain","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/school-of-business","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"mba-healthcare-pharma","schoolSlug":"business","sourceUrl":"https://dgu.ac.in/school-of-business","heroImage":"/nextjs/homev1/assets/school-business.webp"},
  {"slug":"ba-llb","schoolSlug":"law","sourceUrl":"https://dgu.ac.in/ba-llb","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"bba-llb","schoolSlug":"law","sourceUrl":"https://dgu.ac.in/bba-llb","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"llm","schoolSlug":"law","sourceUrl":"https://dgu.ac.in/llm","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"phd-law","schoolSlug":"law","sourceUrl":"https://dgu.ac.in/school-of-law","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"llm-corporate-banking","schoolSlug":"law","sourceUrl":"https://dgu.ac.in/school-of-law","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"llm-cyber-law","schoolSlug":"law","sourceUrl":"https://dgu.ac.in/school-of-law","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"llm-constitutional-law","schoolSlug":"law","sourceUrl":"https://dgu.ac.in/school-of-law","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"llm-criminal-law","schoolSlug":"law","sourceUrl":"https://dgu.ac.in/school-of-law","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"llm-international-trade","schoolSlug":"law","sourceUrl":"https://dgu.ac.in/school-of-law","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"llm-intellectual-property","schoolSlug":"law","sourceUrl":"https://dgu.ac.in/school-of-law","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"ba-liberal-studies","schoolSlug":"liberal-studies","sourceUrl":"https://dgu.ac.in/school-of-liberal-studies","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"ma-liberal-studies","schoolSlug":"liberal-studies","sourceUrl":"https://dgu.ac.in/school-of-liberal-studies","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"ma-english-literature","schoolSlug":"liberal-studies","sourceUrl":"https://dgu.ac.in/school-of-liberal-studies","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"ma-economics","schoolSlug":"liberal-studies","sourceUrl":"https://dgu.ac.in/school-of-liberal-studies","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"ma-psychology","schoolSlug":"liberal-studies","sourceUrl":"https://dgu.ac.in/school-of-liberal-studies","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"phd-liberal-studies","schoolSlug":"liberal-studies","sourceUrl":"https://dgu.ac.in/school-of-liberal-studies","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"ba-digital-media","schoolSlug":"modern-media","sourceUrl":"https://dgu.ac.in/school-of-modern-media","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"ba-film-tv","schoolSlug":"modern-media","sourceUrl":"https://dgu.ac.in/school-of-modern-media","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"ma-mass-communication","schoolSlug":"modern-media","sourceUrl":"https://dgu.ac.in/school-of-modern-media","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"mba-media-creative","schoolSlug":"modern-media","sourceUrl":"https://dgu.ac.in/school-of-modern-media","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"phd-modern-media","schoolSlug":"modern-media","sourceUrl":"https://dgu.ac.in/school-of-modern-media","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"dpharm","schoolSlug":"pharmacy","sourceUrl":"https://dgu.ac.in/dpharm","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"bpharm","schoolSlug":"pharmacy","sourceUrl":"https://dgu.ac.in/bpharm","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"bpharm-lateral","schoolSlug":"pharmacy","sourceUrl":"https://dgu.ac.in/school-of-pharmacy","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"msc-pharmaceutical-chemistry","schoolSlug":"pharmacy","sourceUrl":"https://dgu.ac.in/school-of-pharmacy","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"phd-pharmacy","schoolSlug":"pharmacy","sourceUrl":"https://dgu.ac.in/school-of-pharmacy","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"bsc-agriculture","schoolSlug":"agriculture-forestry","sourceUrl":"https://dgu.ac.in/school-of-agriculture-science","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"bsc-forestry","schoolSlug":"agriculture-forestry","sourceUrl":"https://dgu.ac.in/school-of-agriculture-science","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"bsc-agri-business","schoolSlug":"agriculture-forestry","sourceUrl":"https://dgu.ac.in/school-of-agriculture-science","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"msc-agronomy","schoolSlug":"agriculture-forestry","sourceUrl":"https://dgu.ac.in/school-of-agriculture-science","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"mba-agri-business","schoolSlug":"agriculture-forestry","sourceUrl":"https://dgu.ac.in/school-of-agriculture-science","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"phd-agriculture","schoolSlug":"agriculture-forestry","sourceUrl":"https://dgu.ac.in/school-of-agriculture-science","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-artificial-intelligence","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-machine-learning","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-big-data-python-r","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-internet-of-things","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-sap","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-sas","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-nism","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-digital-marketing","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-ecommerce","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-agile-scrum","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-advanced-excel","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-big-data-analytics","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-tally","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-derivatives","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-french","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-hr-analytics","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-international-logistics","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-java","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-luxury-brand-marketing","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-rapidminer-tableau","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-red-hat-linux","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-social-media-marketing","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-web-development","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-dotnet-networking","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
  {"slug":"cert-data-analytics-tools","schoolSlug":"future-skills","sourceUrl":"https://dgu.ac.in/school-of-future-skills","heroImage":"/nextjs/homev1/assets/hero-campus.webp"},
] satisfies Array<Pick<ProgramPageData, "slug" | "schoolSlug" | "sourceUrl" | "heroImage" | "videoSrc" | "videoPoster" | "referenceLayout">>;

export const programPages: Record<string, ProgramPageData> = Object.fromEntries(programRoutes.map(route => [route.slug, {
  ...route, heroAlt: "Programme banner", heroCaption: "", shortName: "", fullName: "",
  intro: [], recognitionTitle: "", recognitions: [],
}]));
