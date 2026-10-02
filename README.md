# HGC Feat — GM Sports

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

Next.js 16 (App Router) · Firebase Firestore (Admin SDK) · Vercel.

## Configuração

1. No [Firebase Console](https://console.firebase.google.com), crie um projeto e ative o **Firestore** (modo produção).
2. Publique as regras fechadas: `firebase deploy --only firestore:rules` (arquivo `firestore.rules`).
3. Em *Configurações do projeto → Contas de serviço*, gere uma chave privada (JSON).
4. Variáveis de ambiente na Vercel (veja `.env.example`): `FIREBASE_PROJECT_ID`,
   `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `ACCESS_CODE` (código da tela de login)
   e `SESSION_SECRET`.

O cliente GM Sports é criado automaticamente no primeiro acesso.

```bash
npm install
npm run dev
```

## Segurança

- O navegador nunca fala com o Firebase: tudo passa pelo servidor do Next.js (Admin SDK).
  As regras do Firestore bloqueiam qualquer acesso direto de cliente.
- Login por código: sessão em cookie assinado (30 dias) e bloqueio de 15 min após
  5 tentativas erradas no mesmo IP.
