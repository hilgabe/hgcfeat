import { STATUS, type Status } from "@/lib/types";

export function StatusChip({ status }: { status: Status }) {
  return (
    <span className="chip" style={{ ["--c" as string]: `var(--s-${status})` }}>
      <span className="dot" />
      {STATUS[status].label}
    </span>
  );
}

export function PriorityTag({ priority }: { priority: string }) {
  if (priority !== "alta" && priority !== "urgente") return null;
  return <span className={`tag tag-${priority}`}>{priority === "alta" ? "Alta" : "Urgente"}</span>;
}

const FLOW = ["recebida", "analise", "desenvolvimento", "revisao", "entregue"];

export function Progress({ status }: { status: Status }) {
  if (status === "cancelada") return null;
  const idx = FLOW.indexOf(status);
  return (
    <div className={`steps${status === "entregue" ? " done" : ""}`} aria-hidden>
      {FLOW.map((s, i) => (
        <span key={s} className={i <= idx ? "on" : ""} />
      ))}
    </div>
  );
}
