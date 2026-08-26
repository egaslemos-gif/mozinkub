"use client";

import { FormEvent, useState } from "react";
import { createGalleryMedia, uploadMedia } from "@/app/admin/actions";

export function GalleryMediaForm({ albumId }: { albumId: string }) {
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg("");
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await uploadMedia(fd);
      if (!res.ok) {
        setMsg(res.error || "Falha no upload");
        return;
      }
      setUrl(res.url);
      setMsg("Imagem carregada.");
    } catch {
      setMsg("Erro de rede ao carregar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!url) {
      setMsg("Carregue uma imagem primeiro.");
      return;
    }
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("url", url);
    await createGalleryMedia(fd);
    form.reset();
    setUrl("");
    setMsg("Fotografia adicionada.");
    window.location.reload();
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 grid gap-2 border-t border-border pt-3">
      <input type="hidden" name="albumId" value={albumId} />
      <input className="admin-input" name="title" placeholder="Legenda (opcional)" />
      <input type="file" accept="image/*" onChange={onFileChange} disabled={uploading} />
      {msg && <p className="text-xs text-muted">{msg}</p>}
      <button className="btn-primary !py-2 text-sm" disabled={uploading || !url}>
        {uploading ? "A carregar…" : "Adicionar foto"}
      </button>
    </form>
  );
}
