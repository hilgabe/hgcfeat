import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { Brand } from "@/components/Brand";
import { SubmitButton } from "@/components/SubmitButton";
import { createClient } from "@/lib/supabase/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionValue,
  isValidSession,
  safeEqual,
} from "@/lib/session";

export const metadata = { title: "Entrar" };

const MAX_FAILS = 5;
const WINDOW_MIN = 15;

async function enter(formData: FormData) {
  "use server";
  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const supabase = await createClient();

  const since = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString();
  const { count } = await supabase
    .from("login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", since);
  if ((count ?? 0) >= MAX_FAILS) redirect("/login?erro=bloqueado");

  const expected = process.env.ACCESS_CODE ?? "";
  if (!expected || !safeEqual(code, expected)) {
    await supabase.from("login_attempts").insert({ ip });
    redirect("/login?erro=codigo");
  }

  await supabase.from("login_attempts").delete().eq("ip", ip);
  (await cookies()).set(SESSION_COOKIE, await createSessionValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  if (await isValidSession((await cookies()).get(SESSION_COOKIE)?.value)) redirect("/");
  const { erro } = await searchParams;
  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <Brand dark={false} />
        <h1 style={{ fontSize: 22 }}>Demandas GM Sports</h1>
        <p className="muted small" style={{ marginTop: 6 }}>
          Acompanhamento das solicitações do sistema GM Sports. Digite o código de acesso.
        </p>
        {erro && (
          <div className="notice notice-err">
            {erro === "bloqueado"
              ? `Muitas tentativas. Aguarde ${WINDOW_MIN} minutos e tente de novo.`
              : "Código incorreto."}
          </div>
        )}
        <form action={enter}>
          <div className="field">
            <label htmlFor="code">Código de acesso</label>
            <input
              id="code"
              name="code"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              required
              autoFocus
              className="input"
              style={{ fontSize: 22, letterSpacing: "0.4em", textAlign: "center" }}
            />
          </div>
          <SubmitButton className="btn btn-primary btn-block" pendingText="Entrando…">Entrar</SubmitButton>
        </form>
      </div>
    </main>
  );
}
