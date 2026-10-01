/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { STATUS, TYPES, code, type RequestType, type Status } from "@/lib/types";
import { PriorityTag, Progress, StatusChip } from "@/components/StatusChip";
import { Brand } from "@/components/Brand";
import { SubmitButton } from "@/components/SubmitButton";
import { portalCommentAction, portalCreateAction } from "./actions";

export const metadata = { title: "Acompanhamento" };

type PortalRequest = {
  id: string;
  number: number;
  title: string;
  description: string | null;
  type: RequestType;
  priority: string;
  status: Status;
  due_date: string | null;
  delivered_url: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  updates: { body: string | null; status_to: Status | null; author: string; created_at: string }[];
};

type Portal = {
  client: {
    name: string;
    company: string | null;
    system_name: string | null;
    system_url: string | null;
    allow_client_requests: boolean;
  };
  requests: PortalRequest[];
};

export default async function PortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ enviada?: string; erro?: string; comentario?: string }>;
}) {
  const { token } = await params;
  const { enviada, erro, comentario } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.rpc("portal_get", { p_token: token });
  const portal = data as Portal | null;
  if (!portal) notFound();

  const { client, requests } = portal;
  const open = requests.filter((r) => r.status !== "entregue" && r.status !== "cancelada");
  const done = requests.filter((r) => r.status === "entregue");
  const canceled = requests.filter((r) => r.status === "cancelada");
  const create = portalCreateAction.bind(null, token);

  return (
    <>
      <header className="portal-hero">
        <div className="inner">
          <Brand />
          <h1>Olá, {client.name.split(" ")[0]}!</h1>
          <p className="muted" style={{ margin: "6px 0 0" }}>
            Aqui você acompanha suas solicitações
            {client.system_name ? (
              <>
                {" "}do{" "}
                {client.system_url ? (
                  <a href={client.system_url} target="_blank" rel="noreferrer" style={{ color: "#fff", textDecoration: "underline" }}>
                    {client.system_name}
                  </a>
                ) : (
                  <strong style={{ color: "#fff" }}>{client.system_name}</strong>
                )}
              </>
            ) : null}
            . {open.length} em andamento · {done.length} entregue{done.length === 1 ? "" : "s"}.
          </p>
        </div>
      </header>

      <main className="portal">
        {enviada && (
          <div className="notice notice-ok">
            Solicitação {code(Number(enviada))} enviada! Em breve ela entra em análise.
          </div>
        )}
        {comentario && <div className="notice notice-ok">Mensagem enviada.</div>}
        {erro && (
          <div className="notice notice-err">
            {erro === "limite"
              ? "Muitas solicitações em pouco tempo. Tente novamente mais tarde."
              : "Não foi possível enviar. Confira os campos e tente de novo."}
          </div>
        )}

        <Section title="Em andamento" items={open} token={token} empty="Nenhuma solicitação em andamento." />
        {done.length > 0 && <Section title="Entregues" items={done} token={token} />}
        {canceled.length > 0 && <Section title="Canceladas" items={canceled} token={token} />}

        {client.allow_client_requests && (
          <div className="card" style={{ marginTop: 28 }} id="nova">
            <h2>Nova solicitação</h2>
            <form action={create}>
              <div className="field">
                <label htmlFor="title">O que você precisa? *</label>
                <input
                  id="title"
                  name="title"
                  required
                  minLength={3}
                  maxLength={160}
                  className="input"
                  placeholder="Ex.: Adicionar botão de orçamento na página inicial"
                />
              </div>
              <div className="field">
                <label htmlFor="description">Detalhes</label>
                <textarea
                  id="description"
                  name="description"
                  maxLength={4000}
                  className="textarea"
                  placeholder="Onde fica, como deve funcionar, algum exemplo…"
                />
              </div>
              <div className="field">
                <label htmlFor="type">Tipo</label>
                <select id="type" name="type" className="select" defaultValue="funcionalidade">
                  {Object.entries(TYPES).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <SubmitButton pendingText="Enviando…">Enviar solicitação</SubmitButton>
            </form>
          </div>
        )}
      </main>

      <footer className="footer">
        <img src="/hgc-mark.png" alt="" />
        HGC · Desenvolvimento sob medida
      </footer>
    </>
  );
}

function Section({
  title,
  items,
  token,
  empty,
}: {
  title: string;
  items: PortalRequest[];
  token: string;
  empty?: string;
}) {
  return (
    <section style={{ marginBottom: 24 }}>
      <p className="eyebrow" style={{ marginBottom: 10 }}>{title}</p>
      {items.length === 0 && empty && <div className="card empty">{empty}</div>}
      {items.map((r) => (
        <details key={r.id} id={r.id} className="card portal-item">
          <summary>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div className="code">{code(r.number)}</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{r.title}</div>
                <div className="small muted" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {TYPES[r.type]} · aberta em {fmtDate(r.created_at)}
                  {r.due_date && r.status !== "entregue" ? ` · previsão ${fmtDate(r.due_date)}` : ""}
                  {r.delivered_at && r.status === "entregue" ? ` · entregue em ${fmtDate(r.delivered_at)}` : ""}
                  <PriorityTag priority={r.priority} />
                </div>
              </div>
              <StatusChip status={r.status} />
            </div>
            <Progress status={r.status} />
            <div className="small muted">{STATUS[r.status].hint} · ver detalhes</div>
          </summary>

          {r.description && <p className="prewrap" style={{ marginTop: 0 }}>{r.description}</p>}
          {r.delivered_url && (
            <p>
              <a href={r.delivered_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary">
                Ver entrega →
              </a>
            </p>
          )}

          {r.updates.length > 0 && (
            <ul className="timeline" style={{ marginTop: 12 }}>
              {r.updates.map((u, i) => (
                <li
                  key={i}
                  style={{ ["--c" as string]: u.status_to ? `var(--s-${u.status_to})` : "var(--line)" }}
                >
                  <div className="meta">
                    <span>{fmtDateTime(u.created_at)}</span>
                    <span>· {u.author === "cliente" ? "Você" : "HGC"}</span>
                    {u.status_to && <StatusChip status={u.status_to} />}
                  </div>
                  {u.body && <div className="body">{u.body}</div>}
                </li>
              ))}
            </ul>
          )}

          {r.status !== "cancelada" && (
            <form action={portalCommentAction.bind(null, token, r.id)} style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input
                name="body"
                required
                maxLength={2000}
                className="input"
                placeholder={r.status === "revisao" ? "Aprovado? Algum ajuste?" : "Escreva uma mensagem…"}
              />
              <SubmitButton className="btn" pendingText="Enviando…">Enviar</SubmitButton>
            </form>
          )}
        </details>
      ))}
    </section>
  );
}
