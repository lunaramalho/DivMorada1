-- Apply after 202610240001_charge_email.sql. Does not change existing settled payments.
begin;

alter table public.pagamentos
  add column "pagamentoOriginalId" uuid references public.pagamentos(id),
  add column "numeroParcela" integer,
  add column "totalParcelas" integer,
  add column vencimento date,
  add constraint installment_shape check (
    ("pagamentoOriginalId" is null and "numeroParcela" is null and "totalParcelas" is null)
    or ("pagamentoOriginalId" is not null and "numeroParcela" is not null and "totalParcelas" is not null
      and "totalParcelas" between 2 and 12 and "numeroParcela" between 1 and "totalParcelas" and vencimento is not null)
  ),
  add constraint installment_number_unique unique ("pagamentoOriginalId", "numeroParcela");

create table public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  "pagamentoId" uuid not null references public.pagamentos(id),
  "residenciaId" uuid not null references public.residencias(id),
  "devedorId" uuid not null references public.usuarios(id),
  "credorId" uuid not null references public.usuarios(id),
  tipo text not null check (tipo in ('PAGAMENTO','PARCELAMENTO')),
  status text not null default 'PENDENTE' check (status in ('PENDENTE','APROVADA','RECUSADA','CANCELADA','ENCERRADA')),
  valor numeric(10,2) not null check (valor > 0),
  quantidade integer,
  "primeiroVencimento" date,
  "comprovanteUrl" text,
  "createdAt" timestamptz not null default now(),
  "resolvedAt" timestamptz,
  check ("devedorId" <> "credorId"),
  check ((tipo='PAGAMENTO' and quantidade is null and "primeiroVencimento" is null)
    or (tipo='PARCELAMENTO' and quantidade is not null and quantidade between 2 and 12
      and "primeiroVencimento" is not null and "comprovanteUrl" is null and valor*100 >= quantidade))
);
create unique index payment_one_pending_request on public.payment_requests("pagamentoId") where status='PENDENTE';
create index payment_requests_inbox on public.payment_requests("residenciaId","credorId",status);
create index payment_requests_outbox on public.payment_requests("residenciaId","devedorId",status);
alter table public.payment_requests enable row level security;
revoke all on public.payment_requests from anon, authenticated;
grant select on public.payment_requests to authenticated;
create policy requests_read on public.payment_requests for select to authenticated
  using (public.is_house_member("residenciaId") and auth.uid() in ("devedorId","credorId"));

-- Existing debt/saldo/history queries keep using PENDENTE/CONFIRMADO.
revoke update on public.pagamentos from authenticated;
revoke update(status,"comprovanteUrl",observacao,"pagoEm") on public.pagamentos from authenticated;
-- Prevent clients fabricating installment ancestry or bypassing the controlled insert path.
revoke insert on public.pagamentos from authenticated;
grant insert("residenciaId","despesaId","usuarioId",valor,status) on public.pagamentos to authenticated;

-- Same-day monthly schedule, based on the ORIGINAL day (Jan 31 -> Feb 28 -> Mar 31).
create function public.installment_schedule(p_value numeric, p_count integer, p_first date)
returns table(numero integer, valor numeric, vencimento date)
language plpgsql immutable set search_path=public as $$
declare cents bigint; base_month date; target_month date; last_day integer;
begin
  if p_value is null or p_count is null or p_first is null or p_count not between 2 and 12
     or p_value <= 0 or round(p_value,2)<>p_value or p_value*100 < p_count then
    raise exception 'Quantidade ou valor de parcelas invalido.';
  end if;
  cents := (p_value*100)::bigint;
  base_month := date_trunc('month',p_first)::date;
  for i in 1..p_count loop
    target_month := (base_month + make_interval(months=>i-1))::date;
    last_day := extract(day from (target_month + interval '1 month - 1 day'))::integer;
    numero := i;
    valor := ((cents / p_count) + case when i <= cents % p_count then 1 else 0 end)::numeric / 100;
    vencimento := target_month + (least(extract(day from p_first)::integer,last_day)-1);
    return next;
  end loop;
end $$;

create function public.create_payment_request(p_payment uuid, p_type text,
  p_count integer default null, p_first date default null, p_receipt text default null)
returns public.payment_requests language plpgsql security definer set search_path=public as $$
declare p public.pagamentos; d public.despesas; r public.payment_requests;
begin
  select * into p from public.pagamentos where id=p_payment for update;
  select * into d from public.despesas where id=p."despesaId";
  if auth.uid() is null or p.id is null or d.id is null or p."usuarioId"<>auth.uid()
    or d."criadoPorId"=auth.uid() or p."residenciaId"<>d."residenciaId"
    or not public.is_house_member(p."residenciaId") or not public.is_house_member(p."residenciaId",d."criadoPorId") then
    raise exception 'Acesso negado a esta divida.';
  end if;
  if p.status<>'PENDENTE' or d.status<>'PENDENTE' or exists(
    select 1 from public.payment_requests where "pagamentoId"=p.id and status='PENDENTE') then
    raise exception 'Divida indisponivel ou aguardando analise. Atualize a pagina.';
  end if;
  if p_type='PARCELAMENTO' then
    if p."pagamentoOriginalId" is not null then raise exception 'Uma parcela nao pode ser parcelada novamente.'; end if;
    if p_first is null or p_first < (now() at time zone 'America/Sao_Paulo')::date then
      raise exception 'Escolha o primeiro vencimento a partir de hoje.';
    end if;
    perform * from public.installment_schedule(p.valor,p_count,p_first);
  elsif p_type<>'PAGAMENTO' or p_type is null then
    raise exception 'Tipo de solicitacao invalido.';
  end if;
  -- Receipts must belong to this debtor's Storage prefix, never arbitrary links.
  if p_type='PAGAMENTO' and p_receipt is not null and
    (length(p_receipt)>2048 or p_receipt !~ '^https://' or
     strpos(p_receipt,'/storage/v1/object/public/comprovantes/comprovantes/' || auth.uid()::text || '/')=0) then
    raise exception 'Comprovante invalido.';
  end if;
  insert into public.payment_requests("pagamentoId","residenciaId","devedorId","credorId",tipo,valor,quantidade,"primeiroVencimento","comprovanteUrl")
    values(p.id,p."residenciaId",p."usuarioId",d."criadoPorId",p_type,p.valor,
      case when p_type='PARCELAMENTO' then p_count end,
      case when p_type='PARCELAMENTO' then p_first end,
      case when p_type='PAGAMENTO' then p_receipt end) returning * into r;
  insert into public.historicos("residenciaId","usuarioId",acao,descricao)
    values(p."residenciaId",auth.uid(),case when p_type='PAGAMENTO' then 'Pagamento informado' else 'Parcelamento solicitado' end,
      d.nome || ' - aguardando confirmacao do credor');
  return r;
end $$;

create function public.resolve_payment_request(p_request uuid, p_action text)
returns public.payment_requests language plpgsql security definer set search_path=public as $$
declare r public.payment_requests; p public.pagamentos; d public.despesas; part record;
begin
  select * into r from public.payment_requests where id=p_request;
  if r.id is null then raise exception 'Solicitacao nao encontrada.'; end if;
  -- All paths lock payment BEFORE request, including direct receipt, to serialize competing actions.
  select * into p from public.pagamentos where id=r."pagamentoId" for update;
  select * into r from public.payment_requests where id=p_request for update;
  select * into d from public.despesas where id=p."despesaId";
  if auth.uid() is null or not public.is_house_member(r."residenciaId") or
     not public.is_house_member(r."residenciaId",r."devedorId") or
     not public.is_house_member(r."residenciaId",r."credorId") or d.id is null or d."criadoPorId"<>r."credorId" then
    raise exception 'Acesso negado.';
  end if;
  if p_action='CANCELADA' then
    if auth.uid()<>r."devedorId" then raise exception 'Somente o devedor pode cancelar.'; end if;
  elsif p_action in ('APROVADA','RECUSADA') then
    if auth.uid()<>r."credorId" then raise exception 'Somente o credor pode analisar.'; end if;
  else raise exception 'Acao invalida.';
  end if;
  if r.status=p_action then return r; end if;
  if r.status<>'PENDENTE' or p.status<>'PENDENTE' or d.status<>'PENDENTE' or r.valor<>p.valor then
    raise exception 'Solicitacao ja encerrada ou divida alterada. Atualize a pagina.';
  end if;
  if p_action='APROVADA' then
    if r.tipo='PAGAMENTO' then
      update public.pagamentos set status='CONFIRMADO',"pagoEm"=now(),"comprovanteUrl"=r."comprovanteUrl" where id=p.id;
    else
      if p."pagamentoOriginalId" is not null then raise exception 'Uma parcela nao pode ser parcelada novamente.'; end if;
      update public.pagamentos set status='CANCELADO' where id=p.id;
      for part in select * from public.installment_schedule(r.valor,r.quantidade,r."primeiroVencimento") loop
        insert into public.pagamentos("residenciaId","despesaId","usuarioId",valor,"pagamentoOriginalId","numeroParcela","totalParcelas",vencimento)
          values(p."residenciaId",p."despesaId",p."usuarioId",part.valor,p.id,part.numero,r.quantidade,part.vencimento);
      end loop;
    end if;
  end if;
  update public.payment_requests set status=p_action,"resolvedAt"=now() where id=r.id returning * into r;
  insert into public.historicos("residenciaId","usuarioId",acao,descricao)
    values(r."residenciaId",auth.uid(),
      case when r.tipo='PAGAMENTO' and p_action='APROVADA' then 'Recebimento confirmado'
        else (case when r.tipo='PAGAMENTO' then 'Pagamento informado: ' else 'Parcelamento: ' end) || lower(p_action) end,
      d.nome || ' - R$ ' || r.valor::text);
  return r;
end $$;

create function public.confirm_direct_receipt(p_payment uuid)
returns public.pagamentos language plpgsql security definer set search_path=public as $$
declare p public.pagamentos; d public.despesas; receipt text;
begin
  select * into p from public.pagamentos where id=p_payment for update;
  select * into d from public.despesas where id=p."despesaId";
  if auth.uid() is null or p.id is null or d.id is null or d."criadoPorId"<>auth.uid() or p."usuarioId"=auth.uid()
    or p."residenciaId"<>d."residenciaId" or not public.is_house_member(p."residenciaId")
    or not public.is_house_member(p."residenciaId",p."usuarioId") then raise exception 'Somente o credor pode confirmar o recebimento.'; end if;
  if p.status='CONFIRMADO' then return p; end if;
  if p.status<>'PENDENTE' or d.status<>'PENDENTE' then raise exception 'Divida indisponivel. Atualize a pagina.'; end if;
  select "comprovanteUrl" into receipt from public.payment_requests
    where "pagamentoId"=p.id and status='PENDENTE' and tipo='PAGAMENTO';
  update public.payment_requests set status='ENCERRADA',"resolvedAt"=now() where "pagamentoId"=p.id and status='PENDENTE';
  update public.pagamentos set status='CONFIRMADO',"pagoEm"=now(),"comprovanteUrl"=coalesce(receipt,"comprovanteUrl") where id=p.id returning * into p;
  insert into public.historicos("residenciaId","usuarioId",acao,descricao)
    values(p."residenciaId",auth.uid(),'Recebimento confirmado',d.nome || ' - R$ ' || p.valor::text);
  return p;
end $$;

revoke all on function public.installment_schedule(numeric,integer,date),
  public.create_payment_request(uuid,text,integer,date,text), public.resolve_payment_request(uuid,text), public.confirm_direct_receipt(uuid) from public;
grant execute on function public.installment_schedule(numeric,integer,date),
  public.create_payment_request(uuid,text,integer,date,text), public.resolve_payment_request(uuid,text), public.confirm_direct_receipt(uuid) to authenticated;
commit;
