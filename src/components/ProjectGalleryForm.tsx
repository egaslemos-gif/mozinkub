"use client";

import { FormEvent, useState } from "react";
import { createProjectMedia, uploadMedia } from "@/app/admin/actions";

export function ProjectGalleryForm({ projectId }: { projectId: string }) {
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
      setMsg("Imagem carregada. Clique em Adicionar à galeria.");
    } catch {
      setMsg("Erro de rede ao carregar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!url) {
      setMsg("Carregue uma fotografia primeiro.");
      return;
    }
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("url", url);
    await createProjectMedia(fd);
    form.reset();
    setUrl("");
    setMsg("Fotografia adicionada.");
    window.location.reload();
  }

  return (
    <form onSubmit={onSubmit} className="card-surface grid gap-3 p-5">
      <h2 className="font-display text-xl font-semibold">Galeria</h2>
      <input type="hidden" name="projectId" value={projectId} />
      <input className="admin-input" name="title" placeholder="Legenda (opcional)" />
      <div>
        <label className="admin-label">Fotografia</label>
        <input type="file" accept="image/*" onChange={onFileChange} disabled={uploading} />
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="mt-2 max-h-24 w-auto object-cover" />
        )}
      </div>
      {msg && <p className="text-sm text-muted">{msg}</p>}
      <button className="btn-primary" disabled={uploading || !url}>
        {uploading ? "A carregar…" : "Adicionar à galeria"}
      </button>
    </form>
  );
}
