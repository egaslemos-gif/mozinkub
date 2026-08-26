"use client";

import { FormEvent, useState } from "react";
import { createHeroSlide, uploadMedia } from "@/app/admin/actions";

export function SlideUploadForm() {
  const [imageUrl, setImageUrl] = useState("");
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
      setImageUrl(res.url);
      setMsg("Imagem carregada.");
    } catch {
      setMsg("Erro de rede ao carregar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!imageUrl) {
      setMsg("Carregue uma imagem primeiro.");
      return;
    }
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("imageUrl", imageUrl);
    await createHeroSlide(fd);
    form.reset();
    setImageUrl("");
    setMsg("Slide publicado.");
    window.location.reload();
  }

  return (
    <form onSubmit={onSubmit} className="card-surface mb-6 grid gap-3 p-5">
      <h2 className="font-display text-xl font-semibold">Novo destaque (slide)</h2>
      <input className="admin-input" name="title" placeholder="Título" required />
      <input className="admin-input" name="subtitle" placeholder="Subtítulo / texto curto" />
      <input className="admin-input" name="linkUrl" placeholder="Link (ex: /projectos ou /actividades/...)" />
      <input className="admin-input" name="order" type="number" placeholder="Ordem" defaultValue={0} />
      <div>
        <label className="admin-label">Fotografia</label>
        <input type="file" accept="image/*" onChange={onFileChange} />
        {imageUrl && <p className="mt-1 text-xs text-primary">{imageUrl}</p>}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked /> Publicado
      </label>
      {msg && <p className="text-sm text-muted">{msg}</p>}
      <button className="btn-primary" disabled={uploading || !imageUrl}>
        {uploading ? "A carregar…" : "Publicar slide"}
      </button>
    </form>
  );
}
