import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { STATUS, STATUS_ORDER, TYPES, code, type Demand, type Status } from "@/lib/types";
import { PriorityTag, StatusChip } from "@/components/StatusChip";

type Row = Demand & { clients: { name: string } | null };

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; cliente?: string }>;
}) {
  const { status, cliente } = await searchParams;
  const { supabase } = await requireAdmin();

  const [{ data: all }, { data: clients }] = await Promise.all([
    supabase
      .from("requests")
      .select("*, clients(name)")
      .order("updated_at", { ascending: false })
      .returns<Row[]>(),
    supabase.from("clients").select("id, name").order("name"),
  ]);

  const rows = all ?? [];
  const counts = Object.fromEntries(
    STATUS_ORDER.map((s) => [s, rows.filter((r) => r.status === s).length]),
  ) as Record<Status, number>;

  const active = !status || status === "abertas";
  const filtered = rows.filter((r) => {
    if (cliente && r.client_id !== cliente) return false;
    if (active) return r.status !== "entregue" && r.status !== "cancelada";
    if (status === "todas") return true;
    return r.status === status;
  });

  const href = (s?: string) => {
    const p = new URLSearchParams();
    if (s) p.set("status", s);
    if (cliente) p.set("cliente", cliente);
    const q = p.toString();
    return q ? `/?${q}` : "/";
  };

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Painel</p>
          <h1>Demandas</h1>
        </div>
        <Link href="/demandas/nova" className="btn btn-primary">
          + Nova demanda
        </Link>
      </div>

      <div className="stats">
        {(["recebida", "analise", "desenvolvimento", "revisao", "entregue"] as Status[]).map((s) => (
          <Link key={s} href={href(s)} className={`stat${status === s ? " active" : ""}`}>
            <div className="stat-num">{counts[s]}</div>
            <div className="stat-label" style={{ ["--c" as string]: `var(--s-${s})` }}>
              <span className="dot" />
              {STATUS[s].label}
            </div>
          </Link>
        ))}
      </div>

      <form className="filters" method="get">
        <select name="status" defaultValue={status ?? "abertas"} className="select">
          <option value="abertas">Em aberto</option>
          <option value="todas">Todas</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS[s].label}
            </option>
          ))}
        </select>
        <select name="cliente" defaultValue={cliente ?? ""} className="select">
          <option value="">Todos os clientes</option>
          {clients?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button className="btn btn-sm" style={{ height: 36 }}>Filtrar</button>
      </form>

      <div className="card card-flush">
        <div className="list-row list-head">
          <span>Código</span>
          <span>Demanda</span>
          <span className="hide-sm">Cliente</span>
          <span>Status</span>
          <span className="hide-sm">Prazo</span>
        </div>
        {filtered.length === 0 && (
          <div className="empty">
            {rows.length === 0 ? (
              <>
                Nenhuma demanda ainda.{" "}
                <Link href="/demandas/nova" className="link-btn">Registrar a primeira</Link>
              </>
            ) : (
              "Nada por aqui com esse filtro."
            )}
          </div>
        )}
        {filtered.map((r) => (
          <Link key={r.id} href={`/demandas/${r.id}`} className="list-row">
            <span className="code">{code(r.number)}</span>
            <span style={{ minWidth: 0 }}>
              <div className="list-title">{r.title}</div>
              <div className="small muted" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {TYPES[r.type]} <PriorityTag priority={r.priority} />
              </div>
            </span>
            <span className="hide-sm small">{r.clients?.name}</span>
            <span><StatusChip status={r.status} /></span>
            <span className="hide-sm small muted">{fmtDate(r.due_date)}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
