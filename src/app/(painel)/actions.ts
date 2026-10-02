"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  addUpdate,
  createRequest,
  deleteRequest,
  getClient,
  updateClient,
  updateRequest,
} from "@/lib/data";
import {
  PRIORITIES,
  SOURCES,
  STATUS,
  TYPES,
  type Priority,
  type RequestType,
  type Source,
  type Status,
} from "@/lib/types";

const str = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").trim();
  return v === "" ? null : v;
};

// Aceita só valores conhecidos; qualquer outra coisa cai no padrão.
const pick = <T extends string>(f: FormData, k: string, allowed: Record<T, unknown>, fallback: T): T => {
  const v = str(f, k);
  return v && v in allowed ? (v as T) : fallback;
};

const hours = (f: FormData) => {
  const v = str(f, "estimate_hours");
  const n = v ? Number(v.replace(",", ".")) : NaN;
  return Number.isFinite(n) ? n : null;
};

const author = (f: FormData) => (f.get("author") === "cliente" ? "cliente" : "hgc");

/* ---------- Cliente ---------- */

export async function updateClientAction(formData: FormData) {
  await requireAdmin();
  const client = await getClient();
  await updateClient({
    name: str(formData, "name") ?? client.name,
    company: str(formData, "company"),
    whatsapp: str(formData, "whatsapp"),
    system_name: str(formData, "system_name"),
    system_url: str(formData, "system_url"),
  });
  revalidatePath("/", "layout");
  redirect("/configuracoes?salvo=1");
}

/* ---------- Demandas ---------- */

export async function createRequestAction(formData: FormData) {
  await requireAdmin();
  const id = await createRequest(
    {
      title: str(formData, "title") ?? "Sem título",
      description: str(formData, "description"),
      original_message: str(formData, "original_message"),
      type: pick<RequestType>(formData, "type", TYPES, "funcionalidade"),
      priority: pick<Priority>(formData, "priority", PRIORITIES, "media"),
      source: pick<Source>(formData, "source", SOURCES, "whatsapp"),
      due_date: str(formData, "due_date"),
      estimate_hours: hours(formData),
    },
    author(formData),
  );
  revalidatePath("/");
  redirect(`/demandas/${id}`);
}

export async function updateRequestAction(id: string, formData: FormData) {
  await requireAdmin();
  await updateRequest(id, {
    title: str(formData, "title") ?? "Sem título",
    description: str(formData, "description"),
    type: pick<RequestType>(formData, "type", TYPES, "funcionalidade"),
    priority: pick<Priority>(formData, "priority", PRIORITIES, "media"),
    due_date: str(formData, "due_date"),
    estimate_hours: hours(formData),
    delivered_url: str(formData, "delivered_url"),
  });
  revalidatePath(`/demandas/${id}`);
  revalidatePath("/");
}

export async function addUpdateAction(id: string, formData: FormData) {
  await requireAdmin();
  const status = str(formData, "status");
  await addUpdate(id, {
    status: status && status in STATUS ? (status as Status) : null,
    body: str(formData, "body"),
    author: author(formData),
  });
  revalidatePath(`/demandas/${id}`);
  revalidatePath("/");
}

export async function deleteRequestAction(id: string) {
  await requireAdmin();
  await deleteRequest(id);
  revalidatePath("/");
  redirect("/");
}
