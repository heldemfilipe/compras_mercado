import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <img src="/icon.svg" alt="" className="h-16 w-16" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          Compras de Mercado
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Controle privado das compras do mês.
        </p>
      </div>

      {configured ? (
        <Suspense>
          <LoginForm />
        </Suspense>
      ) : (
        <div className="card border-negative/40">
          <p className="text-sm font-medium text-negative">
            Configuração pendente
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            Defina <code className="text-ink">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
            <code className="text-ink">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no
            arquivo <code className="text-ink">.env.local</code> (ou nas
            variáveis da Vercel) e reinicie. Veja o{" "}
            <code className="text-ink">README.md</code>.
          </p>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-ink-faint">
        As contas são criadas pelo administrador. Não há cadastro aberto.
      </p>
    </main>
  );
}
