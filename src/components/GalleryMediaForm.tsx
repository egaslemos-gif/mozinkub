"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createGalleryMedia, updateGalleryMedia } from "@/app/admin/actions";
import { isActionResult } from "@/lib/action-result";
import { uploadAdminFile } from "@/lib/client-upload";
import { galleryMediaKind } from "@/lib/gallery";

type EditMedia = {
  id: string;
  title?: string | null;
  description?: string | null;
  url: string;
  type?: string | null;
};

export function GalleryMediaForm({
  albumId,
  media,
  onDone,
}: {
  albumId: string;
  media?: EditMedia;
  onDone?: () => void;
}) {
  const router = useRouter();
  const editing = Boolean(media?.id);
  const [url, setUrl] = useState(media?.url || "");
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
      const res = await uploadAdminFile(file);
      if (!res.ok) {
        setStatus("error");
        setMsg(res.error);
        return;
      }
      setUrl(res.url);
      setStatus("ok");
      setMsg("Ficheiro carregado.");
    } catch {
      setStatus("error");
      setMsg("Erro de rede ao carregar o ficheiro.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!url) {
      setStatus("error");
      setMsg("Carregue uma fotografia ou vídeo primeiro.");
      return;
    }
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("url", url);
    fd.set("type", galleryMediaKind(url));
    if (media?.id) fd.set("id", media.id);
    try {
      const res = editing ? await updateGalleryMedia(fd) : await createGalleryMedia(fd);
      if (isActionResult(res) && !res.ok) {
        setStatus("error");
        setMsg(res.error);
        return;
      }
      if (!editing) {
        form.reset();
        setUrl("");
      }
      setStatus("ok");
      setMsg(
        (isActionResult(res) && res.ok && res.message) ||
          (editing ? "Legenda actualizada." : "Média adicionada."),
      );
      router.refresh();
      onDone?.();
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Não foi possível guardar.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={
        editing
          ? "mt-2 grid gap-2 border-t border-border pt-2"
          : "mt-3 grid gap-2 border-t border-border pt-3"
      }
    >
      <input type="hidden" name="albumId" value={albumId} />
      {status === "ok" && (
        <div
          role="status"
          className="border border-primary/30 bg-primary-soft px-3 py-2 text-xs font-medium text-primary"
        >
          {msg}
        </div>
      )}
      {status === "error" && (
        <div
          role="alert"
          className="border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
        >
          {msg}
        </div>
      )}
      <input
        className="admin-input"
        name="title"
        placeholder="Legenda (ex: Stand IEUL na FACIM)"
        defaultValue={media?.title || ""}
        required={!editing}
      />
      <textarea
        className="admin-input min-h-16"
        name="description"
        placeholder="Informação ao passar o cursor (local, data, contexto…)"
        defaultValue={media?.description || ""}
      />
      {!editing && (
        <div>
          <label className="admin-label">Fotografia ou vídeo</label>
          <input
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            onChange={onFileChange}
            disabled={uploading}
          />
          {url && (
            <p className="mt-1 truncate text-[10px] text-primary">{url}</p>
          )}
        </div>
      )}
      {editing && (
        <p className="text-[10px] text-muted">
          A editar legendas. Para substituir o ficheiro, remova e adicione de novo.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary !py-2 text-sm" disabled={uploading || !url} type="submit">
          {uploading
            ? "A carregar…"
            : editing
              ? "Guardar legendas"
              : "Adicionar à galeria"}
        </button>
        {editing && onDone && (
          <button type="button" className="btn-ghost !py-2 text-sm" onClick={onDone}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
