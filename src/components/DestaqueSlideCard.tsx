"use client";

import { useState } from "react";
import Image from "next/image";
import { FormWithFeedback } from "@/components/FormWithFeedback";
import { SlideUploadForm } from "@/components/SlideUploadForm";
import { deleteHeroSlide } from "@/app/admin/actions";

type Slide = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  order: number;
  published: boolean;
};

export function DestaqueSlideCard({ slide }: { slide: Slide }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="card-surface p-4">
      <div className="flex gap-4">
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-primary-soft">
          <Image src={slide.imageUrl} alt={slide.title} fill className="object-cover" unoptimized />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{slide.title}</p>
          {slide.subtitle && <p className="mt-1 text-sm text-muted">{slide.subtitle}</p>}
          <p className="mt-1 text-xs text-primary">
            Ordem {slide.order}
            {!slide.published ? " · rascunho" : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <button
            type="button"
            className="btn-ghost !py-2 text-sm"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? "Fechar" : "Editar"}
          </button>
          <FormWithFeedback action={deleteHeroSlide} successMessage="Slide removido.">
            <input type="hidden" name="id" value={slide.id} />
            <button className="btn-ghost !py-2 text-sm text-red-700">Remover</button>
          </FormWithFeedback>
        </div>
      </div>
      {editing && (
        <SlideUploadForm slide={slide} onCancel={() => setEditing(false)} />
      )}
    </div>
  );
}
