"use client";
import { useEffect, useState } from "react";

const KEY = "hgc-author";

// Quem está usando o painel (o código de acesso é o mesmo para os dois).
export function AuthorPicker() {
  const [who, setWho] = useState<"hgc" | "cliente">("hgc");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "cliente" || saved === "hgc") setWho(saved);
    } catch {}
  }, []);
  const pick = (v: "hgc" | "cliente") => {
    setWho(v);
    try {
      localStorage.setItem(KEY, v);
    } catch {}
  };
  return (
    <div className="field">
      <span className="label">Quem está registrando?</span>
      <div className="segmented">
        {(["hgc", "cliente"] as const).map((v) => (
          <label key={v} className={who === v ? "on" : ""}>
            <input type="radio" name="author" value={v} checked={who === v} onChange={() => pick(v)} />
            {v === "hgc" ? "HGC" : "GM Sports"}
          </label>
        ))}
      </div>
    </div>
  );
}
