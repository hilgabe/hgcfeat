import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { fmtDate, waLink } from "@/lib/format";
import { siteUrl } from "@/lib/site";
import { code, type Client, type Demand } from "@/lib/types";
import { StatusChip } from "@/components/StatusChip";
import { CopyButton } from "@/components/CopyButton";
import { ConfirmButton } from "@/components/ConfirmButton";
import { SubmitButton } from "@/components/SubmitButton";
import { regenerateTokenAction, updateClientAction } from "../../actions";
import { ClientFields } from "../ClientFields";

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: c } = await supabase.from("clients").select("*").eq("id", id).maybeSingle<Client>();
  if (!c) notFound();
  const { data: requests } = await supabase
    .from("requests")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false })
    .returns<Demand[]>();

  const portal = `${await siteUrl()}/p/${c.share_token}`;
  const invite = [
    `Olá, ${c.name.split(" ")[0]}! 👋`,
    ``,
    `Criei um espaço para você acompanhar todas as solicitações${c.system_name ? ` do ${c.system_name}` : ""}: o que está em andamento, o que já foi entregue e o histórico de cada pedido.`,
    c.allow_client_requests ? `Por lá você também pode enviar novas solicitações.` : null,
    ``,
    portal,
    ``,
    `— HGC`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">
            <Link href="/clientes">Clientes</Link>
          </p>
          <h1>{c.name}</h1>
          <p className="muted small" style={{ margin: "4px 0 0" }}>
            {[c.company, c.system_name].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Link href={`/demandas/nova?cliente=${c.id}`} className="btn btn-primary">
          + Nova demanda
        </Link>
      </div>

      <div className="grid-2">
        <div className="card card-flush">
          {!requests?.length && <div className="empty">Nenhuma demanda para este cliente.</div>}
          {requests?.map((r) => (
            <Link
              key={r.id}
              href={`/demandas/${r.id}`}
              className="list-row"
              style={{ gridTemplateColumns: "92px minmax(0,1fr) 170px 80px" }}
            >
              <span className="code">{code(r.number)}</span>
              <span className="list-title">{r.title}</span>
              <span><StatusChip status={r.status} /></span>
              <span className="hide-sm small muted">{fmtDate(r.due_date)}</span>
            </Link>
          ))}
        </div>

        <aside>
          <div className="card">
            <h2>Link do cliente</h2>
            <p className="small muted" style={{ marginTop: -6 }}>
              Quem tiver este link vê as demandas deste cliente.
            </p>
            <div className="share-box">
              <code>{portal}</code>
              <CopyButton text={portal} />
            </div>
            <div className="btn-row" style={{ marginTop: 12 }}>
              <a href={portal} target="_blank" rel="noreferrer" className="btn btn-sm">Abrir portal</a>
              <a href={waLink(c.whatsapp, invite)} target="_blank" rel="noreferrer" className="btn btn-sm btn-dark">
                Enviar no WhatsApp
              </a>
            </div>
            <form action={regenerateTokenAction.bind(null, c.id)} style={{ marginTop: 12 }}>
              <ConfirmButton
                message="Gerar um novo link? O link atual deixa de funcionar."
                className="link-btn small"
              >
                Gerar novo link
              </ConfirmButton>
            </form>
          </div>

          <div className="card">
            <h2>Dados do cliente</h2>
            <form action={updateClientAction.bind(null, c.id)}>
              <ClientFields c={c} />
              <label className="check" style={{ marginBottom: 14 }}>
                <input type="checkbox" name="allow_client_requests" defaultChecked={c.allow_client_requests} />
                Cliente pode abrir solicitações pelo portal
              </label>
              <SubmitButton className="btn btn-block">Salvar</SubmitButton>
            </form>
          </div>
        </aside>
      </div>
    </>
  );
}
