import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync(new URL('../src/features/debts/installments.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const context = { exports: {} };
vm.runInNewContext(source, context);
const { installmentPlan, dateFromInput } = context.exports;
const plain = value => JSON.parse(JSON.stringify(value));

test('distributes cents to first installments and preserves the exact total for all counts', () => {
  assert.deepEqual(plain(installmentPlan('100.00', 3, '2096-01-31')).map(p => p.valor), [33.34, 33.33, 33.33]);
  for (const cents of [2, 11, 12, 99, 100, 10000, 99999999]) {
    for (let count = 2; count <= Math.min(12, cents); count++) {
      const plan = installmentPlan(cents / 100, count, '2096-01-31');
      assert.equal(plan.reduce((sum, p) => sum + Math.round(p.valor * 100), 0), cents);
      assert.ok(plan.every(p => p.valor >= 0.01));
      assert.ok(Math.max(...plan.map(p => Math.round(p.valor * 100))) - Math.min(...plan.map(p => Math.round(p.valor * 100))) <= 1);
    }
  }
});

test('monthly calendar clamps missing days without drifting in following months', () => {
  assert.deepEqual(plain(installmentPlan(100, 3, '2096-01-31')).map(p => p.vencimento), ['2096-01-31', '2096-02-29', '2096-03-31']);
  assert.deepEqual(plain(installmentPlan(100, 3, '2095-01-31')).map(p => p.vencimento), ['2095-01-31', '2095-02-28', '2095-03-31']);
  assert.deepEqual(plain(installmentPlan(10, 2, '2095-12-30')).map(p => p.vencimento), ['2095-12-30', '2096-01-30']);
});

test('rejects invalid dates and installment amounts/counts', () => {
  for (const date of ['31/02/2096', '29/02/2095', '01/13/2096', '1/1/2096']) assert.equal(dateFromInput(date), null);
  assert.equal(dateFromInput('29/02/2096'), '2096-02-29');
  for (const count of [0, 1, 13, 2.5, NaN]) assert.throws(() => installmentPlan(100, count, '2096-01-31'));
  for (const value of [0, -1, 0.01, 'invalid']) assert.throws(() => installmentPlan(value, 2, '2096-01-31'));
  assert.throws(() => installmentPlan(100, 2, '2096-02-31'));
});
