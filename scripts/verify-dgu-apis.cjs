// Read-only live checks. Run: node scripts/verify-dgu-apis.cjs
// Reads your existing .env.local; never prints authentication values or content records.
const fs = require('node:fs');
const environment = { ...process.env };
if (fs.existsSync('.env.local')) {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && !environment[match[1]]) environment[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
const path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const loaded = new Map();
function load(file) {
  file = path.resolve(file); if (loaded.has(file)) return loaded.get(file);
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file,'utf8'));
  const module = {exports:{}}; const code = ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText;
  vm.runInNewContext(code,{module,exports:module.exports,URL,URLSearchParams,AbortController,setTimeout,clearTimeout,process:{env:environment},console,
    require:name=>name.startsWith('.')?load(path.resolve(path.dirname(file),name+(path.extname(name)?'':'.ts'))):require(name)});
  loaded.set(file,module.exports);return module.exports;
}
function normalizedData(name, json, body) {
  if(name.startsWith('academic-program-')){
    const info=load('components/academic-page-api.ts').parseAcademicInfo(json,'program',body.PROGRAM_URL);
    return{slug:info.slug,recordId:info.id,namePresent:!!info.name,metaTitle:info.metaTitle,metaDescription:info.metaDescription,metaKeywords:info.metaKeywords,metaCanonical:info.metaCanonical};
  }
  if(name.startsWith('academic-school-')){
    const info=load('components/academic-page-api.ts').parseAcademicInfo(json,'school',body.SCHOOL_URL);
    return{slug:info.slug,recordId:info.id,namePresent:!!info.name,metaTitle:info.metaTitle,metaDescription:info.metaDescription,metaKeywords:info.metaKeywords,metaCanonical:info.metaCanonical};
  }
  if(name==='reviews')return{uniqueReviews:load('components/reviews-api.ts').parseReviews(json).length};
  if(name.startsWith('programs-')){const schools=load('components/programs-api.ts').parsePrograms(json,body.SCHOOL_URL || '');return{schools:schools.length,programs:schools.reduce((sum,school)=>sum+school.programs.length,0)};}
  if(name.startsWith('program-')){const info=load('components/program-info-api.ts').parseProgramInfo(json,body.PROGRAM_URL);return{overview:!!info.overviewHtml,eligibility:!!info.eligibilityHtml,fees:!!info.feesHtml,international:!!info.internationalHtml,unmappedFields:info.unmappedFields};}
  if(name.startsWith('faculty-'))return{facultyRecords:load('components/faculty-api.ts').parseFaculty(json,body).length};
  return{};
}
const shared = environment.NEXT_PUBLIC_DGU_MENU_API_KEY;
const checks = [
  ['menus', 'get-menus.php', {}, shared], ['programs-home', 'get-programs.php', { IS_HOME: 1 }, shared],
  ['programs-computing', 'get-programs.php', { SCHOOL_URL: 'school-of-technology' }, shared],
  ['faculty-all', 'get-faculty.php', {}, environment.NEXT_PUBLIC_DGU_FACULTY_API_KEY || shared],
  ['faculty-law', 'get-faculty.php', { SCHOOL_URL: 'school-of-law' }, environment.NEXT_PUBLIC_DGU_FACULTY_API_KEY || shared],
  ['faculty-profile', 'get-faculty.php', { URL: 'mohit-aggarwal' }, environment.NEXT_PUBLIC_DGU_FACULTY_API_KEY || shared],
  ['reviews', 'get-reviews.php', {}, environment.NEXT_PUBLIC_DGU_REVIEWS_API_KEY || shared],
  ['academic-program-bcom', 'get-program-info.php', { PROGRAM_URL: 'bcom' }, environment.NEXT_PUBLIC_DGU_PROGRAM_INFO_API_KEY || shared],
  ['academic-program-bba-mba', 'get-program-info.php', { PROGRAM_URL: 'bba-mba-integrated' }, environment.NEXT_PUBLIC_DGU_PROGRAM_INFO_API_KEY || shared],
  ['academic-program-global-mba', 'get-program-info.php', { PROGRAM_URL: 'dgu-global-mba' }, environment.NEXT_PUBLIC_DGU_PROGRAM_INFO_API_KEY || shared],
  ['academic-school-business', 'get-school-info.php', { SCHOOL_URL: 'school-of-business' }, environment.NEXT_PUBLIC_DGU_MENU_API_KEY],
  ['news', 'get-news.php', { CATEGORY_ID: '3' }, shared], ['footer', 'get-footer.php', {}, shared],
];
async function check([name, path, body, key]) {
  if (!key) return { name, success: false, reason: 'API key is not configured.' };
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 20000);
  try {
    const apiBase = (environment.NEXT_PUBLIC_DGU_API_BASE_URL || 'https://dgu.ac.in/api').trim().replace(/\/+$/, '');
    const response = await fetch(apiBase + '/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'Mozilla/5.0', Apikey: key.trim() }, body: JSON.stringify(body), signal: controller.signal });
    const text = await response.text(); let json;
    try { json = JSON.parse(text.replace(/^\uFEFF/, '')); } catch { /* HTML/WAF responses are reported below. */ }
    let parsed = {};
    if(response.ok && json && String(json.error) === '0') parsed = normalizedData(name, json, body);
    const source = json?.data;
    const first = Array.isArray(source) ? source[0] : source;
    return { name, http: response.status, success: response.ok && !!json && (!('error' in json) || json.error === false || String(json.error) === '0'),
      contentType: response.headers.get('content-type'), rootFields: json && typeof json === 'object' ? Object.keys(json) : [],
      recordFields: first && typeof first === 'object' ? Object.keys(first) : [],
      recordCount: Array.isArray(source) ? source.length : undefined, normalized: parsed,
      block: !json ? (text.match(/<title[^>]*>[^<]*(?:404|page not found)[^<]*<\/title>/i) ? 'Website 404 HTML returned instead of API JSON; restore the PHP endpoint.' : text.match(/browser_signature_banned|Access denied|Error\s+1010/i)?.[0] || 'Non-JSON response') : undefined,
      rayId: response.headers.get('cf-ray') || undefined };
  } catch (error) { return { name, success: false, reason: controller.signal.aborted ? 'Timed out after 20 seconds.' : error.message }; }
  finally { clearTimeout(timer); }
}
async function checkHomepage() {
  const name = 'homepage-success';
  try {
    const endpoint = load('components/dgu-api-transport.ts').liveDguApiUrl('homepage', environment.NEXT_PUBLIC_HOMEPAGE_DATA_API);
    const response = await fetch(endpoint, { headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(20000) });
    const json = await load('components/dgu-api-transport.ts').readDguApiJson(response, 'Homepage API');
    const media = load('components/dgu-content-api.ts').apiMedia;
    const images = value => Array.isArray(value) ? new Set(value.map(media).filter(Boolean)).size : 0;
    return { name, method: 'GET', http: response.status, success: response.ok && json?.success === true,
      rootFields: json && typeof json === 'object' ? Object.keys(json) : [],
      normalized: { higherEducation: images(json.higherEducation), startupSuccess: images(json.startupSuccess) },
      rayId: response.headers.get('cf-ray') || undefined };
  } catch (error) { return { name, success: false, reason: error.message }; }
}
(async () => {
  const results = await Promise.allSettled([...checks.map(check), checkHomepage()]);
  const report = { checkedAt: new Date().toISOString(), results: results.map(result => result.status === 'fulfilled' ? result.value : { success: false, reason: String(result.reason) }) };
  console.log(JSON.stringify(report, null, 2));
  if (report.results.some(result => !result.success)) process.exitCode = 1;
})().catch(error => { console.error(error.message); process.exitCode = 1; });
