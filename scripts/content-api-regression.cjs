// Run from the existing project root: node scripts/content-api-regression.cjs
// These fixtures validate integration behavior; they are not recorded live API responses.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const modules = new Map();
let mockFetch = () => { throw new Error('Unexpected network request'); };
let clock = Date.now();
let captureTimer = false;
let abortTimer;
const testProcess = { env: { NEXT_PUBLIC_DGU_MENU_API_KEY: 'test-key', NODE_ENV: 'test' } };
function load(filename) {
  const file = path.resolve(filename);
  if (modules.has(file)) return modules.get(file);
  const module = { exports: {} };
  modules.set(file, module.exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports, URL, AbortController,
    Date: class extends Date { static now() { return clock; } },
    process: testProcess, __dirname: path.dirname(file), fetch: (...args) => mockFetch(...args),
    setTimeout: (callback, ms) => { if (captureTimer) { abortTimer = callback; return 1; } return setTimeout(callback, ms); },
    clearTimeout: handle => { if (!captureTimer) clearTimeout(handle); },
    require: name => load(path.resolve(path.dirname(file), name + '.ts')),
  });
  return module.exports;
}
const transport = load('components/dgu-content-api.ts');
const reviews = load('components/reviews-api.ts');
const programs = load('components/program-info-api.ts');
const reviewFixture = { error: 0, data: [
  { id: 1, studentName: 'Example Student', reviewText: '<p>A useful <strong>learning</strong> experience.</p>', image: '/uploads/student.webp', rating: '4.5', programName: 'BA LLB' },
  { id: 2, name: 'Example Student', review: 'A useful learning experience.' },
  { id: 3, name: 'Another Student', description: 'A second review.', rating: 8, image: 'javascript:alert(1)' },
] };
const programFixture = { error: '0', data: [{
  PROGRAM_URL: 'ba-llb', programName: 'BA LLB programme', program_short_name: 'BA LLB',
  banner_image: '/uploads/ba-llb.webp', programDescription: '<p>API programme overview.</p>',
  eligibilityCriteria: '<p>API eligibility.</p>',
  feeRows: [{ course: 'BA LLB', fee: 'Published academic fee' }], feeNote: 'See the published terms.',
  duration: '5 years', curriculum: '<ul><li>Legal studies</li></ul>',
  FAQs: [{ question: 'An API question?', answer: '<p>An API answer.</p>' }],
}] };
const fallback = {
  slug: 'local-law-route', shortName: 'Local BA LLB', fullName: 'Local programme name',
  heroImage: '/assets/original.webp', heroAlt: 'Original image', heroCaption: 'Original caption',
  intro: ['Original overview'], recognitionTitle: 'Recognition', recognitions: [],
  admissionDetails: { advantages: [['Original advantage']], eligibility: 'Original eligibility', feeRows: [{ course: 'Original programme', fee: 'Original fee' }], feeNote: 'Original note' },
};
async function main() {
  const items = reviews.parseReviews(reviewFixture);
  assert.equal(items.length, 2, 'equivalent review text is not repeated under different IDs');
  assert.equal(items[0].text, 'A useful learning experience.');
  assert.equal(items[0].image, 'https://dgu.ac.in/uploads/student.webp');
  assert.equal(items[0].rating, 4.5);
  assert.equal(items[1].rating, null, 'an invalid rating is not shown');
  assert.equal(items[1].image, '', 'unsafe media protocols are rejected');
  assert.equal(reviews.parseReviews({ error: 0, data: [] }).length, 0);
  assert.equal(reviews.parseReviews({ success: true, reviews: [{ Name: 'A', Review_Description: 'Readable text' }] }).length, 1);
  assert.throws(() => reviews.parseReviews({ error: 1, data: reviewFixture.data }), /error/);
  assert.throws(() => reviews.parseReviews({ error: 0, data: [{ id: 1 }] }), /readable/);

  const info = programs.parseProgramInfo(programFixture, 'ba-llb');
  const page = programs.applyProgramInfo(fallback, info);
  assert.equal(page.slug, fallback.slug, 'remote content never changes the local route identity');
  assert.equal(page.fullName, 'BA LLB programme');
  assert.equal(page.heroImage, 'https://dgu.ac.in/uploads/ba-llb.webp');
  assert.equal(page.intro[0], 'API programme overview.');
  assert.equal(page.admissionDetails.advantages.length, 0, 'missing API advantages never use manual content');
  assert.equal(page.heroCaption, '', 'missing API captions never use the saved caption');
  assert.equal(page.recognitions.length, 0, 'missing API recognition logos never use saved partners');
  assert.equal(page.admissionDetails.feeRows.length, 0, 'API fees replace the old fees');
  assert(info.feesHtml.includes('<table>') && info.feesHtml.includes('See the published terms.'));
  assert.equal(info.sections.length, 1);
  assert.equal(info.facts[0].value, '5 years');
  assert.equal(transport.apiPlain(page.faqs[0].answer), 'An API answer.');
  assert.equal(fallback.intro[0], 'Original overview', 'applying data does not mutate the local fallback');
  const loadingPage = programs.applyProgramInfo(fallback, null);
  assert.equal(loadingPage.fullName, ''); assert.equal(loadingPage.shortName, '');
  assert.equal(loadingPage.intro.length, 0); assert.equal(loadingPage.admissionDetails, undefined);
  assert.equal(loadingPage.heroImage, fallback.heroImage, 'approved artwork remains presentation');
  const partialPage = programs.applyProgramInfo({ ...fallback, recognitions: [{ image: '/manual.webp', alt: 'Manual logo' }], faqs: [{ question: 'Manual question', answer: 'Manual answer' }] }, programs.parseProgramInfo({data:{programName:'API name',introText:'Only API copy'}}, 'ba-llb'));
  assert.equal(partialPage.shortName, 'API name'); assert.equal(partialPage.admissionDetails, undefined);
  assert.equal(partialPage.recognitions.length, 0); assert.equal(partialPage.faqs, undefined);
  assert.throws(() => programs.parseProgramInfo(programFixture, 'mba'), /different programme/);
  assert.throws(() => programs.parseProgramInfo({ error: 0, data: [] }, 'ba-llb'), /No information/);
  assert.throws(() => programs.parseProgramInfo({ error: 0, data: [{ status: 1, id: 8 }] }, 'ba-llb'), /readable/);
  const sectionInfo = programs.parseProgramInfo({ data: { programName: 'Law', sections: [{ title: 'Eligibility Criteria', content: '<p>Only this panel.</p>' }] } }, 'ba-llb');
  assert(sectionInfo.eligibilityHtml.includes('Only this panel.'));
  const formatted = programs.parseProgramInfo({ data: { programName: 'MBA', program_advantage_at_DGU: ['Industry learning'], program_fee_structure: [{ semester: 'I', tuition: 'Published fee' }], sections: [
    { title: 'Global Learning & Study Abroad Pathways', content: '<p>API international content</p>' },
    { title: 'Eligibility Criteria', content: '<p>API eligibility panel</p>' },
    { title: 'Advantage @ DGU', content: '<ul><li>Repeated advantage</li></ul>' },
    { title: 'Fee Structure', content: '<p>Repeated fee</p>' },
    { title: 'Industry Collaboration', content: '<p>API industry section</p>' },
    { title: 'Program Options at a Glance', content: '<table><tr><td>API pathways</td></tr></table>' },
    { title: 'Campus News & Updates', content: '<p>Duplicate common news</p>' },
  ], internal_tracking: 'Hidden metadata' } }, 'mba');
  assert(formatted.internationalHtml.includes('API international content'));
  assert(formatted.feesHtml.includes('<table>')); assert(formatted.eligibilityHtml.includes('API eligibility panel'));
  assert(formatted.advantagesHtml.includes('Industry learning')); assert(!formatted.advantagesHtml.includes('Repeated advantage'));
  assert(formatted.industryHtml.includes('API industry'));assert(formatted.pathwaysHtml.includes('API pathways'));
  assert.equal(formatted.sections.length, 0, 'named blocks stay in their original slots instead of appending at the bottom');
  assert(formatted.unmappedFields.includes('Internal tracking'), 'unknown fields are recorded, not displayed as editorial sections');
  const htmlArticle=programs.parseProgramInfo({data:{overview:'<p>Intro</p><h2>Eligibility Criteria</h2><p>Eligibility body</p><h2>Fee Structure</h2><table><tr><td>Fee body</td></tr></table><h2>Global Learning & Study Abroad Pathways</h2><p>International body</p><h2>Campus News & Updates</h2><p>Common news body</p>'}},'mba');
  assert(htmlArticle.overviewHtml.includes('Intro'));assert(!htmlArticle.overviewHtml.includes('Fee body'));
  assert(htmlArticle.eligibilityHtml.includes('Eligibility body'));assert(htmlArticle.feesHtml.includes('Fee body'));assert(htmlArticle.internationalHtml.includes('International body'));assert.equal(htmlArticle.sections.length,0);
  assert.equal(programs.programRequestSlug({slug:'cert-sap',sourceUrl:'https://dgu.ac.in/school-of-future-skills'}),'sap');
  assert.equal(programs.programRequestSlug({slug:'ba-film-tv'}),'ba-film-and-tv');
  const actualShape = programs.parseProgramInfo({error:'0',data:[{programName:'MBA',introText:'Approved intro',programDetails:'<p>Main copy</p><h2>Program Options at a Glance</h2><table><tr><td>Pathway data</td></tr></table><div class="global-program-title">MBA Global Pathway</div><p>Global program copy</p>',tabs:{tabName:'<h5>Fee Structure</h5>',tabDetails:'<table><tr><td>Live-schema fees</td></tr></table>',tabPrograms:[]},programOtherInfoHeading:'Global Learning & Study Abroad Pathways',programOtherInfo:'<p>Global community copy</p><img src="images/university-logo/logo1.webp" alt="University">',accordion:[],prospectusURL:'/uploads/documents/program.pdf',registrationLink:'https://admissions.dgu.ac/'}]},'mba');
  assert(actualShape.overviewHtml.includes('Approved intro'));assert(actualShape.feesHtml.includes('Live-schema fees'));
  assert(actualShape.pathwaysHtml.includes('Pathway data'));assert(actualShape.globalPathwayHtml.includes('Global program copy'));
  assert.equal(actualShape.international.partners.length,1);assert(!actualShape.internationalHtml.includes('logo1.webp'));
  assert.equal(actualShape.unmappedFields.length,0);assert(actualShape.prospectusUrl.endsWith('program.pdf'));
  const multiple = programs.parseProgramInfo({ data: [{ url: 'mba', programName: 'MBA' }, { url: 'ba-llb', programName: 'Law' }] }, 'ba-llb');
  assert.equal(multiple.patch.fullName, 'Law', 'multiple returned records are matched to PROGRAM_URL');
  assert.equal(programs.programRequestSlug({ slug: 'bba-mba', sourceUrl: 'https://dgu.ac.in/bba-mba-integrated' }), 'bba-mba-integrated');
  assert.equal(programs.programRequestSlug({ slug: 'phd-law', sourceUrl: 'https://dgu.ac.in/school-of-law' }), 'phd-law');
  assert.equal(programs.programInfoSlug('javascript:alert(1)'), '');
  assert.equal(programs.programInfoSlug('https://other.example/ba-llb'), '');
  await assert.rejects(programs.requestProgramInfo(''), /PROGRAM_URL/);

  let calls = [];
  mockFetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => url.endsWith('get-reviews.php') ? reviewFixture : programFixture };
  };
  const [one, two] = await Promise.all([reviews.requestReviews(), reviews.requestReviews()]);
  assert.equal(calls.length, 1, 'mounted sections share a single in-flight review request');
  assert.equal(one, two);
  assert.equal(calls[0].url, 'https://dgu.ac.in/api/get-reviews.php');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers.Apikey, 'test-key');
  assert.equal(calls[0].options.headers['Content-Type'], 'application/json');
  assert.equal(calls[0].options.body, '{}');
  await reviews.requestReviews();
  assert.equal(calls.length, 1, 'successful review data is cached briefly');
  await programs.requestProgramInfo('ba-llb');
  assert.equal(calls.length,2,'The restored programme endpoint uses the same shared transport');
  assert.equal(calls[1].options.body,JSON.stringify({PROGRAM_URL:'ba-llb'}));
  clock += 61000;
  await reviews.requestReviews();
  assert.equal(calls.length, 3, 'the review cache expires');
  let failedCalls = 0;
  mockFetch = async () => { failedCalls++; return { ok: false, status: 403 }; };
  clock += 61000;
  await assert.rejects(reviews.requestReviews(), /HTTP 403/);
  await assert.rejects(reviews.requestReviews(), /HTTP 403/);
  assert.equal(failedCalls, 2, 'a failure remains retryable and is not cached');
  mockFetch = async () => ({ ok: true, json: async () => { throw new Error('invalid'); } });
  await assert.rejects(transport.postContent('reviews', {}), /invalid JSON/);
  testProcess.env.NEXT_PUBLIC_DGU_MENU_API_KEY = '';
  await assert.rejects(transport.postContent('reviews', {}), /API_KEY/);
  testProcess.env.NEXT_PUBLIC_DGU_MENU_API_KEY = 'test-key';
  testProcess.env.NODE_ENV = 'development';
  const siteBaseFile = path.resolve('components/site-base.ts');
  const siteBaseModule = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(siteBaseFile, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText, {
    module: siteBaseModule, exports: siteBaseModule.exports, process: testProcess,
  });
  const developmentPaths = siteBaseModule.exports;
  assert.equal(developmentPaths.SITE_BASE, '');
  assert.equal(developmentPaths.sitePath('/assets/example.webp'), '/assets/example.webp');
  calls = [];
  mockFetch = async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => ({ error: 0, data: [] }) }; };
  await transport.postContent('reviews', {});
  await transport.postContent('program', { PROGRAM_URL: 'ba-llb' });
  assert.equal(calls[0].url, '/api/dgu-reviews/');
  assert.equal(calls[1].url,'/api/dgu-program-info/');
  assert.equal(calls.length,2,'Reviews and programme details both use their development proxies');
  const nextConfig = load('next.config.ts').default;
  const routes = await nextConfig.rewrites();
  assert.equal(routes.find(route => route.source === '/api/dgu-reviews/').destination, 'https://dgu.ac.in/api/get-reviews.php');
  assert.equal(routes.find(route => route.source === '/api/dgu-program-info/').destination,'https://dgu.ac.in/api/get-program-info.php');
  assert.equal(nextConfig.basePath, '');
  assert.equal(nextConfig.output, undefined, 'the development proxy uses a Next server');
  testProcess.env.NODE_ENV = 'test';
  captureTimer = true;
  mockFetch = (url, options) => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('aborted'))));
  const timeoutRequest = transport.postContent('reviews', {});
  abortTimer();
  await assert.rejects(timeoutRequest, /timed out/);
  captureTimer = false;
  console.log('PASS: POST/header/body contracts, dev proxy/base path, per-program matching, source URL aliases, response validation, review deduplication, API-only partial/loading content, TTL/in-flight caching, retry, invalid JSON and timeout.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
