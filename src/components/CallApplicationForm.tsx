"use client";

import { FormEvent, useState } from "react";
import { submitCallApplication } from "@/app/editais/actions";

export function CallApplicationForm({
  callId,
  callTitle,
}: {
  callId: string;
  callTitle: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      const res = await submitCallApplication(fd);
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
    <form onSubmit={onSubmit} className="card-surface grid gap-3 p-6" encType="multipart/form-data">
      <h3 className="font-display text-xl font-semibold">Submeter candidatura</h3>
      <p className="text-sm text-muted">
        Candidate o seu projecto a <strong>{callTitle}</strong>. Anexe a proposta em PDF (máx. 12
        MB).
      </p>
      <input type="hidden" name="callId" value={callId} />
      <input className="admin-input" name="projectTitle" placeholder="Nome do projecto" required />
      <input className="admin-input" name="area" placeholder="Área / sector" required />
      <input className="admin-input" name="leaderName" placeholder="Nome do líder / proponente" required />
      <input className="admin-input" name="email" type="email" placeholder="Email" required />
      <input className="admin-input" name="phone" placeholder="Telefone / WhatsApp" />
      <input className="admin-input" name="team" placeholder="Equipa (opcional)" />
      <textarea
        className="admin-input min-h-28"
        name="summary"
        placeholder="Resumo do projecto (problema, solução, impacto)"
        required
      />
      <div>
        <label className="admin-label">Proposta / formulário (PDF)</label>
        <input
          className="admin-input"
          type="file"
          name="document"
          accept=".pdf,.doc,.docx,application/pdf"
          required
        />
      </div>
      {status === "ok" && (
        <p className="text-sm font-medium text-primary">
          Candidatura recebida. A coordenação confirmará por email.
        </p>
      )}
      {status === "error" && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary" disabled={status === "loading"}>
        {status === "loading" ? "A enviar…" : "Enviar candidatura"}
      </button>
    </form>
  );
}
