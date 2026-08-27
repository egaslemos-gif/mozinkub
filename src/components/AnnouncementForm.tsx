"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createAnnouncement,
  updateAnnouncement,
} from "@/app/admin/actions";
import { isActionResult } from "@/lib/action-result";
import { ANNOUNCEMENT_TYPES } from "@/lib/announcements";
import { uploadAdminFile } from "@/lib/client-upload";
import { toAppMediaUrl } from "@/lib/media-url";

type Fields = {
  id?: string;
  title?: string;
  summary?: string;
  type?: string;
  imageUrl?: string;
  linkUrl?: string | null;
  linkLabel?: string | null;
  featured?: boolean;
  published?: boolean;
  order?: number;
};

export function AnnouncementForm({
  item,
  onCancel,
}: {
  item?: Fields;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const editing = Boolean(item?.id);
  const [imageUrl, setImageUrl] = useState(
    toAppMediaUrl(item?.imageUrl) || item?.imageUrl || "",
  );
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
      setMsg("Carregue uma imagem / cartaz primeiro.");
      return;
    }
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("imageUrl", imageUrl);
    if (item?.id) fd.set("id", item.id);
    try {
      const res = editing ? await updateAnnouncement(fd) : await createAnnouncement(fd);
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
          (editing ? "Actualização guardada." : "Actualização publicada."),
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
        <h2 className="font-display text-xl font-semibold">Nova actualização</h2>
      )}
      <input
        name="title"
        required
        defaultValue={item?.title || ""}
        placeholder="Título"
        className="w-full border border-border bg-white px-3 py-2 text-sm"
      />
      <textarea
        name="summary"
        required
        rows={3}
        defaultValue={item?.summary || ""}
        placeholder="Resumo curto (datas, local, o essencial)"
        className="w-full border border-border bg-white px-3 py-2 text-sm"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Tipo
          <select
            name="type"
            defaultValue={item?.type || "NOTICIA"}
            className="mt-1 w-full border border-border bg-white px-3 py-2"
          >
            {ANNOUNCEMENT_TYPES.map((t) => (
              <option key={t.code} value={t.code}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Ordem
          <input
            name="order"
            type="number"
            defaultValue={item?.order ?? 0}
            className="mt-1 w-full border border-border bg-white px-3 py-2"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="linkUrl"
          defaultValue={item?.linkUrl || ""}
          placeholder="Link (inscrição, evento, PDF…)"
          className="w-full border border-border bg-white px-3 py-2 text-sm"
        />
        <input
          name="linkLabel"
          defaultValue={item?.linkLabel || ""}
          placeholder="Texto do botão (ex.: Inscrever-se)"
          className="w-full border border-border bg-white px-3 py-2 text-sm"
        />
      </div>
      <div>
        <p className="mb-1 text-sm text-muted">Cartaz / imagem (JPG, PNG, WEBP — máx. 12 MB)</p>
        <input type="file" accept="image/*" onChange={onFileChange} disabled={uploading} />
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="mt-2 max-h-40 w-auto border border-border object-contain"
          />
        )}
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="featured" defaultChecked={item?.featured ?? false} />
          Destaque na homepage
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="published" defaultChecked={item?.published ?? true} />
          Publicado
        </label>
      </div>
      {msg && (
        <p className={`text-sm ${status === "error" ? "text-red-600" : "text-primary"}`}>{msg}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" disabled={uploading || !imageUrl} type="submit">
          {uploading
            ? "A carregar…"
            : editing
              ? "Guardar alterações"
              : "Publicar actualização"}
        </button>
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
