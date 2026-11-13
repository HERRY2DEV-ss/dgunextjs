// Run from the project root: node scripts/placements-api-regression.cjs
// Synthetic fixtures exercise contracts only; they are never bundled as page data.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), ts = require('typescript');

function client(mode = 'production', fetcher, extraEnv = {}) {
  const cache = new Map(), calls = [];
  const env = { NODE_ENV: mode, NEXT_PUBLIC_DGU_MENU_API_KEY: 'audit-key', ...extraEnv };
  function load(filename) {
    let file = path.resolve(filename);
    if (!fs.existsSync(file)) file += '.ts';
    if (cache.has(file)) return cache.get(file);
    const module = { exports: {} }; cache.set(file, module.exports);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    vm.runInNewContext(code, { module, exports: module.exports, __dirname:path.dirname(file), URL, AbortController, setTimeout, clearTimeout, process: { env },
      fetch: async (url, options) => { calls.push({ url, ...options }); return fetcher(url, options); },
      require: name => load(path.resolve(path.dirname(file), name)),
    });
    return module.exports;
  }
  return { ...load('components/placements-api.ts'), load, calls };
}
const students = Array.from({ length: 43 }, (_, i) => ({ id: i + 1, name: i % 2 ? '' : `Student ${i + 1}`, currentEmployer: i % 3 ? '' : 'Employer', imageURL: i % 4 ? '' : '//dgu.ac.in//uploads/images/placement/portrait.webp', shortInfo: `<p>Complete testimony ${i + 1} &amp; details.</p>` }));
const payload = { error: '0', data: [{ id: 'placement_home', heading: 'Placements', subHeading: 'API subtitle', tagLine: 'API tagline', shortDescription: '<p>Full API description.</p>', placements: students }] };
const response = (value = payload, status = 200) => ({ ok: status < 400, status, text: async () => typeof value === 'string' ? value : JSON.stringify(value) });

(async () => {
  for (const mode of ['production', 'development']) {
    const api = client(mode, async () => response());
    const [global, same] = await Promise.all([api.requestPlacements(), api.requestPlacements()]);
    assert.strictEqual(global, same); assert.equal(api.calls.length, 1, 'Simultaneous consumers share a POST');
    assert.equal(global.students.length, 43); assert.deepEqual(Array.from(global.students, s => s.id), students.map(s => String(s.id)));
    assert.equal(global.students[1].name, ''); assert.equal(global.students[1].image, '');
    assert.equal(global.students[0].image, 'https://dgu.ac.in/uploads/images/placement/portrait.webp');
    assert.equal(global.students[42].description, students[42].shortInfo, 'Full rich text is preserved');
    assert.equal(global.sections[0].description, '<p>Full API description.</p>');
    await api.requestPlacements('school-of-business');
    const scoped = api.calls[1];
    assert.equal(scoped.url, mode === 'development' ? '/api/dgu-placements/' : 'https://dgu.ac.in/api/get-placements.php');
    assert.equal(scoped.method, 'POST'); assert.equal(scoped.headers.Apikey, 'audit-key');
    assert.equal(scoped.headers['Content-Type'], 'application/json'); assert.equal(scoped.cache, 'no-store');
    assert.deepEqual(JSON.parse(scoped.body), { SCHOOL_URL: 'school-of-business' });
    assert.deepEqual(JSON.parse(api.calls[0].body), {});
    await api.requestPlacements(); assert.equal(api.calls.length, 3, 'A settled request is not persistently cached');
    for (const bad of [[], {}, 1, 'bad/school', 'school-of-business?x=1', ' school-of-business']) await assert.rejects(api.requestPlacements(bad), /valid school URL/);
    assert.equal(api.calls.length, 3, 'Bad input is rejected before the network');
    assert.equal(api.SCHOOL_PLACEMENTS_FILTER_VERIFIED, false, 'Known broken school scope must remain blocked pending developer correction');
    if (mode === 'development') {
      const config = api.load('next.config.ts').default;
      assert.equal((await config.rewrites()).find(r => r.source === '/api/dgu-placements/').destination, 'https://dgu.ac.in/api/get-placements.php');
    }
  }
  const api = client('production', async () => response());
  const school = api.parsePlacements({ error: 0, data: [{ id: 'placement_home', heading: 'School placements', shortHeading: 'School subtitle', shortDesc: '', description: '<p>Full school description.</p>', studentsPlaced: '15000+', avgCtc: '11 LPA', placementOffers: '200 +', url: 'placement-reports', placements: [{ id: 6, currentEmployer: 'Value supplied in employer field', shortInfo: '<p>Full HTML.</p>', imageURL: 'https://dgu.ac.in//uploads/images/alumni/photo.webp' }] }] });
  assert.equal(school.students[0].name, '', 'Missing names are never invented or copied from employer');
  assert.equal(school.students[0].company, 'Value supplied in employer field');
  assert.equal(school.students[0].image, 'https://dgu.ac.in/uploads/images/alumni/photo.webp');
  assert.equal(school.sections[0].stats.length, 3);
  assert.equal(school.sections[0].description, '<p>Full school description.</p>');
  const repeated = api.parsePlacements({ error: '0', data: [{ placements: [students[0], students[0], { id: 2, status: 0 }, { id: 3, delete_status: 1 }, { id: 4, imageURL: 'javascript:alert(1)' }] }] });
  assert.equal(repeated.students.length, 3, 'Preserve API ordering and duplicates; honor explicit eligibility flags');
  assert.equal(repeated.students[2].image, '');
  assert.equal(api.parsePlacements({ error: '0', data: [] }).students.length, 0);
  assert.equal(api.parsePlacements({ error: '0', data: [{ placements: [] }] }).students.length, 0);
  for (const bad of [null, {}, { Result: 'Error', data: 'No records' }, { error: '1', data: [] }, { error: 0, data: {} }, { error: 0, data: [{}] }, { error: 0, data: [{ placements: [null] }] }]) assert.throws(() => api.parsePlacements(bad));
  for (const bad of [response('<title>404 Page not found</title>'), response({}, 500), response({ error: 1, data: [] })]) await assert.rejects(client('production', async () => bad).requestPlacements());
  let tries = 0;
  const retry = client('production', async () => ++tries === 1 ? response({}, 500) : response());
  await assert.rejects(retry.requestPlacements()); assert.equal((await retry.requestPlacements()).students.length, 43); assert.equal(tries, 2);
  const missingKey = client('production', async () => response(), { NEXT_PUBLIC_DGU_MENU_API_KEY: '' });
  await assert.rejects(missingKey.requestPlacements(), /key is not configured/); assert.equal(missingKey.calls.length, 0);
  const schoolFallback = client('production', async (_url, options) => {
    const body = JSON.parse(options.body);
    return body.PROGRAM_URL
      ? response({ error: '0', data: [{ heading: 'Programme placements', placements: [] }] })
      : response({ error: '0', data: [{ heading: 'Related school placements', placements: [{ id: 8, name: 'School graduate' }] }] });
  });
  const related = await schoolFallback.requestPlacementsWithSchoolFallback('mba-human-resource', 'school-of-business');
  assert.equal(related.students[0].name, 'School graduate', 'An empty programme feed uses the related school feed');
  assert.deepEqual(schoolFallback.calls.map(call => JSON.parse(call.body)), [
    { PROGRAM_URL: 'mba-human-resource' }, { SCHOOL_URL: 'school-of-business' },
  ]);
  const programWins = client('production', async (_url, options) => response({
    error: '0',
    data: [{ heading: JSON.parse(options.body).PROGRAM_URL ? 'Programme placements' : 'School placements', placements: [{ id: 9, name: 'Programme graduate' }] }],
  }));
  const ownProgram = await programWins.requestPlacementsWithSchoolFallback('mba-human-resource', 'school-of-business');
  assert.equal(ownProgram.students[0].name, 'Programme graduate');
  assert.equal(programWins.calls.length, 1, 'The school feed is not requested when programme placements exist');
  const failedProgramFallback = client('production', async (_url, options) => {
    const body = JSON.parse(options.body);
    return body.PROGRAM_URL ? response({}, 500) : response({ error: '0', data: [{ placements: [{ id: 10, name: 'School graduate' }] }] });
  });
  assert.equal((await failedProgramFallback.requestPlacementsWithSchoolFallback('mba-human-resource', 'school-of-business')).students[0].name, 'School graduate',
    'The related school feed is tried when the programme request fails');
  const failedSchoolFallback = client('production', async (_url, options) => {
    const body = JSON.parse(options.body);
    return body.PROGRAM_URL ? response({ error: '0', data: [{ placements: [] }] }) : response({}, 500);
  });
  await assert.rejects(failedSchoolFallback.requestPlacementsWithSchoolFallback('mba-human-resource', 'school-of-business'), /related school placements could not be loaded/,
    'A failed school fallback stays an explicit unavailable state');
  const override = client('production', async () => response(), { NEXT_PUBLIC_DGU_PLACEMENTS_API_URL: 'https://dgu.ac.in/api/get-placements.php', NEXT_PUBLIC_DGU_PLACEMENTS_API_KEY: 'placement-key', NEXT_PUBLIC_DGU_API_BASE_URL: 'http://localhost:8080/api' });
  await override.requestPlacements(); assert.equal(override.calls[0].url, 'http://localhost:8080/api/get-placements.php'); assert.equal(override.calls[0].headers.Apikey, 'placement-key');
  console.log('PASS: placements POST/auth/dev-proxy contracts; related-school fallback; both live response shapes; 43 complete/incomplete records in order; safe media; full HTML; empty/malformed/error/retry states; fresh fetching and in-flight deduplication; school-scope guard.');
})().catch(error => { console.error(error); process.exitCode = 1; });
