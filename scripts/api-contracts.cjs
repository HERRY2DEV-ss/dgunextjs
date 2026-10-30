// Mock responses check the actual transport contracts; they do not prove live API availability.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');

function environment(mode) {
  const modules = new Map(), calls = [];
  const env = { NODE_ENV: mode, NEXT_PUBLIC_DGU_MENU_API_KEY: 'audit-test-key' };
  function response(url, options) {
    const body = options.body ? JSON.parse(options.body) : {};
    calls.push({ url, options, body });
    let data = [];
    if (/get-menus|dgu-menus/.test(url)) data = [{ name: 'LIFE AT DGU', url: 'https://dgu.ac.in/life-at-dgu', childMenu: [] }];
    if (/get-programs|dgu-programs/.test(url)) data = [{ schoolName: 'School of Law', url: '/school-of-law', childMenu: [{ id: 1, programName: 'BA LLB', url: '/ba-llb' }] }];
    if (/get-news|dgu-news/.test(url)) data = [{ id: 1, newsTitle: 'Audit article', url: '/audit-article', categoryName: { '1': 'Placement Updates', '2': 'Admission News', '3': 'Campus & Event Updates' }[body.CATEGORY_ID] || 'Campus & Event Updates', details: '<p>Article.</p>' }];
    if (/get-footer|dgu-footer/.test(url)) data = [{ name: 'Information', childMenu: [{ id: 1, name: 'Campus life', url: '/life-at-dgu' }] }];
    if (/get-faculty|dgu-faculty/.test(url)) data = [{ id: 1, facultyName: 'Example Faculty', url: '/example-faculty', schoolName: 'Law' }];
    if (/get-reviews|dgu-reviews/.test(url)) data = [{ id: 1, name: 'Example Student', review: 'A readable review.' }];
    if (/get-program-info|dgu-program-info/.test(url)) data = [{ PROGRAM_URL: body.PROGRAM_URL, programName: 'BA LLB', programDescription: '<p>Programme information.</p>' }];
    const payload = { error: 0, data };
    return { ok: true, status: 200, json: async () => payload, text: async () => JSON.stringify(payload) };
  }
  function load(filename) {
    const file = path.resolve(filename);
    if (modules.has(file)) return modules.get(file);
    if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
    const module = { exports: {} };
    modules.set(file, module.exports);
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
      module, exports: module.exports, URL, AbortController, Date, setTimeout, clearTimeout,
      process: { env }, __dirname: path.dirname(file), fetch: async (url, options) => response(url, options),
      require: name => load(path.resolve(path.dirname(file), /\.(ts|json)$/.test(name) ? name : name + '.ts')),
    });
    return module.exports;
  }
  return { load, calls };
}

async function run(mode) {
  const { load, calls } = environment(mode);
  const expectCall = (name, body) => {
    const call = calls.at(-1);
    const expected = mode === 'development' ? '/api/dgu-' + name + '/' : 'https://dgu.ac.in/api/get-' + name + '.php';
    assert.equal(call.url, expected);
    assert.equal(call.options.method, 'POST');
    assert.equal(call.options.headers.Apikey, 'audit-test-key');
    if (body) {
      assert.equal(call.options.headers['Content-Type'], 'application/json');
      assert.equal(JSON.stringify(call.body), JSON.stringify(body));
    }
  };
  assert.equal((await load('components/navigation-api.ts').requestMenus()).length, 1);
  expectCall('menus');
  const programs = load('components/programs-api.ts');
  assert.equal((await programs.requestPrograms()).length, 1);
  expectCall('programs', { IS_HOME: 1 });
  await programs.requestPrograms('school-of-law');
  expectCall('programs', { SCHOOL_URL: 'school-of-law' });
  const news = load('components/news-api.ts');
  for (const [tab, category] of [['placements', '1'], ['admissions', '2'], ['campus', '3']]) {
    assert.equal((await news.requestNews(tab)).length, 1);
    expectCall('news', { RECORD_TYPE: 'home', CATEGORY_ID: category, ...(tab === 'admissions' ? { SCHOOL_ID: '1' } : {}) });
  }
  const archive = load('components/news-archive-api.ts');
  await archive.requestArchiveNews('campus');
  expectCall('news', { RECORD_TYPE: 'home', CATEGORY_ID: '3' });
  await archive.requestArchiveNews('admissions');
  expectCall('news', { RECORD_TYPE: 'home', CATEGORY_ID: '2', SCHOOL_ID: '1' });
  assert.equal((await load('components/news-detail-api.ts').requestNewsDetail('audit-article', new AbortController().signal)).title, 'Audit article');
  expectCall('news', { URL: 'audit-article' });
  assert.equal((await load('components/footer-api.ts').requestFooter()).groups.length, 1);
  expectCall('footer', {});
  const faculty = load('components/faculty-api.ts');
  for (const body of [{}, { SCHOOL_URL: 'school-of-law' }, { URL: 'example-faculty' }]) {
    assert.equal((await faculty.requestFaculty(body)).length, 1);
    expectCall('faculty', body);
  }
  assert.equal((await load('components/reviews-api.ts').requestReviews()).length, 1);
  expectCall('reviews', {});
  await load('components/program-info-api.ts').requestProgramInfo('ba-llb');
  expectCall('program-info', { PROGRAM_URL: 'ba-llb' });
  const config = load('next.config.ts').default;
  if (mode === 'development') {
    const rewrites = await config.rewrites();
    for (const name of ['menus', 'programs', 'news', 'footer', 'faculty', 'reviews']) {
      assert.equal(rewrites.find(route => route.source === '/api/dgu-' + name + '/').destination, 'https://dgu.ac.in/api/get-' + name + '.php');
    }
    assert.equal(rewrites.find(route=>route.source==='/api/dgu-program-info/').destination,'https://dgu.ac.in/api/get-program-info.php');
    assert.equal(rewrites.find(route => route.source === '/api/dgu-homepage/').destination, 'https://dgu.ac.in/api/next-homepage-data.php');
    assert.equal(rewrites.some(route => route.source.startsWith('/news/:articleSlug')), false, 'News detail routes are not rewritten to the archive page.');
  } else {
    assert.equal(config.output, 'export');
    assert.equal(config.rewrites, undefined, 'static exports do not depend on a server-side proxy');
  }
  return calls.length;
}

(async () => {
  const production = await run('production');
  const development = await run('development');
  console.log(`PASS: ${production + development} mock requests across menus, program lists/details, news, footer, faculty and reviews; PROGRAM_URL, dev rewrites and production export.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
