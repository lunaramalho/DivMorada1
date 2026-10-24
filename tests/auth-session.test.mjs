import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
const source = ts.transpileModule(readFileSync(new URL('../src/services/api.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function setup({ stored = true, error = null } = {}) {
  const calls = [];
  const user = { id: 'u1', nome: 'Teste', email: 'teste@example.com' };
  const house = { id: 'h1', nome: 'Casa' };
  const session = { clear: () => calls.push(['clear']), setAuth: (token, profile) => calls.push(['auth', token, profile.id]), setResidencia: value => calls.push(['house', value?.id]) };
  const supabase = {
    storage: { from: bucket => ({ upload: async (path, bytes, options) => { calls.push(['upload', bucket, path, bytes.byteLength, options.contentType]); return { error: null }; }, getPublicUrl: path => ({ data: { publicUrl: `https://storage.example.com/${path}` } }) }) },
    auth: { getSession: async () => ({ data: { session: stored ? { access_token: 'fake-token' } : null }, error: null }), getUser: async () => ({ data: { user: error ? null : user }, error }), updateUser: async payload => { calls.push(['update', payload]); return { error: null }; } },
    from: table => { const query = { select: () => query, eq: () => query, order: () => query, limit: () => query, maybeSingle: async () => ({ data: table === 'usuarios' ? user : { residencia: house }, error: null }) }; return query; },
  };
  const context = { exports: {}, process: { env: {} }, console, require: name => name === './supabase' ? { supabase } : name === './session' ? { session } : { decode: () => new Uint8Array([1, 2, 3]).buffer } };
  vm.runInNewContext(source, context);
  return { ...context.exports, calls };
}
test('reload restores user and house after validating stored authentication', async () => {
  const { authService, calls } = setup();
  await authService.restoreSession();
  assert.deepEqual(calls, [['auth', 'fake-token', 'u1'], ['house', 'h1']]);
});
test('missing or revoked sessions cannot restore private application state', async () => {
  for (const options of [{ stored: false }, { error: { status: 401 } }]) {
    const { authService, calls } = setup(options);
    await authService.restoreSession();
    assert.deepEqual(calls, [['clear']]);
  }
});
test('network failure requests retry rather than treating it as a logout', async () => {
  const { authService, calls } = setup({ error: { status: 0, message: 'Network unavailable' } });
  await assert.rejects(authService.restoreSession());
  assert.deepEqual(calls, []);
});
test('profile password change forwards current password to Supabase Auth', async () => {
  const { usuarioService, calls } = setup();
  await usuarioService.update('u1', { senha: 'new-test-password', senhaAtual: 'old-test-password' });
  assert.equal(calls[0][1].password, 'new-test-password');
  assert.equal(calls[0][1].current_password, 'old-test-password');
});
test('avatar uploads bytes and returns a durable URL rather than a local blob URI', async () => {
  const { uploadService, calls } = setup();
  const result = await uploadService.avatar({ uri: 'blob:http://localhost:8081/test', base64: 'AQID', mimeType: 'image/jpeg' });
  assert.equal(calls[0][0], 'upload');
  assert.equal(calls[0][3], 3);
  assert.equal(calls[0][4], 'image/jpeg');
  assert.match(result.url, /^https:\/\/storage.example.com\/avatares\/u1\//);
  assert.ok(!result.url.includes('blob:'));
});
