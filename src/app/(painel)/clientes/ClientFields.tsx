import type { Client } from "@/lib/types";

export function ClientFields({ c }: { c?: Client }) {
  return (
    <>
      <div className="field">
        <label htmlFor="name">Nome do contato *</label>
        <input id="name" name="name" required defaultValue={c?.name} className="input" />
      </div>
      <div className="field">
        <label htmlFor="company">Empresa</label>
        <input id="company" name="company" defaultValue={c?.company ?? ""} className="input" />
      </div>
      <div className="field">
        <label htmlFor="whatsapp">WhatsApp</label>
        <input
          id="whatsapp"
          name="whatsapp"
          defaultValue={c?.whatsapp ?? ""}
          placeholder="(98) 99999-9999"
          inputMode="tel"
          className="input"
        />
      </div>
      <div className="row">
        <div className="field">
          <label htmlFor="system_name">Sistema / site</label>
          <input id="system_name" name="system_name" defaultValue={c?.system_name ?? ""} className="input" />
        </div>
        <div className="field">
          <label htmlFor="system_url">Endereço</label>
          <input
            id="system_url"
            name="system_url"
            type="url"
            placeholder="https://"
            defaultValue={c?.system_url ?? ""}
            className="input"
          />
        </div>
      </div>
    </>
  );
}
