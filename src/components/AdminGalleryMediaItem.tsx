"use client";

import { useState } from "react";
import { FormWithFeedback } from "@/components/FormWithFeedback";
import { GalleryMediaForm } from "@/components/GalleryMediaForm";
import { deleteGalleryMedia } from "@/app/admin/actions";
import { isGalleryVideo } from "@/lib/gallery";

type Media = {
  id: string;
  title: string | null;
  description: string | null;
  url: string;
  type: string;
};

export function AdminGalleryMediaItem({
  albumId,
  media,
}: {
  albumId: string;
  media: Media;
}) {
  const [editing, setEditing] = useState(false);
  const video = isGalleryVideo(media.url, media.type);

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {video ? (
        <video src={media.url} className="h-28 w-full object-cover" muted playsInline preload="metadata" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={media.url} alt={media.title || ""} className="h-28 w-full object-cover" />
      )}
      <div className="space-y-1 p-2">
        <p className="text-[11px] font-semibold leading-snug text-[#1a2e22]">
          {media.title || (video ? "Vídeo sem legenda" : "Foto sem legenda")}
        </p>
        {media.description ? (
          <p className="line-clamp-2 text-[10px] text-muted">{media.description}</p>
        ) : (
          <p className="text-[10px] text-amber-700">Sem info de hover</p>
        )}
        <div className="flex items-center justify-between gap-1 pt-1">
          <button
            type="button"
            className="text-[10px] font-semibold text-primary"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? "Fechar" : "Editar"}
          </button>
          <FormWithFeedback action={deleteGalleryMedia} successMessage="Média removida.">
            <input type="hidden" name="id" value={media.id} />
            <button className="text-[10px] font-semibold text-red-700">Remover</button>
          </FormWithFeedback>
        </div>
        {editing && (
          <GalleryMediaForm
            albumId={albumId}
            media={media}
            onDone={() => setEditing(false)}
          />
        )}
      </div>
    </div>
  );
}
