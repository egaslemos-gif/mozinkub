"use client";

import { useEffect, useState } from "react";
import { FilePicker } from "@/components/FilePicker";
import { uploadAdminFile } from "@/lib/client-upload";
import { toAppMediaUrl } from "@/lib/media-url";

export function ImageUploadField({
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
  const [url, setUrl] = useState(toAppMediaUrl(defaultUrl) || defaultUrl || "");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setUrl(toAppMediaUrl(defaultUrl) || defaultUrl || "");
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
      setMsg("Imagem carregada. Guarde o formulário para aplicar.");
    } catch {
      setError("Erro de rede ao carregar a imagem. Tente novamente.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="admin-label">{label}</label>
      {hint && <p className="mb-2 text-xs text-muted">{hint}</p>}
      <p className="mb-2 text-xs text-muted">Formatos: JPG, PNG, WEBP, SVG · máx. 10 MB</p>
      <input type="hidden" name={name} value={url} />
      <FilePicker
        accept="image/*,.svg"
        onChange={onFileChange}
        disabled={uploading}
        buttonLabel="Escolher imagem"
      />
      {uploading && <p className="mt-1 text-xs text-muted">A carregar…</p>}
      {msg && <p className="mt-1 text-xs text-primary">{msg}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="mt-2 max-h-20 w-auto object-contain" />
      )}
    </div>
  );
}
