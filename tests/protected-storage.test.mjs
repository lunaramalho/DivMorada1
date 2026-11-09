import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
const source=ts.transpileModule(readFileSync('src/services/protectedStorage.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const base='https://project.supabase.co';
function setup(error=null) {
  const calls=[];
  const context={exports:{},URL,process:{env:{EXPO_PUBLIC_SUPABASE_URL:base}},require:()=>({supabase:{storage:{from:bucket=>({createSignedUrl:async(path,seconds)=>{calls.push({bucket,path,seconds});return {data:error?null:{signedUrl:'https://signed.example/temp'},error};}})}}})};
  vm.runInNewContext(source,context);
  return {...context.exports,calls};
}
test('private file access signs trusted legacy references on demand for only 60 seconds',async()=>{
  const s=setup(); const url=`${base}/storage/v1/object/public/comprovantes/comprovantes/u/receipt.pdf`;
  assert.equal(await s.protectedFileURL(url),'https://signed.example/temp');
  assert.deepEqual(s.calls,[{bucket:'comprovantes',path:'comprovantes/u/receipt.pdf',seconds:60}]);
  await assert.rejects(setup({message:'denied'}).protectedFileURL(url),/acessar o arquivo/);
});
test('rejects foreign hosts, malformed paths and temporary URLs rather than reopening a public link',async()=>{
  const s=setup();
  for(const url of ['https://evil.example/storage/v1/object/public/comprovantes/a.pdf',`${base}/storage/v1/object/public/other/a.pdf`,'blob:local','not-a-url',`${base}/storage/v1/object/public/comprovantes/%2e%2e%2fprivate`]) {
    assert.equal(s.storedObjectPath(url),null);
    await assert.rejects(s.protectedFileURL(url),/nao pertence|não pertence/);
  }
  assert.equal(s.calls.length,0);
});
