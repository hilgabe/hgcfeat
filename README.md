# HGC Demandas

Plataforma da HGC para registrar e acompanhar **demandas de desenvolvimento sob medida**
(change requests / feature requests) que chegam dos clientes — normalmente pelo WhatsApp —
e compartilhar o andamento com cada cliente por um link.

## Como funciona

- **Painel (HGC)** — login por link mágico no e-mail. Cadastre clientes, registre demandas
  (colando a mensagem original do WhatsApp), mude o status e registre o andamento.
- **Avisar o cliente** — cada demanda gera uma mensagem pronta com status + link,
  para copiar ou abrir direto no WhatsApp do cliente.
- **Portal do cliente** (`/p/<token>`) — o cliente vê as demandas dele, o histórico,
  aprova/comenta e pode abrir novas solicitações. Sem login: o acesso é pelo link.

Fluxo de status: Recebida → Em análise → Em desenvolvimento → Para aprovação → Entregue (ou Cancelada).

## Stack

Next.js 16 (App Router) · Supabase (Postgres + Auth + RLS) · Vercel.

## Configuração

1. Crie um projeto no Supabase e rode os SQLs de `supabase/migrations/` em ordem.
2. Em **Authentication → URL Configuration**, defina o *Site URL* com a URL da Vercel e
   adicione `https://SEU-DOMINIO/auth/callback` em *Redirect URLs*.
3. Variáveis de ambiente (veja `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `ADMIN_EMAILS` — e-mails que podem entrar no painel (também precisam estar na tabela `admins`).

```bash
npm install
npm run dev
```

## Segurança

Todas as tabelas têm RLS: só e-mails na tabela `admins` leem/escrevem.
O portal do cliente acessa os dados apenas pelas funções `portal_get`, `portal_create_request`
e `portal_comment`, que validam o token do cliente. Notas marcadas como internas nunca
aparecem no portal.
