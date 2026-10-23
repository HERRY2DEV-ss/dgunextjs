// Run from the existing project root. An optional capture directory checks actual responses.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), ts = require('typescript');
const clone = value => JSON.parse(JSON.stringify(value));
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, text: async () => typeof body === 'string' ? body : JSON.stringify(body) });
function environment(mode = 'production') {
  const modules = new Map(), calls = [];
  let mock = () => { throw new Error('Unexpected request'); };
  function load(filename) {
    const file = path.resolve(filename);
    if (/\.(png|webp)$/.test(file)) return { default: { src: '/nextjs/homev1/assets/' + path.basename(file) } };
    if (modules.has(file)) return modules.get(file);
    const module = { exports: {} }; modules.set(file, module.exports);
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    vm.runInNewContext(source, {
      module, exports: module.exports, URL, AbortController, Date, setTimeout, clearTimeout,
      process: { env: { NODE_ENV: mode, NEXT_PUBLIC_DGU_MENU_API_KEY: 'contract-test-key' } },
      fetch: async (url, options = {}) => { calls.push({ url, options }); return mock(url, options); },
      require: name => load(path.resolve(path.dirname(file), /\.(png|webp)$/.test(name) ? name : name + '.ts')),
    });
    return module.exports;
  }
  return { load, calls, use: fn => { mock = fn; } };
}
const club = {
  id: 1, clubName: 'Robotics & Automation', url: 'robotics-and-automation-club',
  details: '<p>First paragraph.</p><p>Full final paragraph &amp; detail.</p>',
  objectives: '<p>Actual introduction.</p><ul><li>First objective.</li><li>Second <p>paragraph in the same objective.</p></li></ul>',
  achievements: '<p>Actual achievements introduction.</p><ul><li>First achievement.</li></ul>',
  otherDetails: '<p>Additional API content.</p>',
  leaders: [{ id: 1, name: 'Actual leader', designation: 'API designation', imageURL: 'https://dgu.ac.in//uploads/images/faculty/leader.webp', otherDetails: 'API biography', url: '#' }],
  patrons: [],
};
async function contracts(mode) {
  const e = environment(mode), api = e.load('components/club-detail-api.ts');
  const list = { error: '0', data: Array.from({ length: 31 }, (_, id) => ({ id, clubName: 'Club ' + id, url: id === 0 ? '' : 'club-' + id, imageURL: id === 0 ? '' : '//dgu.ac.in/uploads/images/clubs/' + id + '.webp' })) };
  const summaries = api.parseClubs(list);
  assert.equal(summaries.length, 31, 'No arbitrary catalogue cap');
  assert.deepEqual(clone(summaries.map(row => row.id)), list.data.map(row => String(row.id)), 'Preserve API ordering');
  assert.equal(summaries[0].href, '', 'Missing routes remain unlinked');
  assert.equal(summaries[1].image, 'https://dgu.ac.in/uploads/images/clubs/1.webp');
  const result = api.normalizeClubResponse({ error: '0', data: [club] }, club.url);
  assert.equal(result.name, club.clubName);
  assert.deepEqual(clone(result.description), ['First paragraph.', 'Full final paragraph & detail.']);
  assert.equal(result.benefits.items.length, 2, 'Keep each complete objective together');
  assert.equal(result.benefits.intro, 'Actual introduction.');
  assert.equal(result.achievements.intro, 'Actual achievements introduction.');
  assert.equal(result.otherDetails[0], 'Additional API content.');
  assert.equal(result.leaders[0].profileUrl, '', 'A # placeholder is not a profile link');
  assert.equal(result.leaders[0].bio, 'API biography');
  assert.equal(result.leaders[0].image, 'https://dgu.ac.in/uploads/images/faculty/leader.webp');
  assert.equal(result.patrons.length, 0, 'No unrelated people fallback');
  assert.throws(() => api.normalizeClubResponse({ error: '0', data: [club] }, 'music-club'));
  assert.throws(() => api.normalizeClubResponse({ Result: 'Error', data: 'Not a Valid Request' }, club.url));
  assert.throws(() => api.parseClubs({ error: '1', data: list.data }));
  assert.equal(api.canonicalClubSlug('bulls-bears-club'), 'bulls-and-bears-club');
  assert.equal(api.canonicalClubSlug('fit-dot-quit-club'), 'fit-dont-quit-club');
  e.use((url, options) => response(JSON.parse(options.body).URL ? { error: '0', data: [club] } : list));
  await api.fetchClubPage(club.url);
  const detail = e.calls.find(call => JSON.parse(call.options.body).URL);
  assert.equal(detail.url, mode === 'development' ? '/nextjs/homev1/api/dgu-club/' : 'https://dgu.ac.in/api/get-club.php');
  assert.equal(detail.options.method, 'POST');
  assert.deepEqual(JSON.parse(detail.options.body), { URL: club.url });
  assert.equal(detail.options.headers.Apikey, 'contract-test-key');
  assert.equal(detail.options.cache, 'no-store');
  const before = e.calls.length;
  await assert.rejects(api.fetchClubPage('../bad'));
  assert.equal(e.calls.length, before, 'Invalid slug rejected before fetching');
  await api.fetchClubs();
  assert.equal(e.calls.length, before + 1, 'Completed list responses are fetched fresh');
  for (const bad of [response('Unavailable', 403), response('Unavailable', 500), response('<title>404 Page Not Found</title>'), response('not JSON')]) {
    const f = environment(mode), failing = f.load('components/club-detail-api.ts');
    f.use(() => bad);
    await assert.rejects(failing.fetchClubPage(club.url));
    await assert.rejects(failing.fetchClubs());
  }
  const partial = environment(mode), independent = partial.load('components/club-detail-api.ts');
  partial.use((url, options) => JSON.parse(options.body).URL ? response({ error: '0', data: [club] }) : response('List failed', 500));
  assert.equal((await independent.fetchClubPage(club.url)).name, club.clubName, 'Logo-list failure does not discard a working detail response');
  e.use(() => response({ error: '0', data: [] }));
  assert.equal((await api.fetchClubs()).length, 0, 'Empty API success remains empty');
}
function captured(directory) {
  const e = environment(), api = e.load('components/club-detail-api.ts'), plain = e.load('components/dgu-content-api.ts').apiPlain;
  const read = name => JSON.parse(fs.readFileSync(path.join(directory, name + '.json'), 'utf8'));
  const source = read('clubs'), summaries = api.parseClubs(source);
  assert.equal(summaries.length, source.data.length);
  assert.deepEqual(clone(summaries.map(row => row.id)), source.data.map(row => String(row.id)));
  // CMS comments contain discarded drafts, not visible page content.
  const words = value => plain(String(value || '').replace(/<!--[\s\S]*?-->/g, '')).split(/\s+/).sort().join('|');
  for (const record of source.data) {
    const payload = read(record.url), raw = payload.data[0], data = api.normalizeClubResponse(payload, record.url);
    assert.equal(data.name, plain(raw.clubName));
    assert.equal(words(data.description.join(' ')), words(raw.details), record.url + ': complete intro');
    assert.equal(words([data.benefits?.intro, ...(data.benefits?.items || [])].join(' ')), words(raw.objectives), record.url + ': every objective and preface');
    assert.equal(words([data.achievements?.intro, ...(data.achievements?.items || [])].join(' ')), words(raw.achievements), record.url + ': every achievement and preface');
    assert.equal(words((data.otherDetails || []).join(' ')), words(raw.otherDetails), record.url + ': other content');
    for (const group of ['leaders', 'patrons']) {
      assert.deepEqual(clone(data[group].map(person => person.id)), raw[group].filter(person => plain(person.name)).map(person => String(person.id)));
      assert.deepEqual(clone(data[group].map(person => person.role)), raw[group].filter(person => plain(person.name)).map(person => plain(person.designation)));
    }
    assert.ok(summaries.find(row => row.id === String(raw.id)).href.endsWith('/' + raw.url + '/'), 'Clean existing club route');
  }
  console.log('PASS: all ' + summaries.length + ' captured clubs — ordering, clean routes, full text, objective/achievement prefaces and related people.');
}
(async () => {
  await contracts('production'); await contracts('development');
  console.log('PASS: restored Club contract, URL parameter, shared Apikey, missing/invalid/empty records, HTTP/JSON failures, fresh fetching and both transport modes.');
  if (process.argv[2]) captured(path.resolve(process.argv[2]));
})().catch(error => { console.error(error); process.exitCode = 1; });
