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
    <form onSubmit={onSubmit} className="card-surface grid gap-3 p-5">
      <h3 className="font-display text-lg font-semibold">
        {isProject ? `Contactar ${projectName}` : "Enviar mensagem"}
      </h3>
      <p className="text-sm text-muted">
        {isProject
          ? "A coordenação da Antena da Beira encaminha o seu interesse para a equipa do projecto."
          : "Preencha o formulário e a coordenação entrará em contacto."}
      </p>
      {projectSlug && <input type="hidden" name="projectSlug" value={projectSlug} />}
      <input className="admin-input" name="name" placeholder="Nome completo" required />
      <input className="admin-input" name="email" type="email" placeholder="Email" required />
      <input className="admin-input" name="phone" placeholder="Telefone / WhatsApp (opcional)" />
      <input
        className="admin-input"
        name="subject"
        placeholder="Assunto"
        defaultValue={isProject ? `Interesse em ${projectName}` : ""}
        required
      />
      <textarea
        className="admin-input min-h-28"
        name="message"
        placeholder={
          isProject
            ? "Como pode colaborar, encomendar ou apoiar este negócio…"
            : "Mensagem"
        }
        required
      />
      {status === "ok" && (
        <p className="text-sm font-medium text-primary">Mensagem enviada com sucesso.</p>
      )}
      {status === "error" && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary" disabled={status === "loading"}>
        {status === "loading" ? "A enviar…" : "Enviar pedido de contacto"}
      </button>
    </form>
  );
}
