import { requireAdmin } from "@/lib/auth";
import { getClient } from "@/lib/data";
import { siteUrl } from "@/lib/site";
import { CopyButton } from "@/components/CopyButton";
import { SubmitButton } from "@/components/SubmitButton";
import { updateClientAction } from "../actions";

export const metadata = { title: "Configurações" };

export default async function Configuracoes({
  searchParams,
}: {
  searchParams: Promise<{ salvo?: string }>;
}) {
  const { salvo } = await searchParams;
  await requireAdmin();
  const c = await getClient();
  const url = await siteUrl();

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">{c.name}</p>
          <h1>Configurações</h1>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Dados do cliente</h2>
          {salvo && <div className="notice notice-ok">Dados salvos.</div>}
          <form action={updateClientAction}>
            <div className="row">
              <div className="field">
                <label htmlFor="name">Nome</label>
                <input id="name" name="name" required defaultValue={c.name} className="input" />
              </div>
              <div className="field">
                <label htmlFor="company">Razão / descrição</label>
                <input id="company" name="company" defaultValue={c.company ?? ""} className="input" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="whatsapp">WhatsApp do contato</label>
              <input
                id="whatsapp"
                name="whatsapp"
                defaultValue={c.whatsapp ?? ""}
                placeholder="(98) 99999-9999"
                inputMode="tel"
                className="input"
              />
              <span className="hint">Usado no botão “Abrir no WhatsApp” das demandas.</span>
            </div>
            <div className="row">
              <div className="field">
                <label htmlFor="system_name">Sistema</label>
                <input id="system_name" name="system_name" defaultValue={c.system_name ?? ""} className="input" />
              </div>
              <div className="field">
                <label htmlFor="system_url">Endereço do sistema</label>
                <input
                  id="system_url"
                  name="system_url"
                  type="url"
                  placeholder="https://"
                  defaultValue={c.system_url ?? ""}
                  className="input"
                />
              </div>
            </div>
            <SubmitButton>Salvar</SubmitButton>
          </form>
        </div>

        <aside className="card">
          <h2>Acesso ao painel</h2>
          <p className="small muted" style={{ marginTop: -6 }}>
            Envie este endereço para a GM Sports. A entrada é pelo código de acesso.
          </p>
          <div className="share-box">
            <code>{url}</code>
            <CopyButton text={url} />
          </div>
          <p className="small muted" style={{ marginBottom: 0 }}>
            Para trocar o código, altere a variável <code>ACCESS_CODE</code> na Vercel.
          </p>
        </aside>
      </div>
    </>
  );
}
