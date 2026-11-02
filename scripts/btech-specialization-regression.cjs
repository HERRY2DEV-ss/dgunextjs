const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');

const modules = new Map();
function load(filename) {
  const file = path.resolve(filename.endsWith('.ts') ? filename : `${filename}.ts`);
  if (modules.has(file)) return modules.get(file).exports;
  const module = { exports: {} };
  modules.set(file, module);
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(output, {
    module, exports: module.exports, URL, URLSearchParams, AbortController, Date, Promise, Map, Set,
    Object, Array, String, Number, RegExp, Error, setTimeout, clearTimeout, fetch,
    process: { env: { NODE_ENV: 'production' } },
    require: name => name === 'server-only' ? {} : load(path.resolve(path.dirname(file), name)),
  });
  return module.exports;
}

const { academicPathIdentity } = load('components/academic-clean-routes');
const { parseAcademicInfo } = load('components/academic-page-api');
const { academicLayout } = load('components/academic-layout');
const { apiPlain } = load('components/dgu-content-api');
const identity = academicPathIdentity('program', '/programs/btech/');
assert.deepEqual(JSON.parse(JSON.stringify(identity)), { slug: 'btech', recordId: '88' });

const specializations = [
  { id: 102, programName: 'B.Tech CSE (Lateral Entry)', url: 'btech-cse-lateral-entry' },
  { id: 14, programName: 'B.Tech CSE in AI & ML with Minor', url: 'btech-cse-with-spe-in-ai-and-ml-with-minor' },
  { id: 89, programName: 'B.Tech CSE in Quantum Computing with Minor', url: 'btech-cse-in-quantum-computing-with-minor' },
  { id: 13, programName: 'B.Tech CSE with Minor', url: 'btech-cse-with-minor' },
  { id: 34, programName: 'B.Tech in Computer Science and Engineering (CSE) with Dual Specialization in AI&ML - HCLTech', url: 'btech-cse-with-spe-in-ai-and-ml-hcl' },
  { id: 35, programName: 'B.Tech in Computer Science and Engineering (CSE) with Dual Specialization in Cyber Security - HCLTech', url: 'btech-cse-with-spe-in-cyber-security-hcl' },
  { id: 36, programName: 'B.Tech in Computer Science and Engineering (CSE) with Dual Specialization in Data Science - HCLTech', url: 'btech-cse-with-spe-in-data-science-hcl' },
];
const btech = parseAcademicInfo({ error: '0', data: [{
  id: 88, url: 'btech', programName: 'B.Tech CSE', introText: 'API introduction',
  specialization: specializations,
  programTabs: [{
    tabName: 'Program specification', tabDetails: '<p>API specification text stays.</p>',
    programs: [...specializations, specializations[4], specializations[5], specializations[6],
      { id: 15, programName: 'Unrelated API programme', url: 'bca-with-specialization' }],
  }, { tabName: 'Industry Collaboration', tabDetails: '<p>API collaboration stays.</p>' }],
  accordion: [
    { accordionName: 'B.Tech CSE (Lateral Entry)', accordionDetails: '<a href="/btech-cse-lateral-entry">B.Tech CSE (Lateral Entry)</a>' },
    { accordionName: 'B.Tech in Computer Science and Engineering (CSE)', accordionDetails: '<a href="/btech-cse-with-spe-in-ai-and-ml-hcl">B.Tech in Computer Science and Engineering (CSE)</a>' },
    { accordionName: 'Unrelated API accordion', accordionDetails: '<p>Unrelated API accordion content.</p>' },
  ],
}] }, 'program', identity.slug, identity.recordId);

assert.equal(btech.id, '88', 'The selected parent API record is ID 88');
assert.equal(btech.relatedPrograms.length, specializations.length, 'All API specializations render once as cards');
assert.deepEqual(Array.from(btech.relatedPrograms, program => program.name), specializations.map(program => program.programName));
assert.deepEqual(Array.from(btech.relatedPrograms, program => program.href), specializations.map(program => `/programs/${program.url}/`));
assert.ok(btech.relatedPrograms.every(program => program.href), 'Every specialization card uses its API programme URL');
const blocks = academicLayout(btech);
assert.ok(blocks.some(block => block.kind === 'specializations'), 'Cards stay in the existing Program Specialization section');
assert.equal(blocks[0].sections[0].title, 'Industry Collaboration', 'The B.Tech collaboration block follows the introduction');
assert.equal(blocks[1].kind, 'specializations', 'Industry Collaboration now precedes Program Specialization');

const specification = btech.tabs.find(section => section.title.trim().toLowerCase() === 'program specification');
assert.ok(specification, 'The existing Program specification tab remains');
assert.match(apiPlain(specification.html), /API specification text stays\./);
assert.match(specification.html, /Unrelated API programme/, 'Unrelated API programme links in the tab are retained');
for (const program of specializations) {
  assert.ok(!apiPlain(specification.html).includes(program.programName),
    `The duplicate ${program.programName} entry is removed from below Program Specialization`);
}
assert.deepEqual(Array.from(btech.accordions, section => section.title), ['Unrelated API accordion'],
  'Only the named B.Tech CSE accordions are removed');

for (const program of [
  { id: 88, url: 'btech', name: 'B.Tech CSE' },
  { id: 102, url: 'btech-cse-lateral-entry', name: 'B.Tech CSE (Lateral Entry)' },
  { id: 14, url: 'btech-cse-with-spe-in-ai-and-ml-with-minor', name: 'B.Tech CSE in AI & ML with Minor' },
  { id: 89, url: 'btech-cse-in-quantum-computing-with-minor', name: 'B.Tech CSE in Quantum Computing with Minor' },
  { id: 13, url: 'btech-cse-with-minor', name: 'B.Tech CSE with Minor' },
  { id: 34, url: 'btech-cse-with-spe-in-ai-and-ml-hcl', name: 'B.Tech CSE in AI & ML - HCLTech' },
  { id: 35, url: 'btech-cse-with-spe-in-cyber-security-hcl', name: 'B.Tech CSE in Cyber Security - HCLTech' },
  { id: 36, url: 'btech-cse-with-spe-in-data-science-hcl', name: 'B.Tech CSE in Data Science - HCLTech' },
]) {
  const info = parseAcademicInfo({ error: '0', data: [{
    id: program.id, url: program.url, programName: program.name,
    areaHeading2: 'Industry Collaboration', areaDetails2: '<p>API collaboration stays.</p>',
  }] }, 'program', program.url, String(program.id));
  const pageBlocks = academicLayout(info);
  assert.equal(pageBlocks[0]?.sections[0]?.title, 'Industry Collaboration',
    `${program.name} collaboration follows the introduction`);
  assert.equal(pageBlocks.flatMap(block => block.sections).filter(section => section.title === 'Industry Collaboration').length, 1,
    `${program.name} collaboration remains a single API section`);
}

const specializationPage = parseAcademicInfo({ error: '0', data: [{
  id: 13, url: 'btech-cse-with-minor', programName: 'B.Tech CSE with Minor',
  accordion: [{ accordionName: 'B.Tech CSE (Lateral Entry)', accordionDetails: '<p>API accordion remains.</p>' }],
}] }, 'program', 'btech-cse-with-minor', '13');
assert.equal(specializationPage.accordions.length, 1, 'Individual B.Tech specialization accordions remain unchanged');

for (const program of [
  { id: 92, url: 'bcom', programName: 'B.Com', title: 'B.Com course details' },
  { id: 10, url: 'mba', programName: 'MBA', title: 'MBA course details' },
]) {
  const info = parseAcademicInfo({ error: '0', data: [{
    id: program.id, url: program.url, programName: program.programName,
    accordion: [{ accordionName: program.title, accordionDetails: '<p>API content remains.</p>' }],
  }] }, 'program', program.url, String(program.id));
  assert.deepEqual(Array.from(info.accordions, section => section.title), [program.title],
    `${program.programName} accordions remain unchanged`);
}

console.log('PASS: B.Tech API links render once in Program Specialization; child and unrelated programme accordions are preserved.');
