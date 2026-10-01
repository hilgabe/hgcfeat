import { requireAdmin } from "@/lib/auth";
import { PRIORITIES, SOURCES, TYPES } from "@/lib/types";
import { AuthorPicker } from "@/components/AuthorPicker";
import { SubmitButton } from "@/components/SubmitButton";
import { createRequestAction } from "../../actions";

export const metadata = { title: "Nova demanda" };

export default async function NovaDemanda() {
  await requireAdmin();

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
            <label htmlFor="original_message">Mensagem original (WhatsApp)</label>
            <textarea
              id="original_message"
              name="original_message"
              className="textarea"
              placeholder="Cole aqui a mensagem do WhatsApp com o pedido…"
            />
            <span className="hint">Fica guardada como referência do pedido original.</span>
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
            <label htmlFor="description">Descrição</label>
            <textarea
              id="description"
              name="description"
              className="textarea"
              placeholder="O que será feito, onde e como deve funcionar."
            />
          </div>
        </div>

        <div className="card">
          <AuthorPicker />
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
