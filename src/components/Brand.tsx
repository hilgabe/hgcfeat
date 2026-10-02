/* eslint-disable @next/next/no-img-element */
export function Brand({ dark = true }: { dark?: boolean }) {
  return (
    <span className="brand">
      <img src={dark ? "/hgc-mark-white.png" : "/hgc-mark.png"} alt="HGC" />
      <span className="brand-name" style={dark ? undefined : { color: "var(--ink)" }}>
        HGC <span>Feat</span>
      </span>
      <span className="brand-sep" aria-hidden />
      <img src="/gm-sports-logo.png" alt="GM Sports FC" className="client-logo" />
    </span>
  );
}
