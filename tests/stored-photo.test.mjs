import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
const source = ts.transpileModule(readFileSync(new URL('../src/components/storedPhoto.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const context = { exports: {}, URL };
vm.runInNewContext(source, context);
const { storedPhotoUrl } = context.exports;
test('stored photos reject temporary browser and device-local addresses before native rendering', () => {
  for (const value of [null, '', 'blob:http://localhost:8081/test', 'file:///cache/image.jpg', 'http://localhost:8081/image.jpg', 'http://127.0.0.1/image.jpg', 'data:image/jpeg;base64,AQID']) assert.equal(storedPhotoUrl(value), null);
});
test('stored photos accept permanent public Storage addresses', () => {
  const url = 'https://example.supabase.co/storage/v1/object/public/comprovantes/avatares/u/photo.jpg';
  assert.equal(storedPhotoUrl(url), url);
});
