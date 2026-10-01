-- HGC Demandas — schema inicial
create extension if not exists pgcrypto;

-- Chave do servidor: o app envia no cabeçalho x-hgc-key e as políticas conferem.
-- O valor é inserido na configuração (não fica no repositório):
--   insert into private.app_secret (key) values ('<HGC_DB_KEY>');
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.app_secret (
  id boolean primary key default true check (id),
  key text not null
);

create or replace function public.has_app_key()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from private.app_secret s
    where s.key = coalesce(current_setting('request.headers', true)::json ->> 'x-hgc-key', '')
  );
$$;

-- Tentativas de login erradas (limite por IP)
create table public.login_attempts (
  id bigint generated always as identity primary key,
  ip text not null,
  created_at timestamptz not null default now()
);
create index login_attempts_ip_idx on public.login_attempts(ip, created_at);

-- Cliente atendido (hoje: GM Sports)
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  whatsapp text,
  system_name text,
  system_url text,
  created_at timestamptz not null default now()
);

-- Demandas (change requests)
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  number integer generated always as identity unique,
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  description text,
  type text not null default 'funcionalidade'
    check (type in ('funcionalidade','ajuste','correcao','conteudo','outro')),
  priority text not null default 'media'
    check (priority in ('baixa','media','alta','urgente')),
  status text not null default 'recebida'
    check (status in ('recebida','analise','desenvolvimento','revisao','entregue','cancelada')),
  source text not null default 'whatsapp'
    check (source in ('whatsapp','cliente','interno')),
  original_message text,
  estimate_hours numeric(6,1),
  due_date date,
  delivered_url text,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index requests_client_idx on public.requests(client_id);
create index requests_status_idx on public.requests(status);

-- Histórico / atualizações de cada demanda
create table public.request_updates (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  body text,
  status_to text,
  author text not null default 'hgc' check (author in ('hgc','cliente')),
  created_at timestamptz not null default now()
);
create index request_updates_request_idx on public.request_updates(request_id);

create or replace function public.touch_request()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  if new.status = 'entregue' and old.status is distinct from 'entregue' then
    new.delivered_at := now();
  end if;
  return new;
end $$;

create trigger requests_touch before update on public.requests
  for each row execute function public.touch_request();

-- RLS: tabelas só acessíveis pelo servidor do app (com a chave)
alter table public.clients enable row level security;
alter table public.requests enable row level security;
alter table public.request_updates enable row level security;
alter table public.login_attempts enable row level security;

create policy app_all on public.clients for all to anon
  using ((select public.has_app_key())) with check ((select public.has_app_key()));
create policy app_all on public.requests for all to anon
  using ((select public.has_app_key())) with check ((select public.has_app_key()));
create policy app_all on public.request_updates for all to anon
  using ((select public.has_app_key())) with check ((select public.has_app_key()));
create policy app_all on public.login_attempts for all to anon
  using ((select public.has_app_key())) with check ((select public.has_app_key()));

revoke all on function public.has_app_key() from public;
grant execute on function public.has_app_key() to anon;
