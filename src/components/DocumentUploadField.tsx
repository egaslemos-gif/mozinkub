"use client";

import { useEffect, useState } from "react";
import { uploadAdminFile } from "@/lib/client-upload";

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
}

export function DocumentUploadField({
  name,
  label,
  defaultUrl = "",
  hint,
}: {
  name: string;
  label: string;
  defaultUrl?: string | null;
  hint?: string;
}) {
  const [url, setUrl] = useState(defaultUrl || "");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setUrl(defaultUrl || "");
  }, [defaultUrl]);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg("");
    setError("");
    try {
      const res = await uploadAdminFile(file);
      if (!res.ok) {
        setError(res.error);
        e.target.value = "";
        return;
      }
      setUrl(res.url);
      setMsg("Ficheiro oficial carregado. Guarde o formulário para publicar.");
    } catch {
      setError("Erro de rede ao carregar o ficheiro.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-border bg-[#f7faf8] p-4">
      <label className="admin-label">{label}</label>
      <p className="mb-2 text-xs text-muted">
        {hint || "PDF ou imagem (JPG/PNG) do edital oficial · máx. 10 MB"}
      </p>
      <input type="hidden" name={name} value={url} />
      <input
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png"
        onChange={onFileChange}
        disabled={uploading}
      />
      {uploading && <p className="mt-1 text-xs text-muted">A carregar…</p>}
      {msg && <p className="mt-1 text-xs text-primary">{msg}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {url && (
        <div className="mt-3 space-y-2">
          {isImageUrl(url) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt="Pré-visualização do edital"
              className="max-h-40 w-auto rounded-lg border border-border object-contain"
            />
          ) : null}
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm font-semibold text-primary"
          >
            Ver ficheiro anexado →
          </a>
        </div>
      )}
    </div>
  );
}
