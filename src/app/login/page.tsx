import { redirect } from "next/navigation";
import { Brand } from "@/components/Brand";
import { SubmitButton } from "@/components/SubmitButton";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/auth";
import { siteUrl } from "@/lib/site";

export const metadata = { title: "Entrar" };

async function sendLink(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!isAllowedEmail(email)) redirect("/login?erro=acesso");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${await siteUrl()}/auth/callback` },
  });
  if (error) redirect(`/login?erro=${encodeURIComponent(error.message)}`);
  redirect("/login?enviado=1");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; enviado?: string }>;
}) {
  const { erro, enviado } = await searchParams;
  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <Brand dark={false} />
        <h1 style={{ fontSize: 22 }}>Entrar no painel</h1>
        <p className="muted small" style={{ marginTop: 6 }}>
          Enviaremos um link de acesso para o seu e-mail.
        </p>
        {enviado && (
          <div className="notice notice-ok">Link enviado! Confira sua caixa de entrada.</div>
        )}
        {erro && (
          <div className="notice notice-err">
            {erro === "acesso"
              ? "Este e-mail não tem acesso ao painel."
              : erro === "link"
                ? "Link inválido ou expirado. Peça um novo."
                : erro}
          </div>
        )}
        <form action={sendLink}>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" required className="input" autoComplete="email" />
          </div>
          <SubmitButton className="btn btn-primary btn-block">Receber link de acesso</SubmitButton>
        </form>
      </div>
    </main>
  );
}
