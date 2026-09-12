const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const ts = require('typescript');
const { createHmac } = require('node:crypto');
function cargar(file, dependencies = {}) {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function('require', 'module', 'exports', source)(name => dependencies[name] ?? require(name), module, module.exports);
  return module.exports;
}
const session = cargar('lib/sesion.ts');
test('la sesión rechaza firmas falsas, caducadas y fechas no numéricas', () => {
  const secret = 'test-only-password';
  const good = session.crearSesion(secret);
  assert.equal(session.sesionValida(good, secret), true);
  for (const bad of [undefined, '', good + '.extra', good.replace(/.$/, '!'), 'NaN.' + createHmac('sha256', secret).update('NaN').digest('base64url'), '1.' + createHmac('sha256', secret).update('1').digest('base64url')]) {
    assert.equal(session.sesionValida(bad, secret), false);
  }
  assert.equal(session.sesionValida(good, undefined), false);
  assert.equal(session.sesionValida(good, 'other-password'), false);
});
test('el acceso a datos exige sesión y origen válido y no expone claves ni rutas arbitrarias', async () => {
  const before = { ...process.env };
  const originalFetch = global.fetch;
  process.env.ROOMFLOW_ACCESS_PASSWORD = 'test-only-password';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-server-key';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  let calls = [];
  global.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response('[]', { headers: { 'content-type': 'application/json', 'content-range': '0-0/1' } });
  };
  const route = cargar('app/api/datos/[...ruta]/route.ts', { 'next/server': {}, '@/lib/sesion': session });
  const invoke = (segments, options = {}) => {
    const req = new Request('https://roomflow.example/api/datos/' + segments.join('/') + '?select=id', { method: options.method || 'GET', headers: options.headers });
    req.nextUrl = new URL(req.url);
    req.cookies = { get: () => options.anonymous ? undefined : { value: session.crearSesion(process.env.ROOMFLOW_ACCESS_PASSWORD) } };
    return route.GET(req, { params: Promise.resolve({ ruta: segments }) });
  };
  try {
    assert.equal((await invoke(['rest', 'v1', 'inquilinos'], { anonymous: true })).status, 401);
    assert.equal((await invoke(['rest', 'v1', 'inquilinos'], { headers: { origin: 'https://attacker.example' } })).status, 403);
    for (const parts of [['auth', 'v1', 'admin'], ['rest', 'v1', 'integracion_onedrive'], ['rest', 'v1', 'rpc', 'unknown'], ['storage', 'v1', 'object', 'sign', 'other-bucket', 'x'], ['rest', 'v1', '..']]) {
      assert.equal((await invoke(parts)).status, 403);
    }
    assert.equal(calls.length, 0);
    const result = await invoke(['rest', 'v1', 'inquilinos'], { headers: { authorization: 'Bearer attacker', 'accept-profile': 'auth' } });
    assert.equal(result.status, 200);
    assert.equal(result.headers.get('cache-control'), 'private, no-store');
    assert.equal(result.headers.get('content-range'), '0-0/1');
    assert.equal(calls[0].url, 'https://example.supabase.co/rest/v1/inquilinos?select=id');
    assert.equal(calls[0].init.headers.get('authorization'), 'Bearer test-server-key');
    assert.equal(calls[0].init.headers.get('accept-profile'), 'public');
    assert.equal(calls[0].init.redirect, 'error');
    assert.equal((await invoke(['rest', 'v1', 'rpc', 'roomflow_eliminar_cobro'], { method: 'POST' })).status, 200);
    assert.equal((await invoke(['storage', 'v1', 'object', 'sign', 'documentos-inquilinos', 'id', 'doc.pdf'], { method: 'POST' })).status, 200);
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    assert.equal((await invoke(['rest', 'v1', 'inquilinos'])).status, 503);
  } finally {
    global.fetch = originalFetch;
    for (const key of ['ROOMFLOW_ACCESS_PASSWORD', 'SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_SUPABASE_URL']) {
      if (before[key] === undefined) delete process.env[key]; else process.env[key] = before[key];
    }
  }
});
