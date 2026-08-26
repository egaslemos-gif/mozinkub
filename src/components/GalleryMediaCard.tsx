"use client";

import { isGalleryVideo } from "@/lib/gallery";
import { toAppMediaUrl } from "@/lib/media-url";

type Props = {
  url: string;
  type?: string | null;
  title?: string | null;
  description?: string | null;
  albumTitle?: string;
};

/** Cartão público: legenda sempre visível + info ao hover/focus. */
export function GalleryMediaCard({ url, type, title, description, albumTitle }: Props) {
  const mediaSrc = toAppMediaUrl(url);
  const video = isGalleryVideo(mediaSrc || url, type);
  const caption = title?.trim() || null;
  const detail = description?.trim() || null;
  const hoverText = detail || caption || albumTitle || "Registo da incubadora";

  return (
    <figure className="group relative overflow-hidden rounded-2xl border border-border bg-white shadow-[0_1px_0_rgba(20,40,30,0.04)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#e8f0ea]">
        {video ? (
          <video
            src={mediaSrc}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            muted
            playsInline
            preload="metadata"
            controls={false}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaSrc}
            alt={caption || albumTitle || "Fotografia da galeria"}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        )}

        <div
          className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/75 via-black/25 to-transparent px-4 pb-4 pt-16 opacity-0 transition duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
          aria-hidden={!detail && !caption}
        >
          {video && (
            <span className="mb-2 w-fit rounded bg-white/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase backdrop-blur-sm">
              Vídeo
            </span>
          )}
          {caption && (
            <p className="text-sm font-semibold leading-snug text-white">{caption}</p>
          )}
          <p className="mt-1 text-xs leading-relaxed text-white/90">{hoverText}</p>
        </div>
      </div>

      <figcaption className="space-y-1 px-3 py-3">
        <p className="text-sm font-medium text-[#1a2e22]">
          {caption || (video ? "Vídeo" : "Fotografia")}
        </p>
        {detail && <p className="text-xs leading-relaxed text-muted line-clamp-2">{detail}</p>}
        {!detail && albumTitle && (
          <p className="text-xs text-muted">{albumTitle}</p>
        )}
      </figcaption>
    </figure>
  );
}
