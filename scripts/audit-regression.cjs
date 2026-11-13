// Run from the project root with: npm run test:audit
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const compiled = new Map();
function load(filename) {
  const file = path.resolve(filename);
  if (compiled.has(file)) return compiled.get(file);
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const result = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports: result.exports, module: result, URL, URLSearchParams, AbortController, setTimeout, clearTimeout, console, process,
    require: name => name.startsWith('.') ? load(path.resolve(path.dirname(file), name + (path.extname(name) ? '' : '.ts'))) : require(name) });
  compiled.set(file, result.exports);
  return result.exports;
}
const { resolveSiteHref, SITE_BASE } = load('components/site-routes.ts');
const { parseMenus, menuHref } = load('components/navigation-api.ts');
const { apiUtilityLinks } = load('components/navigation-utilities.ts');
const { parseNews } = load('components/news-api.ts');
const { newsItemHref, newsListingHref } = load('components/news-routes.ts');
const { parsePrograms } = load('components/programs-api.ts');
const { parseFooter } = load('components/footer-api.ts');
const { localPages } = load('components/local-pages.ts');
const route = slug => `${SITE_BASE}/${slug}/`;
const leaf = (id, name, url) => ({ id, name, url });
const sustainabilityFooter = parseFooter({ error: 0, data: [{ name: 'Resources', childMenu: [
  { id: 1, name: 'The Sustinability Impact Ratings', url: 'https://dgu.ac.in/page-detail/?path=%2Fsustinability&title=sustinability' },
] }] });
assert.equal(sustainabilityFooter.groups[0].links[0].href, 'https://dgu.ac.in/sustinability.html');
const sdgFooter = parseFooter({ error: 0, data: [{ name: 'Resources', childMenu: [
  { id: 1, name: 'SDG', url: 'sustinability.html' },
] }] });
assert.equal(sdgFooter.groups[0].links[0].href, 'https://dgu.ac.in/sustinability.html');
const first = leaf(1, 'Scholarships', 'scholarship');
const second = leaf(2, 'Video Gallery', 'video-gallery');
const parsed = parseMenus({ error: 0, data: [
  { name: 'ADMISSION', childMenu: [first] },
  { name: 'RESOURCES', childMenu: [first, second] },
] });
assert.equal(parsed[1].children.length, 1, 'cumulative group prefixes are removed');
assert.equal(menuHref(parsed[0].children[0]), route('scholarships'));
assert.equal(menuHref(parsed[1].children[0]), route('video-gallery'));
const normal = parseMenus({ error: 0, data: [{ name: 'ADMISSION', childMenu: [first] }, { name: 'RESOURCES', childMenu: [second] }] });
assert.equal(normal[1].children[0].label, 'Video Gallery', 'independent sibling lists stay intact');
const existing = [
  { label: 'OVERVIEW', url: '', target: '', children: [{ label: 'Campus News', url: 'news&filter=campus', target: '', children: [] }] },
  { label: 'ADMISSION', url: '', target: '', children: [{ label: 'Scholarships', url: 'scholarship', target: '', children: [] }] },
  { label: 'RESOURCES', url: '', target: '', children: [{ label: 'Video Gallery', url: 'video-gallery', target: '', children: [] }] },
];
assert.equal(apiUtilityLinks(existing).length, 0, 'manual utility links are never injected into API menus');
const utilities = apiUtilityLinks([{label:'QUICK LINKS',url:'',target:'',children:[
  {label:'Live API destination',url:'video-gallery',target:'_blank',children:[]},
  {label:'Duplicate destination',url:'video-gallery',target:'',children:[]},
]}]);
assert.equal(utilities.length, 1); assert.equal(utilities[0].label, 'Live API destination');
assert.equal(utilities[0].href, route('video-gallery')); assert.equal(utilities[0].target, '_blank');
assert.equal(resolveSiteHref('career-with-us'), route('career-with-us'));
assert.equal(resolveSiteHref('javascript:alert(1)'), '');
assert.equal(resolveSiteHref('data:text/html,test'), '');
assert.equal(resolveSiteHref('https://dgu.ac.in/school-of-law'), route('schools/law'));
const items = parseNews({ error: 0, data: [
  { id: 1, categoryName: 'Campus & Event Updates', newsTitle: 'Campus story', url: 'dgu-football-tournament', image: '/uploads/story.webp' },
  { id: 1, categoryName: 'Campus & Event Updates', newsTitle: 'Campus story', url: 'campus-story' },
  { id: 2, categoryName: 'Admission News', newsTitle: 'Admission story', url: 'admission-story' },
] }, 'campus');
assert.equal(items.length, 1, 'duplicates and wrong news categories are excluded');
assert.equal(newsItemHref(items[0].href, 'campus'), `${SITE_BASE}/news/dgu-football-tournament/`);
assert.equal(newsItemHref('', 'campus'), newsListingHref('campus'), 'missing article URLs open their archive');
const program = { id: 1, programName: 'MBA', url: 'mba' };
const schools = parsePrograms({ error: 0, data: [
  { id: 1, schoolName: 'Business', url: 'school-of-business', childMenu: [program] },
  { id: 2, schoolName: 'Law', url: 'school-of-law', childMenu: [program, { id: 2, programName: 'BA LLB', url: 'ba-llb' }] },
] });
assert.equal(schools[1].programs.length, 1, 'earlier schools do not leak into the next school');
assert.equal(schools[1].programs[0].href, route('programs/ba-llb')+'2/');
const scopedSchool = parsePrograms({error:0,data:[{id:3,schoolName:'Computing',url:'school-of-technology',childMenu:[
 {levelName:'Undergraduate',programs:[{id:1,programName:'B.Tech',url:'btech'}]},
 {levelName:'Integrated',programs:[{id:1,programName:'B.Tech',url:'btech'},{id:2,programName:'Integrated B.Tech + MBA',url:'integrated-btech-mba'}]},
 {levelName:'Postgraduate',programs:[{id:1,programName:'B.Tech',url:'btech'},{id:2,programName:'Integrated B.Tech + MBA',url:'integrated-btech-mba'},{id:3,programName:'MCA',url:'mca'}]},
]}]})[0];
assert.equal(scopedSchool.programs.length,3,'nested cumulative level lists keep only their own courses');
assert.equal(scopedSchool.programs[1].level,'Integrated');assert.equal(scopedSchool.programs[2].level,'Postgraduate');
const footer = parseFooter({ error: 0, data: [{ name: 'Links', childMenu: [{ id: 1, name: 'Career', url: 'career-with-us' }, { id: 1, name: 'Career', url: 'career-with-us' }] }] });
assert.equal(footer.groups[0].links.length, 1);
assert.equal(footer.groups[0].links[0].href, route('career-with-us'));
assert.equal(new Set(localPages.map(x => x.slug)).size, localPages.length, 'local slugs are unique');
console.log('PASS: utility deduplication, career routing, cumulative menu/program feeds, news detail/archive links, footer duplicates and local route identities.');

// Optional: validate recorded real API responses without making a network call.
if (process.argv[2]) {
  const directory = path.resolve(process.argv[2]);
  const read = name => JSON.parse(fs.readFileSync(path.join(directory, `api-${name}.json`), 'utf8'));
  const menus = parseMenus(read('menus'));
  const programs = parsePrograms(read('programs'));
  const news = parseNews(read('news-campus'), 'campus');
  const footerData = parseFooter(read('footer'));
  const crawl = items => items.flatMap(x => [x, ...crawl(x.children)]);
  const links = crawl(menus).map(menuHref).filter(Boolean);
  assert.equal(menus.length, 9);
  assert.equal(programs.length, 8);
  assert(news.length > 0);
  assert(footerData.groups.length > 0);
  assert(links.length > 100);
  const summary = { menus: menus.length, menuLinks: links.length, schools: programs.length, programs: programs.reduce((n, x) => n + x.programs.length, 0), campusNews: news.length, footerGroups: footerData.groups.length, bottomLinks: apiUtilityLinks(menus).map(x => x.label) };
  console.log(JSON.stringify(summary));
}
