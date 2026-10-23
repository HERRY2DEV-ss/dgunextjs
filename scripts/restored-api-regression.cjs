// Contract tests only. Optional live captures validate mappings, not a deployment.
// Run from the project root: node scripts/restored-api-regression.cjs [capture-directory]
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), ts = require('typescript');
const clone = value => JSON.parse(JSON.stringify(value));
function environment(mode = 'production') {
  const modules = new Map(), calls = [];
  let mock = () => { throw new Error('Unexpected request'); };
  function load(filename) {
    const file = path.resolve(filename);
    if (modules.has(file)) return modules.get(file);
    const module = { exports: {} }; modules.set(file, module.exports);
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    vm.runInNewContext(source, {
      module, exports: module.exports, URL, AbortController, Date, setTimeout, clearTimeout,
      process: { env: { NODE_ENV: mode, NEXT_PUBLIC_DGU_MENU_API_KEY: 'contract-test-key' } },
      fetch: async (url, options = {}) => { calls.push({ url, options }); return mock(url, options); },
      require: name => load(path.resolve(path.dirname(file), name + '.ts')),
    });
    return module.exports;
  }
  return { load, calls, use: fn => { mock = fn; } };
}
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, text: async () => typeof body === 'string' ? body : JSON.stringify(body) });
const a = { id: 10, programName: 'MBA', url: 'mba' }, b = { id: 59, programName: 'BA LLB', url: 'ba-llb' };
const homepage = { success: true, higherEducation: ['/uploads/images/slides/career/A-1.webp'], startupSuccess: [], news: {
  campus: [{ id: 'campus', title: 'Campus article', date: '14 Oct 2026', text: 'API summary', href: 'https://dgu.ac.in/campus-article', image: '/uploads/images/news/campus.webp' }],
  placement: [{ id: 'placement', title: 'Placement article', href: 'https://dgu.ac.in/placement-article' }], admission: [],
} };

async function contracts(mode) {
  const e = environment(mode), programmes = e.load('components/programs-api.ts');
  const parsed = programmes.parsePrograms({ error: '0', data: [
    { id: 1, schoolName: 'Business School', programs: [a] },
    { id: 8, schoolName: 'Law', programs: [{ ...a, id: '10' }, b, { id: 99, programName: 'No route yet', url: '' }] },
  ] });
  assert.deepEqual(clone(parsed.map(x => x.programs.map(p => p.id))), [['10'], ['59', '99']]);
  assert.equal(parsed[0].href, '/nextjs/homev1/schools/business/');
  assert.equal(parsed[1].programs[1].href, '', 'A missing URL must not become an invented route.');
  const levels = { error: 0, data: [{ id: 1, levelName: 'Undergraduate', programs: [b] }, { id: 2, levelName: 'Postgraduate', programs: [b, a] }] };
  const own = programmes.parsePrograms(levels, 'school-of-law');
  assert.equal(own[0].url, 'school-of-law');
  assert.deepEqual(clone(own[0].programs.map(p => [p.id, p.level])), [['59', 'Undergraduate'], ['10', 'Postgraduate']]);
  const independent = programmes.parsePrograms({ error: 0, data: [{ id: 8, schoolName: 'Law', url: 'school-of-law', level: [{ levelName: 'One', programs: [b] }, { levelName: 'Two', programs: [a] }] }] });
  assert.deepEqual(clone(independent[0].programs.map(p => p.id)), ['59', '10']);
  assert.throws(() => programmes.parsePrograms({ error: 1, data: [] }));
  e.use(() => response(levels));
  assert.equal((await programmes.requestPrograms('school-of-law'))[0].programs.length, 2);
  assert(e.calls.some(call => JSON.stringify(JSON.parse(call.options.body || '{}')) === JSON.stringify({ SCHOOL_URL: 'school-of-law' })), 'The school catalogue request retains its scope even when a metadata lookup follows.');
  assert.equal(e.calls.at(-1).options.headers.Apikey, 'contract-test-key');

  const news = e.load('components/news-api.ts');
  e.use(url => /(?:get-news\.php|dgu-news\/)$/.test(url) ? response('<title>404 – Page Not Found | DBS Global University</title>') : response(homepage));
  const items = await Promise.all(['campus', 'placements', 'admissions'].map(tab => news.requestNews(tab)));
  assert.deepEqual(items.map(x => x.length), [1, 1, 0]);
  assert.equal(items[0][0].href, '/nextjs/homev1/news/campus-article/', 'DGU stories open the local detail page using the actual supplied URL.');
  const homepageCalls = e.calls.filter(call => /(?:next-homepage-data\.php|dgu-homepage\/)$/.test(call.url));
  assert.equal(homepageCalls.length, 1, 'All news categories share one homepage GET.');
  assert.equal(homepageCalls[0].options.method, undefined, 'Native fetch defaults to GET.');
  assert.equal(homepageCalls[0].options.headers, undefined, 'Homepage PHP has no Apikey authentication.');
  await e.load('components/homepage-api.ts').requestHomepageData();
  assert.equal(e.calls.filter(call => call.url === homepageCalls[0].url).length, 1, 'Success stories reuse that same response.');
  const before = e.calls.length;
  await assert.rejects(news.requestNews('campus', { SCHOOL_URL: 'school-of-technology' }), /404 HTML/);
  assert.equal(e.calls.length, before + 1, 'Missing scoped news must not borrow unfiltered homepage news.');
  for (const status of [401, 403, 500]) {
    const failing = environment(mode), failureNews = failing.load('components/news-api.ts');
    failing.use(() => response('Unavailable', status));
    await assert.rejects(failureNews.requestNews('campus'), new RegExp(String(status)));
    assert.equal(failing.calls.length, 1, 'An original API authentication/database failure must not switch sources.');
  }
  const original = environment(mode), primary = original.load('components/news-api.ts');
  original.use(() => response({ error: 0, data: [] }));
  assert.equal((await primary.requestNews('campus')).length, 0);
  assert.equal(original.calls.length, 1, 'An empty successful original response remains authoritative.');
  original.use(() => response('Malformed JSON'));
  await assert.rejects(primary.requestNews('placements'), /invalid JSON/);
  assert.equal(original.calls.length, 2, 'Malformed JSON must not silently switch APIs.');
  const reviews = e.load('components/reviews-api.ts').parseReviews({ error: 0, data: [{ id: 1, name: 'Student', description: '<p>Review</p>', imageURL: 'https://dgu.ac.in//uploads/images/alumni/photo.webp' }] });
  assert.equal(reviews[0].image, 'https://dgu.ac.in/uploads/images/alumni/photo.webp');
}

function captured(directory) {
  const e = environment(), read = name => JSON.parse(fs.readFileSync(path.join(directory, name + '.json'), 'utf8'));
  const p = e.load('components/programs-api.ts');
  const home = p.parsePrograms(read('programs-home'));
  assert.equal(home.length, 8);
  assert.deepEqual(clone(home.map(s => s.programs.length)), [6, 6, 3, 3, 3, 4, 5, 25]);
  assert.equal(home[6].programs.at(-1).id, '32', 'The legitimately shared agriculture/business programme remains.');
  const school = p.parsePrograms(read('programs-business'), 'school-of-business')[0];
  assert.equal(school.programs.length, 28);
  assert.deepEqual(clone([...new Set(school.programs.map(p => p.level))]), ['Undergraduate', 'Integrated', 'Postgraduate', 'MBA Global']);
  const news = e.load('components/news-api.ts');
  assert.deepEqual(['campus', 'placements', 'admissions'].map(tab => news.parseHomepageNews(read('homepage-get'), tab).length), [25, 25, 2]);
  assert.equal(e.load('components/navigation-api.ts').parseMenus(read('menus')).length, 9);
  const reviews = e.load('components/reviews-api.ts').parseReviews(read('reviews'));
  const plain = e.load('components/dgu-content-api.ts').apiPlain;
  const uniqueReviews = new Set(read('reviews').data.map(r => `${plain(r.name)}|${plain(r.description)}`));
  assert.equal(reviews.length, uniqueReviews.size, 'The established duplicate-review rule is unchanged.');
  assert.equal(reviews.filter(r => r.image).length, reviews.length, 'All five distinct live reviews have their actual photos.');
  assert.equal(e.load('components/recruiters-api.ts').parseRecruiters(read('recruiters')).length, 25);
  const footer = e.load('components/footer-api.ts').parseFooter(read('footer'));
  assert.deepEqual(clone(footer.groups.map(group => group.links.length)), [12, 21]);
  assert.equal(footer.contacts.length, 1); assert.equal(footer.social.length, 4);
  assert(!footer.contacts[0].campusAddress.includes('<p>'));
  console.log('PASS: captured live responses — eight schools/55 scoped home entries, 28 Business programmes, 52 homepage news items, nine menus, five distinct reviews with actual photos, 25 recruiters and all 33 footer links.');
}
(async () => {
  await contracts('production'); await contracts('development');
  console.log('PASS: restored/previous catalogue formats, exact cumulative prefixes, clean links, scoped request bodies, original news preference, genuine homepage news, missing/error isolation and shared GET.');
  if (process.argv[2]) captured(path.resolve(process.argv[2]));
})().catch(error => { console.error(error); process.exitCode = 1; });
