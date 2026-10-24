import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
const source = ts.transpileModule(readFileSync(new URL('../src/features/password-recovery/recoveryLink.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const context = { exports: {}, URL, URLSearchParams };
vm.runInNewContext(source, context);
const { parseRecoveryLink, recoveryUrlFromRouteHash, validateNewPassword } = context.exports;
test('web and native recovery links accept both required tokens', () => {
  for (const base of ['http://localhost:8081/reset-password', 'divmorada://reset-password']) {
    const result = parseRecoveryLink(`${base}#type=recovery&access_token=fake-access&refresh_token=fake-refresh`);
    assert.equal(result.access_token, 'fake-access');
    assert.equal(result.refresh_token, 'fake-refresh');
  }
});
test('ordinary sessions, missing tokens and expired links cannot open password form', () => {
  for (const hash of ['', '#type=signup&access_token=x&refresh_token=y', '#type=recovery&access_token=x', '#error=access_denied&error_code=otp_expired']) assert.throws(() => parseRecoveryLink(`http://localhost:8081/reset-password${hash}`));
});
test('new password requires eight characters and an exact confirmation', () => {
  assert.ok(validateNewPassword('1234567', '1234567'));
  assert.ok(validateNewPassword('abcdefgh', 'abcdefgH'));
  assert.equal(validateNewPassword('abcdefgh', 'abcdefgh'), '');
});
test('fallback route fragments are parsed when available', () => {
  const url = recoveryUrlFromRouteHash('access_token=fake-access&refresh_token=fake-refresh&type=recovery');
  assert.equal(parseRecoveryLink(url).access_token, 'fake-access');
  assert.equal(parseRecoveryLink(url).refresh_token, 'fake-refresh');
  assert.equal(recoveryUrlFromRouteHash(undefined), null);
  assert.equal(recoveryUrlFromRouteHash(['ambiguous', 'hash']), null);
  assert.throws(() => parseRecoveryLink(recoveryUrlFromRouteHash('type=signup&access_token=x&refresh_token=y')));
});
