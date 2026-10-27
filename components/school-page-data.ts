import { sitePath } from './site-base';
import type { DifferentiatorPoint } from './DifferentiatorSection';

export type SchoolPageData = {
  name: string; slug: string; heroImage: string; heroMobileImage?: string; heroHasEmbeddedTitle?: boolean; heroAlt?: string; heroKicker: string; heroTitle: string;
  intro: string; introMore?: string; vision?: string; partners?: { name: string; image: string }[]; showBusinessAccreditations?: boolean; programs: { title: string; items: { name: string; note?: string; href: string }[] }[];
  differentiatorTitle: string; differentiators: DifferentiatorPoint[];
  placement: {
    title: string; tagline: string[]; description: string;
    videoTitle: string; videoPoster: string; videoUrl?: string;
    students: { name: string; company: string; image: string }[];
    stats: [string, string][];
  };
  faculty: { name: string; designation: string; department: string; image: string; qualification: string; experience: string }[];
  faqs?: ReadonlyArray<{ question: string; answer: string }>;
};

export const schoolPages: Record<string, SchoolPageData> = {
  'advanced-computing': {
    name: 'Doon School of Advanced Computing', slug: 'advanced-computing',
    heroImage: sitePath('/assets/academic/computing-banner.webp'),
    heroHasEmbeddedTitle: true, heroAlt: 'Doon School of Advanced Computing banner',
    heroKicker: 'Build the Future of', heroTitle: 'Advanced Computing',
    intro: 'Within the dynamic Doon School of Advanced Computing, a progressive education that fully embraces the New Education Policy (NEP) is delivered, ensuring that the students are not only participants but leaders in the evolving world of emerging technologies.',
    introMore: 'The B.Tech CSE and BCA programmes combine computing foundations with an industry-immersive approach. Courses developed with HCLTech connect students to AI and machine learning, data science, cyber security and T-skill pathways across robotics, IoT, drone technology, iOS, full stack development and cloud computing. Students gain practical exposure through annual internships, industry projects, hackathons, Apple Labs, drone facilities and other specialist labs. MCA, M.Tech, integrated B.Tech pathways and doctoral research offer further opportunities to deepen technical expertise and pursue innovation.',
    partners: [
      { name: 'HCLTech', image: sitePath('/assets/academic/partner-hcl.webp') },
      { name: 'Apple iOS Development Center', image: sitePath('/assets/academic/partner-apple.webp') },
      { name: 'SAS', image: sitePath('/assets/academic/partner-sas.webp') },
      { name: 'SAP', image: sitePath('/assets/academic/partner-sap.webp') },
      { name: 'Alteryx', image: sitePath('/assets/academic/partner-alteryx.webp') },
      { name: 'Microsoft', image: sitePath('/assets/academic/partner-microsoft.webp') },
      { name: 'Google', image: sitePath('/assets/academic/partner-google.webp') },
      { name: 'NVIDIA', image: sitePath('/assets/academic/partner-nvidia.webp') },
    ],
    programs: [
      { title: 'Undergraduate', items: [
        { name: 'B.Tech CSE', href: 'https://dgu.ac.in/btech' },
        { name: 'BCA', note: 'Dual Specialization', href: 'https://dgu.ac.in/bca-with-specialization' },
      ] },
      { title: 'B.Tech Pathways', items: [
        { name: 'AI & ML with Minor', href: 'https://dgu.ac.in/btech-cse-with-spe-in-ai-and-ml-with-minor' },
        { name: 'CSE with Minor', href: 'https://dgu.ac.in/btech-cse-with-minor' },
        { name: 'Dual Specialization', note: 'AI & ML, Cyber Security or Data Science', href: 'https://dgu.ac.in/btech' },
      ] },
      { title: 'Postgraduate & Research', items: [
        { name: 'MCA', href: 'https://dgu.ac.in/mca' },
        { name: 'M.Tech CSE', note: 'Coursework or by Research', href: 'https://dgu.ac.in/mtech' },
        { name: 'Ph.D.', href: 'https://dgu.ac.in/school-of-technology' },
      ] },
      { title: 'Integrated', items: [
        { name: 'B.Tech CSE + M.Tech', href: 'https://dgu.ac.in/integrated-btech-mtech' },
        { name: 'B.Tech CSE + MBA', href: 'https://dgu.ac.in/integrated-btech-mba' },
      ] },
    ],
    differentiatorTitle: 'What makes Doon School of Advanced Computing Different?',
    differentiators: [
      { title: 'Industry-Aligned Curriculum', description: 'Designed, delivered and certified with\nleading tech companies.', icon: sitePath('/assets/svg/innovative-pedagogy.svg') },
      { title: 'Advanced Labs & Centre for Excellence in', description: 'AI, Robotics, IoT, Drone,\nSuper Computer access.', icon: sitePath('/assets/svg/new-curriculums.svg') },
      { title: 'Global Exposure', description: 'International pathways\n& collaborations.', icon: sitePath('/assets/svg/future-skill-programs.svg') },
      { title: 'Career-Ready Learning', description: 'Live projects, internships\n& certifications.', icon: sitePath('/assets/svg/certified-trainings.svg') },
      { title: 'Interdisciplinary and Multi-Disciplinary Exposure:', description: '"T-Skills", Dual Specialization in emerging\ntechnologies AI/ML, Robotics, IOT, Drone Technology,\niOS Development, Finance, Modern Media, Data Science,\nCyber Security, Full Stack Development, Cloud Computing, Smart Agriculture.', icon: sitePath('/assets/svg/5.svg') },
      { title: 'Innovation Culture', description: 'Leaders in Hackathons,\nstartups & research.', icon: sitePath('/assets/svg/6.svg') },
    ],
    placement: {
      title: 'PLACEMENTS', tagline: ['LEARN BY BUILDING', 'PREPARE FOR TECH CAREERS'],
      description: 'Industry-designed courses, live projects and internships connect computing students with professional practice. The school emphasises technical depth, practical problem-solving and career readiness across AI, software, data and emerging technologies.',
      videoTitle: '', videoPoster: '', students: [
        { name: 'Nivedita Ranta', company: 'Infosys', image: sitePath('/assets/infosys _placement.webp') },
        { name: 'Harshita Jain', company: 'Tech Mahindra', image: sitePath('/assets/tech mahindra _placement.webp') },
      ], stats: [],
    },
    faculty: [
      { name: 'Dr. Sanjay Jasola', designation: 'Vice Chancellor, Professor', department: '', image: sitePath('/media/faculty/fac_3364_dr-sanjay-jasola-img.webp'), qualification: 'PhD, MTech, BTech', experience: '38 years' },
      { name: 'Dr. Manish Prateek', designation: 'Pro-Vice Chancellor, Professor', department: 'CSE', image: sitePath('/media/faculty/fac_895_dr-manish-prateek-img.webp'), qualification: 'PhD, MTech, BTech', experience: 'Over 25 years in industry, research and academia' },
      { name: 'Dr. Deepak Bharadwaj', designation: 'Associate Professor', department: 'CSE', image: sitePath('/media/faculty/fac_7907_deepak-bhardwaj.webp'), qualification: 'PhD (Reinforcement Algorithm), MTech (Robotics & Automation), BTech (Mechanical)', experience: '15 years' },
      { name: 'Dr. Vishant Kumar', designation: 'Assistant Professor', department: 'Advanced Computing', image: sitePath('/media/faculty/fac_18471_prof-vishant-kumar-img.webp'), qualification: 'PhD, MTech, BTech', experience: 'Practitioner-scholar with 10+ years of professional experience, including 8+ years dedicated to higher education and research' },
    ],
  },
  business: {
    name: 'Doon Business School', slug: 'business', heroHasEmbeddedTitle: true, heroImage: sitePath('/media/schools/business-desktop.webp'), heroMobileImage: sitePath('/media/schools/business-mobile.webp'),
    heroKicker: 'A Truly Global', heroTitle: 'Business School',
    intro: 'Doon Business School brings together management education, practical projects and industry learning across MBA, BBA, B.Com and integrated programmes.',
    introMore: 'Students explore business through case studies, technology-led learning, internships and applicable industry certifications. The school also offers international academic pathways and opportunities to develop leadership skills beyond the classroom.',
    vision: 'To become a well-known business school with a positive social impact that offers management education on a global scale.',
    showBusinessAccreditations: true,
    programs: [
      {title:'Undergraduate',items:[{name:'BBA/BBA',note:'(Honours / Honours with Research)',href:sitePath('/programs/bba/')},{name:'B.Com/B.Com',note:'(Honours / Honours with Research)',href:sitePath('/programs/bcom/')}]},
      {title:'Postgraduate',items:[{name:'MBA',href:sitePath('/programs/mba/')},{name:'MBA Winter Batch',href:sitePath('/programs/mba-winter/')}]},
      {title:'Integrated',items:[{name:'BBA + MBA',note:'(Integrated Program in Management)',href:sitePath('/programs/bba-mba/')}]},
      {title:'Global & Research',items:[{name:'Global MBA',href:sitePath('/programs/global-mba/')},{name:'Ph.D.',href:sitePath('/programs/phd-management/')}]},
    ],
    differentiatorTitle:'What makes Doon Business School Different?',
    differentiators:[
      {title:'Innovative Pedagogy',description:'beyond traditional\nsubject-specific teaching',icon:sitePath('/assets/svg/innovative-pedagogy.svg')},
      {title:'New Curriculums',description:'embraces innovative and\ncontemporary methods',icon:sitePath('/assets/svg/new-curriculums.svg')},
      {title:'Future Skill Programs',description:'fostering personal growth\nand skill development',icon:sitePath('/assets/svg/future-skill-programs.svg')},
      {title:'Certified Trainings',description:'specific knowledge, skills, and\ncompetencies in a particular field',icon:sitePath('/assets/svg/certified-trainings.svg')},
    ],
    placement:{
      title:'PLACEMENTS',
      tagline:['ENJOY EVERYDAY WHILE','ENSURING GREAT CAREER'],
      description:'Placement is an independent activity managed by the career development cell & the students on their own through their nominated committee member, under the overall guidance of an experienced Placement Coordinator. Moreover, the activities calendar of DGU has incorporated a number of activities which have been designed to promote industry interaction. Relationship building with Corporates through rich knowledge exchange helps build a trust in DGU capabilities to nurture talent and impart necessary skills in its students.',
      videoTitle:'Placement success story from DBS Global University',
      videoPoster:sitePath('/assets/success-video.webp'),
      students:[
        {name:'Ankita Lochab',company:'Deloitte',image:sitePath('/assets/deloitte _placement.webp')},
        {name:'Harshali Goyal',company:'BCG',image:sitePath('/assets/bcg boston_placement.webp')},
      ],
      stats:[['400+','Recruiters'],['40+ LPA','Highest CTC'],['1500+','Students Placed'],['92%','Placement Rate']],
    },
    faculty:[
      {name:'Dr. Rajeev Bhardwaj',designation:'Pro-Vice Chancellor, Professor',department:'Department: Law',image:sitePath('/media/faculty/fac_19828_dr-rajeev-bhardwaj-img.webp'),qualification:'Qualification: PhD, MBA, MA, BA',experience:'26+ years in teaching, research, training, academic administration and institution building.'},
      {name:'Dr. Pushpa Kataria',designation:'Professor',department:'Department: HR & OB',image:sitePath('/media/faculty/fac_17574_prof-pushpa-kataria-img.webp'),qualification:'Qualification: PhD, MBA, MPhil, BCom, NET',experience:'Teaching: 13 years · Industry: 5 years · Total: 18 years'},
      {name:'Dr. Navjyoti Singh Negi',designation:'Associate Dean Academics, Professor',department:'Department: Marketing',image:sitePath('/media/faculty/fac_2783_dr-navjyoti-singh-negi-img.webp'),qualification:'Qualification: PhD, PGDM, BSc',experience:'Teaching: 15 years · Industry: 1.5 years · Total: 16.5 years'},
      {name:'Dr. Shalini Singh',designation:'Professor',department:'Department: Finance',image:sitePath('/media/faculty/fac_14363_dr-shalini-singh-img.webp'),qualification:'Qualification: PhD (Finance), MBA, MA (Eco), BCom',experience:'Teaching: 16 years · Industry: 7 years · Total: 16.7 years (as supplied)'},
    ],
  },
  law: {
    name: 'Doon School of Law', slug: 'law', heroImage: sitePath('/media/schools/law-desktop.webp'), heroMobileImage: sitePath('/media/schools/law-mobile.webp'), heroAlt: 'University school banner',
    heroKicker: 'Learn to Lead in', heroTitle: 'Law',
    intro: 'Doon School of Law combines legal study with practical learning through moot courts, legal aid clinics, internships and research.',
    introMore: 'Its B.A. LL.B. (Hons.), B.B.A. LL.B., LL.M. and research pathways develop legal reasoning, ethical judgment and skills for careers in litigation, corporate law, governance and public service.',
    vision: 'To emerge as a globally recognised centre of legal education, committed to intellectual excellence, ethical values and the pursuit of justice, while nurturing future legal leaders.',
    programs: [
      { title: 'Integrated Law', items: [
        { name: 'B.A. LL.B. (Hons.)', href: sitePath('/programs/ba-llb/') },
        { name: 'B.B.A. LL.B.', href: sitePath('/programs/bba-llb/') },
      ] },
      { title: 'Postgraduate', items: [{ name: 'LL.M.', href: sitePath('/programs/llm/') }] },
      { title: 'Research', items: [{ name: 'Ph.D. in Law', href: sitePath('/programs/phd-law/') }] },
    ],
    differentiatorTitle: 'What makes Doon School of Law Different?',
    differentiators: [
      { title: 'Dual Specialisations', description: 'Combine law with humanities\nand management', icon: sitePath('/assets/svg/innovative-pedagogy.svg') },
      { title: 'Moot Court Learning', description: 'Practice advocacy\nand legal reasoning', icon: sitePath('/assets/svg/new-curriculums.svg') },
      { title: 'Legal Aid & Research', description: 'Connect legal study\nwith real challenges', icon: sitePath('/assets/svg/future-skill-programs.svg') },
      { title: 'Internships', description: 'Build experience\nthrough legal practice', icon: sitePath('/assets/svg/certified-trainings.svg') },
    ],
    placement: {
      title: 'PLACEMENTS', tagline: ['BUILD LEGAL EXPERTISE', 'FOR REAL-WORLD CAREERS'],
      description: 'The university Career Development Cell supports students with industry exposure and professional opportunities. Law students build practical skills through internships, moot courts, legal aid clinics and research.',
      videoTitle: '', videoPoster: '', students: [], stats: [],
    },
    faculty: [],
  },
  'liberal-studies': {
    name: 'Doon School of Liberal Studies', slug: 'liberal-studies', heroHasEmbeddedTitle: true, heroImage: sitePath('/media/schools/liberal-studies-desktop.webp'), heroMobileImage: sitePath('/media/schools/liberal-studies-mobile.webp'), heroAlt: 'University school banner',
    heroKicker: 'Explore Across', heroTitle: 'Liberal Studies',
    intro: 'Doon School of Liberal Studies brings together the humanities, social sciences and flexible interdisciplinary study.',
    introMore: 'Students can combine subjects across BA or BS pathways, pursue postgraduate study in English Literature, Economics or Psychology, and take part in internships, projects and dissertations. The school also supports civil services preparation for BA Liberal Studies students.',
    programs: [
      { title: 'Undergraduate', items: [{ name: 'BA / BS (Honours / Honours with Research)', href: sitePath('/programs/ba-liberal-studies/') }] },
      { title: 'Postgraduate', items: [{ name: 'MA', note: 'English Literature, Economics or Psychology', href: sitePath('/programs/ma-liberal-studies/') }] },
      { title: 'Research', items: [{ name: 'Ph.D.', href: sitePath('/programs/phd-liberal-studies/') }] },
    ],
    differentiatorTitle: 'What makes Doon School of Liberal Studies Different?',
    differentiators: [
      { title: 'Interdisciplinary Study', description: 'Explore humanities\nand social sciences', icon: sitePath('/assets/svg/innovative-pedagogy.svg') },
      { title: 'Flexible Pathways', description: 'Combine subjects\nacross disciplines', icon: sitePath('/assets/svg/new-curriculums.svg') },
      { title: 'Career Preparation', description: 'UPSC support and\ncareer-focused learning', icon: sitePath('/assets/svg/future-skill-programs.svg') },
      { title: 'Experiential Learning', description: 'Internships, projects\nand dissertation work', icon: sitePath('/assets/svg/certified-trainings.svg') },
    ],
    placement: {
      title: 'PLACEMENTS', tagline: ['EXPLORE MANY PATHS', 'BUILD YOUR FUTURE'],
      description: 'DGU combines academic learning with internships, live projects and career support. Students develop analytical and communication skills across disciplines and can also access structured preparation for civil services.',
      videoTitle: '', videoPoster: '', students: [], stats: [],
    },
    faculty: [],
  },
  'modern-media': {
    name: 'Doon School of Modern Media', slug: 'modern-media', heroImage: sitePath('/media/schools/modern-media-desktop.webp'), heroMobileImage: sitePath('/media/schools/modern-media-mobile.webp'), heroAlt: 'University school banner',
    heroKicker: 'Create the Future of', heroTitle: 'Modern Media',
    intro: 'Doon School of Modern Media connects media degrees with production, storytelling and digital skills.',
    introMore: 'Students use studios and real sets while exploring film, television, journalism, content creation, AI-assisted production, design and digital marketing. Industry mentors help connect creative work with professional practice.',
    programs: [
      { title: 'Undergraduate', items: [
        { name: 'BA Digital Media & Mass Communications', href: sitePath('/programs/ba-digital-media/') },
        { name: 'BA Film and TV', href: sitePath('/programs/ba-film-tv/') },
      ] },
      { title: 'Postgraduate', items: [
        { name: 'MA (Mass Communication)', href: sitePath('/programs/ma-mass-communication/') },
        { name: 'MBA Media & Creative Communication', href: sitePath('/programs/mba-media-creative/') },
      ] },
      { title: 'Research', items: [{ name: 'Ph.D.', href: sitePath('/programs/phd-modern-media/') }] },
    ],
    differentiatorTitle: 'What makes Doon School of Modern Media Different?',
    differentiators: [
      { title: 'Real Sets & Studios', description: 'Learn through\nlive production work', icon: sitePath('/assets/svg/innovative-pedagogy.svg') },
      { title: 'AI in the Curriculum', description: 'Create with current\nAI and digital tools', icon: sitePath('/assets/svg/new-curriculums.svg') },
      { title: 'Digital Media Skills', description: 'SEO, design and\nperformance marketing', icon: sitePath('/assets/svg/future-skill-programs.svg') },
      { title: 'Industry Mentorship', description: 'Learn from working\nmedia professionals', icon: sitePath('/assets/svg/certified-trainings.svg') },
    ],
    placement: {
      title: 'PLACEMENTS', tagline: ['CREATE WITH PURPOSE', 'WORK ACROSS MEDIA'],
      description: 'The school combines a recognised degree with practical experience in production, content, digital marketing and AI tools, preparing students for a range of creative and strategic media roles.',
      videoTitle: '', videoPoster: '', students: [], stats: [],
    },
    faculty: [],
  },
  pharmacy: {
    name: 'DBS School of Pharmacy and Research', slug: 'pharmacy',
    heroHasEmbeddedTitle: true, heroImage: sitePath('/media/schools/pharmacy-desktop.webp'), heroMobileImage: sitePath('/media/schools/pharmacy-mobile.webp'), heroAlt: 'University school banner',
    heroKicker: 'Explore the Science of', heroTitle: 'Pharmacy & Research',
    intro: 'DBS School of Pharmacy and Research combines pharmaceutical science with laboratory training and practical learning.',
    introMore: 'Students study medicines and healthcare through experiments, research activities, internships and industry interaction. D.Pharm, B.Pharm and postgraduate routes offer different ways to develop scientific and professional skills.',
    programs: [
      { title: 'Diploma', items: [{ name: 'D.Pharm', href: sitePath('/programs/dpharm/') }] },
      { title: 'Undergraduate', items: [
        { name: 'B.Pharm', href: sitePath('/programs/bpharm/') },
        { name: 'B.Pharm Lateral Entry', href: sitePath('/programs/bpharm-lateral/') },
      ] },
      { title: 'Postgraduate & Research', items: [
        { name: 'M.Sc Pharmaceutical Chemistry', href: sitePath('/programs/msc-pharmaceutical-chemistry/') },
        { name: 'MBA Healthcare Pharma Management', href: sitePath('/programs/mba-healthcare-pharma/') },
        { name: 'Ph.D. in Pharmaceutical Sciences', href: sitePath('/programs/phd-pharmacy/') },
      ] },
    ],
    differentiatorTitle: 'What makes DBS School of Pharmacy and Research Different?',
    differentiators: [
      { title: 'Laboratory Learning', description: 'Connect pharmaceutical theory\nwith practical experiments', icon: sitePath('/assets/svg/innovative-pedagogy.svg') },
      { title: 'Research Culture', description: 'Explore projects, seminars\nand scientific inquiry', icon: sitePath('/assets/svg/new-curriculums.svg') },
      { title: 'Industry Exposure', description: 'Learn through internships\nand industry interaction', icon: sitePath('/assets/svg/future-skill-programs.svg') },
      { title: 'Healthcare Focus', description: 'Prepare for responsible\npharmacy practice', icon: sitePath('/assets/svg/certified-trainings.svg') },
    ],
    placement: { title: 'PLACEMENTS', tagline: ['PHARMACY IN PRACTICE', 'SKILLS FOR HEALTHCARE'], description: 'Laboratory study, research projects and industry interaction help students connect pharmaceutical knowledge with healthcare and industry roles.', videoTitle: '', videoPoster: '', students: [], stats: [] },
    faculty: [],
  },
  'agriculture-forestry': {
    name: 'Doon School of Modern Agriculture & Forestry', slug: 'agriculture-forestry',
    heroImage: sitePath('/media/schools/agriculture-forestry-desktop.webp'), heroMobileImage: sitePath('/media/schools/agriculture-forestry-mobile.webp'), heroAlt: 'University school banner',
    heroKicker: 'Learn Across', heroTitle: 'Agriculture & Forestry',
    intro: 'Doon School of Modern Agriculture & Forestry connects the science of farming and forests with hands-on field learning.',
    introMore: 'Students work with farmland, nurseries and real projects while exploring crop science, forestry, agribusiness, drones and digital tools. The school offers undergraduate study in Agriculture and Forestry alongside postgraduate pathways.',
    programs: [
      { title: 'Undergraduate', items: [
        { name: 'B.Sc Agriculture (Honours)', href: sitePath('/programs/bsc-agriculture/') },
        { name: 'B.Sc Forestry (Honours)', href: sitePath('/programs/bsc-forestry/') },
        { name: 'B.Sc Agri Business', href: sitePath('/programs/bsc-agri-business/') },
      ] },
      { title: 'Postgraduate & Research', items: [
        { name: 'M.Sc Agronomy', href: sitePath('/programs/msc-agronomy/') },
        { name: 'MBA Agri Business', href: sitePath('/programs/mba-agri-business/') },
        { name: 'Ph.D. in Agriculture', href: sitePath('/programs/phd-agriculture/') },
      ] },
    ],
    differentiatorTitle: 'What makes Doon School of Modern Agriculture & Forestry Different?',
    differentiators: [
      { title: 'Field-Based Learning', description: 'Work with farmland, nurseries\nand living landscapes', icon: sitePath('/assets/svg/innovative-pedagogy.svg') },
      { title: 'Agriculture Science', description: 'Learn crop and soil science\nthrough real experiments', icon: sitePath('/assets/svg/new-curriculums.svg') },
      { title: 'Digital Tools', description: 'Explore drones, mapping\nand precision agriculture', icon: sitePath('/assets/svg/future-skill-programs.svg') },
      { title: 'Sustainable Futures', description: 'Connect forestry and farming\nwith responsible practice', icon: sitePath('/assets/svg/certified-trainings.svg') },
    ],
    placement: { title: 'PLACEMENTS', tagline: ['LEARN ON THE LAND', 'BUILD FUTURE-READY SKILLS'], description: 'Fieldwork, research and practical projects help students prepare for opportunities in agriculture, forestry and related industries.', videoTitle: '', videoPoster: '', students: [], stats: [] },
    faculty: [],
  },
  'future-skills': {
    name: 'Doon School of Future Skills', slug: 'future-skills',
    heroHasEmbeddedTitle: true, heroImage: sitePath('/media/schools/future-skills-desktop.webp'), heroMobileImage: sitePath('/media/schools/future-skills-mobile.webp'), heroAlt: 'University school banner',
    heroKicker: 'Build Practical', heroTitle: 'Future Skills',
    intro: 'Doon School of Future Skills offers certification courses that complement students’ degree programmes with practical, industry-related learning.',
    introMore: 'Students can explore fields such as SAP, SAS, artificial intelligence, analytics, digital marketing, finance and technology. DGU describes a future-skills course in every semester as part of its approach to career readiness.',
    programs: [
      { title: 'Technology', items: [
        { name: 'Artificial Intelligence', href: sitePath('/programs/cert-artificial-intelligence/') },
        { name: 'Machine Learning', href: sitePath('/programs/cert-machine-learning/') },
        { name: 'Big Data, Python & R', href: sitePath('/programs/cert-big-data-python-r/') },
        { name: 'Internet of Things', href: sitePath('/programs/cert-internet-of-things/') },
        { name: 'Java Technologies', href: sitePath('/programs/cert-java/') },
        { name: 'Red Hat Linux', href: sitePath('/programs/cert-red-hat-linux/') },
        { name: 'Website Development & Implementation', href: sitePath('/programs/cert-web-development/') },
        { name: '.NET Framework Networking', href: sitePath('/programs/cert-dotnet-networking/') },
      ] },
      { title: 'Business & Analytics', items: [
        { name: 'SAP', href: sitePath('/programs/cert-sap/') },
        { name: 'SAS', href: sitePath('/programs/cert-sas/') },
        { name: 'NISM Certifications', href: sitePath('/programs/cert-nism/') },
        { name: 'Digital Marketing', href: sitePath('/programs/cert-digital-marketing/') },
      ] },
      { title: 'Data & Commerce', items: [
        { name: 'E-Commerce', href: sitePath('/programs/cert-ecommerce/') },
        { name: 'Basic/Advanced Excel', href: sitePath('/programs/cert-advanced-excel/') },
        { name: 'Big Data Analytics', href: sitePath('/programs/cert-big-data-analytics/') },
        { name: 'Data Analytics Tools', href: sitePath('/programs/cert-data-analytics-tools/') },
        { name: 'Rapidminer/Tableau', href: sitePath('/programs/cert-rapidminer-tableau/') },
        { name: 'Computerised Accounting Tally', href: sitePath('/programs/cert-tally/') },
      ] },
      { title: 'Professional Skills', items: [
        { name: 'AGILE & SCRUM', href: sitePath('/programs/cert-agile-scrum/') },
        { name: 'Derivatives', href: sitePath('/programs/cert-derivatives/') },
        { name: 'French Language', href: sitePath('/programs/cert-french/') },
        { name: 'HR Analytics', href: sitePath('/programs/cert-hr-analytics/') },
        { name: 'International Logistics', href: sitePath('/programs/cert-international-logistics/') },
        { name: 'Luxury Brand Marketing', href: sitePath('/programs/cert-luxury-brand-marketing/') },
        { name: 'Social Media Marketing', href: sitePath('/programs/cert-social-media-marketing/') },
      ] },
    ],
    differentiatorTitle: 'What makes Doon School of Future Skills Different?',
    differentiators: [
      { title: 'Industry-Aligned Skills', description: 'Learn relevant tools\nand current practices', icon: sitePath('/assets/svg/innovative-pedagogy.svg') },
      { title: 'Practical Training', description: 'Apply learning\nto real tasks', icon: sitePath('/assets/svg/new-curriculums.svg') },
      { title: 'Across Disciplines', description: 'Add future skills\nto a degree pathway', icon: sitePath('/assets/svg/future-skill-programs.svg') },
      { title: 'Continued Growth', description: 'Build adaptable\ncareer capabilities', icon: sitePath('/assets/svg/certified-trainings.svg') },
    ],
    placement: { title: 'CAREER READINESS', tagline: ['ADD PRACTICAL SKILLS', 'TO YOUR DEGREE'], description: 'Skills courses connect academic learning to tools and practices used in technology, analytics, finance and business.', videoTitle: '', videoPoster: '', students: [], stats: [] },
    faculty: [],
  },
};
