// Contract fixtures are test-only. No snapshot is shipped to the Admissions UI.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const calls=[],loaded=new Map();let mode='html';
const env={NODE_ENV:'production',NEXT_PUBLIC_DGU_MENU_API_KEY:'contract-test-key'};
function load(name){
 const file=path.resolve(/\.(ts|json)$/.test(name)?name:name+'.ts');if(loaded.has(file))return loaded.get(file);
 if(file.endsWith('.json')){const data=JSON.parse(fs.readFileSync(file,'utf8'));loaded.set(file,data);return data;}
 const module={exports:{}};loaded.set(file,module.exports);
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{
  module,exports:module.exports,URL,AbortController,Date,setTimeout,clearTimeout,process:{env},require:n=>load(path.resolve(path.dirname(file),n)),
  fetch:async(url,options)=>{calls.push({url,options});return mode==='html'?new Response('<title>404 Page Not Found</title>'):
   new Response(JSON.stringify({error:'0',data:{page:{title:'Published admission title',bannerImage:'https://dgu.ac.in/assets/addmission_banner.webp'},process:{title:'Published process',html:'<p>Published process content</p>',url:'admission-process'},fees:{title:'Published fees',html:'<table><tr><td>Published fee</td></tr></table>',url:'programs-fee-structures'},resources:[],media:{stats:[]}}}));},
 });return module.exports;
}
(async()=>{
 const api=load('components/admissions-api');
 assert.throws(()=>api.parseAdmissions({error:'0',data:[]}),/missing/);
 assert.throws(()=>api.parseAdmissions({error:'0',data:{page:{}}}),/title/);
 const missing=api.parseAdmissions({error:'0',data:{page:{title:'Published admission title'}}});
 for(const key of ['banner','intro','viewBookUrl','recruiterTitle'])assert.equal(missing[key],'');
 for(const key of ['schools','feeSchools','resources','recruiters','details'])assert.equal(missing[key].length,0);
 for(const key of ['feesExtra','international','refund','commencement','placement'])assert.equal(missing[key],null);
 assert.equal(missing.media.src,'');assert.equal(missing.media.stats.length,0);
 await assert.rejects(api.requestAdmissions(),/404 HTML/);
 mode='ok';const [a,b]=await Promise.all([api.requestAdmissions(),api.requestAdmissions()]);
 assert.equal(a,b);assert.equal(calls.length,2,'failure is uncached; simultaneous retry shares one POST');
 const request=calls.at(-1);assert.equal(request.url,'https://dgu.ac.in/api/get-admissions.php');assert.equal(request.options.method,'POST');assert.equal(request.options.headers.Apikey,'contract-test-key');assert.equal(request.options.body,'{}');
 assert.equal(a.banner,'/assets/addmission_banner.webp','the verified local copy replaces the upstream HTML fallback for the admissions banner');
 assert(a.processExtra.includes('Published process content'),'unmapped content remains accessible');assert(a.feesExtra.html.includes('Published fee'),'raw fee tables are never discarded');
 const routes=load('components/admissions-routes');
 assert.equal(routes.admissionDetail(a,'admission-requirements').html,'<p>Published process content</p>','detail page retains the full API source');
 assert.equal(routes.admissionDetail(a,'programs-fee-structures').html,'<table><tr><td>Published fee</td></tr></table>');
 assert.equal(routes.admissionDetailHref(a.details[0].href),'/admission-requirements/','process Read More opens the existing detail page, not the overview anchor');
 assert.equal(routes.admissionDetail(a,'education-loan'),null,'missing content cannot fall back to the old page');
 assert.equal(routes.admissionDetailHref('https://other.example/education-loan'),'','external URLs cannot claim an existing admissions page');
 assert.equal(routes.admissionDetailHref('https://dgu.ac.in/hostel-types'),'/hostel-life/');
 assert.equal(routes.admissionDetailHref('https://dgu.ac.in/program-commencement-date'),'/program-commencement-2026/');
 const hostel=api.parseAdmissions({error:'0',data:{page:{title:'Admission'},resources:[{title:'Published hostel',html:'<p>Published hostel detail</p>',url:'hostel-types'}]}});
 assert.equal(routes.admissionDetail(hostel,'hostel-life').html,'<p>Published hostel detail</p>');
 assert.equal(routes.admissionDetail(hostel,'education-loan'),null,'resource identity comes from its URL, not its array position');
 assert.equal(a.intro,'');assert.equal(a.placement,null);assert.equal(a.recruiters.length,0);
 await api.requestAdmissions();assert.equal(calls.length,2,'success has a short cache');
 console.log('PASS: one admissions POST/key/JSON contract, API-only missing sections, preserved raw content, no fabricated media/statistics, invalid response, retry and shared cache.');
})().catch(e=>{console.error(e);process.exitCode=1});
