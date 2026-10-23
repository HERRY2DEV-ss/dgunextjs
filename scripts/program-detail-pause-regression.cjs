// Historical filename: now verifies the restored developer integration and cleanup safety.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),os=require('node:os');
const assert=require('node:assert/strict'),ts=require('typescript'),{execFileSync}=require('node:child_process');
async function check(mode){
  const modules=new Map(),calls=[];
  function load(filename){
    const file=path.resolve(filename);if(modules.has(file))return modules.get(file);
    const module={exports:{}};modules.set(file,module.exports);
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{
      module,exports:module.exports,URL,AbortController,Date,setTimeout,clearTimeout,
      process:{env:{NODE_ENV:mode,NEXT_PUBLIC_DGU_MENU_API_KEY:'test-key',NEXT_PUBLIC_DGU_PROGRAM_INFO_API_URL:'https://dgu.ac.in/api/get-program-info.php',NEXT_PUBLIC_DGU_PROGRAM_INFO_API_KEY:'old-key'}},
      require:name=>load(path.resolve(path.dirname(file),name+'.ts')),
      fetch:async(url,options)=>{
        calls.push({url,options});const body=JSON.parse(options.body);
        const program=body.PROGRAM_URL;
        const record=program ? {id:{mba:10,'ba-llb':59,'mba-human-resource':26,'new-course':200}[program] || 97,programName:'API Programme',introText:'<p>Current programme content</p>'}
          : {id:1,url:body.SCHOOL_URL,schoolName:'API School',details:'<p>Current school content</p>'};
        return new Response(JSON.stringify({error:'0',data:[record]}));
      },
    });return module.exports;
  }
  assert.equal(load('components/program-detail-policy.ts').PROGRAM_DETAILS_ENABLED,true);
  const academic=load('components/academic-page-api.ts'),legacy=load('components/program-info-api.ts'),content=load('components/dgu-content-api.ts');
  for(const [slug,id]of [['mba','10'],['ba-llb','59'],['mba-human-resource','26'],['new-course','200']]){
    assert.equal((await academic.requestAcademicInfo('program',slug,id)).id,id);
    const call=calls.at(-1);
    assert.deepEqual(JSON.parse(call.options.body),{PROGRAM_URL:slug});
    assert.equal(call.url,mode==='development'?'/nextjs/homev1/api/dgu-program-info/':'https://dgu.ac.in/api/get-program-info.php');
    await legacy.requestProgramInfo(slug);
    await content.postContent('program',{PROGRAM_URL:slug});
  }
  const beforeSchool=calls.length;
  const school=await academic.requestAcademicInfo('school','school-of-law');
  assert.equal(school.name,'API School');assert.equal(calls.length,beforeSchool+1);
  const call=calls.at(-1);
  assert.deepEqual(JSON.parse(call.options.body),{SCHOOL_URL:'school-of-law'});
  assert.equal(call.options.headers.Apikey,'test-key','School keeps its shared key');
  assert.equal(call.url,mode==='development'?'/nextjs/homev1/api/dgu-school-info/':'https://dgu.ac.in/api/get-school-info.php');
}
function removal(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'dgu-program-cleanup-'));
  try{
    fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({dependencies:{next:'16.3.3'}}));
    const folder=path.join(root,'server-api','api');fs.mkdirSync(folder,{recursive:true});
    const live=path.join(root,'api');fs.mkdirSync(live);fs.writeFileSync(path.join(live,'get-program-info.php'),'Developer endpoint');
    fs.writeFileSync(path.join(folder,'get-school-info.php'),'Keep school endpoint');
    for(const [file,mode]of [['get-program-info.php','program'],['get-programs.php','programs']]){
      fs.writeFileSync(path.join(folder,file),"<?php\nrequire __DIR__ . '/dgu-academic-common.php';\ndgu_dispatch('"+mode+"');\n");
    }
    const script=path.resolve('scripts/remove-custom-program-api.cjs');
    execFileSync(process.execPath,[script],{cwd:root,stdio:'pipe'});
    assert(!fs.existsSync(path.join(folder,'get-program-info.php')));assert(!fs.existsSync(path.join(folder,'get-programs.php')));
    assert(fs.existsSync(path.join(folder,'get-school-info.php')));assert(fs.existsSync(path.join(live,'get-program-info.php')));
    fs.writeFileSync(path.join(folder,'get-program-info.php'),'<?php // Developer file; preserve this.');
    execFileSync(process.execPath,[script],{cwd:root,stdio:'pipe'});
    assert(fs.existsSync(path.join(folder,'get-program-info.php')),'Differently authored PHP is never removed');
  }finally{fs.rmSync(root,{recursive:true,force:true});}
}
(async()=>{await check('production');await check('development');removal();console.log('PASS: restored programme transports use PROGRAM_URL, school fetching is unchanged, and cleanup only deletes our two project wrappers.');})().catch(error=>{console.error(error);process.exitCode=1;});
