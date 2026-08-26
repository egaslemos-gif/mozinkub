"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createHeroSlide, uploadMedia } from "@/app/admin/actions";
import { isActionResult } from "@/lib/action-result";

export function SlideUploadForm() {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setStatus("idle");
    setMsg("");
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await uploadMedia(fd);
      if (!res.ok) {
        setStatus("error");
        setMsg(res.error || "Falha no upload");
        return;
      }
      setImageUrl(res.url);
      setStatus("ok");
      setMsg("Imagem carregada.");
    } catch {
      setStatus("error");
      setMsg("Erro de rede ao carregar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!imageUrl) {
      setStatus("error");
      setMsg("Carregue uma imagem primeiro.");
      return;
    }
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("imageUrl", imageUrl);
    try {
      const res = await createHeroSlide(fd);
      if (isActionResult(res) && !res.ok) {
        setStatus("error");
        setMsg(res.error);
        return;
      }
      form.reset();
      setImageUrl("");
      setStatus("ok");
      setMsg((isActionResult(res) && res.ok && res.message) || "Slide publicado.");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Não foi possível publicar.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card-surface mb-6 grid gap-3 p-5">
      <h2 className="font-display text-xl font-semibold">Novo destaque (slide)</h2>
      {status === "ok" && (
        <div role="status" className="border border-primary/30 bg-primary-soft px-3 py-2 text-sm font-medium text-primary">
          {msg}
        </div>
      )}
      {status === "error" && (
        <div role="alert" className="border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {msg}
        </div>
      )}
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
      <button className="btn-primary" disabled={uploading || !imageUrl}>
        {uploading ? "A carregar…" : "Publicar slide"}
      </button>
    </form>
  );
}
