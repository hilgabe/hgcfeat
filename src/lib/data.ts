import "server-only";
import { db } from "@/lib/db";
import type { Client, Demand, Status, Update } from "@/lib/types";

// Coleções: clients, requests (+ subcoleção updates), login_attempts, meta/counters.
const CLIENT_ID = "gm-sports";

const now = () => new Date().toISOString();

/* ---------- Cliente ---------- */

// A plataforma atende um cliente: a GM Sports. O registro é criado na primeira leitura.
export async function getClient(): Promise<Client> {
  const ref = db().collection("clients").doc(CLIENT_ID);
  const snap = await ref.get();
  if (snap.exists) return { id: snap.id, ...(snap.data() as Omit<Client, "id">) };
  const seed: Omit<Client, "id"> = {
    name: "GM Sports FC",
    company: "GM Sports FC — Escolinha",
    whatsapp: null,
    system_name: "GM Sports Gestão",
    system_url: "https://gm-sports-gestao.vercel.app",
    created_at: now(),
  };
  await ref.set(seed);
  return { id: CLIENT_ID, ...seed };
}

export async function updateClient(data: Partial<Omit<Client, "id" | "created_at">>) {
  await getClient();
  await db().collection("clients").doc(CLIENT_ID).update(data);
}

/* ---------- Demandas ---------- */

type NewDemand = Pick<
  Demand,
  | "title"
  | "description"
  | "original_message"
  | "type"
  | "priority"
  | "source"
  | "due_date"
  | "estimate_hours"
>;

const toDemand = (id: string, d: FirebaseFirestore.DocumentData) => ({ id, ...d }) as Demand;

export async function listRequests(): Promise<Demand[]> {
  const snap = await db().collection("requests").get();
  return snap.docs
    .map((d) => toDemand(d.id, d.data()))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getRequest(id: string): Promise<Demand | null> {
  const snap = await db().collection("requests").doc(id).get();
  return snap.exists ? toDemand(snap.id, snap.data()!) : null;
}

export async function createRequest(
  input: NewDemand,
  author: Update["author"],
): Promise<string> {
  const client = await getClient();
  const firestore = db();
  const ref = firestore.collection("requests").doc();
  const counter = firestore.collection("meta").doc("counters");
  const ts = now();

  await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(counter);
    const number = ((snap.data()?.requests as number | undefined) ?? 0) + 1;
    tx.set(counter, { requests: number }, { merge: true });
    tx.set(ref, {
      ...input,
      number,
      client_id: client.id,
      status: "recebida",
      delivered_url: null,
      delivered_at: null,
      created_at: ts,
      updated_at: ts,
    });
    tx.set(ref.collection("updates").doc(), {
      body: "Solicitação registrada.",
      status_to: "recebida",
      author,
      created_at: ts,
    });
  });
  return ref.id;
}

export async function updateRequest(
  id: string,
  data: Pick<Demand, "title" | "description" | "due_date" | "estimate_hours" | "delivered_url"> &
    Partial<Pick<Demand, "type" | "priority">>,
) {
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  await db()
    .collection("requests")
    .doc(id)
    .update({ ...clean, updated_at: now() });
}

export async function listUpdates(requestId: string): Promise<Update[]> {
  const snap = await db().collection("requests").doc(requestId).collection("updates").get();
  return snap.docs
    .map((d) => ({ id: d.id, request_id: requestId, ...d.data() }) as Update)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function addUpdate(
  id: string,
  input: { status: Status | null; body: string | null; author: Update["author"] },
) {
  const ref = db().collection("requests").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return;
  const changed = !!input.status && input.status !== snap.data()!.status;
  if (!changed && !input.body) return;

  const ts = now();
  const patch: Record<string, unknown> = { updated_at: ts };
  if (changed) {
    patch.status = input.status;
    if (input.status === "entregue") patch.delivered_at = ts;
  }
  const batch = db().batch();
  batch.update(ref, patch);
  batch.set(ref.collection("updates").doc(), {
    body: input.body,
    status_to: changed ? input.status : null,
    author: input.author,
    created_at: ts,
  });
  await batch.commit();
}

export async function deleteRequest(id: string) {
  const firestore = db();
  await firestore.recursiveDelete(firestore.collection("requests").doc(id));
}

/* ---------- Tentativas de login (limite por IP) ---------- */

export async function countLoginFails(ip: string, windowMs: number): Promise<number> {
  const snap = await db().collection("login_attempts").where("ip", "==", ip).get();
  const since = Date.now() - windowMs;
  return snap.docs.filter((d) => (d.data().created_at as number) >= since).length;
}

export async function addLoginFail(ip: string) {
  await db().collection("login_attempts").add({
    ip,
    created_at: Date.now(),
    // Permite configurar um TTL no Firestore para limpar tentativas antigas.
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
}

export async function clearLoginFails(ip: string) {
  const snap = await db().collection("login_attempts").where("ip", "==", ip).get();
  if (snap.empty) return;
  const batch = db().batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
