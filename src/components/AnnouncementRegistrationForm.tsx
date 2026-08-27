"use client";

import { FormEvent, useState } from "react";
import { submitAnnouncementRegistration } from "@/app/announcement-actions";

export function AnnouncementRegistrationForm({
  announcementId,
  title,
  closed = false,
}: {
  announcementId: string;
  title: string;
  closed?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  if (closed) {
    return (
      <div className="border border-border bg-white p-5">
        <h3 className="font-display text-xl font-semibold">Inscrições encerradas</h3>
        <p className="mt-2 text-sm text-muted">
          O prazo para se candidatar a «{title}» já terminou.
        </p>
      </div>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      const res = await submitAnnouncementRegistration(fd);
      if (!res.ok) {
        setStatus("error");
        setError(res.error);
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
      id="inscricao"
      onSubmit={onSubmit}
      className="scroll-mt-24 border border-border bg-white p-5 sm:p-6"
      aria-busy={status === "loading"}
    >
      <h3 className="font-display text-xl font-semibold">Inscrever-se</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        Candidate-se a «{title}». Os dados ficam registados na incubadora; quando o email
        destino estiver configurado, a coordenação também recebe notificação.
      </p>
      <input type="hidden" name="announcementId" value={announcementId} />

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="admin-label">Nome completo *</label>
          <input className="admin-input" name="name" required placeholder="O seu nome" />
        </div>
        <div>
          <label className="admin-label">Email *</label>
          <input
            className="admin-input"
            name="email"
            type="email"
            required
            placeholder="nome@exemplo.com"
          />
        </div>
        <div>
          <label className="admin-label">Telefone / WhatsApp</label>
          <input className="admin-input" name="phone" placeholder="Opcional" />
        </div>
        <div>
          <label className="admin-label">Instituição / Universidade</label>
          <input className="admin-input" name="organization" placeholder="Opcional" />
        </div>
        <div className="sm:col-span-2">
          <label className="admin-label">Perfil</label>
          <select className="admin-input" name="profile" defaultValue="">
            <option value="">Seleccione (opcional)</option>
            <option value="Estudante">Estudante</option>
            <option value="Recém-formado">Recém-formado</option>
            <option value="Profissional">Profissional</option>
            <option value="Outro">Outro</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="admin-label">Mensagem / motivação</label>
          <textarea
            className="admin-input min-h-[100px]"
            name="message"
            placeholder="Opcional — diga-nos porque quer participar"
          />
        </div>
      </div>

      {status === "ok" && (
        <p className="mt-4 text-sm font-medium text-primary" role="status">
          Inscrição recebida. Obrigado — a coordenação entrará em contacto.
        </p>
      )}
      {status === "error" && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button className="btn-primary mt-5" type="submit" disabled={status === "loading"}>
        {status === "loading" ? "A enviar…" : "Enviar inscrição"}
      </button>
    </form>
  );
}
