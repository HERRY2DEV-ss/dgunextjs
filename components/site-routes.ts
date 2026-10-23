import { newsDetailHref } from './news-urls';
import { localNavigationRoutes } from './local-navigation-routes';
import { cleanAcademicLink } from './academic-clean-routes';
import { SITE_BASE } from './site-base';
export { SITE_BASE } from './site-base';
const navigationRoutesLowercase = Object.fromEntries(Object.entries(localNavigationRoutes).map(([url, target]) => [url.toLowerCase(), target]));
// Routes verified against the pages included in this project.
const paths: Record<string, string> = {
  "mba": "programs/mba",
  "mba-business-analytics": "programs/mba-business-analytics",
  "bba": "programs/bba",
  "bba-bfsi": "programs/bba-bfsi",
  "bba-business-analytics": "programs/bba-business-analytics",
  "bba-capital-markets": "programs/bba-capital-markets",
  "bba-digital-marketing": "programs/bba-digital-marketing",
  "bba-ecommerce-supply-chain": "programs/bba-ecommerce-supply-chain",
  "bba-entrepreneurship": "programs/bba-entrepreneurship",
  "bba-fintech": "programs/bba-fintech",
  "bba-international-business": "programs/bba-international-business",
  "bcom": "programs/bcom",
  "bcom-icai": "programs/bcom-icai",
  "bcom-acca": "programs/bcom-acca",
  "bcom-cpa": "programs/bcom-cpa",
  "bba-mba": "programs/bba-mba",
  "bba-mba-integrated": "programs/bba-mba",
  "mba-winter": "programs/mba-winter",
  "mba-winter-batch": "programs/mba-winter",
  "global-mba": "programs/global-mba",
  "phd-management": "programs/phd-management",
  "mba-digital-transformation": "programs/mba-digital-transformation",
  "mba-finance": "programs/mba-finance",
  "mba-marketing": "programs/mba-marketing",
  "mba-human-resource": "programs/mba-human-resource",
  "mba-international-business": "programs/mba-international-business",
  "mba-logistics-supply-chain": "programs/mba-logistics-supply-chain",
  "mba-healthcare-pharma": "programs/mba-healthcare-pharma",
  "ba-llb": "programs/ba-llb",
  "bba-llb": "programs/bba-llb",
  "llm": "programs/llm",
  "phd-law": "programs/phd-law",
  "llm-corporate-banking": "programs/llm-corporate-banking",
  "llm-cyber-law": "programs/llm-cyber-law",
  "llm-constitutional-law": "programs/llm-constitutional-law",
  "llm-criminal-law": "programs/llm-criminal-law",
  "llm-international-trade": "programs/llm-international-trade",
  "llm-intellectual-property": "programs/llm-intellectual-property",
  "ba-liberal-studies": "programs/ba-liberal-studies",
  "ma-liberal-studies": "programs/ma-liberal-studies",
  "ma-english-literature": "programs/ma-english-literature",
  "ma-economics": "programs/ma-economics",
  "ma-psychology": "programs/ma-psychology",
  "phd-liberal-studies": "programs/phd-liberal-studies",
  "ba-digital-media": "programs/ba-digital-media",
  "ba-film-tv": "programs/ba-film-tv",
  "ma-mass-communication": "programs/ma-mass-communication",
  "mba-media-creative": "programs/mba-media-creative",
  "phd-modern-media": "programs/phd-modern-media",
  "dpharm": "programs/dpharm",
  "bpharm": "programs/bpharm",
  "bpharm-lateral": "programs/bpharm-lateral",
  "msc-pharmaceutical-chemistry": "programs/msc-pharmaceutical-chemistry",
  "phd-pharmacy": "programs/phd-pharmacy",
  "bsc-agriculture": "programs/bsc-agriculture",
  "bsc-forestry": "programs/bsc-forestry",
  "bsc-agri-business": "programs/bsc-agri-business",
  "msc-agronomy": "programs/msc-agronomy",
  "mba-agri-business": "programs/mba-agri-business",
  "phd-agriculture": "programs/phd-agriculture",
  "cert-artificial-intelligence": "programs/cert-artificial-intelligence",
  "cert-machine-learning": "programs/cert-machine-learning",
  "cert-big-data-python-r": "programs/cert-big-data-python-r",
  "cert-internet-of-things": "programs/cert-internet-of-things",
  "cert-sap": "programs/cert-sap",
  "cert-sas": "programs/cert-sas",
  "cert-nism": "programs/cert-nism",
  "cert-digital-marketing": "programs/cert-digital-marketing",
  "cert-ecommerce": "programs/cert-ecommerce",
  "cert-agile-scrum": "programs/cert-agile-scrum",
  "cert-advanced-excel": "programs/cert-advanced-excel",
  "cert-big-data-analytics": "programs/cert-big-data-analytics",
  "cert-tally": "programs/cert-tally",
  "cert-derivatives": "programs/cert-derivatives",
  "cert-french": "programs/cert-french",
  "cert-hr-analytics": "programs/cert-hr-analytics",
  "cert-international-logistics": "programs/cert-international-logistics",
  "cert-java": "programs/cert-java",
  "cert-luxury-brand-marketing": "programs/cert-luxury-brand-marketing",
  "cert-rapidminer-tableau": "programs/cert-rapidminer-tableau",
  "cert-red-hat-linux": "programs/cert-red-hat-linux",
  "cert-social-media-marketing": "programs/cert-social-media-marketing",
  "cert-web-development": "programs/cert-web-development",
  "cert-dotnet-networking": "programs/cert-dotnet-networking",
  "cert-data-analytics-tools": "programs/cert-data-analytics-tools",
  "school-of-business": "schools/business",
  "school-of-technology": "schools/advanced-computing",
  "school-of-advanced-computing": "schools/advanced-computing",
  "school-of-law": "schools/law",
  "school-of-liberal-studies": "schools/liberal-studies",
  "school-of-modern-media": "schools/modern-media",
  "school-of-pharmacy": "schools/pharmacy",
  "school-of-agriculture-science": "schools/agriculture-forestry",
  "school-of-future-skills": "schools/future-skills",
  "admission": "admissions",
  "admissions": "admissions",
  "admission-process": "admissions/#admission-process-title",
  "life-at-dgu": "life-at-dgu",
  "overview": "life-at-dgu",
  "campus-life": "life-at-dgu",
  "b-pharm": "programs/bpharm",
  "d-pharm": "programs/dpharm"
};
const programmeLabels: Record<string, string> = {
  "mba": "programs/mba",
  "mbabusinessanalytics": "programs/mba-business-analytics",
  "bbabbahonours": "programs/bba",
  "bbainbankingandfinancialservices": "programs/bba-bfsi",
  "bbainbusinessanalytics": "programs/bba-business-analytics",
  "bbaincapitalmarkets": "programs/bba-capital-markets",
  "bbaindigitalmarketing": "programs/bba-digital-marketing",
  "bbainecommerceandsupplychain": "programs/bba-ecommerce-supply-chain",
  "bbainentrepreneurship": "programs/bba-entrepreneurship",
  "bbainfintech": "programs/bba-fintech",
  "bbaininternationalbusiness": "programs/bba-international-business",
  "bcombcomhonours": "programs/bcom",
  "bcomwithicai": "programs/bcom-icai",
  "bcomwithukacca": "programs/bcom-acca",
  "bcomwithuscpa": "programs/bcom-cpa",
  "bbambaintegratedprograminmanagement": "programs/bba-mba",
  "mbawinterbatch": "programs/mba-winter",
  "mbaglobal": "programs/global-mba",
  "phdinmanagement": "programs/phd-management",
  "mbaindigitaltransformation": "programs/mba-digital-transformation",
  "mbainfinance": "programs/mba-finance",
  "mbainmarketing": "programs/mba-marketing",
  "mbainhumanresource": "programs/mba-human-resource",
  "mbaininternationalbusiness": "programs/mba-international-business",
  "mbainlogisticssupplychainmanagement": "programs/mba-logistics-supply-chain",
  "mbainhealthcarepharmamanagement": "programs/mba-healthcare-pharma",
  "ballbhons": "programs/ba-llb",
  "bballb": "programs/bba-llb",
  "llm": "programs/llm",
  "phdinlaw": "programs/phd-law",
  "llmincorporateandbankinglaw": "programs/llm-corporate-banking",
  "llmincyberlaw": "programs/llm-cyber-law",
  "llminconstitutionallaw": "programs/llm-constitutional-law",
  "llmincriminallaw": "programs/llm-criminal-law",
  "llmininternationaltradeandeconomiclaw": "programs/llm-international-trade",
  "llminintellectualpropertyrights": "programs/llm-intellectual-property",
  "babsliberalstudieshonours": "programs/ba-liberal-studies",
  "maliberalstudies": "programs/ma-liberal-studies",
  "maenglishliterature": "programs/ma-english-literature",
  "maeconomics": "programs/ma-economics",
  "mapsychology": "programs/ma-psychology",
  "phdinliberalstudies": "programs/phd-liberal-studies",
  "badigitalmediamasscommunications": "programs/ba-digital-media",
  "bafilmandtv": "programs/ba-film-tv",
  "mamasscommunication": "programs/ma-mass-communication",
  "mbamediacreativecommunication": "programs/mba-media-creative",
  "phdinmodernmedia": "programs/phd-modern-media",
  "dpharm": "programs/dpharm",
  "bpharm": "programs/bpharm",
  "bpharmlateralentry": "programs/bpharm-lateral",
  "mscpharmaceuticalchemistry": "programs/msc-pharmaceutical-chemistry",
  "phdinpharmaceuticalsciences": "programs/phd-pharmacy",
  "bscagriculturehonours": "programs/bsc-agriculture",
  "bscforestryhonours": "programs/bsc-forestry",
  "bscwithspecializationinagribusiness": "programs/bsc-agri-business",
  "mscagronomy": "programs/msc-agronomy",
  "mbawithspecializationinagribusiness": "programs/mba-agri-business",
  "phdinagriculture": "programs/phd-agriculture",
  "artificialintelligence": "programs/cert-artificial-intelligence",
  "machinelearning": "programs/cert-machine-learning",
  "bigdatapythonr": "programs/cert-big-data-python-r",
  "internetofthingsiot": "programs/cert-internet-of-things",
  "sap": "programs/cert-sap",
  "sas": "programs/cert-sas",
  "nismcertifications": "programs/cert-nism",
  "digitalmarketing": "programs/cert-digital-marketing",
  "ecommerce": "programs/cert-ecommerce",
  "agilescrum": "programs/cert-agile-scrum",
  "basicadvancedexcel": "programs/cert-advanced-excel",
  "bigdataanalytics": "programs/cert-big-data-analytics",
  "computerisedaccountingtally": "programs/cert-tally",
  "derivatives": "programs/cert-derivatives",
  "frenchlanguage": "programs/cert-french",
  "hranalytics": "programs/cert-hr-analytics",
  "internationallogistics": "programs/cert-international-logistics",
  "javatechnologies": "programs/cert-java",
  "luxurybrandmarketing": "programs/cert-luxury-brand-marketing",
  "rapidminertableau": "programs/cert-rapidminer-tableau",
  "redhatlinux": "programs/cert-red-hat-linux",
  "socialmediamarketing": "programs/cert-social-media-marketing",
  "websitedevelopmentimplementation": "programs/cert-web-development",
  "netframeworknetworking": "programs/cert-dotnet-networking",
  "dataanalyticstools": "programs/cert-data-analytics-tools",
  "bba": "programs/bba",
  "bcom": "programs/bcom",
  "bbamba": "programs/bba-mba",
  "bachelorofartsscience": "programs/ba-liberal-studies",
  "bscagriculture": "programs/bsc-agriculture",
  "bscforestry": "programs/bsc-forestry",
  "bscagribusiness": "programs/bsc-agri-business",
  "ballb": "programs/ba-llb"
};
Object.assign(programmeLabels, {"artificialintelligence": "programs/cert-artificial-intelligence", "machinelearning": "programs/cert-machine-learning", "bigdatapythonr": "programs/cert-big-data-python-r", "internetofthings": "programs/cert-internet-of-things", "sap": "programs/cert-sap", "sas": "programs/cert-sas", "nism": "programs/cert-nism", "digitalmarketing": "programs/cert-digital-marketing", "ecommerce": "programs/cert-ecommerce", "agilescrum": "programs/cert-agile-scrum", "advancedexcel": "programs/cert-advanced-excel", "bigdataanalytics": "programs/cert-big-data-analytics", "tally": "programs/cert-tally", "derivatives": "programs/cert-derivatives", "french": "programs/cert-french", "hranalytics": "programs/cert-hr-analytics", "internationallogistics": "programs/cert-international-logistics", "java": "programs/cert-java", "luxurybrandmarketing": "programs/cert-luxury-brand-marketing", "rapidminertableau": "programs/cert-rapidminer-tableau", "redhatlinux": "programs/cert-red-hat-linux", "socialmediamarketing": "programs/cert-social-media-marketing", "webdevelopment": "programs/cert-web-development", "dotnetnetworking": "programs/cert-dotnet-networking", "dataanalyticstools": "programs/cert-data-analytics-tools", "computerisedaccountingtally": "programs/cert-tally", "basicadvancedexcel": "programs/cert-advanced-excel", "javatechnologies": "programs/cert-java", "websitedevelopment": "programs/cert-web-development", "netframeworknetworking": "programs/cert-dotnet-networking"});
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
const local = (path: string) => `${SITE_BASE}/${path}${path.includes('#') || path.endsWith('/') ? '' : '/'}`;

export function resolveSiteHref(value: string, label = ''): string {
  const raw = value.trim().replace(/&amp;/g, '&');
  if (/^(javascript|data|vbscript):/i.test(raw)) return '';
  if (raw.startsWith('#')) return `${SITE_BASE}/${raw}`;
  if (/^(mailto|tel):/i.test(raw)) return raw;
  let url: URL;
  try { url = new URL(raw || '/', 'https://dgu.ac.in/'); } catch { return ''; }
  if (!['http:', 'https:'].includes(url.protocol)) return '';
  const academic=cleanAcademicLink(url.href);
  if(academic)return academic;
  const dguSite = ['dgu.ac.in', 'www.dgu.ac.in', 'dgu.ac', 'www.dgu.ac'].includes(url.hostname);
  const navigationKey = (dguSite ? 'https://dgu.ac.in' : url.origin) + url.pathname.replace(/\/$/, '') + url.search;
  const navigationPage = localNavigationRoutes[navigationKey] || navigationRoutesLowercase[navigationKey.toLowerCase()] || localNavigationRoutes[navigationKey + '/'] || navigationRoutesLowercase[(navigationKey + '/').toLowerCase()];
  if (navigationPage) return url.hash ? navigationPage.split('#')[0] + url.hash : navigationPage;
  if (url.hostname === 'doonbusinessschool.com' && url.pathname.replace(/\/$/, '') === '/mba') return local('programs/mba');
  if (!dguSite) return raw;
  let path = url.pathname.replace(/^\/+|\/+$/g, '');
  for (const prefix of ['nextjs/homev1', 'nextjs/home-new', 'nextjs/home']) {
    if (path === prefix) return `${SITE_BASE}/${url.search}${url.hash}`;
    if (path.startsWith(prefix + '/')) { path = path.slice(prefix.length + 1); break; }
  }
  if (!path || path === '.' || path === 'www.dgu.ac' || path === 'www.dgu.ac.in') return `${SITE_BASE}/${url.hash}`;
  if (path === 'www.doonbusinessschool.com') return 'https://www.doonbusinessschool.com/';
  if (/^[^/]+@[^/]+\.[^/]+$/.test(path)) return `mailto:${path}`;
  if (path.startsWith('cdn-cgi/l/email-protection')) return `${SITE_BASE}/contacts/`;
  if (path === 'admission-process') return `${SITE_BASE}/admissions/${url.hash || '#admission-process-title'}`;
  if (path === 'admission-requirements') return `${SITE_BASE}/admission-requirements/${url.hash}`;
  if (/^news\/[a-zA-Z0-9_-]+$/.test(path) || path === 'news' && url.searchParams.has('url')) {
    const article = newsDetailHref('/' + path + url.search);
    if (article) return article + url.hash;
  }
  if (/^(schools|programs)\//.test(path) || ['admissions', 'life-at-dgu', 'news', 'page-detail', 'program-detail', 'school-detail', 'document', 'image', 'faculties'].includes(path) || Object.values(localNavigationRoutes).includes(`${SITE_BASE}/${path}/`)) return local(path) + url.search + url.hash;
  const target = paths[path];
  if (target) return local(target) + url.search + (target.includes('#') ? '' : url.hash);
  const programme = programmeLabels[normalize(label)];
  if (programme && !/\.(pdf|jpg|png|webp|mp4)$/i.test(path)) return local(programme);
  let decodedPath = path;
  try { decodedPath = decodeURIComponent(path); } catch { /* Keep the original path when encoding is malformed. */ }
  const title = label.trim() || decodedPath.split('/').pop()?.replace(/[-_]/g, ' ');
  if (/\.(jpg|jpeg|png|webp|gif)$/i.test(path)) return `${SITE_BASE}/image/?src=${encodeURIComponent(url.href)}${title ? `&title=${encodeURIComponent(title)}` : ''}`;
  if (/\.pdf$/i.test(path) || (path.startsWith('uploads/documents/') && /\.html$/i.test(path))) return `${SITE_BASE}/document/?file=${encodeURIComponent('/' + path + url.search)}${title ? `&title=${encodeURIComponent(title)}` : ''}`;
  return `${SITE_BASE}/page-detail/?path=${encodeURIComponent('/' + path + url.search)}${title ? `&title=${encodeURIComponent(title)}` : ''}`;
}

export function programmeHref(name: string, schoolHref: string): string {
  const school = schoolHref.split('/').filter(Boolean).pop();
  const specific: Record<string, Record<string, string>> = {
    'liberal-studies': { MA: 'ma-liberal-studies', PhD: 'phd-liberal-studies' },
    'modern-media': { MA: 'ma-mass-communication' },
  };
  const slug = school ? specific[school]?.[name] : undefined;
  const programme = programmeLabels[normalize(name)];
  return slug ? local('programs/' + slug) : programme ? local(programme) : schoolHref;
}
