const tz = "America/Fortaleza";

export function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value);
  return d.toLocaleDateString("pt-BR", { timeZone: tz, day: "2-digit", month: "short" });
}

export function fmtDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    timeZone: tz,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function waLink(phone: string | null, text: string) {
  const digits = (phone ?? "").replace(/\D/g, "");
  const num = digits && digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}
