"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Image from "next/image";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(form.get("email")),
      password: String(form.get("password")),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Credenciais inválidas.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="site-shell grid min-h-screen place-items-center px-4">
      <form onSubmit={onSubmit} className="card-surface w-full max-w-md overflow-hidden">
        <div className="brand-stripe" />
        <div className="p-8">
          <div className="mb-5 flex items-center justify-center gap-3">
            <Image src="/logos/mozinkub.png" alt="MozInkub" width={48} height={48} unoptimized />
            <Image src="/logos/unilicungo.png" alt="UniLicungo" width={56} height={56} unoptimized />
            <Image
              src="/logos/embaixada-franca.png"
              alt="Embaixada de França"
              width={72}
              height={48}
              unoptimized
            />
          </div>
          <p className="text-center text-xs font-bold tracking-[0.16em] text-primary uppercase">
            IEUL Admin
          </p>
          <h1 className="font-display mt-2 text-center text-3xl font-semibold">
            Área da coordenação
          </h1>
          <p className="mt-2 text-center text-sm text-muted">
            Aceda para gerir projectos, eventos, editais e conteúdos do site.
          </p>

          <label className="admin-label mt-6">Email</label>
          <input
            className="admin-input"
            name="email"
            type="email"
            required
            defaultValue="coordenacao@ieul.ul.ac.mz"
          />

          <label className="admin-label mt-4">Password</label>
          <input className="admin-input" name="password" type="password" required />

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button className="btn-primary mt-6 w-full" disabled={loading}>
            {loading ? "A entrar…" : "Entrar"}
          </button>
        </div>
      </form>
    </div>
  );
}
