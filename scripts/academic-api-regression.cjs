// Contract checks only; live PHP availability is checked separately.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), ts = require('typescript');
const academicPageSource = fs.readFileSync(path.resolve('components/AcademicApiPage.tsx'),'utf8');
const academicApiCss = fs.readFileSync(path.resolve('components/academic-api.css'),'utf8');
assert.match(academicPageSource,/info\.slug==='btech'[\s\S]*?AcademicAccordionGroup/,'B.Tech specializations use the existing bottom accordion component');
assert.doesNotMatch(academicPageSource,/ProgramSpecializationTiles/,'B.Tech specializations do not introduce a replacement card design');
assert.doesNotMatch(academicApiCss,/program-specializations--direct-links/,'B.Tech specialization rendering does not add a new visual system');

const { parse: parseTestHtml, HTMLElement: TestHtmlElement } = require('next/dist/compiled/node-html-parser');
const modules = new Map(), calls = [];
let failNext = false;
const env = { NODE_ENV:'production', NEXT_PUBLIC_DGU_MENU_API_KEY:'academic-test-key' };
Object.defineProperties(TestHtmlElement.prototype, {
  children: { configurable:true, get() { return this.childNodes.filter(node => node instanceof TestHtmlElement); } },
  parentElement: { configurable:true, get() { return this.parentNode instanceof TestHtmlElement ? this.parentNode : null; } },
  cloneNode: { configurable:true, value(deep = true) {
    const copy = this.clone();
    if (!deep) copy.childNodes.slice().forEach(node => copy.removeChild(node));
    return copy;
  } },
  append: { configurable:true, value(...nodes) { nodes.forEach(node => this.appendChild(node)); } },
});
class TestDOMParser {
  parseFromString(source) { return { body:parseTestHtml(source) }; }
}
function load(filename, globals = {}) {
  const file = path.resolve(filename.endsWith('.ts') ? filename : filename+'.ts');
  if (modules.has(file)) return modules.get(file);
  const module = {exports:{}};modules.set(file,module.exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{
    module,exports:module.exports,URL,AbortController,Date,setTimeout,clearTimeout,process:{env},
    require:name=>name==='server-only'?{}:load(path.resolve(path.dirname(file),name)),
    fetch:async (url,options)=>{
      const body=JSON.parse(options.body);calls.push({url,options,body});
      if(failNext){failNext=false;return new Response('<title>404 Page Not Found</title>',{status:200});}
      const school=!!body.SCHOOL_URL;
      return new Response(JSON.stringify({error:'0',data:[{id:body.PROGRAM_URL ? 92 : 1,url:body.PROGRAM_URL||body.SCHOOL_URL,
        [school?'schoolName':'programName']:'API name',introText:'API introduction',meta_title:'API metadata title',
        meta_desc:'API metadata description',meta_keywords:'API keyword one, API keyword two',meta_canonical:body.PROGRAM_URL||''}]}),{status:200});
    },
    ...globals,
  });
  return module.exports;
}
(async()=>{
  const programs=load('components/programs-api'),academic=load('components/academic-page-api'),features=load('components/academic-features'),tabContent=load('components/academic-tab-content',{DOMParser:TestDOMParser}),seo=load('components/academic-seo-metadata');
  const btechSeo=seo.parseProgrammeSeoMetadata({error:'0',data:[{meta_title:'API B.Tech title',meta_desc:'API B.Tech description',meta_keywords:'B.Tech, engineering',meta_canonical:'btech'}]},'btech');
  assert.deepEqual(JSON.parse(JSON.stringify(btechSeo)),{title:'API B.Tech title',description:'API B.Tech description',keywords:'B.Tech, engineering',canonical:''},
    'Only exact API metadata fields are used; slug-only canonical values do not become fabricated URLs');
  const canonicalSeo=seo.parseProgrammeSeoMetadata({error:'0',data:[{id:10,url:'mba',meta_title:'API MBA title',meta_desc:'',meta_keywords:null,meta_canonical:'https://dgu.ac.in/programs/mba/'}]},'mba','10');
  assert.equal(canonicalSeo.canonical,'https://dgu.ac.in/programs/mba/','An absolute canonical is retained only when supplied by the API');
  const schoolSeo=seo.parseAcademicSeoMetadata({error:'0',data:[{id:1,schoolName:'API Business',meta_title:'API school title',meta_desc:'API school description',meta_keywords:'API school keyword'}]},'school','school-of-business');
  assert.deepEqual(JSON.parse(JSON.stringify(schoolSeo)),{title:'API school title',description:'API school description',keywords:'API school keyword',canonical:''},
    'School SEO uses only the school API metadata fields and does not invent a canonical');
  assert.deepEqual(JSON.parse(JSON.stringify(seo.parseProgrammeSeoMetadata({error:'0',data:[{url:'btech',meta_title:null,meta_desc:'',meta_keywords:null,meta_canonical:''}]},'btech'))),
    {title:'',description:'',keywords:'',canonical:''},'Missing API metadata stays empty without fallback values');
  assert.throws(()=>seo.parseProgrammeSeoMetadata({error:'0',data:[{url:'mba',meta_title:'Other programme title'}]},'btech'),/matching programme metadata record/,
    'Metadata from a different API programme is never used');
  assert.throws(()=>seo.parseProgrammeSeoMetadata({error:'0',data:[{id:11,url:'mba',meta_title:'Wrong duplicate'}]},'mba','10'),/matching programme metadata record/,
    'A mismatched programme record ID is rejected');
  assert.equal(seo.parseProgrammeSeoMetadata({error:'0',data:[{id:33,meta_title:'API MBA Global title',meta_canonical:'mba-global'}]},'dgu-global-mba','33').title,'API MBA Global title',
    'The API canonical field is metadata, not a route identity');
  assert.equal(seo.parseProgrammeSeoMetadata({error:'0',data:[{meta_title:'<script>bad()</script>Safe title'}]},'btech').title,'Safe title',
    'API metadata is reduced to safe text rather than interpreted as HTML');
  const layoutClasses=load('components/dgu-content-api').apiLayoutClasses;
  assert.deepEqual(Array.from(layoutClasses('row col-sm-4 col-lg-4 text-center unsafe-class')),['dgu-api-row','dgu-api-col-sm-4','dgu-api-col-lg-4','dgu-api-text-center'],'Only allowlisted CMS layout classes are retained as safe DGU classes');
  const academicCss=fs.readFileSync(path.resolve('components/academic-api.css'),'utf8');
  const referenceCss=fs.readFileSync(path.resolve('app/academic-reference.css'),'utf8');
  assert.match(academicCss,/\.academic-api-page \.dgu-api-row\s*\{/,'CMS rows use the shared academic API layout');
  assert.match(academicCss,/\.academic-api-page \.dgu-api-text-center/,'CMS text alignment is scoped to academic API pages');
  assert(referenceCss.includes('[data-api-slug="mba-international-business"]'), 'International Business list formatting remains page-specific');
  assert(referenceCss.includes('.academic-tab-content[data-tab-kind="eligibility"] .dgu-api-copy'), 'International Business eligibility text and criteria use their page-specific two-column layout');
  assert.match(fs.readFileSync(path.resolve('components/academic-tab-content.ts'),'utf8'),/includeAllHeadingLevels/,'The Agribusiness Structure path can split headings with different levels');
  const tabContentSource=fs.readFileSync(path.resolve('components/academic-tab-content.ts'),'utf8');
  const academicPageSource=fs.readFileSync(path.resolve('components/AcademicApiPage.tsx'),'utf8');
  const heroSource=fs.readFileSync(path.resolve('components/AnimatedHeroSlider.tsx'),'utf8');
  const heroCss=fs.readFileSync(path.resolve('components/AnimatedHeroSlider.module.css'),'utf8');
  const bannerSource=fs.readFileSync(path.resolve('components/AcademicBannerImage.tsx'),'utf8');
  const homepageSource=fs.readFileSync(path.resolve('app/page.tsx'),'utf8');
  const homepageCss=fs.readFileSync(path.resolve('app/global.css'),'utf8');
  assert.match(heroSource,/const duration = 700/,'The image and thumbnail track share one coordinated duration');
  assert.match(heroSource,/easing: 'cubic-bezier\(\.42,0,\.58,1\)'/,'Images and thumbnails use the balanced ease-in-out curve');
  assert.match(heroSource,/targetImage\.animate\(\[[\s\S]*?opacity: 0, transform: 'scale\(1\.05\)'[\s\S]*?opacity: 1, transform: 'scale\(1\)'/,'The incoming image cross-fades while zooming from 1.05 to 1');
  assert.match(heroSource,/previousImage\.animate\(\[\{ opacity: 1 \}, \{ opacity: 0 \}\]/,'The outgoing image fades only after the incoming image is ready');
  assert.match(heroSource,/const ratioSource = useRef<string \| null>\(null\)/,'The hero keeps a stable stage ratio during slide changes to prevent layout jumps');
  assert.match(heroSource,/if \(node\.naturalWidth && node\.naturalHeight && !ratioSource\.current\)/,'A slide load cannot resize the stage in the middle of an image transition');
  assert.match(heroSource,/await Promise\.all\(\[decodedSource, previous\]\.map\(async url =>/,'Both incoming and outgoing images are decoded before the cross-fade starts');
  assert.match(heroSource,/thumbnailPositions\.current = new Map\(buttons\.map/,'Thumbnail positions are captured before their order changes');
  assert.match(heroSource,/flight\?\.start && <img ref=\{flightImage\} className=\{styles\.flightImage\} src=\{flight\.source\}/,'The expanding thumbnail image remains in React\'s rendered tree throughout the state update');
  assert.doesNotMatch(heroCss,/transform: translateY\(-5px\)/,'Thumbnail hover does not move the measured source during a flight');
  assert.match(heroSource,/button\.animate\(/,'Remaining thumbnails move smoothly into their reordered positions with the image cross-fade');
  assert.match(heroSource,/setTimeout\(\(\) => select\(\(index \+ 1\) % available\.length\), interval\)/,'Autoplay uses the same thumbnail expansion path as manual selection');
  assert.match(heroSource,/transitionLock\.current \|\| next === index/,'New slide selection cannot interrupt an active expansion');
  assert.match(heroSource,/data-slide-index=\{slideIndex\}/,'Upcoming thumbnails can be located for autoplay and navigation transitions');
  assert.match(heroSource,/<source media="\(max-width: 700px\)" srcSet=\{slide\.mobile\}/,'Thumbnails use the API-provided responsive image for the current viewport');
  assert.match(heroSource,/aria-busy=\{preloading \|\| transitioning\}/,'Assistive technology can identify preloading and active transitions');
  assert.match(heroSource,/disabled=\{preloading \|\| transitioning\}/,'Rapid selections are held while a coordinated transition is in progress');
  assert.match(heroCss,/\.transitioning \.heroImage \{ opacity: 0; animation: none; \}/,'The arriving hero image is held for its coordinated cross-fade animation');
  assert.match(heroSource,/Array\.from\(\{ length: Math\.min\(4, available\.length - 1\) \}/,'The slider displays four upcoming cards whenever enough slides exist');
  assert.match(heroSource,/String\(index \+ 1\)\.padStart\(2, '0'\)/,'The slide counter updates with a two-digit active index');
  assert.match(heroSource,/String\(available\.length\)\.padStart\(2, '0'\)/,'The total slide count is formatted as two digits');
  assert.match(heroCss,/\.controls \{\s*position: absolute;\s*z-index: 7;/,'Navigation controls remain above the expanding image');
  assert.match(heroCss,/\.thumbnails \{\s*position: absolute;\s*z-index: 5;/,'The thumbnail strip stays above the background images');
  assert.match(heroSource,/await Promise\.all\(\[decodedSource, previous\]\.map\(async url =>/,'The selected thumbnail is decoded before its flight layer is rendered');
  assert.match(heroSource,/expandingImage\.animate\(\[[\s\S]*?left: `\$\{start\.left\}px`[\s\S]*?width: `\$\{start\.width\}px`[\s\S]*?left: '0px'[\s\S]*?width: `\$\{media\.current\.clientWidth\}px`/,'The flight image animates from measured thumbnail bounds to the measured hero frame');
  assert.match(heroCss,/\.flightImage \{\s*position: absolute;\s*z-index: 3;/,'The expanding image stays above the background and below the visible thumbnails');
  assert.match(heroCss,/\.thumbnails \{\s*position: absolute;[\s\S]*?width: 42%;/,'The thumbnail row has a stable responsive width instead of shrinking to its empty intrinsic content');
  assert.match(homepageSource,/<AnimatedHeroSlider className="homepageHeroSlider" variant="home"/,'The homepage uses the shared animated slider');
  for(let banner=1;banner<=8;banner++) assert(homepageSource.includes(`https://dgu.ac.in/oldv1/images/slides/banner${banner}.jpg`),`Homepage banner ${banner} uses the supplied live image URL`);
  assert.match(homepageSource,/slides=\{homepageHeroSlides\}/,'The homepage carousel uses the supplied banner sequence');
  assert.doesNotMatch(homepageSource,/HeroVideo|hero-campus-demo\.mp4/,'The homepage no longer renders or loads the campus hero video');
  assert.match(homepageCss,/\.hero#home>\.homepageHeroSlider/,'The homepage slider retains the existing responsive hero placement');
  assert.match(homepageCss,/\.hero#home\s*\{\s*aspect-ratio:1920\/708;/,'The homepage hero matches the source banner aspect ratio without cropping');
  assert.equal(fs.existsSync(path.resolve('components/HeroVideo.tsx')),false,'The now-unused homepage-only video playback component is removed');
  assert.match(academicPageSource,/kind==='school' && media\.length>0 && <AnimatedHeroSlider[\s\S]*?title=\{info\.name\}[\s\S]*?variant="school"/,'Schools render their API title as an H1 over the shared multi-image hero');
  assert.match(academicPageSource,/slides=\{media\} label=\{`\$\{info\.name\} banners`\} title=\{info\.name\}/,'School hero receives the visible H1 title');
  assert.match(academicPageSource,/kind==='program' && media\[0\] && <div className="program-hero"[\s\S]*?<AcademicBannerImage/,'Programs retain the single API banner renderer');
  assert.match(academicPageSource,/<h1 className="program-hero-caption">\{info\.name\}<\/h1>/,'The program title is a semantic H1 overlaid on its API banner');
  assert.match(academicPageSource,/!media\.length && <h1 className="visually-hidden">\{info\.name\}/,'Pages retain an accessible title when no banner can be displayed');
  assert.match(academicPageSource,/slides=\\{media\\} label=\\{`\\$\\{info\\.name\\} banners`\\} title=\\{info\\.name\\}[^>]*variant="school"/,'School hero title is passed to the visible H1 overlay');
  assert.match(heroSource,/variant !== 'school' \\|\\| title/,'School hero renders a caption when an accessible title is supplied');
  assert.match(heroSource,/slides\.filter\(slide => slide\.image && !failed\.includes\(slide\.image\)\)/,'The hero only displays valid API slide images');
  assert.match(heroSource,/onImageUnavailable\?\.\(current\.image\)/,'Failed hero images are reported to the owning API page');
  assert.match(heroSource,/aria-label=\{`Show slide \$\{slideIndex \+ 1\}/,'Hero thumbnail controls remain accessible');
  assert.match(heroCss,/@media \(max-width: 700px\)/,'The hero has a dedicated mobile layout');
  assert.match(heroCss,/@media \(prefers-reduced-motion: reduce\)/,'The hero respects reduced-motion preferences');
  assert.match(heroCss,/object-fit: cover/,'Hero images preserve the source while filling their frame');
  assert.match(academicPageSource,/variant="school" aspectRatio=\{bannerRatio\}/,'School banners select the shared full-image rendering variant');
  assert.match(heroCss,/\.schoolVariant \.heroImage,[\s\S]*?object-fit: contain/,'School hero images preserve their full natural proportions');
  assert.match(heroCss,/\.schoolVariant \.media::after \{ display: none; \}/,'School media does not render a gradient overlay');
  assert.match(heroCss,/\.schoolVariant \.heroImage,[\s\S]*?\.newsVariant \.heroImage \{ animation: none; \}/,'Full-image variants avoid extra reveal effects that clip source edges');
  assert.match(heroCss,/aspect-ratio: var\(--hero-aspect, 1920 \/ 680\)/,'The school media stage follows the selected API image ratio');
  assert.match(fs.readFileSync(path.resolve('app/schools/school.css'),'utf8'),/school-opening-media\{width:100%;max-width:none;aspect-ratio:auto/,'The school root does not clip the intrinsic-ratio media stage');
  assert.match(bannerSource,/window\.addEventListener\('resize',scheduleReport\)/,'Program banners re-measure the responsive image source after viewport changes');
  assert.match(fs.readFileSync(path.resolve('app/programs/program.css'),'utf8'),/program-hero picture img\{[^}]*object-fit:contain/,'Program banners preserve the complete image without an animated overlay');
  assert.match(tabContentSource,/export function academicSemesterContent/,'B.Com CPA course structure has a dedicated table-aware parser');
  assert.match(tabContentSource,/querySelectorAll\('tr'\)/,'Semester boundaries are read from API table rows');
  assert.match(tabContentSource,/semesterTitle\(cell\.textContent \|\| ''\)/,'Semester labels are detected from table cell content, not assumed heading tags');
  assert.match(tabContentSource,/group\.rows\.push/,'Each table column group retains only its own semester rows');
  assert.match(tabContentSource,/table\.remove\(\)/,'The original paired-semester table is not rendered beside parsed accordion content');
  assert.match(academicPageSource,/academicSemesterContent\(section\.html\)/,'B.Com CPA course structure uses the table-aware semester parser');
  assert.match(academicPageSource,/if\(semesterParts\.handled\)/,'Recognized malformed semester tables do not fall back to raw source rendering');
  assert.match(academicPageSource,/semesterAccordion=\{info\.kind==='program' && \['bcom-cpa','bcom-uscpa'\]\.includes\(info\.slug\)\}/,'Semester parsing remains scoped to the B.Com CPA route');
  const bcomCpaApiCourseStructure=`
    <div class="table-responsive mt-15 mb-15">
      <table class="table table-bordered" width="100%">
        <thead class="table-alignment">
          <tr>
            <th colspan="2"><strong>SEMESTER I</strong></th>
            <th colspan="2"><strong>SEMESTER II</strong></th>
          </tr>
        </thead>
        <tbody>
          <tr><td><strong>Subject</strong></td><td><strong>Credits</strong></td><td><strong>Subject</strong></td><td><strong>Credits</strong></td></tr>
          <tr><td>Fundamentals of Financial Accounting</td><td>3</td><td>Cost Accounting</td><td>3</td></tr>
          <tr><td class="bg-col2"><strong>TOTAL</strong></td><td class="bg-col2"><strong>22</strong></td><td class="bg-col2"><strong>TOTAL</strong></td><td class="bg-col2"><strong>22</strong></td></tr>
          <tr><td class="bg-col" colspan="2"><strong>SEMESTER III</strong></td><td class="bg-col" colspan="2"><strong>SEMESTER IV</strong></td></tr>
          <tr><td><strong>Subject</strong></td><td><strong>Credits</strong></td><td><strong>Subject</strong></td><td><strong>Credits</strong></td></tr>
          <tr><td>Financial Reporting</td><td>3</td><td>Management Accounting</td><td>3</td></tr>
          <tr><td class="bg-col" colspan="2"><strong>SEMESTER V</strong></td><td class="bg-col" colspan="2"><strong>SEMESTER VI</strong></td></tr>
          <tr><td><strong>Subject</strong></td><td><strong>Credits</strong></td><td><strong>Subject</strong></td><td><strong>Credits</strong></td></tr>
          <tr><td>Equity Research</td><td>3</td><td>Security Analysis and Portfolio Management</td><td>3</td></tr>
        </tbody>
      </table>
    </div>`;
  const semesterSplit=tabContent.academicSemesterContent(bcomCpaApiCourseStructure);
  assert.equal(semesterSplit.handled,true,'The API table with semester labels is handled');
  assert.deepEqual(Array.from(semesterSplit.sections,section=>section.title),['SEMESTER I','SEMESTER II','SEMESTER III','SEMESTER IV','SEMESTER V','SEMESTER VI'],'All API semesters retain their original order');
  assert(semesterSplit.sections.every(section=>/<table\b/i.test(section.html)),'Each semester keeps a structured table');
  assert(semesterSplit.sections[0].html.includes('Fundamentals of Financial Accounting')&&!semesterSplit.sections[0].html.includes('Cost Accounting'),'Semester I keeps only its own subjects');
  assert(semesterSplit.sections[1].html.includes('Cost Accounting')&&!semesterSplit.sections[1].html.includes('Fundamentals of Financial Accounting'),'Semester II keeps only its own subjects');
  assert(semesterSplit.sections[2].html.includes('Financial Reporting')&&!semesterSplit.sections[2].html.includes('Management Accounting'),'Semester III keeps only its own subjects');
  assert(semesterSplit.sections[3].html.includes('Management Accounting')&&!semesterSplit.sections[3].html.includes('Financial Reporting'),'Semester IV keeps only its own subjects');
  assert(semesterSplit.sections[4].html.includes('Equity Research')&&!semesterSplit.sections[4].html.includes('Security Analysis'),'Semester V keeps only its own subjects');
  assert(semesterSplit.sections[5].html.includes('Security Analysis')&&!semesterSplit.sections[5].html.includes('Equity Research'),'Semester VI keeps only its own subjects');
  assert(!semesterSplit.intro.includes('<table')&&!semesterSplit.intro.includes('Fundamentals of Financial Accounting'),'The source table is removed rather than duplicated');
  const nestedSemester=tabContent.academicSemesterContent('<table><thead><tr><th><strong>SEMESTER I</strong></th></tr></thead><tbody><tr><td><a href="/course-link/"><span><strong>Nested API subject</strong></span></a></td></tr></tbody></table>');
  assert(nestedSemester.sections[0].html.includes('<a href="/course-link/"><span><strong>Nested API subject</strong></span></a>'),'Nested formatting and API links are preserved');
  assert.equal(tabContent.academicSemesterContent('').handled,false,'Empty API content creates no semester sections');
  const misleadingSemester=tabContent.academicSemesterContent('<table><tr><th>Semester I Overview</th></tr><tr><td>API text</td></tr></table>');
  assert.equal(misleadingSemester.handled,false,'Descriptive headings are not misidentified as semester labels');
  const malformedSemester=tabContent.academicSemesterContent('<p>Independent API introduction</p><table><tr><th colspan="2"><strong>SEMESTER I</strong></th></tr><tr><td colspan="4">Ambiguous shared content</td></tr></table>');
  assert.equal(malformedSemester.handled,true,'Malformed semester tables are recognized for safe suppression');
  assert.equal(malformedSemester.sections.length,0,'Ambiguous table content is hidden rather than assigned to a fabricated semester');
  assert(malformedSemester.intro.includes('Independent API introduction'),'Independent valid API content survives a malformed table');
  assert(!malformedSemester.intro.includes('Ambiguous shared content'),'Malformed table text is not rendered as plain text');
  const invalidSpan=tabContent.academicSemesterContent('<table><tr><th colspan="99999999">SEMESTER I</th></tr><tr><td>Unsafe span</td></tr></table>');
  assert.equal(invalidSpan.sections.length,0,'Invalid table spans cannot create unsafe or fabricated semester content');
  assert(!invalidSpan.intro.includes('Unsafe span'),'Malformed span content is not leaked as plain text');
  assert.match(tabContentSource,/export function academicColumnSections/,'International Business focus cards are derived from API columns');
  assert.match(tabContentSource,/export function academicCareerAccordionSections/,'Agribusiness career accordions are derived from API columns');
  assert.match(academicPageSource,/className="program-options-card academic-core-focus-card"/,'International Business focus uses the existing program option card design');
  assert.match(academicPageSource,/info\.slug==='mba-international-business' && academicSectionKey\(section\.title\)==='careers'\s*\? <ApiRichText/,'International Business career content renders directly in its tab');
  assert.match(academicPageSource,/info\.slug==='mba-agri-business' && academicSectionKey\(section\.title\)==='careers'\s*\? <CareerAccordionContent/,'Agribusiness career content uses its page-specific accordion');
  assert.match(academicPageSource,/previewHeightOverride=\{info\.slug==='dgu-global-mba'/,'Global MBA keeps a page-specific intro preview length');
  assert.match(academicCss,/\.academic-api-page \.dgu-api-row > \* \{ grid-column:1\/-1/,'Non-column CMS row content spans the full row');
  assert.match(fs.readFileSync(path.resolve('components/AcademicApiPage.tsx'),'utf8'),/academicTabContent\(section\.html,hr \|\| \['structure','scholarship','course highlights'\]\.includes\(kind\),singleAccordion \|\| kind==='course highlights'\)/,'The generic mixed-heading accordion path remains isolated from B.Com CPA table parsing');
  assert.match(fs.readFileSync(path.resolve('components/AcademicAccordionGroup.tsx'),'utf8'),/useState<number \| null>\(null\)/,'Academic accordions remain collapsed by default');
  assert.equal(features.academicFeaturePresentation(5),'wave','Five features retain the existing wave path');
  assert.equal(features.academicFeaturePresentation(6),'tab','Six features use one complete academic tab');
  assert.equal(features.academicFeaturePresentation(7),'tab','More than six features use one complete academic tab');
  const featureSections=features.academicFeatureAccordionSections([
    {title:'T Skillset Development',description:'',html:'<p>T content</p>'},
    {title:'Student Engagement and Opportunities',description:'',html:'<ul><li>Engagement</li></ul>'},
  ]);
  assert.deepEqual(featureSections.map(section=>section.title),['T Skillset Development','Student Engagement and Opportunities']);
  assert.equal(featureSections[1].html,'<ul><li>Engagement</li></ul>','Feature HTML remains rich content for the existing accordion renderer');
  const base='';
  const siteBase=load('components/site-base');
  assert.equal(siteBase.SITE_BASE,'','Production URLs use the domain root');
  assert.equal(siteBase.sitePath('/assets/example.webp'),'/assets/example.webp','Legacy asset paths are normalized for root deployment');
  assert.equal(programs.apiProgramHref('mba',10),base+'/programs/mba/');
  assert.equal(programs.apiProgramHref('school-of-business'),base+'/schools/business/');
  const unknown=programs.apiProgramHref('new-published-course',123);
  assert.equal(unknown,base+'/programs/new-published-course/123/');
  assert.equal(load('components/site-routes').resolveSiteHref(unknown),unknown,'clean routing must survive ProgramCard');
  const routes=load('components/academic-clean-routes');
  assert.equal(programs.apiProgramHref('bcom',6),base+'/programs/bcom/');
  assert.equal(programs.apiProgramHref('bcom',92),base+'/programs/bcom-92/');
  assert.deepEqual(JSON.parse(JSON.stringify(routes.academicPathIdentity('program',base+'/programs/bcom-92/'))),{slug:'bcom',recordId:''});
  const identities=load('components/academic-route-identities');
  for(const alias of ['bcom-92','bba-mba-94','global-mba-97'])assert.equal(identities.academicProgramRecordIds[alias],undefined,`${alias} resolves through its API slug without a mismatched ID`);
  assert.equal(identities.academicProgramRoutes['bcom-92'],'bcom');
  assert.equal(identities.academicProgramRoutes['bba-mba-94'],'bba-mba-integrated');
  assert.equal(identities.academicProgramRoutes['global-mba-97'],'dgu-global-mba','Global MBA keeps its existing slug-based lookup');
  const metadataRouteSource=fs.readFileSync(path.resolve('app/programs/[programSlug]/page.tsx'),'utf8');
  const schoolMetadataRouteSource=fs.readFileSync(path.resolve('app/schools/[schoolSlug]/page.tsx'),'utf8');
  assert.match(metadataRouteSource,/Object\.keys\(academicProgramRoutes\)/,'Every registered programme route and specialization is statically enumerated');
  assert.match(schoolMetadataRouteSource,/loadAcademicSeoMetadata\('school',slug\)/,'School metadata is generated from its own API record during static export');
  assert.match(metadataRouteSource,/loadProgrammeSeoMetadata\(slug,academicProgramRecordIds\[programSlug\]/,'SEO metadata uses the route-specific API slug and record ID');
  assert.match(metadataRouteSource,/title:seo\.title,\s*description:seo\.description/,'Empty API title and description do not inherit unrelated static metadata');
  assert.match(metadataRouteSource,/return \{title:'',description:''\}/,'API failures do not substitute static programme metadata');
  assert.match(academicPageSource,/if\(info\.metaTitle\)document\.title=info\.metaTitle/,'Client metadata never invents a title from programme name');
  assert.match(academicPageSource,/if\(info\.metaKeywords\)/,'API keywords update the document metadata after hydration');
  assert.equal(load('components/site-routes').resolveSiteHref('https://dgu.ac.in/programs/mba-human-resource/?slug=mba-human-resource&id=26'),base+'/programs/mba-human-resource/');
  assert.equal(load('components/site-routes').resolveSiteHref('https://dgu.ac.in/programs/mba/?slug=mba-human-resource&id=26'),base+'/programs/mba/');
  assert.equal(load('components/site-routes').resolveSiteHref('https://dgu.ac.in/programs/mba/?id=26'),base+'/programs/mba/');
  assert.equal(load('components/site-routes').resolveSiteHref('https://dgu.ac.in/bcom?id=92&slug=bcom&utm_source=email#fees'),base+'/programs/bcom-92/?utm_source=email#fees');
  assert.equal(programs.apiProgramHref('https://example.com/official-course'),'https://example.com/official-course');
  assert.equal(programs.apiProgramHref('javascript:alert(1)'), '');
  const selected=programs.parsePrograms({error:'0',data:[
    {schoolName:'One',url:'school-of-one',level:[{levelName:'Undergraduate',programs:[{id:1,programName:'API A',url:'a'}]}]},
    {schoolName:'Two',url:'school-of-two',level:[{levelName:'Undergraduate',programs:[{id:1,programName:'API A',url:'a'},{id:2,programName:'API B',url:'b'}]}]},
  ],unassignedPrograms:[{id:3,programName:'API C',url:'c'}]});
  assert.equal(selected[1].programs.length,2,'explicit levels do not lose independent school records');
  assert.equal(selected.length,2,'unassigned records never invent an extra school card');
  const ordered=programs.parsePrograms({error:'0',data:[{id:1,schoolName:'API school',url:'school-of-one',
    childMenu:[{id:10,programName:'API MBA',url:'mba'},{id:2,programName:'API BBA',url:'bba'}],
    level:[{levelName:'Undergraduate',programs:[{id:2,programName:'API BBA',url:'bba'}]},{levelName:'Postgraduate',programs:[{id:10,programName:'API MBA',url:'mba'}]}]}]});
  assert.deepEqual(Array.from(ordered[0].programs,p=>p.id),['10','2'],'flat homepage programme order is preserved with updated levels');
  const payload={error:'0',data:[{id:92,url:'bcom',programName:'API Commerce',introText:'API intro',
    tabs:[{tabName:'<h3>Eligibility Criteria</h3>',tabDetails:'<p>API eligibility</p>'}],
    accordion:[{accordionName:'API collaboration',accordionDetails:'<p>API detail</p>'}],faqs:[]}]};
  const result=academic.parseAcademicInfo(payload,'program','bcom','92');
  assert.equal(result.name,'API Commerce');assert.equal(result.tabs.length,1);assert.equal(result.accordions.length,1);
  assert.equal(result.faqs.length,0);assert.equal(result.recruiters.length,0);
  const restored=academic.parseAcademicInfo({error:'0',data:[{id:10,programName:'API MBA',introText:'API introduction',
    programTabs:[{tabName:'Eligibility Criteria',tabDetails:'<p>Complete eligibility.</p>',programs:[{id:59,programName:'API Law',url:'ba-llb'},{id:999,programName:'Unlinked API course',url:''}]}],
    specialization:[{id:26,programName:'API HR',url:'mba-human-resource'},{id:998,programName:'Unlinked specialization',url:''}],
    accordion:[{id:1,name:'SAP Program',details:'<p>Complete SAP details.</p>'}],
    faq:[{id:1,name:'API question?',details:'<p>Complete answer.</p>'}],prospectus:'/uploads/documents/api.pdf',
    areaHeading2:'Career Success in Higher Education',areaDetails2:'<p>API higher education.</p>',
    areaHeading3:'Global Learning & Study Abroad Pathways',areaDetails3:'<p>API international copy.</p>',
    placements:[{id:1,name:'Unverified student',currentEmployer:'API employer',imageURL:'/uploads/student.webp'}],
  }]},'program','mba','10');
  assert.equal(restored.relatedPrograms.length,2);assert.equal(restored.relatedPrograms[1].href,'','Missing links never create a route');
  assert.ok(restored.tabs[0].html.includes('Unlinked API course'));
  assert.ok(restored.tabs[0].html.includes('/programs/ba-llb/'));
  assert.equal(restored.accordions[0].title,'SAP Program');assert.ok(restored.accordions[0].html.includes('Complete SAP details.'));
  assert.equal(restored.faqs.length,1);assert.ok(restored.faqs[0].answer.includes('Complete answer.'));
  assert.equal(restored.prospectusUrl,'https://dgu.ac.in/uploads/documents/api.pdf');
  assert.ok(restored.sections.some(section=>section.html.includes('API higher education.')));
  assert.ok([...restored.sections,...restored.pathways].some(section=>section.html.includes('API international copy.')));
  assert.equal(restored.schoolUrl,'','No school relationship is fabricated');
  assert.equal(restored.students.length,0,'The new unverified placements list does not bypass the existing filtered feed');
  const other=academic.parseAcademicInfo({error:'0',data:[{id:26,programName:'API HR',introText:'API intro',
    programTabs:[{tabName:'Eligibility Criteria',tabDetails:'<p>API eligibility.</p>'},{tabName:'Other Specializations',tabDetails:'<p>API related choices.</p>',programs:[{id:27,programName:'API Finance',url:'mba-finance'}]}],
    otherSpecializations:[{id:26,programName:'Current programme',url:'mba-human-resource'},{id:27,programName:'API Finance',url:'mba-finance'},{id:28,programName:'API IB',url:'mba-international-business'}],
  }]},'program','mba-human-resource','26');
  assert.deepEqual(Array.from(other.otherPrograms,p=>p.id),['27','28'],'Explicit links deduplicate and exclude the current programme');
  const layout=load('components/academic-layout').academicLayout;
  const computingPages=load('components/advanced-computing-layout');
  const computingLayout=computingPages.advancedComputingLayout;
  assert.equal(computingPages.isAdvancedComputingAcademicPage({kind:'program',slug:'btech',schoolUrl:'school-of-technology'}),true,
    'Advanced Computing programme pages use the same section-specific renderer');
  const computing=computingLayout({
    kind:'school',slug:'school-of-technology',intro:'',pathways:[],
    tabs:[
      {title:'Program Options at a Glance',html:'<table><tr><td>API options</td></tr></table>'},
      {title:'Laboratory & Infrastructure',html:'<p>API laboratories.</p>'},
      {title:'Co-Designed Curriculum',html:'<p>API industry integration.</p>'},
      {title:'Placements',html:'<p>API placements.</p>'},
      {title:'Student Education Immersion Program',html:'<p>API international content.</p>'},
    ],
    sections:[{title:'Why Choose School of Advanced Computing',html:'<p>API differentiators.</p>'}],
    accordions:[
      {title:'Faculty',html:'<p>API faculty.</p>'},
      {title:'News',html:'<p>API news.</p>'},
      {title:'FAQs',html:'<p>API FAQs.</p>'},
    ],
    faqs:[{question:'API question',answer:'API answer'}],
  });
  assert.deepEqual(Array.from(computing,block=>block.kind),[
    'programs','tabs','section','tabs','placements','faculty','news','international','faqs',
  ],'Advanced Computing lists programmes before the long highlights and options content');
  assert.deepEqual(Array.from(computing[3].sections,section=>section.title),[
    'State-of-the-Art Infrastructure & Labs','Curriculum and Industry Integration',
  ],'Advanced Computing keeps lab and industry content in its API-backed tabs');
  const academicRoutes=load('components/academic-route-identities');
  const advancedPrograms=[
    'btech','btech-cse-with-minor','btech-cse-with-spe-in-ai-and-ml-with-minor',
    'bca-with-specialization','btech-cse-with-spe-in-ai-and-ml-hcl',
    'btech-cse-with-spe-in-cyber-security-hcl','btech-cse-with-spe-in-data-science-hcl',
    'integrated-btech-mba','integrated-btech-mtech','mtech','mca',
    'btech-cse-in-quantum-computing-with-minor','btech-cse-lateral-entry',
  ];
  for(const slug of advancedPrograms){
    const id=academicRoutes.academicProgramRecordIds[slug];
    assert.ok(id,`Advanced Computing route ${slug} has a programme record ID`);
    assert.equal(academicRoutes.academicProgramRoutes[slug],slug,`Advanced Computing route ${slug} keeps its clean route identity`);
    assert.equal(academicRoutes.academicCanonicalPrograms[id],slug,`Advanced Computing record ${id} resolves to ${slug}`);
  }
  const otherBlocks=layout(other);
  assert(!otherBlocks.some(block=>block.kind==='other-programs'),'There is no duplicate standalone specialization section');
  const otherGroup=otherBlocks.find(block=>block.kind==='tabs'&&block.sections.some(section=>section.title==='Eligibility Criteria'));
  assert(otherGroup.sections.some(section=>section.title==='Other Specializations'),'Other Specializations shares the lower admission tabs');
  assert(!otherGroup.sections.find(section=>section.title==='Other Specializations').html.includes('API Finance'),'Card links are not also repeated as plain links');
  const routePolicy=load('components/academic-clean-routes');
  assert.equal(routePolicy.academicHref('program','dgu-global-mba',97),base+'/programs/dgu-global-mba/');
  assert.equal(routePolicy.academicHref('program','dgu-global-mba',33),base+'/programs/dgu-global-mba/');
  assert.equal(programs.apiProgramHref('https://dgu.ac.in/dgu-global-mba'),base+'/programs/dgu-global-mba/');
  assert.equal(routePolicy.academicPathIdentity('program',base+'/programs/global-mba/').recordId,'33','The legacy alias requests the live API record');
  assert.equal(routePolicy.academicPathIdentity('program',base+'/programs/dgu-global-mba/').recordId,'33');
  assert.equal(routePolicy.academicPathIdentity('program',base+'/programs/global-mba-97/').recordId,'');
  const shared=academic.parseAcademicInfo({error:'0',data:[{id:26,url:'mba-human-resource',programName:'API HR',
    tabs:[{tabName:'Salient Features',tabDetails:'<p>Full API feature detail.</p>'},{tabName:'Program Structure',tabDetails:'<p>API semester content.</p>'}],
    accordion:[{accordionName:'Career Opportunities',accordionDetails:'<p>API career content.</p>'},{accordionName:'Scholarship',accordionDetails:'<p>API scholarship content.</p>'}],
    banners:[{imageURL:'https://dgu.ac.in/desktop.webp',mobileImageURL:'https://dgu.ac.in/mobile-one.webp'},{imageURL:'https://dgu.ac.in/desktop.webp',mobileImageURL:'https://dgu.ac.in/mobile-two.webp'}],
    linkedPages:[{title:'Published lab',url:'modern-computer-labs',html:'<section id="mac-lab"><p>API lab detail.</p></section>'}]}]},'program','mba-human-resource','26');
  const blocks=load('components/academic-layout').academicLayout(shared),key=load('components/academic-section-key').academicSectionKey;
  for(const title of ['Career Opportunities','Scholarship','Program Structure'])assert.ok(blocks.some(b=>b.kind==='tabs'&&b.sections.some(s=>s.title===title)),title+' uses common tabs');
  assert.ok(blocks.some(b=>b.kind==='section'&&b.sections.some(s=>key(s.title)==='features')),'An old CMS feature tab uses the common feature UI');
  assert.equal(shared.banners.length,2,'Distinct API mobile variants are retained');assert.equal(shared.linkedPages.length,1);
  const computingFeatures=count=>layout({...shared,slug:'btech',schoolUrl:'school-of-technology',pathways:[],sections:[],accordions:[],tabs:[{
    title:'Industry-Aligned Curriculum',html:`<ul>${Array.from({length:count},(_,i)=>`<li>API feature ${i+1}</li>`).join('')}</ul>`,
  }]});
  assert.ok(computingFeatures(6).some(block=>block.kind==='section'&&block.sections.some(section=>key(section.title)==='industry-aligned-curriculum')),
    'Six Advanced Computing feature items use the wave section');
  assert.ok(computingFeatures(7).some(block=>block.kind==='tabs'&&block.sections.some(section=>key(section.title)==='industry-aligned-curriculum')),
    'More than six Advanced Computing feature items use tabs');
  const programFeatures=count=>layout({...shared,slug:'generic-test-program',schoolUrl:'',pathways:[],sections:[],accordions:[],tabs:[{
    title:'Salient Features',html:`<ul>${Array.from({length:count},(_,i)=>`<li>API feature ${i+1}</li>`).join('')}</ul>`,
  }]});
  assert.ok(programFeatures(7).some(block=>block.kind==='section'&&block.sections.some(section=>key(section.title)==='features')),
    'Non-Advanced-Computing programme features retain the existing wave section');
  const optionsInfo={...shared,slug:'mba-digital-marketing',id:'24',programOptions:[
    {title:'API option one',html:'<p>Option one detail.</p>'},
    {title:'API option two',html:'<ul><li>Option two detail.</li></ul>'},
    {title:'API option three',html:'<p>Option three detail.</p>'},
  ]};
  const optionBlocks=layout(optionsInfo);
  assert.equal(optionBlocks[0].kind,'tabs');assert.equal(optionBlocks[0].title,'Program Options');
  assert.deepEqual(Array.from(optionBlocks[0].sections,section=>section.title),['API option one','API option two','API option three'],'Program Options preserve API order and all records');

  const international={...shared,slug:'mba-international-business',id:'28',pathways:[],sections:[
    {title:'Core Program Focus',html:'<ul><li>API focus item</li></ul>'},
  ],tabs:[
    {title:'Program Structure',html:'<h3>Semester 1</h3><table><tr><td>API subject</td></tr></table>'},
    {title:'Eligibility Criteria',html:'<ul><li>API eligibility item</li></ul>'},
    {title:'Career Opportunities',html:'<p>API career detail.</p>'},
  ],accordions:[],programOptions:[]};
  const internationalBlocks=layout(international);
  assert.ok(internationalBlocks.some(block=>block.kind==='section'&&block.sections.some(section=>section.title==='Core Program Focus')),'International Core Program Focus remains a dedicated section');
  const internationalTabs=internationalBlocks.find(block=>block.kind==='tabs');
  assert(internationalTabs,'International admission tabs remain present');
  assert.deepEqual(Array.from(internationalTabs.sections,section=>section.title),['Program Structure','Eligibility Criteria','Career Opportunities'],'International tabs preserve order and Career Opportunities');

  const agri={...shared,slug:'mba-agri-business',id:'',pathways:[],sections:[],tabs:[
    {title:'Program Structure',html:'<h3>Semester 1</h3><table><tr><td>API subject</td></tr></table>'},
  ],accordions:[],programOptions:[]};
  const agriTabs=layout(agri).find(block=>block.kind==='tabs');
  assert(agriTabs&&agriTabs.sections.some(section=>section.title==='Program Structure'),'Agri Program Structure uses the shared academic tab path');
  const agriCombined=tabContent.academicSingleAccordionSection({intro:'',sections:[
    {title:'Programme Duration: 2 Years (4 Semesters) | Strong MBA Core + Agribusiness Specialisation',html:'<table><tr><td>Semester content</td></tr></table>'},
    {title:'AI Integration MBA Agribusiness',html:'<table><tr><td>AI content</td></tr></table>'},
  ]});
  assert(agriCombined,'Agri Program Structure creates one combined accordion item');
  assert.equal(agriCombined.title,'Programme Duration: 2 Years (4 Semesters) | Strong MBA Core + Agribusiness Specialisation / AI Integration MBA Agribusiness');
  assert(agriCombined.html.indexOf('Semester content')<agriCombined.html.indexOf('AI content'),'Agri combined accordion preserves API content order');
  const renderer=fs.readFileSync(path.resolve('components/AcademicApiPage.tsx'),'utf8');
  assert.match(renderer,/function CareerAccordionContent\(\{ html, id \}/,'MBA Agribusiness career content uses its dedicated API section parser');
  assert.match(renderer,/<CareerAccordionContent html=\{section\.html\} id=\{`\$\{id\}-\$\{i\}-career`\} \/>/,'MBA Agribusiness career content remains in its existing accordion renderer');
  assert.match(renderer,/academic-tab-content/,'Academic tab content remains the shared rendering path');
  assert.equal(academic.parseAcademicInfo({error:'0',data:[{id:97,url:'dgu-global-mba',programName:'API Global MBA'}]},'program','dgu-global-mba','97').banner,'','A missing banner does not acquire a static fallback');
  const globalLayout=layout({...shared,slug:'dgu-global-mba',id:'33',tabs:[
    {title:'Learn Across Borders',html:'<p>API global learning.</p>'},
    {title:'Fee Structure for Global MBA 2026-28',html:'<p>API fees.</p>'},
    {title:'Where This MBA Can Take You',html:'<p>API global career outcomes.</p>'},
  ],sections:[{title:'Why Choose Global MBA at DBS?',html:'<p>API global difference.</p>'}],accordions:[
    {title:'A Learning Experience That Goes Beyond Classrooms',html:'<p>API experience.</p>'},
    {title:'Build a Truly Global Mindset',html:'<p>API mindset.</p>'},
  ],pathways:[],programOptions:[]});
  const globalAccordion=globalLayout.find(block=>block.kind==='accordion');
  assert(globalAccordion&&globalAccordion.sections.some(section=>section.title==='Where This MBA Can Take You'),'Global MBA career content remains in its intended accordion group');
  assert(!globalLayout.some(block=>block.kind==='tabs'&&block.sections.some(section=>section.title==='Where This MBA Can Take You')),'Global MBA career content is not moved into admission tabs');
  const globalStudents=academic.parseAcademicInfo({error:'0',data:[{id:33,url:'dgu-global-mba',programName:'API Global MBA',students:[{id:1,name:'API student',placementType:'course',linkID:33,imageURL:'https://dgu.ac.in/uploads/images/placement/student.webp'}]}]},'program','dgu-global-mba','33');
  assert.ok(load('components/academic-layout').academicLayout(globalStudents).some(b=>b.kind==='placements'),'Related students remain visible when a legacy guide omits its placements heading');
  const published=academic.parseAcademicInfo({error:'0',data:[{id:97,url:'dgu-global-mba',programName:'API Global MBA',programDetails:'<p>Legacy body.</p>',tabs:[{tabName:'Fee Structure',tabDetails:'<p>Legacy fees.</p>'}],publishedPage:{id:91,url:'dgu-global-mba',title:'Global MBA',html:'<h2>Learn Across Borders</h2><p>Current published CMS content.</p>'}}]},'program','dgu-global-mba','97');
  assert.ok(published.intro.includes('Current published CMS content.'));assert.ok(!published.intro.includes('Legacy body.'));assert.equal(published.tabs.length,0,'Published URL content does not mix with legacy programme tabs');
  assert.throws(()=>academic.parseAcademicInfo(payload,'program','bba','92'),/different page/);
  assert.throws(()=>academic.parseAcademicInfo(payload,'program','bcom','6'),/different program record/);
  await Promise.all([academic.requestAcademicInfo('program','bcom','92'),academic.requestAcademicInfo('program','bcom','92')]);
  assert.equal(calls.length,1,'The restored programme endpoint shares one in-flight request');
  assert.deepEqual(calls[0].body,{PROGRAM_URL:'bcom'},'Only the documented PROGRAM_URL is sent');
  assert.equal(calls[0].url,'https://dgu.ac.in/api/get-program-info.php');
  const slugOnlyBcom=await academic.requestAcademicInfo('program','bcom');
  assert.equal(slugOnlyBcom.slug,'bcom');
  assert.deepEqual(calls.at(-1).body,{PROGRAM_URL:'bcom'},'The B.Com alias can request its supported slug without an obsolete record ID');
  await assert.rejects(academic.requestAcademicInfo('program','bcom','6'), /different program record/);
  assert.equal(calls.length,3,'A duplicate URL never displays the wrong record ID');
  await Promise.all([academic.requestAcademicInfo('school','school-of-law'),academic.requestAcademicInfo('school','school-of-law')]);
  assert.equal(calls.length,4,'School sections still share one in-flight POST');
  assert.equal(calls[0].options.headers.Apikey,'academic-test-key');
  assert.deepEqual(calls.at(-1).body,{SCHOOL_URL:'school-of-law'});
  assert.equal(calls.at(-1).url,'https://dgu.ac.in/api/get-school-info.php');
  failNext=true;
  await assert.rejects(academic.requestAcademicInfo('school','school-of-retry'),/404 HTML/);
  await academic.requestAcademicInfo('school','school-of-retry');assert.equal(calls.length,6,'Active school failures remain retryable');
  await assert.rejects(academic.requestAcademicInfo('program','../bad'),/valid page/);
  await assert.rejects(academic.requestAcademicInfo('program','bcom','1 OR 1=1'),/valid program ID/);
  await assert.rejects(academic.requestAcademicInfo('program','bcom','9007199254740993'),/valid program ID/);
  const loadedSeo=await seo.loadProgrammeSeoMetadata('bcom','92');
  assert.equal(loadedSeo.title,'API metadata title');
  assert.deepEqual(calls.at(-1).body,{PROGRAM_URL:'bcom'},'SEO metadata preserves the programme endpoint POST contract');
  assert.equal(calls.at(-1).options.method,'POST');
  assert.equal(calls.at(-1).options.headers.Apikey,'academic-test-key');
  assert.equal(calls.at(-1).url,'https://dgu.ac.in/api/get-program-info.php');
  console.log('PASS: API contracts, route-scoped SEO, academic semester table boundaries and fallback safety, API-only rendering, cache separation and recovery.');
})().catch(error=>{console.error(error);process.exitCode=1});
