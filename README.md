# HGC Demandas

Plataforma da HGC para registrar e acompanhar **demandas de desenvolvimento sob medida**
(change requests / feature requests) que chegam dos clientes — normalmente pelo WhatsApp —
e compartilhar o andamento com cada cliente por um link.

## Como funciona

- **Painel** — entrada por código de acesso (sem e-mail). Cadastre clientes, registre demandas
  (colando a mensagem original do WhatsApp), mude o status e registre o andamento.
- **Avisar o cliente** — cada demanda gera uma mensagem pronta com status + link,
  para copiar ou abrir direto no WhatsApp do cliente.
- **Portal do cliente** (`/p/<token>`) — o cliente vê as demandas dele, o histórico,
  aprova/comenta e pode abrir novas solicitações. Sem login: o acesso é pelo link.

Fluxo de status: Recebida → Em análise → Em desenvolvimento → Para aprovação → Entregue (ou Cancelada).

## Stack

Next.js 16 (App Router) · Supabase (Postgres + Auth + RLS) · Vercel.

## Configuração

1. Crie um projeto no Supabase e rode `supabase/migrations/0001_init.sql`.
2. Gere um valor aleatório para `HGC_DB_KEY` e grave no banco:
   `insert into private.app_secret (key) values ('<HGC_DB_KEY>');`
3. Variáveis de ambiente na Vercel (veja `.env.example`): `SUPABASE_URL`,
   `SUPABASE_PUBLISHABLE_KEY`, `HGC_DB_KEY`, `ACCESS_CODE` (código da tela de login)
   e `SESSION_SECRET`.

```bash
npm install
npm run dev
```

## Segurança

- O navegador nunca fala com o Supabase: tudo passa pelo servidor do Next.js, que envia
  a chave `x-hgc-key`. As políticas RLS só liberam as tabelas com essa chave.
- Login por código: sessão em cookie assinado (30 dias) e bloqueio de 15 min após
  5 tentativas erradas no mesmo IP.
- O portal do cliente (`/p/<token>`) usa só as funções `portal_get`,
  `portal_create_request` e `portal_comment`, que validam o token. Notas internas
  nunca aparecem no portal.
