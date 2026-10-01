"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

const str = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").trim();
  return v === "" ? null : v;
};

/* ---------- Clientes ---------- */

export async function createClientAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: str(formData, "name") ?? "Sem nome",
      company: str(formData, "company"),
      whatsapp: str(formData, "whatsapp"),
      system_name: str(formData, "system_name"),
      system_url: str(formData, "system_url"),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/clientes");
  redirect(`/clientes/${data.id}`);
}

export async function updateClientAction(id: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("clients")
    .update({
      name: str(formData, "name") ?? "Sem nome",
      company: str(formData, "company"),
      whatsapp: str(formData, "whatsapp"),
      system_name: str(formData, "system_name"),
      system_url: str(formData, "system_url"),
      allow_client_requests: formData.get("allow_client_requests") === "on",
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${id}`);
}

export async function regenerateTokenAction(id: string) {
  const { supabase } = await requireAdmin();
  const token = Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const { error } = await supabase.from("clients").update({ share_token: token }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${id}`);
}

/* ---------- Demandas ---------- */

export async function createRequestAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const hours = str(formData, "estimate_hours");
  const { data, error } = await supabase
    .from("requests")
    .insert({
      client_id: str(formData, "client_id"),
      title: str(formData, "title") ?? "Sem título",
      description: str(formData, "description"),
      original_message: str(formData, "original_message"),
      type: str(formData, "type") ?? "funcionalidade",
      priority: str(formData, "priority") ?? "media",
      source: str(formData, "source") ?? "whatsapp",
      due_date: str(formData, "due_date"),
      estimate_hours: hours ? Number(hours.replace(",", ".")) : null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await supabase
    .from("request_updates")
    .insert({ request_id: data.id, body: "Solicitação registrada.", status_to: "recebida" });
  revalidatePath("/");
  redirect(`/demandas/${data.id}`);
}

export async function updateRequestAction(id: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const hours = str(formData, "estimate_hours");
  const { error } = await supabase
    .from("requests")
    .update({
      title: str(formData, "title") ?? "Sem título",
      description: str(formData, "description"),
      type: str(formData, "type"),
      priority: str(formData, "priority"),
      due_date: str(formData, "due_date"),
      estimate_hours: hours ? Number(hours.replace(",", ".")) : null,
      delivered_url: str(formData, "delivered_url"),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/demandas/${id}`);
  revalidatePath("/");
}

export async function addUpdateAction(id: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const status = str(formData, "status");
  const body = str(formData, "body");
  const { data: current } = await supabase.from("requests").select("status").eq("id", id).single();
  const changed = status && current && status !== current.status;
  if (!changed && !body) return;

  if (changed) {
    const { error } = await supabase.from("requests").update({ status }).eq("id", id);
    if (error) throw new Error(error.message);
  }
  const { error } = await supabase.from("request_updates").insert({
    request_id: id,
    body,
    status_to: changed ? status : null,
    public: formData.get("private") !== "on",
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/demandas/${id}`);
  revalidatePath("/");
}

export async function deleteRequestAction(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("requests").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  redirect("/");
}
