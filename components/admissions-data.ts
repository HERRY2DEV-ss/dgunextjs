import type { SchoolPageData } from './school-page-data';

type AdmissionTrack = { title: string; summary: string; more?: string };
export type AdmissionSchool = { name: string; tracks: { label: string; content: AdmissionTrack }[] };

const earlyBusiness = 'Before class XII results, DGU considers class X and XI marks, its entrance examination and an online interview. An early seat offer is conditional on meeting the class XII criteria stated in the offer letter.';
const earlyOther = 'Before class XII results, DGU considers school marks, its entrance examination and an online interview. Any early seat offer is conditional on meeting the class XII criteria in the offer letter.';

export const admissionSchools: AdmissionSchool[] = [
  { name: 'Doon Business School', tracks: [
    { label: 'Undergraduate', content: { title: 'Early and Regular Admission · BBA / B.Com', summary: earlyBusiness, more: 'Early admission runs until 1 June 2026 or the class XII result, whichever is earlier. After results, BBA applicants with at least 80% across four core subjects or CUET (UG) percentile 60+ are exempt from online interview. For B.Com the four-subject threshold is 75%, or CUET (UG) percentile 60+. Other applicants take the online interview.' } },
    { label: 'Postgraduate', content: { title: 'MBA Admission', summary: 'A bachelor’s degree in any discipline with at least 50% marks or an equivalent grade is required; final-year students may apply. Applicants need a CAT, NMAT, GMAT, CMAT, XAT, GRE or DGU entrance examination score.', more: 'The published MBA selection weightage is 30% for class XII and graduation marks, 40% for the entrance examination and 30% for the online interview. For Business Analytics and Digital Transformation, applicants with a computing, mathematics or statistics background are preferred.' } },
  ] },
  { name: 'Doon School of Advanced Computing', tracks: [
    { label: 'Undergraduate', content: { title: 'B.Tech Early and Regular Admission', summary: earlyOther, more: 'For direct B.Tech admission after results, 85% across Physics, Chemistry, Mathematics and one core subject, or JEE percentile 50+ with at least 50% in those subjects, exempts applicants from interview. Others must take the DGU online admission test for screening.' } },
    { label: 'Postgraduate', content: { title: 'M.Tech / MCA Admission', summary: 'M.Tech requires B.Tech CSE with at least 60% marks, plus GATE, CUET (PG) or the DGU entrance examination and an online interview. Final-year students may apply.', more: 'MCA accepts a recognised bachelor’s degree in Computer Science, Computer Applications or IT. Graduates of other disciplines must have studied Mathematics in class XII or their degree and may need bridge courses.' } },
    { label: 'Lateral Entry', content: { title: 'B.Tech Lateral Entry · Second Year', summary: 'A two- or three-year engineering diploma with at least 45% marks qualifies for consideration (40% for reserved categories). Alternatively, a recognised B.Sc. with the same marks and Mathematics in class XII qualifies.', more: 'Selection is based on the qualifying marks and online interview. The department may prescribe additional bridge courses.' } },
  ] },
  { name: 'Doon School of Law', tracks: [
    { label: 'Undergraduate', content: { title: 'BA LL.B. / BBA LL.B. Admission', summary: earlyOther, more: 'For regular admission, 75% across four class XII core subjects or CLAT / CUET (UG) percentile 60+ exempts applicants from the online interview. Applicants below those thresholds take an online screening interview.' } },
    { label: 'Postgraduate', content: { title: 'LL.M. Admission', summary: 'A Law bachelor’s degree with at least 50% marks or equivalent is required; final-year students may apply. Applicants must have a CLAT, AILET, SAT, CUET or DGU entrance score.', more: 'Selection considers the entrance score, earlier academic marks and an online interview of shortlisted applicants.' } },
  ] },
  { name: 'Doon School of Liberal Studies', tracks: [
    { label: 'Undergraduate', content: { title: 'BA / BS Liberal Studies Admission', summary: earlyOther, more: 'For regular admission, 75% across four class XII core subjects or CUET (UG) percentile 60+ exempts applicants from the online interview. Others take the screening interview.' } },
    { label: 'Postgraduate', content: { title: 'MA Liberal Studies Admission', summary: 'Graduates from a UGC-approved university need at least 60% aggregate marks and must take the DGU online entrance examination (DGU-AT). Final-year students may apply.' } },
  ] },
  { name: 'Doon School of Pharmacy & Research', tracks: [
    { label: 'Diploma', content: { title: 'Pharmacy Diploma Admission', summary: 'The DGU admission page lists at least 50% average across four class XII core subjects, with Physics and Chemistry mandatory. Check the university’s full criteria before applying.' } },
    { label: 'Undergraduate', content: { title: 'B.Pharm Admission', summary: 'Applicants need Physics and Chemistry with Biology or Mathematics in class XII. The regular admission route considers academic marks and an online interview.', more: 'A four-subject average of 75% or CUET (UG) percentile 60+ grants an interview exemption. Others attend the online screening interview.' } },
  ] },
  { name: 'Doon School of Modern Media', tracks: [
    { label: 'Undergraduate', content: { title: 'BA Media Admission', summary: earlyOther, more: 'After results, 75% across four class XII core subjects or CUET (UG) percentile 60+ exempts applicants from the online interview. Other applicants attend an online screening interview.' } },
    { label: 'Postgraduate', content: { title: 'MBA Media / MA Mass Communication', summary: 'Applicants need at least 60% aggregate in graduation from a UGC-approved university. MBA Media & Creative Communication or Luxury & Fashion Management applicants take a national-level test or DGU-AT.', more: 'MA Mass Communication accepts CUET (PG) or DGU-AT. Final-year graduates may apply.' } },
  ] },
  { name: 'Doon School of Modern Agriculture', tracks: [
    { label: 'Undergraduate', content: { title: 'B.Sc. Agriculture / Forestry Admission', summary: earlyOther, more: 'For regular admission, 75% across four class XII PCM or PCB subjects or CUET (UG) percentile 60+ exempts applicants from the online interview. Others take the screening interview.' } },
    { label: 'Postgraduate', content: { title: 'M.Sc. Agronomy / MBA AgriBusiness', summary: 'M.Sc. Agronomy requires a B.Sc. Agriculture or Forestry from a UGC-approved university with at least 60% aggregate, plus the DGU admission test (DAT).', more: 'MBA AgriBusiness requires 60% in graduation and a national-level test or DAT. Final-year applicants may apply to both programmes.' } },
  ] },
];

type FeeGroup = { label: string; programs: string[] };
export type FeeSchool = { name: string; href: string; groups: FeeGroup[] };

// Restored from the supplied admissions component (2026 schedules).
// These totals do not include every separate incidental/hostel charge.
type FeeDetails = { amounts: string[]; note?: string; labels?: string[] };
export const feeDetails: Record<string, FeeDetails> = {
  'BBA / BBA (Hons.) Fee Comparison 2026': { labels: ['BBA', 'Super Specialisation', 'AgriBusiness', 'BBA Global', 'BBA (Hons.)', 'Hons. Super Specialisation'], amounts: ['6,60,000', '8,10,000', '3,63,000', '13,50,000', '8,95,000', '11,00,000'], note: 'Programme tuition comparison (full duration); AgriBusiness figure reflects the published diversity scholarship.' },
  'BBA Programs 2026-29': { amounts: ['1,23,000', '1,08,000', '1,15,500', '1,15,500', '1,23,000', '1,23,000'] },
  'BBA Super Specialization Programs 2026-29': { amounts: ['1,45,500', '1,30,500', '1,40,500', '1,40,500', '1,50,500', '1,50,500'] },
  'BBA with Specialization in Business Analytics 2026-29': { amounts: ['1,45,500', '1,30,500', '1,40,500', '1,40,500', '1,50,500', '1,50,500'] },
  'BBA with Specialization in International Business 2026-29': { amounts: ['1,45,500', '1,30,500', '1,40,500', '1,40,500', '1,50,500', '1,50,500'] },
  'B.Sc / BBA AgriBusiness 2026-29': { amounts: ['71,325', '56,375', '60,500', '60,500', '64,625', '64,625'], note: 'After the listed 45% special diversity scholarship.' },
  'BBA Global 2026-29': { amounts: ['2,30,500', '2,15,500', '2,30,500', '2,30,500', '2,45,500', '2,45,500'] },
  'B.Com 2026-29': { amounts: ['1,10,500', '95,500', '1,01,500', '1,01,500', '1,08,000', '1,08,000'] },
  'B.Com (Hons.) 2026-30': { amounts: ['1,10,500', '95,500', '1,01,500', '1,01,500', '1,08,000', '1,08,000', '1,08,000', '1,08,000'] },
  'BBA (Hons.) 2026-30': { amounts: ['1,23,000', '1,08,000', '1,15,500', '1,15,500', '1,23,000', '1,23,000', '1,23,000', '1,23,000'] },
  'MBA Programs 2026-28': { amounts: ['2,85,000', '2,35,000', '2,55,000', '2,55,000'], note: 'MBA HR / Marketing / Finance / Healthcare & Pharma; academic fee plus applicable CVA after combo scholarship.' },
  'MBA Business Analytics with SAS 2026-28': { amounts: ['2,92,500', '2,52,500', '2,72,500', '2,72,500'], note: 'Academic fee plus CVA after combo scholarship.' },
  'MBA Winter Batch 2026-28': { amounts: ['2,85,000', '2,35,000', '2,35,000', '2,55,000'], note: 'Academic fee plus CVA after combo scholarship.' },
  'MBA Integrated (BBA + MBA) 2026-31': { amounts: ['1,75,500', '1,40,500', '1,50,500', '1,50,500', '1,60,500', '1,60,500', '1,70,500', '1,70,500', '1,80,500', '1,80,500'] },
  'B.Tech CSE 2026-30': { amounts: ['1,17,250', '1,02,250', '1,09,506', '1,09,506', '1,17,307', '1,17,307', '1,25,692', '1,25,692'], note: 'B.Tech CSE with Specialisation (Minor) fee schedule.' },
  'BCA 2026-29': { amounts: ['60,500', '50,500', '55,000', '55,000', '60,000', '60,000'] },
  'BCA with Specialization 2026-29': { amounts: ['65,000', '55,000', '60,000', '60,000', '64,500', '64,500'] },
  'BCA with Dual Specialization 2026-29': { amounts: ['65,000', '55,000', '60,000', '60,000', '64,500', '64,500'] },
  'M.Tech CSE By Research 2026-28': { amounts: ['69,250', '59,250', '63,000', '63,000'] },
  'MCA (with Specialization in Full Stack Development) 2026-28': { amounts: ['83,000', '73,000', '78,000', '78,000'] },
  'MBA Integrated (BTech + MBA) 2026-31': { amounts: ['1,75,500', '1,40,500', '1,50,500', '1,50,500', '1,60,500', '1,60,500', '1,70,500', '1,70,500', '1,80,500', '1,80,500', '55,500'], note: 'The published B.Tech + MBA schedule includes an eleventh semester.' },
  'BA LLB (Hons.) 2026-31': { amounts: ['1,20,500', '95,500', '1,00,500', '1,00,500', '1,05,500', '1,05,500', '1,10,500', '1,10,500', '1,15,500', '1,15,500'] },
  'BBA LLB (Hons.) 2026-31': { amounts: ['1,20,500', '95,500', '1,00,500', '1,00,500', '1,05,500', '1,05,500', '1,10,500', '1,10,500', '1,15,500', '1,15,500'] },
  'LLM 2026-27': { amounts: ['85,500', '70,500'], note: 'All India totals. UK domicile: ₹69,250 and ₹54,250.' },
  'BA / BS (Single, Dual Majors or Interdisciplinary Majors) 2026-29': { amounts: ['95,500', '80,500', '85,500', '85,500', '90,500', '90,500'] },
  'BA / BS (Hons.) 2026-30': { amounts: ['95,500', '80,500', '85,500', '85,500', '90,500', '90,500', '90,500', '90,500'] },
  'MA 2026-28': { amounts: ['70,500', '55,500', '60,500', '60,500'] },
  'D.Pharm 2026-28': { amounts: ['63,000', '42,500', '53,000', '47,500'] },
  'B.Pharm 2026-30': { amounts: ['56,200', '46,200', '49,700', '49,700', '53,200', '53,200', '56,980', '56,980'], note: 'Published B. Pharma totals after 30% special diversity scholarship.' },
  'B.A Digital Media & Mass Communication / Film & TV 2026-29': { amounts: ['71,250', '56,250', '60,000', '60,000', '63,750', '63,750'], note: 'After the listed 25% special diversity scholarship.' },
  'B.A (Hons.) Digital Media & Mass Communication / Film & TV 2026-30': { amounts: ['95,500', '80,500', '85,500', '85,500', '90,500', '90,500', '90,500', '90,500'] },
  'MA Mass Communication 2026-28': { amounts: ['70,500', '55,500', '60,500', '60,500'] },
  'B.Sc (Hons.) Agriculture 2026-30': { amounts: ['51,250', '41,250', '42,750', '42,750', '44,250', '44,250', '45,750', '45,750'], note: 'After the listed 25% special diversity scholarship.' },
  'B.Sc (Hons.) Forestry 2026-30': { amounts: ['51,250', '41,250', '42,750', '42,750', '44,250', '44,250', '45,750', '45,750'], note: 'After the listed 25% special diversity scholarship.' },
  'M.Sc. Agronomy 2026-28': { amounts: ['66,500', '51,500', '53,500', '53,500'] },
  'MBA with Specialization in Agri Business 2026-28': { amounts: ['2,32,500', '1,82,500', '2,02,500', '2,02,500'], note: 'Academic fee plus CVA after combo scholarship.' },
};

export const feeSchools: FeeSchool[] = [
  { name: 'Doon Business School', href: 'https://dgu.ac.in/doon-business-school-fee-structure', groups: [
    { label: 'Undergraduate', programs: [
      'BBA / BBA (Hons.) Fee Comparison 2026', 'BBA Programs 2026-29',
      'BBA Super Specialization Programs 2026-29',
      'BBA with Specialization in Business Analytics 2026-29',
      'BBA with Specialization in International Business 2026-29',
      'B.Sc / BBA AgriBusiness 2026-29', 'BBA Global 2026-29',
      'B.Com 2026-29', 'B.Com (Hons.) 2026-30', 'BBA (Hons.) 2026-30',
    ] },
    { label: 'Postgraduate', programs: [
      'MBA Programs 2026-28', 'MBA Business Analytics with SAS 2026-28',
      'MBA Winter Batch 2026-28',
    ] },
    { label: 'Integrated', programs: ['MBA Integrated (BBA + MBA) 2026-31'] },
  ] },
  { name: 'Doon School of Advanced Computing', href: 'https://dgu.ac.in/doon-school-of-advanced-computing-fee-structure', groups: [
    { label: 'Undergraduate', programs: ['B.Tech CSE 2026-30', 'BCA 2026-29', 'BCA with Specialization 2026-29', 'BCA with Dual Specialization 2026-29'] },
    { label: 'Postgraduate', programs: ['M.Tech CSE By Research 2026-28', 'MCA (with Specialization in Full Stack Development) 2026-28'] },
    { label: 'Integrated', programs: ['MBA Integrated (BTech + MBA) 2026-31'] },
  ] },
  { name: 'Doon School of Law', href: 'https://dgu.ac.in/doon-school-of-law-fee-structure', groups: [
    { label: 'Undergraduate', programs: ['BA LLB (Hons.) 2026-31', 'BBA LLB (Hons.) 2026-31'] },
    { label: 'Postgraduate', programs: ['LLM 2026-27'] },
    { label: 'Integrated', programs: ['BA LLB (Hons.) 2026-31', 'BBA LLB (Hons.) 2026-31'] },
  ] },
  { name: 'Doon School of Liberal Studies', href: 'https://dgu.ac.in/doon-school-of-liberal-studies-fee-structure', groups: [
    { label: 'Undergraduate', programs: ['BA / BS (Single, Dual Majors or Interdisciplinary Majors) 2026-29', 'BA / BS (Hons.) 2026-30'] },
    { label: 'Postgraduate', programs: ['MA 2026-28'] },
  ] },
  { name: 'Doon School of Pharmacy & Research', href: 'https://dgu.ac.in/dbs-school-of-pharmacy-and-research-fee-structure', groups: [
    { label: 'Diploma', programs: ['D.Pharm 2026-28'] },
    { label: 'Undergraduate', programs: ['B.Pharm 2026-30'] },
  ] },
  { name: 'Doon School of Modern Media', href: 'https://dgu.ac.in/doon-school-of-modern-media-fee-structure', groups: [
    { label: 'Undergraduate', programs: ['B.A Digital Media & Mass Communication / Film & TV 2026-29', 'B.A (Hons.) Digital Media & Mass Communication / Film & TV 2026-30'] },
    { label: 'Postgraduate', programs: ['MA Mass Communication 2026-28'] },
  ] },
  { name: 'Doon School of Modern Agriculture', href: 'https://dgu.ac.in/doon-school-of-modern-agriculture-fee-structure', groups: [
    { label: 'Undergraduate', programs: ['B.Sc (Hons.) Agriculture 2026-30', 'B.Sc (Hons.) Forestry 2026-30', 'B.Sc / BBA AgriBusiness 2026-29'] },
    { label: 'Postgraduate', programs: ['M.Sc. Agronomy 2026-28', 'MBA with Specialization in Agri Business 2026-28'] },
  ] },
];

type AdmissionResource = {
  title: string;
  paragraphs: string[];
  details: string[];
  href: string;
};

// Content restored from the supplied 2026 admissions component.
// Full schedules remain available through the local resource pages.
export const admissionResources: AdmissionResource[] = [
  {
    title: 'Education Loan',
    paragraphs: [
      'Higher education is a high investment proposition and some of our students may need financial assistance in order to attain their career goals. We at Doon Business School/DBS Global University believe that no deserving candidate should be denied the opportunity to unlock their potential for want of funding.',
      'In our endeavour to facilitate such students to avail education loans on competitive terms, we have tied up with multiple banks and institutions offering financial support on the strength of the admission letter from DBS Group of institutions.',
    ],
    details: [
      'The university also points applicants to the PM-Vidyalaxmi scheme for public-sector bank loans.',
      'The published list of eligible expenses includes tuition, hostel and boarding, examinations, library and laboratory charges, books, uniform, a computer or laptop, and required study tours or project work. Loan terms and approval come from the lender.',
    ],
    href: 'https://dgu.ac.in/education-loan',
  },
  {
    title: 'Scholarships',
    paragraphs: [
      'DGU lists merit scholarships for undergraduate students based on the best four core class XII subjects, CUET or JEE performance. Its 2026 table ranges from 10% to 90% of tuition fee, depending on the published score band.',
      'MBA applicants with qualifying CAT/XAT or MAT/CMAT scores and at least 65% in graduation may be considered under a separate 20%–90% tuition scholarship schedule.',
    ],
    details: [
      'The university also lists 25% for Uttarakhand domicile, 10% for wards of a single mother, full-time teacher or defence personnel, and sports quota support of up to 50%. Programme and category conditions apply.',
      'The 2026 scholarship page says applications are limited to the first 15% of seats in each programme and must be approved in writing by the Registrar. Continuation from the third semester depends on attendance, marks and other conditions.',
    ],
    href: 'https://dgu.ac.in/scholarships',
  },
  {
    title: 'Hostel Types',
    paragraphs: [
      'DGU lists separate residences for male and female students, with dormitory, twin, double and triple-sharing rooms. Room types include common or attached washrooms, and selected rooms have balconies.',
      'The published residences include Indra Nooyi, Mother Teresa, Girls Old, Budding Leaders, New Residency (Boys) and Satya Residency (Boys).',
    ],
    details: [
      'Depending on the residence, the facilities listed include Wi-Fi, hot water, laundry, electrical backup, security, sports or gym access, and a mess. Room allocation is subject to availability.',
    ],
    href: 'https://dgu.ac.in/hostel-life',
  },
  {
    title: 'Hostel and Mess Fee',
    paragraphs: [
      'For 2026–27, the published annual room rent ranges from ₹20,500 for a four-seater boys’ room at Satya Residency to ₹87,000 for a double room with attached washroom and balcony in a girls’ residency.',
      'Mess charges are ₹65,000, payable in two instalments of ₹35,000 and ₹30,000. The room schedule lists separate instalments and availability by residence and room type.',
    ],
    details: [
      'DGU also lists facility management and university administrative charges separately. Day boarding for eligible students staying outside the hostel is listed at ₹25,000.',
      'The published prices cover 2026–27 and may change. See the complete residence table and payment notes before making a selection.',
    ],
    href: 'https://dgu.ac.in/hostel-and-mess-fee',
  },
  {
    title: 'Transportation Fee',
    paragraphs: [
      'The 2026–27 transport schedule lists Dehradun City to campus at ₹13,500 by non-AC bus or ₹16,000 by AC bus. Premnagar/Suddhowala is ₹9,750 non-AC or ₹12,000 AC.',
      'The non-AC fares shown for Selaqui and Kulhal/Herbertpur/Vikasnagar are ₹4,000 and ₹13,500 respectively. Final-year UG and PG students have a separate discounted fare column.',
    ],
    details: [
      'Day boarding includes lunch on working days and transport at fixed times and destinations. Bus charges are included in the day-boarding charge, but students still need a bus pass.',
      'Transport is offered on preset routes and schedules; the university notes that 2026–27 charges may be revised.',
    ],
    href: 'https://dgu.ac.in/transportation-fee',
  },
];

export const admissionsPlacement: SchoolPageData['placement'] = {
  title: 'PLACEMENTS',
  tagline: ['ENJOY EVERYDAY WHILE', 'ENSURING GREAT CAREER'],
  description: 'Placement is an independent activity managed by the career development cell & the students on their own through their nominated committee member, under the overall guidance of an experienced Placement Coordinator. Moreover, the activities calendar of DGU has incorporated a number of activities which have been designed to promote industry interaction. Relationship building with Corporates through rich knowledge exchange helps build a trust in DGU capabilities to nurture talent and impart necessary skills in its students.',
  videoTitle: 'Placement success story from DBS Global University',
  videoPoster: '/nextjs/homev1/assets/success-video.webp',
  students: [
    { name: 'Nivedita Ranta', company: 'Infosys', image: '/nextjs/homev1/assets/infosys _placement.webp' },
    { name: 'Harshita Jain', company: 'Tech Mahindra', image: '/nextjs/homev1/assets/tech mahindra _placement.webp' },
    { name: 'Ankita Lochab', company: 'Deloitte', image: '/nextjs/homev1/assets/placement-ankita.webp' },
    { name: 'Harshali Goyal', company: 'BCG', image: '/nextjs/homev1/assets/placement-harshali.webp' },
  ],
  stats: [['400+', 'Recruiters'], ['40+ LPA', 'Highest CTC'], ['1500+', 'Students Placed'], ['92%', 'Placement Rate']],
};

