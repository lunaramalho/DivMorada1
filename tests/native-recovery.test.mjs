import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
function load(relative, imports = {}) {
  const code = ts.transpileModule(readFileSync(new URL(relative, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {}, URL, URLSearchParams, Date, require: name => imports[name] };
  vm.runInNewContext(code, context);
  return context.exports;
}
const parser = load('../src/features/password-recovery/recoveryLink.ts');
const recovery = load('../src/features/password-recovery/nativeRecovery.ts', { './recoveryLink': parser });
const link = 'exps://test.on.expo.app/--/reset-password#type=recovery&access_token=fake-access&refresh_token=fake-refresh';
test('native intent captures tokens before Router drops fragment; route contains no secrets', () => {
  const route = recovery.captureNativeRecovery(link, 1000);
  assert.match(route, /^\/reset-password\?recoveryAttempt=\d+$/);
  assert.ok(!route.includes('token'));
  assert.equal(parser.parseRecoveryLink(recovery.takeNativeRecovery(2000)).access_token, 'fake-access');
  assert.equal(recovery.takeNativeRecovery(2000), null);
});
test('a second link updates an already-open screen through a distinct attempt id', () => {
  const first = recovery.captureNativeRecovery(link, 1000);
  const second = recovery.captureNativeRecovery(link, 2000);
  assert.notEqual(first, second);
  assert.equal(recovery.takeNativeRecovery(3000), link);
});
test('invalid links cannot reuse a previous pending link; in-memory links expire', () => {
  recovery.captureNativeRecovery(link, 1000);
  assert.equal(recovery.captureNativeRecovery('divmorada://reset-password#error=access_denied', 2000), '/reset-password');
  assert.equal(recovery.takeNativeRecovery(3000), null);
  recovery.captureNativeRecovery(link, 1000);
  assert.equal(recovery.takeNativeRecovery(302000), null);
  assert.equal(recovery.captureNativeRecovery('divmorada://profile', 2000), null);
});
