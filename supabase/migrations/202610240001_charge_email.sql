-- Run once against the existing schema. Review before applying to the hosted project.
begin;
alter table public.residencias add column if not exists "ownerId" uuid references auth.users(id) default auth.uid();
update public.residencias r set "ownerId" = (select m."usuarioId" from public.residencia_usuarios m where m."residenciaId"=r.id and m.role='dono' order by m."joinedAt" limit 1) where "ownerId" is null;
alter table public.despesas add column if not exists "recordedById" uuid references auth.users(id) default auth.uid();
update public.despesas set "recordedById"="criadoPorId" where "recordedById" is null;

create or replace function public.is_house_member(house uuid, person uuid default auth.uid()) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.residencia_usuarios where "residenciaId"=house and "usuarioId"=person and ativo);
$$;
create or replace function public.is_house_owner(house uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.residencias where id=house and "ownerId"=auth.uid());
$$;
create or replace function public.shares_house(person uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.residencia_usuarios a join public.residencia_usuarios b on a."residenciaId"=b."residenciaId" where a."usuarioId"=auth.uid() and b."usuarioId"=person and a.ativo and b.ativo);
$$;
revoke all on function public.is_house_member(uuid,uuid), public.is_house_owner(uuid), public.shares_house(uuid) from public;
grant execute on function public.is_house_member(uuid,uuid), public.is_house_owner(uuid), public.shares_house(uuid) to authenticated, service_role;

-- Remove permissive policies, including any manually renamed variants.
do $$ declare p record; begin
  for p in select tablename,policyname from pg_policies where schemaname='public' and tablename in ('usuarios','residencias','residencia_usuarios','despesas','pagamentos','historicos') loop
    execute format('drop policy %I on public.%I',p.policyname,p.tablename);
  end loop;
end $$;
revoke all on public.usuarios,public.residencias,public.residencia_usuarios,public.despesas,public.pagamentos,public.historicos from anon,authenticated;
grant select on public.usuarios,public.residencias,public.residencia_usuarios,public.despesas,public.pagamentos,public.historicos to authenticated;
grant insert on public.usuarios,public.residencias,public.residencia_usuarios,public.despesas,public.pagamentos,public.historicos to authenticated;
grant update(nome,"fotoUrl") on public.usuarios to authenticated;
grant update(nome,descricao) on public.residencias to authenticated;
grant update(role,ativo) on public.residencia_usuarios to authenticated;
grant delete on public.residencia_usuarios to authenticated;
grant update(status,"comprovanteUrl",observacao,"pagoEm") on public.pagamentos to authenticated;

create policy profiles_read on public.usuarios for select to authenticated using(id=auth.uid() or public.shares_house(id));
create policy profiles_insert on public.usuarios for insert to authenticated with check(id=auth.uid() and email=auth.jwt()->>'email' and "isActive");
create policy profiles_update on public.usuarios for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy houses_read on public.residencias for select to authenticated using(public.is_house_member(id) or "ownerId"=auth.uid());
create policy houses_insert on public.residencias for insert to authenticated with check("ownerId"=auth.uid());
create policy houses_update on public.residencias for update to authenticated using(public.is_house_owner(id)) with check(public.is_house_owner(id));
create policy members_read on public.residencia_usuarios for select to authenticated using("usuarioId"=auth.uid() or public.is_house_member("residenciaId") or public.is_house_owner("residenciaId"));
create policy members_insert_owner on public.residencia_usuarios for insert to authenticated with check(public.is_house_owner("residenciaId") and "usuarioId"=auth.uid() and role='dono' and ativo);
create policy members_update_owner on public.residencia_usuarios for update to authenticated using(public.is_house_owner("residenciaId")) with check(public.is_house_owner("residenciaId"));
create policy members_delete_owner on public.residencia_usuarios for delete to authenticated using(public.is_house_owner("residenciaId") and "usuarioId"<>auth.uid());
create policy expenses_read on public.despesas for select to authenticated using(public.is_house_member("residenciaId"));
create policy expenses_insert on public.despesas for insert to authenticated with check("recordedById"=auth.uid() and public.is_house_member("residenciaId") and public.is_house_member("residenciaId","criadoPorId") and "valorTotal">0);
create policy payments_read on public.pagamentos for select to authenticated using(public.is_house_member("residenciaId"));
create policy payments_insert on public.pagamentos for insert to authenticated with check(status='PENDENTE' and valor>0 and public.is_house_member("residenciaId","usuarioId") and exists(select 1 from public.despesas d where d.id="despesaId" and d."residenciaId"=pagamentos."residenciaId" and d."recordedById"=auth.uid() and d.status='PENDENTE' and d."criadoPorId"<>pagamentos."usuarioId"));
create policy payments_update on public.pagamentos for update to authenticated using(public.is_house_member("residenciaId") and ("usuarioId"=auth.uid() or exists(select 1 from public.despesas d where d.id="despesaId" and d."criadoPorId"=auth.uid()))) with check(public.is_house_member("residenciaId") and ("usuarioId"=auth.uid() or exists(select 1 from public.despesas d where d.id="despesaId" and d."criadoPorId"=auth.uid())));
create policy history_read on public.historicos for select to authenticated using(public.is_house_member("residenciaId"));
create policy history_insert on public.historicos for insert to authenticated with check(public.is_house_member("residenciaId") and public.is_house_member("residenciaId","usuarioId") and acao='Despesa criada');

-- Invitation knowledge, rather than a guessed house ID, permits joining.
create or replace function public.join_house_by_code(p_code text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare r public.residencias; begin
  if auth.uid() is null then raise exception 'Entre na sua conta.'; end if;
  select * into r from public.residencias where codigo=upper(trim(p_code));
  if r.id is null then raise exception 'Codigo de convite invalido.'; end if;
  if exists(select 1 from public.residencia_usuarios where "residenciaId"=r.id and "usuarioId"=auth.uid()) then raise exception 'Usuario ja cadastrado nesta residencia.'; end if;
  insert into public.residencia_usuarios("residenciaId","usuarioId",role,ativo) values(r.id,auth.uid(),'membro',true);
  return to_jsonb(r);
end $$;
revoke all on function public.join_house_by_code(text) from public;
grant execute on function public.join_house_by_code(text) to authenticated;

create table public.charge_email_attempts (
  id uuid primary key default gen_random_uuid(),
  pagamento_id uuid not null unique references public.pagamentos(id) on delete cascade,
  actor_id uuid not null references auth.users(id),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  lease_until timestamptz not null default now()+interval '2 minutes',
  accepted_at timestamptz,
  provider_id text
);
alter table public.charge_email_attempts enable row level security;
revoke all on public.charge_email_attempts from anon,authenticated;
grant select(id,pagamento_id,actor_id,created_at,accepted_at,provider_id) on public.charge_email_attempts to authenticated;
create policy charge_read on public.charge_email_attempts for select to authenticated using(actor_id=auth.uid());
alter table public.historicos add column if not exists charge_attempt_id uuid unique;

create or replace function public.reserve_charge_email(p_payment uuid,p_actor uuid,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path=public as $$
declare p public.pagamentos; d public.despesas; a public.charge_email_attempts; begin
  perform pg_advisory_xact_lock(hashtextextended(p_payment::text,0));
  select * into p from public.pagamentos where id=p_payment for update;
  select * into d from public.despesas where id=p."despesaId";
  if p.id is null or d.id is null or d."criadoPorId"<>p_actor or p."usuarioId"=p_actor or p.status<>'PENDENTE' or d.status<>'PENDENTE' or p."residenciaId"<>d."residenciaId" or not public.is_house_member(p."residenciaId",p_actor) or not public.is_house_member(p."residenciaId",p."usuarioId") then
    raise exception 'Parcela indisponivel para cobranca ou acesso negado.';
  end if;
  select * into a from public.charge_email_attempts where pagamento_id=p_payment for update;
  if a.accepted_at is not null and a.accepted_at>now()-interval '24 hours' then raise exception 'Aguarde 24 horas desde o ultimo envio desta parcela.'; end if;
  if a.id is not null and a.accepted_at is null then
    if a.lease_until>now() then raise exception 'Envio em andamento. Aguarde alguns minutos.'; end if;
    if a.created_at<now()-interval '23 hours' then raise exception 'Envio pendente de conciliacao. Confira o Resend antes de liberar outra tentativa.'; end if;
    update public.charge_email_attempts set lease_until=now()+interval '2 minutes' where id=a.id returning * into a;
  else
    insert into public.charge_email_attempts(pagamento_id,actor_id,payload) values(p_payment,p_actor,p_payload)
    on conflict(pagamento_id) do update set id=gen_random_uuid(),actor_id=excluded.actor_id,payload=excluded.payload,created_at=now(),lease_until=now()+interval '2 minutes',accepted_at=null,provider_id=null
    returning * into a;
  end if;
  return jsonb_build_object('id',a.id,'payload',a.payload);
end $$;
create or replace function public.accept_charge_email(p_attempt uuid,p_provider_id text) returns timestamptz
language plpgsql security definer set search_path=public as $$
declare a public.charge_email_attempts; p public.pagamentos; begin
  select * into a from public.charge_email_attempts where id=p_attempt for update;
  if a.id is null then raise exception 'Tentativa nao encontrada.'; end if;
  if a.accepted_at is not null then return a.accepted_at; end if;
  update public.charge_email_attempts set accepted_at=now(),provider_id=p_provider_id where id=p_attempt returning * into a;
  select * into p from public.pagamentos where id=a.pagamento_id;
  insert into public.historicos("residenciaId","usuarioId",acao,descricao,charge_attempt_id)
  values(p."residenciaId",a.actor_id,'Cobranca aceita pelo servico de e-mail',format('Parcela %s - R$ %s - envio %s',p.id,p.valor,p_provider_id),a.id);
  return a.accepted_at;
end $$;
revoke all on function public.reserve_charge_email(uuid,uuid,jsonb),public.accept_charge_email(uuid,text) from public,anon,authenticated;
grant execute on function public.reserve_charge_email(uuid,uuid,jsonb),public.accept_charge_email(uuid,text) to service_role;
commit;
