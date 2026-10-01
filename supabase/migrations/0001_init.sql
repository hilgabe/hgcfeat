-- HGC Demandas — schema inicial
create extension if not exists pgcrypto;

-- Quem pode administrar a plataforma (login HGC)
create table public.admins (
  email text primary key
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Clientes: cada um tem um link de acompanhamento (share_token)
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  whatsapp text,
  system_name text,
  system_url text,
  share_token text not null unique default encode(gen_random_bytes(12), 'hex'),
  allow_client_requests boolean not null default true,
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
  public boolean not null default true,
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

-- RLS: tabelas só acessíveis pelo admin logado
alter table public.admins enable row level security;
alter table public.clients enable row level security;
alter table public.requests enable row level security;
alter table public.request_updates enable row level security;

create policy admin_all on public.clients for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy admin_all on public.requests for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy admin_all on public.request_updates for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy admin_read on public.admins for select to authenticated
  using ((select public.is_admin()));

-- Portal do cliente: acesso apenas via token, por funções controladas
create or replace function public.portal_get(p_token text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'client', jsonb_build_object(
      'name', c.name, 'company', c.company,
      'system_name', c.system_name, 'system_url', c.system_url,
      'allow_client_requests', c.allow_client_requests
    ),
    'requests', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id, 'number', r.number, 'title', r.title,
        'description', r.description, 'type', r.type, 'priority', r.priority,
        'status', r.status, 'due_date', r.due_date,
        'delivered_url', r.delivered_url, 'delivered_at', r.delivered_at,
        'created_at', r.created_at, 'updated_at', r.updated_at,
        'updates', coalesce((
          select jsonb_agg(jsonb_build_object(
            'body', u.body, 'status_to', u.status_to,
            'author', u.author, 'created_at', u.created_at
          ) order by u.created_at desc)
          from public.request_updates u
          where u.request_id = r.id and u.public
        ), '[]'::jsonb)
      ) order by r.created_at desc)
      from public.requests r where r.client_id = c.id
    ), '[]'::jsonb)
  )
  from public.clients c
  where c.share_token = p_token;
$$;

create or replace function public.portal_create_request(
  p_token text, p_title text, p_description text, p_type text default 'funcionalidade'
)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_client public.clients;
  v_number integer;
  v_id uuid;
begin
  select * into v_client from public.clients where share_token = p_token;
  if v_client.id is null or not v_client.allow_client_requests then
    raise exception 'not_allowed';
  end if;
  if length(trim(coalesce(p_title, ''))) < 3 or length(p_title) > 160
     or length(coalesce(p_description, '')) > 4000 then
    raise exception 'invalid_input';
  end if;
  if (select count(*) from public.requests
      where client_id = v_client.id and source = 'cliente'
        and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'rate_limited';
  end if;

  insert into public.requests (client_id, title, description, type, source, status)
  values (
    v_client.id, trim(p_title), nullif(trim(p_description), ''),
    case when p_type in ('funcionalidade','ajuste','correcao','conteudo','outro')
         then p_type else 'outro' end,
    'cliente', 'recebida'
  )
  returning id, number into v_id, v_number;

  insert into public.request_updates (request_id, body, status_to, author)
  values (v_id, 'Solicitação enviada pelo cliente.', 'recebida', 'cliente');

  return v_number;
end $$;

create or replace function public.portal_comment(
  p_token text, p_request_id uuid, p_body text
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if length(trim(coalesce(p_body, ''))) < 1 or length(p_body) > 2000 then
    raise exception 'invalid_input';
  end if;
  if not exists (
    select 1 from public.requests r join public.clients c on c.id = r.client_id
    where r.id = p_request_id and c.share_token = p_token
  ) then
    raise exception 'not_allowed';
  end if;
  insert into public.request_updates (request_id, body, author)
  values (p_request_id, trim(p_body), 'cliente');
  update public.requests set updated_at = now() where id = p_request_id;
end $$;

revoke all on function public.portal_get(text) from public;
revoke all on function public.portal_create_request(text, text, text, text) from public;
revoke all on function public.portal_comment(text, uuid, text) from public;
grant execute on function public.portal_get(text) to anon, authenticated;
grant execute on function public.portal_create_request(text, text, text, text) to anon, authenticated;
grant execute on function public.portal_comment(text, uuid, text) to anon, authenticated;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
