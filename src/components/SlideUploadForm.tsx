"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createHeroSlide, updateHeroSlide } from "@/app/admin/actions";
import { isActionResult } from "@/lib/action-result";
import { uploadAdminFile } from "@/lib/client-upload";

type SlideFields = {
  id?: string;
  title?: string;
  subtitle?: string | null;
  linkUrl?: string | null;
  order?: number;
  published?: boolean;
  imageUrl?: string;
};

export function SlideUploadForm({
  slide,
  onCancel,
}: {
  slide?: SlideFields;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const editing = Boolean(slide?.id);
  const [imageUrl, setImageUrl] = useState(slide?.imageUrl || "");
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
    if (slide?.id) fd.set("id", slide.id);
    try {
      const res = editing ? await updateHeroSlide(fd) : await createHeroSlide(fd);
      if (isActionResult(res) && !res.ok) {
        setStatus("error");
        setMsg(res.error);
        return;
      }
      if (!editing) {
        form.reset();
        setImageUrl("");
      }
      setStatus("ok");
      setMsg(
        (isActionResult(res) && res.ok && res.message) ||
          (editing ? "Slide actualizado." : "Slide publicado."),
      );
      router.refresh();
      onCancel?.();
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
          ? "mt-3 grid gap-3 border-t border-border pt-3"
          : "card-surface mb-6 grid gap-3 p-5"
      }
    >
      {!editing && (
        <h2 className="font-display text-xl font-semibold">Novo destaque (slide)</h2>
      )}
      {status === "ok" && (
        <div
          role="status"
          className="border border-primary/30 bg-primary-soft px-3 py-2 text-sm font-medium text-primary"
        >
          {msg}
        </div>
      )}
      {status === "error" && (
        <div
          role="alert"
          className="border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
        >
          {msg}
        </div>
      )}
      <input
        className="admin-input"
        name="title"
        placeholder="Título"
        required
        defaultValue={slide?.title || ""}
      />
      <input
        className="admin-input"
        name="subtitle"
        placeholder="Subtítulo / texto curto"
        defaultValue={slide?.subtitle || ""}
      />
      <input
        className="admin-input"
        name="linkUrl"
        placeholder="Link (ex: /projectos ou /actividades/...)"
        defaultValue={slide?.linkUrl || ""}
      />
      <input
        className="admin-input"
        name="order"
        type="number"
        placeholder="Ordem"
        defaultValue={slide?.order ?? 0}
      />
      <div>
        <label className="admin-label">Fotografia</label>
        <input type="file" accept="image/*" onChange={onFileChange} disabled={uploading} />
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="mt-2 max-h-24 w-auto object-cover" />
        )}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="published"
          defaultChecked={slide?.published ?? true}
        />{" "}
        Publicado
      </label>
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" disabled={uploading || !imageUrl} type="submit">
          {uploading
            ? "A carregar…"
            : editing
              ? "Guardar alterações"
              : "Publicar slide"}
        </button>
        {editing && onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
