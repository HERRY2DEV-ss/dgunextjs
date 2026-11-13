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
const { relatedSpecializations, specializationParent, mergeOtherSpecializations } = load('components/academic-specializations');
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
    tabName: 'Advantage @DGU', tabDetails: '<p>API student features stay.</p>',
  }, {
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
const advantageBlock = blocks.find(block => block.kind === 'tabs' && block.sections.some(section => section.title === 'Advantage @DGU'));
assert.ok(advantageBlock?.featureCollaborations?.some(section => section.title === 'Industry Collaboration'),
  'B.Tech parent page places industry collaboration inside Advantage @DGU student features');
assert.equal(blocks.flatMap(block => block.sections).filter(section => section.title === 'Industry Collaboration').length, 0,
  'B.Tech parent page does not render a duplicate standalone collaboration section');

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
assert.deepEqual(JSON.parse(JSON.stringify(specializationParent(specializationPage))), { slug: 'btech', id: '88' },
  'B.Tech specializations resolve to their explicit parent programme');
assert.equal(academicLayout(specializationPage).find(block => block.kind === 'tabs').sections.at(-1).title, 'Other Specializations',
  'The tab is present while related parent links are loading');
const siblingSpecializations = relatedSpecializations(btech.relatedPrograms, specializationPage);
assert.equal(siblingSpecializations.length, specializations.length - 1, 'A specialization page receives every sibling except itself');
assert.ok(siblingSpecializations.every(program => program.id !== specializationPage.id), 'The current specialization is excluded');
const specializationTabs = academicLayout({ ...specializationPage, otherPrograms: siblingSpecializations })
  .find(block => block.kind === 'tabs');
assert.equal(specializationTabs.sections.at(-1).title, 'Other Specializations', 'Sibling cards render in the last tab');
assert.deepEqual(Array.from(mergeOtherSpecializations([...btech.relatedPrograms], siblingSpecializations, specializationPage), program => program.id),
  Array.from(siblingSpecializations, program => program.id), 'Direct and parent lists deduplicate and exclude the current programme');
const collaborationPage = parseAcademicInfo({ error: '0', data: [{
  id: 102, url: 'btech-cse-lateral-entry', programName: 'B.Tech CSE Lateral Entry',
  areaHeading2: 'Salient Features', areaDetails2: '<ul><li>API feature point</li></ul>',
  areaHeading3: 'Industry Collaboration', areaDetails3: '<h3>Powered by</h3><p>API partner content</p>',
}] }, 'program', 'btech-cse-lateral-entry', '102');
const collaborationBlocks = academicLayout(collaborationPage);
const featureBlock = collaborationBlocks.find(block => block.sections.some(section => section.title === 'Salient Features'));
assert.ok(featureBlock?.featureCollaborations?.some(section => section.title === 'Industry Collaboration'),
  'B.Tech Lateral Entry places industry collaboration inside Salient Features');
assert.ok(!collaborationBlocks.some(block => block.kind === 'industry' || block.sections.some(section => section.title === 'Industry Collaboration')),
  'B.Tech Lateral Entry no longer renders a separate industry collaboration accordion');
for (const [id, slug, parentSlug, parentId] of [
  ['26', 'mba-human-resource', 'mba', '10'],
  ['18', 'bba-specialization-digital-marketing', 'bba', '2'],
  ['8', 'bcom-ukacca', 'bcom', '6'],
]) {
  assert.deepEqual(JSON.parse(JSON.stringify(specializationParent({ kind: 'program', id, slug }))), { slug: parentSlug, id: parentId },
    `${slug} resolves only to its matching parent programme`);
}
assert.deepEqual(Array.from(relatedSpecializations([{ id: '14', name: 'Unrelated', href: '/programs/other/' }], specializationPage)), [],
  'A parent list that does not contain the open page is not treated as its sibling set');

const bcaPage = parseAcademicInfo({ error: '0', data: [{
  id: 15, url: 'bca-with-specialization', programName: 'BCA with Dual Specialization',
  introText: 'API programme overview.',
  programMoreInfoHeading: 'Program Overview', programMoreInfo: '<p>Program overview details.</p>',
  areaHeading2: 'Why Choose BCA with Dual Specialization?', areaDetails2: '<ul><li>API feature.</li></ul>',
  areaHeading3: 'Industry Collaboration', areaDetails3: '<p>API industry content.</p>',
  tabs: [
    { tabName: 'Advantage @DGU', tabDetails: '<p>API advantage.</p>' },
    { tabName: 'Fee Structure', tabDetails: '<p>API fees.</p>' },
    { tabName: 'Career Opportunities', tabDetails: '<p>API career opportunities.</p>' },
  ],
}] }, 'program', 'bca-with-specialization', '15');
assert.match(bcaPage.intro, /<h2>Program Overview<\/h2><p>Program overview details\.<\/p>/,
  'BCA Program Overview is placed in the intro content');
assert.equal(bcaPage.sections.some(section => section.title === 'Program Overview'), false,
  'BCA Program Overview is not also rendered as a separate section');
const bcaBlocks = academicLayout(bcaPage);
const bcaIndustryIndex = bcaBlocks.findIndex(block => block.sections.some(section => section.title === 'Industry Collaboration'));
const bcaTabsIndex = bcaBlocks.findIndex(block => block.kind === 'tabs');
const bcaPlacementsIndex = bcaBlocks.findIndex(block => block.kind === 'placements');
const bcaTabs = bcaBlocks.find(block => block.kind === 'tabs');
assert.ok(bcaTabs?.sections.some(section => section.title === 'Career Opportunities'),
  'BCA Career Opportunities appears alongside its other programme tabs');
assert.equal(bcaBlocks.some(block => block.kind === 'section' && block.sections.some(section => section.title === 'Career Opportunities')), false,
  'BCA Career Opportunities is no longer a separate section');
assert.ok(bcaIndustryIndex > bcaTabsIndex && bcaIndustryIndex < bcaPlacementsIndex,
  'BCA Industry Collaboration follows the feature/admission content and appears before Placements');
assert.deepEqual(JSON.parse(JSON.stringify(bcaBlocks.slice(bcaPlacementsIndex).map(block => block.kind))),
  ['placements', 'international', 'news', 'faqs'],
  'BCA Placements and every section after it retain their order');
assert.equal(bcaBlocks.flatMap(block => block.sections).filter(section => section.title === 'Industry Collaboration').length, 1,
  'BCA industry content is moved without duplication or loss');

const bcaGroupedBlocks = academicLayout({
  ...bcaPage,
  intro: '',
  sections: [
    { title: 'Choose Any Two Specializations. Build Future-Ready Technology Careers.', html: '<p>Choose two specialties.</p>' },
    { title: 'One Degree + Any Two Specializations + Industry Certifications', html: '<p>Degree overview.</p>' },
    { title: 'A Degree Built for Where the Jobs Are Going', html: '<p>Career-led curriculum.</p>' },
    { title: 'Example Career Combinations', html: '<p>Career combinations.</p>' },
    { title: 'Why Choose BCA with Dual Specialization?', html: '<ul><li>Feature.</li></ul>' },
    { title: 'Program Overview', html: '<p>Program overview.</p>' },
    { title: 'Choose Any Two Specializations', html: '<p>Specialization choices.</p>' },
    { title: 'Dual Specialization + Certification Advantage', html: '<p>Certification details.</p>' },
    { title: 'Learn Through Projects and Internships', html: '<p>Project details.</p>' },
    { title: 'Industry Collaboration', html: '<p>Industry details.</p>' },
  ],
  tabs: [{ title: 'Career Opportunities', html: '<p>Career opportunities.</p>' }],
  pathways: [],
  accordions: [],
});
const bcaGroupedTitles = bcaGroupedBlocks
  .filter(block => block.kind !== 'placements')
  .flatMap(block => block.sections.map(section => section.title));
assert.deepEqual(
  JSON.parse(JSON.stringify(bcaGroupedTitles.slice(0, 10))),
  [
    'Choose Any Two Specializations. Build Future-Ready Technology Careers.',
    'One Degree + Any Two Specializations + Industry Certifications',
    'A Degree Built for Where the Jobs Are Going',
    'Example Career Combinations',
    'Why Choose BCA with Dual Specialization?',
    'Program Overview',
    'Choose Any Two Specializations',
    'Dual Specialization + Certification Advantage',
    'Learn Through Projects and Internships',
    'Career Opportunities',
  ],
  'BCA content follows the reference grouping before its tabs and collaboration section');

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

console.log('PASS: B.Tech specialization layout and BCA pre-placement content grouping; Placements and later sections stay unchanged.');
