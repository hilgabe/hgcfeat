import "server-only";
import { createClient as createSupabase } from "@supabase/supabase-js";

// Acesso ao banco só pelo servidor. O cabeçalho x-hgc-key é conferido pelas
// políticas RLS (função public.has_app_key) — nunca vai para o navegador.
export async function createClient() {
  return createSupabase(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-hgc-key": process.env.HGC_DB_KEY! } },
  });
}
