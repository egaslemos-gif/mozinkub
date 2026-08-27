"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteAnnouncement } from "@/app/admin/actions";
import { announcementTypeLabel } from "@/lib/announcements";
import { FormWithFeedback } from "@/components/FormWithFeedback";
import { AnnouncementForm } from "@/components/AnnouncementForm";
import { toAppMediaUrl } from "@/lib/media-url";

type Item = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  type: string;
  imageUrl: string;
  linkUrl: string | null;
  linkLabel: string | null;
  featured: boolean;
  published: boolean;
  acceptRegistrations: boolean;
  registrationEmail: string | null;
  registrationClosesAt: string | Date | null;
  order: number;
  _count?: { applications: number };
};

export function AnnouncementAdminCard({ item }: { item: Item }) {
  const [editing, setEditing] = useState(false);
  const src = toAppMediaUrl(item.imageUrl) || item.imageUrl;
  const apps = item._count?.applications ?? 0;

  return (
    <div className="card-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={item.title}
          className="h-28 w-full object-contain bg-[#eef3f0] sm:h-24 sm:w-36 sm:shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">
            {announcementTypeLabel(item.type)}
            {item.featured ? " · Destaque" : ""}
            {!item.published ? " · Rascunho" : ""}
            {item.acceptRegistrations ? " · Inscrições abertas" : ""}
          </p>
          <p className="font-semibold">{item.title}</p>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{item.summary}</p>
          <p className="mt-1 text-xs text-muted">
            Ordem {item.order}
            {apps > 0 ? ` · ${apps} inscrição(ões)` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href={`/actualizacoes/${item.slug}`}
              className="btn-ghost !py-1 text-sm"
              target="_blank"
            >
              Ver página
            </Link>
            <button
              type="button"
              className="btn-ghost !py-1 text-sm"
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? "Fechar" : "Editar"}
            </button>
            <FormWithFeedback
              action={deleteAnnouncement}
              successMessage="Actualização removida."
            >
              <input type="hidden" name="id" value={item.id} />
              <button type="submit" className="btn-ghost !py-1 text-sm text-red-700">
                Remover
              </button>
            </FormWithFeedback>
          </div>
        </div>
      </div>
      {editing && (
        <AnnouncementForm item={item} onCancel={() => setEditing(false)} />
      )}
    </div>
  );
}
