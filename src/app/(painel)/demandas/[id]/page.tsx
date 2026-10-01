import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { fmtDate, fmtDateTime, waLink } from "@/lib/format";
import { siteUrl } from "@/lib/site";
import { getClient } from "@/lib/client";
import { AuthorPicker } from "@/components/AuthorPicker";
import {
  AUTHORS,
  PRIORITIES,
  SOURCES,
  STATUS,
  STATUS_ORDER,
  TYPES,
  code,
  type Demand,
  type Update,
} from "@/lib/types";
import { Progress, StatusChip } from "@/components/StatusChip";
import { CopyButton } from "@/components/CopyButton";
import { ConfirmButton } from "@/components/ConfirmButton";
import { SubmitButton } from "@/components/SubmitButton";
import { addUpdateAction, deleteRequestAction, updateRequestAction } from "../../actions";

export default async function DemandaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: r } = await supabase
    .from("requests")
    .select("*")
    .eq("id", id)
    .maybeSingle<Demand>();
  if (!r) notFound();

  const { data: updates } = await supabase
    .from("request_updates")
    .select("*")
    .eq("request_id", id)
    .order("created_at", { ascending: false })
    .returns<Update[]>();

  const client = await getClient(supabase);
  const link = `${await siteUrl()}/demandas/${r.id}`;
  const lastNote = updates?.find((u) => u.author === "hgc" && u.body)?.body;
  const firstName = client.name.split(" ")[0];
  const message = [
    `Olá, ${firstName}! 👋`,
    ``,
    `Atualização da sua solicitação *${code(r.number)} — ${r.title}*`,
    `Status: *${STATUS[r.status].label}*`,
    lastNote ? `\n${lastNote}` : null,
    r.status === "entregue" && r.delivered_url ? `\nVeja aqui: ${r.delivered_url}` : null,
    ``,
    `Detalhes no painel: ${link}`,
    ``,
    `— HGC`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const update = updateRequestAction.bind(null, r.id);
  const addUpdate = addUpdateAction.bind(null, r.id);
  const remove = deleteRequestAction.bind(null, r.id);

  return (
    <>
      <div className="page-head">
        <div style={{ minWidth: 0 }}>
          <p className="eyebrow">
            <Link href="/">Demandas</Link> / {code(r.number)}
          </p>
          <h1>{r.title}</h1>
          <div className="small muted" style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <StatusChip status={r.status} />
            <span>{TYPES[r.type]}</span>
            <span>· via {SOURCES[r.source]}</span>
            <span>· aberta em {fmtDate(r.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div>
          <div className="card">
            <h2>Descrição</h2>
            {r.description ? (
              <p className="prewrap" style={{ margin: 0 }}>{r.description}</p>
            ) : (
              <p className="muted" style={{ margin: 0 }}>Sem descrição.</p>
            )}
            {r.original_message && (
              <>
                <h2 style={{ marginTop: 20 }}>Mensagem original</h2>
                <div className="quote">{r.original_message}</div>
              </>
            )}
            <Progress status={r.status} />
          </div>

          <div className="card">
            <h2>Registrar andamento</h2>
            <form action={addUpdate}>
              <div className="row">
                <div className="field">
                  <label htmlFor="status">Status</label>
                  <select id="status" name="status" className="select" defaultValue={r.status}>
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>{STATUS[s].label}</option>
                    ))}
                  </select>
                </div>
                <AuthorPicker />
              </div>
              <div className="field">
                <label htmlFor="body">Mensagem</label>
                <textarea
                  id="body"
                  name="body"
                  className="textarea"
                  placeholder="Ex.: Botão criado no ambiente de testes, falta só publicar."
                />
              </div>
              <SubmitButton>Salvar andamento</SubmitButton>
            </form>
          </div>

          <div className="card">
            <h2>Histórico</h2>
            {!updates?.length && <p className="muted">Sem registros.</p>}
            <ul className="timeline">
              {updates?.map((u) => (
                <li
                  key={u.id}
                  style={{ ["--c" as string]: u.status_to ? `var(--s-${u.status_to})` : "var(--line)" }}
                >
                  <div className="meta">
                    <span>{fmtDateTime(u.created_at)}</span>
                    <span>· {AUTHORS[u.author]}</span>
                    {u.status_to && <StatusChip status={u.status_to} />}
                  </div>
                  {u.body && <div className="body">{u.body}</div>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside>
          <div className="card">
            <h2>Avisar no WhatsApp</h2>
            <p className="small muted" style={{ marginTop: -6 }}>
              Mensagem pronta com o status atual e o link desta demanda.
            </p>
            <pre className="quote" style={{ margin: "0 0 12px", fontFamily: "inherit" }}>{message}</pre>
            <div className="btn-row">
              <CopyButton text={message} label="Copiar mensagem" className="btn btn-sm" />
              <a href={waLink(client.whatsapp, message)} target="_blank" rel="noreferrer" className="btn btn-sm btn-dark">
                Abrir no WhatsApp
              </a>
            </div>
          </div>

          <div className="card">
            <h2>Detalhes</h2>
            <form action={update}>
              <div className="field">
                <label htmlFor="e-title">Título</label>
                <input id="e-title" name="title" defaultValue={r.title} required className="input" />
              </div>
              <div className="field">
                <label htmlFor="e-desc">Descrição</label>
                <textarea id="e-desc" name="description" defaultValue={r.description ?? ""} className="textarea" />
              </div>
              <div className="row">
                <div className="field">
                  <label htmlFor="e-type">Tipo</label>
                  <select id="e-type" name="type" defaultValue={r.type} className="select">
                    {Object.entries(TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="e-prio">Prioridade</label>
                  <select id="e-prio" name="priority" defaultValue={r.priority} className="select">
                    {Object.entries(PRIORITIES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="field">
                  <label htmlFor="e-due">Prazo</label>
                  <input id="e-due" name="due_date" type="date" defaultValue={r.due_date ?? ""} className="input" />
                </div>
                <div className="field">
                  <label htmlFor="e-h">Estimativa (h)</label>
                  <input id="e-h" name="estimate_hours" defaultValue={r.estimate_hours ?? ""} className="input" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="e-url">Link da entrega</label>
                <input
                  id="e-url"
                  name="delivered_url"
                  type="url"
                  defaultValue={r.delivered_url ?? ""}
                  placeholder="https://"
                  className="input"
                />
              </div>
              <SubmitButton className="btn btn-block">Salvar detalhes</SubmitButton>
            </form>
          </div>

          <form action={remove} style={{ marginTop: 16, textAlign: "center" }}>
            <ConfirmButton
              message="Excluir esta demanda e todo o histórico? Não dá para desfazer."
              className="link-btn small"
              style={{ color: "#b3212b" }}
            >
              Excluir demanda
            </ConfirmButton>
          </form>
        </aside>
      </div>
    </>
  );
}
