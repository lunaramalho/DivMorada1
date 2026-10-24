import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync(new URL('../src/components/appAlert.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function setup(os, answer = true) {
  const calls = [];
  const context = { exports: {}, require: () => ({ Platform: { OS: os }, Alert: { alert: (...args) => calls.push(['native', ...args]) } }), window: { alert: text => calls.push(['alert', text]), confirm: text => { calls.push(['confirm', text]); return answer; } } };
  vm.runInNewContext(source, context);
  return { alert: context.exports.appAlert.alert, calls };
}

test('web messages display and run navigation callback after acknowledgement', () => {
  const { alert, calls } = setup('web');
  alert('Sucesso', 'Casa criada', [{ text: 'OK', onPress: () => calls.push(['navigate']) }]);
  assert.deepEqual(calls, [['alert', 'Sucesso\n\nCasa criada'], ['navigate']]);
});

test('web cancellation never executes a destructive action', () => {
  const { alert, calls } = setup('web', false);
  alert('Remover', 'Confirmar?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Remover', onPress: () => calls.push(['remove']) }]);
  assert.deepEqual(calls, [['confirm', 'Remover\n\nConfirmar?']]);
});

test('web confirmation executes logout exactly once', () => {
  const { alert, calls } = setup('web');
  alert('Sair', 'Deseja sair?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', onPress: () => calls.push(['logout']) }]);
  assert.deepEqual(calls, [['confirm', 'Sair\n\nDeseja sair?'], ['logout']]);
});

test('mobile preserves native buttons and options', () => {
  const { alert, calls } = setup('android');
  const buttons = [{ text: 'OK', onPress() {} }], options = { cancelable: false };
  alert('Título', 'Mensagem', buttons, options);
  assert.deepEqual(calls, [['native', 'Título', 'Mensagem', buttons, options]]);
});
