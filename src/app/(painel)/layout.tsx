import Link from "next/link";
import { Brand } from "@/components/Brand";
import { requireAdmin } from "@/lib/auth";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/">
            <Brand />
          </Link>
          <nav className="nav">
            <Link href="/">Demandas</Link>
            <Link href="/configuracoes">Configurações</Link>
          </nav>
          <form action="/auth/sair" method="post">
            <button className="link-btn" type="submit">Sair</button>
          </form>
        </div>
      </header>
      <main className="container">{children}</main>
    </>
  );
}
