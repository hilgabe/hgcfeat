import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Client } from "@/lib/types";

// A plataforma atende um cliente: a GM Sports (primeiro registro da tabela clients).
export async function getClient(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at")
    .limit(1)
    .maybeSingle<Client>();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Cliente não cadastrado. Rode supabase/migrations/0002_gm_sports.sql.");
  return data;
}
