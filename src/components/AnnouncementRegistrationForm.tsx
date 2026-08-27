"use client";

import { FormEvent, useState } from "react";
import { submitAnnouncementRegistration } from "@/app/announcement-actions";

type Attachment = { url: string; name: string };

const MAX_FILES = 3;
const MAX_BYTES = 8 * 1024 * 1024;

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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);

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

  async function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    const room = MAX_FILES - attachments.length;
    if (room <= 0) {
      setStatus("error");
      setError(`Máximo de ${MAX_FILES} anexos.`);
      return;
    }

    setUploading(true);
    setStatus("idle");
    setError("");
    const next: Attachment[] = [...attachments];

    try {
      for (const file of files.slice(0, room)) {
        if (file.size > MAX_BYTES) {
          setStatus("error");
          setError(`«${file.name}» excede 8 MB.`);
          break;
        }
        const fd = new FormData();
        fd.set("file", file);
        const res = await fetch("/api/registration/upload", {
          method: "POST",
          body: fd,
        });
        const data = (await res.json().catch(() => null)) as
          | { ok: true; url: string; name: string }
          | { ok: false; error: string }
          | null;
        if (!res.ok || !data || !data.ok) {
          setStatus("error");
          setError(
            (data && "error" in data && data.error) ||
              `Falha ao carregar «${file.name}».`,
          );
          break;
        }
        next.push({ url: data.url, name: data.name });
      }
      setAttachments(next);
    } catch {
      setStatus("error");
      setError("Erro de rede ao carregar o anexo.");
    } finally {
      setUploading(false);
    }
  }

  function removeAttachment(url: string) {
    setAttachments((list) => list.filter((a) => a.url !== url));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("attachmentsJson", JSON.stringify(attachments));
    try {
      const res = await submitAnnouncementRegistration(fd);
      if (!res.ok) {
        setStatus("error");
        setError(res.error);
        return;
      }
      setStatus("ok");
      setAttachments([]);
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
      aria-busy={status === "loading" || uploading}
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
        <div className="sm:col-span-2">
          <label className="admin-label">Anexos (opcional)</label>
          <p className="mb-2 text-xs text-muted">
            PDF, DOC, DOCX ou imagem — até {MAX_FILES} ficheiros, máx. 8 MB cada. Ex.: CV,
            carta de motivação, comprovativo.
          </p>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
            multiple
            disabled={uploading || attachments.length >= MAX_FILES}
            onChange={onFilesSelected}
          />
          {uploading && <p className="mt-1 text-xs text-muted">A carregar anexo…</p>}
          {attachments.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm">
              {attachments.map((a) => (
                <li
                  key={a.url}
                  className="flex flex-wrap items-center justify-between gap-2 border border-border bg-[#f8faf9] px-3 py-2"
                >
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-primary hover:underline"
                  >
                    {a.name}
                  </a>
                  <button
                    type="button"
                    className="text-xs text-red-700 hover:underline"
                    onClick={() => removeAttachment(a.url)}
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
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

      <button
        className="btn-primary mt-5"
        type="submit"
        disabled={status === "loading" || uploading}
      >
        {status === "loading" ? "A enviar…" : "Enviar inscrição"}
      </button>
    </form>
  );
}
