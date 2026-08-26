"use client";

import { FormEvent, useState } from "react";
import { submitContactMessage } from "@/app/contact-actions";

export function ContactForm({
  projectSlug,
  projectName,
}: {
  projectSlug?: string;
  projectName?: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  const isProject = Boolean(projectSlug && projectName);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      const res = await submitContactMessage(fd);
      if (!res.ok) {
        setStatus("error");
        setError(res.error || "Não foi possível enviar.");
        return;
      }
      setStatus("ok");
      form.reset();
    } catch {
      setStatus("error");
      setError("Erro de rede. Tente novamente.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border border-border bg-white p-5 sm:p-6"
      aria-busy={status === "loading"}
    >
      <h3 className="font-display text-xl font-semibold text-foreground">
        {isProject ? `Contactar ${projectName}` : "Enviar mensagem"}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        {isProject
          ? "A coordenação da Antena da Beira encaminha o seu interesse para a equipa do projecto."
          : "Preencha o formulário — a coordenação responde com a maior brevidade possível."}
      </p>

      {projectSlug && <input type="hidden" name="projectSlug" value={projectSlug} />}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label className="admin-label">Nome completo</label>
          <input className="admin-input" name="name" placeholder="O seu nome" required />
        </div>
        <div className="sm:col-span-1">
          <label className="admin-label">Email</label>
          <input
            className="admin-input"
            name="email"
            type="email"
            placeholder="nome@exemplo.com"
            required
          />
        </div>
        <div className="sm:col-span-1">
          <label className="admin-label">Telefone / WhatsApp</label>
          <input className="admin-input" name="phone" placeholder="Opcional" />
        </div>
        <div className="sm:col-span-1">
          <label className="admin-label">Assunto</label>
          <input
            className="admin-input"
            name="subject"
            placeholder="Motivo do contacto"
            defaultValue={isProject ? `Interesse em ${projectName}` : ""}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="admin-label">Mensagem</label>
          <textarea
            className="admin-input min-h-32"
            name="message"
            placeholder={
              isProject
                ? "Como pode colaborar, encomendar ou apoiar este negócio…"
                : "Escreva a sua mensagem…"
            }
            required
          />
        </div>
      </div>

      {status === "ok" && (
        <p className="mt-3 border border-primary/30 bg-primary-soft px-3 py-2 text-sm font-medium text-primary">
          Mensagem enviada com sucesso.
        </p>
      )}
      {status === "error" && (
        <p className="mt-3 border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <button className="btn-primary mt-5 w-full sm:w-auto" disabled={status === "loading"}>
        {status === "loading" ? "A enviar…" : "Enviar pedido de contacto"}
      </button>
    </form>
  );
}
