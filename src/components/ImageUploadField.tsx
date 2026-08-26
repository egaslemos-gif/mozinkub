"use client";

import { useState } from "react";
import { uploadMedia } from "@/app/admin/actions";

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
  const [url, setUrl] = useState(defaultUrl || "");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg("");
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadMedia(fd);
    setUploading(false);
    if (!res.ok) {
      setMsg(res.error || "Falha no upload");
      return;
    }
    setUrl(res.url);
    setMsg("Imagem carregada.");
  }

  return (
    <div>
      <label className="admin-label">{label}</label>
      {hint && <p className="mb-2 text-xs text-muted">{hint}</p>}
      <input type="hidden" name={name} value={url} />
      <input type="file" accept="image/*,.svg" onChange={onFileChange} disabled={uploading} />
      {uploading && <p className="mt-1 text-xs text-muted">A carregar…</p>}
      {msg && <p className="mt-1 text-xs text-primary">{msg}</p>}
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="mt-2 max-h-20 w-auto object-contain" />
      )}
    </div>
  );
}
