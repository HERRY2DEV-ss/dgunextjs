// Verify that missing, loading and failed API content cannot reveal manual records.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const cache = new Map();
let programmeState = { info: null, loading: true, error: '', retry() {} };

function load(filename) {
  let file = path.resolve(filename);
  if (!fs.existsSync(file)) file += fs.existsSync(file + '.ts') ? '.ts' : '.tsx';
  if (file.endsWith('useAcademicInfo.ts')) return { __esModule: true, default: () => programmeState };
  if (file.endsWith('.css')) return {};
  if (cache.has(file)) return cache.get(file);
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const module = { exports: {} };
  cache.set(file, module.exports);
  // Next handles styled-jsx attributes; the standalone test renders plain style tags.
  const source = fs.readFileSync(file, 'utf8').replace(/<style\s+jsx(?:\s+global)?\s*>/g, '<style>');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, URL, URLSearchParams, AbortController, console, process,
    setTimeout, clearTimeout, fetch: () => { throw new Error('The render test must not use the network.'); },
    require: name => name.startsWith('.') ? load(path.resolve(path.dirname(file), name)) : require(name),
  });
  return module.exports;
}

const api = load('components/academic-page-api.ts');
const legacy = load('components/program-info-api.ts');
const Program = load('components/ProgramPage.tsx').default;
const GlobalLearning = load('components/GlobalLearning.tsx').default;
const { groupSchoolPrograms } = load('components/SchoolProgramsSection.tsx');
const manual = {
  slug: 'mba', schoolSlug: 'business', shortName: 'MANUAL_NAME', fullName: 'MANUAL_FULL_NAME',
  heroImage: '/assets/approved-design.webp', heroAlt: 'MANUAL_ALT', heroCaption: 'MANUAL_CAPTION',
  intro: ['MANUAL_OVERVIEW'], recognitionTitle: 'MANUAL_RECOGNITION',
  recognitions: [{ image: '/manual-recognition.webp', alt: 'MANUAL_PARTNER' }],
  admissionDetails: { advantages: [['MANUAL_ADVANTAGE']], eligibility: 'MANUAL_ELIGIBILITY',
    feeRows: [{ course: 'MANUAL_FEE_COURSE', fee: 'MANUAL_FEE' }], feeNote: 'MANUAL_NOTE' },
  specializationGroups: [[{ title: 'MANUAL_SPECIALIZATION', note: 'MANUAL_SPECIALIZATION_NOTE' }]],
  industryCollaborations: [{ title: 'MANUAL_INDUSTRY', paragraphs: ['MANUAL_INDUSTRY_COPY'] }],
  faqs: [{ question: 'MANUAL_QUESTION', answer: 'MANUAL_ANSWER' }],
  pathwayOptions: { introduction: 'MANUAL_PATHWAY', rows: [{ pathway: 'MANUAL_PATHWAY_NAME', focus: '', structure: '', idealFor: '' }], globalIntroduction: ['MANUAL_GLOBAL'], globalHighlights: [] },
};
const renderProgram = () => renderToStaticMarkup(React.createElement(Program, { slug:'mba', data:manual }));
function onlyApi(markup) {
  assert(!markup.includes('MANUAL_'), 'manual content must never appear in the rendered programme');
  assert(!markup.includes('manual-recognition.webp'), 'manual partner media must not appear');
  assert(!markup.includes('abroad-pathways'), 'manual international photos must not appear');
}

let html = renderProgram();
onlyApi(html); assert(html.includes('Loading current programme information'));
programmeState = { info: null, loading: false, error: 'API unavailable', retry() {} };
html = renderProgram(); onlyApi(html); assert(html.includes('temporarily unavailable'));
assert(!html.includes('program-admission-details') && !html.includes('global-learning-section'));

const info = api.parseAcademicInfo({error:'0',data:[{id:10,url:'mba',programName:'API Programme',introText:'API Overview',
  feeStructure:'<p>API Course API Fee</p>',faqs:[{question:'API Question',answer:'API Answer'}],
}]},'program','mba','10');
programmeState={info,loading:false,error:'',retry(){}};
html=renderProgram();onlyApi(html);
for(const copy of ['API Programme','API Overview','API Course','API Fee','API Question','API Answer'])assert(html.includes(copy));
assert(!html.includes('Eligibility Criteria')&&!html.includes('Advantage @DGU'),'missing fields have no empty/manual tabs');
assert(!html.includes('global-learning-section'),'missing international copy has no default section');
assert(!html.includes('/assets/approved-design.webp'),'missing API banner never falls back to old artwork');
programmeState={info,loading:false,error:'',pending:true,retry(){}};
const pausedHtml=renderProgram();onlyApi(pausedHtml);
assert(pausedHtml.includes('Programme information will be available soon.'));
for(const copy of ['API Programme','API Overview','API Course','API Fee','API Question','API Answer'])assert(!pausedHtml.includes(copy),'Paused rendering cannot reveal previously loaded programme fields');
const international=api.parseAcademicInfo({error:'0',data:[{id:10,url:'mba',programName:'API Programme',introText:'API Overview',
 programMoreInfoHeading:'Global Learning & Study Abroad Pathways',programMoreInfo:'<p>API Global Copy</p><img src="/uploads/api-photo.webp" alt="API photo">',
}]},'program','mba','10');
programmeState={info:international,loading:false,error:'',retry(){}};
html=renderProgram();onlyApi(html);
assert(html.includes('API Global Copy'));
assert(!html.includes('Global immersion, semester abroad'),'missing global copy never populates default text');
const School=load('components/SchoolPage.tsx').default;
programmeState={info:null,loading:true,error:'',retry(){}};
const schoolHtml=renderToStaticMarkup(React.createElement(School,{slug:'school-of-business',data:manual}));onlyApi(schoolHtml);
assert(schoolHtml.includes('school-page academic-reference')&&schoolHtml.includes('Loading current school information'));
const gallery = renderToStaticMarkup(React.createElement(GlobalLearning, { apiOnly: true, photos: [{src:'/api-image.webp',alt:'API photo'}] }));
assert(gallery.includes('/api-image.webp') && !gallery.includes('logo1.webp') && !gallery.includes('abroad-pathways'));

const groups = groupSchoolPrograms([{ id:'one', name:'API Course', href:'/api-course/' }]);
assert.equal(groups[0].title, 'Programs', 'a missing academic level is not inferred from saved data');
assert.equal(groups[0].items[0].name, 'API Course');
const routes = load('components/program-page-data.ts').programPages;
for (const template of Object.values(routes)) {
  const presentation = legacy.programPresentation(template);
  assert.equal(presentation.intro.length, 0); assert.equal(presentation.recognitions.length, 0);
  assert.equal(presentation.admissionDetails, undefined); assert.equal(presentation.specializationGroups, undefined);
  assert.equal(presentation.faqs, undefined); assert.equal(presentation.fullName, '');
}
console.log(`PASS: rendered loading/failure/partial programme states exclude manual copy, fees, FAQs, partners and inferred levels; ${Object.keys(routes).length} routes send presentation only.`);
