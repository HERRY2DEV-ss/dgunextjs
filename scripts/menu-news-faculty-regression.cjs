// These fixtures are for tests only. Production components fetch DGU's APIs.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), ts = require('typescript');
const fixtures = path.join(__dirname, 'fixtures/integration');
const read = name => JSON.parse(fs.readFileSync(path.join(fixtures, name + '.json'), 'utf8'));
const menuResponse = read('menus-snapshot'), newsResponse = read('news-snapshot');
const facultyAll = read('faculty-all'), facultyLaw = read('faculty-law'), facultyProfile = read('faculty-profile');
const clone = value => JSON.parse(JSON.stringify(value));
const categoryIds = { campus: '3', placements: '1', admissions: '2' };

function environment(mode) {
  const modules = new Map(), calls = [];
  let failNext = false;
  function load(filename) {
    const file = path.resolve(filename);
    if (modules.has(file)) return modules.get(file);
    if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
    const module = { exports: {} }; modules.set(file, module.exports);
    const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    vm.runInNewContext(output, {
      module, exports: module.exports, URL, AbortController, Date, setTimeout, clearTimeout,
      process: { env: { NODE_ENV: mode, NEXT_PUBLIC_DGU_MENU_API_KEY: 'contract-test-key' } },
      fetch: async (url, options) => {
        const body = options.body ? JSON.parse(options.body) : {};
        calls.push({ url, options, body });
        if (failNext) { failNext = false; return { ok: false, status: 503 }; }
        let payload;
        if (/menus/.test(url)) payload = menuResponse;
        else if (/faculty/.test(url)) payload = body.URL ? facultyProfile : body.SCHOOL_URL ? facultyLaw : facultyAll;
        else if (/news/.test(url)) payload = { error: '0', data: newsResponse.data.filter(row => String(row.categoryID) === body.CATEGORY_ID) };
        else throw new Error('Unexpected test endpoint: ' + url);
        return { ok: true, status: 200, text: async () => JSON.stringify(payload) };
      },
      require: name => load(path.resolve(path.dirname(file), /\.(ts|json)$/.test(name) ? name : name + '.ts')),
    });
    return module.exports;
  }
  return { load, calls, fail: () => { failNext = true; } };
}

async function check(mode) {
  const e = environment(mode), last = () => e.calls.at(-1);
  function expectCall(endpoint, body) {
    const call = last();
    assert.equal(call.url, mode === 'development' ? '/api/dgu-' + endpoint + '/' : 'https://dgu.ac.in/api/get-' + endpoint + '.php');
    assert.equal(call.options.method, 'POST');
    assert.equal(call.options.headers.Apikey, 'contract-test-key');
    assert.equal(JSON.stringify(call.body), JSON.stringify(body));
  }
  const nav = e.load('components/navigation-api.ts');
  const menu = clone(await nav.requestMenus());
  const expected = menuResponse.data.map(g => ({ label: g.menuName, url: g.url || '', target: g.target || '',
    children: g.subMenu.map(c => ({ label: c.menuName, url: c.url || '', target: c.target || '',
      children: c.subsubMenu.map(l => ({ label: l.menuName, url: l.url || '', target: l.target || '', children: [] })) })) }));
  assert.deepEqual(menu, expected); expectCall('menus', {});
  assert.equal(menu.length, 9);
  const legacy = { error: '0', data: menuResponse.data.map(g => ({ ...g, menuName: undefined, name: g.menuName, subMenu: undefined,
    childMenu: g.subMenu.map(c => ({ ...c, menuName: undefined, name: c.menuName, subsubMenu: undefined,
      childMenu: c.subsubMenu.map(l => ({ ...l, menuName: undefined, name: l.menuName })) })) })) };
  assert.deepEqual(clone(nav.parseMenus(legacy)), expected);
  const shared = clone(menuResponse.data.find(g => g.subMenu.length));
  const two = nav.parseMenus({ error: '0', data: [shared, { ...shared, id: shared.id + 100000 }] });
  assert.equal(two[0].children.length, two[1].children.length, 'New independent groups must not lose repeated prefixes.');
  assert.equal(nav.parseMenus({ Result: 'Error', data: 'Not a Valid Request' }).length, 0);

  const news = e.load('components/news-api.ts');
  for (const tab of Object.keys(categoryIds)) {
    const items = await news.requestNews(tab);
    const rows = newsResponse.data.filter(row => String(row.categoryID) === categoryIds[tab]);
    assert.deepEqual(clone(items.map(item => item.id)), rows.map(row => String(row.id)));
    assert(items.length >= 3, `${tab} test API response provides at least three valid news items.`);
    assert.deepEqual(clone(items.slice(0, 3).map(item => item.id)), rows.slice(0, 3).map(row => String(row.id)),
      `${tab} preserves the first three API items and their order.`);
    expectCall('news', { CATEGORY_ID: categoryIds[tab] });
  }
  const newsSection = fs.readFileSync(path.resolve('components/NewsUpdatesSection.tsx'), 'utf8');
  assert.deepEqual(Array.from(newsSection.matchAll(/<StepSlider\b[^>]*className="(?:compact-news-slider campus-news-slider|updates-track|compact-news-slider admission-news-slider)"[^>]*size=\{(\d+)\}[^>]*>/g), match => Number(match[1])), [3, 3, 3],
    'Campus, Placement, and Admission sliders each show three API items per page.');
  assert.match(newsSection, /campus-news-slider[^>]*size=\{3\}[^>]*horizontalOnMobile/,
    'Campus news remains horizontally navigable on mobile.');
  assert.match(newsSection, /admission-news-slider[^>]*vertical horizontalOnMobile/,
    'Admission news retains its desktop orientation and mobile horizontal navigation.');
  const countBefore = e.calls.length;
  await Promise.all([news.requestNews('campus', { SCHOOL_URL: 'school-of-technology' }), news.requestNews('campus', { SCHOOL_URL: ' SCHOOL-OF-TECHNOLOGY ' })]);
  assert.equal(e.calls.length, countBefore + 1, 'Equivalent school scopes share only their own in-flight request.');
  expectCall('news', { CATEGORY_ID: '3', SCHOOL_URL: 'school-of-technology' });
  await news.requestNews('campus', { SCHOOL_URL: 'school-of-law' });
  expectCall('news', { CATEGORY_ID: '3', SCHOOL_URL: 'school-of-law' });
  assert.equal(e.calls.length, countBefore + 2, 'Different school scopes are never served from each other’s cache.');
  const invalidStart = e.calls.length;
  for (const url of [0, -1, [], {}, null, '', '../school', 'https://dgu.ac.in/school-of-law', 'school?x=1']) await assert.rejects(news.requestNews('campus', { SCHOOL_URL: url }), /SCHOOL_URL/);
  assert.equal(e.calls.length, invalidStart, 'Invalid school URLs must not issue requests.');
  const campus = newsResponse.data.find(row => String(row.categoryID) === '3');
  const placement = newsResponse.data.find(row => String(row.categoryID) === '1');
  assert.equal(news.parseNews({ error: '0', data: [campus, placement] }, 'campus').length, 1);
  const noLabel = { ...campus }; delete noLabel.categoryName;
  assert.equal(news.parseNews({ error: '0', data: [noLabel] }, 'campus').length, 1, 'Category ID remains authoritative when the display label is absent.');
  const renamed = { ...campus, categoryName: 'Changed display label' };
  assert.equal(news.parseNews({ error: '0', data: [renamed] }, 'campus').length, 1);
  assert.throws(() => news.parseNews({ error: '1', data: [] }, 'campus'));
  e.fail(); await assert.rejects(news.requestNews('campus', { SCHOOL_URL: 'school-of-pharmacy' }), /503/);
  await news.requestNews('campus', { SCHOOL_URL: 'school-of-pharmacy' });
  expectCall('news', { CATEGORY_ID: '3', SCHOOL_URL: 'school-of-pharmacy' });

  const faculty = e.load('components/faculty-api.ts');
  assert.deepEqual(clone((await faculty.requestFaculty()).map(item => item.id)), facultyAll.data.map(row => String(row.id)));
  expectCall('faculty', {});
  assert.deepEqual(clone((await faculty.requestFaculty({ SCHOOL_URL: 'school-of-law' })).map(item => item.id)), facultyLaw.data.map(row => String(row.id)));
  expectCall('faculty', { SCHOOL_URL: 'school-of-law' });
  const profile = await faculty.requestFaculty({ URL: 'mohit-aggarwal' });
  expectCall('faculty', { URL: 'mohit-aggarwal' });
  assert.equal(profile.length, 1); assert.equal(profile[0].name, facultyProfile.data[0].name);
  assert.equal(profile[0].slug, 'mohit-aggarwal'); assert.ok(profile[0].details.length > 100);
  const tabs = facultyProfile.data[0].tabs;
  for (const tab of Array.isArray(tabs) ? tabs : [tabs]) if (tab.details) assert.ok(profile[0].details.includes(tab.details.trim()), 'Full faculty tab content must be retained.');
  const beforeInvalid = e.calls.length;
  await assert.rejects(faculty.requestFaculty({ URL: 'mohit-aggarwal', SCHOOL_URL: 'school-of-law' }));
  await assert.rejects(faculty.requestFaculty({ SCHOOL_URL: 'javascript:invalid' }));
  assert.equal(e.calls.length, beforeInvalid);
  assert.throws(() => faculty.parseFaculty({ Result: 'Error', data: [] }));
  assert.throws(() => faculty.parseFaculty(facultyLaw, { URL: 'mohit-aggarwal' }), 'A different faculty list must not become the requested profile.');
  return e.calls.length;
}

(async () => {
  const requests = await check('production') + await check('development');
  console.log(`PASS: ${requests} Menu/News/Faculty mock requests; all 9 menu groups/nested items, all 396 news-fixture records, optional school scope, 85 faculty directory records, 8 Law faculty, profile tabs, errors/retry and dev/production transports.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
