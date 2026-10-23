// Contract checks only; live PHP availability is checked separately.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), ts = require('typescript');
const modules = new Map(), calls = [];
let failNext = false;
const env = { NODE_ENV:'production', NEXT_PUBLIC_DGU_MENU_API_KEY:'academic-test-key' };
function load(filename) {
  const file = path.resolve(filename.endsWith('.ts') ? filename : filename+'.ts');
  if (modules.has(file)) return modules.get(file);
  const module = {exports:{}};modules.set(file,module.exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{
    module,exports:module.exports,URL,AbortController,Date,setTimeout,clearTimeout,process:{env},
    require:name=>load(path.resolve(path.dirname(file),name)),
    fetch:async (url,options)=>{
      const body=JSON.parse(options.body);calls.push({url,options,body});
      if(failNext){failNext=false;return new Response('<title>404 Page Not Found</title>',{status:200});}
      const school=!!body.SCHOOL_URL;
      return new Response(JSON.stringify({error:'0',data:[{id:body.PROGRAM_URL ? 92 : 1,url:body.PROGRAM_URL||body.SCHOOL_URL,
        [school?'schoolName':'programName']:'API name',introText:'API introduction'}]}),{status:200});
    },
  });
  return module.exports;
}
(async()=>{
  const programs=load('components/programs-api'),academic=load('components/academic-page-api');
  const base='/nextjs/homev1';
  assert.equal(programs.apiProgramHref('mba',10),base+'/programs/mba/');
  assert.equal(programs.apiProgramHref('school-of-business'),base+'/schools/business/');
  const unknown=programs.apiProgramHref('new-published-course',123);
  assert.equal(unknown,base+'/programs/new-published-course/123/');
  assert.equal(load('components/site-routes').resolveSiteHref(unknown),unknown,'clean routing must survive ProgramCard');
  const routes=load('components/academic-clean-routes');
  assert.equal(programs.apiProgramHref('bcom',6),base+'/programs/bcom/');
  assert.equal(programs.apiProgramHref('bcom',92),base+'/programs/bcom-92/');
  assert.deepEqual(JSON.parse(JSON.stringify(routes.academicPathIdentity('program',base+'/programs/bcom-92/'))),{slug:'bcom',recordId:'92'});
  assert.equal(load('components/site-routes').resolveSiteHref('https://dgu.ac.in/nextjs/homev1/programs/mba-human-resource/?slug=mba-human-resource&id=26'),base+'/programs/mba-human-resource/');
  assert.equal(load('components/site-routes').resolveSiteHref('https://dgu.ac.in/nextjs/homev1/programs/mba/?slug=mba-human-resource&id=26'),base+'/programs/mba/');
  assert.equal(load('components/site-routes').resolveSiteHref('https://dgu.ac.in/nextjs/homev1/programs/mba/?id=26'),base+'/programs/mba/');
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
  const otherBlocks=load('components/academic-layout').academicLayout(other);
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
  assert.equal(routePolicy.academicPathIdentity('program',base+'/programs/global-mba-97/').recordId,'97');
  const shared=academic.parseAcademicInfo({error:'0',data:[{id:26,url:'mba-human-resource',programName:'API HR',
    tabs:[{tabName:'Salient Features',tabDetails:'<p>Full API feature detail.</p>'},{tabName:'Program Structure',tabDetails:'<p>API semester content.</p>'}],
    accordion:[{accordionName:'Career Opportunities',accordionDetails:'<p>API career content.</p>'},{accordionName:'Scholarship',accordionDetails:'<p>API scholarship content.</p>'}],
    banners:[{imageURL:'https://dgu.ac.in/desktop.webp',mobileImageURL:'https://dgu.ac.in/mobile-one.webp'},{imageURL:'https://dgu.ac.in/desktop.webp',mobileImageURL:'https://dgu.ac.in/mobile-two.webp'}],
    linkedPages:[{title:'Published lab',url:'modern-computer-labs',html:'<section id="mac-lab"><p>API lab detail.</p></section>'}]}]},'program','mba-human-resource','26');
  const blocks=load('components/academic-layout').academicLayout(shared),key=load('components/academic-section-key').academicSectionKey;
  for(const title of ['Career Opportunities','Scholarship','Program Structure'])assert.ok(blocks.some(b=>b.kind==='tabs'&&b.sections.some(s=>s.title===title)),title+' uses common tabs');
  assert.ok(blocks.some(b=>b.kind==='section'&&b.sections.some(s=>key(s.title)==='features')),'An old CMS feature tab uses the common feature UI');
  assert.equal(shared.banners.length,2,'Distinct API mobile variants are retained');assert.equal(shared.linkedPages.length,1);
  assert.equal(academic.parseAcademicInfo({error:'0',data:[{id:97,url:'dgu-global-mba',programName:'API Global MBA'}]},'program','dgu-global-mba','97').banner,'','A missing banner does not acquire a static fallback');
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
  await assert.rejects(academic.requestAcademicInfo('program','bcom','6'), /different program record/);
  assert.equal(calls.length,2,'A duplicate URL never displays the wrong record ID');
  await Promise.all([academic.requestAcademicInfo('school','school-of-law'),academic.requestAcademicInfo('school','school-of-law')]);
  assert.equal(calls.length,3,'School sections still share one in-flight POST');
  assert.equal(calls[0].options.headers.Apikey,'academic-test-key');
  assert.deepEqual(calls.at(-1).body,{SCHOOL_URL:'school-of-law'});
  assert.equal(calls.at(-1).url,'https://dgu.ac.in/api/get-school-info.php');
  failNext=true;
  await assert.rejects(academic.requestAcademicInfo('school','school-of-retry'),/404 HTML/);
  await academic.requestAcademicInfo('school','school-of-retry');assert.equal(calls.length,5,'Active school failures remain retryable');
  await assert.rejects(academic.requestAcademicInfo('program','../bad'),/valid page/);
  await assert.rejects(academic.requestAcademicInfo('program','bcom','1 OR 1=1'),/valid program ID/);
  await assert.rejects(academic.requestAcademicInfo('program','bcom','9007199254740993'),/valid program ID/);
  console.log('PASS: shared school/program API contracts, exact URL + record ID, future routes, API-only partial sections, duplicate handling, cache separation and recovery.');
})().catch(error=>{console.error(error);process.exitCode=1});
