// Client transport checks; these do not certify the live PHP server.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const source = fs.readFileSync('components/dgu-api-transport.ts', 'utf8');
const feeds = { menus:'get-menus.php', programs:'get-programs.php', 'program-info':'get-program-info.php', faculty:'get-faculty.php', reviews:'get-reviews.php', news:'get-news.php', footer:'get-footer.php', homepage:'next-homepage-data.php' };
function load(env) {
  const module = { exports:{} };
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module,exports:module.exports,process:{env},URL});
  return module.exports;
}
(async()=>{
  const original = load({NODE_ENV:'production'});
  const local = load({NODE_ENV:'production',NEXT_PUBLIC_DGU_API_BASE_URL:'http://127.0.0.1:8001/'});
  const dev = load({NODE_ENV:'development',NEXT_PUBLIC_DGU_API_BASE_URL:'http://127.0.0.1:8001'});
  let checks = 0;
  for(const [feed,file] of Object.entries(feeds)) {
    assert.equal(original.clientDguApiUrl(feed),'https://dgu.ac.in/api/'+file);checks++;
    assert.equal(local.clientDguApiUrl(feed),'http://127.0.0.1:8001/'+file);checks++;
    assert.equal(dev.clientDguApiUrl(feed),'/nextjs/homev1/api/dgu-'+feed+'/');checks++;
  }
  assert.equal(local.liveDguApiUrl('menus','https://dgu.ac.in/api/get-menus.php'),'http://127.0.0.1:8001/get-menus.php');checks++;
  assert.equal(local.liveDguApiUrl('reviews','https://dgu.ac.in/api/custom-reviews.php'),'https://dgu.ac.in/api/custom-reviews.php');checks++;
  for(const target of ['http://remote.example/api','https://user:password@example.test/api','javascript:alert(1)','/relative']) {
    assert.throws(()=>load({NEXT_PUBLIC_DGU_API_BASE_URL:target}).liveDguApiUrl('programs'));checks++;
  }
  const good = await original.readDguApiJson(new Response('{"error":0,"data":[{"programName":"Law"}]}',{headers:{'Content-Type':'text/html'}}));
  assert.equal(good.data[0].programName,'Law');checks++;
  const bom = await original.readDguApiJson(new Response('\uFEFF{"error":0,"data":[]}'));
  assert.equal(bom.error,0);checks++;
  await assert.rejects(original.readDguApiJson(new Response('<!DOCTYPE html><title>404 – Page Not Found | DBS Global University</title>',{status:200})),error=>error.reason==='endpoint-missing' && error.httpStatus===200);checks++;
  await assert.rejects(original.readDguApiJson(new Response('<html>Unexpected website response</html>',{status:200})),error=>error.reason==='invalid-json');checks++;
  await assert.rejects(original.readDguApiJson(new Response('not allowed',{status:401})),error=>error.reason==='http' && error.httpStatus===401);checks++;
  for (const file of ['components/SchoolPage.tsx','components/ProgramPage.tsx']) {
    const source=fs.readFileSync(path.resolve(file),'utf8');
    assert(source.includes('AcademicApiPage')&&!source.includes('academic-reference-data'),file+' must use the shared API-only renderer');checks++;
  }
  for (const file of ['app/programs/[programSlug]/page.tsx','app/schools/[schoolSlug]/page.tsx']) {
    const source=fs.readFileSync(path.resolve(file),'utf8');assert(source.includes('AcademicQueryPage')&&!source.includes('programPages')&&!source.includes('schoolPages'));checks++;
  }
  console.log(`PASS: ${checks} recovery checks; original/local/dev endpoints, real Response JSON/404/401 handling and common API-only school/program routes.`);

})().catch(error=>{console.error(error);process.exitCode=1});
