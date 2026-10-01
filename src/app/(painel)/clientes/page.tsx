import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { createClientAction } from "../actions";
import { ClientFields } from "./ClientFields";

export const metadata = { title: "Clientes" };

type Row = {
  id: string;
  name: string;
  company: string | null;
  system_name: string | null;
  requests: { status: string }[];
};

export default async function Clientes() {
  const { supabase } = await requireAdmin();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, company, system_name, requests(status)")
    .order("name")
    .returns<Row[]>();

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Painel</p>
          <h1>Clientes</h1>
        </div>
      </div>
      <div className="grid-2">
        <div className="card card-flush">
          {!clients?.length && <div className="empty">Nenhum cliente cadastrado ainda.</div>}
          {clients?.map((c) => {
            const open = c.requests.filter(
              (r) => r.status !== "entregue" && r.status !== "cancelada",
            ).length;
            return (
              <Link
                key={c.id}
                href={`/clientes/${c.id}`}
                className="list-row"
                style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}
              >
                <span style={{ minWidth: 0 }}>
                  <div className="list-title">{c.name}</div>
                  <div className="small muted">
                    {[c.company, c.system_name].filter(Boolean).join(" · ") || "—"}
                  </div>
                </span>
                <span className="small muted">
                  {open} em aberto · {c.requests.length} no total
                </span>
              </Link>
            );
          })}
        </div>
        <div className="card">
          <h2>Novo cliente</h2>
          <form action={createClientAction}>
            <ClientFields />
            <SubmitButton className="btn btn-primary btn-block">Cadastrar cliente</SubmitButton>
          </form>
        </div>
      </div>
    </>
  );
}
