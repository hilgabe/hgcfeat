/* eslint-disable @next/next/no-img-element */
export function Brand({ dark = true }: { dark?: boolean }) {
  return (
    <span className="brand">
      <img src={dark ? "/hgc-mark-white.png" : "/hgc-mark.png"} alt="HGC" />
      <span className="brand-name" style={dark ? undefined : { color: "var(--ink)" }}>
        HGC <span>Demandas</span>
      </span>
    </span>
  );
}
