"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getClient } from "@/lib/client";

const str = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").trim();
  return v === "" ? null : v;
};

const author = (f: FormData) => (f.get("author") === "cliente" ? "cliente" : "hgc");

/* ---------- Cliente ---------- */

export async function updateClientAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const client = await getClient(supabase);
  const { error } = await supabase
    .from("clients")
    .update({
      name: str(formData, "name") ?? client.name,
      company: str(formData, "company"),
      whatsapp: str(formData, "whatsapp"),
      system_name: str(formData, "system_name"),
      system_url: str(formData, "system_url"),
    })
    .eq("id", client.id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  redirect("/configuracoes?salvo=1");
}

/* ---------- Demandas ---------- */

export async function createRequestAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const client = await getClient(supabase);
  const hours = str(formData, "estimate_hours");
  const who = author(formData);
  const { data, error } = await supabase
    .from("requests")
    .insert({
      client_id: client.id,
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
  await supabase.from("request_updates").insert({
    request_id: data.id,
    body: "Solicitação registrada.",
    status_to: "recebida",
    author: who,
  });
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
  } else {
    await supabase.from("requests").update({ updated_at: new Date().toISOString() }).eq("id", id);
  }
  const { error } = await supabase.from("request_updates").insert({
    request_id: id,
    body,
    status_to: changed ? status : null,
    author: author(formData),
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
