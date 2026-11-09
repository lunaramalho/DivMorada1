import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const owner='11111111-1111-4111-8111-111111111111';
const member='22222222-2222-4222-8222-222222222222';
const debtor='33333333-3333-4333-8333-333333333333';
const otherOwner='44444444-4444-4444-8444-444444444444';
const outsider='55555555-5555-4555-8555-555555555555';
const house='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const otherHouse='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const base= (await readFile('supabase-schema.sql','utf8')).replace('create extension if not exists "pgcrypto";','');
const migrations=await Promise.all(['202610240001_charge_email.sql','202611080001_payment_requests.sql','202611090001_house_departure.sql'].map(name=>readFile(`supabase/migrations/${name}`,'utf8')));

async function setup(t) {
  const db=new PGlite(); t.after(()=>db.close());
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
    grant usage on schema public,auth,storage to anon,authenticated,service_role;
    create table storage.buckets(id text primary key,name text,public boolean);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    grant select,insert,update,delete on storage.objects to authenticated;`);
  await db.exec(base);
  await db.exec(`insert into auth.users(id,email,raw_user_meta_data) values
    ('${owner}','owner@example.com','{"nome":"Ana"}'),('${member}','member@example.com','{"nome":"Bruno"}'),
    ('${debtor}','debtor@example.com','{"nome":"Carlos"}'),('${otherOwner}','other@example.com','{}'),('${outsider}','outsider@example.com','{}');
    insert into residencias(id,nome,codigo) values('${house}','Casa A','CASAA'),('${otherHouse}','Casa B','CASAB');
    insert into residencia_usuarios("residenciaId","usuarioId",role) values
      ('${house}','${owner}','dono'),('${house}','${member}','membro'),('${house}','${debtor}','membro'),('${otherHouse}','${otherOwner}','dono');`);
  for(const sql of migrations) await db.exec(sql);
  const query=async(sql,params=[]) => (await db.query(sql,params)).rows;
  const as=async(user)=>db.exec(`reset role; select set_config('request.jwt.claim.sub','${user}',false); set role authenticated;`);
  const admin=()=>db.exec('reset role');
  const expense=async(creditor=owner,participants=[owner,member],total=100)=>{
    await as(owner);
    return (await query('select to_jsonb(create_shared_expense($1,$2,$3,$4,$5)) as d',[house,creditor,'Despesa teste',total,participants]))[0].d;
  };
  const leave=async(user=member,targetHouse=house)=>(await query('select depart_house($1,$2) as r',[targetHouse,user]))[0].r;
  const pending=async(user=member)=>(await query('select house_departure_pending($1,$2) as r',[house,user]))[0].r;
  const request=async(payment,type='PAGAMENTO')=>(await query(`select to_jsonb(create_payment_request($1,$2,$3,$4)) as r`,[payment,type,type==='PARCELAMENTO'?2:null,type==='PARCELAMENTO'?'2096-01-31':null]))[0].r;
  const payment=async(expenseId,user=member)=>(await query('select * from pagamentos where "despesaId"=$1 and "usuarioId"=$2',[expenseId,user]))[0];
  return {db,query,as,admin,expense,leave,pending,request,payment};
}

test('clean exit preserves identity and financial rows, revokes access and supports re-entry without duplication',async t=>{
  const s=await setup(t);
  const d=await s.expense(owner,[owner,member]);
  const p=await s.payment(d.id);
  await s.query('select confirm_direct_receipt($1)',[p.id]);
  await s.admin();
  const before=await s.query('select * from pagamentos order by id');
  const expensesBefore=await s.query('select * from despesas order by id');
  const membershipId=(await s.query('select id from residencia_usuarios where "usuarioId"=$1',[member]))[0].id;
  await s.as(member);
  assert.equal((await s.leave()).ok,true);
  assert.equal((await s.query('select * from pagamentos')).length,0);
  assert.equal((await s.query('select * from despesas')).length,0);
  assert.equal((await s.query('select * from historicos')).length,0);
  assert.equal((await s.query('select * from residencias')).length,0);
  assert.equal((await s.query('select * from usuarios where id=$1',[member])).length,1);
  await assert.rejects(s.leave(),/nao participa mais/);
  await s.as(owner);
  assert.deepEqual(await s.query('select * from pagamentos order by id'),before);
  assert.deepEqual(await s.query('select * from despesas order by id'),expensesBefore);
  assert.equal((await s.query('select nome from usuarios where id=$1',[member]))[0].nome,'Bruno');
  assert.equal((await s.query('select * from residencia_usuarios where id=$1',[membershipId]))[0].ativo,false);
  assert.ok((await s.query('select * from residencia_usuarios where id=$1',[membershipId]))[0].leftAt);
  await s.as(member);
  await s.query(`select join_house_by_code('casab')`);
  await assert.rejects(s.query(`select join_house_by_code('CASAA')`),/ja participa/);
  await assert.rejects(s.query(`select create_house('Terceira casa')`),/ja participa/);
  assert.equal((await s.query('select * from pagamentos')).length,0);
  assert.equal((await s.leave(member,otherHouse)).ok,true);
  await s.query(`select join_house_by_code('CASAA')`);
  assert.deepEqual(await s.query('select * from pagamentos order by id'),before);
  assert.equal((await s.query('select * from residencia_usuarios where id=$1',[membershipId]))[0].ativo,true);
  assert.equal((await s.query('select * from residencia_usuarios where id=$1',[membershipId]))[0].leftAt,null);
  assert.equal((await s.query('select * from residencia_usuarios where "usuarioId"=$1 and "residenciaId"=$2',[member,house])).length,1);
});

test('pending debts and receivables block exit even with zero net balance; administrator cannot bypass this',async t=>{
  const s=await setup(t);
  await s.expense(owner,[owner,member]);
  await s.as(member);
  assert.equal((await s.pending()).aPagar,1);
  assert.equal((await s.leave()).ok,false);
  await s.expense(member,[member,owner]);
  await s.as(member);
  const summary=await s.pending();
  assert.equal(summary.aPagar,1); assert.equal(summary.aReceber,1);
  assert.equal(Number(summary.valorAPagar),Number(summary.valorAReceber));
  assert.equal((await s.leave()).ok,false);
  await s.as(owner);
  assert.equal((await s.leave()).ok,false);
  await assert.rejects(s.leave(owner),/administrador nao pode/);
  await s.as(debtor);
  await assert.rejects(s.leave(member),/Somente o administrador/);
  await assert.rejects(s.pending(member),/Acesso negado/);
  await s.as(outsider);
  await assert.rejects(s.leave(member),/Somente o administrador/);
  await s.as(member);
  await assert.rejects(s.query('update residencia_usuarios set ativo=false where "usuarioId"=$1',[member]),/permission denied/);
  await assert.rejects(s.query('delete from residencia_usuarios where "usuarioId"=$1',[member]),/permission denied/);
});

test('informed payments and installment requests block exit; all approved installments must be settled',async t=>{
  const s=await setup(t);
  const d=await s.expense(owner,[owner,member]); const p=await s.payment(d.id);
  await s.as(member);
  const informed=await s.request(p.id);
  assert.equal((await s.pending()).pagamentosEmAnalise,1);
  assert.equal((await s.leave()).ok,false);
  await s.query(`select resolve_payment_request($1,'CANCELADA')`,[informed.id]);
  const installment=await s.request(p.id,'PARCELAMENTO');
  assert.equal((await s.pending()).parcelamentosEmAnalise,1);
  assert.equal((await s.leave()).ok,false);
  await s.as(owner);
  await s.query(`select resolve_payment_request($1,'APROVADA')`,[installment.id]);
  const children=await s.query('select * from pagamentos where "pagamentoOriginalId"=$1',[p.id]);
  await s.as(member);
  assert.equal((await s.pending()).parcelas,2);
  assert.equal((await s.leave()).ok,false);
  await s.as(owner);
  await s.query('select confirm_direct_receipt($1)',[children[0].id]);
  await s.as(member); assert.equal((await s.leave()).ok,false);
  await s.as(owner); await s.query('select confirm_direct_receipt($1)',[children[1].id]);
  await s.as(member); assert.equal((await s.leave()).ok,true);
  await s.as(owner);
  assert.equal((await s.query('select * from payment_requests where id=$1',[installment.id]))[0].status,'APROVADA');
  assert.equal((await s.query('select sum(valor) as total from pagamentos where status=\'CONFIRMADO\''))[0].total,'50.00');
});

test('expense-first blocks exit; exit-first rejects stale participants atomically; no orphan expense is saved',async t=>{
  const s=await setup(t);
  const d=await s.expense(); const p=await s.payment(d.id);
  await s.as(member); assert.equal((await s.leave()).ok,false);
  await s.as(owner); await s.query('select confirm_direct_receipt($1)',[p.id]);
  await s.as(member); assert.equal((await s.leave()).ok,true);
  await s.as(owner);
  const count=(await s.query('select count(*) as n from despesas'))[0].n;
  await assert.rejects(s.expense(),/participante nao pertence/);
  assert.equal((await s.query('select count(*) as n from despesas'))[0].n,count);
  await assert.rejects(s.query(`insert into pagamentos("residenciaId","despesaId","usuarioId",valor) values($1,$2,$3,10)`,[house,d.id,member]),/permission denied/);
  // Even privileged writes cannot manufacture new obligations for a departed member.
  await s.admin();
  await assert.rejects(s.query(`insert into pagamentos("residenciaId","despesaId","usuarioId",valor) values($1,$2,$3,10)`,[house,d.id,member]),/participante nao pertence/);
  await s.as(member);
  await assert.rejects(s.query(`select create_shared_expense($1,$2,'Invasao',100,$3)`,[house,owner,[owner,debtor]]),/nao participa mais/);
});

test('administrator removal preserves a membership; one-house rule also covers house creation and re-entry',async t=>{
  const s=await setup(t);
  await s.as(owner); assert.equal((await s.leave()).ok,true);
  assert.equal((await s.query('select * from residencia_usuarios where "usuarioId"=$1',[member]))[0].ativo,false);
  await s.as(member);
  const created=(await s.query(`select create_house('Casa nova') as r`))[0].r;
  assert.equal((await s.query('select * from residencia_usuarios where "residenciaId"=$1',[created.id]))[0].role,'dono');
  await assert.rejects(s.query(`select create_house('Outra')`),/ja participa/);
  await assert.rejects(s.query(`select join_house_by_code('CASAA')`),/ja participa/);
  await assert.rejects(s.leave(member,created.id),/administrador nao pode/);
});

test('private receipts remain readable to active residents, not former members; avatars remain available with authorized signing',async t=>{
  const s=await setup(t);
  const d=await s.expense(); const p=await s.payment(d.id);
  const path=`comprovantes/${member}/receipt.pdf`;
  const url=`https://project.supabase.co/storage/v1/object/public/comprovantes/${path}`;
  const avatar=`avatares/${member}/photo.jpg`;
  await s.admin();
  await s.query('update pagamentos set "comprovanteUrl"=$1 where id=$2',[url,p.id]);
  await s.query('update usuarios set "fotoUrl"=$1 where id=$2',[`https://project.supabase.co/storage/v1/object/public/comprovantes/${avatar}`,member]);
  await s.query(`insert into storage.objects(bucket_id,name) values('comprovantes',$1),('comprovantes',$2)`,[path,avatar]);
  assert.equal((await s.query(`select public from storage.buckets where id='comprovantes'`))[0].public,false);
  // Simulate an unknown legacy permissive policy; restrictive gates must still prevail.
  await s.db.exec('create policy legacy_open on storage.objects for all to authenticated using(true) with check(true)');
  await s.as(member);
  assert.equal((await s.query('select * from storage.objects')).length,2);
  assert.equal((await s.query('select can_read_house_file($1) as allowed',[path]))[0].allowed,true);
  await s.as(outsider);
  assert.equal((await s.query('select * from storage.objects')).length,0);
  await s.as(owner);
  await s.query('select confirm_direct_receipt($1)',[p.id]);
  await s.as(member); assert.equal((await s.leave()).ok,true);
  assert.equal((await s.query('select * from storage.objects where name=$1',[path])).length,0);
  assert.equal((await s.query('select can_read_house_file($1) as allowed',[path]))[0].allowed,false);
  assert.equal((await s.query('select * from storage.objects where name=$1',[avatar])).length,1);
  await assert.rejects(s.query(`insert into storage.objects(bucket_id,name) values('comprovantes',$1)`,[`comprovantes/${member}/new.pdf`]),/row-level security/);
  await s.as(owner);
  assert.equal((await s.query('select * from storage.objects')).length,2);
  await s.query('update storage.objects set name=$1 where name=$2',['changed.pdf',path]);
  assert.equal((await s.query('select * from storage.objects where name=$1',[path])).length,1);
  await s.query('delete from storage.objects where name=$1',[path]);
  assert.equal((await s.query('select * from storage.objects where name=$1',[path])).length,1);
  await s.as(member); await s.query(`select join_house_by_code('CASAA')`);
  assert.equal((await s.query('select * from storage.objects where name=$1',[path])).length,1);
});
