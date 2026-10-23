const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript');
const modules=new Map();
function load(file){file=path.resolve(file.endsWith('.ts')?file:file+'.ts');if(modules.has(file))return modules.get(file);const module={exports:{}};modules.set(file,module.exports);vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module,exports:module.exports,URL,process:{env:{NODE_ENV:'production'}},require:name=>load(path.resolve(path.dirname(file),name))});return module.exports;}
const urls=load('components/news-urls'),routes=load('components/site-routes');
const slug='vikshit-bharat-lecture',clean='/nextjs/homev1/news/'+slug+'/';
for(const value of [slug,'https://dgu.ac.in/'+slug,'/news/'+slug,clean,'https://dgu.ac.in'+clean,'/nextjs/homev1/news/?url='+slug]){
 assert.equal(urls.newsSlug(value),slug,value);assert.equal(urls.newsDetailHref(value),clean,value);
}
for(const invalid of ['https://evil.example/'+slug,'https://user:secret@dgu.ac.in/'+slug,'javascript:alert(1)','/news/../secret','/news/%2e%2e/secret','/news/a/b','/news/a.jpg','/nextjs/homev1/news/?url=../secret','%',''])assert.equal(urls.newsSlug(invalid),'',invalid);
assert.equal(routes.resolveSiteHref(clean),clean);assert.equal(routes.resolveSiteHref('/nextjs/homev1/news/?url='+slug),clean);
assert.equal(routes.resolveSiteHref('/nextjs/homev1/news/?filter=admissions'),'/nextjs/homev1/news/?filter=admissions');
const slugs=load('components/news-route-slugs').newsRouteSlugs;assert(slugs.includes(slug));assert.equal(new Set(slugs).size,slugs.length);for(const item of slugs)assert.equal(urls.newsSlug(item),item);
console.log('PASS: clean/legacy/news link resolution, export identities, invalid host/path rejection and archive filter preservation.');
