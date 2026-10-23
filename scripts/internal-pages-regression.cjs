// Stored-content presentation must not omit copy, links, tables, embeds or images.
const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2023}}).outputText,file);
const pages=require('../components/local-pages-data.json');
const {localProgramSlug}=require('../components/local-program-data.ts');
const {isAdmissionDetailSlug}=require('../components/admissions-routes.ts');
const {internalContentLayout,contentText}=require('../components/internal-content-layout.ts');
const {internalHeroContent}=require('../components/internal-page-presentation.ts');
const reserved=new Set(['dgu-at-glance','hostel-life','office-of-international-affairs','placement-reports','students-clubs-and-committees']);
const eligible=pages.filter(page=>!localProgramSlug(page)&&!(page.kind==='profile'&&page.group==='Faculty')&&!reserved.has(page.slug)&&!page.slug.endsWith('-club')&&!isAdmissionDetailSlug(page.slug));
const attrs=(html,tag,attribute)=>Array.from(html.matchAll(new RegExp('<'+tag+'\\b[^>]*\\b'+attribute+'=["\']([^"\']+)["\']','gi')),match=>match[1]);
let count=0;
for(const page of eligible.filter(page=>page.html)){
  const presentation=internalHeroContent(page),layout=internalContentLayout(presentation.html,page.slug);
  const output=[...layout.intro,...layout.sections.flatMap(section=>section.blocks)].map(block=>block.html+(block.images||[]).join('')).join('\n');
  assert.equal(contentText(output).replace(/\s/g,''),contentText(page.html).replace(/\s/g,''),page.slug+': full text');
  for(const [tag,attribute] of [['a','href'],['iframe','src'],['video','src']])assert.deepEqual(attrs(output,tag,attribute),attrs(page.html,tag,attribute),page.slug+': '+tag);
  const moved=[presentation.image,presentation.portrait].filter(Boolean).map(image=>image.src);
  assert.deepEqual([...attrs(output,'img','src'),...moved].sort(),attrs(page.html,'img','src').sort(),page.slug+': media');
  assert.equal((output.match(/<(?:td|th)\b/gi)||[]).length,(page.html.match(/<(?:td|th)\b/gi)||[]).length,page.slug+': table cells');
  count++;
}
const labs=pages.find(page=>page.slug==='modern-computer-labs');
const labLayout=internalContentLayout(labs.html,labs.slug);
assert.equal(labLayout.mode,'tabs');assert.equal(labLayout.sections.length,9);assert.equal(labLayout.sections[0].blocks[0].images.length,3);
const fees=pages.find(page=>page.slug==='doon-business-school-fee-structure');
assert.equal(internalContentLayout(fees.html,fees.slug).mode,'accordion');
assert.equal(internalContentLayout(pages.find(page=>page.slug==='governance').html,'governance').mode,'reading');
assert.equal(internalContentLayout('<div>Complete <strong>inline</strong> copy.</div>','example').intro[0].html,'<div>Complete <strong>inline</strong> copy.</div>');
assert.equal(contentText('Research &amp; Innovation &#8212; DGU'),'Research & Innovation — DGU');
assert.equal(internalContentLayout('','').sections.length,0);
console.log(`PASS: ${eligible.length} internal routes; ${count} complete stored HTML bodies; full text, links, embeds, tables and media preserved. Labs, fees, reading and inline-copy layouts verified.`);
