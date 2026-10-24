create extension if not exists "pgcrypto";

do $$
begin
  create type residencia_role as enum ('dono', 'membro');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type despesa_tipo as enum ('FIXA', 'VARIAVEL');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type despesa_status as enum ('PENDENTE', 'PAGA', 'CANCELADA');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type pagamento_status as enum ('PENDENTE', 'CONFIRMADO', 'CANCELADO');
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null unique,
  "fotoUrl" text,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.usuarios (id, nome, email, "fotoUrl")
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'fotoUrl'
  )
  on conflict (id) do update set
    nome = excluded.nome,
    email = excluded.email,
    "fotoUrl" = excluded."fotoUrl";

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table if not exists public.residencias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  codigo text not null unique,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.residencia_usuarios (
  id uuid primary key default gen_random_uuid(),
  "residenciaId" uuid not null references public.residencias(id) on delete cascade,
  "usuarioId" uuid not null references public.usuarios(id) on delete cascade,
  role residencia_role not null default 'membro',
  ativo boolean not null default true,
  "joinedAt" timestamptz not null default now(),
  unique ("residenciaId", "usuarioId")
);

create table if not exists public.despesas (
  id uuid primary key default gen_random_uuid(),
  "residenciaId" uuid not null references public.residencias(id) on delete cascade,
  "criadoPorId" uuid not null references public.usuarios(id),
  nome text not null,
  descricao text,
  "valorTotal" numeric(10, 2) not null,
  tipo despesa_tipo not null,
  status despesa_status not null default 'PENDENTE',
  "comprovanteUrl" text,
  vencimento timestamptz,
  "pagaEm" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  "residenciaId" uuid not null references public.residencias(id) on delete cascade,
  "despesaId" uuid references public.despesas(id) on delete set null,
  "usuarioId" uuid not null references public.usuarios(id),
  valor numeric(10, 2) not null,
  status pagamento_status not null default 'PENDENTE',
  "comprovanteUrl" text,
  observacao text,
  "pagoEm" timestamptz,
  "createdAt" timestamptz not null default now()
);

create table if not exists public.historicos (
  id uuid primary key default gen_random_uuid(),
  "residenciaId" uuid not null references public.residencias(id) on delete cascade,
  "usuarioId" uuid references public.usuarios(id) on delete set null,
  acao text not null,
  descricao text,
  "createdAt" timestamptz not null default now()
);

drop trigger if exists usuarios_set_updated_at on public.usuarios;
create trigger usuarios_set_updated_at
before update on public.usuarios
for each row execute function public.set_updated_at();

drop trigger if exists residencias_set_updated_at on public.residencias;
create trigger residencias_set_updated_at
before update on public.residencias
for each row execute function public.set_updated_at();

drop trigger if exists despesas_set_updated_at on public.despesas;
create trigger despesas_set_updated_at
before update on public.despesas
for each row execute function public.set_updated_at();

create index if not exists residencia_usuarios_usuario_idx on public.residencia_usuarios("usuarioId");
create index if not exists despesas_residencia_idx on public.despesas("residenciaId");
create index if not exists despesas_criado_por_idx on public.despesas("criadoPorId");
create index if not exists pagamentos_residencia_idx on public.pagamentos("residenciaId");
create index if not exists pagamentos_despesa_idx on public.pagamentos("despesaId");
create index if not exists pagamentos_usuario_idx on public.pagamentos("usuarioId");
create index if not exists historicos_residencia_idx on public.historicos("residenciaId");
create index if not exists historicos_usuario_idx on public.historicos("usuarioId");

alter table public.usuarios enable row level security;
alter table public.residencias enable row level security;
alter table public.residencia_usuarios enable row level security;
alter table public.despesas enable row level security;
alter table public.pagamentos enable row level security;
alter table public.historicos enable row level security;

drop policy if exists "usuarios_authenticated_all" on public.usuarios;
create policy "usuarios_authenticated_all" on public.usuarios
for all to authenticated
using (true)
with check (true);

drop policy if exists "residencias_authenticated_all" on public.residencias;
create policy "residencias_authenticated_all" on public.residencias
for all to authenticated
using (true)
with check (true);

drop policy if exists "residencia_usuarios_authenticated_all" on public.residencia_usuarios;
create policy "residencia_usuarios_authenticated_all" on public.residencia_usuarios
for all to authenticated
using (true)
with check (true);

drop policy if exists "despesas_authenticated_all" on public.despesas;
create policy "despesas_authenticated_all" on public.despesas
for all to authenticated
using (true)
with check (true);

drop policy if exists "pagamentos_authenticated_all" on public.pagamentos;
create policy "pagamentos_authenticated_all" on public.pagamentos
for all to authenticated
using (true)
with check (true);

drop policy if exists "historicos_authenticated_all" on public.historicos;
create policy "historicos_authenticated_all" on public.historicos
for all to authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('comprovantes', 'comprovantes', true)
on conflict (id) do update set public = true;

drop policy if exists "comprovantes_authenticated_select" on storage.objects;
create policy "comprovantes_authenticated_select" on storage.objects
for select to authenticated
using (bucket_id = 'comprovantes');

drop policy if exists "comprovantes_authenticated_insert" on storage.objects;
create policy "comprovantes_authenticated_insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'comprovantes');

drop policy if exists "comprovantes_authenticated_update" on storage.objects;
create policy "comprovantes_authenticated_update" on storage.objects
for update to authenticated
using (bucket_id = 'comprovantes')
with check (bucket_id = 'comprovantes');
