-- Apply once, after 202611080001_payment_requests.sql. Run the complete transaction.
begin;

-- Fail without altering existing memberships if legacy data needs reconciliation.
do $$ begin
  if exists(select 1 from public.residencia_usuarios where ativo group by "usuarioId" having count(*)>1) then
    raise exception 'Existem usuarios com mais de uma residencia ativa. Revise os vinculos antes de aplicar esta migracao.';
  end if;
end $$;
alter table public.residencia_usuarios add column "leftAt" timestamptz;
create unique index one_active_house_per_user on public.residencia_usuarios("usuarioId") where ativo;

-- Membership lifecycle is only writable by the controlled functions below.
revoke insert,delete on public.residencia_usuarios from authenticated;
revoke update(role,ativo) on public.residencia_usuarios from authenticated;
revoke insert on public.residencias,public.despesas,public.pagamentos from authenticated;
revoke insert("residenciaId","despesaId","usuarioId",valor,status) on public.pagamentos from authenticated;

create function public.house_departure_pending(p_house uuid,p_user uuid)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare result jsonb;
begin
  if auth.uid() is null or not public.is_house_member(p_house)
    or (auth.uid()<>p_user and not public.is_house_owner(p_house)) then raise exception 'Acesso negado.'; end if;
  select jsonb_build_object(
    'aPagar',count(*) filter(where p."usuarioId"=p_user),
    'aReceber',count(*) filter(where d."criadoPorId"=p_user),
    'valorAPagar',coalesce(sum(p.valor) filter(where p."usuarioId"=p_user),0),
    'valorAReceber',coalesce(sum(p.valor) filter(where d."criadoPorId"=p_user),0),
    'parcelas',count(*) filter(where p."pagamentoOriginalId" is not null)
  ) into result from public.pagamentos p left join public.despesas d on d.id=p."despesaId"
    where p."residenciaId"=p_house and p.status='PENDENTE'
      and (p."usuarioId"=p_user or d."criadoPorId"=p_user) and (d.id is null or p."usuarioId"<>d."criadoPorId");
  return result || jsonb_build_object(
    'pagamentosEmAnalise',(select count(*) from public.payment_requests where "residenciaId"=p_house and status='PENDENTE' and tipo='PAGAMENTO' and p_user in ("devedorId","credorId")),
    'parcelamentosEmAnalise',(select count(*) from public.payment_requests where "residenciaId"=p_house and status='PENDENTE' and tipo='PARCELAMENTO' and p_user in ("devedorId","credorId"))
  );
end $$;

create function public.depart_house(p_house uuid,p_user uuid default auth.uid())
returns jsonb language plpgsql security definer set search_path=public as $$
declare membership public.residencia_usuarios; pending jsonb;
begin
  if auth.uid() is null or p_user is null then raise exception 'Entre na sua conta.'; end if;
  -- Same order as join/create: user first, then house. Financial inserts lock this house too.
  perform id from public.usuarios where id=p_user for no key update;
  perform id from public.residencias where id=p_house for no key update;
  if auth.uid()<>p_user and not public.is_house_owner(p_house) then raise exception 'Somente o administrador pode remover outro morador.'; end if;
  select * into membership from public.residencia_usuarios where "residenciaId"=p_house and "usuarioId"=p_user for update;
  if membership.id is null or not membership.ativo then raise exception 'Este morador nao participa mais desta residencia.'; end if;
  if membership.role='dono' or exists(select 1 from public.residencias where id=p_house and "ownerId"=p_user) then
    raise exception 'O administrador nao pode sair nem ser removido. A casa precisa manter seu administrador.';
  end if;
  pending := public.house_departure_pending(p_house,p_user);
  if (pending->>'aPagar')::bigint>0 or (pending->>'aReceber')::bigint>0
    or (pending->>'pagamentosEmAnalise')::bigint>0 or (pending->>'parcelamentosEmAnalise')::bigint>0 then
    return jsonb_build_object('ok',false,'pendencias',pending);
  end if;
  update public.residencia_usuarios set ativo=false,"leftAt"=now() where id=membership.id;
  insert into public.historicos("residenciaId","usuarioId",acao,descricao)
    values(p_house,p_user,case when auth.uid()=p_user then 'Saida da residencia' else 'Morador removido' end,
      'Participacao encerrada; registros financeiros preservados.');
  return jsonb_build_object('ok',true,'pendencias',pending);
end $$;

create or replace function public.join_house_by_code(p_code text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare r public.residencias;
begin
  if auth.uid() is null then raise exception 'Entre na sua conta.'; end if;
  perform id from public.usuarios where id=auth.uid() for no key update;
  if exists(select 1 from public.residencia_usuarios where "usuarioId"=auth.uid() and ativo) then
    raise exception 'Voce ja participa de uma residencia. Saia dela antes de entrar em outra.';
  end if;
  select * into r from public.residencias where codigo=upper(trim(p_code)) for no key update;
  if r.id is null then raise exception 'Codigo de convite invalido.'; end if;
  insert into public.residencia_usuarios("residenciaId","usuarioId",role,ativo)
    values(r.id,auth.uid(),'membro',true)
    on conflict("residenciaId","usuarioId") do update set ativo=true,role='membro',"leftAt"=null;
  insert into public.historicos("residenciaId","usuarioId",acao,descricao)
    values(r.id,auth.uid(),'Entrada na residencia','Participacao iniciada ou reativada por convite.');
  return to_jsonb(r);
end $$;

create function public.create_house(p_name text,p_description text default null) returns jsonb
language plpgsql security definer set search_path=public as $$
declare r public.residencias;
begin
  if auth.uid() is null then raise exception 'Entre na sua conta.'; end if;
  if nullif(trim(p_name),'') is null then raise exception 'Informe o nome da residencia.'; end if;
  perform id from public.usuarios where id=auth.uid() for no key update;
  if exists(select 1 from public.residencia_usuarios where "usuarioId"=auth.uid() and ativo) then
    raise exception 'Voce ja participa de uma residencia. Saia dela antes de criar outra.';
  end if;
  insert into public.residencias(nome,descricao,codigo,"ownerId")
    values(trim(p_name),p_description,upper(replace(gen_random_uuid()::text,'-','')),auth.uid()) returning * into r;
  insert into public.residencia_usuarios("residenciaId","usuarioId",role,ativo) values(r.id,auth.uid(),'dono',true);
  return to_jsonb(r);
end $$;

-- Protect server-side inserts too; a cached list of participants cannot recreate a debt after exit.
create function public.guard_house_financial_insert() returns trigger
language plpgsql security definer set search_path=public as $$
declare creditor uuid; house uuid;
begin
  house := new."residenciaId";
  perform id from public.residencias where id=house for no key update;
  if tg_table_name='despesas' then
    if not public.is_house_member(house,new."criadoPorId") or not public.is_house_member(house,new."recordedById") then
      raise exception 'O responsavel pela despesa nao participa mais da residencia.';
    end if;
  else
    select "criadoPorId" into creditor from public.despesas where id=new."despesaId" and "residenciaId"=house;
    if creditor is null or not public.is_house_member(house,creditor) or not public.is_house_member(house,new."usuarioId") then
      raise exception 'Um participante nao pertence mais a residencia. Atualize a lista de moradores.';
    end if;
  end if;
  return new;
end $$;
create trigger guard_expense_members before insert on public.despesas for each row execute function public.guard_house_financial_insert();
create trigger guard_payment_members before insert on public.pagamentos for each row execute function public.guard_house_financial_insert();

-- Expense + splits are committed together; the house lock spans the entire operation.
create function public.create_shared_expense(p_house uuid,p_creditor uuid,p_name text,p_total numeric,p_participants uuid[],p_description text default null,p_type public.despesa_tipo default 'VARIAVEL')
returns public.despesas language plpgsql security definer set search_path=public as $$
declare d public.despesas; participants uuid[]; person uuid; share numeric(10,2);
begin
  perform id from public.residencias where id=p_house for no key update;
  if auth.uid() is null or not public.is_house_member(p_house) then raise exception 'Voce nao participa mais desta residencia.'; end if;
  if not public.is_house_member(p_house,p_creditor) then raise exception 'O credor nao participa desta residencia.'; end if;
  if nullif(trim(p_name),'') is null or p_total is null or p_total<=0 or p_total<>round(p_total,2) then raise exception 'Informe nome e valor validos.'; end if;
  select array_agg(distinct x order by x) into participants from unnest(p_participants) x;
  if coalesce(cardinality(participants),0)=0 or array_position(participants,null) is not null then raise exception 'Selecione os participantes.'; end if;
  foreach person in array participants loop
    if not public.is_house_member(p_house,person) then raise exception 'Um participante nao pertence mais a residencia. Atualize a lista de moradores.'; end if;
  end loop;
  share := p_total/cardinality(participants);
  if share<=0 then raise exception 'O valor por pessoa deve ser de pelo menos um centavo.'; end if;
  insert into public.despesas("residenciaId","criadoPorId","recordedById",nome,descricao,"valorTotal",tipo)
    values(p_house,p_creditor,auth.uid(),trim(p_name),p_description,p_total,p_type) returning * into d;
  foreach person in array participants loop
    if person<>p_creditor then
      insert into public.pagamentos("residenciaId","despesaId","usuarioId",valor) values(p_house,d.id,person,share);
    end if;
  end loop;
  insert into public.historicos("residenciaId","usuarioId",acao,descricao) values(p_house,auth.uid(),'Despesa criada',d.nome || ' - R$ ' || d."valorTotal"::text);
  return d;
end $$;

-- Active residents can identify former participants in historical records; former residents cannot read the house.
create or replace function public.shares_house(person uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.residencia_usuarios a join public.residencia_usuarios b on a."residenciaId"=b."residenciaId"
    where a."usuarioId"=auth.uid() and b."usuarioId"=person and a.ativo);
$$;
drop policy charge_read on public.charge_email_attempts;
create policy charge_read on public.charge_email_attempts for select to authenticated using(actor_id=auth.uid() and exists(
  select 1 from public.pagamentos p where p.id=pagamento_id and public.is_house_member(p."residenciaId")));

-- Retain existing objects and database URLs; public URLs cease to grant access.
update storage.buckets set public=false where id='comprovantes';
create function public.storage_object_path(p_url text) returns text
language sql immutable set search_path=public as $$
  select case when p_url like 'https://%/storage/v1/object/public/comprovantes/%'
    then split_part(split_part(p_url,'/storage/v1/object/public/comprovantes/',2),'?',1) end;
$$;
create function public.can_read_house_file(p_name text) returns boolean
language sql stable security definer set search_path=public as $$
  select auth.uid() is not null and (
    (p_name like 'avatares/%' and exists(select 1 from public.usuarios u where
      public.storage_object_path(u."fotoUrl")=p_name and (u.id=auth.uid() or public.shares_house(u.id))))
    or exists(select 1 from public.pagamentos p where public.storage_object_path(p."comprovanteUrl")=p_name and public.is_house_member(p."residenciaId"))
    or exists(select 1 from public.payment_requests r where public.storage_object_path(r."comprovanteUrl")=p_name and public.is_house_member(r."residenciaId") and auth.uid() in (r."devedorId",r."credorId"))
    or exists(select 1 from public.despesas d where public.storage_object_path(d."comprovanteUrl")=p_name and public.is_house_member(d."residenciaId"))
  );
$$;
-- Remove every existing policy for this dedicated bucket's previously permissive setup.
drop policy if exists comprovantes_authenticated_select on storage.objects;
drop policy if exists comprovantes_authenticated_insert on storage.objects;
drop policy if exists comprovantes_authenticated_update on storage.objects;
create policy house_files_read on storage.objects for select to authenticated
  using(bucket_id='comprovantes' and public.can_read_house_file(name));
create policy house_files_insert on storage.objects for insert to authenticated
  with check(bucket_id='comprovantes' and (
    name like 'avatares/' || auth.uid()::text || '/%'
    or (name like 'comprovantes/' || auth.uid()::text || '/%' and exists(select 1 from public.residencia_usuarios where "usuarioId"=auth.uid() and ativo))
  ));

-- Restrictive gates prevent any other legacy permissive policy granting access to this bucket.
create policy house_files_read_gate on storage.objects as restrictive for select to authenticated
  using(bucket_id<>'comprovantes' or public.can_read_house_file(name));
create policy house_files_insert_gate on storage.objects as restrictive for insert to authenticated
  with check(bucket_id<>'comprovantes' or (
    name like 'avatares/' || auth.uid()::text || '/%'
    or (name like 'comprovantes/' || auth.uid()::text || '/%' and exists(select 1 from public.residencia_usuarios where "usuarioId"=auth.uid() and ativo))
  ));
create policy house_files_no_update on storage.objects as restrictive for update to authenticated
  using(bucket_id<>'comprovantes') with check(bucket_id<>'comprovantes');
create policy house_files_no_delete on storage.objects as restrictive for delete to authenticated
  using(bucket_id<>'comprovantes');

revoke all on function public.house_departure_pending(uuid,uuid),public.depart_house(uuid,uuid),public.create_house(text,text),
  public.create_shared_expense(uuid,uuid,text,numeric,uuid[],text,public.despesa_tipo),public.guard_house_financial_insert(),
  public.storage_object_path(text),public.can_read_house_file(text) from public;
grant execute on function public.house_departure_pending(uuid,uuid),public.depart_house(uuid,uuid),public.create_house(text,text),
  public.create_shared_expense(uuid,uuid,text,numeric,uuid[],text,public.despesa_tipo),public.can_read_house_file(text) to authenticated;
notify pgrst,'reload schema';
commit;
