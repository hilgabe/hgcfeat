# HGC Demandas — GM Sports

Painel da HGC para registrar e acompanhar as **demandas de desenvolvimento sob medida**
(change requests) da **GM Sports FC** — melhorias e ajustes no sistema GM Sports Gestão,
que normalmente chegam pelo WhatsApp.

## Como funciona

- **Entrada por código de acesso** — o mesmo código para a HGC e para a GM Sports.
- **Demandas** — registre o pedido (colando a mensagem original do WhatsApp), defina tipo,
  prioridade e prazo, e acompanhe pelo fluxo:
  Recebida → Em análise → Em desenvolvimento → Para aprovação → Entregue (ou Cancelada).
- **Andamento** — cada atualização registra quem escreveu (HGC ou GM Sports).
- **Avisar no WhatsApp** — mensagem pronta com status e link da demanda.
- **Configurações** — dados do cliente, WhatsApp do contato e link do painel.

## Stack

Next.js 16 (App Router) · Supabase (Postgres + Auth + RLS) · Vercel.

## Configuração

1. Crie um projeto no Supabase e rode os SQLs de `supabase/migrations/` em ordem.
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
