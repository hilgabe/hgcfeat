import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export function isAllowedEmail(email: string | undefined | null) {
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return !!email && allowed.includes(email.toLowerCase());
}

export async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  if (!isAllowedEmail(data.user.email)) redirect("/login?erro=acesso");
  return { supabase, user: data.user };
}
