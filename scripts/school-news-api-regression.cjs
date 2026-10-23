// Public live-response captures are test fixtures, never production fallback data.
// node scripts/school-news-api-regression.cjs [optional-live-capture-directory]
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), ts = require('typescript');
const directory = path.resolve(process.argv[2] || path.join(__dirname, 'fixtures/school-news'));
const read = name => JSON.parse(fs.readFileSync(path.join(directory, name + '.json'), 'utf8'));
const clone = value => JSON.parse(JSON.stringify(value));
const schoolSlugs = { 1:'school-of-business', 2:'school-of-liberal-studies', 3:'school-of-technology', 4:'school-of-pharmacy', 5:'school-of-modern-media', 6:'school-of-agriculture-science', 7:'school-of-future-skills', 8:'school-of-law' };
const schools = fs.readdirSync(directory).filter(name => /^school-.*\.json$/.test(name) && name !== 'school-invalid.json').map(name => JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8')));
const schoolBySlug = new Map(schools.map(payload => [schoolSlugs[payload.data[0].id], payload]));
const newsList = read('news-campus'), newsDetail = read('news-detail');

function environment(mode) {
  const modules = new Map(), calls = [];
  function load(filename) {
    const file = path.resolve(filename.endsWith('.ts') ? filename : filename + '.ts');
    if (modules.has(file)) return modules.get(file);
    const module = { exports:{} }; modules.set(file, module.exports);
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions:{ module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2020 } }).outputText, {
      module, exports:module.exports, URL, AbortController, Date, setTimeout, clearTimeout,
      process:{ env:{ NODE_ENV:mode, NEXT_PUBLIC_DGU_MENU_API_KEY:'school-news-test-key' } },
      require:name => load(path.resolve(path.dirname(file), name)),
      fetch:async (url, options) => {
        const body = JSON.parse(options.body); calls.push({url, options, body});
        const payload = /school-info/.test(url) ? schoolBySlug.get(body.SCHOOL_URL) : body.URL ? newsDetail : newsList;
        if (!payload) throw new Error('Unexpected fixture request.');
        // The real PHP endpoints return JSON with text/html, so retain that case.
        return new Response(JSON.stringify(payload), { headers:{'Content-Type':'text/html; charset=UTF-8'} });
      },
    });
    return module.exports;
  }
  return {load, calls};
}

async function check(mode) {
  const e = environment(mode), api = e.load('components/academic-page-api');
  const plain = e.load('components/dgu-content-api').apiPlain;
  const key = e.load('components/academic-section-key').academicSectionKey;
  for (const payload of schools) {
    const row = payload.data[0], slug = schoolSlugs[row.id];
    const info = await api.requestAcademicInfo('school', slug);
    const call = e.calls.at(-1);
    assert.equal(call.url, mode === 'development' ? '/nextjs/homev1/api/dgu-school-info/' : 'https://dgu.ac.in/api/get-school-info.php');
    assert.deepEqual(clone(call.body), {SCHOOL_URL:slug});
    assert.equal(call.options.headers.Apikey, 'school-news-test-key');
    assert.equal(info.name, row.schoolName);
    assert.equal(info.metaTitle, row.meta_title);
    assert.equal(info.schoolUrl, slug);
    assert.equal(info.banner, '', 'No banner is invented when this live response has none.');
    assert.equal(info.faculty.length, row.faculty.length, 'Repeated broken numeric IDs must not drop different faculty members.');
    assert.deepEqual(clone(info.faculty.map(person => person.slug)), row.faculty.map(person => person.url));
    assert.equal(info.facts.length, Object.values(row.statistics).filter(Boolean).length);
    assert(info.sections.some(section => section.title === plain(row.heading) && plain(section.html).includes(plain(row.readmore))), 'School heading and complete readmore content must be retained together.');
    const copy = [info.intro, ...info.sections.map(section => section.html), ...info.tabs.map(section => section.html), ...info.accordions.map(section => section.html), ...info.pathways.map(section => section.html)].join(' ');
    for (const field of ['details','areaDetails2','areaDetails3']) {
      const expected = plain(row[field].replace(/<!--[\s\S]*?-->/g, ''));
      assert(!expected || plain(copy).includes(expected), `Full ${field} body must survive mapping for ${slug}.`);
    }
    assert(!/<(?:script|style)\b/i.test(copy));
    assert(info.placementStats.some(stat => stat[0] === row.placements.averageCTC));
    assert.equal(info.students.length, 0, 'Summary statistics must not become unrelated student placement cards.');
    if (row.areaHeading3 && plain(row.areaDetails3)) assert([...info.sections,...info.tabs,...info.pathways,...info.accordions].some(section => key(section.title) === key(row.areaHeading3)));
  }
  const missingFaculty = clone(schools[0]); missingFaculty.data[0].faculty = [];
  assert.deepEqual(clone(api.parseAcademicInfo(missingFaculty, 'school', schoolSlugs[missingFaculty.data[0].id]).faculty), []);
  assert.throws(() => api.parseAcademicInfo({error:'0',data:[{id:null,schoolName:null}]}, 'school', 'unknown-school'), /page name/);

  const news = e.load('components/news-api'), detail = e.load('components/news-detail-api');
  const items = await news.requestNews('campus');
  assert.equal(items.length, newsList.data.length);
  assert.deepEqual(clone(e.calls.at(-1).body), {CATEGORY_ID:'3'});
  for (let i=0; i<items.length; i++) {
    assert.equal(plain(items[i].text), plain(newsList.data[i].shortDesc));
    assert(items[i].image.startsWith('https://dgu.ac.in/uploads/'));
    assert.equal(items[i].href, '/nextjs/homev1/news/' + encodeURIComponent(newsList.data[i].url) + '/');
  }
  const before = e.calls.length;
  await Promise.all([news.requestNews('campus', {SCHOOL_URL:'school-of-technology'}), news.requestNews('campus', {SCHOOL_URL:' SCHOOL-OF-TECHNOLOGY '})]);
  assert.equal(e.calls.length, before + 1);
  assert.deepEqual(clone(e.calls.at(-1).body), {CATEGORY_ID:'3',SCHOOL_URL:'school-of-technology'});
  await news.requestNews('campus', {SCHOOL_URL:'school-of-business'});
  assert.equal(e.calls.length, before + 2, 'School caches stay separate even if a defective backend returns the same records.');
  const article = await detail.requestNewsDetail(newsDetail.data[0].url, new AbortController().signal);
  assert.deepEqual(clone(e.calls.at(-1).body), {URL:newsDetail.data[0].url});
  assert.equal(article.category, newsDetail.data[0].category);
  assert.equal(article.image, 'https://dgu.ac.in/uploads/images/news/news_9062633_gstlecsm.webp');
  assert.equal(plain(article.details), plain(newsDetail.data[0].otherDetails), 'Full article body replaces a repeated truncated intro.');
  assert.equal((article.details.match(/<img\b/g) || []).length, 3, 'All three inline article photos remain available.');
  assert.throws(() => detail.parseNewsDetail(newsDetail, 'another-article'), /not found/);
  const invalidCount = e.calls.length;
  await assert.rejects(detail.requestNewsDetail('../article', new AbortController().signal), /valid news/);
  assert.equal(e.calls.length, invalidCount);
  const archive = await e.load('components/news-archive-api').requestArchiveNews('campus');
  assert.equal(archive.length, newsList.data.length);
  assert.equal(archive[0].image, items[0].image);
  assert.deepEqual(clone(e.calls.at(-1).body), {CATEGORY_ID:'3'});
  return e.calls.length;
}

(async () => {
  const calls = await check('production') + await check('development');
  console.log(`PASS: ${schools.length} real School responses, new News list/detail fields, complete article + 3 photos, faculty relationships, missing banners, category/school contracts and cache isolation; ${calls} production/development requests.`);
})().catch(error => { console.error(error); process.exitCode=1; });
