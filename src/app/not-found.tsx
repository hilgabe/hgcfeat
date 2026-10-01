import { Brand } from "@/components/Brand";

export default function NotFound() {
  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <Brand dark={false} />
        <h1 style={{ fontSize: 22 }}>Página não encontrada</h1>
        <p className="muted">Confira o endereço ou volte para a página inicial.</p>
      </div>
    </main>
  );
}
