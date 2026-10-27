const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), ts = require('typescript');
const storage = new Map();

function runtime({ slug = 'cache-test-program', recordId = '92', storageAvailable = true, mode = 'valid', name = 'API programme' } = {}) {
  const modules = new Map(), calls = [];
  let responseMode = mode, responseName = name, storageEnabled = storageAvailable;
  const storageApi = {
    getItem(key) {
      if (!storageEnabled) throw new Error('Storage unavailable');
      return storage.get(key) ?? null;
    },
    setItem(key, value) {
      if (!storageEnabled) throw new Error('Storage unavailable');
      storage.set(key, String(value));
    },
    removeItem(key) {
      if (!storageEnabled) throw new Error('Storage unavailable');
      storage.delete(key);
    },
  };
  const window = {};
  Object.defineProperty(window, 'localStorage', { get() {
    if (!storageEnabled) throw new Error('Storage unavailable');
    return storageApi;
  } });

  function load(filename) {
    const file = path.resolve(filename.endsWith('.ts') ? filename : `${filename}.ts`);
    if (modules.has(file)) return modules.get(file).exports;
    const module = { exports: {} };
    modules.set(file, module);
    const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    vm.runInNewContext(output, {
      module, exports: module.exports, URL, AbortController, Response, Date, Promise, Map, Set, Object, Array, String, Number, RegExp, Error,
      window, process: { env: { NODE_ENV: 'production', NEXT_PUBLIC_DGU_MENU_API_KEY: 'academic-cache-test-key' } },
      setTimeout(callback, delay) {
        if (responseMode === 'timeout' && delay === 20000) {
          queueMicrotask(callback);
          return 0;
        }
        return setTimeout(callback, delay);
      },
      clearTimeout,
      fetch: async (_url, options) => {
        const body = JSON.parse(options.body);
        calls.push(body);
        if (responseMode === 'network-error') throw new Error('Simulated network failure');
        if (responseMode === 'timeout') return new Promise((resolve, reject) => {
          options.signal.addEventListener('abort', () => reject(new Error('Request aborted')), { once: true });
        });
        if (responseMode === 'invalid-json') return new Response('<html>not JSON</html>', { status: 200 });
        if (responseMode === 'empty') return new Response(JSON.stringify({ error: '0', data: [] }), { status: 200 });
        if (responseMode === 'mismatch') return new Response(JSON.stringify({ error: '0', data: [{
          id: '93', url: body.PROGRAM_URL, programName: 'Wrong programme', introText: '<p>Wrong content</p>',
        }] }), { status: 200 });
        return new Response(JSON.stringify({ error: '0', data: [{
          id: recordId, url: body.PROGRAM_URL, programName: responseName, introText: `<p>${responseName} content</p>`,
        }] }), { status: 200 });
      },
      require: name => {
        if (name === 'react') return react;
        return load(path.resolve(path.dirname(file), name));
      },
    });
    return module.exports;
  }

  const slots = [];
  let cursor = 0, scheduled = [];
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, update => {
        slots[index].value = typeof update === 'function' ? update(slots[index].value) : update;
      }];
    },
    useEffect(effect, dependencies) {
      const index = cursor++, previous = slots[index];
      const changed = !previous || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]));
      if (changed) {
        slots[index] = { dependencies, cleanup: previous?.cleanup };
        scheduled.push({ index, effect });
      }
    },
  };

  return {
    load, calls, slug, recordId,
    setMode(value) { responseMode = value; },
    setName(value) { responseName = value; },
    setStorageAvailable(value) { storageEnabled = value; },
    async renderHook() {
      cursor = 0;
      scheduled = [];
      const hook = load('components/useAcademicInfo');
      hook.default('program', slug, recordId);
      for (const item of scheduled) {
        slots[item.index].cleanup?.();
        slots[item.index].cleanup = item.effect();
      }
      await new Promise(resolve => setTimeout(resolve, 0));
      cursor = 0;
      const next = hook.default('program', slug, recordId);
      return next;
    },
    async retry(result) {
      result.retry();
      return this.renderHook();
    },
  };
}

async function settle(runtimeInstance) {
  let result = await runtimeInstance.renderHook();
  await new Promise(resolve => setTimeout(resolve, 0));
  result = await runtimeInstance.renderHook();
  return result;
}

function cacheKey(slug, id) {
  return `dgu:academic-info:v1:program:${encodeURIComponent(slug)}:${id || 'none'}`;
}

(async () => {
  storage.clear();

  const first = runtime();
  const firstApi = first.load('components/academic-page-api');
  const saved = await firstApi.requestAcademicInfo('program', first.slug, first.recordId);
  assert.equal(saved.name, 'API programme');
  assert.equal(firstApi.readCachedAcademicInfo('program', first.slug, first.recordId).name, 'API programme',
    'A validated successful response is stored for the programme identity');
  const storedValue = storage.get(cacheKey(first.slug, first.recordId));

  const reloaded = runtime({ mode: 'network-error' });
  const restored = await settle(reloaded);
  assert.equal(restored.info?.name, 'API programme', 'Persisted data is available immediately after a runtime reload');
  assert.equal(restored.loading, false);
  assert.equal(restored.error, false);

  for (const failure of ['timeout', 'invalid-json', 'empty', 'mismatch']) {
    const failedRefresh = runtime({ mode: failure });
    const retained = await settle(failedRefresh);
    assert.equal(retained.info?.name, 'API programme', `${failure} keeps the last valid content visible`);
    assert.equal(storage.get(cacheKey(failedRefresh.slug, failedRefresh.recordId)), storedValue,
      `${failure} does not replace the valid stored response`);
  }

  const retrying = runtime({ mode: 'network-error' });
  const prior = await settle(retrying);
  retrying.setMode('valid');
  retrying.setName('Updated API programme');
  await retrying.retry(prior);
  const afterRetry = await settle(retrying);
  assert.equal(afterRetry.info?.name, 'Updated API programme', 'A successful retry replaces the cached content');
  assert.equal(retrying.load('components/academic-page-api').readCachedAcademicInfo('program', retrying.slug, retrying.recordId).name,
    'Updated API programme');

  const wrongSlug = firstApi.readCachedAcademicInfo('program', 'another-programme', first.recordId);
  const wrongRecord = firstApi.readCachedAcademicInfo('program', first.slug, '93');
  assert.equal(wrongSlug, null, 'A different slug cannot read this programme cache entry');
  assert.equal(wrongRecord, null, 'A different record ID cannot read this programme cache entry');

  const mismatchedKey = cacheKey('another-programme', first.recordId);
  storage.set(mismatchedKey, storedValue);
  assert.equal(firstApi.readCachedAcademicInfo('program', 'another-programme', first.recordId), null,
    'An entry copied under another slug is rejected');
  assert.equal(storage.has(mismatchedKey), false, 'Mismatched cache entries are discarded');
  const mismatchedRecordKey = cacheKey(first.slug, '93');
  storage.set(mismatchedRecordKey, storedValue);
  assert.equal(firstApi.readCachedAcademicInfo('program', first.slug, '93'), null,
    'An entry copied under another record ID is rejected');
  assert.equal(storage.has(mismatchedRecordKey), false, 'Mismatched record entries are discarded');

  const malformedKey = cacheKey('malformed-cache-program', '92');
  storage.set(malformedKey, JSON.stringify({ version: 1, kind: 'program', slug: 'malformed-cache-program', recordId: '92', info: { kind: 'program' } }));
  assert.equal(firstApi.readCachedAcademicInfo('program', 'malformed-cache-program', '92'), null,
    'Malformed cache data is ignored safely');
  assert.equal(storage.has(malformedKey), false, 'Malformed cache data is discarded');

  const unavailableStorage = runtime({ storageAvailable: false });
  const live = await settle(unavailableStorage);
  assert.equal(live.info?.name, 'API programme', 'Unavailable browser storage does not block live API content');

  const noCache = runtime({ slug: 'no-cached-program', mode: 'network-error' });
  let failed = await settle(noCache);
  assert.equal(failed.info, null);
  assert.equal(failed.error, true, 'Without cached data, the existing retry error state remains');
  assert.equal(failed.loading, false);
  noCache.setMode('valid');
  failed = await noCache.retry(failed);
  const recovered = await settle(noCache);
  assert.equal(recovered.info?.name, 'API programme', 'Retry without a cache recovers normally');
  assert.equal(recovered.error, false);

  console.log('PASS: programme persistence, identity validation, stale-content recovery, timeout/invalid-response retention, retry, and unavailable-storage scenarios.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
