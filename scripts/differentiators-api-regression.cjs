// Contract fixtures are confined to this test; homepage content comes from the API.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), ts = require('typescript');
function environment(nodeEnv = 'production') {
  const modules = new Map(), calls = [], env = { NODE_ENV: nodeEnv, NEXT_PUBLIC_DGU_MENU_API_KEY: 'test-only-key' };
  let mode = 'html';
  const fixture = { error: '0', data: { title: 'Published section title', points: [
    { id: 4, title: 'Published heading', description: '<p>Published &amp; complete description</p>', url: 'https://dgu.ac.in/office-of-international-affairs' },
  ] } };
  function load(name) {
    const file = path.resolve(name.endsWith('.ts') ? name : name + '.ts');
    if (modules.has(file)) return modules.get(file);
    const module = { exports: {} }; modules.set(file, module.exports);
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
      module, exports: module.exports, URL, AbortController, Date, setTimeout, clearTimeout, process: { env },
      require: name => load(path.resolve(path.dirname(file), name)),
      fetch: async (url, options) => {
        calls.push({ url, options });
        if (mode === 'html') return new Response('<title>404 Page Not Found</title>');
        if (mode === 'http') return new Response('Unavailable', { status: 503 });
        return new Response(JSON.stringify(fixture));
      },
    });
    return module.exports;
  }
  return { api: load('components/differentiators-api'), transport: load('components/dgu-api-transport'), calls, env, fixture, mode: value => { mode = value; } };
}
(async () => {
  const test = environment(), api = test.api;
  assert.throws(() => api.parseDifferentiators({ error: '1', data: {} }), /error/);
  assert.throws(() => api.parseDifferentiators({ error: '0', data: [] }), /missing/);
  assert.throws(() => api.parseDifferentiators({ error: '0', data: { points: [] } }), /title/);
  const empty = api.parseDifferentiators({ error: '0', data: { title: 'Published title' } });
  assert.equal(empty.points.length, 0, 'no manual points when CMS fields are absent');
  const parsed = api.parseDifferentiators(test.fixture);
  assert.equal(parsed.points[0].id, 4);
  assert.equal(parsed.points[0].description, 'Published & complete description');
  assert.equal(parsed.points[0].href, 'https://dgu.ac.in/office-of-international-affairs');
  const invalid = api.parseDifferentiators({ data: { title: 'Published title', points: [
    ...test.fixture.data.points, ...test.fixture.data.points,
    { id: 7, title: 'Out of range', url: '/out' },
    { id: 3, title: 'Unsafe link', url: 'javascript:alert(1)' },
    { id: 2, title: '', url: '/missing-title' },
    { id: 1, title: 'Missing URL' },
  ] } });
  assert.equal(invalid.points.length, 1, 'stable IDs, unique records, real titles and safe API links required');
  await assert.rejects(api.requestDifferentiators(), /404 HTML/);
  test.mode('http'); await assert.rejects(api.requestDifferentiators(), /HTTP 503/);
  test.mode('ok');
  const [first, second] = await Promise.all([api.requestDifferentiators(), api.requestDifferentiators()]);
  assert.equal(first, second); assert.equal(test.calls.length, 3, 'errors are not cached; concurrent retries share one POST');
  await api.requestDifferentiators(); assert.equal(test.calls.length, 3, 'successful data has a short cache');
  const call = test.calls.at(-1);
  assert.equal(call.url, 'https://dgu.ac.in/api/get-differentiators.php');
  assert.equal(call.options.method, 'POST'); assert.equal(call.options.body, '{}');
  assert.equal(call.options.headers.Apikey, 'test-only-key');
  assert.equal(call.options.headers['Content-Type'], 'application/json');
  const dev = environment('development'); dev.mode('ok'); await dev.api.requestDifferentiators();
  assert.equal(dev.calls[0].url, '/api/dgu-differentiators/');
  const local = environment(); local.mode('ok'); local.env.NEXT_PUBLIC_DGU_API_BASE_URL = 'http://127.0.0.1:8080/api';
  await local.api.requestDifferentiators(); assert.equal(local.calls[0].url, 'http://127.0.0.1:8080/api/get-differentiators.php');
  const missingKey = environment(); delete missingKey.env.NEXT_PUBLIC_DGU_MENU_API_KEY;
  await assert.rejects(missingKey.api.requestDifferentiators(), /key/); assert.equal(missingKey.calls.length, 0);
  console.log('PASS: differentiators API-only content, exact API links, stable IDs, safe URLs, POST/key/body, development/production/local endpoints, invalid response, retry and shared cache.');
})().catch(error => { console.error(error); process.exitCode = 1; });
