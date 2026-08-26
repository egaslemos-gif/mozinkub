"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createProjectMedia, uploadMedia } from "@/app/admin/actions";
import { isActionResult } from "@/lib/action-result";

export function ProjectGalleryForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
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
      setUrl(res.url);
      setStatus("ok");
      setMsg("Imagem carregada. Clique em Adicionar à galeria.");
    } catch {
      setStatus("error");
      setMsg("Erro de rede ao carregar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!url) {
      setStatus("error");
      setMsg("Carregue uma fotografia primeiro.");
      return;
    }
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("url", url);
    try {
      const res = await createProjectMedia(fd);
      if (isActionResult(res) && !res.ok) {
        setStatus("error");
        setMsg(res.error);
        return;
      }
      form.reset();
      setUrl("");
      setStatus("ok");
      setMsg((isActionResult(res) && res.ok && res.message) || "Fotografia adicionada.");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Não foi possível adicionar.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card-surface grid gap-3 p-5">
      <h2 className="font-display text-xl font-semibold">Galeria</h2>
      <input type="hidden" name="projectId" value={projectId} />
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
      <input className="admin-input" name="title" placeholder="Legenda (opcional)" />
      <div>
        <label className="admin-label">Fotografia</label>
        <input type="file" accept="image/*" onChange={onFileChange} disabled={uploading} />
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="mt-2 max-h-24 w-auto object-cover" />
        )}
      </div>
      <button className="btn-primary" disabled={uploading || !url}>
        {uploading ? "A carregar…" : "Adicionar à galeria"}
      </button>
    </form>
  );
}
