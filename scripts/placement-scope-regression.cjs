// Scope checks run with the project's existing TypeScript dependency, no network.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const cache=new Map();
function load(name){const file=path.resolve(name.endsWith('.ts')?name:name+'.ts');if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module,exports:module.exports,URL,AbortController,Date,setTimeout,clearTimeout,process:{env:{NODE_ENV:'production'}},require:name=>load(path.resolve(path.dirname(file),name))});return module.exports;}
const {placementStudentMatches:matches}=load('components/academic-placements');
assert(matches('program','26',null,{placementType:'course',linkID:26}));
assert(!matches('program','26',null,{placementType:'course',linkID:10}));
assert(!matches('program','26',null,{placementType:'course',linkID:[26]}));
assert(!matches('program','26',null,{placementType:'course',linkID:'9999999999999999999'}));
assert(matches('school','1',['10','26'],{placementType:'course',linkID:26}));
assert(matches('school','1',['10'],{placementType:'school',linkID:1}));
assert(!matches('school','1',['10'],{placementType:'school',linkID:5}));
assert(!matches('school','1',['10'],{placementType:'course',linkID:44}));
assert(!matches('school','1',['10'],{placementType:'both',linkID:0}));
assert(!matches('school','1',['10'],{placementType:'course',linkID:10,status:0}));
assert(!matches('school','1',['10'],{placementType:'course',linkID:10,delete_status:1}));
assert(matches('program','26',null,{name:'Existing scoped legacy record'}));
const api=load('components/academic-page-api');
const students=Array.from({length:40},(_,i)=>({id:i+1,name:'',company:'',imageURL:'',placementType:'course',linkID:26}));
students.push({id:41,name:'Unrelated',placementType:'course',linkID:10});
const info=api.parseAcademicInfo({error:'0',data:[{id:26,url:'mba-human-resource',programName:'API programme',students}]},'program','mba-human-resource','26');
assert.equal(info.students.length,40,'No arbitrary record limit or omission for missing presentation fields');
assert(!info.students.some(student=>student.name==='Unrelated'));
assert.equal(info.sections.filter(section=>section.title==='Placements').length,0,'Students never invent a placement description');
console.log('PASS: exact course/school relations, unrelated/global/inactive/deleted/malformed exclusions, legacy compatibility, all 40 incomplete records retained and no invented placement paragraph.');
