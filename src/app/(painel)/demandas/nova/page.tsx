import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { PRIORITIES, SOURCES, TYPES } from "@/lib/types";
import { SubmitButton } from "@/components/SubmitButton";
import { createRequestAction } from "../../actions";

export const metadata = { title: "Nova demanda" };

export default async function NovaDemanda({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data: clients } = await supabase.from("clients").select("id, name, company").order("name");

  if (!clients?.length) {
    return (
      <div className="card empty">
        <p>Cadastre um cliente antes de registrar demandas.</p>
        <Link href="/clientes" className="btn btn-primary">Cadastrar cliente</Link>
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Demandas</p>
          <h1>Nova demanda</h1>
        </div>
      </div>

      <form action={createRequestAction} className="grid-2">
        <div className="card">
          <div className="field">
            <label htmlFor="original_message">Mensagem do cliente</label>
            <textarea
              id="original_message"
              name="original_message"
              className="textarea"
              placeholder="Cole aqui o que o cliente mandou no WhatsApp…"
            />
            <span className="hint">Fica guardada como referência do pedido original (só você vê).</span>
          </div>
          <div className="field">
            <label htmlFor="title">Título da demanda *</label>
            <input
              id="title"
              name="title"
              required
              maxLength={160}
              className="input"
              placeholder="Ex.: Botão de WhatsApp na página de produtos"
            />
          </div>
          <div className="field">
            <label htmlFor="description">Descrição (o cliente vê)</label>
            <textarea
              id="description"
              name="description"
              className="textarea"
              placeholder="O que será feito, onde e como deve funcionar."
            />
          </div>
        </div>

        <div className="card">
          <div className="field">
            <label htmlFor="client_id">Cliente *</label>
            <select id="client_id" name="client_id" required className="select" defaultValue={cliente ?? ""}>
              <option value="" disabled>Selecione…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.company ? ` — ${c.company}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="type">Tipo</label>
            <select id="type" name="type" className="select" defaultValue="funcionalidade">
              {Object.entries(TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="priority">Prioridade</label>
              <select id="priority" name="priority" className="select" defaultValue="media">
                {Object.entries(PRIORITIES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="source">Origem</label>
              <select id="source" name="source" className="select" defaultValue="whatsapp">
                {Object.entries(SOURCES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="due_date">Prazo</label>
              <input id="due_date" name="due_date" type="date" className="input" />
            </div>
            <div className="field">
              <label htmlFor="estimate_hours">Estimativa (h)</label>
              <input id="estimate_hours" name="estimate_hours" inputMode="decimal" className="input" />
            </div>
          </div>
          <SubmitButton className="btn btn-primary btn-block">Registrar demanda</SubmitButton>
        </div>
      </form>
    </>
  );
}
